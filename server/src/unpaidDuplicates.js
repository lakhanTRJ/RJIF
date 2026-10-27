import { normalizeMobile } from './subscriberRules.js';

const conflict = (message) => Object.assign(new Error(message), { status: 409 });
export function sameRegistrant(first, second) {
  const email = (v) =>
    String(v || '')
      .trim()
      .toLowerCase();
  const phone = (row) => normalizeMobile(row.phone || row.mobile);
  return Boolean(
    (email(first.email) && email(first.email) === email(second.email)) ||
      (phone(first) && phone(first) === phone(second)),
  );
}
export function assertUnpaid(row) {
  if (!row) throw Object.assign(new Error('Entry not found.'), { status: 404 });
  if (
    !['pending', 'payment_pending', 'payment_created', 'failed', 'cancelled'].includes(row.status) ||
    row.paid_at ||
    row.provider_payment_id
  )
    throw conflict('Paid entries cannot be deleted. The paid registration must be kept.');
}
// Caller owns transaction. Records remain available for reconciliation and late webhooks.
export async function archiveUnpaidDuplicate(
  db,
  kind,
  id,
  replacementId,
  adminId,
  verifyGateway = async (order) => {
    if (order.provider_order_id)
      throw conflict('Payment status must be checked before deleting a gateway order.');
  },
) {
  if (
    !['registrations', 'awards'].includes(kind) ||
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !Number.isSafeInteger(replacementId) ||
    replacementId < 1 ||
    id === replacementId
  )
    throw Object.assign(new Error('Choose a different paid replacement entry.'), { status: 422 });
  if (kind === 'registrations') {
    const [[target]] = await db.execute('SELECT * FROM commerce_orders WHERE id=? FOR UPDATE', [id]);
    assertUnpaid(target);
    const [[paid]] = await db.execute('SELECT * FROM commerce_orders WHERE id=? FOR UPDATE', [replacementId]);
    if (
      !paid ||
      paid.status !== 'paid' ||
      paid.archived_at ||
      Number(paid.product_id) !== Number(target.product_id) ||
      !sameRegistrant(target, paid)
    )
      throw conflict('Select the paid entry for the same person and pass/product. No records were changed.');
    const [[pass]] = await db.execute('SELECT id FROM digital_passes WHERE order_id=? LIMIT 1', [id]);
    if (pass) throw conflict('This entry has issued passes and cannot be deleted.');
    await verifyGateway(target);
    await db.execute('UPDATE commerce_orders SET archived_at=NOW(),duplicate_of_order_id=? WHERE id=?', [
      paid.id,
      id,
    ]);
  } else {
    const [[target]] = await db.execute('SELECT * FROM award_applications WHERE id=? FOR UPDATE', [id]);
    assertUnpaid(target);
    const [[paid]] = await db.execute('SELECT * FROM award_applications WHERE id=? FOR UPDATE', [
      replacementId,
    ]);
    if (
      !paid ||
      paid.status !== 'paid' ||
      paid.archived_at ||
      Number(paid.event_year) !== Number(target.event_year) ||
      !sameRegistrant(target, paid)
    )
      throw conflict(
        'Select the paid awards application for the same person and event year. No records were changed.',
      );
    const [orders] = await db.execute(
      'SELECT * FROM commerce_orders WHERE award_application_id=? FOR UPDATE',
      [id],
    );
    for (const order of orders) {
      assertUnpaid(order);
      const [[pass]] = await db.execute('SELECT id FROM digital_passes WHERE order_id=? LIMIT 1', [order.id]);
      if (pass) throw conflict('This application has issued passes and cannot be deleted.');
      await verifyGateway(order);
    }
    await db.execute(
      'UPDATE award_applications SET archived_at=NOW(),duplicate_of_application_id=? WHERE id=?',
      [paid.id, id],
    );
    await db.execute('UPDATE commerce_orders SET archived_at=NOW() WHERE award_application_id=?', [id]);
  }
  await db.execute(
    'INSERT INTO admin_audit_log (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?)',
    [
      adminId,
      'archive_unpaid_duplicate',
      kind,
      String(id),
      JSON.stringify({ paid_replacement_id: replacementId }),
    ],
  );
}

export async function assertGatewayUnpaid(order, settings, fetchImpl = fetch) {
  if (!order.provider_order_id) return;
  const unavailable = () =>
    Object.assign(
      new Error(
        'Unable to verify Razorpay payment status. Nothing was deleted. Try again later or reconcile the payment first.',
      ),
      { status: 503 },
    );
  if (!settings.keyId || !settings.keySecret) throw unavailable();
  const get = async (suffix) => {
    try {
      const response = await fetchImpl(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(order.provider_order_id)}${suffix}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${settings.keyId}:${settings.keySecret}`).toString('base64')}`,
          },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!response.ok) throw unavailable();
      return await response.json();
    } catch {
      throw unavailable();
    }
  };
  const gateway = await get('');
  if (
    gateway.id !== order.provider_order_id ||
    !['created', 'attempted', 'paid'].includes(gateway.status) ||
    gateway.amount_paid === null ||
    gateway.amount_paid === undefined ||
    !Number.isFinite(Number(gateway.amount_paid))
  )
    throw unavailable();
  if (gateway.status === 'paid' || Number(gateway.amount_paid) > 0)
    throw conflict(
      'Razorpay reports a payment against this order. Reconcile it first; it cannot be deleted as unpaid.',
    );
  const payments = await get('/payments?count=100');
  if (!Array.isArray(payments.items) || payments.items.length >= 100) throw unavailable();
  if (payments.items.some((p) => !['created', 'failed'].includes(p.status)))
    throw conflict(
      'Razorpay reports an authorised, captured or other payment requiring review. This entry cannot be deleted as unpaid.',
    );
}

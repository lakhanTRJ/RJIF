import crypto from 'node:crypto';

export async function regenerateComplimentaryLink(connection, id, adminId) {
  const [[product]] = await connection.execute('SELECT * FROM commerce_products WHERE id=? FOR UPDATE', [id]);
  const fail = (message, status = 422) => {
    throw Object.assign(new Error(message), { status });
  };
  if (!product) fail('Pass not found', 404);
  if (product.kind !== 'delegate_pass' || Number(product.sale_price_paise) !== 0)
    fail('Only complimentary delegate passes have invitation links.');
  if (!product.is_active) fail('Enable and save this pass before regenerating its link.');
  if (product.expires_at && new Date(product.expires_at) <= new Date())
    fail('Update and save the expiry before regenerating this link.');
  if (
    product.redemption_limit !== null &&
    Number(product.redemption_count) >= Number(product.redemption_limit)
  )
    fail('This allocation is exhausted. Increase and save its limit before generating another link.');
  const secret = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(secret).digest('hex');
  await connection.execute('UPDATE commerce_products SET complimentary_token_hash=? WHERE id=?', [
    hash,
    product.id,
  ]);
  await connection.execute(
    'INSERT INTO admin_audit_log (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?)',
    [
      adminId,
      'regenerate_link',
      'complimentary_product',
      String(product.id),
      JSON.stringify({ code: product.code }),
    ],
  );
  return {
    checkoutUrl: `/checkout/?pass=${encodeURIComponent(product.code)}&complimentary=${encodeURIComponent(secret)}`,
  };
}

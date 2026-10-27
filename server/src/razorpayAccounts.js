import crypto from 'node:crypto';

export function razorpayAccounts(config) {
  return [config.razorpay, config.razorpayLegacy].filter((account) => account?.keyId && account?.keySecret);
}
export function razorpayForOrder(order, config) {
  const id = order.razorpay_key_id || config.razorpayLegacy?.keyId || config.razorpay.keyId;
  const account = razorpayAccounts(config).find((candidate) => candidate.keyId === id);
  if (!account)
    throw Object.assign(
      new Error(
        'The payment account for this existing order is unavailable. Contact the organiser; do not create a duplicate payment.',
      ),
      { status: 503 },
    );
  return account;
}
export function validRazorpaySignature(secret, payload, signature) {
  if (!secret || !payload || !/^[0-9a-f]{64}$/i.test(signature || '')) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), expected);
}
export function razorpayWebhookAccount(rawBody, signature, config) {
  const matches = razorpayAccounts(config).filter((account) =>
    validRazorpaySignature(account.webhookSecret, rawBody, signature),
  );
  return matches.length === 1 ? matches[0] : null;
}

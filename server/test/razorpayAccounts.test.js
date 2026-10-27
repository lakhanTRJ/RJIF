import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { razorpayForOrder, razorpayWebhookAccount, validRazorpaySignature } from '../src/razorpayAccounts.js';

const current = { keyId: 'rzp_live_new', keySecret: 'new-api-secret', webhookSecret: 'new-hook-secret' };
const legacy = { keyId: 'rzp_live_old', keySecret: 'old-api-secret', webhookSecret: 'old-hook-secret' };
const config = { razorpay: current, razorpayLegacy: legacy };
const sign = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');
test('account binding keeps old orders on the old account and new orders on the new account', () => {
  assert.equal(razorpayForOrder({ razorpay_key_id: legacy.keyId }, config), legacy);
  assert.equal(razorpayForOrder({ razorpay_key_id: current.keyId }, config), current);
  assert.equal(razorpayForOrder({}, config), legacy);
  assert.equal(razorpayForOrder({}, { razorpay: current }), current);
  assert.throws(() => razorpayForOrder({ razorpay_key_id: 'unknown' }, config), { status: 503 });
  assert.throws(() => razorpayForOrder({ razorpay_key_id: legacy.keyId }, { razorpay: current }), {
    status: 503,
  });
});
test('checkout signatures use only the bound account secret', () => {
  const payload = 'order_old|pay_old';
  const signature = sign(legacy.keySecret, payload);
  assert.equal(validRazorpaySignature(legacy.keySecret, payload, signature), true);
  assert.equal(validRazorpaySignature(current.keySecret, payload, signature), false);
  assert.equal(validRazorpaySignature(legacy.keySecret, payload, signature + 'x'), false);
  assert.equal(validRazorpaySignature(legacy.keySecret, 'tampered', signature), false);
});
test('both webhook accounts validate separately; ambiguous or mismatched secrets are rejected', () => {
  const raw = Buffer.from('{"event":"payment.captured"}');
  for (const account of [current, legacy])
    assert.equal(razorpayWebhookAccount(raw, sign(account.webhookSecret, raw), config), account);
  assert.equal(razorpayWebhookAccount(raw, 'invalid', config), null);
  assert.equal(razorpayWebhookAccount(raw, sign(legacy.webhookSecret, raw), { razorpay: current }), null);
  assert.equal(
    razorpayWebhookAccount(raw, sign(current.webhookSecret, raw), {
      razorpay: current,
      razorpayLegacy: { ...legacy, webhookSecret: current.webhookSecret },
    }),
    null,
  );
  assert.equal(razorpayWebhookAccount(null, 'invalid', config), null);
});

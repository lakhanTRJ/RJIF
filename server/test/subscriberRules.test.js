import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMobile,
  normalizeSubscriberContact,
  subscriberActive,
  subscriberMatches,
  privateHash,
  validateSubscriber,
  subscriberDiscount,
} from '../src/subscriberRules.js';
import { awardPricing } from '../../client/src/awardPricing.js';
const secret = 'test-secret';
const row = {
  id: 1,
  full_name: 'Subscriber',
  company: 'Jeweller',
  mobile: '+919876543210',
  email: 'subscriber@example.com',
  is_active: 1,
  valid_until: '2099-01-01',
};
test('subscriber contacts normalize Indian mobiles and optional emails', () => {
  for (const n of ['9876543210', '919876543210', '+91 98765 43210', '00919876543210'])
    assert.equal(normalizeMobile(n), row.mobile);
  assert.equal(normalizeMobile('invalid'), '');
  assert.equal(normalizeSubscriberContact('email', ' Subscriber@Example.COM '), row.email);
  assert.equal(normalizeSubscriberContact('sms', row.mobile), '');
  assert.equal(validateSubscriber({ ...row, email: '' }).email, null);
  assert.throws(() => validateSubscriber({ ...row, mobile: '' }));
  assert.throws(() => validateSubscriber({ ...row, valid_until: '2027-02-30' }));
});
test('subscriber eligibility checks active status, expiry and verified contact ownership', () => {
  assert.equal(subscriberActive(row), true);
  assert.equal(subscriberActive({ ...row, is_active: 0 }), false);
  assert.equal(subscriberActive({ ...row, valid_until: '2020-01-01' }), false);
  assert.equal(
    subscriberActive({ ...row, valid_until: '2026-10-26' }, new Date('2026-10-26T18:31:00Z')),
    false,
  );
  const hash = privateHash(secret, `whatsapp:${row.mobile}`);
  assert.equal(subscriberMatches(row, 'whatsapp', hash, { mobile: '9876543210' }, secret), true);
  assert.equal(subscriberMatches(row, 'whatsapp', hash, { mobile: '9876543211' }, secret), false);
  assert.equal(subscriberMatches(row, 'whatsapp', 'forged', { mobile: row.mobile }, secret), false);
});
test('checkout revalidates subscribers and always uses server-owned 50% pricing', async () => {
  const application = {
    subscriber_id: 1,
    subscriber_channel: 'email',
    subscriber_contact_hash: privateHash(secret, `email:${row.email}`),
    email: row.email,
    discount_percent: 100,
  };
  const executor = (subscriber) => ({ execute: async () => [[subscriber].filter(Boolean)] });
  const percent = await subscriberDiscount(executor(row), application, secret);
  assert.equal(percent, 50);
  assert.deepEqual(awardPricing(5000000, 18, percent), {
    base: 5000000,
    discountPercent: 50,
    discount: 2500000,
    subtotal: 2500000,
    tax: 450000,
    total: 2950000,
  });
  assert.equal(await subscriberDiscount(executor(row), { discount_percent: 50 }, secret), 0);
  for (const subscriber of [
    null,
    { ...row, is_active: 0 },
    { ...row, email: 'changed@example.com' },
    { ...row, valid_until: '2020-01-01' },
  ])
    await assert.rejects(() => subscriberDiscount(executor(subscriber), application, secret));
});

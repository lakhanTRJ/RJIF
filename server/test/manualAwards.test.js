import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManualAward, awardConfirmation } from '../src/manualAwards.js';
import { awardPricing } from '../../client/src/awardPricing.js';

const product = { kind: 'award_fee', is_active: 1, currency: 'INR', sale_price_paise: 1000000, tax_rate: 18 };
const valid = () => ({
  categories: ['Marketing', 'Digital'],
  full_name: 'Applicant',
  company: 'Jeweller',
  mobile: '9999999999',
  email: 'team@example.com',
  coordinator_name: 'Coordinator',
  coordinator_number: '9999999999',
  city: 'Mumbai',
  state: 'Maharashtra',
  billing_address: 'Business address',
  discount_percent: 10,
  discount_reason: 'Approved partner discount',
  payment_method: 'neft',
  payment_reference: 'UTR123',
  paid_at: new Date().toISOString(),
  amount_received: '10620.00',
  confirmed: true,
});
test('offline awards apply one registration fee, discount before GST and multiple categories', () => {
  const data = validateManualAward(valid(), product, ['Marketing', 'Digital']);
  assert.deepEqual(data.pricing, {
    base: 1000000,
    discountPercent: 10,
    discount: 100000,
    subtotal: 900000,
    tax: 162000,
    total: 1062000,
  });
  assert.equal(data.categories.length, 2);
  assert.equal(awardPricing(1000000, 18, 0).total, 1180000);
  assert.equal(awardPricing(101, 18, 12.5).total, 104);
});
test('offline awards reject invalid discounts and tampered received totals', () => {
  for (const discount_percent of [-1, 100, 150, 'NaN', 'Infinity', 10.123])
    assert.throws(() =>
      validateManualAward({ ...valid(), discount_percent }, product, ['Marketing', 'Digital']),
    );
  for (const patch of [
    { amount_received: '10000' },
    { amount_received: '10620.001' },
    { discount_reason: '' },
    { confirmed: false },
    { payment_reference: '' },
    { payment_method: 'credit' },
    { paid_at: 'invalid' },
    { email: 'invalid' },
    { categories: [] },
    { categories: ['Unknown'] },
  ])
    assert.throws(() => validateManualAward({ ...valid(), ...patch }, product, ['Marketing', 'Digital']));
  assert.throws(() =>
    validateManualAward(valid(), { ...product, kind: 'delegate_pass' }, ['Marketing', 'Digital']),
  );
});
test('award confirmation contains selected categories and does not issue a delegate pass', () => {
  const email = awardConfirmation(
    { full_name: 'Applicant', public_id: 'reference', categories: ['Marketing', 'Digital'] },
    1062000,
  );
  assert.match(email.text, /INR 10620.00/);
  assert.match(email.text, /Marketing/);
  assert.match(email.text, /not a delegate QR pass/);
});

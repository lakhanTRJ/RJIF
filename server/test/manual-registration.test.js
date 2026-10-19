import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManualRegistration } from '../src/manualRegistration.js';

const product = {
  kind: 'delegate_pass',
  is_active: 1,
  sale_price_paise: 750000,
  member_count: 1,
  tax_rate: 18,
};
const body = () => ({
  quantity: 1,
  payment_method: 'neft',
  payment_reference: 'UTR123',
  paid_at: new Date().toISOString(),
  customer_name: 'A Person',
  company: 'Company',
  email: 'a@example.com',
  phone: '9000000000',
  billing_address: 'Mumbai',
  amount_received: '8850',
  attendees: [{ full_name: 'A Person', email: 'a@example.com', phone: '9000000000' }],
  confirmed: true,
});
test('manual payments calculate the full price on the server and require the received amount', () => {
  assert.equal(validateManualRegistration(body(), product).total, 885000);
  assert.throws(
    () => validateManualRegistration({ ...body(), amount_received: '7500' }, product),
    /full total/,
  );
});
test('manual registrations require every attendee, confirmed funds and a valid paid delegate product', () => {
  assert.throws(() => validateManualRegistration({ ...body(), attendees: [] }, product), /attendee details/);
  assert.throws(() => validateManualRegistration({ ...body(), confirmed: false }, product), /Confirm/);
  assert.throws(() => validateManualRegistration(body(), { ...product, kind: 'award_fee' }), /delegate pass/);
  assert.throws(() => validateManualRegistration({ ...body(), quantity: 1.5 }, product), /Quantity/);
  assert.throws(() => validateManualRegistration({ ...body(), payment_reference: '' }, product), /reference/);
});

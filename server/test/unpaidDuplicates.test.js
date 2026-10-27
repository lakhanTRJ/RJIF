import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sameRegistrant,
  assertUnpaid,
  archiveUnpaidDuplicate,
  assertGatewayUnpaid,
} from '../src/unpaidDuplicates.js';

test('duplicate cleanup matches registered contacts and never accepts paid entries', () => {
  assert.equal(sameRegistrant({ email: ' Person@Example.com ' }, { email: 'person@example.com' }), true);
  assert.equal(sameRegistrant({ mobile: '9876543210' }, { phone: '+919876543210' }), true);
  assert.equal(sameRegistrant({ email: 'a@example.com' }, { email: 'b@example.com' }), false);
  for (const row of [
    { status: 'paid' },
    { status: 'payment_created', paid_at: new Date() },
    { status: 'pending', provider_payment_id: 'pay_1' },
  ])
    assert.throws(() => assertUnpaid(row), { status: 409 });
});

function fakeDb({ paidTarget = false, hasPass = false, unrelated = false, paidLinked = false } = {}) {
  const writes = [];
  return {
    writes,
    execute: async (sql, args) => {
      if (sql.startsWith('SELECT * FROM commerce_orders WHERE id='))
        return [
          [
            {
              id: args[0],
              product_id: 4,
              status: args[0] === 2 || paidTarget ? 'paid' : 'payment_created',
              email: args[0] === 2 && unrelated ? 'other@example.com' : 'test@example.com',
            },
          ],
        ];
      if (sql.startsWith('SELECT * FROM award_applications'))
        return [
          [
            {
              id: args[0],
              status: args[0] === 2 ? 'paid' : 'payment_pending',
              event_year: 2027,
              email: 'test@example.com',
            },
          ],
        ];
      if (sql.startsWith('SELECT * FROM commerce_orders WHERE award_application_id='))
        return [[{ id: 3, status: paidLinked ? 'paid' : 'payment_created' }]];
      if (sql.startsWith('SELECT id FROM digital_passes')) return [hasPass ? [{ id: 99 }] : []];
      writes.push({ sql, args });
      return [{ affectedRows: 1 }];
    },
  };
}
test('only the unpaid duplicate is archived and audit names the paid replacement', async () => {
  const db = fakeDb();
  let checked = 0;
  await archiveUnpaidDuplicate(db, 'registrations', 1, 2, 7, async () => {
    checked++;
  });
  assert.equal(checked, 1);
  assert.equal(db.writes.length, 2);
  assert.match(db.writes[0].sql, /UPDATE commerce_orders SET archived_at/);
  assert.deepEqual(db.writes[0].args, [2, 1]);
  assert.equal(db.writes[1].args[0], 7);
  for (const settings of [{ paidTarget: true }, { hasPass: true }, { unrelated: true }]) {
    const rejected = fakeDb(settings);
    await assert.rejects(() => archiveUnpaidDuplicate(rejected, 'registrations', 1, 2, 7), { status: 409 });
    assert.equal(rejected.writes.length, 0);
  }
  const providerFailure = fakeDb();
  await assert.rejects(() =>
    archiveUnpaidDuplicate(providerFailure, 'registrations', 1, 2, 7, async () => {
      throw new Error('gateway unavailable');
    }),
  );
  assert.equal(providerFailure.writes.length, 0);
});
test('awards archive their unpaid orders but refuse any linked paid order', async () => {
  const db = fakeDb();
  await archiveUnpaidDuplicate(db, 'awards', 1, 2, 7, async () => {});
  assert.equal(db.writes.length, 3);
  const paid = fakeDb({ paidLinked: true });
  await assert.rejects(() => archiveUnpaidDuplicate(paid, 'awards', 1, 2, 7), { status: 409 });
  assert.equal(paid.writes.length, 0);
});
test('Razorpay reconciliation is read-only and fails closed for paid, authorised and unavailable payments', async () => {
  const order = { provider_order_id: 'order_test' },
    settings = { keyId: 'test', keySecret: 'private-test-only' };
  const mock =
    (status = 'created', items = []) =>
    async (url, options) => {
      assert.equal(options.method, undefined);
      return {
        ok: true,
        json: async () =>
          url.includes('/payments')
            ? { items }
            : { id: 'order_test', status, amount_paid: status === 'paid' ? 100 : 0 },
      };
    };
  await assertGatewayUnpaid(order, settings, mock());
  await assert.rejects(() => assertGatewayUnpaid(order, settings, mock('paid')), { status: 409 });
  await assert.rejects(
    () => assertGatewayUnpaid(order, settings, mock('attempted', [{ status: 'authorized' }])),
    { status: 409 },
  );
  await assert.rejects(
    () =>
      assertGatewayUnpaid(order, settings, async () => {
        throw new Error('secret response');
      }),
    { status: 503 },
  );
});

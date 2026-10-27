import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveSubscriberBenefit, currentAwardYear } from '../src/subscriberCompanies.js';
import { subscriberImportRows, checkWorkbookSize } from '../src/subscriberImport.js';
import { validateSubscriber, subscriberMatches, privateHash } from '../src/subscriberRules.js';

test('both subscriber mobiles verify the same company; invalid secondary numbers are rejected', () => {
  const row = validateSubscriber({
    full_name: 'Person',
    company: 'Company',
    mobile: '9876543210',
    mobile2: '9876543211',
    valid_until: '2099-01-01',
  });
  for (const mobile of [row.mobile, row.mobile2])
    assert.equal(
      subscriberMatches(row, 'whatsapp', privateHash('secret', `whatsapp:${mobile}`), { mobile }, 'secret'),
      true,
    );
  assert.throws(() => validateSubscriber({ ...row, mobile2: '22' }));
  assert.throws(() => validateSubscriber({ ...row, mobile2: row.mobile }));
});

test('same company may resume one application but cannot claim twice per edition; next year is independent', async () => {
  const claims = new Map();
  const db = {
    execute: async (sql, args) => {
      if (sql.startsWith('SELECT company_id')) return [[{ company_id: 9 }]];
      const key = `${args[0]}:${args[1]}`;
      if (sql.startsWith('INSERT IGNORE')) {
        if (!claims.has(key)) claims.set(key, args[2]);
        return [{}];
      }
      return [[{ application_id: claims.get(key) }]];
    },
  };
  await reserveSubscriberBenefit(db, 1, 2027, 10);
  await reserveSubscriberBenefit(db, 1, 2027, 10);
  await assert.rejects(() => reserveSubscriberBenefit(db, 2, 2027, 11), { status: 409 });
  await reserveSubscriberBenefit(db, 2, 2028, 11);
  assert.equal(claims.size, 2);
  assert.equal(await currentAwardYear({ execute: async () => [[{ content: '{"eventYear":2028}' }]] }), 2028);
});

test('Excel preview preserves optional fields, flags all duplicate contacts and rejects multiple emails', () => {
  const headers = [null, 'Name', 'Company Name', 'Mobile 1', 'Mobile 2', 'Email', 'Eligibility'];
  const rows = subscriberImportRows([
    headers,
    [null, 'Person A', 'Company A', 9876543210, 9876543211, null, new Date('2027-01-07T00:00:00Z')],
    [null, 'Person B', 'Company B', 9876543212, null, 'a@example.com; b@example.com', null],
    [null, 'Person C', 'Company C', 9876543211, null, null, null],
    [null, 'Person D', 'Company D', 9876543213, 22, null, null],
    [null, 'Person E', 'Company E', 9876543214, null, null, null],
  ]);
  assert.match(rows[0].error, /duplicate/);
  assert.match(rows[2].error, /duplicate/);
  assert.ok(rows[1].error);
  assert.ok(rows[3].error);
  assert.equal(rows[0].record.valid_until, '2027-01-07');
  assert.equal(rows[4].error, '');
  assert.equal(rows[4].record.email, null);
  assert.equal(rows[4].record.is_active, 1);
  assert.throws(() => checkWorkbookSize(Buffer.from('not an xlsx')));
});

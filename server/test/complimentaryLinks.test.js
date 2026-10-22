import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { regenerateComplimentaryLink } from '../src/complimentaryLinks.js';

const valid = () => ({
  id: 12,
  kind: 'delegate_pass',
  code: 'guest-allocation',
  sale_price_paise: 0,
  is_active: 1,
  redemption_limit: 10,
  redemption_count: 3,
  expires_at: new Date(Date.now() + 86400000),
});
function connection(product) {
  const calls = [];
  return {
    calls,
    async execute(sql, values) {
      calls.push({ sql, values });
      return sql.startsWith('SELECT') ? [[product].filter(Boolean)] : [{ affectedRows: 1 }];
    },
  };
}
test('regenerating invitations rotates only the token hash and leaves issued passes and counts unchanged', async () => {
  const db = connection(valid());
  const first = await regenerateComplimentaryLink(db, 12, 1);
  const second = await regenerateComplimentaryLink(db, 12, 1);
  assert.notEqual(first.checkoutUrl, second.checkoutUrl);
  const url = new URL(first.checkoutUrl, 'https://example.com');
  assert.equal(url.searchParams.get('pass'), 'guest-allocation');
  const token = url.searchParams.get('complimentary');
  assert.equal(db.calls[1].values[0], crypto.createHash('sha256').update(token).digest('hex'));
  assert.match(db.calls[0].sql, /FOR UPDATE/);
  assert.doesNotMatch(
    db.calls.map((c) => c.sql).join('\n'),
    /UPDATE digital_passes|redemption_count\s*=|redemption_limit\s*=/,
  );
  assert.ok(!JSON.stringify(db.calls).includes(token));
  assert.equal(db.calls[2].values[0], 1);
});
test('regeneration rejects paid products, unavailable allocations and missing products without writes', async () => {
  for (const product of [
    null,
    { ...valid(), sale_price_paise: 100 },
    { ...valid(), kind: 'award_fee' },
    { ...valid(), is_active: 0 },
    { ...valid(), expires_at: new Date(0) },
    { ...valid(), redemption_count: 10 },
  ]) {
    const db = connection(product);
    await assert.rejects(() => regenerateComplimentaryLink(db, 12, 1));
    assert.equal(db.calls.length, 1);
  }
});

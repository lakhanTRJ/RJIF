import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';
import { razorpayForOrder } from '../src/razorpayAccounts.js';

if (
  config.env === 'production' ||
  config.db.database !== 'rjif_local' ||
  !['localhost', '127.0.0.1'].includes(config.db.host)
)
  throw new Error('Restricted to local rjif_local only.');
const dump = spawnSync(
  'C:/xampp/mysql/bin/mysqldump.exe',
  [
    '--host',
    config.db.host,
    '--port',
    String(config.db.port),
    '--user',
    config.db.user,
    '--single-transaction',
    '--no-tablespaces',
    config.db.database,
  ],
  { env: { ...process.env, MYSQL_PWD: config.db.password }, maxBuffer: 50 * 1024 * 1024 },
);
if (dump.status !== 0) throw new Error('Local backup failed; no migration applied.');
await fs.mkdir(new URL('../../backups/', import.meta.url), { recursive: true });
await fs.writeFile(
  new URL(`../../backups/before-account-binding-${Date.now()}.sql`, import.meta.url),
  dump.stdout,
);
const db = await mysql.createConnection({ ...config.db, multipleStatements: true });
try {
  const [[lock]] = await db.query("SELECT GET_LOCK('rjif_schema_migrations',60) AS acquired");
  assert.equal(Number(lock.acquired), 1);
  const migration = '021_razorpay_account_binding.sql';
  const [[applied]] = await db.execute('SELECT id FROM schema_migrations WHERE id=?', [migration]);
  if (!applied) {
    await db.query(
      await fs.readFile(new URL(`../../database/migrations/${migration}`, import.meta.url), 'utf8'),
    );
    await db.execute('INSERT INTO schema_migrations (id) VALUES (?)', [migration]);
    console.log(`Applied ${migration} locally after backup.`);
  }
  await db.query("SELECT RELEASE_LOCK('rjif_schema_migrations')");
  await db.beginTransaction();
  const [[product]] = await db.execute('SELECT id FROM commerce_products LIMIT 1');
  assert.ok(product);
  const source = await fs.readFile(new URL('../src/routes/public.js', import.meta.url), 'utf8');
  const sql = source.match(/`(INSERT INTO commerce_orders \(public_id,idempotency_key,[^`]+)`/)[1];
  const accounts = {
    razorpay: { keyId: 'rzp_live_new_test', keySecret: 'new-test', webhookSecret: 'new-hook-test' },
    razorpayLegacy: { keyId: 'rzp_live_old_test', keySecret: 'old-test', webhookSecret: 'old-hook-test' },
  };
  const orders = [];
  for (const key of [null, accounts.razorpay.keyId]) {
    const publicId = crypto.randomUUID();
    const [result] = await db.execute(sql, [
      publicId,
      crypto.createHash('sha256').update(publicId).digest('hex'),
      product.id,
      null,
      1,
      100,
      0,
      100,
      'INR',
      'Smoke',
      'Test',
      'account-smoke@example.invalid',
      '+15550000001',
      null,
      'Test',
      'pending',
      'test-policy',
      null,
      0,
      0,
      null,
      key,
    ]);
    orders.push(result.insertId);
  }
  await db.execute('UPDATE commerce_orders SET razorpay_key_id=? WHERE id=? AND razorpay_key_id IS NULL', [
    accounts.razorpayLegacy.keyId,
    orders[0],
  ]);
  const [rows] = await db.execute('SELECT * FROM commerce_orders WHERE id IN (?,?) ORDER BY id', orders);
  assert.equal(razorpayForOrder(rows[0], accounts).keyId, accounts.razorpayLegacy.keyId);
  assert.equal(razorpayForOrder(rows[1], accounts).keyId, accounts.razorpay.keyId);
  assert.equal(rows[0].status, 'pending');
  assert.equal(rows[1].total_paise, 100);
  await db.rollback();
  console.log(
    'Local SQL binding checks passed for the exact checkout INSERT, previous-account backfill and account-specific routing. Synthetic rows rolled back; no gateway requests sent.',
  );
} finally {
  await db.rollback().catch(() => {});
  await db.end();
}

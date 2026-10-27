import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';
import { archiveUnpaidDuplicate } from '../src/unpaidDuplicates.js';

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
  new URL(`../../backups/before-unpaid-archives-${Date.now()}.sql`, import.meta.url),
  dump.stdout,
);
const db = await mysql.createConnection({ ...config.db, multipleStatements: true });
try {
  const [[lock]] = await db.query("SELECT GET_LOCK('rjif_schema_migrations',60) AS acquired");
  assert.equal(Number(lock.acquired), 1);
  const migration = '020_unpaid_duplicate_archives.sql';
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
  const [[admin]] = await db.execute("SELECT id FROM admin_users WHERE role='administrator' LIMIT 1");
  const [[product]] = await db.execute('SELECT id FROM commerce_products LIMIT 1');
  assert.ok(admin && product, 'Local fixtures require an existing admin and product.');
  const applications = [];
  for (const status of ['payment_pending', 'paid']) {
    const [r] = await db.execute(
      "INSERT INTO award_applications (public_id,categories,full_name,company,mobile,email,coordinator_name,coordinator_number,city,state,event_year,status) VALUES (?,'[\"Test\"]','Test','Smoke test','+15550000001','archive-smoke@example.invalid','Test','+15550000001','Test','Test',2027,?)",
      [crypto.randomUUID(), status],
    );
    applications.push(r.insertId);
  }
  const orders = [];
  for (let i = 0; i < 2; i++) {
    const [r] = await db.execute(
      "INSERT INTO commerce_orders (public_id,product_id,award_application_id,quantity,subtotal_paise,tax_paise,total_paise,customer_name,company,email,phone,billing_address,status,consented_at,paid_at) VALUES (?,?,?,1,100,0,100,'Test','Smoke test','archive-smoke@example.invalid','+15550000001','Test',?,NOW(),?)",
      [
        crypto.randomUUID(),
        product.id,
        applications[i],
        i ? 'paid' : 'payment_created',
        i ? new Date() : null,
      ],
    );
    orders.push(r.insertId);
  }
  await archiveUnpaidDuplicate(db, 'registrations', orders[0], orders[1], admin.id);
  await archiveUnpaidDuplicate(db, 'awards', applications[0], applications[1], admin.id);
  const [rows] = await db.execute(
    'SELECT id,status,archived_at FROM commerce_orders WHERE id IN (?,?) ORDER BY id',
    orders,
  );
  assert.ok(rows[0].archived_at);
  assert.equal(rows[1].archived_at, null);
  assert.equal(rows[1].status, 'paid');
  await assert.rejects(() => archiveUnpaidDuplicate(db, 'registrations', orders[1], orders[0], admin.id), {
    status: 409,
  });
  await db.execute("UPDATE commerce_orders SET status='paid',archived_at=NULL WHERE id=?", [orders[0]]);
  const [[restored]] = await db.execute('SELECT archived_at FROM commerce_orders WHERE id=?', [orders[0]]);
  assert.equal(restored.archived_at, null);
  await db.rollback();
  console.log(
    'Local SQL archive checks passed. Paid replacement was preserved; synthetic orders, applications and audits were rolled back. No Razorpay requests or messages sent.',
  );
} finally {
  await db.rollback().catch(() => {});
  await db.end();
}

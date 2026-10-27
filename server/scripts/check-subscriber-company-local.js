// Local-only migration/transaction smoke check. Never sends messages or charges.
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';
import { saveSubscriber, reserveSubscriberBenefit } from '../src/subscriberCompanies.js';
import { validateSubscriber } from '../src/subscriberRules.js';

if (
  config.env === 'production' ||
  config.db.database !== 'rjif_local' ||
  !['localhost', '127.0.0.1'].includes(config.db.host)
)
  throw new Error('This smoke check is restricted to the local rjif_local database.');
const backupUrl = new URL(`../../backups/before-company-benefits-${Date.now()}.sql`, import.meta.url);
await fs.mkdir(new URL('../../backups/', import.meta.url), { recursive: true });
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
await fs.writeFile(backupUrl, dump.stdout);
const db = await mysql.createConnection({ ...config.db, multipleStatements: true });
try {
  const [[lock]] = await db.query("SELECT GET_LOCK('rjif_schema_migrations',60) AS acquired");
  assert.equal(Number(lock.acquired), 1);
  const migration = '019_subscriber_company_benefits.sql';
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
  const unique = crypto.randomUUID();
  const company = `Smoke company ${unique}`;
  const first = await saveSubscriber(
    db,
    validateSubscriber({
      full_name: 'Test',
      company,
      mobile: '+15550000001',
      mobile2: '+15550000002',
      valid_until: '2099-01-01',
    }),
  );
  const second = await saveSubscriber(
    db,
    validateSubscriber({ full_name: 'Test two', company: company.toUpperCase(), mobile: '+15550000003' }),
  );
  const [subscribers] = await db.execute('SELECT id,company_id FROM magazine_subscribers WHERE id IN (?,?)', [
    first,
    second,
  ]);
  assert.equal(subscribers[0].company_id, subscribers[1].company_id);
  await assert.rejects(
    () =>
      saveSubscriber(
        db,
        validateSubscriber({
          full_name: 'Collision',
          company: 'Other',
          mobile: '+15550000004',
          mobile2: '+15550000002',
        }),
      ),
    { code: 'ER_DUP_ENTRY' },
  );
  const applications = [];
  for (let i = 0; i < 2; i++) {
    const [result] = await db.execute(
      "INSERT INTO award_applications (public_id,categories,full_name,company,mobile,email,coordinator_name,coordinator_number,city,state,event_year) VALUES (?,?,'Test',?,'+15550000001','smoke@example.invalid','Test','+15550000001','Test','Test',2027)",
      [crypto.randomUUID(), '["Test category"]', company],
    );
    applications.push(result.insertId);
  }
  await reserveSubscriberBenefit(db, first, 2027, applications[0]);
  await reserveSubscriberBenefit(db, first, 2027, applications[0]);
  await assert.rejects(() => reserveSubscriberBenefit(db, second, 2027, applications[1]), { status: 409 });
  await reserveSubscriberBenefit(db, second, 2028, applications[1]);
  await db.rollback();
  console.log(
    'Local SQL checks passed: shared company, cross-field phone uniqueness, one benefit per year, next-year eligibility. All synthetic business records rolled back.',
  );
} finally {
  await db.rollback().catch(() => {});
  await db.end();
}

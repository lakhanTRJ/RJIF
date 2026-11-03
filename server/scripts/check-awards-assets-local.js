import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';
import { AWARDS_INTRO_IMAGE, AWARDS_GUIDELINES_PDF } from '../../client/src/awardsAssets.js';

if (
  config.env === 'production' ||
  config.db.database !== 'rjif_local' ||
  !['localhost', '127.0.0.1'].includes(config.db.host)
)
  throw new Error('Restricted to the local rjif_local database.');
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
if (dump.status !== 0) throw new Error('Local backup failed; nothing changed.');
await fs.mkdir(new URL('../../backups/', import.meta.url), { recursive: true });
await fs.writeFile(
  new URL(`../../backups/before-awards-assets-${Date.now()}.sql`, import.meta.url),
  dump.stdout,
);
const db = await mysql.createConnection({ ...config.db, multipleStatements: true });
const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);
const otherFields = (value) => {
  const copy = { ...value };
  delete copy.introImageUrl;
  delete copy.guidelinesUrl;
  return copy;
};
try {
  const [[lock]] = await db.query("SELECT GET_LOCK('rjif_schema_migrations',60) AS acquired");
  assert.equal(Number(lock.acquired), 1);
  const migration = '022_awards_2027_assets.sql';
  const [[applied]] = await db.execute('SELECT id FROM schema_migrations WHERE id=?', [migration]);
  if (!applied) {
    await db.beginTransaction();
    const [[before]] = await db.execute('SELECT content FROM award_settings WHERE id=1 FOR UPDATE');
    await db.query(
      await fs.readFile(new URL(`../../database/migrations/${migration}`, import.meta.url), 'utf8'),
    );
    const [[after]] = await db.execute('SELECT content FROM award_settings WHERE id=1');
    if (before) {
      assert.deepEqual(otherFields(parse(before.content)), otherFields(parse(after.content)));
      if (Number(parse(before.content).eventYear || 2027) === 2027) {
        assert.equal(parse(after.content).introImageUrl, AWARDS_INTRO_IMAGE);
        assert.equal(parse(after.content).guidelinesUrl, AWARDS_GUIDELINES_PDF);
      }
    }
    await db.execute('INSERT INTO schema_migrations (id) VALUES (?)', [migration]);
    await db.commit();
    console.log(
      'Migration 022 applied locally after backup. Other awards content preserved; no registrations or payments changed.',
    );
  }
} finally {
  await db.rollback().catch(() => {});
  await db.query("SELECT RELEASE_LOCK('rjif_schema_migrations')");
  await db.end();
}

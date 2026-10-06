import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database/migrations');
const connection = await mysql.createConnection({ ...config.db, multipleStatements: true });
try {
  const [[lock]] = await connection.query("SELECT GET_LOCK('rjif_schema_migrations',60) AS acquired");
  if (!lock.acquired) throw new Error('Could not acquire the database migration lock');
  await connection.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
  );
  const [applied] = await connection.query('SELECT id FROM schema_migrations');
  const completed = new Set(applied.map((row) => row.id));
  for (const file of (await fs.readdir(base)).filter((name) => name.endsWith('.sql')).sort()) {
    if (completed.has(file)) continue;
    const sql = await fs.readFile(path.join(base, file), 'utf8');
    // MySQL DDL commits implicitly. Migration files are forward-only and are
    // recorded only after every statement has completed successfully.
    await connection.query(sql);
    await connection.execute('INSERT INTO schema_migrations (id) VALUES (?)', [file]);
    console.log(`Applied ${file}`);
  }
} finally {
  await connection.query("SELECT RELEASE_LOCK('rjif_schema_migrations')").catch(() => {});
  await connection.end();
}

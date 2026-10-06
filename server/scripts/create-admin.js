import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import { query, pool } from '../src/db.js';

const emailArg = process.argv.find((value, index) => process.argv[index - 1] === '--email');
if (!emailArg) throw new Error('Usage: npm run create-admin -w server -- --email you@example.com');
const rl = createInterface({ input: stdin, output: stdout });
const password = await rl.question('New password (minimum 12 characters): ');
rl.close();
if (password.length < 12) throw new Error('Password must be at least 12 characters');
const hash = await bcrypt.hash(password, 12);
await query('INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role=VALUES(role), is_active=1', [emailArg.toLowerCase(), hash, 'administrator']);
await pool.end(); console.log(`Administrator ready: ${emailArg.toLowerCase()}`);


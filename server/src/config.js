import 'dotenv/config';
import path from 'node:path';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const sessionSecret = required('SESSION_SECRET');
function parseSigningKeys(value) {
  const entries = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const keys = {};
  for (const entry of entries) {
    const split = entry.indexOf(':');
    if (split > 0) keys[entry.slice(0, split)] = entry.slice(split + 1);
  }
  return Object.keys(keys).length ? keys : { dev: sessionSecret };
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  publicOrigin: process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  sessionSecret,
  passSigningKeys: parseSigningKeys(process.env.PASS_SIGNING_KEYS),
  activePassSigningKey: process.env.ACTIVE_PASS_SIGNING_KEY || (process.env.PASS_SIGNING_KEYS ? 'v1' : 'dev'),
  trustProxy: process.env.TRUST_PROXY === '1',
  stagingNoindex: process.env.STAGING_NOINDEX === 'true',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 6),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || '',
    notificationTo: process.env.FORM_NOTIFICATION_TO || '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    database: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  },
};

export function assertProductionConfig() {
  if (config.env !== 'production') return;
  const errors = [];
  const isPlaceholder = (value) => /replace|generate|change[-_ ]?me|example\.com/i.test(String(value || ''));
  if (config.sessionSecret.length < 32 || isPlaceholder(config.sessionSecret))
    errors.push('SESSION_SECRET must be a generated value containing at least 32 characters');
  if (!process.env.PASS_SIGNING_KEYS || !config.passSigningKeys[config.activePassSigningKey])
    errors.push('PASS_SIGNING_KEYS and ACTIVE_PASS_SIGNING_KEY must define a dedicated active signing key');
  else if (isPlaceholder(config.passSigningKeys[config.activePassSigningKey]))
    errors.push('The active pass signing key must not be a placeholder');
  if (!config.publicOrigin.startsWith('https://') || !config.clientOrigin.startsWith('https://'))
    errors.push('PUBLIC_ORIGIN and CLIENT_ORIGIN must use HTTPS');
  if (!config.trustProxy) errors.push('TRUST_PROXY must be enabled behind the production reverse proxy');
  if (
    !config.smtp.host ||
    !config.smtp.from ||
    !config.smtp.user ||
    !config.smtp.password ||
    [config.smtp.host, config.smtp.from, config.smtp.user, config.smtp.password].some(isPlaceholder)
  )
    errors.push('SMTP delivery credentials are required');
  if (
    !config.razorpay.keyId ||
    !config.razorpay.keySecret ||
    !config.razorpay.webhookSecret ||
    Object.values(config.razorpay).some((value) => String(value).includes('replace-me'))
  )
    errors.push('Complete Razorpay credentials are required');
  if (config.db.password.length < 16 || isPlaceholder(config.db.password))
    errors.push('DB_PASSWORD must be a generated value containing at least 16 characters');
  if (!path.isAbsolute(config.uploadDir)) errors.push('UPLOAD_DIR must be an absolute persistent path');
  if (errors.length) throw new Error(`Unsafe production configuration:\n- ${errors.join('\n- ')}`);
}

import { createApp } from './app.js';
import { assertProductionConfig, config } from './config.js';
import { pool } from './db.js';
import { startEmailWorker } from './emailWorker.js';

assertProductionConfig();
const server = createApp().listen(config.port, config.host, () =>
  console.log(`RJIF server listening on http://${config.host}:${config.port}`),
);
const stopEmailWorker = startEmailWorker();
const sessionCleanup = setInterval(
  async () => {
    try {
      await pool.query('DELETE FROM admin_sessions WHERE expires<UNIX_TIMESTAMP()');
      await pool.query('DELETE FROM account_access_tokens WHERE expires_at<NOW()');
    } catch (error) {
      console.error('Temporary-token cleanup failed', error);
    }
  },
  60 * 60 * 1000,
);
sessionCleanup.unref();
async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  clearInterval(sessionCleanup);
  stopEmailWorker();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

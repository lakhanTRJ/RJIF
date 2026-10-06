import { createApp } from './app.js';
import { assertProductionConfig, config } from './config.js';
import { pool } from './db.js';
import { startEmailWorker } from './emailWorker.js';

assertProductionConfig();
const server=createApp().listen(config.port, '127.0.0.1', () => console.log(`RJIF server listening on http://127.0.0.1:${config.port}`));
const stopEmailWorker=startEmailWorker();
async function shutdown(signal){console.log(`${signal} received; shutting down`);stopEmailWorker();server.close(async()=>{await pool.end();process.exit(0)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));

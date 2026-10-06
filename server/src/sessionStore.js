import session from 'express-session';

export class MySqlSessionStore extends session.Store {
  constructor(pool) {
    super();
    this.pool = pool;
  }
  get(id, callback) {
    this.pool
      .execute('SELECT data FROM admin_sessions WHERE session_id=? AND expires > UNIX_TIMESTAMP() LIMIT 1', [
        id,
      ])
      .then(([rows]) => callback(null, rows[0] ? JSON.parse(rows[0].data) : null))
      .catch(callback);
  }
  set(id, value, callback = () => {}) {
    const expires = Math.floor(
      (value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + 8 * 60 * 60 * 1000) /
        1000,
    );
    this.pool
      .execute(
        'INSERT INTO admin_sessions (session_id, expires, data) VALUES (?,?,?) ON DUPLICATE KEY UPDATE expires=VALUES(expires), data=VALUES(data)',
        [id, expires, JSON.stringify(value)],
      )
      .then(() => callback())
      .catch(callback);
  }
  destroy(id, callback = () => {}) {
    this.pool
      .execute('DELETE FROM admin_sessions WHERE session_id=?', [id])
      .then(() => callback())
      .catch(callback);
  }
  touch(id, value, callback = () => {}) {
    const expires = Math.floor(
      (value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + 8 * 60 * 60 * 1000) /
        1000,
    );
    this.pool
      .execute('UPDATE admin_sessions SET expires=? WHERE session_id=?', [expires, id])
      .then(() => callback())
      .catch(callback);
  }
}

import crypto from 'node:crypto';

export function requireAdmin(req, res, next) {
  if (!req.session?.adminId) return res.status(401).json({ error: 'Authentication required' });
  if (
    req.session.role === 'event_staff' &&
    !['/api/admin/session', '/api/admin/logout'].includes(req.originalUrl.split('?')[0]) &&
    !req.originalUrl.startsWith('/api/admin/check-in')
  )
    return res.status(403).json({ error: 'Event staff access is limited to check-in' });
  next();
}

export function requireAdministrator(req, res, next) {
  if (!req.session?.adminId) return res.status(401).json({ error: 'Authentication required' });
  if (req.session.role !== 'administrator')
    return res.status(403).json({ error: 'Administrator access required' });
  next();
}

export function issueCsrf(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  return req.session.csrfToken;
}

export function requireCsrf(req, res, next) {
  const supplied = req.get('x-csrf-token');
  const expected = req.session?.csrfToken;
  if (
    !expected ||
    !supplied ||
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  ) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}

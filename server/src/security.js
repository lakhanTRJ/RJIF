import crypto from 'node:crypto';

export function validateAdminSession(findUser) {
  return async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      if (!req.session?.adminId) return res.status(401).json({ error: 'Authentication required' });
      const user = await findUser(req.session.adminId);
      if (!user?.is_active || Number(user.auth_version) !== Number(req.session.authVersion || 0)) {
        return req.session.destroy(() => res.status(401).json({ error: 'Please log in again' }));
      }
      req.session.role = user.role;
      requireAdmin(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function requireAdmin(req, res, next) {
  if (!req.session?.adminId) return res.status(401).json({ error: 'Authentication required' });
  if (req.session.role === 'article_publisher') {
    const route = req.originalUrl.split('?')[0];
    const allowed =
      (route === '/api/admin/session' && req.method === 'GET') ||
      (route === '/api/admin/logout' && req.method === 'POST') ||
      (route === '/api/admin/articles' && ['GET', 'POST'].includes(req.method)) ||
      (/^\/api\/admin\/articles\/\d+$/.test(route) && req.method === 'PUT') ||
      (route === '/api/admin/media' && ['GET', 'POST'].includes(req.method));
    if (!allowed)
      return res.status(403).json({ error: 'Article publisher access is limited to articles and media' });
  }
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

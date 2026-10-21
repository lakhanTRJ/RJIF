import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAdmin, requireAdministrator, validateAdminSession } from '../src/security.js';

function access(role, method, originalUrl, guard = requireAdmin) {
  let status;
  let passed = false;
  const req = { method, originalUrl, session: role ? { adminId: 1, role } : {} };
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json() {
      return this;
    },
  };
  guard(req, res, () => {
    passed = true;
  });
  return passed ? 200 : status;
}

test('publishers can use article, session and media operations only', () => {
  for (const [method, path] of [
    ['GET', 'session'],
    ['POST', 'logout'],
    ['GET', 'articles'],
    ['POST', 'articles'],
    ['PUT', 'articles/123'],
    ['GET', 'media'],
    ['POST', 'media'],
  ]) {
    assert.equal(access('article_publisher', method, `/api/admin/${path}`), 200, `${method} ${path}`);
  }
  assert.equal(access('article_publisher', 'GET', '/api/admin/articles?search=test'), 200);
});

test('publishers cannot read customer data, mutate website settings or manage accounts', () => {
  for (const path of [
    'pages',
    'pages/1',
    'submissions',
    'submissions.csv',
    'products',
    'registrations',
    'registrations/1/passes',
    'registrations/manual',
    'registrations/1/send-passes',
    'awards',
    'felicitation',
    'forums/india',
    'forums/india/settings',
    'event-staff',
    'team-accounts',
    'team-accounts/1',
    'check-in/dashboard',
    'check-in/scan',
    'articles/123/anything',
    'articles-unsafe',
    'media/123',
  ]) {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      assert.equal(access('article_publisher', method, `/api/admin/${path}`), 403, `${method} ${path}`);
    }
  }
  assert.equal(access('article_publisher', 'DELETE', '/api/admin/articles/123'), 403);
  assert.equal(access('article_publisher', 'GET', '/api/admin/team-accounts', requireAdministrator), 403);
});

test('authentication and existing staff restrictions are preserved', () => {
  assert.equal(access(null, 'GET', '/api/admin/articles'), 401);
  assert.equal(access('event_staff', 'GET', '/api/admin/articles'), 403);
  assert.equal(access('event_staff', 'POST', '/api/admin/check-in/scan'), 200);
  assert.equal(access('editor', 'GET', '/api/admin/team-accounts', requireAdministrator), 403);
  assert.equal(access('administrator', 'GET', '/api/admin/team-accounts', requireAdministrator), 200);
});

test('disabled accounts and password-reset sessions are revoked before accessing data', async () => {
  for (const user of [null, { is_active: 0, auth_version: 0 }, { is_active: 1, auth_version: 1 }]) {
    let destroyed = false;
    let status;
    let passed = false;
    const req = {
      session: {
        adminId: 1,
        authVersion: 0,
        destroy(done) {
          destroyed = true;
          done();
        },
      },
    };
    const res = {
      set() {},
      status(code) {
        status = code;
        return this;
      },
      json() {},
    };
    await validateAdminSession(async () => user)(req, res, () => {
      passed = true;
    });
    assert.equal(destroyed, true);
    assert.equal(status, 401);
    assert.equal(passed, false);
  }
});

test('current database role overrides stale administrator session privileges', async () => {
  let status;
  const req = {
    method: 'GET',
    originalUrl: '/api/admin/registrations',
    session: { adminId: 1, role: 'administrator' },
  };
  const res = {
    set() {},
    status(code) {
      status = code;
      return this;
    },
    json() {},
  };
  await validateAdminSession(async () => ({ role: 'article_publisher', is_active: 1, auth_version: 0 }))(
    req,
    res,
    () => assert.fail('Must not pass'),
  );
  assert.equal(status, 403);
});

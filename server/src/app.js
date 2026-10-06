import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config.js';
import { pool } from './db.js';
import { publicRouter, getPublishedArticle, getPublishedPage } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { injectSeo } from './seo.js';
import { MySqlSessionStore } from './sessionStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();
  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const started = Date.now(),
      requestId = String(req.get('x-request-id') || crypto.randomUUID()).slice(0, 100);
    req.requestId = requestId;
    res.set('X-Request-Id', requestId);
    res.on('finish', () =>
      console.log(
        JSON.stringify({
          level: 'info',
          type: 'http',
          requestId,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          durationMs: Date.now() - started,
        }),
      ),
    );
    next();
  });
  app.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://i.ytimg.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
          connectSrc: ["'self'", 'https://api.razorpay.com'],
          frameSrc: [
            "'self'",
            'https://www.youtube.com',
            'https://www.youtube-nocookie.com',
            'https://api.razorpay.com',
            'https://checkout.razorpay.com',
          ],
        },
      },
    }),
  );
  app.use(compression());
  app.use(
    express.json({
      limit: '500kb',
      verify: (req, res, buffer) => {
        if (req.originalUrl === '/api/public/payments/razorpay/webhook') req.rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.use(
    session({
      name: 'rjif.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new MySqlSessionStore(pool),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.env === 'production',
        maxAge: 8 * 60 * 60 * 1000,
      },
    }),
  );
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/ready', async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT id FROM schema_migrations WHERE id='012_article_categories.sql' LIMIT 1",
      );
      await fs.access(path.resolve(config.uploadDir));
      if (!rows.length) throw new Error('Database migrations are incomplete');
      res.json({ status: 'ready' });
    } catch (error) {
      console.error(JSON.stringify({ level: 'error', type: 'readiness', message: error.message }));
      res.status(503).json({ status: 'not_ready' });
    }
  });
  app.use('/api/public', publicRouter);
  app.use('/api/admin', adminRouter);
  app.use('/media', express.static(path.resolve(config.uploadDir), { maxAge: '7d', immutable: false }));
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(
    '/reference',
    express.static(path.join(clientDist, 'reference'), { maxAge: '30d', immutable: false }),
  );
  app.get(['/leadership-awards', '/leadership-awards/'], (req, res) =>
    res.redirect(301, '/business-excellence-awards/'),
  );
  const removedArticlePaths = new Set([
    '/mastering-kachingo-for-your-jewelry-business-a-strategic-blueprint-for-artisans/',
    '/kachingo-a-practical-guide-for-modern-jewelry-businesses/',
    '/how-to-use-unique-handmade-gold-jewelry-to-create-a-personal-style-statement/',
  ]);
  app.get('*path', (req, res, next) =>
    removedArticlePaths.has(req.path.endsWith('/') ? req.path : `${req.path}/`)
      ? res.status(410).type('text/plain').send('This content has been permanently removed.')
      : next(),
  );
  app.get('/robots.txt', (req, res) =>
    res
      .type('text/plain')
      .send(
        config.stagingNoindex
          ? 'User-agent: *\nDisallow: /\n'
          : 'User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ' + config.publicOrigin + '/sitemap.xml\n',
      ),
  );
  app.get('/sitemap.xml', async (req, res, next) => {
    try {
      const [[pages], [articles]] = await Promise.all([
        pool.query('SELECT path, updated_at FROM pages WHERE is_published=1 ORDER BY path'),
        pool.query(
          "SELECT slug, updated_at FROM articles WHERE status='published' AND (publish_at IS NULL OR publish_at<=NOW()) ORDER BY slug",
        ),
      ]);
      const rows = [
        ...pages,
        ...articles.map((article) => ({ path: `/blog/${article.slug}/`, updated_at: article.updated_at })),
      ];
      const escapeXml = (value) =>
        String(value).replace(
          /[&<>"']/g,
          (character) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character],
        );
      res
        .type('application/xml')
        .send(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.map((row) => `<url><loc>${escapeXml(`${config.publicOrigin.replace(/\/$/, '')}${row.path}`)}</loc><lastmod>${new Date(row.updated_at).toISOString()}</lastmod></url>`).join('')}</urlset>`,
        );
    } catch (e) {
      next(e);
    }
  });
  app.get('*path', async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/media/')) return next();
    try {
      const html = await fs.readFile(path.join(clientDist, 'index.html'), 'utf8');
      if (!req.path.startsWith('/admin') && req.path !== '/' && !req.path.endsWith('/')) {
        const slashPage = await getPublishedPage(`${req.path}/`);
        if (slashPage)
          return res.redirect(
            301,
            `${req.path}/${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`,
          );
      }
      let page = req.path.startsWith('/admin')
        ? { path: req.path, title: 'RJIF Administration', seo_title: 'RJIF Administration' }
        : await getPublishedPage(req.path);
      if (!page && req.path.startsWith('/blog/')) {
        const slug = req.path.replace(/^\/blog\//, '').replace(/\/$/, '');
        const article = slug ? await getPublishedArticle(slug) : null;
        if (article)
          page = {
            path: req.path,
            title: article.title,
            seo_title: article.seo_title || article.title,
            seo_description: article.seo_description || article.excerpt,
          };
      }
      const status = page || req.path.startsWith('/admin') ? 200 : 404;
      if (config.stagingNoindex || req.path.startsWith('/admin'))
        res.set('X-Robots-Tag', 'noindex, nofollow');
      res
        .status(status)
        .send(
          injectSeo(
            html,
            page || { path: req.path, title: 'Page not found' },
            config.publicOrigin,
            config.stagingNoindex || req.path.startsWith('/admin'),
          ),
        );
    } catch (e) {
      next(e);
    }
  });
  app.use((error, req, res, next) => {
    console.error(
      JSON.stringify({
        level: 'error',
        type: 'request',
        requestId: req.requestId,
        message: error.message,
        stack: config.env === 'production' ? undefined : error.stack,
      }),
    );
    if (res.headersSent) return next(error);
    res.status(500).json({
      error: config.env === 'production' ? 'Internal server error' : error.message,
      requestId: req.requestId,
    });
  });
  return app;
}

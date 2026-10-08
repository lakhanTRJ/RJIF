import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import { query } from '../db.js';
import { issueCsrf, requireAdmin, requireAdministrator, requireCsrf } from '../security.js';
import { config } from '../config.js';
import { detectMediaMime } from '../mediaValidation.js';
import {
  getPassByToken,
  issuePassesForOrder,
  queuePassEmail,
  sha256,
  tokenFromScan,
} from '../passService.js';

export const adminRouter = Router();
async function audit(req, action, entityType, entityId = null, metadata = {}) {
  await query(
    'INSERT INTO admin_audit_log (admin_user_id,action,entity_type,entity_id,metadata,ip_hash) VALUES (?,?,?,?,?,?)',
    [
      req.session.adminId,
      action,
      entityType,
      entityId === null ? null : String(entityId),
      JSON.stringify(metadata),
      sha256(req.ip || 'unknown'),
    ],
  );
}
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
});
fs.mkdirSync(path.resolve(config.uploadDir), { recursive: true });
const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const mediaExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve(config.uploadDir),
    filename: (req, file, callback) =>
      callback(
        null,
        `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${mediaExtensions[file.mimetype] || ''}`,
      ),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) =>
    callback(
      allowedMime.has(file.mimetype) ? null : new Error('Only JPEG, PNG, WebP, and PDF files are allowed'),
      allowedMime.has(file.mimetype),
    ),
});
const uploadMedia = (req, res, next) =>
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 422;
    return res.status(status).json({ error: error.message });
  });

adminRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    const users = await query(
      'SELECT id, email, password_hash, role FROM admin_users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email],
    );
    const valid = users[0] && (await bcrypt.compare(password, users[0].password_hash));
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    await query('UPDATE admin_users SET last_login_at=NOW() WHERE id=?', [users[0].id]);
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.adminId = users[0].id;
      req.session.role = users[0].role;
      res.json({ id: users[0].id, email: users[0].email, role: users[0].role, csrfToken: issueCsrf(req) });
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/logout', requireAdmin, requireCsrf, (req, res, next) =>
  req.session.destroy((error) => (error ? next(error) : res.json({ ok: true }))),
);
adminRouter.get('/session', requireAdmin, (req, res) =>
  res.json({ authenticated: true, role: req.session.role, csrfToken: issueCsrf(req) }),
);
adminRouter.get('/pages', requireAdmin, async (req, res, next) => {
  try {
    res.json(
      await query(
        'SELECT id, path, title, seo_title, seo_description, is_published, updated_at FROM pages ORDER BY path',
      ),
    );
  } catch (e) {
    next(e);
  }
});
adminRouter.get('/pages/:id/sections', requireAdmin, async (req, res, next) => {
  try {
    res.json(
      await query(
        'SELECT id,type,kicker,heading,sort_order,is_published FROM page_sections WHERE page_id=? ORDER BY sort_order,id',
        [req.params.id],
      ),
    );
  } catch (e) {
    next(e);
  }
});
adminRouter.put('/pages/:id/sections/order', requireAdministrator, requireCsrf, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.ids) || req.body.ids.length > 100)
      return res.status(422).json({ error: 'Invalid section order' });
    const owned = await query(
      `SELECT id FROM page_sections WHERE page_id=? AND id IN (${req.body.ids.map(() => '?').join(',') || 'NULL'})`,
      [req.params.id, ...req.body.ids],
    );
    if (owned.length !== req.body.ids.length)
      return res.status(422).json({ error: 'Section list does not match this page' });
    for (let index = 0; index < req.body.ids.length; index++)
      await query('UPDATE page_sections SET sort_order=? WHERE id=? AND page_id=?', [
        index,
        req.body.ids[index],
        req.params.id,
      ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
adminRouter.put('/pages/:id', requireAdministrator, requireCsrf, async (req, res, next) => {
  try {
    const { title, seo_title = '', seo_description = '', is_published = false } = req.body;
    if (!String(title || '').trim()) return res.status(422).json({ error: 'Title is required' });
    await query(
      'UPDATE pages SET title = ?, seo_title = ?, seo_description = ?, is_published = ?, updated_by = ? WHERE id = ?',
      [
        String(title).trim(),
        String(seo_title).slice(0, 255),
        String(seo_description).slice(0, 500),
        is_published ? 1 : 0,
        req.session.adminId,
        req.params.id,
      ],
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
adminRouter.get('/submissions', requireAdmin, async (req, res, next) => {
  try {
    res.json(
      await query(
        'SELECT s.id, f.form_key, s.payload, s.created_at FROM form_submissions s JOIN forms f ON f.id=s.form_id ORDER BY s.id DESC LIMIT 1000',
      ),
    );
  } catch (e) {
    next(e);
  }
});
adminRouter.get('/submissions.csv', requireAdmin, async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT s.id, f.form_key, s.payload, s.created_at FROM form_submissions s JOIN forms f ON f.id=s.form_id ORDER BY s.id DESC',
    );
    const cell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    res
      .type('text/csv')
      .attachment('rjif-submissions.csv')
      .send(
        [
          'id,form,payload,created_at',
          ...rows.map((r) =>
            [r.id, r.form_key, JSON.stringify(r.payload), r.created_at.toISOString?.() || r.created_at]
              .map(cell)
              .join(','),
          ),
        ].join('\n'),
      );
  } catch (e) {
    next(e);
  }
});
adminRouter.get('/media', requireAdmin, async (req, res, next) => {
  try {
    res.json(
      await query(
        'SELECT id,file_name,storage_key,mime_type,byte_size,alt_text,source_url,source_page,created_at FROM media ORDER BY id DESC',
      ),
    );
  } catch (e) {
    next(e);
  }
});
adminRouter.post('/media', requireAdmin, requireCsrf, uploadMedia, async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ error: 'Choose an image or PDF' });
    if (detectMediaMime(fs.readFileSync(req.file.path)) !== req.file.mimetype) {
      fs.unlink(req.file.path, () => {});
      return res.status(422).json({ error: 'The uploaded file content does not match its file type' });
    }
    const alt = String(req.body.alt_text || '').trim();
    if (!alt) {
      fs.unlink(req.file.path, () => {});
      return res.status(422).json({ error: 'Alt text is required' });
    }
    const storageKey = req.file.filename;
    const result = await query(
      'INSERT INTO media (file_name,storage_key,mime_type,byte_size,alt_text,source_url,source_page,uploaded_by) VALUES (?,?,?,?,?,?,?,?)',
      [
        req.file.originalname,
        storageKey,
        req.file.mimetype,
        req.file.size,
        alt,
        String(req.body.source_url || '').slice(0, 1000) || null,
        String(req.body.source_page || '').slice(0, 500) || null,
        req.session.adminId,
      ],
    );
    res.status(201).json({ id: result.insertId, url: `/media/${storageKey}`, mimeType: req.file.mimetype });
  } catch (e) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(e);
  }
});

adminRouter.get('/products', requireAdmin, async (req, res, next) => {
  try {
    res.json(
      await query(
        'SELECT id,code,kind,forum,name,description,regular_price_paise,sale_price_paise,currency,tax_rate,member_count,is_active,redemption_limit,redemption_count,expires_at,inventory_limit,sort_order,updated_at FROM commerce_products ORDER BY forum,sort_order,id',
      ),
    );
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/products', requireAdministrator, requireCsrf, async (req, res, next) => {
  try {
    const code = String(req.body.code || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '');
    const forum = ['india', 'south'].includes(String(req.body.forum)) ? String(req.body.forum) : '';
    const name = String(req.body.name || '').trim();
    if (!code || !forum || !name)
      return res.status(422).json({ error: 'Code, forum and pass name are required' });
    const secret = crypto.randomBytes(32).toString('base64url'),
      limit = Math.max(1, Number(req.body.redemption_limit) || 1),
      expires = req.body.expires_at ? new Date(req.body.expires_at) : null;
    if (expires && Number.isNaN(expires.getTime()))
      return res.status(422).json({ error: 'Enter a valid expiry date' });
    const result = await query(
      "INSERT INTO commerce_products (code,kind,forum,name,description,regular_price_paise,sale_price_paise,currency,tax_rate,member_count,is_active,complimentary_token_hash,redemption_limit,expires_at,sort_order) VALUES (?,'delegate_pass',?,?,?,?,0,'INR',0,?,1,?,?,?,?)",
      [
        code,
        forum,
        name,
        String(req.body.description || '').slice(0, 2000),
        null,
        Math.max(1, Number(req.body.member_count) || 1),
        sha256(secret),
        limit,
        expires,
        Number(req.body.sort_order) || 0,
      ],
    );
    await audit(req, 'create', 'complimentary_product', result.insertId, {
      code,
      forum,
      redemption_limit: limit,
      expires_at: expires,
    });
    res.status(201).json({
      id: result.insertId,
      code,
      checkoutUrl: `/checkout/?pass=${encodeURIComponent(code)}&complimentary=${encodeURIComponent(secret)}`,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'That pass code already exists' });
    next(error);
  }
});

adminRouter.get('/awards', requireAdmin, async (req, res, next) => {
  try {
    const settings = (await query('SELECT content,updated_at FROM award_settings WHERE id=1 LIMIT 1'))[0] || {
      content: {},
    };
    const applications = await query(
      'SELECT public_id,categories,full_name,company,mobile,email,status,created_at FROM award_applications ORDER BY id DESC LIMIT 250',
    );
    res.json({
      content: typeof settings.content === 'string' ? JSON.parse(settings.content) : settings.content,
      updated_at: settings.updated_at,
      applications,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/awards', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const content = req.body?.content;
    if (
      !content ||
      typeof content !== 'object' ||
      !Array.isArray(content.accordions) ||
      content.accordions.length > 20
    )
      return res.status(422).json({ error: 'Enter valid awards content' });
    const encoded = JSON.stringify(content);
    if (encoded.length > 250000) return res.status(422).json({ error: 'Awards content is too large' });
    await query(
      'INSERT INTO award_settings (id,content,updated_by) VALUES (1,?,?) ON DUPLICATE KEY UPDATE content=VALUES(content),updated_by=VALUES(updated_by)',
      [encoded, req.session.adminId],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/felicitation', requireAdmin, async (req, res, next) => {
  try {
    const settings = (
      await query('SELECT hero_youtube_url,updated_at FROM felicitation_settings WHERE id=1 LIMIT 1')
    )[0] || { hero_youtube_url: '' };
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/felicitation', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const heroYoutubeUrl = String(req.body?.hero_youtube_url || '').trim();
    if (heroYoutubeUrl.length > 1000) return res.status(422).json({ error: 'The YouTube URL is too long' });
    await query(
      'INSERT INTO felicitation_settings (id,hero_youtube_url,updated_by) VALUES (1,?,?) ON DUPLICATE KEY UPDATE hero_youtube_url=VALUES(hero_youtube_url),updated_by=VALUES(updated_by)',
      [heroYoutubeUrl, req.session.adminId],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/products/:id', requireAdministrator, requireCsrf, async (req, res, next) => {
  try {
    const regular =
      req.body.regular_price_paise === null || req.body.regular_price_paise === ''
        ? null
        : Number(req.body.regular_price_paise);
    const sale = Number(req.body.sale_price_paise);
    const tax = Number(req.body.tax_rate || 0);
    if (
      !String(req.body.name || '').trim() ||
      !Number.isInteger(sale) ||
      sale < 0 ||
      (regular !== null && (!Number.isInteger(regular) || regular < 0)) ||
      !Number.isFinite(tax) ||
      tax < 0 ||
      tax > 100
    )
      return res.status(422).json({ error: 'Enter valid product details and prices in paise' });
    const redemptionLimit =
        req.body.redemption_limit === '' || req.body.redemption_limit === null
          ? null
          : Math.max(1, Number(req.body.redemption_limit) || 1),
      inventoryLimit =
        req.body.inventory_limit === '' || req.body.inventory_limit === null
          ? null
          : Math.max(1, Number(req.body.inventory_limit) || 1),
      expires = req.body.expires_at ? new Date(req.body.expires_at) : null;
    if (expires && Number.isNaN(expires.getTime()))
      return res.status(422).json({ error: 'Enter a valid expiry date' });
    await query(
      'UPDATE commerce_products SET name=?,description=?,regular_price_paise=?,sale_price_paise=?,tax_rate=?,member_count=?,is_active=?,redemption_limit=?,expires_at=?,inventory_limit=?,sort_order=? WHERE id=?',
      [
        String(req.body.name).trim(),
        String(req.body.description || '').slice(0, 2000),
        regular,
        sale,
        tax,
        Math.max(1, Number(req.body.member_count) || 1),
        req.body.is_active ? 1 : 0,
        redemptionLimit,
        expires,
        inventoryLimit,
        Number(req.body.sort_order) || 0,
        req.params.id,
      ],
    );
    await audit(req, 'update', 'commerce_product', req.params.id, {
      is_active: Boolean(req.body.is_active),
      sale_price_paise: sale,
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/forums/:forum', requireAdmin, async (req, res, next) => {
  try {
    const forum = String(req.params.forum);
    if (!['india', 'south'].includes(forum)) return res.status(404).json({ error: 'Forum not found' });
    const settings = (await query('SELECT * FROM forum_settings WHERE forum=?', [forum]))[0];
    if (settings) {
      try {
        settings.overview_stats =
          typeof settings.overview_stats === 'string'
            ? JSON.parse(settings.overview_stats)
            : settings.overview_stats || [];
      } catch {
        settings.overview_stats = [];
      }
    }
    const speakers = await query(
      'SELECT * FROM speakers WHERE forum=? ORDER BY is_featured DESC,sort_order,id',
      [forum],
    );
    const agenda = await query('SELECT * FROM agenda_items WHERE forum=? ORDER BY sort_order,id', [forum]);
    const gallery = await query('SELECT * FROM gallery_items WHERE forum=? ORDER BY sort_order,id', [forum]);
    res.json({ settings, speakers, agenda, gallery });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/forums/:forum/settings', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const forum = String(req.params.forum);
    if (!['india', 'south'].includes(forum)) return res.status(404).json({ error: 'Forum not found' });
    const text = (key) => String(req.body[key] || '').slice(0, key === 'quote_text' ? 4000 : 1000);
    const overviewStats = Array.isArray(req.body.overview_stats)
      ? req.body.overview_stats
          .slice(0, 8)
          .map((item) => ({
            number: String(item.number || '').slice(0, 30),
            label: String(item.label || '').slice(0, 120),
            caption: String(item.caption || '').slice(0, 120),
          }))
          .filter((item) => item.number && item.label)
      : [];
    await query(
      `UPDATE forum_settings SET speaker_heading=?,hero_youtube_url=?,content_youtube_url=?,event_date=?,event_location=?,overview_stats=?,quote_text=?,quote_banner_url=?,quote_banner_target=?,quote_visible=?,agenda_visible=?,post_agenda_banner_url=?,post_agenda_banner_target=?,post_agenda_banner_label=?,post_agenda_banner_visible=?,passes_visible=?,pass_columns=?,gallery_heading=?,gallery_visible=?,gallery_target_url=?,footer_tagline=?,footer_copyright=?,linkedin_url=?,instagram_url=?,facebook_url=?,x_url=?,youtube_url=? WHERE forum=?`,
      [
        text('speaker_heading'),
        text('hero_youtube_url'),
        text('content_youtube_url'),
        text('event_date'),
        text('event_location'),
        JSON.stringify(overviewStats),
        text('quote_text'),
        text('quote_banner_url'),
        text('quote_banner_target'),
        req.body.quote_visible ? 1 : 0,
        req.body.agenda_visible ? 1 : 0,
        text('post_agenda_banner_url'),
        text('post_agenda_banner_target'),
        text('post_agenda_banner_label'),
        req.body.post_agenda_banner_visible ? 1 : 0,
        req.body.passes_visible ? 1 : 0,
        Math.min(4, Math.max(1, Number(req.body.pass_columns) || 1)),
        text('gallery_heading'),
        req.body.gallery_visible ? 1 : 0,
        text('gallery_target_url'),
        text('footer_tagline'),
        text('footer_copyright'),
        text('linkedin_url'),
        text('instagram_url'),
        text('facebook_url'),
        text('x_url'),
        text('youtube_url'),
        forum,
      ],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/forums/:forum/speakers', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const forum = String(req.params.forum);
    const name = String(req.body.name || '').trim();
    if (!['india', 'south'].includes(forum) || !name)
      return res.status(422).json({ error: 'Forum and speaker name are required' });
    const result = await query(
      'INSERT INTO speakers (forum,name,role,image_url,event_year,is_featured,is_published,sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [
        forum,
        name,
        String(req.body.role || '').slice(0, 1000),
        String(req.body.image_url || '').slice(0, 1000) || null,
        Number(req.body.event_year) || 2026,
        req.body.is_featured ? 1 : 0,
        req.body.is_published === false ? 0 : 1,
        Number(req.body.sort_order) || 0,
      ],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});
adminRouter.put('/speakers/:id', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    await query(
      'UPDATE speakers SET name=?,role=?,image_url=?,event_year=?,is_featured=?,is_published=?,sort_order=? WHERE id=?',
      [
        String(req.body.name || '').trim(),
        String(req.body.role || '').slice(0, 1000),
        String(req.body.image_url || '').slice(0, 1000) || null,
        Number(req.body.event_year) || 2026,
        req.body.is_featured ? 1 : 0,
        req.body.is_published ? 1 : 0,
        Number(req.body.sort_order) || 0,
        req.params.id,
      ],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/forums/:forum/agenda', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const result = await query(
      'INSERT INTO agenda_items (forum,number,title,subtitle,body,is_visible,sort_order) VALUES (?,?,?,?,?,?,?)',
      [
        req.params.forum,
        String(req.body.number || '').slice(0, 20),
        String(req.body.title || '').trim(),
        String(req.body.subtitle || '').slice(0, 1000),
        String(req.body.body || '').slice(0, 5000),
        1,
        Number(req.body.sort_order) || 0,
      ],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});
adminRouter.put('/agenda/:id', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    await query(
      'UPDATE agenda_items SET number=?,title=?,subtitle=?,body=?,is_visible=?,sort_order=? WHERE id=?',
      [
        String(req.body.number || '').slice(0, 20),
        String(req.body.title || '').trim(),
        String(req.body.subtitle || '').slice(0, 1000),
        String(req.body.body || '').slice(0, 5000),
        req.body.is_visible ? 1 : 0,
        Number(req.body.sort_order) || 0,
        req.params.id,
      ],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/forums/:forum/gallery', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const result = await query(
      'INSERT INTO gallery_items (forum,event_year,image_url,image_alt,target_url,is_visible,sort_order) VALUES (?,?,?,?,?,1,?)',
      [
        req.params.forum,
        Number(req.body.event_year) || new Date().getFullYear(),
        String(req.body.image_url || '').slice(0, 1000),
        String(req.body.image_alt || 'Previous event glimpse').slice(0, 500),
        String(
          req.body.target_url ||
            (req.params.forum === 'south'
              ? '/previous-edition-highlights-south/'
              : '/previous-edition-highlights/'),
        ).slice(0, 1000),
        Number(req.body.sort_order) || 0,
      ],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});
adminRouter.put('/gallery/:id', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    await query(
      'UPDATE gallery_items SET event_year=?,image_url=?,image_alt=?,target_url=?,is_visible=?,sort_order=? WHERE id=?',
      [
        Number(req.body.event_year) || new Date().getFullYear(),
        String(req.body.image_url || '').slice(0, 1000),
        String(req.body.image_alt || '').slice(0, 500),
        String(req.body.target_url || '').slice(0, 1000),
        req.body.is_visible ? 1 : 0,
        Number(req.body.sort_order) || 0,
        req.params.id,
      ],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/highlights', requireAdmin, async (req, res, next) => {
  try {
    res.json(
      await query(
        "SELECT * FROM highlight_videos ORDER BY forum,event_year DESC,FIELD(section,'session','event'),sort_order,id",
      ),
    );
  } catch (error) {
    next(error);
  }
});
adminRouter.post('/highlights', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const forum = req.body.forum === 'south' ? 'south' : 'india';
    const section = req.body.section === 'event' ? 'event' : 'session';
    const title = String(req.body.title || '').trim(),
      image = String(req.body.cover_image_url || '').slice(0, 1000),
      url = String(req.body.youtube_url || '').slice(0, 1000);
    if (!title || !image || !url)
      return res.status(422).json({ error: 'Title, cover image and YouTube URL are required' });
    const result = await query(
      'INSERT INTO highlight_videos (forum,section,event_year,title,cover_image_url,youtube_url,is_visible,sort_order) VALUES (?,?,?,?,?,?,1,?)',
      [
        forum,
        section,
        Number(req.body.event_year) || new Date().getFullYear(),
        title,
        image,
        url,
        Number(req.body.sort_order) || 0,
      ],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});
adminRouter.put('/highlights/:id', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const forum = req.body.forum === 'south' ? 'south' : 'india';
    const section = req.body.section === 'event' ? 'event' : 'session';
    const title = String(req.body.title || '').trim(),
      image = String(req.body.cover_image_url || '').slice(0, 1000),
      url = String(req.body.youtube_url || '').slice(0, 1000);
    if (!title || !image || !url)
      return res.status(422).json({ error: 'Title, cover image and YouTube URL are required' });
    await query(
      'UPDATE highlight_videos SET forum=?,section=?,event_year=?,title=?,cover_image_url=?,youtube_url=?,is_visible=?,sort_order=? WHERE id=?',
      [
        forum,
        section,
        Number(req.body.event_year) || new Date().getFullYear(),
        title,
        image,
        url,
        req.body.is_visible ? 1 : 0,
        Number(req.body.sort_order) || 0,
        req.params.id,
      ],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/registrations', requireAdmin, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT o.id,o.public_id,o.customer_name,o.company,o.email,o.phone,o.total_paise,o.status,o.created_at,p.name AS product_name,p.forum,COUNT(DISTINCT oa.id) AS attendee_count,COUNT(DISTINCT dp.id) AS pass_count FROM commerce_orders o JOIN commerce_products p ON p.id=o.product_id LEFT JOIN order_attendees oa ON oa.order_id=o.id LEFT JOIN digital_passes dp ON dp.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`,
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});
adminRouter.post(
  '/registrations/:id/mark-paid',
  requireAdministrator,
  requireCsrf,
  async (req, res, next) => {
    try {
      const order = (
        await query('SELECT id,status,award_application_id FROM commerce_orders WHERE id=? LIMIT 1', [
          req.params.id,
        ])
      )[0];
      if (!order) return res.status(404).json({ error: 'Registration not found' });
      if (order.status !== 'paid')
        await query("UPDATE commerce_orders SET status='paid',paid_at=NOW() WHERE id=?", [order.id]);
      if (order.award_application_id)
        await query("UPDATE award_applications SET status='paid' WHERE id=?", [order.award_application_id]);
      await issuePassesForOrder(order.id);
      const email = await queuePassEmail(order.id);
      await audit(req, 'mark_paid', 'commerce_order', order.id, { previous_status: order.status });
      res.json({ ok: true, email });
    } catch (error) {
      next(error);
    }
  },
);
adminRouter.post(
  '/registrations/:id/send-passes',
  requireAdministrator,
  requireCsrf,
  async (req, res, next) => {
    try {
      const result = await queuePassEmail(req.params.id, { force: true });
      if (!result.queued) return res.status(409).json({ error: result.reason });
      await audit(req, 'queue_pass_email', 'commerce_order', req.params.id);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  },
);
adminRouter.get('/event-staff', requireAdministrator, async (req, res, next) => {
  try {
    res.json(
      await query(
        "SELECT id,email,is_active,created_at,last_login_at FROM admin_users WHERE role='event_staff' ORDER BY email",
      ),
    );
  } catch (error) {
    next(error);
  }
});
adminRouter.post('/event-staff', requireAdministrator, requireCsrf, async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
        .trim()
        .toLowerCase(),
      password = String(req.body.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12)
      return res.status(422).json({ error: 'Enter a valid email and a password of at least 12 characters' });
    const hash = await bcrypt.hash(password, 12);
    await query(
      "INSERT INTO admin_users (email,password_hash,role,is_active) VALUES (?,?,'event_staff',1) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),role='event_staff',is_active=1",
      [email, hash],
    );
    const user = (await query('SELECT id FROM admin_users WHERE email=?', [email]))[0];
    await audit(req, 'create_or_reset', 'event_staff', user.id, { email });
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});
adminRouter.put('/event-staff/:id', requireAdministrator, requireCsrf, async (req, res, next) => {
  try {
    await query("UPDATE admin_users SET is_active=? WHERE id=? AND role='event_staff'", [
      req.body.is_active ? 1 : 0,
      req.params.id,
    ]);
    await audit(req, req.body.is_active ? 'enable' : 'disable', 'event_staff', req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/check-in/dashboard', requireAdmin, async (req, res, next) => {
  try {
    const forum = ['india', 'south'].includes(String(req.query.forum)) ? String(req.query.forum) : 'india';
    const counts = (
      await query(
        `SELECT COUNT(*) AS issued,SUM(dp.status='checked_in') AS checked_in,SUM(dp.status='active') AS remaining FROM digital_passes dp JOIN commerce_orders o ON o.id=dp.order_id JOIN commerce_products p ON p.id=o.product_id WHERE p.forum=?`,
        [forum],
      )
    )[0];
    const recent = await query(
      `SELECT dp.pass_number,dp.checked_in_at,oa.full_name,o.company,au.email AS checked_in_by FROM digital_passes dp JOIN commerce_orders o ON o.id=dp.order_id JOIN commerce_products p ON p.id=o.product_id LEFT JOIN order_attendees oa ON oa.id=dp.attendee_id LEFT JOIN admin_users au ON au.id=dp.checked_in_by WHERE p.forum=? AND dp.checked_in_at IS NOT NULL ORDER BY dp.checked_in_at DESC LIMIT 30`,
      [forum],
    );
    res.json({ counts, recent });
  } catch (error) {
    next(error);
  }
});
adminRouter.get('/check-in/search', requireAdmin, async (req, res, next) => {
  try {
    const q = `%${String(req.query.q || '')
        .trim()
        .slice(0, 100)}%`,
      forum = ['india', 'south'].includes(String(req.query.forum)) ? String(req.query.forum) : 'india';
    if (q === '%%') return res.json([]);
    res.json(
      await query(
        `SELECT dp.pass_number,dp.status,dp.checked_in_at,oa.full_name,oa.email,oa.phone,o.company FROM digital_passes dp JOIN commerce_orders o ON o.id=dp.order_id JOIN commerce_products p ON p.id=o.product_id LEFT JOIN order_attendees oa ON oa.id=dp.attendee_id WHERE p.forum=? AND (dp.pass_number LIKE ? OR oa.full_name LIKE ? OR oa.email LIKE ? OR oa.phone LIKE ? OR o.company LIKE ?) ORDER BY oa.full_name LIMIT 30`,
        [forum, q, q, q, q, q],
      ),
    );
  } catch (error) {
    next(error);
  }
});
adminRouter.post('/check-in/scan', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const scanned = tokenFromScan(req.body.value),
      manual = String(req.body.pass_number || '').trim();
    let pass = manual
      ? (
          await query(
            `SELECT dp.*,oa.full_name,oa.email,oa.phone,o.company,o.public_id,p.name AS product_name,p.forum,fs.event_date,fs.event_location FROM digital_passes dp JOIN commerce_orders o ON o.id=dp.order_id JOIN commerce_products p ON p.id=o.product_id LEFT JOIN order_attendees oa ON oa.id=dp.attendee_id LEFT JOIN forum_settings fs ON fs.forum=p.forum WHERE dp.pass_number=? LIMIT 1`,
            [manual],
          )
        )[0]
      : await getPassByToken(scanned);
    const hash = sha256(manual || scanned);
    if (!pass) {
      await query(
        "INSERT INTO pass_checkin_events (admin_user_id,result,scanned_value_hash) VALUES (?,'invalid',?)",
        [req.session.adminId, hash],
      );
      return res.status(404).json({ result: 'invalid', error: 'This QR code is not a valid delegate pass' });
    }
    if (pass.status === 'cancelled') {
      await query(
        "INSERT INTO pass_checkin_events (pass_id,admin_user_id,result,scanned_value_hash) VALUES (?,?,'cancelled',?)",
        [pass.id, req.session.adminId, hash],
      );
      return res.status(409).json({ result: 'cancelled', pass });
    }
    const updated = await query(
      "UPDATE digital_passes SET status='checked_in',checked_in_at=NOW(),checked_in_by=? WHERE id=? AND status='active'",
      [req.session.adminId, pass.id],
    );
    if (!updated.affectedRows) {
      await query(
        "INSERT INTO pass_checkin_events (pass_id,admin_user_id,result,scanned_value_hash) VALUES (?,?,'already_checked_in',?)",
        [pass.id, req.session.adminId, hash],
      );
      const current = (await query('SELECT checked_in_at FROM digital_passes WHERE id=?', [pass.id]))[0];
      return res.status(409).json({
        result: 'already_checked_in',
        pass: { ...pass, ...current },
        error: `Already checked in at ${current.checked_in_at}`,
      });
    }
    await query(
      "INSERT INTO pass_checkin_events (pass_id,admin_user_id,result,scanned_value_hash) VALUES (?,?,'checked_in',?)",
      [pass.id, req.session.adminId, hash],
    );
    res.json({ result: 'checked_in', pass: { ...pass, status: 'checked_in' } });
  } catch (error) {
    next(error);
  }
});
adminRouter.get('/check-in/export.csv', requireAdmin, async (req, res, next) => {
  try {
    const forum = ['india', 'south'].includes(String(req.query.forum)) ? String(req.query.forum) : 'india';
    const rows = await query(
      `SELECT dp.pass_number,oa.full_name,oa.email,oa.phone,o.company,dp.status,dp.checked_in_at FROM digital_passes dp JOIN commerce_orders o ON o.id=dp.order_id JOIN commerce_products p ON p.id=o.product_id LEFT JOIN order_attendees oa ON oa.id=dp.attendee_id WHERE p.forum=? ORDER BY oa.full_name`,
      [forum],
    );
    const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const csv = [
      'Pass number,Name,Email,Phone,Company,Status,Checked in at',
      ...rows.map((r) =>
        [r.pass_number, r.full_name, r.email, r.phone, r.company, r.status, r.checked_in_at]
          .map(esc)
          .join(','),
      ),
    ].join('\r\n');
    res
      .set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${forum}-checkins.csv"`,
      })
      .send(csv);
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/testimonials', requireAdmin, async (req, res, next) => {
  try {
    const forum = ['india', 'south'].includes(String(req.query.forum)) ? String(req.query.forum) : 'india';
    res.json(
      await query('SELECT * FROM exhibition_testimonials WHERE forum=? ORDER BY sort_order,id', [forum]),
    );
  } catch (error) {
    next(error);
  }
});
adminRouter.post('/testimonials', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const forum = ['india', 'south'].includes(String(req.body.forum)) ? String(req.body.forum) : 'india';
    const quote = String(req.body.quote || '').trim(),
      name = String(req.body.name || '').trim();
    if (!quote || !name) return res.status(422).json({ error: 'Quote and person name are required' });
    const result = await query(
      'INSERT INTO exhibition_testimonials (forum,quote,name,role,image_url,is_visible,sort_order) VALUES (?,?,?,?,?,1,?)',
      [
        forum,
        quote,
        name,
        String(req.body.role || '').slice(0, 1000),
        String(req.body.image_url || '').slice(0, 1000) || null,
        Number(req.body.sort_order) || 0,
      ],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});
adminRouter.put('/testimonials/:id', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const quote = String(req.body.quote || '').trim(),
      name = String(req.body.name || '').trim();
    if (!quote || !name) return res.status(422).json({ error: 'Quote and person name are required' });
    await query(
      'UPDATE exhibition_testimonials SET quote=?,name=?,role=?,image_url=?,is_visible=?,sort_order=? WHERE id=?',
      [
        quote,
        name,
        String(req.body.role || '').slice(0, 1000),
        String(req.body.image_url || '').slice(0, 1000) || null,
        req.body.is_visible ? 1 : 0,
        Number(req.body.sort_order) || 0,
        req.params.id,
      ],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

const cleanArticleHtml = (value) =>
  sanitizeHtml(String(value || ''), {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'br'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  });
adminRouter.get('/articles', requireAdmin, async (req, res, next) => {
  try {
    res.json(
      await query(
        'SELECT id,slug,title,excerpt,category,body_html,featured_image_url,seo_title,seo_description,status,publish_at,updated_at FROM articles ORDER BY updated_at DESC',
      ),
    );
  } catch (error) {
    next(error);
  }
});
adminRouter.post('/articles', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const slug = String(req.body.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '');
    const title = String(req.body.title || '').trim();
    if (!slug || !title) return res.status(422).json({ error: 'Title and slug are required' });
    const category =
      String(req.body.category || 'Industry Insights')
        .trim()
        .slice(0, 120) || 'Industry Insights';
    const result = await query(
      'INSERT INTO articles (slug,title,excerpt,category,body_html,featured_image_url,status,author_id) VALUES (?,?,?,?,?,?,?,?)',
      [
        slug,
        title,
        String(req.body.excerpt || '').slice(0, 4000),
        category,
        cleanArticleHtml(req.body.body_html),
        String(req.body.featured_image_url || '').slice(0, 1000) || null,
        'draft',
        req.session.adminId,
      ],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'That article slug already exists' });
    next(error);
  }
});
adminRouter.put('/articles/:id', requireAdmin, requireCsrf, async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM articles WHERE id=? LIMIT 1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Article not found' });
    await query(
      'INSERT INTO article_revisions (article_id,title,excerpt,body_html,changed_by) VALUES (?,?,?,?,?)',
      [existing[0].id, existing[0].title, existing[0].excerpt, existing[0].body_html, req.session.adminId],
    );
    const status = ['draft', 'scheduled', 'published', 'archived'].includes(req.body.status)
      ? req.body.status
      : 'draft';
    const publishAt =
      status === 'scheduled' ? new Date(req.body.publish_at) : status === 'published' ? new Date() : null;
    if (status === 'scheduled' && Number.isNaN(publishAt.getTime()))
      return res.status(422).json({ error: 'A valid publication date is required' });
    await query(
      'UPDATE articles SET title=?,excerpt=?,category=?,body_html=?,featured_image_url=?,seo_title=?,seo_description=?,status=?,publish_at=?,published_by=? WHERE id=?',
      [
        String(req.body.title || '').trim(),
        String(req.body.excerpt || '').slice(0, 4000),
        String(req.body.category || 'Industry Insights')
          .trim()
          .slice(0, 120) || 'Industry Insights',
        cleanArticleHtml(req.body.body_html),
        String(req.body.featured_image_url || '').slice(0, 1000) || null,
        String(req.body.seo_title || '').slice(0, 255),
        String(req.body.seo_description || '').slice(0, 500),
        status,
        publishAt,
        status === 'published' ? req.session.adminId : null,
        req.params.id,
      ],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { pool, query } from './db.js';
import { config } from './config.js';
import { currentAwardYear } from './subscriberCompanies.js';
import { sendGenericEmail } from './passService.js';

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const codeHash = (req, tokenHash, code) =>
  crypto
    .createHmac('sha256', config.sessionSecret)
    .update(JSON.stringify([req.sessionID, tokenHash, code]))
    .digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });
const invalid = () => fail(403, 'This invitation is unavailable or has expired.');
const checkoutUrl = (id) => `/checkout/?pass=awards-registration&application=${encodeURIComponent(id)}`;

function route(handler) {
  return async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
      await handler(req, res);
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  };
}

export function mountAwardInvitationAdmin(router, requireAdministrator, requireCsrf) {
  router.get(
    '/awards/invitations',
    requireAdministrator,
    route(async (req, res) => {
      const invitations = await query(
        'SELECT id,email,event_year,expires_at,revoked_at,application_id,expires_at<=NOW() AS expired FROM award_invitations ORDER BY id DESC LIMIT 100',
      );
      res.json(invitations);
    }),
  );
  router.post(
    '/awards/invitations',
    requireAdministrator,
    requireCsrf,
    route(async (req, res) => {
      const email = String(req.body?.email || '')
        .trim()
        .toLowerCase();
      if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw fail(422, 'Enter a valid recipient email address.');
      const token = crypto.randomBytes(32).toString('base64url');
      const year = await currentAwardYear(pool);
      await query(
        'INSERT INTO award_invitations (token_hash,email,event_year,expires_at) VALUES (?,?,?,NOW() + INTERVAL 7 DAY)',
        [hash(token), email, year],
      );
      res.status(201).json({
        url: `${config.publicOrigin.replace(/\/$/, '')}/business-excellence-awards/#invite=${token}`,
      });
    }),
  );
  router.post(
    '/awards/invitations/:id/revoke',
    requireAdministrator,
    requireCsrf,
    route(async (req, res) => {
      await query(
        'UPDATE award_invitations SET revoked_at=NOW(),otp_hash=NULL WHERE id=? AND revoked_at IS NULL',
        [req.params.id],
      );
      res.json({ ok: true });
    }),
  );
}

export function mountAwardInvitationPublic(router) {
  const limiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });
  router.post(
    '/awards/invitations/code',
    limiter,
    route(async (req, res) => {
      const token = String(req.body?.token || '');
      if (!/^[\w-]{43}$/.test(token)) throw invalid();
      const tokenHash = hash(token);
      const year = await currentAwardYear(pool);
      const [invite] = await query(
        'SELECT id,email FROM award_invitations WHERE token_hash=? AND event_year=? AND revoked_at IS NULL AND expires_at>NOW()',
        [tokenHash, year],
      );
      if (!invite) throw invalid();
      const code = String(crypto.randomInt(100000, 1000000));
      const digest = codeHash(req, tokenHash, code);
      const update = await query(
        `UPDATE award_invitations SET otp_hash=?,otp_sent_at=NOW(),otp_attempts=0
       WHERE id=? AND revoked_at IS NULL AND expires_at>NOW()
         AND (otp_sent_at IS NULL OR otp_sent_at<=NOW()-INTERVAL 60 SECOND)`,
        [digest, invite.id],
      );
      if (!update.affectedRows) throw fail(429, 'Please wait a minute before requesting another code.');
      let delivered = false;
      try {
        delivered = (
          await sendGenericEmail({
            to: invite.email,
            subject: 'Your Business Excellence Awards verification code',
            text: `Your verification code is ${code}. It expires in 10 minutes.`,
          })
        ).sent;
      } catch {
        // Keep provider errors and recipient details out of the public response.
      }
      if (!delivered) {
        await query('UPDATE award_invitations SET otp_hash=NULL WHERE id=? AND otp_hash=?', [
          invite.id,
          digest,
        ]);
        throw fail(503, 'The verification email could not be sent. Try again in a minute.');
      }
      // Express must persist the session cookie before the browser can verify the code.
      req.session.awardInviteChallenge = { tokenHash, digest };
      res.json({ ok: true });
    }),
  );

  router.post(
    '/awards/invitations/verify',
    limiter,
    route(async (req, res) => {
      const { tokenHash, digest: challengeDigest } = req.session.awardInviteChallenge || {};
      const code = String(req.body?.code || '');
      if (!tokenHash || !/^\d{6}$/.test(code)) throw fail(422, 'Request a code and enter all six digits.');
      const digest = codeHash(req, tokenHash, code);
      const year = await currentAwardYear(pool);
      const db = await pool.getConnection();
      try {
        await db.beginTransaction();
        const [[invite]] = await db.execute(
          `SELECT id,email,otp_hash,otp_attempts FROM award_invitations
         WHERE token_hash=? AND event_year=? AND revoked_at IS NULL AND expires_at>NOW()
           AND otp_sent_at>NOW()-INTERVAL 10 MINUTE FOR UPDATE`,
          [tokenHash, year],
        );
        if (!invite?.otp_hash || invite.otp_hash !== challengeDigest || invite.otp_attempts >= 5)
          throw fail(403, 'Request a new verification code.');
        if (!crypto.timingSafeEqual(Buffer.from(invite.otp_hash), Buffer.from(digest))) {
          await db.execute('UPDATE award_invitations SET otp_attempts=otp_attempts+1 WHERE id=?', [
            invite.id,
          ]);
          await db.commit();
          throw fail(422, 'The verification code is incorrect.');
        }
        await db.execute('UPDATE award_invitations SET otp_hash=NULL WHERE id=?', [invite.id]);
        await db.commit();
        req.session.awardInviteProof = { id: invite.id, verifiedUntil: Date.now() + 60 * 60_000 };
        delete req.session.awardInviteChallenge;
        res.json({ ok: true });
      } catch (error) {
        await db.rollback();
        throw error;
      } finally {
        db.release();
      }
    }),
  );

  router.get(
    '/awards/invitations/session',
    route(async (req, res) => {
      const proof = req.session.awardInviteProof;
      if (!proof || proof.verifiedUntil <= Date.now()) return res.json({ verified: false });
      const [invite] = await query(
        `SELECT i.email,i.application_id,a.public_id,a.status,a.archived_at FROM award_invitations i
       LEFT JOIN award_applications a ON a.id=i.application_id
       WHERE i.id=? AND i.event_year=? AND i.revoked_at IS NULL AND i.expires_at>NOW()`,
        [proof.id, await currentAwardYear(pool)],
      );
      if (!invite) return res.json({ verified: false });
      res.json({
        verified: true,
        email: invite.email,
        used: Boolean(invite.application_id),
        checkoutUrl:
          invite.status === 'payment_pending' && !invite.archived_at ? checkoutUrl(invite.public_id) : null,
      });
    }),
  );
}

export async function lockAwardInvitation(db, proof, email, eventYear) {
  if (!proof || proof.verifiedUntil <= Date.now()) throw invalid();
  const [[invite]] = await db.execute(
    `SELECT i.id,i.email,i.application_id,a.public_id,a.status,a.archived_at
     FROM award_invitations i LEFT JOIN award_applications a ON a.id=i.application_id
     WHERE i.id=? AND i.event_year=? AND i.revoked_at IS NULL AND i.expires_at>NOW() FOR UPDATE`,
    [proof.id, eventYear],
  );
  if (!invite || invite.email !== email) throw invalid();
  if (invite.application_id && (invite.status !== 'payment_pending' || invite.archived_at))
    throw fail(409, 'This invitation has already been used.');
  return { id: invite.id, checkoutUrl: invite.application_id ? checkoutUrl(invite.public_id) : null };
}

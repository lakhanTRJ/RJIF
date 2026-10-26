import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import { normalizeSubscriberContact, privateHash, subscriberActive } from './subscriberRules.js';

export function whatsappOtpPayload(to, code, settings) {
  return {
    messages: [
      {
        from: settings.sender,
        to,
        content: {
          templateName: settings.template,
          language: settings.language,
          templateData: { body: { placeholders: [code] }, buttons: [{ type: 'URL', parameter: code }] },
        },
      },
    ],
  };
}
export async function sendWhatsAppOtp(to, code, settings, fetchImpl = fetch) {
  const response = await fetchImpl('https://public.doubletick.io/whatsapp/message/template', {
    method: 'POST',
    headers: { Authorization: settings.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(whatsappOtpPayload(to, code, settings)),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => null);
  // Never expose provider responses: they can echo phone numbers or OTPs.
  if (
    !response.ok ||
    !result ||
    result.error ||
    (result.status && !['SENT', 'ACCEPTED', 'SUCCESS', 'success'].includes(result.status))
  )
    throw new Error('WhatsApp verification delivery failed. Try email or contact the organiser.');
}
export function createSubscriberVerificationRouter({
  pool,
  query,
  config,
  sendGenericEmail,
  sendWhatsApp = sendWhatsAppOtp,
}) {
  const subscriberVerificationRouter = Router();
  const ready = () => ({
    email: Boolean(config.smtp.host && config.smtp.user && config.smtp.password && config.smtp.from),
    whatsapp: Boolean(config.doubletick.apiKey && config.doubletick.sender),
  });
  subscriberVerificationRouter.get('/channels', (req, res) =>
    res.set('Cache-Control', 'no-store').json(ready()),
  );
  const sendLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many code requests. Please try again later.' },
  });
  const verifyLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many verification attempts. Please try again later.' },
  });
  subscriberVerificationRouter.post('/request', sendLimit, async (req, res, next) => {
    const channel = req.body.channel;
    const contact = normalizeSubscriberContact(channel, req.body.contact);
    if (!contact || req.body.consent !== true)
      return res
        .status(422)
        .json({ error: 'Enter a valid registered contact and agree to receive a verification code.' });
    if (!ready()[channel])
      return res
        .status(503)
        .json({ error: 'This verification channel is not available yet. Choose another channel.' });
    req.session.subscriberNonce ||= crypto.randomBytes(32).toString('hex');
    delete req.session.subscriberProof;
    const contactHash = privateHash(config.sessionSecret, `${channel}:${contact}`);
    const sessionHash = privateHash(config.sessionSecret, req.session.subscriberNonce);
    const id = crypto.randomUUID(),
      code = String(crypto.randomInt(100000, 1000000));
    const db = await pool.getConnection();
    let subscriber;
    try {
      await db.beginTransaction();
      const [[row]] = await db.execute(
        `SELECT *,DATE_FORMAT(valid_until,'%Y-%m-%d') AS valid_until FROM magazine_subscribers WHERE ${channel === 'email' ? 'email' : 'mobile'}=? FOR UPDATE`,
        [contact],
      );
      subscriber = subscriberActive(row) ? row : null;
      const [[count]] = await db.execute(
        'SELECT COUNT(*) AS total,MAX(created_at) AS latest FROM subscriber_otp_challenges WHERE contact_hash=? AND created_at>DATE_SUB(NOW(),INTERVAL 1 HOUR)',
        [contactHash],
      );
      if (
        Number(count.total) >= 5 ||
        (count.latest && Date.now() - new Date(count.latest).getTime() < 60000)
      ) {
        await db.rollback();
        return res
          .status(429)
          .json({ error: 'Wait at least 60 seconds between codes. Maximum five requests per hour.' });
      }
      await db.execute(
        'UPDATE subscriber_otp_challenges SET consumed_at=NOW() WHERE session_hash=? AND consumed_at IS NULL',
        [sessionHash],
      );
      await db.execute(
        'INSERT INTO subscriber_otp_challenges (id,subscriber_id,channel,contact_hash,session_hash,code_hash,expires_at) VALUES (?,?,?,?,?,?,?)',
        [
          id,
          subscriber?.id || null,
          channel,
          contactHash,
          sessionHash,
          privateHash(config.sessionSecret, `${id}:${code}`),
          new Date(Date.now() + 5 * 60000),
        ],
      );
      await db.commit();
    } catch (error) {
      await db.rollback();
      return next(error);
    } finally {
      db.release();
    }
    if (subscriber) {
      try {
        if (channel === 'whatsapp') await sendWhatsApp(contact, code, config.doubletick);
        else {
          const result = await sendGenericEmail({
            to: contact,
            subject: 'Your magazine subscriber verification code',
            text: `Your verification code is ${code}. It expires in 5 minutes. Do not share it. This code verifies eligibility for the Business Excellence Awards subscriber discount.`,
          });
          if (!result.sent) throw new Error('Email unavailable');
        }
        await query('UPDATE subscriber_otp_challenges SET sent_at=NOW() WHERE id=?', [id]);
      } catch {
        await query('UPDATE subscriber_otp_challenges SET consumed_at=NOW() WHERE id=?', [id]);
        return res
          .status(503)
          .json({ error: 'Unable to deliver the code. Please try another channel or try later.' });
      }
    }
    // Same response for non-matches: do not publish the subscriber list.
    res.set('Cache-Control', 'no-store').json({
      challengeId: id,
      expiresIn: 300,
      message:
        'If this contact belongs to an eligible active 5-year subscriber, a code has been sent. Check your registered contact.',
    });
  });
  subscriberVerificationRouter.post('/verify', verifyLimit, async (req, res, next) => {
    const id = String(req.body.challengeId || ''),
      code = String(req.body.code || '');
    if (!/^[0-9a-f-]{36}$/.test(id) || !/^\d{6}$/.test(code) || !req.session.subscriberNonce)
      return res.status(422).json({ error: 'Enter a valid verification code.' });
    const db = await pool.getConnection();
    try {
      await db.beginTransaction();
      const [[challenge]] = await db.execute(
        'SELECT * FROM subscriber_otp_challenges WHERE id=? FOR UPDATE',
        [id],
      );
      const valid =
        challenge &&
        challenge.session_hash === privateHash(config.sessionSecret, req.session.subscriberNonce) &&
        !challenge.consumed_at &&
        challenge.sent_at &&
        new Date(challenge.expires_at) > new Date() &&
        challenge.attempts < 5;
      if (!valid) {
        await db.rollback();
        return res.status(422).json({ error: 'Invalid or expired code. Request a new code.' });
      }
      await db.execute('UPDATE subscriber_otp_challenges SET attempts=attempts+1 WHERE id=?', [id]);
      const expected = privateHash(config.sessionSecret, `${id}:${code}`);
      if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(challenge.code_hash))) {
        await db.commit();
        return res.status(422).json({ error: 'Invalid code. A maximum of five attempts is allowed.' });
      }
      const [[subscriber]] = await db.execute(
        "SELECT *,DATE_FORMAT(valid_until,'%Y-%m-%d') AS valid_until FROM magazine_subscribers WHERE id=?",
        [challenge.subscriber_id],
      );
      if (!subscriberActive(subscriber)) {
        await db.rollback();
        return res
          .status(422)
          .json({ error: 'Subscriber eligibility has changed. Please contact the organiser.' });
      }
      const storedContact = normalizeSubscriberContact(
        challenge.channel,
        challenge.channel === 'email' ? subscriber.email : subscriber.mobile,
      );
      if (
        privateHash(config.sessionSecret, `${challenge.channel}:${storedContact}`) !== challenge.contact_hash
      ) {
        await db.rollback();
        return res.status(422).json({ error: 'Subscriber contact has changed. Request a new code.' });
      }
      await db.execute('UPDATE subscriber_otp_challenges SET consumed_at=NOW() WHERE id=?', [id]);
      await db.commit();
      req.session.subscriberProof = {
        subscriberId: subscriber.id,
        channel: challenge.channel,
        contactHash: challenge.contact_hash,
        verifiedAt: Date.now(),
        expiresAt: Date.now() + 30 * 60000,
      };
      res.set('Cache-Control', 'no-store').json({
        verified: true,
        discountPercent: 50,
        message:
          'Verified: 50% off the awards registration fee before GST. Use this same registered contact in your application.',
      });
    } catch (error) {
      await db.rollback();
      next(error);
    } finally {
      db.release();
    }
  });
  return subscriberVerificationRouter;
}

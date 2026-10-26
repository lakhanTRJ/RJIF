import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import {
  createSubscriberVerificationRouter,
  sendWhatsAppOtp,
  whatsappOtpPayload,
} from '../src/subscriberVerification.js';

function setup({ deliveryFails = false } = {}) {
  const subscriber = {
    id: 1,
    full_name: 'Subscriber',
    mobile: '+919876543210',
    email: 'test@example.com',
    is_active: 1,
    valid_until: '2099-01-01',
  };
  const challenges = [],
    messages = [];
  const execute = async (sql, args) => {
    if (sql.includes('FROM magazine_subscribers')) {
      const match = sql.includes('WHERE id=?')
        ? args[0] === subscriber.id
        : sql.includes('WHERE email=')
          ? args[0] === subscriber.email
          : args[0] === subscriber.mobile;
      return [match ? [{ ...subscriber }] : []];
    }
    if (sql.includes('COUNT(*)')) {
      const rows = challenges.filter((c) => c.contact_hash === args[0]);
      return [[{ total: rows.length, latest: rows.at(-1)?.created_at || null }]];
    }
    if (sql.startsWith('INSERT INTO subscriber_otp')) {
      const [id, subscriber_id, channel, contact_hash, session_hash, code_hash, expires_at] = args;
      challenges.push({
        id,
        subscriber_id,
        channel,
        contact_hash,
        session_hash,
        code_hash,
        expires_at,
        attempts: 0,
        sent_at: null,
        consumed_at: null,
        created_at: new Date(),
      });
    } else if (sql.includes('FROM subscriber_otp_challenges WHERE id='))
      return [[challenges.find((c) => c.id === args[0])].filter(Boolean)];
    else if (sql.includes('SET attempts=attempts+1')) challenges.find((c) => c.id === args[0]).attempts++;
    else if (sql.includes('SET sent_at=')) challenges.find((c) => c.id === args[0]).sent_at = new Date();
    else if (sql.includes('SET consumed_at=') && sql.includes('WHERE session_hash='))
      challenges
        .filter((c) => c.session_hash === args[0])
        .forEach((c) => {
          c.consumed_at = new Date();
        });
    else if (sql.includes('SET consumed_at='))
      challenges.find((c) => c.id === args[0]).consumed_at = new Date();
    else throw new Error(`Unexpected test query: ${sql}`);
    return [{ affectedRows: 1 }];
  };
  const db = {
    execute,
    beginTransaction: async () => {},
    rollback: async () => {},
    commit: async () => {},
    release() {},
  };
  const config = {
    sessionSecret: 'test-only-secret',
    smtp: { host: 'mock', user: 'mock', password: 'mock', from: 'mock' },
    doubletick: { apiKey: 'mock', sender: '+917718898960', template: 'code23', language: 'en' },
  };
  const app = express();
  app.use(express.json(), session({ secret: 'test-only-secret', resave: false, saveUninitialized: false }));
  app.use(
    '/verify',
    createSubscriberVerificationRouter({
      pool: { getConnection: async () => db },
      query: execute,
      config,
      sendWhatsApp: async (contact, code) => {
        if (deliveryFails) throw Error('provider rejected');
        messages.push({ contact, code });
      },
      sendGenericEmail: async ({ text }) => {
        messages.push({ code: text.match(/\b\d{6}\b/)[0] });
        return { sent: true };
      },
    }),
  );
  app.get('/proof', (req, res) => res.json(req.session.subscriberProof || null));
  return { app, agent: request.agent(app), subscriber, challenges, messages };
}
const send = (agent, contact = '+919876543210', channel = 'whatsapp') =>
  agent.post('/verify/request').send({ channel, contact, consent: true });

test('WhatsApp OTP verification is session-bound, single-use, and stores only hashed codes', async () => {
  const state = setup();
  const sent = await send(state.agent);
  assert.equal(sent.status, 200);
  const id = sent.body.challengeId,
    code = state.messages[0].code;
  assert.ok(!JSON.stringify(state.challenges).includes(`"${code}"`));
  const stranger = request.agent(state.app);
  assert.equal((await stranger.post('/verify/verify').send({ challengeId: id, code })).status, 422);
  const verified = await state.agent.post('/verify/verify').send({ challengeId: id, code });
  assert.equal(verified.body.discountPercent, 50);
  assert.equal((await state.agent.get('/proof')).body.subscriberId, 1);
  assert.equal((await state.agent.post('/verify/verify').send({ challengeId: id, code })).status, 422);
});
test('email verification works and non-subscribers get no OTP or eligibility information', async () => {
  const state = setup();
  const sent = await send(state.agent, ' TEST@example.com ', 'email');
  assert.equal(sent.status, 200);
  assert.equal(
    (
      await state.agent
        .post('/verify/verify')
        .send({ challengeId: sent.body.challengeId, code: state.messages[0].code })
    ).body.verified,
    true,
  );
  const other = setup();
  const response = await send(other.agent, '+919876543211');
  assert.equal(response.status, 200);
  assert.equal(response.body.message, sent.body.message);
  assert.equal(other.messages.length, 0);
  assert.equal(
    (
      await other.agent
        .post('/verify/verify')
        .send({ challengeId: response.body.challengeId, code: '123456' })
    ).status,
    422,
  );
});
test('wrong-code attempt cap, expiry, resend cooldown and subscriber revocation are enforced', async () => {
  const state = setup();
  const sent = await send(state.agent);
  const id = sent.body.challengeId;
  assert.equal((await send(state.agent)).status, 429);
  const wrong = state.messages[0].code === '123456' ? '654321' : '123456';
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await state.agent.post('/verify/verify').send({ challengeId: id, code: wrong })).status,
      422,
    );
  assert.equal(state.challenges[0].attempts, 5);
  assert.equal(
    (await state.agent.post('/verify/verify').send({ challengeId: id, code: state.messages[0].code })).status,
    422,
  );
  for (const expire of [true, false]) {
    const s = setup();
    const r = await send(s.agent);
    if (expire) s.challenges[0].expires_at = new Date(0);
    else s.subscriber.is_active = 0;
    assert.equal(
      (
        await s.agent
          .post('/verify/verify')
          .send({ challengeId: r.body.challengeId, code: s.messages[0].code })
      ).status,
      422,
    );
  }
});
test('provider failure cannot produce a verifiable challenge', async () => {
  const state = setup({ deliveryFails: true });
  assert.equal((await send(state.agent)).status, 503);
  assert.ok(state.challenges[0].consumed_at);
  assert.equal(state.challenges[0].sent_at, null);
});
test('DoubleTick payload uses the OTP in body and copy-code button; provider errors do not leak secrets', async () => {
  const settings = { sender: '+917718898960', template: 'code23', language: 'en', apiKey: 'private-key' };
  const payload = whatsappOtpPayload('+919876543210', '123456', settings);
  assert.deepEqual(payload.messages[0].content.templateData.body.placeholders, ['123456']);
  assert.equal(payload.messages[0].content.templateData.buttons[0].parameter, '123456');
  await sendWhatsAppOtp('+919876543210', '123456', settings, async () => ({
    ok: true,
    json: async () => ({ status: 'SENT' }),
  }));
  await assert.rejects(
    () =>
      sendWhatsAppOtp('+919876543210', '123456', settings, async () => ({
        ok: false,
        json: async () => ({ error: 'private-key 123456' }),
      })),
    (error) => !error.message.includes('123456') && !error.message.includes('private-key'),
  );
});

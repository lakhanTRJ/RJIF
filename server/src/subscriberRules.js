import crypto from 'node:crypto';

export function normalizeMobile(value) {
  let number = String(value || '')
    .trim()
    .replace(/[\s().-]/g, '');
  if (/^[6-9]\d{9}$/.test(number)) number = `+91${number}`;
  else if (/^91[6-9]\d{9}$/.test(number)) number = `+${number}`;
  else if (number.startsWith('00')) number = `+${number.slice(2)}`;
  return /^\+[1-9]\d{7,14}$/.test(number) ? number : '';
}
export function normalizeSubscriberContact(channel, value) {
  if (channel === 'whatsapp') return normalizeMobile(value);
  if (channel !== 'email') return '';
  const email = String(value || '')
    .trim()
    .toLowerCase();
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}
export const privateHash = (secret, value) => crypto.createHmac('sha256', secret).update(value).digest('hex');
export function subscriberActive(row, now = new Date()) {
  if (!row || !Number(row.is_active)) return false;
  const date =
    row.valid_until instanceof Date
      ? `${row.valid_until.getFullYear()}-${String(row.valid_until.getMonth() + 1).padStart(2, '0')}-${String(row.valid_until.getDate()).padStart(2, '0')}`
      : String(row.valid_until || '').slice(0, 10);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  return !date || date >= today;
}
export function subscriberMatches(row, channel, contactHash, applicant, secret) {
  if (!subscriberActive(row)) return false;
  const supplied = normalizeSubscriberContact(
    channel,
    channel === 'email' ? applicant.email : applicant.mobile,
  );
  return Boolean(
    supplied &&
      subscriberContacts(row, channel).includes(supplied) &&
      privateHash(secret, `${channel}:${supplied}`) === contactHash,
  );
}
export function subscriberContacts(row, channel) {
  return (channel === 'email' ? [row.email] : [row.mobile, row.mobile2])
    .map((value) => normalizeSubscriberContact(channel, value))
    .filter(Boolean);
}
export function validateSubscriber(body) {
  const full_name = String(body.full_name || '')
    .trim()
    .slice(0, 200);
  const company = String(body.company || '')
    .trim()
    .slice(0, 200);
  const mobile = normalizeMobile(body.mobile);
  const mobile2 = String(body.mobile2 || '').trim() ? normalizeMobile(body.mobile2) : null;
  const rawEmail = String(body.email || '').trim();
  const email = rawEmail ? normalizeSubscriberContact('email', rawEmail) : null;
  const valid_until = String(body.valid_until || '').trim();
  if (
    !full_name ||
    !company ||
    !mobile ||
    (body.mobile2 && !mobile2) ||
    mobile === mobile2 ||
    (rawEmail && !email)
  )
    throw Object.assign(
      new Error('Enter name, company, a valid mobile with country code, and a valid email if provided.'),
      { status: 422 },
    );
  if (
    valid_until &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(valid_until) ||
      Number.isNaN(Date.parse(valid_until)) ||
      new Date(valid_until).toISOString().slice(0, 10) !== valid_until)
  )
    throw Object.assign(new Error('Enter a valid subscription expiry date.'), { status: 422 });
  return {
    full_name,
    company,
    mobile,
    mobile2,
    email,
    valid_until: valid_until || null,
    is_active: body.is_active === false ? 0 : 1,
  };
}

export async function subscriberDiscount(executor, application, secret) {
  if (!application.subscriber_id) return 0;
  const [[subscriber]] = await executor.execute(
    "SELECT *,DATE_FORMAT(valid_until,'%Y-%m-%d') AS valid_until FROM magazine_subscribers WHERE id=? FOR UPDATE",
    [application.subscriber_id],
  );
  if (
    !subscriberMatches(
      subscriber,
      application.subscriber_channel,
      application.subscriber_contact_hash,
      application,
      secret,
    )
  )
    throw Object.assign(
      new Error(
        'Subscriber eligibility has changed. Please verify again or contact the organiser before paying.',
      ),
      { status: 409 },
    );
  return 50;
}

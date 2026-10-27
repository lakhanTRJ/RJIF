// Must be called inside a transaction. The contacts table enforces uniqueness
// across BOTH phone fields, including concurrent admin saves/imports.
export async function saveSubscriber(db, row, id = null) {
  await db.execute('INSERT IGNORE INTO subscriber_companies (name) VALUES (?)', [row.company]);
  const [[company]] = await db.execute('SELECT id FROM subscriber_companies WHERE name=?', [row.company]);
  if (id) {
    const [[existing]] = await db.execute('SELECT id FROM magazine_subscribers WHERE id=? FOR UPDATE', [id]);
    if (!existing) throw Object.assign(new Error('Subscriber not found.'), { status: 404 });
    await db.execute('DELETE FROM subscriber_mobile_contacts WHERE subscriber_id=?', [id]);
    await db.execute(
      'UPDATE magazine_subscribers SET full_name=?,company=?,company_id=?,mobile=?,mobile2=?,email=?,is_active=?,valid_until=? WHERE id=?',
      [
        row.full_name,
        row.company,
        company.id,
        row.mobile,
        row.mobile2,
        row.email,
        row.is_active,
        row.valid_until,
        id,
      ],
    );
  } else {
    const [result] = await db.execute(
      'INSERT INTO magazine_subscribers (full_name,company,company_id,mobile,mobile2,email,is_active,valid_until) VALUES (?,?,?,?,?,?,?,?)',
      [
        row.full_name,
        row.company,
        company.id,
        row.mobile,
        row.mobile2,
        row.email,
        row.is_active,
        row.valid_until,
      ],
    );
    id = result.insertId;
  }
  for (const mobile of [row.mobile, row.mobile2].filter(Boolean))
    await db.execute('INSERT INTO subscriber_mobile_contacts (mobile,subscriber_id) VALUES (?,?)', [
      mobile,
      id,
    ]);
  return id;
}

export async function reserveSubscriberBenefit(db, subscriberId, eventYear, applicationId) {
  const [[subscriber]] = await db.execute(
    'SELECT company_id FROM magazine_subscribers WHERE id=? FOR UPDATE',
    [subscriberId],
  );
  if (!subscriber?.company_id)
    throw Object.assign(new Error('Subscriber company is unavailable.'), { status: 409 });
  await db.execute(
    'INSERT IGNORE INTO subscriber_award_benefits (company_id,event_year,application_id) VALUES (?,?,?)',
    [subscriber.company_id, eventYear, applicationId],
  );
  const [[claim]] = await db.execute(
    'SELECT application_id FROM subscriber_award_benefits WHERE company_id=? AND event_year=? FOR UPDATE',
    [subscriber.company_id, eventYear],
  );
  if (Number(claim?.application_id) !== Number(applicationId))
    throw Object.assign(
      new Error(
        `This company already has a subscriber-discount registration for ${eventYear}. Resume the existing registration or contact the organiser. Regular-price registration is still available.`,
      ),
      { status: 409 },
    );
}

export async function currentAwardYear(db) {
  const [[row]] = await db.execute('SELECT content FROM award_settings WHERE id=1');
  const content = typeof row?.content === 'string' ? JSON.parse(row.content) : row?.content;
  const year = Number(content?.eventYear || 2027);
  if (!Number.isInteger(year) || year < 2027 || year > 2100) throw new Error('Invalid awards event year');
  return year;
}

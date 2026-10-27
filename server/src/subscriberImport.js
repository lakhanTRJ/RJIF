import { readSheet } from 'read-excel-file/node';
import { validateSubscriber, normalizeMobile, normalizeSubscriberContact } from './subscriberRules.js';

const invalid = (message) => Object.assign(new Error(message), { status: 422 });
// Bound expanded ZIP data before handing an administrator upload to the reader.
export function checkWorkbookSize(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > 2 * 1024 * 1024)
    throw invalid('Upload an XLSX file under 2 MB.');
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--)
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw invalid('Upload a valid XLSX workbook.');
  const count = buffer.readUInt16LE(end + 10),
    start = buffer.readUInt32LE(end + 16);
  if (count > 1000 || buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6))
    throw invalid('Workbook is too complex.');
  let offset = start,
    expanded = 0;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50)
      throw invalid('Invalid workbook archive.');
    expanded += buffer.readUInt32LE(offset + 24);
    if (expanded > 10 * 1024 * 1024 || buffer.readUInt16LE(offset + 8) & 1)
      throw invalid('Workbook is encrypted or expands beyond 10 MB.');
    offset +=
      46 +
      buffer.readUInt16LE(offset + 28) +
      buffer.readUInt16LE(offset + 30) +
      buffer.readUInt16LE(offset + 32);
  }
}

export function subscriberImportRows(data) {
  if (!Array.isArray(data) || data.length > 501) throw invalid('Import at most 500 subscribers at a time.');
  const headers = (data[0] || []).map((v) =>
    String(v || '')
      .trim()
      .toLowerCase(),
  );
  const columns = {
    full_name: 'name',
    company: 'company name',
    mobile: 'mobile 1',
    mobile2: 'mobile 2',
    email: 'email',
    valid_until: 'eligibility',
  };
  for (const field of ['full_name', 'company', 'mobile'])
    if (!headers.includes(columns[field])) throw invalid(`Missing column: ${columns[field]}.`);
  const result = [];
  for (let index = 1; index < data.length; index++) {
    if (!data[index].some((v) => v !== null && v !== undefined && String(v).trim())) continue;
    const raw = { is_active: true };
    for (const [key, label] of Object.entries(columns)) {
      const value = data[index][headers.indexOf(label)];
      raw[key] = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').trim();
    }
    let row,
      error = '';
    try {
      row = validateSubscriber(raw);
    } catch (e) {
      error = e.message;
    }
    result.push({ rowNumber: index + 1, record: row || raw, error });
  }
  const seen = new Map();
  for (const row of result) {
    const contacts = [
      normalizeMobile(row.record.mobile),
      normalizeMobile(row.record.mobile2),
      normalizeSubscriberContact('email', row.record.email),
    ].filter(Boolean);
    for (const contact of contacts) {
      const previous = seen.get(contact);
      if (previous && previous !== row) {
        previous.error ||= `Contact also appears in row ${row.rowNumber}. Resolve the duplicate before importing this row.`;
        row.error ||= `Contact also appears in row ${previous.rowNumber}. Resolve the duplicate before importing this row.`;
      } else seen.set(contact, row);
    }
  }
  return result;
}
export async function readSubscriberImport(buffer) {
  checkWorkbookSize(buffer);
  let data;
  try {
    data = await readSheet(buffer);
  } catch {
    throw invalid('Could not read XLSX. Save a fresh .xlsx copy and try again.');
  }
  return subscriberImportRows(data);
}

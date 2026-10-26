import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { registrationWorkbook } from '../src/registrationExports.js';

test('registration export is a valid workbook with typed amounts, text identifiers and separate attendees', async () => {
  const buffer = await registrationWorkbook('registrations', {
    orders: [
      {
        public_id: 'order-1',
        customer_name: '=HYPERLINK("bad")',
        phone: '+919876543210',
        payment_reference: '000123',
        quantity: 1,
        subtotal_paise: 2500000,
        discount_percent: '50.00',
        discount_paise: 2500000,
        tax_paise: 450000,
        total_paise: 2950000,
        created_at: new Date('2026-10-26T00:00:00Z'),
        status: 'paid',
      },
    ],
    attendees: [{ order_reference: 'order-1', attendee_number: 1, full_name: 'Guest', phone: '0012345' }],
  });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  assert.deepEqual(
    workbook.worksheets.map((s) => s.name),
    ['Registrations', 'Attendees'],
  );
  const ws = workbook.worksheets[0];
  const col = (header) => ws.getRow(1).values.indexOf(header);
  assert.equal(ws.getCell(2, col('Mobile')).value, '+919876543210');
  assert.equal(ws.getCell(2, col('UTR / receipt reference')).value, '000123');
  assert.equal(ws.getCell(2, col('Name')).value, '=HYPERLINK("bad")');
  assert.equal(ws.getCell(2, col('Name')).type, ExcelJS.ValueType.String);
  assert.equal(ws.getCell(2, col('Total (INR)')).value, 29500);
  assert.equal(ws.getCell(2, col('Discount (%)')).value, 0.5);
  assert.equal(ws.getCell(2, col('Created (IST)')).value.toISOString(), '2026-10-26T05:30:00.000Z');
  assert.equal(ws.views[0].ySplit, 1);
});
test('awards export retains unpaid applications and parses selected categories', async () => {
  const buffer = await registrationWorkbook('awards', {
    applications: [
      {
        application_reference: 'app-1',
        categories: '["Marketing","Digital"]',
        full_name: 'Applicant',
        application_status: 'payment_pending',
        total_paise: null,
      },
    ],
    orders: [],
  });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const ws = workbook.getWorksheet('Awards applications');
  const col = (header) => ws.getRow(1).values.indexOf(header);
  assert.equal(ws.getCell(2, col('Selected categories')).value, 'Marketing; Digital');
  assert.equal(ws.getCell(2, col('Total (INR)')).value, null);
  assert.equal(workbook.getWorksheet('Awards payments').rowCount, 1);
});

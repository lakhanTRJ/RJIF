import writeExcelFile from 'write-excel-file/node';

const money = (value) => (value === null || value === undefined ? null : Number(value) / 100);
const text = (value) =>
  String(value ?? '')
    .split('')
    .filter((character) => character.charCodeAt(0) >= 32 || [9, 10, 13].includes(character.charCodeAt(0)))
    .join('')
    .slice(0, 32767);
const istDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Date(date.getTime() + 330 * 60000);
};
const categoryText = (value) => {
  try {
    const list = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(list) ? list.join('; ') : '';
  } catch {
    return text(value);
  }
};
const paymentMethod = (row) =>
  row.payment_method ||
  (row.provider_order_id
    ? 'razorpay'
    : row.total_paise !== null && Number(row.total_paise) === 0
      ? 'complimentary'
      : '');
const common = [
  ['Order reference', 'public_id', 40],
  ['Created (IST)', 'created_at', 23, istDate],
  ['Name', 'customer_name', 26],
  ['Company', 'company', 30],
  ['Email', 'email', 34],
  ['Mobile', 'phone', 21],
  ['GSTIN', 'gstin', 22],
  ['Billing address', 'billing_address', 45],
  ['Product', 'product_name', 32],
  ['Forum', 'forum', 14],
  ['Quantity', 'quantity', 12, Number],
  ['Taxable fee (INR)', 'subtotal_paise', 23, money],
  ['Discount (%)', 'discount_percent', 19, (v) => (v == null ? null : Number(v) / 100)],
  ['Discount (INR)', 'discount_paise', 21, money],
  ['Discount reason', 'discount_reason', 35],
  ['GST (INR)', 'tax_paise', 18, money],
  ['Total (INR)', 'total_paise', 21, money],
  ['Order status', 'status', 20],
  ['Payment method', 'payment_method', 20, (_v, row) => paymentMethod(row)],
  ['UTR / receipt reference', 'payment_reference', 28],
  ['Paid (IST)', 'paid_at', 23, istDate],
  ['Razorpay order ID', 'provider_order_id', 30],
  ['Razorpay payment ID', 'provider_payment_id', 30],
  ['Payment notes', 'payment_notes', 40],
];
function sheet(workbook, name, columns, rows) {
  const data = [
    columns.map(([value]) => ({
      value,
      type: String,
      fontWeight: 'bold',
      backgroundColor: '#931326',
      textColor: '#FFFFFF',
      wrap: true,
      height: 32,
    })),
  ];
  rows.forEach((row, index) =>
    data.push(
      columns.map(([header, key, , convert]) => {
        const value = convert ? convert(row[key], row) : text(row[key]);
        if (value === null || value === undefined) return null;
        const type = value instanceof Date ? Date : typeof value === 'number' ? Number : String;
        const format =
          convert === istDate
            ? 'dd-mmm-yyyy hh:mm'
            : convert === money
              ? '#,##0.00'
              : header === 'Discount (%)'
                ? '0.00%'
                : type === String
                  ? '@'
                  : undefined;
        return {
          value,
          type,
          format,
          wrap: true,
          alignVertical: 'top',
          ...(index % 2 === 0 ? { backgroundColor: '#F8F3F3' } : {}),
        };
      }),
    ),
  );
  workbook.push({
    sheet: name,
    data,
    columns: columns.map(([, , width]) => ({ width })),
    stickyRowsCount: 1,
  });
}
export async function registrationWorkbook(kind, data) {
  const workbook = [];
  if (kind === 'registrations') {
    sheet(workbook, 'Registrations', common, data.orders);
    sheet(
      workbook,
      'Attendees',
      [
        ['Order reference', 'order_reference', 40],
        ['Forum', 'forum', 14],
        ['Product', 'product_name', 32],
        ['Attendee number', 'attendee_number', 19, Number],
        ['Attendee name', 'full_name', 28],
        ['Email', 'email', 34],
        ['Mobile', 'phone', 21],
        ['Order status', 'order_status', 20],
        ['Pass status', 'pass_status', 18],
        ['Checked in (IST)', 'checked_in_at', 23, istDate],
      ],
      data.attendees,
    );
  } else if (kind === 'awards') {
    sheet(
      workbook,
      'Awards applications',
      [
        ['Application reference', 'application_reference', 40],
        ['Application created (IST)', 'application_created', 26, istDate],
        ['Applicant', 'full_name', 28],
        ['Company', 'company', 30],
        ['Mobile', 'mobile', 21],
        ['Email', 'email', 34],
        ['Coordinator', 'coordinator_name', 28],
        ['Coordinator mobile', 'coordinator_number', 23],
        ['City', 'city', 22],
        ['State', 'state', 22],
        ['GSTIN', 'gstin', 22],
        ['Billing address', 'billing_address', 45],
        ['Selected categories', 'categories', 65, categoryText],
        ['Application status', 'application_status', 22],
        ['Subscriber verified (IST)', 'subscriber_verified_at', 26, istDate],
        ...common.filter(
          ([, key]) =>
            ![
              'created_at',
              'customer_name',
              'company',
              'email',
              'phone',
              'gstin',
              'billing_address',
              'product_name',
              'forum',
              'quantity',
            ].includes(key),
        ),
      ],
      data.applications,
    );
    sheet(
      workbook,
      'Awards payments',
      [['Application reference', 'application_reference', 40], ...common],
      data.orders,
    );
  } else throw new Error('Unknown export type');
  return writeExcelFile(workbook, { fontFamily: 'Calibri', fontSize: 11 }).toBuffer();
}

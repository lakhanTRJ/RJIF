export function validateManualRegistration(body, product) {
  const text = (key, max = 255) =>
    String(body[key] || '')
      .trim()
      .slice(0, max);
  const fail = (message) => {
    throw Object.assign(new Error(message), { status: 422 });
  };
  const emailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (
    !product ||
    product.kind !== 'delegate_pass' ||
    !product.is_active ||
    Number(product.sale_price_paise) <= 0
  )
    fail('Select an active paid delegate pass.');
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20)
    fail('Quantity must be between 1 and 20.');
  const method = text('payment_method', 30);
  if (!['neft', 'rtgs', 'bank_transfer', 'cash', 'cheque', 'upi', 'other'].includes(method))
    fail('Select a payment method.');
  const reference = text('payment_reference', 190);
  if (!reference) fail('Enter a UTR, receipt number or payment reference.');
  const paidAt = new Date(body.paid_at);
  if (!Number.isFinite(paidAt.getTime()) || paidAt.getTime() > Date.now() + 300000)
    fail('Enter a valid payment date.');
  const customerName = text('customer_name'),
    company = text('company'),
    email = text('email').toLowerCase(),
    phone = text('phone', 40),
    address = text('billing_address', 2000);
  if (!customerName || !company || !emailValid(email) || !phone || !address)
    fail('Complete all customer and billing details.');
  const subtotal = Number(product.sale_price_paise) * quantity;
  const tax = Math.round((subtotal * Number(product.tax_rate)) / 100);
  const total = subtotal + tax;
  if (Math.round(Number(body.amount_received) * 100) !== total)
    fail('Amount received must equal the full total including GST.');
  const capacity = Number(product.member_count) * quantity;
  if (!Array.isArray(body.attendees) || body.attendees.length !== capacity)
    fail(`Enter all ${capacity} attendee details.`);
  const attendees = body.attendees.map((item, index) => {
    const full_name = String(item.full_name || '')
        .trim()
        .slice(0, 255),
      email = String(item.email || '')
        .trim()
        .toLowerCase()
        .slice(0, 255),
      phone = String(item.phone || '')
        .trim()
        .slice(0, 40);
    if (!full_name || !emailValid(email) || !phone) fail(`Complete attendee ${index + 1} details.`);
    return { full_name, email, phone };
  });
  if (body.confirmed !== true) fail('Confirm that the payment has been received.');
  return {
    quantity,
    method,
    reference,
    paidAt,
    customerName,
    company,
    email,
    phone,
    address,
    subtotal,
    tax,
    total,
    attendees,
    gstin: text('gstin', 40),
    notes: text('payment_notes', 2000),
  };
}

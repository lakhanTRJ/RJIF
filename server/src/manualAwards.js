import { awardPricing } from '../../client/src/awardPricing.js';

export function validateManualAward(body, product, allowedCategories) {
  const fail = (message) => {
    throw Object.assign(new Error(message), { status: 422 });
  };
  if (!product || product.kind !== 'award_fee' || !product.is_active || product.currency !== 'INR')
    fail('Select an active INR award registration fee.');
  const text = (key, max = 255) =>
    String(body[key] || '')
      .trim()
      .slice(0, max);
  const categories = Array.isArray(body.categories)
    ? [...new Set(body.categories.map(String).map((s) => s.trim()))]
    : [];
  if (!categories.length || categories.length > 20 || categories.some((s) => !allowedCategories.includes(s)))
    fail('Select valid award categories.');
  const fields = Object.fromEntries(
    [
      'full_name',
      'company',
      'mobile',
      'email',
      'coordinator_name',
      'coordinator_number',
      'city',
      'state',
      'billing_address',
      'gstin',
    ].map((key) => [
      key,
      text(
        key,
        key === 'billing_address'
          ? 2000
          : key === 'email'
            ? 255
            : key === 'gstin'
              ? 30
              : key === 'mobile' || key === 'coordinator_number'
                ? 40
                : key === 'city' || key === 'state'
                  ? 120
                  : 200,
      ),
    ]),
  );
  fields.email = fields.email.toLowerCase();
  if (
    Object.entries(fields).some(([key, value]) => key !== 'gstin' && !value) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)
  )
    fail('Complete all applicant, coordinator and billing details.');
  const method = text('payment_method', 30),
    reference = text('payment_reference', 190);
  if (!['neft', 'rtgs', 'bank_transfer', 'cash', 'cheque', 'upi', 'other'].includes(method) || !reference)
    fail('Enter a payment method and unique UTR/receipt reference.');
  const paidAt = new Date(body.paid_at);
  if (!Number.isFinite(paidAt.getTime()) || paidAt.getTime() > Date.now() + 300000)
    fail('Enter a valid payment date.');
  let pricing;
  try {
    pricing = awardPricing(
      Number(product.sale_price_paise),
      Number(product.tax_rate),
      body.discount_percent || 0,
    );
  } catch (error) {
    fail(error.message);
  }
  const reason = text('discount_reason', 500);
  if (pricing.discountPercent > 0 && !reason) fail('Enter a reason for the discount.');
  if (
    !/^\d+(?:\.\d{1,2})?$/.test(String(body.amount_received)) ||
    Math.round(Number(body.amount_received) * 100) !== pricing.total
  )
    fail('Amount received must match the discounted total including GST.');
  if (body.confirmed !== true) fail('Confirm that you have verified the received funds.');
  return {
    fields,
    categories,
    method,
    reference,
    paidAt,
    pricing,
    reason,
    notes: text('payment_notes', 2000),
  };
}

export function awardConfirmation(application, total, currency = 'INR') {
  const categories =
    typeof application.categories === 'string' ? JSON.parse(application.categories) : application.categories;
  return {
    subject: 'Your Business Excellence Awards registration',
    text: [
      `Dear ${application.full_name},`,
      '',
      'Your payment and Business Excellence Awards application have been confirmed.',
      `Application reference: ${application.public_id}`,
      `Amount paid: ${currency} ${(Number(total) / 100).toFixed(2)}`,
      '',
      'Selected categories:',
      ...categories.map((s) => `- ${s}`),
      '',
      'One registration fee covers the selected categories. This confirmation is not a delegate QR pass.',
    ].join('\n'),
  };
}

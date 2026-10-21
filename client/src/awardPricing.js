export function awardPricing(price, taxRate, percent = 0) {
  const base = Number(price);
  const discountPercent = Number(percent);
  if (
    !Number.isSafeInteger(base) ||
    base <= 0 ||
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent >= 100 ||
    Math.abs(discountPercent * 100 - Math.round(discountPercent * 100)) > 0.000001
  )
    throw new Error('Discount must be between 0 and 99.99%, with at most two decimal places.');
  const discount = Math.round((base * Math.round(discountPercent * 100)) / 10000);
  const subtotal = base - discount;
  const tax = Math.round((subtotal * Number(taxRate)) / 100);
  const total = subtotal + tax;
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isFinite(Number(taxRate)) || Number(taxRate) < 0)
    throw new Error('Invalid award fee or tax configuration.');
  return { base, discountPercent, discount, subtotal, tax, total };
}

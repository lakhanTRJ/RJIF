import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import defaults from '../../data/awards.content.json';
import { awardPricing } from '../../awardPricing.js';

const fields = [
  ['full_name', 'Applicant name'],
  ['company', 'Company'],
  ['mobile', 'Mobile'],
  ['email', 'Email', 'email'],
  ['coordinator_name', 'Coordinator name'],
  ['coordinator_number', 'Coordinator phone'],
  ['city', 'City'],
  ['state', 'State'],
  ['gstin', 'GSTIN (optional)'],
];
const money = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value / 100);
export default function ManualAwardForm({ awards, onCreated }) {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [percent, setPercent] = useState('0');
  const [applicationId, setApplicationId] = useState('');
  const [details, setDetails] = useState({});
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState(null);
  useEffect(() => {
    api('/admin/products')
      .then((rows) => {
        const options = rows.filter((p) => p.kind === 'award_fee' && p.is_active && p.currency === 'INR');
        setProducts(options);
        setProductId(String(options[0]?.id || ''));
      })
      .catch((e) => setMessage(e.message));
  }, []);
  const product = products.find((p) => String(p.id) === productId);
  const options =
    (awards.content?.accordions || defaults.accordions).find((s) => s.key === 'categories')?.groups || [];
  let pricing, pricingError;
  try {
    if (product) pricing = awardPricing(Number(product.sale_price_paise), Number(product.tax_rate), percent);
  } catch (e) {
    pricingError = e.message;
  }
  const selectApplication = (id) => {
    const row = awards.applications.find((a) => a.public_id === id);
    setApplicationId(id);
    setDetails(
      row
        ? Object.fromEntries(
            [...fields.map(([name]) => name), 'billing_address'].map((name) => [name, row[name] || '']),
          )
        : {},
    );
    setCategories(
      row ? (typeof row.categories === 'string' ? JSON.parse(row.categories) : row.categories) : [],
    );
  };
  return (
    <form
      className="admin-card"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || result) return;
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        setBusy(true);
        setMessage('');
        try {
          const response = await api('/admin/awards/manual', {
            method: 'POST',
            body: JSON.stringify({
              ...data,
              ...details,
              categories,
              product_id: productId,
              application_public_id: applicationId || null,
              discount_percent: percent,
              paid_at: new Date(data.paid_at).toISOString(),
              confirmed: data.confirmed === 'on',
              idempotency_key: key,
            }),
          });
          setResult(response);
          setMessage(
            'Offline award registration saved. Confirmation email queued; no delegate QR pass is issued.',
          );
          try {
            await onCreated();
          } catch {
            setMessage(
              'Registration saved. Refresh the page to update the list. Do not submit the payment again.',
            );
          }
        } catch (e) {
          setMessage(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Offline / NEFT award registration</h2>
      <p>
        One fee covers multiple categories. Discounts apply before GST. Confirm payment in your bank or cash
        records first.
      </p>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {result ? (
        <>
          {result.applicationId && <p>Application reference: {result.applicationId}</p>}
          <button
            type="button"
            className="button small"
            onClick={() => {
              setResult(null);
              setMessage('');
              setDetails({});
              setCategories([]);
              setApplicationId('');
              setPercent('0');
              setKey(crypto.randomUUID());
            }}
          >
            Add another registration
          </button>
        </>
      ) : (
        <>
          <label>
            Application
            <select value={applicationId} onChange={(e) => selectApplication(e.target.value)}>
              <option value="">Create a new application</option>
              {awards.applications
                .filter((a) => ['pending', 'payment_pending'].includes(a.status))
                .map((a) => (
                  <option key={a.public_id} value={a.public_id}>
                    {a.full_name} — {a.company} — {a.public_id}
                  </option>
                ))}
            </select>
          </label>
          <small>
            Existing applications with an online payment attempt are blocked until that payment is reconciled,
            to prevent charging twice.
          </small>
          {fields.map(([name, label, type]) => (
            <label key={name}>
              {label}
              <input
                type={type || 'text'}
                name={name}
                value={details[name] || ''}
                required={name !== 'gstin'}
                maxLength={name === 'email' ? 255 : name === 'gstin' ? 30 : 120}
                onChange={(e) => setDetails({ ...details, [name]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Billing address
            <textarea
              name="billing_address"
              required
              maxLength={2000}
              value={details.billing_address || ''}
              onChange={(e) => setDetails({ ...details, billing_address: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>Award categories (select multiple)</legend>
            {options.map((item) => (
              <label key={item.title}>
                <input
                  type="checkbox"
                  checked={categories.includes(item.title)}
                  onChange={(e) =>
                    setCategories(
                      e.target.checked
                        ? [...categories, item.title]
                        : categories.filter((s) => s !== item.title),
                    )
                  }
                />{' '}
                {item.title}
              </label>
            ))}
          </fieldset>
          <label>
            Registration fee
            <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">Select fee</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {money(Number(p.sale_price_paise))} before GST
                </option>
              ))}
            </select>
          </label>
          <label>
            Discount (%)
            <input
              type="number"
              min="0"
              max="99.99"
              step="0.01"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              required
            />
          </label>
          <label>
            Discount reason
            <input name="discount_reason" maxLength={500} required={Number(percent) > 0} />
          </label>
          {pricingError && <p role="alert">{pricingError}</p>}
          {pricing && (
            <p>
              Registration fee: {money(pricing.base)}
              <br />
              Discount ({percent}%): −{money(pricing.discount)}
              <br />
              Taxable amount: {money(pricing.subtotal)}
              <br />
              GST ({product.tax_rate}%): {money(pricing.tax)}
              <br />
              <strong>Final payable: {money(pricing.total)}</strong>
            </p>
          )}
          <label>
            Payment method
            <select name="payment_method" required>
              {[
                ['neft', 'NEFT'],
                ['rtgs', 'RTGS'],
                ['bank_transfer', 'Bank transfer'],
                ['cash', 'Cash'],
                ['cheque', 'Cheque'],
                ['upi', 'UPI'],
                ['other', 'Other'],
              ].map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            UTR / receipt / payment reference
            <input name="payment_reference" required maxLength={190} />
          </label>
          <label>
            Payment date
            <input name="paid_at" type="datetime-local" required />
          </label>
          <label>
            Amount received (₹, including GST)
            <input name="amount_received" type="number" min="0.01" step="0.01" required />
          </label>
          <label>
            Notes
            <textarea name="payment_notes" maxLength={2000} />
          </label>
          <label>
            <input type="checkbox" name="confirmed" required /> I have verified receipt of the full discounted
            amount, including GST.
          </label>
          <button className="button small" disabled={busy || !pricing || !categories.length}>
            {busy ? 'Saving…' : 'Record payment and email confirmation'}
          </button>
        </>
      )}
    </form>
  );
}

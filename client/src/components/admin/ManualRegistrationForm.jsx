import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function ManualRegistrationForm({ onCreated }) {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [key] = useState(() => crypto.randomUUID());
  useEffect(() => {
    api('/admin/products')
      .then((rows) =>
        setProducts(
          rows.filter((p) => p.kind === 'delegate_pass' && p.is_active && Number(p.sale_price_paise) > 0),
        ),
      )
      .catch((e) => setError(e.message));
  }, []);
  const product = products.find((p) => String(p.id) === productId);
  const capacity = product ? Number(product.member_count) * quantity : 0;
  const subtotal = Number(product?.sale_price_paise || 0) * quantity;
  const tax = Math.round((subtotal * Number(product?.tax_rate || 0)) / 100);
  const total = subtotal + tax;
  const money = (paise) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await api('/admin/registrations/manual', {
        method: 'POST',
        body: JSON.stringify({
          ...fields,
          product_id: productId,
          quantity,
          paid_at: new Date(fields.paid_at).toISOString(),
          confirmed: fields.confirmed === 'on',
          idempotency_key: key,
          attendees: Array.from({ length: capacity }, (_, index) => ({
            full_name: fields[`name_${index}`],
            email: fields[`email_${index}`],
            phone: fields[`phone_${index}`],
          })),
        }),
      });
      setResult(response);
      await onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <div className="admin-card">
        <h2>Manual payment recorded</h2>
        <p>
          The passes are ready and the email has been queued for the billing contact. You can share the
          registration link or use Email passes to resend.
        </p>
        <a className="button small" href={result.manageUrl} target="_blank" rel="noreferrer">
          Open registration and passes
        </a>
      </div>
    );
  return (
    <form className="admin-card" onSubmit={submit}>
      <h2>Add manual payment registration</h2>
      <p>
        Use this after confirming the full payment in your bank statement or cash records. Enter a unique UTR
        or receipt number.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <label>
        Pass type
        <select required value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Choose a pass</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.forum === 'south' ? 'South' : 'India'} — {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input
          type="number"
          min="1"
          max="20"
          required
          value={quantity}
          onChange={(e) => setQuantity(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
        />
      </label>
      {product && (
        <p>
          <b>
            {capacity} attendee{capacity === 1 ? '' : 's'} · {money(subtotal)} + GST {money(tax)} ={' '}
            {money(total)}
          </b>
        </p>
      )}
      <fieldset>
        <legend>Billing contact</legend>
        <label>
          Full name
          <input name="customer_name" required />
        </label>
        <label>
          Company
          <input name="company" required />
        </label>
        <label>
          Email — passes will be sent here
          <input name="email" type="email" required />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" required />
        </label>
        <label>
          GSTIN (optional)
          <input name="gstin" />
        </label>
        <label>
          Billing address
          <textarea name="billing_address" required />
        </label>
      </fieldset>
      <fieldset>
        <legend>Payment received</legend>
        <label>
          Payment method
          <select name="payment_method" required>
            <option value="neft">NEFT</option>
            <option value="rtgs">RTGS</option>
            <option value="bank_transfer">Bank transfer / IMPS</option>
            <option value="cash">Cash / in person</option>
            <option value="cheque">Cheque (cleared)</option>
            <option value="upi">Direct UPI</option>
            <option value="other">Other manual payment</option>
          </select>
        </label>
        <label>
          UTR / transaction reference / cash receipt number
          <input name="payment_reference" maxLength="190" required />
        </label>
        <label>
          Payment date and time
          <input name="paid_at" type="datetime-local" required />
        </label>
        <label>
          Amount received, including GST (₹)
          <input name="amount_received" type="number" min="0.01" step="0.01" required />
        </label>
        <label>
          Notes (optional)
          <textarea name="payment_notes" maxLength="2000" />
        </label>
      </fieldset>
      <fieldset>
        <legend>Attendee details</legend>
        <p>Enter every attendee to generate their individual QR passes.</p>
        {Array.from({ length: capacity }, (_, index) => (
          <fieldset key={index}>
            <legend>Attendee {index + 1}</legend>
            <label>
              Full name
              <input name={`name_${index}`} required />
            </label>
            <label>
              Email
              <input name={`email_${index}`} type="email" required />
            </label>
            <label>
              Phone
              <input name={`phone_${index}`} type="tel" required />
            </label>
          </fieldset>
        ))}
      </fieldset>
      <label className="check">
        <input type="checkbox" name="confirmed" required /> I have verified that the full payment has been
        received.
      </label>
      <button className="button small" disabled={busy || !product}>
        {busy ? 'Recording payment…' : 'Confirm payment and email passes'}
      </button>
    </form>
  );
}

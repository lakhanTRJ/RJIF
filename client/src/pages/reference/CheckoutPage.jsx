import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { SiteHeader, Footer } from '../../components/reference/ReferenceShared.jsx';
import { money } from './HomePage.jsx';

const checkoutPasses = {
  'india-single': {
    code: 'india-single',
    name: 'India Forum — Single Pass',
    sale_price_paise: 750000,
    tax_rate: 18,
    member_count: 1,
  },
  'india-corporate': {
    code: 'india-corporate',
    name: 'India Forum — Corporate Pass',
    sale_price_paise: 1800000,
    tax_rate: 18,
    member_count: 3,
  },
  'india-leadership': {
    code: 'india-leadership',
    name: 'India Forum — Leadership Pass',
    sale_price_paise: 2500000,
    tax_rate: 18,
    member_count: 5,
  },
  'india-non-retailer': {
    code: 'india-non-retailer',
    name: 'India Forum — Non-Retailer Pass',
    sale_price_paise: 1000000,
    tax_rate: 18,
    member_count: 1,
  },
  'south-group': {
    code: 'south-group',
    name: 'South Forum — Group Pass',
    sale_price_paise: 900000,
    tax_rate: 18,
    member_count: 3,
  },
  'south-non-retailer': {
    code: 'south-non-retailer',
    name: 'South Forum — Non-Retailer Pass',
    sale_price_paise: 750000,
    tax_rate: 18,
    member_count: 1,
  },
  'south-retailer': {
    code: 'south-retailer',
    name: 'South Forum — Retailer Individual Pass',
    sale_price_paise: 375000,
    tax_rate: 18,
    member_count: 1,
  },
  'awards-registration': {
    code: 'awards-registration',
    name: 'Business Excellence Awards Registration',
    sale_price_paise: 5000000,
    tax_rate: 18,
    member_count: 1,
  },
};

function Checkout({ path }) {
  const search = new URLSearchParams(window.location.search),
    selected = search.get('pass'),
    complimentary = search.get('complimentary') || '',
    awardApplication = search.get('application') || '';
  const [idempotencyKey] = useState(() => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  const [pass, setPass] = useState(checkoutPasses[selected] || null);
  const [loading, setLoading] = useState(!checkoutPasses[selected]);
  const [quantity, setQuantity] = useState(1);
  const [collectAttendees, setCollectAttendees] = useState(false);
  const [submitting, setSubmitting] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ code: selected || '' });
    if (complimentary) params.set('complimentary', complimentary);
    api(`/public/products?${params}`)
      .then((rows) => {
        const found = rows.find((item) => item.code === selected);
        if (active) setPass(found || null);
      })
      .catch(() => active && setPass(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [selected, complimentary]);
  const members = Math.max(1, Number(pass?.member_count) || 1);
  const attendeeCount = members * quantity;
  const unitPrice = Number(pass?.sale_price_paise || 0);
  const subtotal = unitPrice * quantity;
  const taxAmount = Math.round((subtotal * (Number(pass?.tax_rate) || 0)) / 100);
  const grandTotal = subtotal + taxAmount;
  const changeQuantity = (next) => setQuantity(Math.min(20, Math.max(1, next)));
  async function openPayment(registration) {
    const loaded =
      window.Razorpay ||
      (await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(window.Razorpay);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      }));
    if (!loaded) throw new Error('Secure payment window could not load. Please try again.');
    const g = registration.gateway;
    new loaded({
      key: g.keyId,
      order_id: g.orderId,
      amount: g.amount,
      currency: g.currency,
      name: g.name,
      prefill: g.prefill,
      description: 'Delegate pass registration',
      handler: async (response) => {
        try {
          const confirmed = await api('/public/payments/razorpay/verify', {
            method: 'POST',
            body: JSON.stringify(response),
          });
          setResult({
            ...registration,
            status: 'confirmed',
            manageUrl: confirmed.manageUrl,
            message: 'Payment confirmed. Your QR passes are ready.',
          });
        } catch (e) {
          setError(e.message);
        }
      },
    }).open();
  }
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const attendees = collectAttendees
      ? Array.from({ length: attendeeCount }, (_, index) => ({
          full_name: data.get(`attendee_name_${index}`),
          email: data.get(`attendee_email_${index}`),
          phone: data.get(`attendee_phone_${index}`),
        }))
      : [];
    try {
      const registration = await api('/public/checkout', {
        method: 'POST',
        body: JSON.stringify({
          product_code: pass.code,
          quantity,
          customer_name: data.get('customer_name'),
          company: data.get('company'),
          email: data.get('email'),
          phone: data.get('phone'),
          gstin: data.get('gstin'),
          billing_address: data.get('billing_address'),
          consent: Boolean(data.get('consent')),
          attendees,
          idempotency_key: idempotencyKey,
          complimentary_token: complimentary,
          award_application_id: awardApplication,
          policy_version: '2026-10-06',
        }),
      });
      if (registration.gateway) await openPayment(registration);
      else setResult(registration);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="reference-site checkout-page">
      <SiteHeader path={path} />
      <main>
        <header className="checkout-heading">
          <p>Secure registration</p>
          <h1>Complete your booking</h1>
          <span>Confirmed registrations receive individual QR passes by email.</span>
        </header>
        {result ? (
          <section className="checkout-result">
            <span className="result-check">✓</span>
            <h2>{result.status === 'confirmed' ? 'Registration confirmed' : 'Registration received'}</h2>
            <p>{result.message}</p>
            <Link className="ref-button" to={result.manageUrl}>
              View registration
            </Link>
          </section>
        ) : loading ? (
          <div className="status">Loading pass…</div>
        ) : pass ? (
          <div className="checkout-grid">
            <section className="checkout-summary">
              <div className="checkout-summary-head">
                <p className="eyebrow">Selected pass</p>
                <span>{pass.forum === 'south' ? 'South Forum' : 'India Forum'}</span>
              </div>
              <h2>{pass.name}</h2>
              {pass.description && <p className="checkout-description">{pass.description}</p>}
              <div className="checkout-pass-meta">
                <span>
                  <b>{members}</b>
                  {members === 1 ? ' attendee' : ' attendees'} per pass
                </span>
                <span>
                  <b>QR</b> digital entry
                </span>
              </div>
              <div className="quantity-row">
                <div>
                  <b>Quantity</b>
                  <small>Maximum 20 passes</small>
                </div>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    onClick={() => changeQuantity(quantity - 1)}
                    disabled={quantity === 1}
                  >
                    −
                  </button>
                  <input
                    aria-label="Quantity"
                    type="number"
                    min="1"
                    max="20"
                    value={quantity}
                    onChange={(event) => changeQuantity(Number(event.target.value) || 1)}
                  />
                  <button
                    type="button"
                    onClick={() => changeQuantity(quantity + 1)}
                    disabled={quantity === 20}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="price-breakdown">
                <div>
                  <span>
                    {money(unitPrice)} × {quantity}
                  </span>
                  <b>{money(subtotal)}</b>
                </div>
                {taxAmount > 0 && (
                  <div>
                    <span>GST ({pass.tax_rate}%)</span>
                    <b>{money(taxAmount)}</b>
                  </div>
                )}
                <div className="checkout-total">
                  <span>Total</span>
                  <strong>{subtotal === 0 ? 'Complimentary' : money(grandTotal)}</strong>
                </div>
              </div>
            </section>
            <form onSubmit={submit}>
              <div className="checkout-form-head">
                <span>2</span>
                <div>
                  <p className="eyebrow">Contact information</p>
                  <h2>Billing details</h2>
                </div>
              </div>
              {error && <p className="error">{error}</p>}
              <div className="checkout-form-grid">
                <label>
                  Full name
                  <input name="customer_name" autoComplete="name" required />
                </label>
                <label>
                  Company
                  <input name="company" autoComplete="organization" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" autoComplete="email" required />
                </label>
                <label>
                  Mobile number
                  <input name="phone" type="tel" autoComplete="tel" required />
                </label>
                <label>
                  GSTIN <small>Optional</small>
                  <input name="gstin" />
                </label>
                <label className="full-width">
                  Billing address
                  <textarea name="billing_address" rows="3" autoComplete="street-address" required />
                </label>
              </div>
              {members > 1 && (
                <label className="checkout-attendee-toggle">
                  <input
                    type="checkbox"
                    checked={collectAttendees}
                    onChange={(event) => setCollectAttendees(event.target.checked)}
                  />
                  <span>
                    Add attendee details now<small>Company bookings can submit names after payment.</small>
                  </span>
                </label>
              )}
              {collectAttendees && (
                <fieldset className="attendee-fields">
                  <legend>Attendee details</legend>
                  {Array.from({ length: attendeeCount }, (_, index) => (
                    <div key={index}>
                      <h3>Attendee {index + 1}</h3>
                      <label>
                        Name
                        <input name={`attendee_name_${index}`} required />
                      </label>
                      <label>
                        Email
                        <input name={`attendee_email_${index}`} type="email" required />
                      </label>
                      <label>
                        Mobile number
                        <input name={`attendee_phone_${index}`} type="tel" required />
                      </label>
                    </div>
                  ))}
                </fieldset>
              )}
              <label className="consent">
                <input name="consent" type="checkbox" required />
                <span>I agree to the terms, privacy, refund and cancellation policies.</span>
              </label>
              <button className="ref-button checkout-submit" disabled={submitting}>
                {submitting
                  ? 'Submitting…'
                  : subtotal === 0
                    ? 'Confirm complimentary pass'
                    : `Continue with ${money(grandTotal)}`}
              </button>
              {subtotal > 0 && (
                <small className="checkout-status">
                  Your QR passes are issued only after payment is confirmed.
                </small>
              )}
            </form>
          </div>
        ) : (
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Select a delegate pass from the India or South Forum page.</p>
            <Link className="ref-button" to="/#passes">
              View India passes
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Checkout;

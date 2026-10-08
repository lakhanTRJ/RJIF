import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { SiteHeader, Footer } from '../../components/reference/ReferenceShared.jsx';

function Registration({ path }) {
  const token = new URLSearchParams(window.location.search).get('token');
  const [order, setOrder] = useState(null),
    [error, setError] = useState(''),
    [saving, setSaving] = useState(false);
  const load = useCallback(
    () =>
      api(`/public/orders/${encodeURIComponent(token || '')}`)
        .then(setOrder)
        .catch((e) => setError(e.message)),
    [token],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function continuePayment() {
    setSaving(true);
    setError('');
    try {
      const registration = await api(`/public/orders/${encodeURIComponent(token)}/payment`, {
        method: 'POST',
        body: '{}',
      });
      const Razorpay =
        window.Razorpay ||
        (await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(window.Razorpay);
          script.onerror = () => resolve(null);
          document.head.appendChild(script);
        }));
      if (!Razorpay) throw new Error('Secure payment window could not load. Please try again.');
      const g = registration.gateway;
      new Razorpay({
        key: g.keyId,
        order_id: g.orderId,
        amount: g.amount,
        currency: g.currency,
        name: g.name,
        prefill: g.prefill,
        description:
          order.product_kind === 'award_fee'
            ? 'Business Excellence Awards registration'
            : 'Delegate pass registration',
        handler: async (response) => {
          await api('/public/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(response) });
          await load();
        },
      }).open();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function saveAttendees(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data = new FormData(event.currentTarget),
      attendees = Array.from({ length: order.capacity }, (_, index) => ({
        full_name: data.get(`name_${index}`),
        email: data.get(`email_${index}`),
        phone: data.get(`phone_${index}`),
      }));
    try {
      await api(`/public/orders/${encodeURIComponent(token)}/attendees`, {
        method: 'POST',
        body: JSON.stringify({ attendees }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  if (error && !order)
    return (
      <div className="reference-site checkout-page">
        <SiteHeader path={path} />
        <main>
          <div className="empty-cart">
            <h2>Registration unavailable</h2>
            <p>{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  return (
    <div className="reference-site checkout-page">
      <SiteHeader path={path} />
      <main className="registration-view">
        {!order ? (
          <div className="status">Loading registration…</div>
        ) : (
          <section>
            <p className="eyebrow">Registration {order.public_id}</p>
            <h1>{order.product_name}</h1>
            <p>
              <b>Status:</b> {order.status.replace('_', ' ')}
            </p>
            {error && <p className="error">{error}</p>}
            {!['paid', 'cancelled', 'refunded'].includes(order.status) && (
              <button className="ref-button" onClick={continuePayment} disabled={saving}>
                {saving ? 'Opening payment…' : 'Continue secure payment'}
              </button>
            )}
            {order.product_kind === 'award_fee' && order.status === 'paid' ? (
              <div className="award-payment-confirmation">
                <h2>Application confirmed</h2>
                <p>Your payment has been received for the following award categories:</p>
                <ul>
                  {(order.award_categories || []).map((category) => (
                    <li key={category}>{category}</li>
                  ))}
                </ul>
                <p>No separate entry fee is charged for the additional categories in this application.</p>
              </div>
            ) : order.product_kind === 'award_fee' ? (
              <p>Your application will be confirmed after payment is completed.</p>
            ) : order.passes.length ? (
              <div className="pass-links">
                {order.passes.map((pass) => (
                  <Link className="ref-button" key={pass.pass_number} to={pass.viewUrl}>
                    Open pass — {pass.pass_number}
                  </Link>
                ))}
              </div>
            ) : order.status === 'paid' && order.attendees.length === 0 ? (
              <form className="attendee-fields registration-attendees" onSubmit={saveAttendees}>
                <h2>Add attendee details</h2>
                <p>Enter the people who will use these passes. Each person receives an individual QR code.</p>
                {Array.from({ length: order.capacity }, (_, index) => (
                  <div key={index}>
                    <h3>Attendee {index + 1}</h3>
                    <label>
                      Name
                      <input name={`name_${index}`} required />
                    </label>
                    <label>
                      Email
                      <input name={`email_${index}`} type="email" required />
                    </label>
                    <label>
                      Mobile
                      <input name={`phone_${index}`} required />
                    </label>
                  </div>
                ))}
                <button className="ref-button" disabled={saving}>
                  {saving ? 'Issuing passes…' : 'Issue attendee passes'}
                </button>
              </form>
            ) : order.status === 'paid' ? (
              <p>Your passes are being prepared. Refresh this page shortly.</p>
            ) : (
              <p>Passes will appear after payment is confirmed.</p>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Registration;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { SiteHeader, SectionTitle, Footer } from '../../components/reference/ReferenceShared.jsx';

function Account({ path }) {
  const token = new URLSearchParams(window.location.search).get('token');
  const [state, setState] = useState(token ? { loading: true } : { loading: false }),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!token) return;
    api(`/public/account-access/${encodeURIComponent(token)}`)
      .then((data) => setState({ data }))
      .catch((error) => setState({ error: error.message }));
  }, [token]);
  async function requestLink(event) {
    event.preventDefault();
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await api('/public/account-access', {
        method: 'POST',
        body: JSON.stringify({ email: data.get('email') }),
      });
      setState({ message: result.message });
    } catch (error) {
      setState({ error: error.message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="reference-site checkout-page">
      <SiteHeader path={path} />
      <main>
        <SectionTitle>My Account</SectionTitle>
        {state.loading ? (
          <div className="status">Opening your registrations…</div>
        ) : state.data ? (
          <section className="registration-view">
            <p className="eyebrow">Registrations for {state.data.email}</p>
            <h1>Your registrations</h1>
            {state.data.orders.length ? (
              <div className="pass-links">
                {state.data.orders.map((order) => (
                  <Link className="ref-button" key={order.public_id} to={order.manageUrl}>
                    {order.product_name} — {String(order.status).replace('_', ' ')}
                  </Link>
                ))}
              </div>
            ) : (
              <p>No registrations were found.</p>
            )}
          </section>
        ) : (
          <div className="checkout-grid">
            <section>
              <h2>Access your registrations</h2>
              <p>
                Enter the email used at checkout. We will send a secure, time-limited link to view payment
                status and digital passes. No password is required.
              </p>
            </section>
            <form onSubmit={requestLink}>
              {state.error && <p className="error">{state.error}</p>}
              {state.message ? (
                <p className="status" role="status">
                  {state.message}
                </p>
              ) : (
                <>
                  <label>
                    Email address
                    <input name="email" type="email" autoComplete="email" required />
                  </label>
                  <button className="ref-button" disabled={busy}>
                    {busy ? 'Sending…' : 'Email secure access link'}
                  </button>
                </>
              )}
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Account;

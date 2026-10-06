import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { SiteHeader, Footer } from '../../components/reference/ReferenceShared.jsx';

function DelegatePass({ path }) {
  const token = new URLSearchParams(window.location.search).get('token');
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    api(`/public/passes/${encodeURIComponent(token || '')}`)
      .then((pass) => setState({ pass }))
      .catch((error) => setState({ error: error.message }));
  }, [token]);
  return (
    <div className="reference-site checkout-page">
      <SiteHeader path={path} />
      <main className="pass-view">
        {state.loading ? (
          <div className="status">Loading pass…</div>
        ) : state.error ? (
          <div className="empty-cart">
            <h2>Pass unavailable</h2>
            <p>{state.error}</p>
          </div>
        ) : (
          <article className="digital-pass">
            <header>
              <p>Retail Jeweller {state.pass.forum === 'south' ? 'South' : 'India'} Forum</p>
              <b>DELEGATE PASS</b>
            </header>
            <h1>{state.pass.full_name || 'Delegate'}</h1>
            <p>{state.pass.company}</p>
            <img
              src={`/api/public/passes/${encodeURIComponent(token)}/qr.svg`}
              alt="Delegate entry QR code"
            />
            <code>{state.pass.pass_number}</code>
            <dl>
              <div>
                <dt>Date</dt>
                <dd>{state.pass.event_date}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{state.pass.event_location}</dd>
              </div>
            </dl>
            <strong className={`pass-state ${state.pass.status}`}>
              {state.pass.status.replace('_', ' ')}
            </strong>
            <a className="ref-button" href={`/api/public/passes/${encodeURIComponent(token)}/pdf`}>
              Download PDF pass
            </a>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default DelegatePass;

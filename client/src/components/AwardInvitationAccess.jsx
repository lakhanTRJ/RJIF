import { useEffect, useState } from 'react';
import { api } from '../api.js';

const endpoint = '/public/awards/invitations';

export default function AwardInvitationAccess({ onAccess }) {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('invite'));
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      document.getElementById('categories')?.scrollIntoView();
      return;
    }
    let active = true;
    api(`${endpoint}/session`, { cache: 'no-store' })
      .then((access) => {
        if (active) onAccess(access);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, onAccess]);

  async function sendCode() {
    setBusy(true);
    setMessage('');
    try {
      await api(`${endpoint}/code`, { method: 'POST', body: JSON.stringify({ token }) });
      setSent(true);
      setMessage('Check the email address your invitation was issued to.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get('code');
    setBusy(true);
    setMessage('');
    try {
      await api(`${endpoint}/verify`, { method: 'POST', body: JSON.stringify({ code }) });
      const access = await api(`${endpoint}/session`, { cache: 'no-store' });
      if (!access.verified) throw new Error('This invitation is unavailable or has expired.');
      window.history.replaceState(window.history.state, '', '#categories');
      onAccess(access);
      setToken(null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="award-contact-grid">
      <div className="wide">
        <h2>{token ? 'Verify your invitation' : 'Registration is closed'}</h2>
        {token && (
          <>
            <p>We’ll send a code to the email address on your invitation.</p>
            <button type="button" className="ref-button" disabled={busy} onClick={sendCode}>
              {sent ? 'Resend code' : 'Send verification code'}
            </button>
            {sent && (
              <form onSubmit={verify}>
                <label>
                  Verification code
                  <input
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                  />
                </label>
                <button className="ref-button" disabled={busy}>
                  Verify code
                </button>
              </form>
            )}
          </>
        )}
        {message && <p role="status">{message}</p>}
      </div>
    </div>
  );
}

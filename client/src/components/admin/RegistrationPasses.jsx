import { useState } from 'react';
import { api } from '../../api.js';

export default function RegistrationPasses({ orderId, notify }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setBusy(true);
    setError('');
    try {
      setData(await api(`/admin/registrations/${orderId}/passes`));
    } catch (e) {
      setData(null);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy(path) {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
      notify('Secure link copied. Share it only with the intended customer.');
    } catch {
      notify('Could not copy. Open the link and copy the address from your browser.');
    }
  }
  return (
    <div className="admin-registration-passes">
      <button type="button" className="button small secondary" aria-expanded={open} onClick={toggle}>
        {open ? 'Hide passes' : 'View passes'}
      </button>
      {open && (
        <div className="admin-pass-panel">
          {busy && <p role="status">Loading passes…</p>}
          {error && <p role="alert">{error}</p>}
          {!busy && data && (
            <>
              <p>Secure links give access to this customer’s registration. Share privately.</p>
              <div className="admin-pass-actions">
                <a className="button small secondary" href={data.manageUrl} target="_blank" rel="noreferrer">
                  Open registration
                </a>
                <button type="button" className="button small secondary" onClick={() => copy(data.manageUrl)}>
                  Copy registration link
                </button>
              </div>
              {data.kind === 'award_fee' ? (
                <p>This is an award application; delegate passes do not apply.</p>
              ) : data.status !== 'paid' ? (
                <p>Passes are available after payment is confirmed.</p>
              ) : !data.passes.length ? (
                <p>
                  No passes have been issued. Open the registration to add missing attendee details. If
                  attendees are already entered, use the issue/retry action in Registrations.
                </p>
              ) : (
                data.passes.map((pass) => (
                  <div className="admin-pass-item" key={pass.pass_number}>
                    <strong>{pass.full_name || 'Delegate'}</strong>
                    <small>
                      {pass.email} · {pass.pass_number} · {pass.status.replaceAll('_', ' ')}
                    </small>
                    {pass.status === 'cancelled' ? (
                      <p>This pass is cancelled.</p>
                    ) : (
                      <div className="admin-pass-actions">
                        <a
                          className="button small secondary"
                          href={pass.viewUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View QR pass
                        </a>
                        <a className="button small secondary" href={pass.pdfUrl}>
                          Download PDF
                        </a>
                        <button
                          type="button"
                          className="button small secondary"
                          onClick={() => copy(pass.viewUrl)}
                        >
                          Copy secure link
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

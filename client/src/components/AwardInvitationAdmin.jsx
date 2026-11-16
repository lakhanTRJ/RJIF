import { useEffect, useState } from 'react';
import { api } from '../api.js';

const endpoint = '/admin/awards/invitations';

export default function AwardInvitationAdmin() {
  const [invitations, setInvitations] = useState([]);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api(endpoint)
      .then((rows) => {
        if (active) setInvitations(rows);
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  async function create(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get('email');
    setBusy(true);
    setMessage('');
    setUrl('');
    try {
      const result = await api(endpoint, { method: 'POST', body: JSON.stringify({ email }) });
      setUrl(result.url);
      form.reset();
      setInvitations(await api(endpoint));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id) {
    setBusy(true);
    setMessage('');
    try {
      await api(`${endpoint}/${id}/revoke`, { method: 'POST' });
      setUrl('');
      setInvitations(await api(endpoint));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card">
      <h2>Awards invitations</h2>
      <p>
        In Invite only mode, each invitation is valid for seven days and allows one application. Copy the link
        when you create it.
      </p>
      <form onSubmit={create}>
        <label>
          Recipient email <input name="email" type="email" maxLength={255} required />
        </label>
        <button disabled={busy}>Create invitation</button>
      </form>
      {url && (
        <div>
          <label>
            Private invitation link <input readOnly value={url} onFocus={(event) => event.target.select()} />
          </label>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setMessage('Invitation link copied.');
              } catch {
                setMessage('Select and copy the invitation link above.');
              }
            }}
          >
            Copy link
          </button>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {invitations.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Event year</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invite) => (
                <tr key={invite.id}>
                  <td>{invite.email}</td>
                  <td>{invite.event_year}</td>
                  <td>
                    {invite.revoked_at
                      ? 'Revoked'
                      : invite.expired
                        ? 'Expired'
                        : invite.application_id
                          ? 'Used'
                          : 'Active'}
                  </td>
                  <td>
                    {!invite.revoked_at && !invite.expired && (
                      <button type="button" disabled={busy} onClick={() => revoke(invite.id)}>
                        Revoke link
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

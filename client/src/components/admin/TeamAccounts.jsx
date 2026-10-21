import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function TeamAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetId, setResetId] = useState(null);
  const reload = async () => setAccounts(await api('/admin/team-accounts'));
  useEffect(() => {
    reload().catch((error) => setNotice(error.message));
  }, []);
  const action = async (work, message) => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      await work();
      setNotice(message);
      await reload();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section>
      <p>
        Article publishers can create, edit and publish all articles, and upload/reuse media. They cannot
        access registrations, payments, enquiries, website settings or team accounts.
      </p>
      <p>
        Share the login address <a href="/admin/login">/admin/login</a> and each person’s credentials
        privately. Disabling an account or resetting its password ends its existing access.
      </p>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <form
        className="admin-card"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const body = JSON.stringify(Object.fromEntries(new FormData(form)));
          action(async () => {
            await api('/admin/team-accounts', { method: 'POST', body });
            form.reset();
          }, 'Publisher account created. Share the credentials privately.');
        }}
      >
        <h2>Create article publisher</h2>
        <label>
          Email
          <input name="email" type="email" maxLength={255} required autoComplete="off" />
        </label>
        <label>
          Password (12+ characters)
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={72}
            required
            autoComplete="new-password"
          />
        </label>
        <button className="button small" disabled={busy}>
          {busy ? 'Saving…' : 'Create account'}
        </button>
      </form>
      <div className="admin-list">
        {accounts.map((account) => (
          <article className="admin-card" key={account.id}>
            <h3>{account.email}</h3>
            <p>
              {account.is_active ? 'Active' : 'Disabled'} · Article publisher
              {account.last_login_at
                ? ` · Last login ${new Date(account.last_login_at).toLocaleString()}`
                : ' · Not logged in yet'}
            </p>
            <button
              type="button"
              className="button small secondary"
              disabled={busy}
              onClick={() =>
                action(
                  () =>
                    api(`/admin/team-accounts/${account.id}`, {
                      method: 'PUT',
                      body: JSON.stringify({ is_active: !account.is_active }),
                    }),
                  account.is_active ? 'Publisher disabled.' : 'Publisher enabled.',
                )
              }
            >
              {account.is_active ? 'Disable' : 'Enable'}
            </button>{' '}
            <button
              type="button"
              className="button small secondary"
              disabled={busy}
              onClick={() => setResetId(resetId === account.id ? null : account.id)}
            >
              Reset password
            </button>
            {resetId === account.id && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const body = JSON.stringify(Object.fromEntries(new FormData(form)));
                  action(async () => {
                    await api(`/admin/team-accounts/${account.id}`, { method: 'PUT', body });
                    form.reset();
                    setResetId(null);
                  }, 'Password reset. Share the new password privately.');
                }}
              >
                <label>
                  New password
                  <input
                    name="password"
                    type="password"
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <button className="button small" disabled={busy}>
                  Save new password
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

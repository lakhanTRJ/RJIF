import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import SubscriberImport from './SubscriberImport.jsx';

const blank = {
  full_name: '',
  company: '',
  mobile: '',
  mobile2: '',
  email: '',
  valid_until: '',
  is_active: true,
};
export default function MagazineSubscribers() {
  const [rows, setRows] = useState([]),
    [search, setSearch] = useState(''),
    [record, setRecord] = useState({ ...blank });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  useEffect(() => {
    api('/admin/magazine-subscribers')
      .then(setRows)
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <section>
      <p>
        Add verified 5-year magazine subscribers only. Active, unexpired records qualify for 50% off the
        Business Excellence Awards fee after email or WhatsApp OTP verification. Mobile is required; email is
        optional. Either mobile can verify the same company. Only one subscriber-discount application per
        company per event year is allowed; unpaid applications can be resumed. Regular-price registrations are
        unrestricted.
      </p>
      <SubscriberImport
        onImported={async () => {
          setSearch('');
          setRows(await api('/admin/magazine-subscribers'));
        }}
      />
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <form
        className="admin-card"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setMessage('');
          try {
            await api(`/admin/magazine-subscribers${record.id ? `/${record.id}` : ''}`, {
              method: record.id ? 'PUT' : 'POST',
              body: JSON.stringify(record),
            });
            setRecord({ ...blank });
            setSearch('');
            setMessage('Subscriber saved.');
            setRows(await api('/admin/magazine-subscribers'));
          } catch (e) {
            setMessage(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>{record.id ? 'Edit subscriber' : 'Add 5-year subscriber'}</h2>
        {[
          ['full_name', 'Subscriber name'],
          ['company', 'Company'],
          ['mobile', 'Registered mobile (include country code)'],
          ['mobile2', 'Second registered mobile (optional)'],
          ['email', 'Registered email (optional)', 'email'],
          ['valid_until', 'Eligible until (optional)', 'date'],
        ].map(([key, label, type]) => (
          <label key={key}>
            {label}
            <input
              type={type || 'text'}
              value={record[key] || ''}
              required={!['email', 'valid_until', 'mobile2'].includes(key)}
              maxLength={key === 'email' ? 255 : 200}
              onChange={(e) => setRecord({ ...record, [key]: e.target.value })}
            />
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={Boolean(record.is_active)}
            onChange={(e) => setRecord({ ...record, is_active: e.target.checked })}
          />{' '}
          Active 5-year subscriber
        </label>
        <button className="button small" disabled={busy}>
          {busy ? 'Saving…' : 'Save subscriber'}
        </button>{' '}
        {record.id && (
          <button type="button" className="button small secondary" onClick={() => setRecord({ ...blank })}>
            Cancel editing
          </button>
        )}
      </form>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setRows(await api(`/admin/magazine-subscribers?search=${encodeURIComponent(search)}`));
          } catch (error) {
            setMessage(error.message);
          }
        }}
      >
        <label>
          Search subscribers
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <button className="button small secondary">Search</button>
      </form>
      <p>Showing up to 500 matching records. Search by name, company, mobile or email.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name / Company</th>
              <th>Registered contacts</th>
              <th>Eligibility</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.full_name}
                  <br />
                  {row.company}
                </td>
                <td>
                  {row.mobile}
                  <br />
                  {row.mobile2 && (
                    <>
                      {row.mobile2}
                      <br />
                    </>
                  )}
                  {row.email || 'No email'}
                </td>
                <td>
                  {row.is_active ? 'Active' : 'Disabled'}
                  <br />
                  {row.valid_until ? `Until ${row.valid_until}` : 'No expiry set'}
                </td>
                <td>
                  <button
                    type="button"
                    className="button small secondary"
                    onClick={() => {
                      setRecord({ ...row, is_active: Boolean(row.is_active) });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Edit / disable
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

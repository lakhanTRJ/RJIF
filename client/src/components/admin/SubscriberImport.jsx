import { useState } from 'react';
import { api } from '../../api.js';

export default function SubscriberImport({ onImported }) {
  const [file, setFile] = useState(null),
    [preview, setPreview] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <section className="admin-card">
      <h2>Import subscriber Excel</h2>
      <p>
        First worksheet, up to 500 rows / 2 MB. Headers: Name, Company Name, Mobile 1, Mobile 2, Email,
        Eligibility. Email, Mobile 2 and Eligibility are optional. Eligibility is the last eligible date, not
        the subscription start date. Imported records are active.
      </p>
      <p>
        Both mobile numbers share one company benefit per awards event year. Use the same company name for all
        contacts of that company. Existing contacts will never be overwritten.
      </p>
      <input
        type="file"
        accept=".xlsx"
        disabled={busy}
        onChange={(e) => {
          setFile(e.target.files[0] || null);
          setPreview(null);
          setError('');
        }}
        aria-label="Subscriber XLSX file"
      />
      <button
        type="button"
        className="button small secondary"
        disabled={!file || busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          setPreview(null);
          try {
            const data = new FormData();
            data.append('file', file);
            setPreview(
              await api('/admin/magazine-subscribers/import/preview', { method: 'POST', body: data }),
            );
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Preview import
      </button>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {preview && (
        <>
          <p>
            {preview.rows.length} rows reviewed. {preview.rows.filter((r) => !r.error).length} can be added.
            Flagged rows will be skipped. Nothing has been saved yet.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Excel row', 'Name / Company', 'Mobiles', 'Email', 'Eligible until', 'Result'].map(
                    (h) => (
                      <th key={h}>{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.rowNumber}>
                    <td>{r.rowNumber}</td>
                    <td>
                      {r.record.full_name}
                      <br />
                      {r.record.company}
                    </td>
                    <td>
                      {r.record.mobile}
                      <br />
                      {r.record.mobile2}
                    </td>
                    <td>{r.record.email}</td>
                    <td>{r.record.valid_until || 'No expiry'}</td>
                    <td>{r.error || 'Ready to add'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="button small"
            disabled={busy || !preview.rows.some((r) => !r.error)}
            onClick={async () => {
              if (
                !window.confirm(
                  'Add all ready rows as active subscribers? Flagged rows will be skipped. Existing records will not be overwritten.',
                )
              )
                return;
              setBusy(true);
              setError('');
              try {
                const result = await api('/admin/magazine-subscribers/import/confirm', {
                  method: 'POST',
                  body: JSON.stringify({ previewId: preview.id }),
                });
                setPreview(null);
                setError(`${result.imported} subscribers added. Flagged rows were not imported.`);
                await onImported();
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Working…' : 'Confirm: add ready rows only'}
          </button>
        </>
      )}
    </section>
  );
}

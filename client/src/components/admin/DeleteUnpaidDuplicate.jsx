import { useState } from 'react';
import { api } from '../../api.js';

export default function DeleteUnpaidDuplicate({ kind, row, paidRows, onDeleted, notify }) {
  const [open, setOpen] = useState(false),
    [replacement, setReplacement] = useState(''),
    [busy, setBusy] = useState(false);
  if (row.status === 'paid' || row.paid_at) return null;
  return (
    <div>
      <button type="button" className="button small secondary" disabled={busy} onClick={() => setOpen(!open)}>
        Delete unpaid duplicate
      </button>
      {open && (
        <div>
          <p>
            This hides only the unpaid duplicate. The paid entry and its passes remain unchanged. No refund is
            issued. Payment history is retained. Razorpay status will be checked; a late confirmed payment
            restores the entry.
          </p>
          <label>
            Paid entry to keep
            <select value={replacement} disabled={busy} onChange={(e) => setReplacement(e.target.value)}>
              <option value="">Select the matching paid entry</option>
              {paidRows
                .filter((paid) => paid.status === 'paid' && paid.id !== row.id)
                .map((paid) => (
                  <option key={paid.id} value={paid.id}>
                    #{paid.id} — {paid.customer_name || paid.full_name} — {paid.email} —{' '}
                    {paid.product_name || paid.event_year} —{' '}
                    {new Date(paid.created_at).toLocaleDateString('en-IN')}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            className="button small secondary"
            disabled={busy || !replacement}
            onClick={async () => {
              if (
                !window.confirm(
                  'Hide this UNPAID duplicate and keep the selected PAID entry? This does not refund or change the paid registration.',
                )
              )
                return;
              setBusy(true);
              try {
                await api(`/admin/${kind}/${row.id}/unpaid-duplicate`, {
                  method: 'DELETE',
                  body: JSON.stringify({ paid_replacement_id: Number(replacement) }),
                });
                await onDeleted();
                notify('Unpaid duplicate removed from the active list. Paid entry preserved.');
              } catch (error) {
                notify(error.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Removing…' : 'Confirm delete unpaid duplicate'}
          </button>
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { api } from '../../api.js';
import './awards-editor-popup.css';

export default function DeleteUnpaidDuplicate({ kind, row, onDeleted, notify }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (row.status === 'paid' || row.payment_status === 'paid' || row.paid_at) return null;
  return (
    <>
      <button
        type="button"
        className="button small secondary"
        onClick={() => {
          setError('');
          dialog.current.showModal();
        }}
      >
        Delete entry
      </button>
      <dialog
        ref={dialog}
        className="awards-editor-dialog"
        aria-label="Confirm delete entry"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <h2>Delete this unpaid entry?</h2>
        <p>
          <strong>{row.customer_name || row.full_name}</strong>
          <br />
          {row.company}
          <br />
          {row.email}
        </p>
        <p>
          This removes the entry from the active list. Payment history is retained. Paid entries and issued
          passes cannot be deleted. A late confirmed payment can restore the entry.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="awards-editor-actions">
          <button
            type="button"
            className="button small secondary"
            disabled={busy}
            onClick={() => dialog.current.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button small"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await api(`/admin/${kind}/${row.id}/unpaid-entry`, { method: 'DELETE' });
                await onDeleted();
                dialog.current?.close();
                notify('Unpaid entry removed from the active list.');
              } catch (failure) {
                setError(failure.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Checking payment and deleting…' : 'Confirm delete'}
          </button>
        </div>
      </dialog>
    </>
  );
}

import { useRef, useState } from 'react';
import './awards-editor-popup.css';

export default function AwardsEditorPopup({
  title,
  preview,
  children,
  snapshot,
  restore,
  save,
  remove,
  actionsOnly = false,
}) {
  const dialog = useRef(null);
  const original = useRef(null);
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function cancel() {
    if (busy) return;
    restore?.(original.current);
    dialog.current.close();
    setOpened(false);
  }
  return (
    <>
      <button
        type="button"
        className="awards-edit-preview"
        onClick={() => {
          original.current = structuredClone(snapshot);
          setError('');
          setOpened(true);
          dialog.current.showModal();
        }}
      >
        {preview}
        <strong>{title}</strong>
        <span>Click to edit</span>
      </button>
      <dialog
        className="awards-editor-dialog"
        ref={dialog}
        aria-label={`Edit ${title}`}
        onCancel={(event) => {
          event.preventDefault();
          cancel();
        }}
      >
        {opened && (
          <>
            <h2>Edit {title}</h2>
            <fieldset disabled={busy}>{children}</fieldset>
            {error && <p role="alert">{error}</p>}
            <div className="awards-editor-actions">
              {!actionsOnly && (
                <button
                  type="button"
                  className="button small"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await save();
                      dialog.current.close();
                      setOpened(false);
                    } catch (failure) {
                      setError(failure.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              )}
              <button type="button" className="button small secondary" disabled={busy} onClick={cancel}>
                Cancel
              </button>
              {remove && (
                <button
                  type="button"
                  className="button small secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await remove();
                    } catch (failure) {
                      setError(failure.message);
                      setBusy(false);
                    }
                  }}
                >
                  Remove section
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

import { useRef } from 'react';
import './awards-editor-popup.css';

export default function DetailsPopup({ title, children, label = 'View details', id }) {
  const dialog = useRef(null);
  return (
    <>
      <button type="button" className="button small secondary" onClick={() => dialog.current.showModal()}>
        {label}
      </button>
      <dialog id={id} ref={dialog} className="awards-editor-dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <div className="awards-editor-actions">
          <button type="button" className="button small secondary" onClick={() => dialog.current.close()}>
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}

import { useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';
import { speakerText } from '../../speakerText.js';
import { SpeakerGrid } from '../reference/ReferenceShared.jsx';
import ImageUploadField from './ImageUploadField.jsx';
import '../reference.css';
import './speaker-manager.css';

export default function SpeakerManager({ forum, eventYear, speakers, onSaved, notify }) {
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const opened = Boolean(editing);

  useEffect(() => {
    if (opened && !dialog.current.open) dialog.current.showModal();
    if (!opened && dialog.current.open) dialog.current.close();
  }, [opened]);

  function edit(speaker) {
    setError('');
    setEditing({
      ...speaker,
      name: speakerText(speaker.name),
      role: speakerText(speaker.role),
    });
  }

  function change(key, value) {
    setEditing((speaker) => ({ ...speaker, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const isNew = !editing.id;
    try {
      await api(isNew ? `/admin/forums/${forum}/speakers` : `/admin/speakers/${editing.id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(editing),
      });
      await onSaved();
      setEditing(null);
      notify(isNew ? 'Speaker added.' : 'Speaker saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p>Click a portrait or name to edit the speaker.</p>
      <button
        className="button small"
        type="button"
        onClick={() =>
          edit({
            name: '',
            role: '',
            image_url: '',
            event_year: eventYear || 2026,
            is_featured: false,
            is_published: true,
            sort_order: 0,
          })
        }
      >
        Add speaker
      </button>
      <div className="reference-site admin-speaker-preview">
        <SpeakerGrid
          speakers={speakers.map((speaker) => ({ ...speaker, image: speaker.image_url }))}
          onEdit={edit}
        />
        {!speakers.length && <p>No speakers match this year.</p>}
      </div>
      <dialog
        ref={dialog}
        className="speaker-editor-dialog"
        aria-labelledby="speaker-editor-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setEditing(null);
        }}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form onSubmit={save}>
            <h2 id="speaker-editor-title">{editing.id ? 'Edit speaker' : 'Add speaker'}</h2>
            <fieldset disabled={busy}>
              <label>
                Name
                <input
                  required
                  autoFocus
                  value={editing.name}
                  onChange={(event) => change('name', event.target.value)}
                />
              </label>
              <label>
                Role
                <input value={editing.role} onChange={(event) => change('role', event.target.value)} />
              </label>
              <ImageUploadField
                label="Speaker image"
                value={editing.image_url}
                onChange={(value) => change('image_url', value)}
                altText={editing.name}
              />
              <label>
                Event year
                <input
                  type="number"
                  required={!editing.id}
                  min="2000"
                  max="2100"
                  value={editing.event_year || ''}
                  onChange={(event) => change('event_year', event.target.value)}
                />
              </label>
              <label>
                Order
                <input
                  type="number"
                  value={editing.sort_order}
                  onChange={(event) => change('sort_order', event.target.value)}
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_featured)}
                  onChange={(event) => change('is_featured', event.target.checked)}
                />
                Show on homepage for this speaker’s event year
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_published)}
                  onChange={(event) => change('is_published', event.target.checked)}
                />
                Published
              </label>
            </fieldset>
            {error && <p role="alert">{error}</p>}
            <div className="speaker-editor-actions">
              <button className="button small" disabled={busy}>
                {busy ? 'Saving…' : 'Save speaker'}
              </button>
              <button
                className="button small secondary"
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

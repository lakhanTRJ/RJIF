import { useState } from 'react';
import { api } from '../../api.js';

export default function DocumentUploadField({
  label = 'PDF document',
  value = '',
  onChange,
  title = 'Business Excellence Awards document',
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('alt_text', title || file.name.replace(/\.pdf$/i, ''));
      body.append('source_page', 'Business Excellence Awards');
      const result = await api('/admin/media', { method: 'POST', body });
      onChange?.(result.url);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      event.target.value = '';
      setBusy(false);
    }
  }

  return (
    <div className="admin-document-upload">
      <label>
        {label}
        <input type="file" accept="application/pdf,.pdf" onChange={upload} />
      </label>
      {busy && <small>Uploading PDF…</small>}
      {error && <small className="error">{error}</small>}
      {value?.toLowerCase().includes('.pdf') && (
        <div className="admin-document-preview">
          <span aria-hidden="true">PDF</span>
          <a href={value} target="_blank" rel="noreferrer">
            Open uploaded document
          </a>
        </div>
      )}
    </div>
  );
}

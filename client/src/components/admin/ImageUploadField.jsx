import { useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';

export default function ImageUploadField({
  label = 'Image',
  value = '',
  onChange,
  name,
  required = false,
  altText = '',
}) {
  const [uploadedUrl, setUploadedUrl] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  const currentUrl = onChange ? value : uploadedUrl;

  useEffect(() => {
    if (onChange) return undefined;
    const form = rootRef.current?.closest('form');
    if (!form) return undefined;
    const reset = () => {
      setUploadedUrl(value);
      setError('');
    };
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [onChange, value]);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('alt_text', altText || file.name.replace(/\.[^.]+$/, '').replaceAll('-', ' '));
      const result = await api('/admin/media', { method: 'POST', body });
      setUploadedUrl(result.url);
      onChange?.(result.url);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-image-upload" ref={rootRef}>
      <label>
        {label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={required && !currentUrl}
          onChange={upload}
        />
      </label>
      {name && <input type="hidden" name={name} value={currentUrl || ''} />}
      {busy && <small>Uploading image…</small>}
      {error && <small className="error">{error}</small>}
      {currentUrl && (
        <div className="admin-image-preview">
          <img src={currentUrl} alt="Uploaded preview" />
          <span>Image uploaded and ready to save.</span>
        </div>
      )}
    </div>
  );
}

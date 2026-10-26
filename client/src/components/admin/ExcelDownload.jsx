import { useState } from 'react';

export default function ExcelDownload({ kind, notify }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="button small secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const response = await fetch(`/api/admin/exports/${kind}.xlsx`, {
            credentials: 'include',
            cache: 'no-store',
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Download failed. Please try again.');
          }
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${kind}-${new Date().toISOString().slice(0, 10)}.xlsx`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          notify('Excel download started. The file contains personal data; share it securely.');
        } catch (error) {
          notify(error.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Preparing Excel…' : 'Download Excel (.xlsx)'}
    </button>
  );
}

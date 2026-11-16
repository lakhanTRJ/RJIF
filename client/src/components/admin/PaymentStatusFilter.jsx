/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { api } from '../../api.js';

const paymentStatuses = {
  pending: 'Pending',
  payment_pending: 'Awaiting payment',
  payment_created: 'Payment created',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function paymentStatusLabel(status) {
  return paymentStatuses[status] || status;
}

export function usePaymentStatusFilter(kind, section, sourceRows) {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!status || section !== kind) return;
    let active = true;
    api(`/admin/${kind}?payment_status=${encodeURIComponent(status)}`)
      .then((data) => {
        if (active) setResult({ status, sourceRows, rows: kind === 'awards' ? data.applications : data });
      })
      .catch((error) => {
        if (active) setResult({ status, sourceRows, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [kind, section, status, sourceRows]);

  const current = result?.status === status && result.sourceRows === sourceRows ? result : null;
  return {
    status,
    setStatus,
    rows: status ? current?.rows || [] : sourceRows,
    loading: Boolean(status && !current),
    error: current?.error,
  };
}

export default function PaymentStatusFilter({ kind, filter }) {
  return (
    <div>
      <label>
        Payment status{' '}
        <select value={filter.status} onChange={(event) => filter.setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {[
            'paid',
            'payment_created',
            ...(kind === 'awards' ? ['payment_pending'] : []),
            'pending',
            'failed',
            'cancelled',
            'refunded',
          ].map((status) => (
            <option key={status} value={status}>
              {paymentStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      {filter.loading && <p role="status">Loading matching records…</p>}
      {filter.error && <p role="alert">{filter.error}</p>}
      {filter.status && !filter.loading && !filter.error && !filter.rows.length && (
        <p>No records match this payment status.</p>
      )}
    </div>
  );
}

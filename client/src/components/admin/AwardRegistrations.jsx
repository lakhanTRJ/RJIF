import { useRef, useState } from 'react';
import { paymentStatusLabel } from './PaymentStatusFilter.jsx';
import DeleteUnpaidDuplicate from './DeleteUnpaidDuplicate.jsx';
import './awards-editor-popup.css';

const money = (value) => value == null ? '—' : (Number(value) / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
function categories(value) {
  try {
    const list = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

export default function AwardRegistrations({ rows, applications, role, notify, reload }) {
  const dialog = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const selected = applications.find((row) => row.id === selectedId);
  function open(row) {
    setSelectedId(row.id);
    dialog.current.showModal();
  }
  function close() {
    dialog.current.close();
    setSelectedId(null);
  }
  return <>
    <div className="table-wrap"><table>
      <thead><tr><th>Name</th><th>Company</th><th>Amount</th><th>Payment status</th><th>Details</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.public_id}>
        <td><button type="button" className="award-registration-name" onClick={() => open(row)}>{row.full_name}</button></td>
        <td>{row.company}</td>
        <td>{money(row.total_paise)}</td>
        <td>{paymentStatusLabel(row.payment_status || row.status)}</td>
        <td><button type="button" className="button small secondary" onClick={() => open(row)}>View details</button></td>
      </tr>)}</tbody>
    </table></div>
    <dialog ref={dialog} className="awards-editor-dialog" aria-label="Award registration details" onClose={() => setSelectedId(null)}>
      {selected && <>
        <h2>{selected.full_name}</h2>
        <dl className="award-registration-details">
          {[
            ['Application reference', selected.public_id],
            ['Event year', selected.event_year],
            ['Registered', new Date(selected.created_at).toLocaleString()],
            ['Company', selected.company], ['Email', selected.email], ['Mobile', selected.mobile],
            ['Coordinator', selected.coordinator_name], ['Coordinator mobile', selected.coordinator_number],
            ['City', selected.city], ['State', selected.state], ['GSTIN', selected.gstin],
            ['Billing address', selected.billing_address],
            ['Payment status', paymentStatusLabel(selected.payment_status || selected.status)],
            ['Amount', money(selected.total_paise)],
            ['Payment method', selected.payment_method?.toUpperCase()],
            ['Payment reference', selected.payment_reference],
            ['Discount', selected.discount_percent == null ? null : `${selected.discount_percent}% (${money(selected.discount_paise)})`],
            ['Discount reason', selected.discount_reason],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}
        </dl>
        <h3>Selected categories</h3>
        <ul>{categories(selected.categories).map((category, index) => <li key={index}>{category}</li>)}</ul>
        {role === 'administrator' && selected.status !== 'paid' && <DeleteUnpaidDuplicate
          key={selected.id} kind="awards" row={selected} paidRows={applications} notify={notify}
          onDeleted={async () => { await reload(); close(); }} />}
      </>}
      <div className="awards-editor-actions"><button type="button" className="button small secondary" onClick={close}>Close</button></div>
    </dialog>
  </>;
}

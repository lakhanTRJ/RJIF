import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); setError('');
    const data = new FormData(event.currentTarget);
    try { const session=await api('/admin/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(data)) }); navigate(session.role==='event_staff'?'/admin/check-in':'/admin/pages'); }
    catch (e) { setError(e.message); }
  }
  return <main className="admin-shell center"><form className="admin-card login-card" onSubmit={submit}><p className="eyebrow">Team access</p><h1>Administrator login</h1>{error && <p className="error">{error}</p>}<label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="button" type="submit">Log in</button></form></main>;
}

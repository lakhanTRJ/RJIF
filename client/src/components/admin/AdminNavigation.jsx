import { Link } from 'react-router-dom';
import { adminRouteGroups, adminRoutes } from './adminRoutes.js';

export default function AdminNavigation({ role, section, onLogout }) {
  const groups =
    role === 'event_staff'
      ? [{ label: 'Event operations', items: adminRoutes.filter(([slug]) => slug === 'check-in') }]
      : adminRouteGroups;

  return (
    <aside className="admin-nav">
      <div className="admin-brand">
        <span>RJ</span>
        <div>
          <b>Forum Admin</b>
          <small>Website management</small>
        </div>
      </div>
      <nav>
        {groups.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map(([slug, label, description]) => (
              <Link className={section === slug ? 'active' : ''} key={slug} to={`/admin/${slug}`}>
                <span>{label}</span>
                <small>{description}</small>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="admin-nav-footer">
        <a href="/" target="_blank" rel="noreferrer">
          View website ↗
        </a>
        <button onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}

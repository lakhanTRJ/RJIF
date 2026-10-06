import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const links = [
  ['Conference', '/'],
  ['South Forum', '/conference-south/'],
  ['Speakers', '/speakers/'],
  ['Exhibition', '/exhibition/'],
  ['Partner', '/partner/'],
  ['Awards', '/leadership-awards/']
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-row">
        <Link className="brand" to="/" aria-label="Retail Jeweller India Forum home">
          <span className="brand-mark">RJ</span>
          <span>RETAIL JEWELLER<br /><b>INDIA FORUM</b></span>
        </Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>
          <span className="sr-only">Toggle navigation</span><span /><span /><span />
        </button>
        <nav id="primary-nav" className={open ? 'nav open' : 'nav'} aria-label="Primary">
          {links.map(([label, path]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <a className="button small" href="#contact">Register</a>
        </nav>
      </div>
    </header>
  );
}


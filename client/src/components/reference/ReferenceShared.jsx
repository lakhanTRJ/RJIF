/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

export const A = (path) => `/reference/${path}`;
export const indiaAgenda = [
  [
    '01',
    'Crystal gazing 2030',
    'New Possibilities, Reinventions and Opportunities in Indian Jewellery',
    'How will the rules of jewellery retail and consumption be rewritten as the Indian retail sector almost doubles to approx. $1.93 trillion, with GDP reaching approx. $6.5 trillion.',
  ],
  [
    '02',
    'Two Diamonds, One Market',
    'Coexistence, Competition, and Consumer Choice',
    "What will the diamond market landscape look like amid government seed grants, millions of dollars in funding for lab-grown diamonds, and De Beers' renewed marketing efforts to revive natural diamonds?",
  ],
  [
    '03',
    'New Age Brands',
    'The Next Wave of Jewellery Retail',
    'In a legacy and trust-based category, why are consumers falling for young brands that are writing a new code for jewellery retail?',
  ],
  [
    '04',
    'Gold Demand Reset',
    'Same gold, New Calculations',
    'As gold hits record highs, how are consumers recalibrating their gold purchases, and what structural shifts will change the way India sells gold?',
  ],
  [
    '05',
    'Breaking the Mould',
    'Retail transformations Beyond Metros',
    "Large national and regional giants, along with leading local players, are making significant strides to seize high-growth, untapped opportunities in greenfield areas. What does it take to succeed in India's hinterlands?",
  ],
];
export const southAgenda = [
  [
    '01',
    'Young Turks',
    'Reinventions, Strategic Shifts and Disruptions',
    'Adapting to changing market conditions and growing the business.',
  ],
  [
    '02',
    'Conversions from clicks',
    'Engaging the Always-Online shopper',
    'Analysing jewellery retail’s digital pulse.',
  ],
  [
    '03',
    'Unlocking digital gold apps',
    'Expanding the customer base',
    'How retailers are digitising gold investments.',
  ],
  [
    '04',
    'The Global South',
    'Diasporic market opportunities',
    'Tapping into new opportunities across global southern markets.',
  ],
  [
    '05',
    'The Buyer Reset',
    'New purchase patterns',
    'Decoding the new jewellery purchase pattern in South India.',
  ],
];
const contacts = {
  india: [
    ['For Partnership', 'Chirag Waghela', 'chirag.waghela@retailjewellerindia.com', '+91 91672 52611'],
    ['For Delegation', 'Sameer Gosar', 'sameer.gosar@theretailjeweller.com', '+91 84518 69611'],
    [
      'Speaking Opportunities',
      'Pratyasha Kumari',
      'pratyasha.kumari@retailjewellerindia.com',
      '+91 62055 46336',
    ],
  ],
  awards: [
    ['For Exhibiting', 'Chirag Waghela', 'chirag.waghela@retailjewellerindia.com', '+91 91672 52611'],
    ['For Participation', 'Priya Rangdal', 'priya.rangdal@theretailjeweller.com', '+91 89769 07876'],
    [
      'Speaking Opportunities',
      'Pratyasha Kumari',
      'pratyasha.kumari@retailjewellerindia.com',
      '+91 62055 46336',
    ],
  ],
  partner: [
    ['For Partnership', 'Chirag Waghela', 'chirag.waghela@retailjewellerindia.com', '+91 91672 52611'],
    [
      'For Delegation',
      'Shilpa Bhattacharya',
      'shilpa.bhattacharya@retailjewellerindia.com',
      '+91 79773 81527',
    ],
    [
      'Speaking Opportunities',
      'Pratyasha Kumari',
      'pratyasha.kumari@retailjewellerindia.com',
      '+91 62055 46336',
    ],
  ],
};

function pathFor(path, south) {
  if (path.includes('exhibition')) return south ? '/exhibition-south/' : '/exhibition/';
  if (path.includes('speakers')) return south ? '/south-forum-speakers/' : '/speakers/';
  if (path.includes('felicitation') || path.includes('business-excellence-awards'))
    return south ? '/felicitation/' : '/business-excellence-awards/';
  return south ? '/conference-south/' : '/';
}

export function useForumContent(forum) {
  const [content, setContent] = useState(null);
  useEffect(() => {
    let active = true;
    api(`/public/forum/${forum}`)
      .then((data) => active && setContent(data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [forum]);
  return content;
}

function youtubeId(url = '') {
  const value = String(url).trim();
  if (/^[\w-]{6,}$/.test(value)) return value;
  try {
    const parsed = new URL(value);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || '';
    if (parsed.hostname.endsWith('youtube.com') || parsed.hostname.endsWith('youtube-nocookie.com')) {
      if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(parts[0])) return parts[1] || '';
    }
  } catch {
    return '';
  }
  return '';
}
export function YoutubeVideo({ url, background = false, title }) {
  const id = youtubeId(url);
  if (!id) return null;
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&playsinline=1&rel=0&controls=${background ? 0 : 1}&modestbranding=1`;
  return (
    <iframe
      className={background ? 'youtube-background' : 'youtube-video'}
      src={src}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen={!background}
    />
  );
}
function AnimatedNumber({ value }) {
  const target = Number(String(value).replace(/\D/g, ''));
  const suffix = String(value).replace(/[\d,]/g, '');
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!target) return;
    let frame, start;
    const tick = (time) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 1500);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return (
    <>
      {shown}
      {suffix}
    </>
  );
}

export function SiteHeader({ path, section = 'conference' }) {
  const [open, setOpen] = useState(false);
  const south = path.includes('south') || path === '/felicitation/';
  const secondary =
    section === 'blog'
      ? [
          ['Latest Articles', '/blog/'],
          ['India Forum', '/'],
          ['South Forum', '/conference-south/'],
          ['Speakers', '/speakers/'],
          ['Contact Us', '/#contact'],
        ]
      : section === 'exhibition'
        ? [
            ['About Us', '#about'],
            ['Exhibit', '#exhibit'],
            ['Testimonials', '#testimonials'],
            ['Previous Edition', '#previous'],
          ]
        : section === 'awards'
          ? [
              ['About', '#about'],
              ['Categories', '#categories'],
              ['Guidelines', '#guidelines'],
              ['Timeline', '#timeline'],
              ['Contact Us', '#contact'],
            ]
          : section === 'felicitation'
            ? [
                ['About', '#about'],
                ['Contact Us', '#contact'],
              ]
            : [
                ['Speakers', '#speakers'],
                ['Agenda', '#agenda'],
                ['Watch', '#watch'],
                ['Delegate Pass', '#passes'],
                ['Contact Us', '#contact'],
              ];
  const primary = south
    ? [
        ['Conference', '/conference-south/'],
        ['Exhibition', '/exhibition-south/'],
        ['Felicitation', '/felicitation/'],
        ['Blog', '/blog/'],
      ]
    : [
        ['Conference', '/'],
        ['Exhibition', '/exhibition/'],
        ['Business Excellence Awards', '/business-excellence-awards/'],
        ['Blog', '/blog/'],
      ];
  const delegateTarget = south ? '/conference-south/#passes' : '/#passes';
  const registerTarget = delegateTarget;
  const logo = south ? A('south-forum-logo-horizontal.png') : A('2025/07/Logo.jpg');
  return (
    <>
      <header className={`ref-header ${south ? 'south-header' : ''}`}>
        <div className="ref-primary">
          <div className="forum-switch" aria-label="Choose forum">
            <Link className={!south ? 'active' : ''} to={pathFor(path, false)}>
              India Forum
            </Link>
            <Link className={south ? 'active' : ''} to={pathFor(path, true)}>
              South Forum
            </Link>
          </div>
          <nav className="primary-menu">
            {primary.map(([label, url]) => (
              <Link key={label} to={url}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <a href={registerTarget}>Register Now</a>
          </div>
        </div>
        <div className="ref-secondary-row">
          <Link className="active-forum-logo" to={south ? '/conference-south/' : '/'}>
            <img src={logo} alt={south ? 'Retail Jeweller South Forum' : 'Retail Jeweller India Forum'} />
          </Link>
          <button className="header-menu-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span />
            <span />
            <span />
            <b className="sr-only">Menu</b>
          </button>
          <nav className={`ref-secondary ${open ? 'open' : ''}`}>
            {secondary.map(([label, url]) =>
              url.startsWith('/') ? (
                <Link key={label} to={url} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ) : (
                <a key={label} href={url} onClick={() => setOpen(false)}>
                  {label}
                </a>
              ),
            )}
            {primary.map(([label, url]) => (
              <Link
                className="mobile-primary-link"
                key={`mobile-${label}`}
                to={url}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <a className="delegate-ticker" href={delegateTarget} aria-label="Go to delegate passes">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M4 7h24v6a3 3 0 0 0 0 6v6H4v-6a3 3 0 0 0 0-6V7Z" />
          <path d="M16 9v14" />
        </svg>
        <span>Delegate Pass</span>
      </a>
    </>
  );
}

export function SectionTitle({ children }) {
  return <h2 className="ref-section-title">{children}</h2>;
}
export function Button({ children, href = '#contact', light = false, onClick }) {
  return onClick ? (
    <button type="button" className={`ref-button ${light ? 'light' : ''}`} onClick={onClick}>
      {children}
    </button>
  ) : (
    <a className={`ref-button ${light ? 'light' : ''}`} href={href}>
      {children}
    </a>
  );
}
export function EnquiryModal({ open, onClose, type = 'Exhibition enquiry' }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  if (!open) return null;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const result = await api('/public/forms/contact/submit', {
        method: 'POST',
        body: JSON.stringify({ ...values, enquiry_type: type }),
      });
      setMessage(result.message || 'Thank you. Our team will contact you shortly.');
      form.reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="enquiry-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="enquiry-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="enquiry-title">{type}</h2>
        <p>Share your details and the Retail Jeweller team will contact you.</p>
        {message ? (
          <div className="status" role="status">
            {message}
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <label>
              Full name
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Company
              <input name="company" autoComplete="organization" required />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Mobile number
              <input name="phone" type="tel" autoComplete="tel" required />
            </label>
            <label>
              Message
              <textarea name="message" rows="4" />
            </label>
            <label className="consent">
              <input name="consent" type="checkbox" value="yes" required /> I agree to the privacy policy and
              consent to being contacted.
            </label>
            <button className="ref-button" type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit enquiry'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
export function VideoModal({ video, onClose }) {
  useEffect(() => {
    if (!video) return undefined;
    const close = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [video, onClose]);
  if (!video) return null;
  const id = youtubeId(video.url);
  return (
    <div
      className="video-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="video-modal"
        role="dialog"
        aria-modal="true"
        aria-label={video.title || 'Highlight video'}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close video">
          ×
        </button>
        {id ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={video.title || 'Highlight video'}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <p>This video link is not valid.</p>
        )}
      </section>
    </div>
  );
}
export function Gallery({
  items,
  label = 'Previous Event Glimpses',
  target = '/previous-edition-highlights/',
}) {
  const [index, setIndex] = useState(0);
  if (!items?.length) return null;
  return (
    <section className="ref-section ref-gallery" id="previous">
      <SectionTitle>{label}</SectionTitle>
      <div className="gallery-frame">
        <img src={items[index].image} alt={items[index].alt || label} />
        <button className="prev" onClick={() => setIndex((index - 1 + items.length) % items.length)}>
          ‹
        </button>
        <button className="next" onClick={() => setIndex((index + 1) % items.length)}>
          ›
        </button>
      </div>
      <Button light href={items[index].target_url || target}>
        View More
      </Button>
    </section>
  );
}
function ContactIcon({ type }) {
  return type === 'phone' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.37 2.3.56 3.5.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.19 2.4.56 3.5a1 1 0 0 1-.25 1l-2.2 2.3Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
function SocialIcon({ type }) {
  if (type === 'linkedin')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3.5 9H6.5V21H3.5ZM9 9h3v1.7c.9-1.3 2.1-2 3.8-2 3.2 0 4.2 2.1 4.2 5.5V21h-3v-6.1c0-1.9-.4-3.2-2.3-3.2-2 0-2.7 1.4-2.7 3.5V21H9Z" />
      </svg>
    );
  if (type === 'instagram')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle className="fill" cx="17.5" cy="6.5" r="1" />
      </svg>
    );
  if (type === 'facebook')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 21v-8h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7H18V3.8c-.7-.1-1.5-.2-2.5-.2-2.6 0-4.5 1.6-4.5 4.6V10H8v3h3v8Z" />
      </svg>
    );
  if (type === 'x')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 3h4.6l4.2 5.6L17.7 3H20l-6.1 7.2L20.5 21h-4.6l-4.7-6.3L5.8 21H3.5l6.6-7.9L4 3Zm3.5 2 9.4 14h1.6L9.1 5H7.5Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path className="play-shape" d="m10 9 5 3-5 3Z" />
    </svg>
  );
}
export function Contacts({ variant = 'india' }) {
  return (
    <section className="ref-section contact-section" id="contact">
      <SectionTitle>Contact Us</SectionTitle>
      <div className="contact-wrap">
        {contacts[variant].map(([title, name, email, phone]) => (
          <article key={title}>
            <h3>{title}</h3>
            <span className="red-rule" />
            <b>{name}</b>
            <a href={`mailto:${email}`}>
              <ContactIcon type="email" />
              <span>{email}</span>
            </a>
            <a href={`tel:${phone.replace(/\s/g, '')}`}>
              <ContactIcon type="phone" />
              <span>{phone}</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Footer() {
  const south = window.location.pathname.includes('south') || window.location.pathname === '/felicitation/';
  const content = useForumContent(south ? 'south' : 'india');
  const s = content?.settings || {};
  const socials = [
    ['linkedin', s.linkedin_url || '#linkedin'],
    ['instagram', s.instagram_url || '#instagram'],
    ['facebook', s.facebook_url || '#facebook'],
    ['x', s.x_url || '#x'],
    ['youtube', s.youtube_url || '#youtube'],
  ];
  return (
    <footer className="ref-footer">
      <div>
        <img src={A('2025/07/Logo.jpg')} alt="Retail Jeweller India Forum" />
        <p>
          {s.footer_tagline || 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!'}
        </p>
      </div>
      <div>
        <b>Social Media</b>
        <p className="footer-social">
          {socials.map(([name, url]) => (
            <a
              href={url}
              key={name}
              aria-label={name}
              target={url.startsWith('#') ? undefined : '_blank'}
              rel={url.startsWith('#') ? undefined : 'noreferrer'}
            >
              <SocialIcon type={name} />
            </a>
          ))}
        </p>
        <Link to="/privacy-policy/">Policy</Link>
        <p>{s.footer_copyright || 'Copyright © 2025 Retail Jeweller. All Rights Reserved'}</p>
      </div>
    </footer>
  );
}
function SpeakerPortrait({ speaker }) {
  const [failed, setFailed] = useState(false);
  if (!speaker.image || failed)
    return (
      <div className="speaker-placeholder" aria-hidden="true">
        {speaker.name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')}
      </div>
    );
  return <img src={speaker.image} alt={speaker.name} loading="lazy" onError={() => setFailed(true)} />;
}
export function SpeakerGrid({ speakers, limit, portraits = true }) {
  const visible = limit ? speakers.slice(0, limit) : speakers;
  return (
    <div className={`speaker-grid ${portraits ? '' : 'speaker-grid-text'}`}>
      {visible.map((speaker, index) => (
        <article className="speaker-card" key={`${speaker.name}-${index}`}>
          {portraits && <SpeakerPortrait speaker={speaker} />}
          <div>
            <h3>{speaker.name}</h3>
            <p>{speaker.role}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
export function PostAgendaBanner({ settings, south = false }) {
  if (settings.post_agenda_banner_visible === 0) return null;
  const fallback = A(`2026/09/${south ? 'south-forum' : 'India-Forum'}-banner_01.jpeg`);
  return (
    <section
      className="post-agenda-banner"
      style={{ backgroundImage: `url(${settings.post_agenda_banner_url || fallback})` }}
      aria-label={`${south ? 'South' : 'India'} Forum registration`}
    >
      <div className="post-agenda-actions">
        <Button light href={settings.post_agenda_banner_target || '#passes'}>
          {settings.post_agenda_banner_label || 'Register'}
        </Button>
        <Button light href={south ? '/exhibition-south/' : '/exhibition/'}>
          Exhibit
        </Button>
      </div>
    </section>
  );
}
export function PromotionalBanner({ settings, south = false }) {
  if (settings.quote_visible === 0) return null;
  const image =
    settings.quote_banner_url || (!south ? A('2026/09/retail-reimagined-india-forum-27.png') : '');
  if (!image) return null;
  return (
    <section className="home-promo-banner">
      <a
        href={settings.quote_banner_target || '#passes'}
        aria-label={`${south ? 'South' : 'India'} Forum promotion`}
      >
        <img src={image} alt={`${south ? 'South' : 'India'} Forum promotional banner`} />
      </a>
    </section>
  );
}

export function EventOverview({
  south,
  contentUrl,
  stats,
  date = '7th Jan 2027',
  location = 'Grand Hyatt Mumbai',
}) {
  const heading = 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!';
  return (
    <section className="event-overview" id="watch">
      <div className="event-overview-grid">
        <div className="event-overview-copy">
          <p className="event-eyebrow">
            <span />
            The Retail Jeweller India Forum
          </p>
          <h2>{heading}</h2>
          <div className="event-meta">
            <div>
              <span className="meta-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M8 3v4M16 3v4M4 10h16M8 13h2M12 13h2M16 13h1M8 17h2M12 17h2M16 17h1" />
                </svg>
              </span>
              <span>
                <b>When</b>
                <small>{date}</small>
              </span>
            </div>
            <div>
              <span className="meta-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span>
                <b>Location</b>
                <small>{location}</small>
              </span>
            </div>
          </div>
        </div>
        <div className="overview-video-card">
          <YoutubeVideo url={contentUrl} title={`${south ? 'South' : 'India'} Forum official film`} />
        </div>
      </div>
      <div
        className={`overview-stats ${south ? 'south-stats' : ''}`}
        style={{ '--overview-columns': Math.min(stats.length, 8) }}
      >
        {stats.map(([number, label, caption], index) => (
          <div key={`${label}-${index}`}>
            <strong>
              <AnimatedNumber value={number} />
              {caption && <em> {label}</em>}
            </strong>
            <span>{caption || label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

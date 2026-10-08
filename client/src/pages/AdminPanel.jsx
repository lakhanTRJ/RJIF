import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import ImageUploadField from '../components/admin/ImageUploadField.jsx';
import DocumentUploadField from '../components/admin/DocumentUploadField.jsx';
import AdminCheckIn from '../components/admin/AdminCheckIn.jsx';
import AdminNavigation from '../components/admin/AdminNavigation.jsx';
import RichTextEditor from '../components/admin/RichTextEditor.jsx';
import { adminRoutes } from '../components/admin/adminRoutes.js';
import '../admin.css';
import '../admin-updates.css';
import '../admin-checkin.css';
import '../admin-interface.css';

function Input({ label, value, onChange, type = 'text', name, required = false }) {
  const props = {
    name,
    value: value ?? '',
    required,
    onChange: (e) => onChange?.(type === 'number' ? Number(e.target.value) : e.target.value),
  };
  return (
    <label>
      {label}
      {type === 'textarea' ? <textarea {...props} /> : <input {...props} type={type} />}
    </label>
  );
}
function NormalAccordionEditor({ value, onChange }) {
  const changeList = (key, index, patch) =>
    onChange({
      ...value,
      [key]: (value[key] || []).map((row, i) =>
        i === index ? (typeof patch === 'function' ? patch(row) : { ...row, ...patch }) : row,
      ),
    });
  const remove = (key, index) =>
    onChange({ ...value, [key]: (value[key] || []).filter((_, i) => i !== index) });
  if (value.type === 'timeline')
    return (
      <div className="admin-nested">
        {(value.items || []).map((item, index) => (
          <fieldset key={index}>
            <legend>Timeline card {index + 1}</legend>
            <Input
              label="Heading"
              value={item.title}
              onChange={(title) => changeList('items', index, { title })}
            />
            <Input label="Date" value={item.date} onChange={(date) => changeList('items', index, { date })} />
            <Input
              label="Description"
              type="textarea"
              value={item.body}
              onChange={(body) => changeList('items', index, { body })}
            />
            <button className="button small secondary" onClick={() => remove('items', index)}>
              Remove card
            </button>
          </fieldset>
        ))}
        <button
          className="button small secondary"
          onClick={() =>
            onChange({
              ...value,
              items: [...(value.items || []), { title: 'New milestone', date: '', body: '' }],
            })
          }
        >
          Add timeline card
        </button>
      </div>
    );
  if (value.type === 'ordered')
    return (
      <div className="admin-nested">
        {(value.items || []).map((item, index) => (
          <div className="admin-inline" key={index}>
            <Input
              label={`Item ${index + 1}`}
              value={item}
              onChange={(text) =>
                onChange({ ...value, items: value.items.map((row, i) => (i === index ? text : row)) })
              }
            />
            <button className="button small secondary" onClick={() => remove('items', index)}>
              Remove
            </button>
          </div>
        ))}
        <button
          className="button small secondary"
          onClick={() => onChange({ ...value, items: [...(value.items || []), 'New item'] })}
        >
          Add item
        </button>
      </div>
    );
  if (value.type === 'sections')
    return (
      <div className="admin-nested">
        {(value.sections || []).map((group, index) => (
          <fieldset key={index}>
            <legend>Content section {index + 1}</legend>
            <Input
              label="Heading"
              value={group.title}
              onChange={(title) => changeList('sections', index, { title })}
            />
            {(group.items || []).map((item, itemIndex) => (
              <div className="admin-inline" key={itemIndex}>
                <Input
                  label={`Description ${itemIndex + 1}`}
                  type="textarea"
                  value={item}
                  onChange={(text) =>
                    changeList('sections', index, (row) => ({
                      ...row,
                      items: row.items.map((entry, i) => (i === itemIndex ? text : entry)),
                    }))
                  }
                />
                <button
                  className="button small secondary"
                  onClick={() =>
                    changeList('sections', index, (row) => ({
                      ...row,
                      items: row.items.filter((_, i) => i !== itemIndex),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="button small secondary"
              onClick={() =>
                changeList('sections', index, (row) => ({
                  ...row,
                  items: [...(row.items || []), 'New description'],
                }))
              }
            >
              Add description
            </button>{' '}
            <button className="button small secondary" onClick={() => remove('sections', index)}>
              Remove section
            </button>
          </fieldset>
        ))}
        <button
          className="button small secondary"
          onClick={() =>
            onChange({ ...value, sections: [...(value.sections || []), { title: 'New heading', items: [] }] })
          }
        >
          Add content section
        </button>
      </div>
    );
  return (
    <div className="admin-nested">
      <Input
        label="Introductory description"
        type="textarea"
        value={value.intro || ''}
        onChange={(intro) => onChange({ ...value, intro })}
      />
      {(value.groups || []).map((group, index) => (
        <fieldset key={index}>
          <legend>Content block {index + 1}</legend>
          <Input
            label="Heading"
            value={group.title}
            onChange={(title) => changeList('groups', index, { title })}
          />
          {(group.bullets || []).map((bullet, bulletIndex) => (
            <div className="admin-inline" key={bulletIndex}>
              <Input
                label={`Description ${bulletIndex + 1}`}
                type="textarea"
                value={bullet}
                onChange={(text) =>
                  changeList('groups', index, (row) => ({
                    ...row,
                    bullets: row.bullets.map((entry, i) => (i === bulletIndex ? text : entry)),
                  }))
                }
              />
              <button
                className="button small secondary"
                onClick={() =>
                  changeList('groups', index, (row) => ({
                    ...row,
                    bullets: row.bullets.filter((_, i) => i !== bulletIndex),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="button small secondary"
            onClick={() =>
              changeList('groups', index, (row) => ({
                ...row,
                bullets: [...(row.bullets || []), 'New description'],
              }))
            }
          >
            Add description
          </button>
          <Input
            label="Optional link URL"
            value={group.link || ''}
            onChange={(link) => changeList('groups', index, { link })}
          />
          <DocumentUploadField
            label="Or upload a PDF for this link"
            value={group.link || ''}
            title={group.title || `Business Excellence Awards content block ${index + 1}`}
            onChange={(link) => changeList('groups', index, { link })}
          />
          <Input
            label="Link text"
            value={group.linkText || 'Click Here'}
            onChange={(linkText) => changeList('groups', index, { linkText })}
          />
          <button className="button small secondary" onClick={() => remove('groups', index)}>
            Remove content block
          </button>
        </fieldset>
      ))}
      <button
        className="button small secondary"
        onClick={() =>
          onChange({
            ...value,
            groups: [
              ...(value.groups || []),
              { title: 'New heading', bullets: [], link: '', linkText: 'Click Here' },
            ],
          })
        }
      >
        Add heading/content block
      </button>
    </div>
  );
}
function ForumPicker({ forum, setForum }) {
  return (
    <div className="forum-picker">
      <button className={forum === 'india' ? 'active' : ''} onClick={() => setForum('india')}>
        India Forum
      </button>
      <button className={forum === 'south' ? 'active' : ''} onClick={() => setForum('south')}>
        South Forum
      </button>
    </div>
  );
}
function normalizeForumContent(data) {
  const result = data || { settings: {}, speakers: [], agenda: [], gallery: [] };
  let stats = result.settings?.overview_stats;
  if (typeof stats === 'string') {
    try {
      stats = JSON.parse(stats);
    } catch {
      stats = [];
    }
  }
  if (!Array.isArray(stats)) stats = [];
  return { ...result, settings: { ...(result.settings || {}), overview_stats: stats } };
}

export default function AdminPanel() {
  const location = useLocation(),
    navigate = useNavigate(),
    section = location.pathname.split('/')[2] || 'pages';
  const [role, setRole] = useState('editor'),
    [notice, setNotice] = useState(''),
    [forum, setForum] = useState('india'),
    [complimentaryLink, setComplimentaryLink] = useState('');
  const [pages, setPages] = useState([]),
    [products, setProducts] = useState([]),
    [articles, setArticles] = useState([]),
    [media, setMedia] = useState([]),
    [submissions, setSubmissions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [eventStaff, setEventStaff] = useState([]);
  const [highlights, setHighlights] = useState([]),
    [testimonials, setTestimonials] = useState([]);
  const [awards, setAwards] = useState({
    content: { heroYoutubeUrl: '', partnerLabel: 'Associate Partner', partnerLogoUrl: '', accordions: [] },
    applications: [],
  });
  const [felicitation, setFelicitation] = useState({ hero_youtube_url: '' });
  const [newArticleBody, setNewArticleBody] = useState('');
  const [showArticleCreate, setShowArticleCreate] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [content, setContent] = useState({ settings: {}, speakers: [], agenda: [], gallery: [] });
  const notify = (message) => setNotice(message);
  const update = (key, index, patch) =>
    setContent({
      ...content,
      [key]: content[key].map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  const updateAwardAccordion = (index, next) =>
    setAwards({
      ...awards,
      content: {
        ...awards.content,
        accordions: awards.content.accordions.map((row, i) => (i === index ? next : row)),
      },
    });
  const updateHighlight = (id, patch) =>
    setHighlights(highlights.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const reloadForum = async () => setContent(normalizeForumContent(await api(`/admin/forums/${forum}`)));
  useEffect(() => {
    api('/admin/session')
      .then((s) => {
        setRole(s.role);
        if (s.role === 'event_staff' && section !== 'check-in') navigate('/admin/check-in');
      })
      .catch(() => navigate('/admin/login'));
  }, [navigate, section]);
  useEffect(() => {
    const load = {
      pages: () => api('/admin/pages').then(setPages),
      passes: () => api('/admin/products').then(setProducts),
      highlights: () => api('/admin/highlights').then(setHighlights),
      awards: () => api('/admin/awards').then(setAwards),
      felicitation: () => api('/admin/felicitation').then(setFelicitation),
      articles: () => api('/admin/articles').then(setArticles),
      media: () => api('/admin/media').then(setMedia),
      submissions: () => api('/admin/submissions').then(setSubmissions),
      registrations: () => api('/admin/registrations').then(setRegistrations),
      'event-staff': () => api('/admin/event-staff').then(setEventStaff),
    };
    load[section]?.().catch((e) => notify(e.message));
  }, [section]);
  useEffect(() => {
    if (['home', 'speakers', 'agenda', 'gallery', 'footer'].includes(section))
      api(`/admin/forums/${forum}`)
        .then((data) => setContent(normalizeForumContent(data)))
        .catch((e) => notify(e.message));
  }, [section, forum]);
  useEffect(() => {
    if (section === 'testimonials')
      api(`/admin/testimonials?forum=${forum}`)
        .then(setTestimonials)
        .catch((e) => notify(e.message));
  }, [section, forum]);
  async function logout() {
    await api('/admin/logout', { method: 'POST' });
    navigate('/admin/login');
  }
  async function saveSettings() {
    await api(`/admin/forums/${forum}/settings`, { method: 'PUT', body: JSON.stringify(content.settings) });
    notify('Settings saved.');
  }
  async function uploadMedia(event) {
    event.preventDefault();
    const form = event.currentTarget;
    await api('/admin/media', { method: 'POST', body: new FormData(form) });
    form.reset();
    setMedia(await api('/admin/media'));
    notify('Media uploaded.');
  }

  const currentRoute = adminRoutes.find((row) => row[0] === section);
  return (
    <main className="admin-shell">
      <AdminNavigation role={role} section={section} onLogout={logout} />
      <section className="admin-content">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">{section === 'check-in' ? 'Gate operations' : 'Website management'}</p>
            <h1>{currentRoute?.[1]}</h1>
            <p>{currentRoute?.[2]}</p>
          </div>
          <span className="admin-role">{role.replace('_', ' ')}</span>
        </div>
        {notice && (
          <p className="notice" role="status">
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">
              ×
            </button>
          </p>
        )}

        {section === 'check-in' && <AdminCheckIn />}
        {section === 'registrations' && (
          <section>
            <p>
              Paid and complimentary orders issue QR passes automatically when attendee details are available.
              Administrators can confirm an offline payment here.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Pass</th>
                    <th>Total</th>
                    <th>Attendees</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.created_at).toLocaleString()}</td>
                      <td>
                        {row.customer_name}
                        <br />
                        <small>
                          {row.company} · {row.email}
                        </small>
                      </td>
                      <td>{row.product_name}</td>
                      <td>₹{(Number(row.total_paise) / 100).toLocaleString('en-IN')}</td>
                      <td>
                        {row.attendee_count} / {row.pass_count} issued
                      </td>
                      <td>{row.status}</td>
                      <td>
                        {row.status !== 'paid' ? (
                          <button
                            className="button small"
                            disabled={role !== 'administrator'}
                            onClick={async () => {
                              await api(`/admin/registrations/${row.id}/mark-paid`, { method: 'POST' });
                              setRegistrations(await api('/admin/registrations'));
                              notify('Payment confirmed and passes issued.');
                            }}
                          >
                            Mark paid
                          </button>
                        ) : (
                          Number(row.pass_count) > 0 && (
                            <button
                              className="button small secondary"
                              disabled={role !== 'administrator'}
                              onClick={async () => {
                                try {
                                  await api(`/admin/registrations/${row.id}/send-passes`, { method: 'POST' });
                                  notify('Pass email sent.');
                                } catch (error) {
                                  notify(error.message);
                                }
                              }}
                            >
                              Email passes
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {section === 'event-staff' && (
          <section>
            <p>
              Event staff accounts can only open the check-in scanner and attendance list. They cannot edit
              website content, passes, payments, or other admin settings.
            </p>
            <form
              className="admin-card"
              onSubmit={async (event) => {
                event.preventDefault();
                await api('/admin/event-staff', {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
                });
                event.currentTarget.reset();
                setEventStaff(await api('/admin/event-staff'));
                notify('Event staff account created.');
              }}
            >
              <h2>Create event staff login</h2>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Password (12+ characters)
                <input name="password" type="password" minLength="12" required />
              </label>
              <button className="button small" disabled={role !== 'administrator'}>
                Create account
              </button>
            </form>
            <div className="admin-list">
              {eventStaff.map((staff) => (
                <article className="admin-card" key={staff.id}>
                  <h3>{staff.email}</h3>
                  <p>
                    {staff.is_active ? 'Active' : 'Disabled'}
                    {staff.last_login_at
                      ? ` · Last login ${new Date(staff.last_login_at).toLocaleString()}`
                      : ''}
                  </p>
                  <button
                    className="button small secondary"
                    onClick={async () => {
                      await api(`/admin/event-staff/${staff.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ is_active: !staff.is_active }),
                      });
                      setEventStaff(await api('/admin/event-staff'));
                    }}
                  >
                    {staff.is_active ? 'Disable' : 'Enable'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'pages' && (
          <div className="admin-list">
            {pages.map((page, index) => (
              <article className="admin-card" key={page.id}>
                <Input
                  label="Title"
                  value={page.title}
                  onChange={(title) => setPages(pages.map((p, i) => (i === index ? { ...p, title } : p)))}
                />
                <label>
                  Path
                  <input value={page.path} disabled />
                </label>
                <Input
                  label="SEO title"
                  value={page.seo_title}
                  onChange={(seo_title) =>
                    setPages(pages.map((p, i) => (i === index ? { ...p, seo_title } : p)))
                  }
                />
                <Input
                  label="SEO description"
                  type="textarea"
                  value={page.seo_description}
                  onChange={(seo_description) =>
                    setPages(pages.map((p, i) => (i === index ? { ...p, seo_description } : p)))
                  }
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={Boolean(page.is_published)}
                    onChange={(e) =>
                      setPages(
                        pages.map((p, i) => (i === index ? { ...p, is_published: e.target.checked } : p)),
                      )
                    }
                  />{' '}
                  Published
                </label>
                <button
                  className="button small"
                  disabled={role !== 'administrator'}
                  onClick={async () => {
                    await api(`/admin/pages/${page.id}`, { method: 'PUT', body: JSON.stringify(page) });
                    notify('Page saved.');
                  }}
                >
                  Save page
                </button>
              </article>
            ))}
          </div>
        )}

        {['home', 'footer'].includes(section) && (
          <section>
            <ForumPicker forum={forum} setForum={setForum} />
            <p>These values control the public {forum} website.</p>
            <article className="admin-card">
              {(section === 'home'
                ? [
                    ['Speaker heading', 'speaker_heading'],
                    ['Hero YouTube URL', 'hero_youtube_url', 'url'],
                    ['Video below counters', 'content_youtube_url', 'url'],
                    ['Event date', 'event_date'],
                    ['Event location', 'event_location'],
                    ['Promotional banner link', 'quote_banner_target'],
                    ['Post-agenda button URL', 'post_agenda_banner_target'],
                    ['Post-agenda button label', 'post_agenda_banner_label'],
                    ['Pass columns', 'pass_columns', 'number'],
                    ['Gallery heading', 'gallery_heading'],
                    ['Gallery button URL', 'gallery_target_url'],
                  ]
                : [
                    ['Footer tagline', 'footer_tagline', 'textarea'],
                    ['Copyright', 'footer_copyright', 'textarea'],
                    ['LinkedIn URL', 'linkedin_url', 'url'],
                    ['Instagram URL', 'instagram_url', 'url'],
                    ['Facebook URL', 'facebook_url', 'url'],
                    ['X URL', 'x_url', 'url'],
                    ['YouTube URL', 'youtube_url', 'url'],
                  ]
              ).map(([label, key, type]) => (
                <Input
                  key={key}
                  label={label}
                  type={type}
                  value={content.settings?.[key]}
                  onChange={(value) =>
                    setContent({ ...content, settings: { ...content.settings, [key]: value } })
                  }
                />
              ))}
              {section === 'home' && (
                <>
                  <ImageUploadField
                    label="Promotional banner image"
                    value={content.settings?.quote_banner_url}
                    onChange={(quote_banner_url) =>
                      setContent({ ...content, settings: { ...content.settings, quote_banner_url } })
                    }
                    altText={`${forum} Forum promotional banner`}
                  />
                  <ImageUploadField
                    label="Post-agenda banner image"
                    value={content.settings?.post_agenda_banner_url}
                    onChange={(post_agenda_banner_url) =>
                      setContent({ ...content, settings: { ...content.settings, post_agenda_banner_url } })
                    }
                    altText="Post-agenda promotional banner"
                  />
                </>
              )}
              {section === 'home' && (
                <div className="admin-nested">
                  <h2>Overview statistics</h2>
                  <p>Change the number, label and optional caption shown below the overview video.</p>
                  {(content.settings?.overview_stats || []).map((stat, index) => (
                    <fieldset key={index}>
                      <legend>Statistic {index + 1}</legend>
                      <Input
                        label="Number"
                        value={stat.number}
                        onChange={(number) =>
                          setContent({
                            ...content,
                            settings: {
                              ...content.settings,
                              overview_stats: content.settings.overview_stats.map((row, i) =>
                                i === index ? { ...row, number } : row,
                              ),
                            },
                          })
                        }
                      />
                      <Input
                        label="Label"
                        value={stat.label}
                        onChange={(label) =>
                          setContent({
                            ...content,
                            settings: {
                              ...content.settings,
                              overview_stats: content.settings.overview_stats.map((row, i) =>
                                i === index ? { ...row, label } : row,
                              ),
                            },
                          })
                        }
                      />
                      <Input
                        label="Optional caption"
                        value={stat.caption}
                        onChange={(caption) =>
                          setContent({
                            ...content,
                            settings: {
                              ...content.settings,
                              overview_stats: content.settings.overview_stats.map((row, i) =>
                                i === index ? { ...row, caption } : row,
                              ),
                            },
                          })
                        }
                      />
                      <button
                        type="button"
                        className="button small secondary"
                        onClick={() =>
                          setContent({
                            ...content,
                            settings: {
                              ...content.settings,
                              overview_stats: content.settings.overview_stats.filter((_, i) => i !== index),
                            },
                          })
                        }
                      >
                        Remove statistic
                      </button>
                    </fieldset>
                  ))}
                  <button
                    type="button"
                    className="button small secondary"
                    onClick={() =>
                      setContent({
                        ...content,
                        settings: {
                          ...content.settings,
                          overview_stats: [
                            ...(content.settings.overview_stats || []),
                            { number: '0', label: 'New statistic', caption: '' },
                          ],
                        },
                      })
                    }
                  >
                    Add statistic
                  </button>
                </div>
              )}
              {section === 'home' && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={Boolean(content.settings?.quote_visible)}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        settings: { ...content.settings, quote_visible: e.target.checked },
                      })
                    }
                  />{' '}
                  Show promotional banner
                </label>
              )}
              {section === 'home' &&
                ['agenda_visible', 'post_agenda_banner_visible', 'passes_visible', 'gallery_visible'].map(
                  (key) => (
                    <label className="check" key={key}>
                      <input
                        type="checkbox"
                        checked={Boolean(content.settings?.[key])}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            settings: { ...content.settings, [key]: e.target.checked },
                          })
                        }
                      />{' '}
                      Show {key.replace('_visible', '').replaceAll('_', ' ')}
                    </label>
                  ),
                )}
              <button className="button small" onClick={saveSettings}>
                Save {section}
              </button>
            </article>
          </section>
        )}

        {section === 'speakers' && (
          <section>
            <ForumPicker forum={forum} setForum={setForum} />
            <p>
              Featured speakers appear on the homepage; all published speakers appear on the Speakers page.
            </p>
            <form
              className="admin-card"
              onSubmit={async (e) => {
                e.preventDefault();
                const body = Object.fromEntries(new FormData(e.currentTarget));
                body.is_featured = Boolean(body.is_featured);
                await api(`/admin/forums/${forum}/speakers`, { method: 'POST', body: JSON.stringify(body) });
                e.currentTarget.reset();
                await reloadForum();
                notify('Speaker added.');
              }}
            >
              <h2>Add speaker</h2>
              <label>
                Name
                <input name="name" required />
              </label>
              <label>
                Role
                <input name="role" />
              </label>
              <ImageUploadField label="Speaker image" name="image_url" altText="Speaker portrait" />
              <label>
                Event year
                <input name="event_year" type="number" defaultValue="2026" />
              </label>
              <label className="check">
                <input name="is_featured" type="checkbox" value="1" /> Show on homepage
              </label>
              <button className="button small">Add speaker</button>
            </form>
            <div className="admin-list">
              {content.speakers.map((speaker, index) => (
                <article className="admin-card" key={speaker.id}>
                  {[
                    ['Name', 'name'],
                    ['Role', 'role'],
                    ['Year', 'event_year', 'number'],
                    ['Order', 'sort_order', 'number'],
                  ].map(([label, key, type]) => (
                    <Input
                      key={key}
                      label={label}
                      type={type}
                      value={speaker[key]}
                      onChange={(value) => update('speakers', index, { [key]: value })}
                    />
                  ))}
                  <ImageUploadField
                    label="Speaker image"
                    value={speaker.image_url}
                    onChange={(image_url) => update('speakers', index, { image_url })}
                    altText={speaker.name}
                  />
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(speaker.is_featured)}
                      onChange={(e) => update('speakers', index, { is_featured: e.target.checked })}
                    />{' '}
                    Homepage/current year
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(speaker.is_published)}
                      onChange={(e) => update('speakers', index, { is_published: e.target.checked })}
                    />{' '}
                    Published
                  </label>
                  <button
                    className="button small"
                    onClick={async () => {
                      await api(`/admin/speakers/${speaker.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(speaker),
                      });
                      notify('Speaker saved.');
                    }}
                  >
                    Save speaker
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'agenda' && (
          <section>
            <ForumPicker forum={forum} setForum={setForum} />
            <p>Hide the complete section from Homepage, or hide individual items here.</p>
            <form
              className="admin-card"
              onSubmit={async (e) => {
                e.preventDefault();
                await api(`/admin/forums/${forum}/agenda`, {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
                });
                e.currentTarget.reset();
                await reloadForum();
                notify('Agenda item added.');
              }}
            >
              <h2>Add agenda item</h2>
              <label>
                Number
                <input name="number" />
              </label>
              <label>
                Title
                <input name="title" required />
              </label>
              <label>
                Subtitle
                <input name="subtitle" />
              </label>
              <label>
                Description
                <textarea name="body" />
              </label>
              <button className="button small">Add item</button>
            </form>
            <div className="admin-list">
              {content.agenda.map((item, index) => (
                <article className="admin-card" key={item.id}>
                  {[
                    ['Number', 'number'],
                    ['Title', 'title'],
                    ['Subtitle', 'subtitle'],
                    ['Description', 'body', 'textarea'],
                    ['Order', 'sort_order', 'number'],
                  ].map(([label, key, type]) => (
                    <Input
                      key={key}
                      label={label}
                      type={type}
                      value={item[key]}
                      onChange={(value) => update('agenda', index, { [key]: value })}
                    />
                  ))}
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(item.is_visible)}
                      onChange={(e) => update('agenda', index, { is_visible: e.target.checked })}
                    />{' '}
                    Visible
                  </label>
                  <button
                    className="button small"
                    onClick={async () => {
                      await api(`/admin/agenda/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
                      notify('Agenda item saved.');
                    }}
                  >
                    Save item
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'gallery' && (
          <section>
            <ForumPicker forum={forum} setForum={setForum} />
            <p>
              Upload gallery images directly here. The website stores the generated media path automatically.
            </p>
            <form
              className="admin-card"
              onSubmit={async (e) => {
                e.preventDefault();
                await api(`/admin/forums/${forum}/gallery`, {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
                });
                e.currentTarget.reset();
                await reloadForum();
                notify('Gallery image added.');
              }}
            >
              <ImageUploadField
                label="Gallery image"
                name="image_url"
                required
                altText="Previous event glimpse"
              />
              <label>
                Alt text
                <input name="image_alt" required />
              </label>
              <label>
                Event year
                <input
                  name="event_year"
                  type="number"
                  min="2000"
                  max="2100"
                  defaultValue={new Date().getFullYear()}
                  required
                />
              </label>
              <label>
                Target URL
                <input
                  name="target_url"
                  key={forum}
                  defaultValue={
                    forum === 'south'
                      ? '/previous-edition-highlights-south/'
                      : '/previous-edition-highlights/'
                  }
                />
              </label>
              <button className="button small">Add image</button>
            </form>
            <div className="admin-list">
              {content.gallery.map((item, index) => (
                <article className="admin-card" key={item.id}>
                  {[
                    ['Alt text', 'image_alt'],
                    ['Event year', 'event_year', 'number'],
                    ['Target URL', 'target_url'],
                    ['Order', 'sort_order', 'number'],
                  ].map(([label, key, type]) => (
                    <Input
                      key={key}
                      label={label}
                      type={type}
                      value={item[key]}
                      onChange={(value) => update('gallery', index, { [key]: value })}
                    />
                  ))}
                  <ImageUploadField
                    label="Gallery image"
                    value={item.image_url}
                    onChange={(image_url) => update('gallery', index, { image_url })}
                    altText={item.image_alt}
                  />
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(item.is_visible)}
                      onChange={(e) => update('gallery', index, { is_visible: e.target.checked })}
                    />{' '}
                    Visible
                  </label>
                  <button
                    className="button small"
                    onClick={async () => {
                      await api(`/admin/gallery/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
                      notify('Gallery image saved.');
                    }}
                  >
                    Save image
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'highlights' && (
          <section>
            <ForumPicker forum={forum} setForum={setForum} />
            <p>
              Add videos for the selected forum and year. Clicking the cover on the public page opens the
              YouTube video in a popup.
            </p>
            <form
              className="admin-card"
              onSubmit={async (e) => {
                e.preventDefault();
                await api('/admin/highlights', {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
                });
                e.currentTarget.reset();
                setHighlights(await api('/admin/highlights'));
                notify('Highlight video added.');
              }}
            >
              <h2>Add highlight video</h2>
              <input type="hidden" name="forum" value={forum} readOnly />
              <label>
                Section
                <select name="section">
                  <option value="session">Session Highlights</option>
                  <option value="event">Event Highlights</option>
                </select>
              </label>
              <label>
                Title
                <input name="title" required />
              </label>
              <label>
                Event year
                <input
                  name="event_year"
                  type="number"
                  min="2000"
                  max="2100"
                  defaultValue={new Date().getFullYear()}
                  required
                />
              </label>
              <ImageUploadField
                label="Cover image"
                name="cover_image_url"
                required
                altText="Video highlight cover"
              />
              <label>
                YouTube URL
                <input name="youtube_url" type="url" required />
              </label>
              <label>
                Order
                <input name="sort_order" type="number" defaultValue="0" />
              </label>
              <button className="button small">Add highlight</button>
            </form>
            <div className="admin-list">
              {highlights
                .filter((item) => item.forum === forum)
                .map((item) => (
                  <article className="admin-card" key={item.id}>
                    <label>
                      Section
                      <select
                        value={item.section}
                        onChange={(e) => updateHighlight(item.id, { section: e.target.value })}
                      >
                        <option value="session">Session Highlights</option>
                        <option value="event">Event Highlights</option>
                      </select>
                    </label>
                    {[
                      ['Title', 'title'],
                      ['Event year', 'event_year', 'number'],
                      ['YouTube URL', 'youtube_url', 'url'],
                      ['Order', 'sort_order', 'number'],
                    ].map(([label, key, type]) => (
                      <Input
                        key={key}
                        label={label}
                        type={type}
                        value={item[key]}
                        onChange={(value) => updateHighlight(item.id, { [key]: value })}
                      />
                    ))}
                    <ImageUploadField
                      label="Cover image"
                      value={item.cover_image_url}
                      onChange={(cover_image_url) => updateHighlight(item.id, { cover_image_url })}
                      altText={`${item.title} video cover`}
                    />
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={Boolean(item.is_visible)}
                        onChange={(e) => updateHighlight(item.id, { is_visible: e.target.checked })}
                      />{' '}
                      Visible
                    </label>
                    <button
                      className="button small"
                      onClick={async () => {
                        await api(`/admin/highlights/${item.id}`, {
                          method: 'PUT',
                          body: JSON.stringify(item),
                        });
                        notify('Highlight saved.');
                      }}
                    >
                      Save highlight
                    </button>
                  </article>
                ))}
            </div>
          </section>
        )}

        {section === 'testimonials' && (
          <section>
            <ForumPicker forum={forum} setForum={setForum} />
            <p>Add and edit testimonials displayed on the {forum} Exhibition page.</p>
            <form
              className="admin-card"
              onSubmit={async (e) => {
                e.preventDefault();
                const body = { ...Object.fromEntries(new FormData(e.currentTarget)), forum };
                await api('/admin/testimonials', { method: 'POST', body: JSON.stringify(body) });
                e.currentTarget.reset();
                setTestimonials(await api(`/admin/testimonials?forum=${forum}`));
                notify('Testimonial added.');
              }}
            >
              <h2>Add testimonial</h2>
              <label>
                Testimonial quote
                <textarea name="quote" required />
              </label>
              <label>
                Name
                <input name="name" required />
              </label>
              <label>
                Role / company
                <input name="role" />
              </label>
              <ImageUploadField label="Person photo" name="image_url" altText="Testimonial portrait" />
              <label>
                Order
                <input name="sort_order" type="number" defaultValue="0" />
              </label>
              <button className="button small">Add testimonial</button>
            </form>
            <div className="admin-list">
              {testimonials.map((item, index) => (
                <article className="admin-card" key={item.id}>
                  {[
                    ['Testimonial quote', 'quote', 'textarea'],
                    ['Name', 'name'],
                    ['Role / company', 'role'],
                    ['Order', 'sort_order', 'number'],
                  ].map(([label, key, type]) => (
                    <Input
                      key={key}
                      label={label}
                      type={type}
                      value={item[key]}
                      onChange={(value) =>
                        setTestimonials(
                          testimonials.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
                        )
                      }
                    />
                  ))}
                  <ImageUploadField
                    label="Person photo"
                    value={item.image_url}
                    onChange={(image_url) =>
                      setTestimonials(
                        testimonials.map((row, i) => (i === index ? { ...row, image_url } : row)),
                      )
                    }
                    altText={item.name}
                  />
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(item.is_visible)}
                      onChange={(e) =>
                        setTestimonials(
                          testimonials.map((row, i) =>
                            i === index ? { ...row, is_visible: e.target.checked } : row,
                          ),
                        )
                      }
                    />{' '}
                    Visible
                  </label>
                  <button
                    className="button small"
                    onClick={async () => {
                      await api(`/admin/testimonials/${item.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(item),
                      });
                      notify('Testimonial saved.');
                    }}
                  >
                    Save testimonial
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'passes' && (
          <section>
            <p>
              Prices are in paise. Complimentary links are secret, limited, and shown only once when created.
            </p>
            {complimentaryLink && (
              <article className="admin-card">
                <h2>Copy this link now</h2>
                <p>This secure link cannot be recovered later. Store it safely before leaving this page.</p>
                <code>
                  {window.location.origin}
                  {complimentaryLink}
                </code>
                <button
                  type="button"
                  className="button small secondary"
                  onClick={() =>
                    navigator.clipboard.writeText(`${window.location.origin}${complimentaryLink}`)
                  }
                >
                  Copy link
                </button>
              </article>
            )}
            <form
              className="admin-card"
              onSubmit={async (e) => {
                e.preventDefault();
                const result = await api('/admin/products', {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
                });
                e.currentTarget.reset();
                setProducts(await api('/admin/products'));
                setComplimentaryLink(result.checkoutUrl);
                notify('Complimentary pass created. Copy the secure link now.');
              }}
            >
              <h2>Create complimentary pass</h2>
              <p>Create a free, controlled allocation for an exhibitor to share with clients.</p>
              <label>
                Forum
                <select name="forum" required>
                  <option value="india">India Forum</option>
                  <option value="south">South Forum</option>
                </select>
              </label>
              <label>
                Pass name
                <input name="name" placeholder="Exhibitor Complimentary Pass" required />
              </label>
              <label>
                Unique code
                <input name="code" placeholder="exhibitor-name-complimentary" required />
              </label>
              <label>
                Description
                <textarea name="description" />
              </label>
              <label>
                People included per pass
                <input name="member_count" type="number" min="1" defaultValue="1" />
              </label>
              <label>
                Maximum redemptions
                <input name="redemption_limit" type="number" min="1" defaultValue="10" required />
              </label>
              <label>
                Link expiry
                <input name="expires_at" type="datetime-local" required />
              </label>
              <label>
                Order
                <input name="sort_order" type="number" defaultValue="10" />
              </label>
              <button className="button small" disabled={role !== 'administrator'}>
                Create free pass
              </button>
            </form>
            <div className="admin-list">
              {products.map((p, index) => (
                <article className="admin-card" key={p.id}>
                  <h3>
                    {p.forum}: {p.code}
                  </h3>
                  {Number(p.sale_price_paise) === 0 && (
                    <p>
                      {p.redemption_count || 0} of {p.redemption_limit || 'unlimited'} redeemed. The secure
                      share link is intentionally not stored.
                    </p>
                  )}
                  {[
                    ['Name', 'name'],
                    ['Description', 'description', 'textarea'],
                    ['Regular price (paise)', 'regular_price_paise', 'number'],
                    ['Sale price (paise)', 'sale_price_paise', 'number'],
                    ['Tax rate %', 'tax_rate', 'number'],
                    ['Included members', 'member_count', 'number'],
                    ['Inventory limit', 'inventory_limit', 'number'],
                    ['Redemption limit', 'redemption_limit', 'number'],
                    ['Expiry', 'expires_at', 'datetime-local'],
                    ['Order', 'sort_order', 'number'],
                  ].map(([label, key, type]) => (
                    <Input
                      key={key}
                      label={label}
                      type={type}
                      value={type === 'datetime-local' && p[key] ? String(p[key]).slice(0, 16) : p[key]}
                      onChange={(value) =>
                        setProducts(products.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
                      }
                    />
                  ))}
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(p.is_active)}
                      onChange={(e) =>
                        setProducts(
                          products.map((row, i) =>
                            i === index ? { ...row, is_active: e.target.checked } : row,
                          ),
                        )
                      }
                    />{' '}
                    Active
                  </label>
                  <button
                    className="button small"
                    disabled={role !== 'administrator'}
                    onClick={async () => {
                      await api(`/admin/products/${p.id}`, { method: 'PUT', body: JSON.stringify(p) });
                      notify('Pass saved.');
                    }}
                  >
                    Save pass
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'awards' && (
          <section>
            <p>
              Edit the video, partner identity and accordion content using normal fields. Add headings,
              descriptions and optional links without editing JSON.
            </p>
            <article className="admin-card">
              <Input
                label="Hero YouTube URL"
                value={awards.content.heroYoutubeUrl}
                onChange={(heroYoutubeUrl) =>
                  setAwards({ ...awards, content: { ...awards.content, heroYoutubeUrl } })
                }
              />
              <Input
                label="Partner label"
                value={awards.content.partnerLabel}
                onChange={(partnerLabel) =>
                  setAwards({ ...awards, content: { ...awards.content, partnerLabel } })
                }
              />
              <ImageUploadField
                label="Partner logo"
                value={awards.content.partnerLogoUrl}
                onChange={(partnerLogoUrl) =>
                  setAwards({ ...awards, content: { ...awards.content, partnerLogoUrl } })
                }
                altText="Business Excellence Awards partner logo"
              />
            </article>
            <div className="admin-list">
              {awards.content.accordions?.map((item, index) => (
                <article className="admin-card" key={`${item.key}-${index}`}>
                  <Input
                    label="Accordion title"
                    value={item.title}
                    onChange={(title) => updateAwardAccordion(index, { ...item, title })}
                  />
                  <label>
                    Content layout
                    <select
                      value={item.type}
                      onChange={(event) => {
                        const type = event.target.value;
                        updateAwardAccordion(index, {
                          key: item.key,
                          title: item.title,
                          type,
                          ...(type === 'groups'
                            ? { groups: [] }
                            : type === 'timeline'
                              ? { items: [] }
                              : type === 'ordered'
                                ? { items: [] }
                                : { sections: [] }),
                        });
                      }}
                    >
                      <option value="groups">Headings, descriptions and links</option>
                      <option value="timeline">Timeline cards</option>
                      <option value="ordered">Numbered list</option>
                      <option value="sections">Content sections</option>
                    </select>
                  </label>
                  <NormalAccordionEditor
                    value={item}
                    onChange={(next) => updateAwardAccordion(index, next)}
                  />
                  <button
                    className="button small"
                    onClick={() =>
                      setAwards({
                        ...awards,
                        content: {
                          ...awards.content,
                          accordions: awards.content.accordions.filter((_, i) => i !== index),
                        },
                      })
                    }
                  >
                    Remove accordion
                  </button>
                </article>
              ))}
            </div>
            <button
              className="button small"
              onClick={() =>
                setAwards({
                  ...awards,
                  content: {
                    ...awards.content,
                    accordions: [
                      ...(awards.content.accordions || []),
                      { key: `section-${Date.now()}`, title: 'New Section', type: 'groups', groups: [] },
                    ],
                  },
                })
              }
            >
              Add accordion
            </button>{' '}
            <button
              className="button small"
              onClick={async () => {
                await api('/admin/awards', {
                  method: 'PUT',
                  body: JSON.stringify({ content: awards.content }),
                });
                notify('Awards page saved.');
              }}
            >
              Save awards page
            </button>
            <h2>Recent award registrations</h2>
            {awards.applications?.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Categories</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {awards.applications.map((row) => (
                      <tr key={row.public_id}>
                        <td>{new Date(row.created_at).toLocaleString()}</td>
                        <td>
                          {row.full_name}
                          <br />
                          <small>{row.email}</small>
                        </td>
                        <td>{row.company}</td>
                        <td>
                          {(typeof row.categories === 'string'
                            ? JSON.parse(row.categories)
                            : row.categories
                          ).join(', ')}
                        </td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No award registrations yet.</p>
            )}
          </section>
        )}

        {section === 'felicitation' && (
          <section>
            <p>
              Add the YouTube video shown as the Circle of Excellence banner. It plays automatically, muted
              and in a continuous loop without controls.
            </p>
            <article className="admin-card">
              <Input
                label="Felicitation banner YouTube URL"
                value={felicitation.hero_youtube_url}
                onChange={(hero_youtube_url) => setFelicitation({ ...felicitation, hero_youtube_url })}
              />
              <small>Paste a YouTube watch, share, Shorts, live or embed URL.</small>
              <button
                className="button small"
                onClick={async () => {
                  await api('/admin/felicitation', {
                    method: 'PUT',
                    body: JSON.stringify(felicitation),
                  });
                  notify('Felicitation video banner saved.');
                }}
              >
                Save video banner
              </button>
            </article>
          </section>
        )}

        {section === 'articles' && (
          <section>
            <p>Search articles quickly and open only the article you want to edit.</p>
            <div className="admin-article-toolbar">
              <label>
                Search articles
                <input
                  type="search"
                  value={articleSearch}
                  placeholder="Search by title, category or status"
                  onChange={(event) => setArticleSearch(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="button small"
                onClick={() => setShowArticleCreate(!showArticleCreate)}
              >
                {showArticleCreate ? 'Close new article' : 'Create new article'}
              </button>
            </div>
            {showArticleCreate && (
              <form
                className="admin-card admin-article-create"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newArticleBody.replace(/<[^>]*>/g, '').trim()) {
                    notify('Please add the article content.');
                    return;
                  }
                  await api('/admin/articles', {
                    method: 'POST',
                    body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
                  });
                  e.currentTarget.reset();
                  setNewArticleBody('');
                  setShowArticleCreate(false);
                  setArticles(await api('/admin/articles'));
                  notify('Draft created.');
                }}
              >
                <h2>Create a new article</h2>
                <label>
                  Title
                  <input name="title" required />
                </label>
                <label>
                  Slug
                  <input name="slug" placeholder="example-article-title" required />
                </label>
                <label>
                  Excerpt
                  <textarea name="excerpt" />
                </label>
                <label>
                  Category
                  <input name="category" placeholder="For example: Industry Insights" required />
                </label>
                <ImageUploadField label="Featured image" name="featured_image_url" required />
                <RichTextEditor
                  label="Article content"
                  name="body_html"
                  value={newArticleBody}
                  onChange={setNewArticleBody}
                />
                <button className="button small">Create draft</button>
              </form>
            )}
            <div className="admin-article-list">
              {articles
                .map((article, index) => ({ article, index }))
                .filter(({ article }) => {
                  const search = articleSearch.trim().toLowerCase();
                  return (
                    !search ||
                    [article.title, article.category, article.status, article.slug]
                      .join(' ')
                      .toLowerCase()
                      .includes(search)
                  );
                })
                .map(({ article: a, index }) => {
                  const isEditing = editingArticleId === a.id;
                  return (
                    <article className={`admin-article-item${isEditing ? ' editing' : ''}`} key={a.id}>
                      <div className="admin-article-summary">
                        {a.featured_image_url ? (
                          <img src={a.featured_image_url} alt="" />
                        ) : (
                          <span className="admin-article-image-placeholder">No image</span>
                        )}
                        <div className="admin-article-summary-copy">
                          <h3>{a.title}</h3>
                          <p>
                            {a.category || 'Uncategorised'} <span>·</span> /blog/{a.slug}/
                          </p>
                          {a.updated_at && (
                            <small>Updated {new Date(a.updated_at).toLocaleDateString('en-IN')}</small>
                          )}
                        </div>
                        <span className={`admin-status admin-status-${a.status}`}>{a.status}</span>
                        <button
                          type="button"
                          className="button small secondary"
                          onClick={() => setEditingArticleId(isEditing ? null : a.id)}
                        >
                          {isEditing ? 'Close editor' : 'Edit article'}
                        </button>
                      </div>
                      {isEditing && (
                        <div className="admin-article-editor">
                          {[
                            ['Title', 'title'],
                            ['Category', 'category'],
                            ['Excerpt', 'excerpt', 'textarea'],
                            ['SEO title', 'seo_title'],
                            ['SEO description', 'seo_description', 'textarea'],
                          ].map(([label, key, type]) => (
                            <Input
                              key={key}
                              label={label}
                              type={type}
                              value={a[key]}
                              onChange={(value) =>
                                setArticles(
                                  articles.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
                                )
                              }
                            />
                          ))}
                          <RichTextEditor
                            label="Article content"
                            value={a.body_html}
                            onChange={(body_html) =>
                              setArticles(
                                articles.map((row, i) => (i === index ? { ...row, body_html } : row)),
                              )
                            }
                          />
                          <ImageUploadField
                            label="Featured image"
                            value={a.featured_image_url}
                            onChange={(featured_image_url) =>
                              setArticles(
                                articles.map((row, i) =>
                                  i === index ? { ...row, featured_image_url } : row,
                                ),
                              )
                            }
                            altText={a.title}
                          />
                          <label>
                            Status
                            <select
                              value={a.status}
                              onChange={(e) =>
                                setArticles(
                                  articles.map((row, i) =>
                                    i === index ? { ...row, status: e.target.value } : row,
                                  ),
                                )
                              }
                            >
                              <option value="draft">Draft</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="published">Published</option>
                              <option value="archived">Archived</option>
                            </select>
                          </label>
                          <div className="admin-article-actions">
                            <button
                              type="button"
                              className="button small"
                              onClick={async () => {
                                await api(`/admin/articles/${a.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify(a),
                                });
                                setArticles(await api('/admin/articles'));
                                setEditingArticleId(null);
                                notify('Article saved.');
                              }}
                            >
                              Save article
                            </button>
                            {a.status === 'published' && (
                              <a
                                className="button small secondary"
                                href={`/blog/${a.slug}/`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View article
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
            </div>
          </section>
        )}

        {section === 'media' && (
          <section>
            <form className="admin-card media-form" onSubmit={uploadMedia}>
              <label>
                Image or PDF
                <input
                  type="file"
                  name="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
                  required
                />
              </label>
              <label>
                Description / alt text
                <input name="alt_text" required />
              </label>
              <label>
                Source URL
                <input name="source_url" type="url" />
              </label>
              <label>
                Source page
                <input name="source_page" />
              </label>
              <button className="button small">Upload</button>
            </form>
            <div className="media-list">
              {media.map((item) => (
                <div key={item.id}>
                  {item.mime_type === 'application/pdf' ? (
                    <a
                      className="media-document"
                      href={`/media/${item.storage_key}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <b>PDF</b>
                      <small>{item.file_name}</small>
                    </a>
                  ) : (
                    <img src={`/media/${item.storage_key}`} alt={item.alt_text} />
                  )}
                  <span>{item.alt_text}</span>
                  <code>/media/{item.storage_key}</code>
                  <button
                    type="button"
                    className="button small secondary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(`/media/${item.storage_key}`);
                      notify('Media link copied.');
                    }}
                  >
                    Copy link
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
        {section === 'submissions' && (
          <section>
            <a className="button small" href="/api/admin/submissions.csv">
              Export CSV
            </a>
            {submissions.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Form</th>
                      <th>Payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((row) => (
                      <tr key={row.id}>
                        <td>{new Date(row.created_at).toLocaleString()}</td>
                        <td>{row.form_key}</td>
                        <td>
                          <code>
                            {typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload)}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No submissions.</p>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

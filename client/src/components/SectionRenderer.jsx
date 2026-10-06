function MediaSlot({ item }) {
  if (item.image_url) return <img src={item.image_url} alt={item.image_alt || ''} loading="lazy" />;
  return (
    <div className="media-pending" role="img" aria-label={item.image_alt || 'Approved media pending'}>
      Approved media pending
    </div>
  );
}

export default function SectionRenderer({ section }) {
  const items = section.items || [];
  if (section.type === 'hero')
    return (
      <section className="hero">
        <div className="container narrow">
          <p className="eyebrow">{section.kicker}</p>
          <h1>{section.heading}</h1>
          <p className="lead">{section.body}</p>
          <div className="actions">
            {items.map((i) => (
              <a key={i.title} className="button" href={i.url || '#contact'}>
                {i.title}
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  if (section.type === 'stats')
    return (
      <section className="stats">
        <div className="container stats-grid">
          {items.map((i) => (
            <div key={i.title}>
              <strong>{i.value}</strong>
              <span>{i.title}</span>
            </div>
          ))}
        </div>
      </section>
    );
  if (section.type === 'cards')
    return (
      <section className="section">
        <div className="container">
          <p className="eyebrow">{section.kicker}</p>
          <h2>{section.heading}</h2>
          {section.body && <p className="section-intro">{section.body}</p>}
          <div className="card-grid">
            {items.map((i) => (
              <article className="card" key={`${i.title}-${i.subtitle || ''}`}>
                <MediaSlot item={i} />
                <div className="card-copy">
                  {i.number && <span className="number">{i.number}</span>}
                  <h3>{i.title}</h3>
                  {i.subtitle && <p>{i.subtitle}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  if (section.type === 'pricing')
    return (
      <section className="section dark">
        <div className="container">
          <h2>{section.heading}</h2>
          <div className="price-grid">
            {items.map((i) => (
              <article className="price-card" key={i.title}>
                <h3>{i.title}</h3>
                {i.old_price && <del>{i.old_price}</del>}
                <strong>{i.price}</strong>
                <p>{i.subtitle}</p>
                <a className="button" href={i.url || '#contact'}>
                  Book a Ticket
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  if (section.type === 'richtext')
    return (
      <section className="section">
        <div className="container narrow">
          <h2>{section.heading}</h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: section.body_html || '' }} />
        </div>
      </section>
    );
  return null;
}

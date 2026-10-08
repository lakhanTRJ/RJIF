import { useEffect, useMemo, useState } from 'react';
import reference from '../../data/reference.generated.json';
import { api } from '../../api.js';
import { SiteHeader, VideoModal, Footer } from '../../components/reference/ReferenceShared.jsx';

const CURRENT_YEAR = 2026;

function HighlightCard({ item, onOpen }) {
  return (
    <button type="button" className="edition-video-card" onClick={() => onOpen(item)}>
      <span className="edition-video-image">
        <img src={item.image} alt={`${item.title} video cover`} loading="lazy" />
        <span className="edition-play" aria-hidden="true">
          ▶
        </span>
      </span>
      <span className="edition-video-copy">
        <small>{item.section === 'session' ? 'Session highlight' : 'Event highlight'}</small>
        <strong>{item.title}</strong>
      </span>
    </button>
  );
}

function PhotoLightbox({ item, onClose, onPrevious, onNext }) {
  useEffect(() => {
    if (!item) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrevious();
      if (event.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [item, onClose, onPrevious, onNext]);
  if (!item) return null;
  return (
    <div
      className="edition-lightbox"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section role="dialog" aria-modal="true" aria-label={item.alt || 'Event photograph'}>
        <button type="button" className="edition-lightbox-close" onClick={onClose} aria-label="Close image">
          ×
        </button>
        <button
          type="button"
          className="edition-lightbox-arrow previous"
          onClick={onPrevious}
          aria-label="Previous image"
        >
          ‹
        </button>
        <img src={item.image} alt={item.alt || 'Previous edition event photograph'} />
        <button
          type="button"
          className="edition-lightbox-arrow next"
          onClick={onNext}
          aria-label="Next image"
        >
          ›
        </button>
      </section>
    </div>
  );
}

export default function HighlightsPage({ path, south = false }) {
  const forum = south ? 'south' : 'india';
  const fallbackGallery = (south ? reference.southConference.gallery : reference.home.gallery).map(
    (item, index) => ({ ...item, id: `fallback-photo-${index}`, event_year: CURRENT_YEAR }),
  );
  const fallbackVideos = south
    ? []
    : reference.highlights.videos.slice(0, 5).map((item, index) => ({
        ...item,
        id: `fallback-video-${index}`,
        section: index < 3 ? 'session' : 'event',
        event_year: CURRENT_YEAR,
        title: ['Abhishek Raniwala', 'Ishu Datwani', 'Riva Dhir', 'Forum', 'Awards'][index],
      }));
  const [gallery, setGallery] = useState(fallbackGallery);
  const [videos, setVideos] = useState(fallbackVideos);
  const [activeYear, setActiveYear] = useState(CURRENT_YEAR);
  const [visibleCount, setVisibleCount] = useState(12);
  const [activeVideo, setActiveVideo] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([api(`/public/forum/${forum}`), api(`/public/highlights?forum=${forum}`)])
      .then(([content, highlightRows]) => {
        if (!active) return;
        if (content.gallery?.length) {
          setGallery(content.gallery);
          setActiveYear(Math.max(...content.gallery.map((item) => Number(item.event_year)).filter(Boolean)));
        }
        if (highlightRows.length) setVideos(highlightRows);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [forum]);

  const years = useMemo(
    () => [...new Set(gallery.map((item) => Number(item.event_year)).filter(Boolean))].sort((a, b) => b - a),
    [gallery],
  );
  useEffect(() => {
    if (years.length && !years.includes(activeYear)) setActiveYear(years[0]);
  }, [activeYear, years]);
  useEffect(() => setVisibleCount(12), [activeYear]);

  const yearGallery = gallery.filter((item) => Number(item.event_year) === activeYear);
  const yearVideos = videos.filter((item) => Number(item.event_year) === activeYear);
  const heroImage = yearGallery[1]?.image || yearGallery[0]?.image || fallbackGallery[0]?.image;
  const featured = yearGallery.slice(0, 5);
  const visibleGallery = yearGallery.slice(0, visibleCount);
  const lightboxItem = lightboxIndex === null ? null : yearGallery[lightboxIndex];
  const moveLightbox = (direction) =>
    setLightboxIndex((index) => (index + direction + yearGallery.length) % yearGallery.length);

  return (
    <div className={`reference-site previous-edition-page ${south ? 'south-edition' : ''}`}>
      <SiteHeader path={path} />
      <section className="edition-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div>
          <h1>Previous Edition Highlights</h1>
          <span />
          <p>Relive the ideas, conversations and connections that shaped the forum.</p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="edition-section edition-featured">
          <div className={`edition-feature-grid count-${featured.length}`}>
            {featured.map((item, index) => (
              <button type="button" key={item.id || item.image} onClick={() => setLightboxIndex(index)}>
                <img
                  src={item.image}
                  alt={item.alt || `${south ? 'South' : 'India'} Forum highlight`}
                  loading="lazy"
                />
                {index === 0 && (
                  <span>
                    <strong>Conversations that shaped the industry</strong>
                    <b aria-hidden="true">›</b>
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {yearVideos.length > 0 && (
        <section className="edition-section edition-videos">
          <div className="edition-watch-layout">
            <div className="edition-heading">
              <h2>Watch the highlights</h2>
              <span />
            </div>
            <div className="edition-video-grid">
              {yearVideos.slice(0, 3).map((item) => (
                <HighlightCard item={item} onOpen={setActiveVideo} key={item.id || item.url} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="edition-section edition-gallery" id="gallery">
        <div className="edition-gallery-heading">
          <div className="edition-heading">
            <h2>Photo gallery</h2>
            <span />
          </div>
          {years.length > 0 && (
            <div className="edition-year-tabs" aria-label="Filter gallery by year">
              {years.map((year) => (
                <button
                  type="button"
                  key={year}
                  className={year === activeYear ? 'active' : ''}
                  onClick={() => setActiveYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="edition-photo-grid">
          {visibleGallery.map((item, index) => (
            <button type="button" key={item.id || item.image} onClick={() => setLightboxIndex(index)}>
              <img
                src={item.image}
                alt={item.alt || `${south ? 'South' : 'India'} Forum gallery`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
        {visibleCount < yearGallery.length && (
          <button
            type="button"
            className="edition-load-more"
            onClick={() => setVisibleCount((count) => count + 12)}
          >
            Load more photos <span aria-hidden="true">⌄</span>
          </button>
        )}
      </section>

      <div id="contact" />
      <Footer />
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      <PhotoLightbox
        item={lightboxItem}
        onClose={() => setLightboxIndex(null)}
        onPrevious={() => moveLightbox(-1)}
        onNext={() => moveLightbox(1)}
      />
    </div>
  );
}

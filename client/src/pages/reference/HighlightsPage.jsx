import { useEffect, useState } from 'react';
import reference from '../../data/reference.generated.json';
import { api } from '../../api.js';
import {
  A,
  SiteHeader,
  SectionTitle,
  VideoModal,
  Contacts,
  Footer,
} from '../../components/reference/ReferenceShared.jsx';

function HighlightCard({ item, onOpen }) {
  return (
    <button type="button" className="highlight-card" onClick={() => onOpen(item)}>
      <img src={item.image} alt={`${item.title} video cover`} />
      <span className="play">▶</span>
      <h3>{item.title}</h3>
    </button>
  );
}

function HighlightCarousel({ items, onOpen }) {
  const [start, setStart] = useState(0);
  useEffect(() => setStart(0), [items.length]);
  const count = Math.min(3, items.length);
  const shown = Array.from({ length: count }, (_, offset) => items[(start + offset) % items.length]);
  const move = (direction) => setStart((index) => (index + direction + items.length) % items.length);
  return (
    <div className="highlight-carousel">
      <button
        type="button"
        className="carousel-arrow previous"
        onClick={() => move(-1)}
        disabled={items.length <= 3}
        aria-label="Previous session highlights"
      >
        ‹
      </button>
      <div className="video-cards">
        {shown.map((item) => (
          <HighlightCard item={item} onOpen={onOpen} key={item.id || item.url} />
        ))}
      </div>
      <button
        type="button"
        className="carousel-arrow next"
        onClick={() => move(1)}
        disabled={items.length <= 3}
        aria-label="Next session highlights"
      >
        ›
      </button>
    </div>
  );
}

function Highlights({ path }) {
  const fallback = reference.highlights.videos.slice(0, 5).map((item, index) => ({
    ...item,
    id: `fallback-${index}`,
    section: index < 3 ? 'session' : 'event',
    title: ['Abhishek Raniwala', 'Ishu Datwani', 'Riva Dhir', 'Forum', 'Awards'][index],
  }));
  const [videos, setVideos] = useState(fallback);
  const [activeVideo, setActiveVideo] = useState(null);
  useEffect(() => {
    let active = true;
    api('/public/highlights')
      .then((rows) => active && rows.length && setVideos(rows))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const sessions = videos.filter((item) => item.section === 'session'),
    events = videos.filter((item) => item.section === 'event');
  return (
    <div className="reference-site highlights-page">
      <SiteHeader path={path} />
      <section
        className="highlight-hero"
        style={{ backgroundImage: `url(${A('2026/09/the-retail-jeweller-forum-2-scaled.jpeg')})` }}
      />
      <section className="ref-section">
        <SectionTitle>Session Highlights</SectionTitle>
        <HighlightCarousel items={sessions} onOpen={setActiveVideo} />
      </section>
      <section className="ref-section">
        <SectionTitle>Event Highlights</SectionTitle>
        <div className="video-cards event-videos">
          {events.map((item) => (
            <HighlightCard item={item} onOpen={setActiveVideo} key={item.id || item.url} />
          ))}
        </div>
      </section>
      <Contacts />
      <Footer />
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}

export default Highlights;

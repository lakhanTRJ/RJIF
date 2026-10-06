/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import reference from '../../data/reference.generated.json';
import { api } from '../../api.js';
import {
  indiaAgenda,
  southAgenda,
  useForumContent,
  YoutubeVideo,
  SiteHeader,
  SectionTitle,
  Button,
  EnquiryModal,
  Gallery,
  Contacts,
  Footer,
  SpeakerGrid,
  PostAgendaBanner,
  PromotionalBanner,
  EventOverview,
} from '../../components/reference/ReferenceShared.jsx';

function Home({ south = false, path }) {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [speakerLimit, setSpeakerLimit] = useState(12);
  useEffect(() => setSpeakerLimit(12), [south]);
  const content = useForumContent(south ? 'south' : 'india');
  const settings = content?.settings || {};
  const speakers = content?.featuredSpeakers?.length
    ? content.featuredSpeakers
    : south
      ? reference.southConference.speakers
      : reference.home.speakers;
  const gallery = content?.gallery?.length
    ? content.gallery
    : south
      ? reference.southConference.gallery
      : reference.home.gallery;
  const agenda = content?.agenda?.length
    ? content.agenda.map((item) => [item.number, item.title, item.subtitle, item.body])
    : south
      ? southAgenda
      : indiaAgenda;
  const fallbackStats = south
    ? [
        ['35+', 'Speakers', ''],
        ['150+', 'Attendees', ''],
        ['30+', 'Exhibitors', ''],
        ['480+', 'Minutes of Learning', ''],
      ]
    : [
        ['12', 'Years', 'Sharing Knowledge'],
        ['50+', 'Speakers', ''],
        ['250+', 'Attendees', ''],
        ['40+', 'Exhibitors', ''],
        ['480+', 'Minutes of Learning', ''],
      ];
  const stats =
    Array.isArray(settings.overview_stats) && settings.overview_stats.length
      ? settings.overview_stats.map((item) => [item.number, item.label, item.caption])
      : fallbackStats;
  const heroUrl =
    settings.hero_youtube_url || (south ? 'https://youtu.be/40EdADsjqcM' : 'https://youtu.be/B3aomEHlo6Q');
  const contentUrl =
    settings.content_youtube_url ||
    (south ? 'https://youtu.be/z13yd2PRQ74' : 'https://www.youtube.com/embed/gJPEgWkEB38');
  return (
    <div className="reference-site">
      <SiteHeader path={path} />
      <section className="home-hero">
        <YoutubeVideo url={heroUrl} background title={`${south ? 'South' : 'India'} Forum event film`} />
        <div className="hero-actions">
          <Button light href="#passes">
            Register Now
          </Button>
          <Button light onClick={() => setEnquiryOpen(true)}>
            Exhibit Now
          </Button>
        </div>
      </section>
      <EventOverview
        south={south}
        contentUrl={contentUrl}
        stats={stats}
        date={settings.event_date || '7th Jan 2027'}
        location={settings.event_location || 'Grand Hyatt Mumbai'}
      />
      <section className="ref-section speakers-home" id="speakers">
        <SectionTitle>{settings.speaker_heading || 'Speakers 2026'}</SectionTitle>
        <SpeakerGrid speakers={speakers} limit={speakerLimit} />
        <div className="row-buttons">
          {speakerLimit < speakers.length && (
            <Button light onClick={() => setSpeakerLimit((limit) => Math.min(limit + 12, speakers.length))}>
              View More
            </Button>
          )}
          <Button light href={south ? '/south-forum-speakers/' : '/speakers/'}>
            Past Speakers
          </Button>
        </div>
      </section>
      <PromotionalBanner settings={settings} south={south} />
      {settings.agenda_visible !== 0 && (
        <>
          <section className="agenda-section" id="agenda">
            <SectionTitle>Agenda</SectionTitle>
            <div className="agenda-grid">
              {agenda.map(([n, title, sub, copy]) => (
                <article key={`${n}-${title}`}>
                  <strong>{n}</strong>
                  <h3>{title}</h3>
                  <h4>{sub}</h4>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </section>
          <div className="agenda-banner-spacer" aria-hidden="true" />
        </>
      )}
      {!south && <PostAgendaBanner settings={settings} />}
      {settings.passes_visible !== 0 && (
        <Passes south={south} columns={settings.pass_columns || (south ? 3 : 4)} />
      )}
      {settings.gallery_visible !== 0 && (
        <Gallery
          items={gallery}
          label={settings.gallery_heading || 'Previous Event Glimpses'}
          target={settings.gallery_target_url || '/previous-edition-highlights/'}
        />
      )}
      <Contacts />
      <Footer />
      <EnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </div>
  );
}

function money(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(paise || 0) / 100);
}
function Passes({ south = false, columns = south ? 3 : 4 }) {
  const fallback = south
    ? [
        {
          code: 'south-group',
          name: 'Group Pass',
          regular_price_paise: 1500000,
          sale_price_paise: 900000,
          member_count: 3,
        },
        {
          code: 'south-non-retailer',
          name: 'Non-Retailer Pass',
          regular_price_paise: 1000000,
          sale_price_paise: 750000,
          member_count: 1,
        },
        {
          code: 'south-retailer',
          name: 'Retailer Individual Pass',
          regular_price_paise: 500000,
          sale_price_paise: 375000,
          member_count: 1,
        },
      ]
    : [
        {
          code: 'india-single',
          name: 'Single Pass',
          regular_price_paise: 1000000,
          sale_price_paise: 750000,
          member_count: 1,
        },
        {
          code: 'india-corporate',
          name: 'Corporate Pass',
          regular_price_paise: 3000000,
          sale_price_paise: 1800000,
          member_count: 3,
        },
        {
          code: 'india-leadership',
          name: 'Leadership Pass',
          regular_price_paise: 5000000,
          sale_price_paise: 2500000,
          member_count: 5,
        },
        {
          code: 'india-non-retailer',
          name: 'Non-Retailer',
          regular_price_paise: 2500000,
          sale_price_paise: 1000000,
          member_count: 1,
        },
      ];
  const [passes, setPasses] = useState(fallback);
  useEffect(() => {
    api(`/public/products?forum=${south ? 'south' : 'india'}`)
      .then((rows) => {
        const paid = rows.filter((pass) => Number(pass.sale_price_paise) > 0);
        if (paid.length) setPasses(paid);
      })
      .catch(() => {});
  }, [south]);
  return (
    <section className="ref-section passes" id="passes">
      <SectionTitle>Delegate Pass</SectionTitle>
      <div style={{ '--pass-columns': columns }}>
        {passes.map((pass) => (
          <article key={pass.code}>
            <h3>{pass.name}</h3>
            <p className="pass-validity">
              Valid for {pass.member_count || 1} {(pass.member_count || 1) === 1 ? 'person' : 'persons'}
            </p>
            <div className="pass-price">
              {pass.regular_price_paise && <del>{money(pass.regular_price_paise)}</del>}
              <strong>{money(pass.sale_price_paise)}</strong>
              <small>per person</small>
            </div>
            <Link to={`/checkout/?pass=${pass.code}`}>
              Book a Ticket <span>→</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Home;
export { money, Passes };

import { useEffect, useState } from 'react';
import reference from '../../data/reference.generated.json';
import { api } from '../../api.js';
import {
  A,
  SiteHeader,
  SectionTitle,
  Button,
  EnquiryModal,
  Gallery,
  Contacts,
  Footer,
} from '../../components/reference/ReferenceShared.jsx';

function Exhibition({ south = false, path }) {
  const data = south ? reference.southExhibition : reference.exhibition;
  const [testimonial, setTestimonial] = useState(0);
  const [testimonials, setTestimonials] = useState(data.testimonials);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  useEffect(() => {
    let active = true;
    api(`/public/testimonials?forum=${south ? 'south' : 'india'}`)
      .then((rows) => {
        if (active && rows.length) {
          setTestimonials(rows);
          setTestimonial(0);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [south]);
  const shown = testimonials.length
    ? Array.from(
        { length: Math.min(3, testimonials.length) },
        (_, offset) => testimonials[(testimonial + offset) % testimonials.length],
      )
    : [];
  const move = (direction) =>
    setTestimonial((index) => (index + direction + testimonials.length) % testimonials.length);
  return (
    <div className="reference-site">
      <SiteHeader path={path} section="exhibition" />
      <section
        className="inner-hero exhibit-hero"
        style={{ backgroundImage: `linear-gradient(#0008,#0008),url(${A('2025/07/Exhibit.jpg')})` }}
      >
        <h1>Retail Service Providers</h1>
        <Button light onClick={() => setEnquiryOpen(true)}>
          Exhibit Now
        </Button>
      </section>
      <section className="ref-section exhibit-intro" id="about">
        <SectionTitle>Exhibition</SectionTitle>
        <div className="exhibit-image">
          <img src={A('2025/07/Exhibit-2.jpg')} alt="Retail Jeweller Forum exhibition" />
          <div>
            <b>Network.</b>
            <b>Collaborate.</b>
            <b>Grow.</b>
          </div>
        </div>
        <h3>Exhibit at the Retail Jeweller Forum</h3>
        <div className="intro-copy">
          <p>
            Connect with top jewellery retailers seeking innovative solutions for their business. Showcase
            your products and services, build partnerships, and grow your brand in India’s premier B2B
            jewellery networking platform.
          </p>
          <Button onClick={() => setEnquiryOpen(true)}>Exhibit Now</Button>
        </div>
      </section>
      <section className="ref-section testimonials" id="testimonials">
        <SectionTitle>Testimonials</SectionTitle>
        <div className="testimonial-carousel">
          <button
            type="button"
            className="carousel-arrow previous"
            onClick={() => move(-1)}
            aria-label="Previous testimonials"
          >
            ‹
          </button>
          <div className="testimonial-row">
            {shown.map((item) => (
              <article key={item.id || item.name}>
                <p>{item.quote}</p>
                <div>
                  {item.image && <img src={item.image} alt={item.name} />}
                  <span>
                    <b>{item.name}</b>
                    <small>{item.role}</small>
                  </span>
                </div>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="carousel-arrow next"
            onClick={() => move(1)}
            aria-label="Next testimonials"
          >
            ›
          </button>
        </div>
        <div className="dots">
          {testimonials.map((_, i) => (
            <button
              className={i === testimonial ? 'active' : ''}
              onClick={() => setTestimonial(i)}
              key={i}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </section>
      <section className="quote-banner exhibition-quote">
        <div>
          <b>“</b>
          <h2>
            {south
              ? 'Where the retailers who lead the south come to lead change Join The Discussion.'
              : 'Where retail isn’t just discussed, it’s reimagined.'}
          </h2>
          <div className="quote-actions">
            <Button href={south ? '/conference-south/#passes' : '/#passes'}>Register</Button>
            <Button onClick={() => setEnquiryOpen(true)}>Exhibit</Button>
          </div>
        </div>
      </section>
      <Gallery items={data.gallery} label="Previous Editions" />
      <Contacts />
      <Footer />
      <EnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </div>
  );
}

export default Exhibition;

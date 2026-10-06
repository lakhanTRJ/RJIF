import { useState } from 'react';
import {
  A,
  SiteHeader,
  SectionTitle,
  Button,
  EnquiryModal,
  Contacts,
  Footer,
} from '../../components/reference/ReferenceShared.jsx';

const sponsorships = [
  ['Lanyard Branding', 'Co-branded lanyards worn by all 300 delegates.', 'Rs. 2,50,000/-'],
  [
    'Delegate Kit Inserts',
    'Add your brochure, flyer, or small product sample to each attendee kit',
    'Rs. 75,000/-',
  ],
  [
    'Main Stage Branding',
    'Logo featured on forum’s keynote stage backdrop during sessions',
    'Rs. 3,00,000/-',
  ],
  [
    'MD & CEO Awards Sponsor',
    'Branding integration in evening awards ceremony + special recognition',
    'Rs. 5,00,000/-',
  ],
  [
    'Networking Lunch Sponsor',
    'Sponsor branding during lunch breaks with table tents and digital screens',
    'Rs. 2,00,000/-',
  ],
  [
    'Table Branding',
    'Your brand on all VIP or roundtable placards during forum discussions',
    'Rs. 1,00,000/-',
  ],
  [
    'Registration Desk Branding',
    'Prime branding at the check-in desk, first visible touchpoint for all delegates.',
    'Rs. 1,50,000/-',
  ],
  ['Branded Water Bottles', 'Logo on 300+ water bottles distributed during the event.', 'Rs. 90,000/-'],
  ['Branded Notepads & Pens', 'Custom branded stationery placed on every delegate’s seat.', 'Rs. 1,25,000/-'],
  ['Coffee/Tea Counter Sponsor', 'Branding on coffee/tea zones during networking breaks.', 'Rs. 1,00,000/-'],
  [
    'Photo Wall/Backdrop Sponsor',
    'Co-branded backdrop at the MD & CEO Awards red carpet area.',
    'Rs. 1,75,000/-',
  ],
  [
    'Product Display Table',
    'Table space at the venue to showcase your offering to delegates.',
    'Rs. 1,25,000/-',
  ],
];

function Partner({ path }) {
  const [open, setOpen] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  return (
    <div className="reference-site partner-page">
      <SiteHeader path={path} />
      <section className="partner-hero" style={{ backgroundImage: `url(${A('2025/07/Exhibit.jpg')})` }} />
      <section className="partner-intro">
        <img
          src={A('2025/08/c1f752c1cc8765a4dc3f148ec52602d3de956bc2.webp')}
          alt="Retail Jeweller India Forum stage"
        />
        <div>
          <h1>Partner with India’s Premier Jewellery Leadership Platform</h1>
          <p>
            Since 2005, the Retail Jeweller India Forum has united 300+ top retailers, manufacturers, and
            industry leaders to spark strategic dialogue and drive progress. Renowned for meaningful
            conversations and actionable insights, RJIF remains the most trusted platform for industry
            exchange, recognition, and innovation.
          </p>
          <Button onClick={() => setEnquiryOpen(true)}>Partner Now</Button>
        </div>
      </section>
      <section className="ref-section sponsor-benefits">
        <SectionTitle>Why Sponsor RJIF 2027?</SectionTitle>
        <div>
          {[
            '300+ curated decision-makers from across India’s retail and manufacturing landscape',
            'Branding before, during and after the event — digital + on-ground + media integration',
            'Prime access to CEOs, MDs, Retail Heads, and Design Leaders',
            'Association with MD & CEO Awards, India’s most prestigious industry honour',
            'Curated formats for deeper brand engagement (luncheons, panel sessions, kits, and more)',
          ].map((text, index) => (
            <article key={text}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <p>{text}</p>
            </article>
          ))}
          <img src={A('2025/07/Im-1.jpg')} alt="Retail Jeweller Forum delegate materials" />
        </div>
      </section>
      <section className="sponsorship-table">
        <h2>Sponsorship Element</h2>
        {sponsorships.map((row, index) => (
          <article className={open === index ? 'open' : ''} key={row[0]}>
            <button onClick={() => setOpen(open === index ? -1 : index)}>
              <b>{row[0]}</b>
              <span>⌄</span>
            </button>
            <p>{row[1]}</p>
            <strong>{row[2]}</strong>
          </article>
        ))}
      </section>
      <section className="partner-cta">
        <div>
          <h2>Let’s Create Impact Together</h2>
          <p>
            Whether you want to build brand visibility, connect with retail leadership, or be part of India’s
            most influential jewellery awards — RJIF offers curated, high-impact opportunities.
          </p>
        </div>
        <div>
          <h2>Partner Now</h2>
          <p>For bookings or custom sponsorship ideas:</p>
          <b>Chirag Waghela</b>
          <a href="mailto:chirag.waghela@retailjewellerindia.com">chirag.waghela@retailjewellerindia.com</a>
          <a href="tel:+919167252611">+91 91672 52611</a>
        </div>
      </section>
      <Contacts variant="partner" />
      <Footer />
      <EnquiryModal type="Partnership enquiry" open={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </div>
  );
}

export default Partner;

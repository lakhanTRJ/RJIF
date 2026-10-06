const galleryFiles = [
  'Excellence-In-Strategic-Brand-Evolution-scaled.jpg',
  'Independent-Retailer-of-the-Year-scaled.jpg',
  'Legacy-Jeweller-of-the-Year-2-scaled.jpg',
  'Legacy-Jeweller-of-the-Year-scaled.jpg',
  'Omnichannel-Excellence-Recognition-scaled.jpg',
  'Retail-Chain-of-the-Year-scaled.jpg',
  'Retail-Innovation-of-the-Year-scaled.jpg',
  '6O8A1979-scaled.jpg',
  'Customer-Experience-of-the-Year-scaled.jpg',
  'Emerging-Brand-of-the-Year-scaled.jpg',
];

export default function FelicitationPage({ path, ui }) {
  const { SiteHeader, Button, Gallery, Contacts, Footer, asset } = ui;
  const gallery = galleryFiles.map((file) => ({
    image: asset(`2026/03/${file}`),
    alt: 'Retail Jeweller Circle of Excellence recipient',
  }));

  return (
    <div className="reference-site felicitation-page">
      <SiteHeader path={path} section="felicitation" />
      <section
        className="felicitation-hero"
        style={{ backgroundImage: `url(${asset('2025/07/Leadership-Awards.jpg')})` }}
      >
        <Button light href="#contact">
          Nominate Now
        </Button>
      </section>
      <section className="felicitation-about" id="about">
        <div className="felicitation-about-visual">
          <img
            src={asset('2025/12/WhatsApp-Image-2025-12-08-at-18.27.43.jpeg')}
            alt="Circle of Excellence South felicitation"
          />
        </div>
        <div className="felicitation-about-copy">
          <h1>Circle of Excellence</h1>
          <span className="red-rule" />
          <p>
            <b>Retail Jeweller Circle of Excellence – South</b> is a distinguished initiative that recognises
            excellence in jewellery design, craftsmanship, marketing, and leadership across South India’s
            vibrant jewellery sector.
          </p>
          <p>
            Unlike a contest or nomination-based award, this honour is curated through in-depth research and
            industry analysis, identifying standout achievements and inspiring benchmarks within the southern
            retail jewellery landscape.
          </p>
          <p>
            By highlighting innovation, creativity, and progressive leadership, the Felicitation acknowledges
            the pioneers driving growth in the region while offering a platform that encourages
            knowledge-sharing and collective advancement.
          </p>
          <p>
            This exclusive recognition not only celebrates excellence but also reinforces South India’s
            position as a powerhouse of jewellery artistry, innovation, and global influence.
          </p>
        </div>
      </section>
      <img
        className="felicitation-banner"
        src={asset('2025/12/Felicitation-banner-copy.jpg')}
        alt="Retail Jeweller Circle of Excellence South 2026"
      />
      <Gallery items={gallery} />
      <Contacts variant="awards" />
      <Footer />
    </div>
  );
}

import reference from '../../data/reference.generated.json';
import {
  A,
  useForumContent,
  SiteHeader,
  SectionTitle,
  Button,
  Contacts,
  Footer,
  SpeakerGrid,
} from '../../components/reference/ReferenceShared.jsx';

function Speakers({ south = false, path }) {
  const content = useForumContent(south ? 'south' : 'india');
  const speakers = content?.speakers?.length
    ? content.speakers
    : south
      ? reference.southSpeakers
      : reference.speakers;
  return (
    <div className="reference-site">
      <SiteHeader path={path} />
      <section className="speaker-hero" style={{ backgroundImage: `url(${A('2025/07/Speaker.jpg')})` }}>
        <Button light>Register Now</Button>
        <Button light>Join as Partner</Button>
      </section>
      <section className="ref-section speaker-directory">
        <SectionTitle>Speakers</SectionTitle>
        <p>
          Since 2014, RJIF has been the epicentre for Jewellery retail, service providers &amp; learning
          enthusiasts. It is the single largest congregation of forward-thinking jewellers shaping the
          organized transformation of the industry.
        </p>
        <SpeakerGrid speakers={speakers} />
      </section>
      <Contacts />
      <Footer />
    </div>
  );
}

export default Speakers;

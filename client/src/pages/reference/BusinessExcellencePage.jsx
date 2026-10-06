import { useEffect, useState } from 'react';
import awardsFallback from '../../data/awards.content.json';
import reference from '../../data/reference.generated.json';
import { api } from '../../api.js';

const GUIDELINES_URL = 'https://retailjewellerindiaforum.com/wp-content/uploads/2026/09/Business-Excellence-Awards-2027-Final-Submission-Guidelines.pdf';

function AwardAccordionBody({ section }) {
  if (section.type === 'timeline') return <div className="award-timeline-cards">{section.items?.map(item => <article key={item.title}><b>{item.title}</b><h3>{item.date}</h3><p>{item.body}</p></article>)}</div>;
  if (section.type === 'ordered') return <ol>{section.items?.map(item => <li key={item}>{item}</li>)}</ol>;
  if (section.type === 'sections') return <>{section.sections?.map(group => <section className="award-copy-group" key={group.title}><h3>{group.title}</h3><ul>{group.items?.map(item => <li key={item}>{item}</li>)}</ul></section>)}</>;
  return <>{section.intro && <p className="award-intro">{section.intro}</p>}{section.groups?.map(group => <section className="award-copy-group" key={group.title}><h3>{group.title}</h3><ul>{group.bullets?.map(item => <li key={item}>{item}</li>)}</ul>{group.link && <p>Guideline and Eligibility Criteria: <a href={group.link}>{group.linkText || 'Click Here'}</a></p>}</section>)}</>;
}

export default function BusinessExcellencePage({ path, ui }) {
  const { SiteHeader, SocialRail, YoutubeVideo, Gallery, Contacts, Footer, asset } = ui;
  const [open, setOpen] = useState('');
  const [content, setContent] = useState(awardsFallback);
  const [selected, setSelected] = useState([]);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/public/awards').then(data => data?.accordions?.length && setContent(data)).catch(() => {});
  }, []);

  const categories = (content.accordions?.find(item => item.key === 'categories')?.groups || []).map(item => item.title);
  const toggle = category => setSelected(selected.includes(category) ? selected.filter(item => item !== category) : [...selected, category]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const result = await api('/public/award-applications', { method: 'POST', body: JSON.stringify({ ...fields, categories: selected }) });
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="reference-site awards-page">
    <SiteHeader path={path} section="awards"/>
    <SocialRail/>
    <section className="awards-video-hero"><YoutubeVideo url={content.heroYoutubeUrl} background title="Business Excellence Awards film"/></section>
    <section className="awards-about" id="about">
      <div className="awards-about-visual"><img src={asset('2025/07/MD-CEO-Awards.jpeg')} alt="Retail Jeweller Business Excellence Awards presentation"/></div>
      <div className="awards-about-copy">
        <h1>Retail Jeweller India Business Excellence Awards</h1>
        <span className="red-rule"/>
        <p>In a dynamic and competitive jewellery industry, excellence is reflected in every aspect of a business, from bold ideas and breakthrough strategies to technology, customer experience, workplace culture, growth and meaningful impact.</p>
        <p>The Retail Jeweller Business Excellence Awards recognises the achievements and initiatives of businesses and individuals that are setting new benchmarks and advancing jewellery retail.</p>
        <p>Across business models, markets and stages of growth, the awards celebrate excellence that is shaping a stronger future for the industry.</p>
        <div className="awards-partner"><span>{content.partnerLabel || 'Knowledge Partner'}</span><img src={content.partnerLogoUrl || asset('partners/deloitte-logo-black.jpg')} alt="Deloitte"/></div>
      </div>
    </section>
    <section className="award-accordions" id="guidelines">{content.accordions?.map(section => <div id={section.key === 'timeline' ? 'timeline' : undefined} key={section.key}><button aria-expanded={open === section.key} onClick={() => setOpen(open === section.key ? '' : section.key)}>{section.title}<span>{open === section.key ? '⌃' : '⌄'}</span></button>{open === section.key && <div className="accordion-panel"><AwardAccordionBody section={section}/></div>}</div>)}</section>
    <section className="award-form" id="categories">
      <div className="steps"><b className={step === 1 ? 'active' : ''}>1<small>Apply</small></b><i/><b className={step === 2 ? 'active' : ''}>2<small>Contact Info</small></b></div>
      {step === 1 ? <>
        <h2>Select the categories to submit the nominations for the Business Excellence Awards 2027</h2>
        <p className="award-guidelines-link"><a href={GUIDELINES_URL} target="_blank" rel="noreferrer">Submission Guidelines</a></p>
        <div className="award-category-grid">{categories.map(item => <label key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)}/><span>{item}</span></label>)}</div>
        <button className="ref-button" disabled={!selected.length} onClick={() => setStep(2)}>Continue to Registration</button>
      </> : <form onSubmit={submit}>
        <h2>Contact information</h2>
        <div className="award-contact-grid"><label>Full Name<input name="full_name" required/></label><label>Company<input name="company" required/></label><label>Mobile Number<input name="mobile" required/></label><label>Email<input name="email" type="email" required/></label><label>Coordinator Name<input name="coordinator_name" required/></label><label>Coordinator Number<input name="coordinator_number" required/></label><label className="wide">GSTIN<input name="gstin"/></label><label>City<input name="city" required/></label><label>State<input name="state" required/></label><label className="wide">Billing Address<textarea name="billing_address" rows="3"/></label></div>
        {message && <p className="form-error">{message}</p>}
        <div className="form-actions"><button type="button" className="ref-button light" onClick={() => setStep(1)}>Back</button><button className="ref-button" disabled={busy}>{busy ? 'Saving…' : 'Proceed to Payment'}</button></div>
      </form>}
    </section>
    <Gallery items={reference.awards.gallery}/>
    <Contacts variant="awards"/>
    <Footer/>
  </div>;
}

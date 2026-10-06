import { useMemo } from 'react';
import BusinessExcellencePage from '../pages/reference/BusinessExcellencePage.jsx';
import FelicitationPage from '../pages/reference/FelicitationPage.jsx';
import HomePage from '../pages/reference/HomePage.jsx';
import ExhibitionPage from '../pages/reference/ExhibitionPage.jsx';
import SpeakersPage from '../pages/reference/SpeakersPage.jsx';
import HighlightsPage from '../pages/reference/HighlightsPage.jsx';
import PartnerPage from '../pages/reference/PartnerPage.jsx';
import PolicyPage from '../pages/reference/PolicyPage.jsx';
import CheckoutPage from '../pages/reference/CheckoutPage.jsx';
import DelegatePassPage from '../pages/reference/DelegatePassPage.jsx';
import RegistrationPage from '../pages/reference/RegistrationPage.jsx';
import AccountPage from '../pages/reference/AccountPage.jsx';
import {
  A,
  Button,
  Contacts,
  Footer,
  Gallery,
  SiteHeader,
  YoutubeVideo,
} from './reference/ReferenceShared.jsx';
import './reference.css';
import './reference-extended.css';
import './reference-home-updates.css';
import '../pages/reference/styles/passes.css';

export { Footer, SiteHeader } from './reference/ReferenceShared.jsx';

const referenceUi = { SiteHeader, YoutubeVideo, Gallery, Contacts, Footer, Button, asset: A };

export default function ReferencePage({ path }) {
  const normalized = path.endsWith('/') ? path : `${path}/`;
  const south = normalized.includes('south');
  return useMemo(() => {
    if (normalized === '/delegate-pass/') return <DelegatePassPage path={normalized} />;
    if (normalized === '/registration/') return <RegistrationPage path={normalized} />;
    if (normalized === '/exhibition/' || normalized === '/exhibition-south/')
      return <ExhibitionPage south={south} path={normalized} />;
    if (normalized === '/speakers/' || normalized === '/south-forum-speakers/')
      return <SpeakersPage south={south} path={normalized} />;
    if (normalized === '/business-excellence-awards/' || normalized === '/leadership-awards/')
      return <BusinessExcellencePage path={normalized} ui={referenceUi} />;
    if (normalized === '/previous-edition-highlights/') return <HighlightsPage path={normalized} />;
    if (normalized === '/partner/') return <PartnerPage path={normalized} />;
    if (normalized === '/felicitation/') return <FelicitationPage path={normalized} ui={referenceUi} />;
    if (normalized === '/privacy-policy/') return <PolicyPage path={normalized} />;
    if (normalized === '/my-account/') return <AccountPage path={normalized} />;
    if (['/cart/', '/checkout/'].includes(normalized)) return <CheckoutPage path={normalized} />;
    if (normalized === '/' || normalized === '/conference-south/')
      return <HomePage south={south} path={normalized} />;
    return null;
  }, [normalized, south]);
}

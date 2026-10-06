import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api.js';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import SectionRenderer from '../components/SectionRenderer.jsx';
import ReferencePage from '../components/ReferencePage.jsx';
import { referencePaths } from '../data/referenceRoutes.js';
import BlogPage from './BlogPage.jsx';

export default function PublicPage({ forced404 = false }) {
  const { pathname } = useLocation();
  const normalized = pathname === '/' ? '/' : `${pathname.replace(/\/$/, '')}/`;
  const isReferencePage = !forced404 && referencePaths.includes(normalized);
  const isBlogPage = !forced404 && (normalized === '/blog/' || normalized.startsWith('/blog/'));
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    if (isReferencePage || isBlogPage) return;
    if (forced404) return setState({ loading: false, notFound: true });
    api(`/public/page?path=${encodeURIComponent(pathname)}`).then(page => setState({ loading: false, page })).catch(error => setState({ loading: false, error, notFound: true }));
  }, [pathname, forced404, isReferencePage, isBlogPage]);
  useEffect(() => {
    if (state.page) document.title = state.page.seo_title || state.page.title;
  }, [state.page]);
  if (isReferencePage) return <ReferencePage path={normalized} />;
  if (isBlogPage) return <BlogPage />;
  return <><Header /><main>{state.loading && <div className="status">Loading…</div>}{state.notFound && <section className="hero"><div className="container narrow"><p className="eyebrow">404</p><h1>Page not found</h1><p>The page you requested is not available.</p></div></section>}{state.page?.sections?.map(section => <SectionRenderer key={section.id} section={section} />)}</main><Footer /></>;
}

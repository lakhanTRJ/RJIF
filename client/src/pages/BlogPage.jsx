import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { Footer, SiteHeader } from '../components/ReferencePage.jsx';

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(value),
      )
    : '';
function BlogShell({ children, path }) {
  return (
    <div className="reference-site blog-site">
      <SiteHeader path={path} section="blog" />
      {children}
      <Footer />
    </div>
  );
}

export default function BlogPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/blog\/?/, '').replace(/\/$/, '');
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    api(slug ? `/public/articles/${encodeURIComponent(slug)}` : '/public/articles')
      .then((data) => setState({ loading: false, data }))
      .catch((error) => setState({ loading: false, error }));
  }, [slug]);
  useEffect(() => {
    if (!state.loading && !state.error)
      document.title = slug
        ? state.data?.seo_title || state.data?.title || 'Article'
        : 'Insights & Ideas | Retail Jeweller India Forum';
  }, [slug, state]);
  if (state.loading)
    return (
      <BlogShell path={pathname}>
        <p className="status">Loading articles…</p>
      </BlogShell>
    );
  if (state.error)
    return (
      <BlogShell path={pathname}>
        <main className="blog-page">
          <div className="blog-empty">
            <p className="blog-kicker">Retail intelligence</p>
            <h1>Insights &amp; Ideas</h1>
            <p>Articles are currently unavailable. Please check again shortly.</p>
          </div>
        </main>
      </BlogShell>
    );
  if (!slug)
    return (
      <BlogShell path={pathname}>
        <main>
          <header className="blog-hero">
            <div>
              <p className="blog-kicker">Retail intelligence</p>
              <h1>Insights &amp; Ideas</h1>
              <p>Perspectives, market shifts and conversations shaping the future of jewellery retail.</p>
            </div>
          </header>
          <section className="blog-page">
            <div className="blog-section-heading">
              <div>
                <span>From the Forum</span>
                <h2>Latest Articles</h2>
              </div>
              <p>Knowledge and practical thinking from India’s jewellery retail community.</p>
            </div>
            {state.data.length ? (
              <div className="blog-grid">
                {state.data.map((article, index) => (
                  <article className={index === 0 ? 'featured' : ''} key={article.slug}>
                    <Link className="blog-card-media" to={`/blog/${article.slug}/`}>
                      {article.featured_image_url ? (
                        <img src={article.featured_image_url} alt={article.title} />
                      ) : (
                        <span>
                          Retail Jeweller
                          <br />
                          India Forum
                        </span>
                      )}
                    </Link>
                    <div className="blog-card-copy">
                      <p className="blog-meta">
                        {article.category || 'Industry Insights'} ·{' '}
                        {formatDate(article.published_at) || 'Retail Jeweller India Forum'}
                      </p>
                      <h2>
                        <Link to={`/blog/${article.slug}/`}>{article.title}</Link>
                      </h2>
                      {article.excerpt && <p>{article.excerpt}</p>}
                      <Link className="blog-read-more" to={`/blog/${article.slug}/`}>
                        Read article <span>→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="blog-empty">
                <h2>No articles published yet</h2>
                <p>New insights will appear here when they are published.</p>
              </div>
            )}
          </section>
        </main>
      </BlogShell>
    );
  return (
    <BlogShell path={pathname}>
      <main className="blog-detail-page">
        <div className="blog-breadcrumb">
          <Link to="/blog/">Insights &amp; Ideas</Link>
          <span>/</span>
          <span>{state.data.category || 'Article'}</span>
        </div>
        <article className="blog-detail">
          <header>
            <p className="blog-kicker">{state.data.category || 'Industry Insights'}</p>
            <h1>{state.data.title}</h1>
            <p className="blog-meta">
              {formatDate(state.data.published_at) || 'Retail Jeweller India Forum'}
            </p>
            {state.data.excerpt && <p className="blog-deck">{state.data.excerpt}</p>}
          </header>
          {state.data.featured_image_url && (
            <figure>
              <img src={state.data.featured_image_url} alt={state.data.title} />
            </figure>
          )}
          <div className="blog-article-body" dangerouslySetInnerHTML={{ __html: state.data.body_html }} />
          <footer>
            <Link className="blog-back" to="/blog/">
              ← Back to all articles
            </Link>
          </footer>
        </article>
      </main>
    </BlogShell>
  );
}

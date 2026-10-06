export function escapeHtml(value = '') {
  return String(value).replace(
    /[&<>'"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character],
  );
}

export function injectSeo(html, page, origin, noindex = false) {
  const title = escapeHtml(page?.seo_title || page?.title || 'Retail Jeweller India Forum');
  const description = escapeHtml(
    page?.seo_description || 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!',
  );
  const path = page?.path || '/';
  const canonical = `${origin.replace(/\/$/, '')}${path}`;
  const tags = `<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}">${noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}`;
  const rendered = page ? renderSeoBody(page) : '';
  return html
    .replace(/<title>.*?<\/title>/s, '')
    .replace('</head>', `${tags}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${rendered}</div>`);
}

function renderSeoBody(page) {
  const sections = page.sections || [];
  const content = sections
    .map((section) => {
      const heading = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : '';
      const body = section.body
        ? `<p>${escapeHtml(section.body)}</p>`
        : section.body_html
          ? `<p>${escapeHtml(
              section.body_html
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim(),
            )}</p>`
          : '';
      const items = (section.items || [])
        .map(
          (item) =>
            `<article>${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}${item.subtitle ? `<p>${escapeHtml(item.subtitle)}</p>` : ''}${item.value ? `<p>${escapeHtml(item.value)}</p>` : ''}${item.price ? `<p>${escapeHtml(item.price)}</p>` : ''}</article>`,
        )
        .join('');
      return `<section>${heading}${body}${items}</section>`;
    })
    .join('');
  return `<main data-prerendered="true"><h1>${escapeHtml(page.title || '')}</h1>${content}</main>`;
}

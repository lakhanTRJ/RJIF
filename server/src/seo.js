export function escapeHtml(value = '') {
  return String(value).replace(
    /[&<>'"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character],
  );
}

export function isUtilityPage(path = '') {
  return /^\/(?:admin|cart|checkout|my-account)(?:\/|$)/.test(path);
}

const genericDescription = 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!';
const descriptions = {
  '/': 'Explore the Retail Jeweller India Forum: jewellery retail conversations, current speakers, conference agenda, event details and delegate passes.',
  '/conference-south/':
    'Discover the Retail Jeweller South Forum, bringing jewellery retailers together for industry conversations, speakers, networking and conference sessions.',
  '/exhibition/':
    'Explore exhibition and partnership opportunities at the Retail Jeweller India Forum and connect with the jewellery retail community.',
  '/exhibition-south/':
    'Explore the Retail Jeweller South Forum exhibition, partnership opportunities and testimonials from the jewellery retail community.',
  '/business-excellence-awards/':
    'Discover The Retail Jeweller India Business Excellence Awards, including award categories, nomination guidelines and registration information.',
  '/blog/':
    'Beyond the Forum: conversations, perspectives and ideas shaping the future of jewellery retail, from The Retail Jeweller India Forum.',
  '/speakers/':
    'Meet past speakers from the Retail Jeweller India Forum and explore the industry leaders who have shared their jewellery retail expertise.',
  '/south-forum-speakers/':
    'Explore past speakers from the Retail Jeweller South Forum and the leaders shaping jewellery retail across South India.',
  '/previous-edition-highlights/':
    'Browse photographs and highlights from previous Retail Jeweller India Forum editions, including conference sessions and industry gatherings.',
  '/previous-edition-highlights-south/':
    'Relive previous Retail Jeweller South Forum editions through event photographs, session highlights and jewellery industry gatherings.',
  '/felicitation/':
    'Discover the Retail Jeweller South Forum Circle of Excellence and its recognition of contributions to the jewellery retail industry.',
  '/partner/':
    'Connect with The Retail Jeweller Forum team about event partnerships, exhibiting and opportunities to reach the jewellery retail community.',
  '/privacy-policy/':
    'Read the Retail Jeweller India Forum privacy policy to understand how information collected through this website is handled.',
};

export function seoDescription(page = {}) {
  const custom = String(page.seo_description || '').trim();
  return custom && custom !== genericDescription
    ? custom
    : descriptions[page.path] ||
        `Explore ${page.title || 'The Retail Jeweller India Forum'}: information and updates from the jewellery retail community.`;
}

export function injectSeo(html, page, origin, noindex = false) {
  const title = escapeHtml(page?.seo_title || page?.title || 'Retail Jeweller India Forum');
  const description = escapeHtml(seoDescription(page));
  const path = page?.path || '/';
  const canonical = `${origin.replace(/\/$/, '')}${path}`;
  let image = new URL('/favicon.png', origin).href;
  try {
    const candidate = new URL(page?.social_image || '/favicon.png', origin);
    if (['https:', 'http:'].includes(candidate.protocol)) image = candidate.href;
  } catch {
    /* Keep the site branding image when an image URL is invalid. */
  }
  const tags = `<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="${page?.is_article ? 'article' : 'website'}"><meta property="og:site_name" content="The Retail Jeweller India Forum"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:alt" content="${title}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${escapeHtml(image)}">${noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}`;
  const rendered = page ? renderSeoBody(page) : '';
  const pixelFallback =
    !noindex && canTrackMetaPage(new URL(page?.tracking_path || path, origin))
      ? `<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&amp;ev=PageView&amp;noscript=1"></noscript>`
      : '';
  return html
    .replace(/<title>.*?<\/title>/s, '')
    .replace('</head>', `${tags}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${rendered}</div>`)
    .replace('</body>', `${pixelFallback}</body>`);
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
import { canTrackMetaPage, META_PIXEL_ID } from '../../client/src/metaPixel.js';

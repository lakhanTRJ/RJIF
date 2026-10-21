import sanitizeHtml from 'sanitize-html';
import { articleEmbed } from '../../client/src/articleEmbeds.js';

export function cleanArticleHtml(value) {
  return sanitizeHtml(String(value || ''), {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'br', 'iframe'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      iframe: ['src', 'title', 'loading', 'allowfullscreen', 'referrerpolicy'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      iframe: (_tag, attributes) => {
        const embed = articleEmbed(attributes.src);
        return {
          tagName: 'iframe',
          attribs: embed
            ? {
                src: embed.src,
                title: `${embed.provider} embed`,
                loading: 'lazy',
                allowfullscreen: '',
                referrerpolicy: 'strict-origin-when-cross-origin',
              }
            : {},
        };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'iframe' && !frame.attribs.src,
  });
}

export function articleSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
    .replace(/-+$/g, '');
}

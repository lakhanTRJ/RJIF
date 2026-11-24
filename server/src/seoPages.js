import { query } from './db.js';
import { getForumContent } from './routes/public.js';
import { speakerText } from '../../client/src/speakerText.js';

export async function currentSeoPage(page, { loadForum = getForumContent, runQuery = query } = {}) {
  if (!page || !['/', '/conference-south/'].includes(page.path)) return page;
  const forum = page.path === '/' ? 'india' : 'south';
  const { settings, featuredSpeakers, agenda } = await loadForum(forum);
  const products = await runQuery(
    'SELECT name,description,sale_price_paise,currency FROM commerce_products WHERE forum=? AND is_active=1 AND sale_price_paise>0 ORDER BY sort_order,id',
    [forum],
  );
  return {
    ...page,
    seo_title: page.seo_title || page.title,
    title: 'A Knowledge and Networking Platform where Forward-Thinking Jewellers Meet!',
    sections: [
      {
        heading: forum === 'india' ? 'The Retail Jeweller India Forum' : 'The Retail Jeweller South Forum',
        body: [settings.event_date, settings.event_location].filter(Boolean).join(' · '),
      },
      {
        heading: settings.speaker_event_year
          ? `Speakers ${settings.speaker_event_year}`
          : settings.speaker_heading || 'Speakers',
        items: featuredSpeakers.map((speaker) => ({
          title: speakerText(speaker.name),
          subtitle: speakerText(speaker.role),
        })),
      },
      ...(settings.agenda_visible === 0
        ? []
        : [
            {
              heading: 'Agenda',
              items: agenda.map((item) => ({
                title: item.title,
                subtitle: [item.subtitle, item.body].filter(Boolean).join(' — '),
              })),
            },
          ]),
      ...(settings.passes_visible === 0
        ? []
        : [
            {
              heading: 'Delegate Pass',
              items: products.map((product) => ({
                title: product.name,
                subtitle: product.description,
                price: `${product.currency || 'INR'} ${(Number(product.sale_price_paise) / 100).toFixed(2)} before tax`,
              })),
            },
          ]),
    ],
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, injectSeo, seoDescription, isUtilityPage } from '../src/seo.js';
import { currentSeoPage } from '../src/seoPages.js';

test('escapeHtml encodes metadata-sensitive characters', () => {
  assert.equal(escapeHtml('<script>"x" & y</script>'), '&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;');
});

test('page descriptions are distinct and preserve administrator-written descriptions', () => {
  const paths = ['/', '/conference-south/', '/blog/', '/business-excellence-awards/', '/speakers/'];
  assert.equal(new Set(paths.map((path) => seoDescription({ path }))).size, paths.length);
  assert.equal(
    seoDescription({ path: '/', seo_description: 'Our custom introduction' }),
    'Our custom introduction',
  );
});

test('utility pages are excluded without excluding public event pages', () => {
  for (const path of ['/cart/', '/checkout/', '/checkout', '/my-account/', '/admin/login'])
    assert.equal(isUtilityPage(path), true);
  for (const path of ['/', '/blog/', '/business-excellence-awards/', '/checkout-guide/'])
    assert.equal(isUtilityPage(path), false);
});

test('share metadata uses absolute safe image URLs and article images', () => {
  const html = '<head></head><div id="root"></div>';
  const result = injectSeo(
    html,
    { title: 'Article', social_image: '/media/story.jpg', is_article: true },
    'https://example.com',
  );
  assert.match(result, /property="og:image" content="https:\/\/example.com\/media\/story.jpg"/);
  assert.match(result, /property="og:type" content="article"/);
  assert.match(result, /name="twitter:image"/);
  assert.doesNotMatch(
    injectSeo(html, { social_image: 'javascript:alert(1)' }, 'https://example.com'),
    /javascript:/,
  );
});

test('homepage crawler content uses current forum data and respects hidden sections', async () => {
  const page = await currentSeoPage(
    { path: '/', title: 'India Forum', sections: [{ body: 'Old placeholder' }] },
    {
      loadForum: async (forum) => {
        assert.equal(forum, 'india');
        return {
          settings: {
            event_date: '7 January 2027',
            event_location: 'Mumbai',
            speaker_event_year: 2027,
            agenda_visible: 0,
            passes_visible: 0,
          },
          featuredSpeakers: [{ name: '𝐃𝐡𝐫𝐮𝐯', role: 'Director' }],
          agenda: [{ title: 'Hidden agenda' }],
        };
      },
      runQuery: async () => [{ name: 'Hidden pass', sale_price_paise: 750000 }],
    },
  );
  const rendered = injectSeo('<head></head><div id="root"></div>', page, 'https://example.com');
  assert.match(rendered, /7 January 2027/);
  assert.match(rendered, /Speakers 2027/);
  assert.match(rendered, /Dhruv/);
  assert.doesNotMatch(rendered, /Old placeholder|Hidden agenda|Hidden pass/);
  assert.equal(page.seo_title, 'India Forum');
});

test('injectSeo adds canonical metadata and staging noindex', () => {
  const output = injectSeo(
    '<html><head><title>Old</title></head><body><div id="root"></div></body></html>',
    { path: '/speakers/', title: 'Speakers', seo_description: 'Directory' },
    'https://example.com/',
    true,
  );
  assert.match(output, /<title>Speakers<\/title>/);
  assert.match(output, /https:\/\/example\.com\/speakers\//);
  assert.match(output, /noindex,nofollow/);
  assert.doesNotMatch(output, /<title>Old<\/title>/);
  assert.match(output, /data-prerendered="true"/);
});

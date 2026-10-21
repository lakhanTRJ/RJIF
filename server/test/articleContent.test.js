import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanArticleHtml, articleSlug } from '../src/articleContent.js';
import { articleEmbed } from '../../client/src/articleEmbeds.js';

test('article embeds canonicalize YouTube links and Instagram posts', () => {
  for (const url of [
    'https://youtu.be/M7lc1UVf-VE?si=test',
    'https://www.youtube.com/watch?v=M7lc1UVf-VE&t=2',
    'https://www.youtube.com/shorts/M7lc1UVf-VE',
  ])
    assert.equal(articleEmbed(url).src, 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE');
  assert.equal(
    articleEmbed('https://www.instagram.com/reel/ABC_def/?igsh=test').src,
    'https://www.instagram.com/reel/ABC_def/embed/',
  );
});

test('article embeds reject unsafe URLs and non-post Instagram links', () => {
  for (const url of [
    'javascript:alert(1)',
    'https://www.youtube.com.evil.com/watch?v=M7lc1UVf-VE',
    'https://evil.com/embed/123',
    'https://www.instagram.com/profile/',
    'https://user:password@www.instagram.com/p/abc/',
    'http://youtu.be/M7lc1UVf-VE',
  ]) {
    assert.equal(articleEmbed(url), null);
  }
});

test('article HTML preserves safe embeds across save and public sanitization', () => {
  const html =
    '<h2>Heading</h2><iframe src="https://youtu.be/M7lc1UVf-VE" onload="alert(1)" srcdoc="unsafe"></iframe>' +
    '<iframe src="https://www.instagram.com/p/ABC/embed/"></iframe><script>alert(1)</script>' +
    '<iframe src="https://evil.com/"></iframe>';
  const clean = cleanArticleHtml(html);
  assert.match(clean, /youtube-nocookie\.com\/embed\/M7lc1UVf-VE/);
  assert.match(clean, /instagram\.com\/p\/ABC\/embed\//);
  assert.doesNotMatch(clean, /onload|srcdoc|<script|evil\.com/);
  assert.equal(cleanArticleHtml(clean), clean);
});

test('article slug generation uses titles and normalizes accents and punctuation', () => {
  assert.equal(articleSlug('  Jewellery & Retail: The Future!  '), 'jewellery-retail-the-future');
  assert.equal(articleSlug('Café Insights'), 'cafe-insights');
  assert.equal(articleSlug('!!!'), '');
  assert.ok(articleSlug('a'.repeat(300)).length <= 180);
});

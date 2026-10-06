import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, injectSeo } from '../src/seo.js';

test('escapeHtml encodes metadata-sensitive characters', () => {
  assert.equal(escapeHtml('<script>"x" & y</script>'), '&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;');
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

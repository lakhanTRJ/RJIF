import test from 'node:test';
import assert from 'node:assert/strict';
import { canTrackMetaPage, createMetaPageTracker, META_PIXEL_ID } from '../../client/src/metaPixel.js';
import { injectSeo } from '../src/seo.js';

test('Meta Pixel loads once and tracks one PageView per public navigation', () => {
  const scripts = [];
  const win = { location: { href: 'https://retailjewellerindiaforum.com/' } };
  const doc = { createElement: () => ({}), head: { appendChild: (script) => scripts.push(script) } };
  const track = createMetaPageTracker(win, doc);
  track();
  track();
  win.location.href += '\u0023speakers';
  track();
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  assert.equal(win.fbq.queue.filter((args) => args[0] === 'init').length, 1);
  assert.deepEqual(
    win.fbq.queue.find((args) => args[0] === 'init'),
    ['init', META_PIXEL_ID],
  );
  assert.equal(win.fbq.queue.filter((args) => args[1] === 'PageView').length, 1);
  assert.equal(win.fbq.disablePushState, true);
  win.location.href = 'https://retailjewellerindiaforum.com/blog/';
  track();
  assert.equal(win.fbq.queue.filter((args) => args[1] === 'PageView').length, 2);
  win.location.href = 'https://retailjewellerindiaforum.com/admin/registrations';
  track();
  assert.equal(win.fbq.queue.filter((args) => args[1] === 'PageView').length, 2);
});

test('Meta Pixel excludes testing, admin and private links, while allowing campaigns', () => {
  for (const url of [
    'http://localhost:3003/',
    'https://staging.theretailjeweller.com/',
    'https://retailjewellerindiaforum.com/admin/login',
    'https://retailjewellerindiaforum.com/my-account/',
    'https://retailjewellerindiaforum.com/delegate-pass/',
    'https://retailjewellerindiaforum.com/business-excellence-awards/?invitation=secret',
    'https://retailjewellerindiaforum.com/checkout/?token=secret',
  ])
    assert.equal(canTrackMetaPage(new URL(url)), false, url);
  assert.equal(
    canTrackMetaPage(new URL('https://retailjewellerindiaforum.com/?utm_source=facebook&fbclid=test')),
    true,
  );
});

test('noscript pixel appears only on production public pages, not private or noindex responses', () => {
  const html = '<head></head><body><div id="root"></div></body>';
  const origin = 'https://retailjewellerindiaforum.com';
  assert.match(injectSeo(html, { path: '/' }, origin), /noscript=1/);
  assert.doesNotMatch(injectSeo(html, { path: '/' }, origin, true), /noscript=1/);
  assert.doesNotMatch(
    injectSeo(
      html,
      { path: '/business-excellence-awards/', tracking_path: '/business-excellence-awards/?invite=secret' },
      origin,
    ),
    /noscript=1/,
  );
});

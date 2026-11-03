import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { AWARDS_INTRO_IMAGE, AWARDS_GUIDELINES_PDF, awardsAssets } from '../../client/src/awardsAssets.js';

test('awards defaults link to the supplied bundled image and PDF; admin overrides remain supported', async () => {
  assert.deepEqual(awardsAssets(), {
    introImageUrl: AWARDS_INTRO_IMAGE,
    guidelinesUrl: AWARDS_GUIDELINES_PDF,
  });
  const custom = { introImageUrl: '/media/new-image.png', guidelinesUrl: '/media/new-guidelines.pdf' };
  assert.deepEqual(awardsAssets(custom), custom);
  const base = new URL('../../client/public/', import.meta.url);
  const image = await fs.readFile(new URL(AWARDS_INTRO_IMAGE.slice(1), base));
  const pdf = await fs.readFile(new URL(AWARDS_GUIDELINES_PDF.slice(1), base));
  assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
});

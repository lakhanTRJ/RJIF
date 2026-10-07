import test from 'node:test';
import assert from 'node:assert/strict';
import { detectMediaMime } from '../src/mediaValidation.js';

test('media validation identifies supported image signatures', () => {
  assert.equal(detectMediaMime(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg');
  assert.equal(
    detectMediaMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/png',
  );
  assert.equal(detectMediaMime(Buffer.from('RIFF0000WEBP')), 'image/webp');
});

test('media validation accepts complete PDFs and rejects renamed files', () => {
  assert.equal(detectMediaMime(Buffer.from('%PDF-1.7\ncontent\n%%EOF\n')), 'application/pdf');
  assert.equal(detectMediaMime(Buffer.from('%PDF-1.7\ncontent without end marker')), '');
  assert.equal(detectMediaMime(Buffer.from('not a pdf')), '');
});

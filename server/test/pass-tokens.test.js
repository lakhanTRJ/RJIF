import test from 'node:test';
import assert from 'node:assert/strict';
import {
  orderToken,
  passToken,
  tokenFromScan,
  verifyOrderToken,
  verifyPassToken,
} from '../src/passService.js';

test('order tokens are signed and reject tampering', () => {
  const id = 'c099a0fd-3b57-4f94-97c8-4a1a235b82f2';
  const token = orderToken(id);
  assert.equal(verifyOrderToken(token), id);
  assert.equal(verifyOrderToken(`${token}tampered`), null);
  assert.match(token, /^[^.]+\.[^.]+\.[A-Za-z0-9_-]+$/);
});

test('pass tokens are scoped and scanner URLs extract their token', () => {
  const number = 'RJIF-2027-ABC123';
  const token = passToken(number);
  assert.equal(verifyPassToken(token), number);
  assert.equal(verifyOrderToken(token), null);
  assert.equal(tokenFromScan(`https://example.com/delegate-pass/?token=${encodeURIComponent(token)}`), token);
});

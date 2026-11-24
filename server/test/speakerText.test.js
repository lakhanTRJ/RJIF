import test from 'node:test';
import assert from 'node:assert/strict';
import { speakerText } from '../../client/src/speakerText.js';

test('pasted mathematical bold names and roles use ordinary text and the website font', () => {
  assert.equal(speakerText('𝐃𝐡𝐫𝐮𝐯 𝐂𝐡𝐚𝐰𝐥𝐚'), 'Dhruv Chawla');
  assert.equal(speakerText('𝐃𝐢𝐫𝐞𝐜𝐭𝐨𝐫, 𝐑𝐢𝐠𝐡𝐭 𝐆𝐨𝐥𝐝'), 'Director, Right Gold');
  assert.equal(speakerText('Anand Pednekar'), 'Anand Pednekar');
  assert.equal(speakerText('आनंद · Müller & Sons'), 'आनंद · Müller & Sons');
});

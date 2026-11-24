import test from 'node:test';
import assert from 'node:assert/strict';
import { speakerEditions } from '../src/speakerEditions.js';

const speakers = [
  { id: 1, event_year: 2026, is_featured: 1 },
  { id: 2, event_year: 2027, is_featured: 1 },
  { id: 3, event_year: 2027, is_featured: 0 },
  { id: 4, event_year: 2028, is_featured: 1 },
  { id: 5, event_year: null, is_featured: 0 },
];
test('current speakers are featured by edition and stay out of the past directory', () => {
  const result = speakerEditions(speakers, 2027);
  assert.deepEqual(
    result.featuredSpeakers.map((row) => row.id),
    [2],
  );
  assert.deepEqual(
    result.pastSpeakers.map((row) => row.id),
    [1, 5],
  );
  assert.deepEqual(speakerEditions([speakers[0]], 2027).featuredSpeakers, []);
});
test('advancing the edition automatically moves previous speakers to the past directory', () => {
  const result = speakerEditions(speakers, '2028');
  assert.deepEqual(
    result.featuredSpeakers.map((row) => row.id),
    [4],
  );
  assert.deepEqual(
    result.pastSpeakers.map((row) => row.id),
    [1, 2, 3, 5],
  );
});
test('unselected South event year preserves its existing speaker display', () => {
  const result = speakerEditions(speakers, null);
  assert.deepEqual(result.pastSpeakers, speakers);
  assert.deepEqual(
    result.featuredSpeakers.map((row) => row.id),
    [1, 2, 4],
  );
});

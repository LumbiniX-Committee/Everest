import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decodePolyline } from './polyline.ts';

test('decodes a standard route polyline in map longitude-latitude order', () => {
  assert.deepEqual(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5), [
    [-120.2, 38.5],
    [-120.95, 40.7],
    [-126.453, 43.252],
  ]);
});

test('rejects incomplete route geometry', () => {
  assert.throws(() => decodePolyline('_'), /Incomplete route geometry/);
});

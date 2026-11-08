import assert from 'node:assert/strict';
import { test } from 'node:test';

import { boundsOfLine, latToTileY, lonToTileX, tilesForBounds } from './tiles.ts';

test('tile coordinates match the standard scheme', () => {
  // The equator and prime meridian sit exactly on the middle tile edge.
  assert.equal(lonToTileX(0, 14), 8192);
  assert.equal(latToTileY(0, 14), 8192);
  assert.equal(lonToTileX(-180, 0), 0);
  // The north-west corner of the world is tile 0,0 at every zoom.
  assert.equal(latToTileY(85.05, 10), 0);
  // Kathmandu is in the north-east quarter.
  assert.ok(lonToTileX(85.3073, 14) > 8192 && latToTileY(27.7043, 14) < 8192);
});

test('a small area at one zoom is a small block of tiles', () => {
  const tiles = tilesForBounds({ west: 85.30, south: 27.70, east: 85.32, north: 27.71 }, 14, 14);
  assert.ok(tiles.length >= 1 && tiles.length <= 6, String(tiles.length));
  assert.ok(tiles.every((t) => t.z === 14));
});

test('each zoom level is included once', () => {
  const tiles = tilesForBounds({ west: 86.7, south: 27.68, east: 86.87, north: 28.02 }, 6, 14);
  assert.deepEqual([...new Set(tiles.map((t) => t.z))], [6, 7, 8, 9, 10, 11, 12, 13, 14]);
  // The whole Everest Base Camp corridor stays a modest download.
  assert.ok(tiles.length < 400, String(tiles.length));
});

test('bounds of a line carry the margin, and an empty line has none', () => {
  assert.deepEqual(boundsOfLine([[85, 28], [85.1, 28.2]], 0.01), { west: 84.99, south: 27.99, east: 85.11, north: 28.21 });
  assert.equal(boundsOfLine([]), null);
});

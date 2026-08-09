import { test } from 'node:test';
import assert from 'node:assert/strict';

import { letterbox, undoLetterbox, buildLetterboxedInput } from './letterbox.ts';

test('letterbox scales to fit and centres a landscape image', () => {
  // 1280×720 into 640: scale 0.5 → 640×360, padded 140 top and bottom.
  const lb = letterbox(1280, 720, 640);
  assert.equal(lb.scale, 0.5);
  assert.equal(lb.newW, 640);
  assert.equal(lb.newH, 360);
  assert.equal(lb.padX, 0);
  assert.equal(lb.padY, 140);
});

test('letterbox pads the x-axis for a portrait image', () => {
  // 720×1280 into 640: scale 0.5 → 360×640, padded 140 left and right.
  const lb = letterbox(720, 1280, 640);
  assert.equal(lb.newW, 360);
  assert.equal(lb.newH, 640);
  assert.equal(lb.padX, 140);
  assert.equal(lb.padY, 0);
});

test('undoLetterbox inverts the transform back to original pixels', () => {
  const lb = letterbox(1280, 720, 640);
  // A box on the resized image at (100,50)-(200,150): remove padY=140, /0.5.
  const orig = undoLetterbox({ x1: 100, y1: 190, x2: 200, y2: 290 }, lb, 1280, 720);
  assert.equal(orig.x1, 200);
  assert.equal(orig.y1, 100);
  assert.equal(orig.x2, 400);
  assert.equal(orig.y2, 300);
});

test('undoLetterbox clamps a box to the frame and normalises corner order', () => {
  const lb = letterbox(1000, 1000, 640);
  // Swapped corners and running off the right/bottom edge.
  const box = undoLetterbox({ x1: 700, y1: 700, x2: -50, y2: -50 }, lb, 1000, 1000);
  assert.equal(box.x1, 0);
  assert.equal(box.y1, 0);
  assert.equal(box.x2, 1000);
  assert.equal(box.y2, 1000);
});

test('undoLetterbox returns an empty box when geometry is unusable', () => {
  const lb = letterbox(0, 0, 640); // failed image read → scale 0
  assert.deepEqual(undoLetterbox({ x1: 1, y1: 2, x2: 3, y2: 4 }, lb, 0, 0), {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });
});

test('buildLetterboxedInput lays out CHW planes with grey padding', () => {
  // Tiny case: a 1×1 red pixel into a 2×2 square, padding = 0 (fits top-left).
  const lb = { size: 2, scale: 1, newW: 1, newH: 1, padX: 0, padY: 0 };
  const rgba = [255, 0, 0, 255]; // one red pixel
  const t = buildLetterboxedInput(rgba, 1, 1, lb);
  const area = 4;
  const pad = 114 / 255;
  // Float32Array stores at single precision, so compare the grey pad with a
  // tolerance rather than demanding bit-exact equality with the double.
  const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≉ ${b}`);
  // R plane: pixel 0 is full red, the other three are grey pad.
  assert.equal(t[0], 1);
  near(t[1], pad);
  // G and B planes for the pixel are 0 (pure red), padding stays grey.
  assert.equal(t[area + 0], 0);
  assert.equal(t[2 * area + 0], 0);
  near(t[area + 1], pad);
  assert.equal(t.length, 3 * area);
});

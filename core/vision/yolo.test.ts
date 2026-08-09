import { test } from 'node:test';
import assert from 'node:assert/strict';

import { decodeYolo, iou, nms, type YoloBox } from './yolo.ts';

// Helper: build a channel-major [1, 4+nc, anchors] flat tensor from rows of
// [cx, cy, w, h, ...classScores], one row per anchor.
function channelMajor(anchors: number[][], numClasses: number): number[] {
  const channels = 4 + numClasses;
  const a = anchors.length;
  const data = new Array(channels * a).fill(0);
  anchors.forEach((row, i) => {
    for (let c = 0; c < channels; c++) data[c * a + i] = row[c];
  });
  return data;
}

test('decodeYolo reads channel-major output and drops low scores', () => {
  const rows = [
    [100, 100, 40, 20, 0.9], // confident
    [300, 300, 40, 20, 0.1], // below threshold
  ];
  const data = channelMajor(rows, 1);
  const boxes = decodeYolo(data, [1, 5, rows.length], 1, 0.35);
  assert.equal(boxes.length, 1);
  assert.equal(boxes[0].score, 0.9);
  // cx,cy,w,h = 100,100,40,20 → corners (80,90)-(120,110).
  assert.equal(boxes[0].x1, 80);
  assert.equal(boxes[0].y1, 90);
  assert.equal(boxes[0].x2, 120);
  assert.equal(boxes[0].y2, 110);
  assert.equal(boxes[0].classId, 0);
});

test('decodeYolo handles the transposed [1, anchors, 4+nc] layout identically', () => {
  const rows = [[100, 100, 40, 20, 0.9]];
  // Anchor-major: flat is just the row itself for one anchor.
  const data = [100, 100, 40, 20, 0.9];
  const boxes = decodeYolo(data, [1, rows.length, 5], 1, 0.35);
  assert.equal(boxes.length, 1);
  assert.equal(boxes[0].x1, 80);
  assert.equal(boxes[0].score, 0.9);
});

test('decodeYolo picks the argmax class among several', () => {
  // One anchor, three classes; class 2 is the strongest.
  const data = channelMajor([[50, 50, 10, 10, 0.2, 0.4, 0.7]], 3);
  const boxes = decodeYolo(data, [1, 7, 1], 3, 0.35);
  assert.equal(boxes.length, 1);
  assert.equal(boxes[0].classId, 2);
  assert.equal(boxes[0].score, 0.7);
});

test('iou is 1 for identical boxes and 0 for disjoint ones', () => {
  const box = { x1: 0, y1: 0, x2: 10, y2: 10 };
  assert.equal(iou(box, box), 1);
  assert.equal(iou(box, { x1: 20, y1: 20, x2: 30, y2: 30 }), 0);
});

test('nms suppresses an overlapping same-class box but keeps a different class', () => {
  const boxes: YoloBox[] = [
    { x1: 0, y1: 0, x2: 10, y2: 10, score: 0.9, classId: 0 },
    { x1: 1, y1: 1, x2: 11, y2: 11, score: 0.8, classId: 0 }, // overlaps #0, same class → dropped
    { x1: 0, y1: 0, x2: 10, y2: 10, score: 0.7, classId: 1 }, // same box, other class → kept
  ];
  const kept = nms(boxes, 0.45);
  assert.equal(kept.length, 2);
  assert.equal(kept[0].score, 0.9);
  assert.equal(kept[1].classId, 1);
});

test('nms respects the maxDetections cap', () => {
  const boxes: YoloBox[] = Array.from({ length: 10 }, (_, i) => ({
    x1: i * 100,
    y1: 0,
    x2: i * 100 + 10,
    y2: 10,
    score: 0.9 - i * 0.05,
    classId: 0,
  }));
  assert.equal(nms(boxes, 0.45, 3).length, 3);
});

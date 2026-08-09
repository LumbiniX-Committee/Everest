import type { Box } from './letterbox.ts';

/**
 * YOLOv8 output decoding — turning a raw tensor into boxes.
 *
 * onnxruntime hands back a flat float tensor, not detections. This is the
 * decoding the executorch object-detection hook would have done internally, made
 * explicit and pure so it can be tested: read each anchor's box and class score,
 * drop the unconfident ones, then suppress overlapping duplicates (NMS).
 *
 * Nothing here invents a detection. Every box out is one the model put in the
 * tensor above the confidence threshold; NMS only removes redundant copies of the
 * same object, never adds.
 */

/** A decoded detection in model-input pixel space, before letterbox is undone. */
export type YoloBox = Box & { score: number; classId: number };

/**
 * Decode a YOLOv8 detection tensor.
 *
 * The tensor is `[1, 4+numClasses, anchors]` (channel-major, Ultralytics'
 * default) or its transpose `[1, anchors, 4+numClasses]`. Which one is detected
 * from the dims against the known channel count, so an export in either layout
 * decodes correctly. Each anchor carries `cx, cy, w, h` (already in input-pixel
 * space) followed by one probability per class; the box's score is its best class
 * probability. Boxes are returned in corner form.
 */
export function decodeYolo(
  data: ArrayLike<number>,
  dims: readonly number[],
  numClasses: number,
  confThreshold: number,
): YoloBox[] {
  const channels = 4 + numClasses;
  const d1 = dims[dims.length - 2];
  const d2 = dims[dims.length - 1];

  // Prefer an exact match on the known channel count; fall back to "the smaller
  // trailing dim is the channels" for an unusual export.
  let anchors: number;
  let channelMajor: boolean;
  if (d1 === channels) {
    anchors = d2;
    channelMajor = true;
  } else if (d2 === channels) {
    anchors = d1;
    channelMajor = false;
  } else if (d1 <= d2) {
    anchors = d2;
    channelMajor = true;
  } else {
    anchors = d1;
    channelMajor = false;
  }

  const at = channelMajor
    ? (c: number, a: number) => data[c * anchors + a]
    : (c: number, a: number) => data[a * channels + c];

  const out: YoloBox[] = [];
  for (let a = 0; a < anchors; a++) {
    let best = 0;
    let bestClass = 0;
    for (let c = 0; c < numClasses; c++) {
      const s = at(4 + c, a);
      if (s > best) {
        best = s;
        bestClass = c;
      }
    }
    if (best < confThreshold) continue;
    const cx = at(0, a);
    const cy = at(1, a);
    const w = at(2, a);
    const h = at(3, a);
    out.push({
      x1: cx - w / 2,
      y1: cy - h / 2,
      x2: cx + w / 2,
      y2: cy + h / 2,
      score: best,
      classId: bestClass,
    });
  }
  return out;
}

/** Intersection-over-union of two boxes. Zero when they do not overlap. */
export function iou(a: Box, b: Box): number {
  const ix1 = Math.max(a.x1, b.x1);
  const iy1 = Math.max(a.y1, b.y1);
  const ix2 = Math.min(a.x2, b.x2);
  const iy2 = Math.min(a.y2, b.y2);
  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
  const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
  const union = areaA + areaB - inter;
  return union <= 0 ? 0 : inter / union;
}

/**
 * Non-maximum suppression: keep the highest-scoring box, drop any lower-scoring
 * box of the same class that overlaps it beyond `iouThreshold`, repeat. Different
 * classes never suppress each other (a crack overlapping moss is two findings,
 * not one). Capped at `maxDetections` so a pathological frame cannot flood the UI.
 */
export function nms(boxes: YoloBox[], iouThreshold: number, maxDetections = 50): YoloBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: YoloBox[] = [];
  for (const box of sorted) {
    if (kept.length >= maxDetections) break;
    let redundant = false;
    for (const k of kept) {
      if (k.classId === box.classId && iou(box, k) > iouThreshold) {
        redundant = true;
        break;
      }
    }
    if (!redundant) kept.push(box);
  }
  return kept;
}

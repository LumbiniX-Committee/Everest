import { clamp01 } from '../../shared/geo.ts';

/**
 * Detection geometry — the device-independent half of damage detection.
 *
 * The model runtime (react-native-executorch) hands back pixel-space boxes; the
 * overlay draws in normalised 0–1 space so it scales to any container. That
 * conversion is the one piece of the vision pipeline that is pure maths, so it
 * lives here where the test harness covers it — the rest of the pipeline needs a
 * device and a trained model and cannot be unit-tested honestly.
 *
 * Nothing in this file invents a detection. It only reshapes ones the model
 * actually produced.
 */

/** A pixel-space box as react-native-executorch returns it. */
export type RawBbox = { x1: number; y1: number; x2: number; y2: number };

/** A normalised box in 0–1 image space: top-left origin, width/height. */
export type NormBox = { x: number; y: number; w: number; h: number };

/**
 * Convert a pixel box to a normalised one, given the source image dimensions.
 *
 * Corner-order-agnostic (takes min/max rather than trusting x1<x2), and clamped
 * so a box can never spill outside the frame however the model rounds — a box
 * drawn past the edge would misrepresent where the model actually looked.
 */
export function normalizeBbox(box: RawBbox, imageW: number, imageH: number): NormBox {
  const w = imageW > 0 ? imageW : 1;
  const h = imageH > 0 ? imageH : 1;

  const left = Math.min(box.x1, box.x2);
  const right = Math.max(box.x1, box.x2);
  const top = Math.min(box.y1, box.y2);
  const bottom = Math.max(box.y1, box.y2);

  const x = clamp01(left / w);
  const y = clamp01(top / h);
  // Width/height clamped to what remains inside the frame from (x, y).
  const bw = Math.min(clamp01((right - left) / w), 1 - x);
  const bh = Math.min(clamp01((bottom - top) / h), 1 - y);

  return { x, y, w: bw, h: bh };
}

/**
 * Drop detections the model was not confident about.
 *
 * A single threshold, applied once, so the count the UI shows and the boxes it
 * draws are the same set — never a headline number that disagrees with what is
 * on screen.
 */
export function filterByScore<T extends { score: number }>(raw: T[], threshold: number): T[] {
  return raw.filter((d) => d.score >= threshold);
}

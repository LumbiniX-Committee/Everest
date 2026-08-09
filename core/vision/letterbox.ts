/**
 * Letterbox geometry — the pure half of ONNX image preprocessing.
 *
 * A YOLO model wants a fixed square input (640×640). A photograph almost never
 * is square, so it is resized to fit and the remainder padded with grey. Doing
 * that without distorting the image (the way training saw it) is what keeps the
 * boxes honest: stretch the photo and every box lands in the wrong place.
 *
 * This file is only the maths — how much to scale, where the padding sits, and
 * how to map a box in the padded model-space back to the original photograph.
 * The bytes-shuffling that needs a real decoded image lives in services/ai. That
 * split means the geometry, the part most likely to be subtly wrong, is unit
 * tested here rather than only discoverable on a device.
 */

/** Everything needed to place an image into the model square and undo it after. */
export type Letterbox = {
  /** The square model-input edge, e.g. 640. */
  size: number;
  /** Multiply an original pixel coordinate by this to get resized-image pixels. */
  scale: number;
  /** Resized (unpadded) image dimensions. */
  newW: number;
  newH: number;
  /** Padding added to centre the resized image in the square. */
  padX: number;
  padY: number;
};

/** A pixel box, corner form. Reused for both model-space and image-space boxes. */
export type Box = { x1: number; y1: number; x2: number; y2: number };

/**
 * Fit a `srcW × srcH` image into a `size × size` square, preserving aspect ratio
 * and centring the result (matching Ultralytics' default letterbox). Returns the
 * scale and padding needed to build the input tensor and to invert it afterward.
 *
 * Guards a zero/negative source (a failed image read) by returning `scale: 0`,
 * which `undoLetterbox` treats as "no usable geometry" rather than dividing by it.
 */
export function letterbox(srcW: number, srcH: number, size: number): Letterbox {
  if (srcW <= 0 || srcH <= 0 || size <= 0) {
    return { size: Math.max(0, size), scale: 0, newW: 0, newH: 0, padX: 0, padY: 0 };
  }
  const scale = Math.min(size / srcW, size / srcH);
  const newW = Math.round(srcW * scale);
  const newH = Math.round(srcH * scale);
  const padX = (size - newW) / 2;
  const padY = (size - newH) / 2;
  return { size, scale, newW, newH, padX, padY };
}

/**
 * Map a box the model produced (in padded `size × size` space) back to pixels in
 * the original photograph: remove the padding, undo the scale, and clamp to the
 * frame so a box can never claim the model looked outside the image. Corner order
 * is normalised so the result always has x1≤x2, y1≤y2.
 */
export function undoLetterbox(box: Box, lb: Letterbox, srcW: number, srcH: number): Box {
  if (lb.scale <= 0) return { x1: 0, y1: 0, x2: 0, y2: 0 };
  const inv = 1 / lb.scale;
  const ax = (box.x1 - lb.padX) * inv;
  const bx = (box.x2 - lb.padX) * inv;
  const ay = (box.y1 - lb.padY) * inv;
  const by = (box.y2 - lb.padY) * inv;
  const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v));
  return {
    x1: clamp(Math.min(ax, bx), srcW),
    y1: clamp(Math.min(ay, by), srcH),
    x2: clamp(Math.max(ax, bx), srcW),
    y2: clamp(Math.max(ay, by), srcH),
  };
}

/**
 * Build the CHW float32 input tensor from a decoded RGBA image.
 *
 * The resized image (already `lb.newW × lb.newH`) is copied into a `size × size`
 * canvas pre-filled with the grey pad value YOLO trains with (114/255), placed at
 * the centring offset. Channels are separated into planes (all R, then all G,
 * then all B) and normalised to 0–1 — the layout onnxruntime expects for a
 * `[1, 3, size, size]` tensor. Alpha is dropped.
 *
 * Pure and deterministic: given the same pixels it returns the same tensor, so
 * the packing — an easy place for an off-by-one to silently shift every box — is
 * testable without a device.
 */
export function buildLetterboxedInput(
  rgba: ArrayLike<number>,
  w: number,
  h: number,
  lb: Letterbox,
): Float32Array {
  const size = lb.size;
  const area = size * size;
  const out = new Float32Array(3 * area);
  out.fill(114 / 255);
  const offX = Math.round(lb.padX);
  const offY = Math.round(lb.padY);
  for (let y = 0; y < h; y++) {
    const ty = y + offY;
    if (ty < 0 || ty >= size) continue;
    for (let x = 0; x < w; x++) {
      const tx = x + offX;
      if (tx < 0 || tx >= size) continue;
      const src = (y * w + x) * 4;
      const di = ty * size + tx;
      out[di] = rgba[src] / 255; // R plane
      out[area + di] = rgba[src + 1] / 255; // G plane
      out[2 * area + di] = rgba[src + 2] / 255; // B plane
    }
  }
  return out;
}

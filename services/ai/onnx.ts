import { Image } from 'react-native';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { buildLetterboxedInput, letterbox, undoLetterbox } from '@/core/vision/letterbox';
import { decodeYolo, nms } from '@/core/vision/yolo';

/**
 * The one place onnxruntime and the image pipeline are touched.
 *
 * Your model is a YOLOv8 detector exported to ONNX (mAP50 0.82, single class
 * "crack"). Unlike the executorch object-detection hook this app was first
 * scaffolded for, onnxruntime hands back a *raw tensor* — so the decoding the
 * hook would have hidden is done here explicitly, on top of the pure maths in
 * core/vision. The flow is: resize+letterbox the photo → decode its pixels →
 * pack a CHW float tensor → run the session → decode boxes → NMS → map back to
 * the original photograph's pixels.
 *
 * onnxruntime-react-native, expo-image-manipulator, jpeg-js and expo-asset are
 * native or optional modules that only exist in a dev build that installed them
 * (see docs/DAMAGE-MODEL.md). They are loaded through guarded `require`s: a
 * static `import` would make Metro fail to bundle the whole app when a package is
 * absent (Expo Go, or a teammate who has not rebuilt), whereas this degrades to
 * `null` and the detector reports an honest "unsupported" state instead of
 * crashing. Swapping onnxruntime for another runtime later touches only this file.
 */

// ── Guarded module seams ───────────────────────────────────────────────────

type OrtTensor = unknown;
type OrtValue = { data: ArrayLike<number>; dims: number[] };
type OrtSession = {
  inputNames: string[];
  outputNames: string[];
  run: (feeds: Record<string, OrtTensor>) => Promise<Record<string, OrtValue>>;
};
type OrtModule = {
  InferenceSession: { create: (model: string | Uint8Array, options?: unknown) => Promise<OrtSession> };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => OrtTensor;
};

/** Minimal shape of expo-image-manipulator's SDK 54+ context API. */
type ManipulatorModule = {
  ImageManipulator: {
    manipulate: (uri: string) => {
      resize: (size: { width: number; height: number }) => unknown;
      renderAsync: () => Promise<{
        saveAsync: (options: { base64?: boolean; format?: unknown; compress?: number }) => Promise<{
          base64?: string;
        }>;
      }>;
    };
  };
  SaveFormat: { JPEG: unknown };
};

type JpegModule = {
  decode: (data: Uint8Array, opts?: { useTArray?: boolean }) => { width: number; height: number; data: Uint8Array };
};

type AssetModule = {
  Asset: { fromModule: (mod: number) => { downloadAsync: () => Promise<unknown>; localUri: string | null; uri: string } };
};

// Metro only supports statically analyzable require() calls. Keep these
// guards separate and literal: Expo Go can bundle the JavaScript packages but
// does not provide the native ONNX module, while a development build does.
//
// ── Why the failure is recorded and not just swallowed ──────────────────────
//
// `onnxruntime-react-native` calls `Module.install()` at *import* time. In a
// binary built before the plugin was added that throws, the `catch` returned
// `null`, `onnxAvailable` went false, and every check downstream rendered
// nothing at all: no scan button, no message, no log. A trained model, present
// and correctly bundled, looked to the user like a feature that had never been
// built. The guard stays; what changes is that it says why.
const failures: string[] = [];

function loadOptional<T>(name: string, load: () => T): T | null {
  try {
    return load();
  } catch (caught) {
    failures.push(`${name}: ${caught instanceof Error ? caught.message : 'not available'}`);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ort = loadOptional('onnxruntime-react-native', () => require('onnxruntime-react-native') as OrtModule);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const manip = loadOptional('expo-image-manipulator', () => require('expo-image-manipulator') as ManipulatorModule);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jpeg = loadOptional('jpeg-js', () => require('jpeg-js') as JpegModule);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const assetMod = loadOptional('expo-asset', () => require('expo-asset') as AssetModule);

/** True only when every piece the ONNX pipeline needs is present in this build. */
export const onnxAvailable: boolean = !!(ort && manip && jpeg && assetMod);

/**
 * Why the pipeline is unavailable, or null when it is available.
 *
 * Surfaced in the UI rather than logged. The two cases a person needs to tell
 * apart are "this build has no scanner, rebuild it" and "the scanner is here and
 * something went wrong", and silence made them identical.
 */
export const onnxUnavailableReason: string | null = onnxAvailable
  ? null
  : failures.length > 0
    ? failures.join('; ')
    : 'The on-device scanner is not part of this build.';

if (!onnxAvailable) {
  console.warn('[ai] on-device damage detection unavailable.', onnxUnavailableReason);
}

// ── Public API ──────────────────────────────────────────────────────────────

export type OnnxSession = OrtSession;

/** A detection in original-image pixel space — the shape yoloEngine normalises. */
export type OnnxDetection = {
  bbox: { x1: number; y1: number; x2: number; y2: number };
  label: string;
  score: number;
};

export type OnnxScan = {
  detections: OnnxDetection[];
  imageW: number;
  imageH: number;
  inferenceMs: number;
};

export type DetectOptions = {
  classNames: string[];
  inputSize: number;
  confThreshold: number;
  iouThreshold: number;
};

/**
 * Session options that decide how fast a scan runs.
 *
 * Without these the runtime uses a single-threaded, unoptimised CPU path, and a
 * YOLOv8n inference at 640 takes long enough on a phone to read as "stuck". The
 * three levers, in order of effect:
 *
 *   - `executionProviders`: XNNPACK is a mobile-tuned CPU backend that is several
 *     times faster than the plain CPU provider for convolutions, and it is far
 *     more reliable across devices than NNAPI, which silently falls back to CPU
 *     (and can be slower, because of the tensor copies) whenever the graph uses
 *     an op it does not implement. CPU is kept last as the guaranteed fallback,
 *     so a device without XNNPACK still runs rather than failing.
 *   - `graphOptimizationLevel: 'all'`: fuses and folds the graph once at load,
 *     so every scan afterwards does less work.
 *   - `intraOpNumThreads`: use more than one core for the heavy operators.
 *
 * The cost of all of this is paid once, at load, which is why the detector warms
 * up before it reports ready (see `warmUpSession`).
 */
const SESSION_OPTIONS = {
  executionProviders: ['xnnpack', 'cpu'],
  graphOptimizationLevel: 'all',
  intraOpNumThreads: 4,
} as const;

/**
 * Load the bundled model and create an inference session.
 *
 * The `.onnx` asset is opened by local path where possible — the model is
 * 11.7 MB, and reading it through base64 costs a ~16 MB JavaScript string plus
 * the decoded copy beside it, on a phone that is also holding a camera preview.
 * Bytes are the fallback because a path is formatted differently across
 * platforms. Called once when the detector mounts; the session is reused for
 * every scan.
 */
export async function createOnnxSession(modelSource: number): Promise<OnnxSession> {
  if (!ort || !assetMod) {
    throw new Error(onnxUnavailableReason ?? 'The ONNX runtime is not available in this build.');
  }
  const asset = assetMod.Asset.fromModule(modelSource);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;

  if (uri) {
    try {
      return await ort.InferenceSession.create(uri.replace(/^file:\/\//, ''), SESSION_OPTIONS);
    } catch {
      // Path handling differs between platforms and runtime versions. Bytes are
      // unambiguous, so they remain the fallback rather than the default.
    }
  }

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const bytes = new Uint8Array(decodeBase64(base64));
  return ort.InferenceSession.create(bytes, SESSION_OPTIONS);
}

/**
 * Run one throwaway inference so the first real scan is not the slow one.
 *
 * The first `run` of a session pays for lazy allocation, kernel selection and
 * XNNPACK's own setup — often several times the cost of every scan after it.
 * Doing it here, against a zero tensor, moves that cost into the load phase while
 * the visitor is still framing the shot, so the scan that fires the moment they
 * capture is the warm, fast one. Best-effort: a failure here never blocks a real
 * scan, it only means the first one is cold.
 */
export async function warmUpSession(session: OnnxSession, inputSize: number): Promise<void> {
  if (!ort) return;
  try {
    const zeros = new Float32Array(1 * 3 * inputSize * inputSize);
    const tensor = new ort.Tensor('float32', zeros, [1, 3, inputSize, inputSize]);
    await session.run({ [session.inputNames[0]]: tensor });
  } catch {
    // A warm-up failure is not a scan failure; leave it to the real run to report.
  }
}

function imageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}

/**
 * Run the model against a saved photograph and return real detections.
 *
 * Every number here is measured or model-produced — the box coordinates come
 * from the tensor, the inference time from the clock. If the image cannot be read
 * or decoded the scan throws, and the caller surfaces an honest error rather than
 * an empty "all clear".
 */
export async function runOnnxDetection(
  session: OnnxSession,
  imageUri: string,
  opts: DetectOptions,
): Promise<OnnxScan> {
  if (!ort || !manip || !jpeg) throw new Error('The ONNX runtime is not available in this build.');
  const { classNames, inputSize, confThreshold, iouThreshold } = opts;

  const { width: srcW, height: srcH } = await imageSize(imageUri);
  if (srcW <= 0 || srcH <= 0) throw new Error('The photograph could not be read.');
  const lb = letterbox(srcW, srcH, inputSize);

  // Resize preserving aspect ratio; the grey padding to a full square is added
  // when the tensor is packed, so the manipulator only has to scale.
  const context = manip.ImageManipulator.manipulate(imageUri);
  context.resize({ width: lb.newW, height: lb.newH });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ base64: true, format: manip.SaveFormat.JPEG, compress: 1 });
  if (!saved.base64) throw new Error('The photograph could not be prepared for the model.');

  const decoded = jpeg.decode(new Uint8Array(decodeBase64(saved.base64)), { useTArray: true });
  const input = buildLetterboxedInput(decoded.data, decoded.width, decoded.height, lb);
  const tensor = new ort.Tensor('float32', input, [1, 3, inputSize, inputSize]);

  const started = Date.now();
  const results = await session.run({ [session.inputNames[0]]: tensor });
  const inferenceMs = Date.now() - started;

  const output = results[session.outputNames[0]];
  const boxes = nms(
    decodeYolo(output.data, output.dims, classNames.length, confThreshold),
    iouThreshold,
  );

  const detections: OnnxDetection[] = boxes.map((b) => ({
    bbox: undoLetterbox(b, lb, srcW, srcH),
    label: classNames[b.classId] ?? classNames[0] ?? 'crack',
    score: b.score,
  }));

  return { detections, imageW: srcW, imageH: srcH, inferenceMs };
}

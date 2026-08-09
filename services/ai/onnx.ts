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

function tryLoadOrtModule(): OrtModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('onnxruntime-react-native') as OrtModule;
  } catch {
    return null;
  }
}

function tryLoadManipulatorModule(): ManipulatorModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-manipulator') as ManipulatorModule;
  } catch {
    return null;
  }
}

function tryLoadJpegModule(): JpegModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('jpeg-js') as JpegModule;
  } catch {
    return null;
  }
}

function tryLoadAssetModule(): AssetModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-asset') as AssetModule;
  } catch {
    return null;
  }
}

const ort = tryLoadOrtModule();
const manip = tryLoadManipulatorModule();
const jpeg = tryLoadJpegModule();
const assetMod = tryLoadAssetModule();

/** True only when every piece the ONNX pipeline needs is present in this build. */
export const onnxAvailable: boolean = !!(ort && manip && jpeg && assetMod);

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
 * Load the bundled model and create an inference session.
 *
 * The `.onnx` asset is read into bytes and the session is created from those
 * bytes rather than a file path — a path is formatted differently across
 * platforms (a `file://` URI on one, a bare path on another), whereas bytes are
 * unambiguous. Called once when the detector mounts; the session is reused for
 * every scan.
 */
export async function createOnnxSession(modelSource: number): Promise<OnnxSession> {
  if (!ort || !assetMod) throw new Error('The ONNX runtime is not available in this build.');
  const asset = assetMod.Asset.fromModule(modelSource);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const bytes = new Uint8Array(decodeBase64(base64));
  return ort.InferenceSession.create(bytes);
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

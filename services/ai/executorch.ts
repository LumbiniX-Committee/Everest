/**
 * The one place react-native-executorch is touched.
 *
 * The runtime is a native module that only exists in a dev build that added it
 * (`npm i react-native-executorch` + a rebuild — see docs/DAMAGE-MODEL.md). Until
 * then, and in Expo Go, it is simply absent. So it is loaded through a guarded
 * `require`: a static `import` would make Metro fail to bundle the whole app when
 * the package is not installed, whereas this degrades to `null` and the detector
 * reports an honest "unsupported" state instead of crashing.
 *
 * Keeping the dependency behind this single seam means the rest of the app knows
 * nothing about executorch — swapping in onnxruntime later touches only this file
 * and yoloEngine.ts.
 */

/** A detection as react-native-executorch's object-detection hook returns it. */
export type RawDetection = {
  bbox: { x1: number; y1: number; x2: number; y2: number };
  label: string;
  score: number;
};

/** The subset of the executorch object-detection hook this app relies on. */
export type ObjectDetectionHandle = {
  forward: (input: string) => Promise<RawDetection[]>;
  isReady: boolean;
  isGenerating: boolean;
  error: string | null;
};

export type UseObjectDetection = (config: { modelSource: string | number }) => ObjectDetectionHandle;

let impl: UseObjectDetection | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  impl = require('react-native-executorch').useObjectDetection as UseObjectDetection;
} catch {
  // Package not installed / not linked in this build. The detector will report
  // 'unsupported' and the app runs exactly as it did before, minus the feature.
  impl = null;
}

/** The executorch object-detection hook, or `null` when the runtime is absent. */
export const useObjectDetection: UseObjectDetection | null = impl;

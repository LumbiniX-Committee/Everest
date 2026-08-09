import { useCallback, useEffect, useRef, useState } from 'react';

import { candidateNote, topCandidate } from '@/core/vision/candidate';
import { normalizeBbox, type RawBbox } from '@/core/vision/detect';
import type { ConditionCategory } from '@/types';

import {
  createOnnxSession,
  onnxAvailable,
  onnxUnavailableReason,
  runOnnxDetection,
  type OnnxDetection,
  type OnnxSession,
} from './onnx';

/**
 * On-device damage detection — the honest engine.
 *
 * This replaced a fabricator that hashed the image *filename* into invented
 * boxes, confidence scores and a "surface integrity %". Nothing here invents a
 * finding. When the trained model is present it runs real inference (via
 * onnxruntime — see services/ai/onnx.ts) and returns what the model actually
 * saw; when it is not, it says so (`no-model`/`unsupported`) rather than making
 * something up. A candidate is offered to the surveyor to confirm — it never
 * writes a condition report on its own, and it never claims a conservator-grade
 * assessment.
 *
 * The model is a YOLOv8 crack detector trained and exported separately (see
 * docs/DAMAGE-MODEL.md) and dropped in via `DAMAGE_MODEL.source`. If that source
 * is null, or the native runtime is absent (Expo Go, or a build that has not
 * added onnxruntime), the surface says so in a sentence and offers the manual
 * report instead.
 *
 * It used to say nothing at all, and that was the bug: honest by omission is
 * indistinguishable from a feature that was never built. Every path out of here
 * now carries a `reason`.
 */

export type YoloPathology = 'crack' | 'biological' | 'spalling' | 'water' | 'surface';

/** A single detection the model produced, in normalised 0–1 image space. */
export type YoloDetection = {
  id: string;
  conditionCategory: ConditionCategory;
  pathology: YoloPathology;
  label: string;
  /** The model's real score, 0–1. Never fabricated. */
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  color: string;
  /** One of `CONDITION_SUBTYPES[conditionCategory]`, for one-tap pre-fill. */
  suggestedSubtype: string;
};

export type ScanStatus = 'ok' | 'no-model' | 'error';

/**
 * Which model produced a result. `mAP50` is the model's *own* reported accuracy
 * from its training run — shown in the UI so a reader can weigh a detection
 * honestly. Null when unknown; never a flattering guess.
 */
export type ModelInfo = {
  name: string;
  version: string;
  classes: YoloPathology[];
  mAP50: number | null;
  runtime: 'executorch' | 'onnx';
};

export type YoloScanResult = {
  status: ScanStatus;
  detections: YoloDetection[];
  /** Real measured inference time, or null when no inference ran. */
  inferenceMs: number | null;
  model: ModelInfo | null;
  error?: string;
};

export type DetectorStatus = 'loading' | 'ready' | 'no-model' | 'unsupported' | 'error';

export type DamageDetector = {
  status: DetectorStatus;
  model: ModelInfo | null;
  scanning: boolean;
  /**
   * Why the detector cannot run, in a sentence a person can act on, or null.
   *
   * This is the fix for the reported bug. The detector used to fail silently:
   * a bare `catch` in onnx.ts, a status latched at module load, and a screen
   * that rendered `null` when it was not 'ready'. A trained, bundled model
   * looked exactly like a feature that had never been built.
   */
  reason: string | null;
  scan: (imageUri: string) => Promise<YoloScanResult>;
};

/** A one-tap pre-fill suggestion. Severity is deliberately absent — urgency is a
 * human judgment, not something a vision model should assert. */
export type ConditionSuggestion = {
  category: ConditionCategory;
  subtype: string;
  note: string;
  aiAssisted: true;
};

export const PATHOLOGY_COLORS: Record<YoloPathology, string> = {
  crack: '#EF4444',
  biological: '#22C55E',
  spalling: '#EAB308',
  water: '#3B82F6',
  surface: '#F97316',
};

const PATHOLOGY_TO_CATEGORY: Record<YoloPathology, ConditionCategory> = {
  crack: 'structural',
  biological: 'biology',
  spalling: 'surface',
  water: 'water',
  surface: 'surface',
};

// Each maps to a real entry in CONDITION_SUBTYPES[category] so pre-fill lands on
// an existing chip rather than an orphan string.
const PATHOLOGY_TO_SUBTYPE: Record<YoloPathology, string> = {
  crack: 'New crack',
  biological: 'Moss or algae',
  spalling: 'Flaking',
  water: 'Seepage',
  surface: 'Discolouration',
};

const PATHOLOGY_LABELS: Record<YoloPathology, string> = {
  crack: 'Crack',
  biological: 'Biological growth',
  spalling: 'Spalling',
  water: 'Water ingress',
  surface: 'Surface erosion',
};

// Model class names → our pathology set. Forgiving about spelling so a model
// trained with slightly different class strings still maps cleanly.
const LABEL_TO_PATHOLOGY: Record<string, YoloPathology> = {
  crack: 'crack',
  cracks: 'crack',
  fracture: 'crack',
  biological: 'biological',
  biological_growth: 'biological',
  moss: 'biological',
  algae: 'biological',
  vegetation: 'biological',
  spalling: 'spalling',
  spall: 'spalling',
  flaking: 'spalling',
  water: 'water',
  seepage: 'water',
  damp: 'water',
  moisture: 'water',
  erosion: 'surface',
  discolouration: 'surface',
  discoloration: 'surface',
  surface: 'surface',
  weathering: 'surface',
};

/** Detections below this score are dropped before they reach the UI. */
const SCORE_THRESHOLD = 0.35;
/** Overlapping same-class boxes above this IoU are suppressed (NMS). */
const IOU_THRESHOLD = 0.45;
/** The model's square input edge — must match the `imgsz` used to train/export. */
const INPUT_SIZE = 640;

/**
 * The trained model (see docs/DAMAGE-MODEL.md).
 *
 * This is a real YOLOv8n crack detector: trained on the public crack-seg set for
 * 80 epochs and exported to ONNX. `mAP50` is the number that training run
 * actually reported on the held-out split — shown in the UI, not rounded up. To
 * retrain or extend the classes, follow docs/DAMAGE-MODEL.md and update both
 * `classes` here and the `LABEL_TO_PATHOLOGY` map above.
 *
 * Runtime requirement: onnxruntime-react-native (a native module) must be
 * installed and the dev client rebuilt. Without it `onnxAvailable` is false and
 * the feature reports `unsupported` — the app runs exactly as before, minus the
 * scan.
 */
export const DAMAGE_MODEL: { source: number | null; info: ModelInfo } = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  source: require('../../assets/models/crack-seg.onnx'),
  info: {
    name: 'YOLOv8n crack detector',
    version: '1.0.0',
    classes: ['crack'],
    mAP50: 0.8167,
    runtime: 'onnx',
  },
};

const NO_MODEL_RESULT: YoloScanResult = {
  status: 'no-model',
  detections: [],
  inferenceMs: null,
  model: null,
};

function labelToPathology(label: string): YoloPathology {
  return LABEL_TO_PATHOLOGY[label.trim().toLowerCase()] ?? 'surface';
}

function toDetection(raw: OnnxDetection, imageW: number, imageH: number, index: number): YoloDetection {
  const pathology = labelToPathology(raw.label);
  return {
    id: `det-${index}-${Math.round(raw.score * 1000)}`,
    conditionCategory: PATHOLOGY_TO_CATEGORY[pathology],
    pathology,
    label: PATHOLOGY_LABELS[pathology],
    confidence: raw.score,
    bbox: normalizeBbox(raw.bbox as RawBbox, imageW, imageH),
    color: PATHOLOGY_COLORS[pathology],
    suggestedSubtype: PATHOLOGY_TO_SUBTYPE[pathology],
  };
}

/**
 * The highest-confidence detection as a pre-fill suggestion, or null if the scan
 * found nothing. Category and subtype come from the model; severity is left for
 * the surveyor to set.
 */
export function scanToSuggestion(result: YoloScanResult): ConditionSuggestion | null {
  const top = topCandidate(result.detections);
  if (!top) return null;
  return {
    category: top.conditionCategory,
    subtype: top.suggestedSubtype,
    note: candidateNote(top.label, top.confidence),
    aiAssisted: true,
  };
}

// Which detector implementation is used is fixed at module load by whether a
// model and the native runtime are present, so hook order never changes between
// renders — one branch is a hook, the other returns a constant.
const UNAVAILABLE_STATUS: DetectorStatus = onnxAvailable ? 'no-model' : 'unsupported';

/**
 * What to tell someone whose build cannot scan.
 *
 * Two different problems, and confusing them wastes an afternoon: either the
 * native runtime is missing, which a rebuild fixes, or the runtime is present
 * and the model file is not, which it does not.
 */
export const UNAVAILABLE_REASON: string | null = onnxAvailable
  ? 'The detector is in this build, but no model file is bundled with it.'
  : (onnxUnavailableReason ?? 'The on-device scanner is not part of this build.');

const UNAVAILABLE_DETECTOR: DamageDetector = {
  status: UNAVAILABLE_STATUS,
  model: null,
  scanning: false,
  reason: UNAVAILABLE_REASON,
  scan: async () => ({ ...NO_MODEL_RESULT, error: UNAVAILABLE_REASON ?? undefined }),
};

/**
 * The live detector: loads the ONNX session once when it mounts, then runs real
 * inference on demand. onnxruntime's session is imperative (not a hook), so the
 * session is created in an effect and held in a ref; `status` reflects the load.
 */
function useOnnxDamageDetector(source: number): DamageDetector {
  const [status, setStatus] = useState<DetectorStatus>('loading');
  const [scanning, setScanning] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const sessionRef = useRef<OnnxSession | null>(null);
  // Mirrored so `scan` can read the current reason without listing it as a
  // dependency and getting a new identity on every load state change.
  const reasonRef = useRef<string | null>(null);
  reasonRef.current = reason;

  useEffect(() => {
    let cancelled = false;
    createOnnxSession(source)
      .then((session) => {
        if (cancelled) return;
        sessionRef.current = session;
        setReason(null);
        setStatus('ready');
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        // The message is carried, not discarded. `.catch(() => setStatus('error'))`
        // threw the only useful thing away, and because 'error' still counted as
        // available the screen went on offering a scan that answered "the model
        // is still loading" for as long as the app stayed open.
        const message = caught instanceof Error ? caught.message : 'The model could not be loaded.';
        console.warn('[ai] the damage model failed to load —', message);
        setReason(message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  const scan = useCallback(async (imageUri: string): Promise<YoloScanResult> => {
    const session = sessionRef.current;
    if (!session) {
      return {
        status: 'error',
        detections: [],
        inferenceMs: null,
        model: DAMAGE_MODEL.info,
        error: reasonRef.current ?? 'The model is still loading.',
      };
    }
    setScanning(true);
    try {
      const scanned = await runOnnxDetection(session, imageUri, {
        classNames: DAMAGE_MODEL.info.classes,
        inputSize: INPUT_SIZE,
        confThreshold: SCORE_THRESHOLD,
        iouThreshold: IOU_THRESHOLD,
      });
      const detections = scanned.detections.map((d, i) =>
        toDetection(d, scanned.imageW, scanned.imageH, i),
      );
      return {
        status: 'ok',
        detections,
        inferenceMs: scanned.inferenceMs,
        model: DAMAGE_MODEL.info,
      };
    } catch (caught) {
      return {
        status: 'error',
        detections: [],
        inferenceMs: null,
        model: DAMAGE_MODEL.info,
        error: caught instanceof Error ? caught.message : 'The scan failed.',
      };
    } finally {
      setScanning(false);
    }
  }, []);

  return { status, model: DAMAGE_MODEL.info, scanning, reason, scan };
}

/**
 * The damage detector for the current build.
 *
 * Returns a live onnxruntime-backed detector when the model and runtime are
 * present; otherwise a constant detector reporting 'no-model'/'unsupported' whose
 * `scan` resolves honestly to an empty, no-model result. The choice is fixed at
 * module load so the hook count never changes between renders.
 */
const MODEL_SOURCE = DAMAGE_MODEL.source;

export const useDamageDetector: () => DamageDetector =
  MODEL_SOURCE != null && onnxAvailable
    ? () => useOnnxDamageDetector(MODEL_SOURCE)
    : () => UNAVAILABLE_DETECTOR;

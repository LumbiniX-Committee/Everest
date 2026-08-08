import { useCallback } from 'react';
import { Image } from 'react-native';

import { filterByScore, normalizeBbox, type RawBbox } from '@/core/vision/detect';
import type { ConditionCategory } from '@/types';

import { useObjectDetection, type RawDetection } from './executorch';

/**
 * On-device damage detection — the honest engine.
 *
 * This replaced a fabricator that hashed the image *filename* into invented
 * boxes, confidence scores and a "surface integrity %". Nothing here invents a
 * finding. When a trained model is present it runs real inference and returns
 * what the model actually saw; when it is not, it says so (`no-model`) rather
 * than making something up. A candidate is offered to the surveyor to confirm —
 * it never writes a condition report on its own, and it never claims a
 * conservator-grade assessment.
 *
 * The model itself is trained and exported separately (see docs/DAMAGE-MODEL.md)
 * and dropped in via `DAMAGE_MODEL.source`. Until then the feature is simply
 * absent from the UI — honest by omission.
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

/**
 * The trained model, dropped in after training (see docs/DAMAGE-MODEL.md).
 *
 * `source: null` is the honest current state — no model shipped, so the feature
 * does not appear. To activate: place the exported model under assets/models/,
 * set `source: require('../../assets/models/crack-seg.pte')`, fill in `mAP50`
 * with the number your training run reported, `npm i react-native-executorch`,
 * and rebuild the dev client.
 */
export const DAMAGE_MODEL: { source: string | number | null; info: ModelInfo } = {
  source: null,
  info: {
    name: 'YOLOv8n crack detector',
    version: '0.1.0',
    classes: ['crack'],
    mAP50: null,
    runtime: 'executorch',
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

function imageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}

function toDetection(raw: RawDetection, imageW: number, imageH: number, index: number): YoloDetection {
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
  const top = result.detections.reduce<YoloDetection | null>(
    (best, d) => (!best || d.confidence > best.confidence ? d : best),
    null,
  );
  if (!top) return null;
  return {
    category: top.conditionCategory,
    subtype: top.suggestedSubtype,
    note: `AI-assisted: candidate ${top.label.toLowerCase()} at about ${Math.round(
      top.confidence * 100,
    )}% confidence. Confirm and set how urgent it seems.`,
    aiAssisted: true,
  };
}

// Which detector implementation is used is fixed at module load by whether a
// model and the native runtime are present, so hook order never changes between
// renders — one branch is a hook, the other returns a constant.
const UNAVAILABLE_STATUS: DetectorStatus = useObjectDetection == null ? 'unsupported' : 'no-model';

const UNAVAILABLE_DETECTOR: DamageDetector = {
  status: UNAVAILABLE_STATUS,
  model: null,
  scanning: false,
  scan: async () => NO_MODEL_RESULT,
};

function makeExecutorchDetectorHook(
  source: string | number,
  useDetection: NonNullable<typeof useObjectDetection>,
): () => DamageDetector {
  return function useExecutorchDamageDetector(): DamageDetector {
    const handle = useDetection({ modelSource: source });

    const scan = useCallback(
      async (imageUri: string): Promise<YoloScanResult> => {
        if (!handle.isReady) {
          return {
            status: 'error',
            detections: [],
            inferenceMs: null,
            model: DAMAGE_MODEL.info,
            error: 'The model is still loading.',
          };
        }
        const started = Date.now();
        try {
          const raw = await handle.forward(imageUri);
          // Assumes the runtime returns boxes in original-image pixel space. If a
          // device test shows model-input space instead, adjust only here.
          const { width, height } = await imageSize(imageUri);
          const detections = filterByScore(raw, SCORE_THRESHOLD).map((d, i) =>
            toDetection(d, width, height, i),
          );
          return {
            status: 'ok',
            detections,
            inferenceMs: Date.now() - started,
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
        }
      },
      [handle],
    );

    const status: DetectorStatus = handle.error ? 'error' : handle.isReady ? 'ready' : 'loading';
    return { status, model: DAMAGE_MODEL.info, scanning: handle.isGenerating, scan };
  };
}

/**
 * The damage detector for the current build.
 *
 * Returns a live executorch-backed detector when a model and runtime are
 * present; otherwise a constant detector reporting 'no-model'/'unsupported' whose
 * `scan` resolves honestly to an empty, no-model result.
 */
const MODEL_SOURCE = DAMAGE_MODEL.source;

export const useDamageDetector: () => DamageDetector =
  MODEL_SOURCE != null && useObjectDetection != null
    ? makeExecutorchDetectorHook(MODEL_SOURCE, useObjectDetection)
    : () => UNAVAILABLE_DETECTOR;

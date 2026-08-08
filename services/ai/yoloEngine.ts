import type { ConditionCategory, ConditionSeverity } from '@/types';

/**
 * YOLOv8-seg Heritage Masonry Pathology Detection Engine.
 *
 * Runs 5-class damage classification aligned with the Suzhou Gray-Brick
 * Pathology Benchmark & MSD-Det taxonomy:
 *   crack, biological growth, spalling, water ingress, surface erosion.
 *
 * Currently uses a simulation layer that produces realistic detections.
 * When `react-native-executorch` is integrated, replace `runYoloScan`
 * internals with `useObjectDetection` from the quantised INT8 model.
 */

export type YoloPathology = 'crack' | 'biological' | 'spalling' | 'water' | 'surface';

export type YoloDetection = {
  id: string;
  /** Maps to the app's existing ConditionCategory type. */
  conditionCategory: ConditionCategory;
  /** The YOLO pathology class name. */
  pathology: YoloPathology;
  /** Human-readable label shown on the bounding box. */
  label: string;
  /** 0.0–1.0 confidence score from the model. */
  confidence: number;
  /** Normalised bounding box (0.0–1.0) relative to the image frame. */
  bbox: { x: number; y: number; w: number; h: number };
  /** Hex colour for the overlay. */
  color: string;
};

export type YoloScanResult = {
  detections: YoloDetection[];
  /** Milliseconds taken for inference. */
  inferenceMs: number;
  /** 0–100 surface integrity score. */
  surfaceHealth: number;
  /** Suggested severity based on defect area ratio. */
  suggestedSeverity: ConditionSeverity;
};

/** Class-to-colour mapping following heritage pathology convention. */
export const PATHOLOGY_COLORS: Record<YoloPathology, string> = {
  crack: '#EF4444',
  biological: '#22C55E',
  spalling: '#EAB308',
  water: '#3B82F6',
  surface: '#F97316',
};

/** Maps YOLO pathology classes to the app's ConditionCategory type. */
const PATHOLOGY_TO_CONDITION: Record<YoloPathology, ConditionCategory> = {
  crack: 'structural',
  biological: 'biology',
  spalling: 'surface',
  water: 'water',
  surface: 'surface',
};

/** Human-readable label for each YOLO pathology class. */
const PATHOLOGY_LABELS: Record<YoloPathology, string> = {
  crack: 'Structural Crack',
  biological: 'Biological Growth',
  spalling: 'Surface Spalling',
  water: 'Water Ingress',
  surface: 'Material Erosion',
};

/**
 * Run YOLO pathology scan on the current camera frame or photo.
 *
 * When a real model is bundled, this calls ExecuTorch's useObjectDetection.
 * Until then it produces a realistic fixed set of detections so the UI and
 * condition-sheet auto-fill can be built and demonstrated end to end.
 */
export async function runYoloScan(_imageUri?: string): Promise<YoloScanResult> {
  const t0 = Date.now();

  // Simulate realistic inference latency (~65 ms on-device)
  await new Promise((r) => setTimeout(r, 65));

  const detections: YoloDetection[] = [
    makeDet('yolo-1', 'crack', 0.89, { x: 0.18, y: 0.30, w: 0.38, h: 0.16 }),
    makeDet('yolo-2', 'biological', 0.94, { x: 0.56, y: 0.45, w: 0.30, h: 0.26 }),
    makeDet('yolo-3', 'spalling', 0.78, { x: 0.12, y: 0.64, w: 0.34, h: 0.20 }),
  ];

  const areaRatio = detections.reduce((sum, d) => sum + d.bbox.w * d.bbox.h, 0);
  const surfaceHealth = Math.round(Math.max(0, Math.min(100, (1 - areaRatio) * 100)));

  let suggestedSeverity: ConditionSeverity = 'noted';
  if (areaRatio > 0.25) suggestedSeverity = 'urgent';
  else if (areaRatio > 0.10) suggestedSeverity = 'concerning';

  return {
    detections,
    inferenceMs: Date.now() - t0,
    surfaceHealth,
    suggestedSeverity,
  };
}

function makeDet(
  id: string,
  pathology: YoloPathology,
  confidence: number,
  bbox: { x: number; y: number; w: number; h: number },
): YoloDetection {
  return {
    id,
    conditionCategory: PATHOLOGY_TO_CONDITION[pathology],
    pathology,
    label: PATHOLOGY_LABELS[pathology],
    confidence,
    bbox,
    color: PATHOLOGY_COLORS[pathology],
  };
}

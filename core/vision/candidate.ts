/**
 * From detections to a report draft, and from a failure to a sentence.
 *
 * The two decisions that made the damage detector look absent both lived in
 * screen code where nothing tested them:
 *
 *   1. which detection becomes the report draft, and
 *   2. whether the surface says anything at all when it cannot scan.
 *
 * The second is the one that cost a working feature. `aiAvailable` counted an
 * 'error' status as available and the screen rendered `null` when it was not,
 * so a trained model that failed to load produced no scan, no message and no
 * log, and looked exactly like a feature nobody had built. Both decisions are
 * pure, so they are here where `npm run verify` covers them.
 *
 * Nothing in this file invents a finding. Severity is never derived: how urgent
 * damage is is a human judgment, and a detector that guessed it would be
 * asserting the one thing it cannot see.
 */

/** The load state of the on-device detector, as `services/ai` reports it. */
export type DetectorStatus = 'loading' | 'ready' | 'no-model' | 'unsupported' | 'error';

/** The minimum a detection needs for the decisions here. */
export type Candidate = {
  label: string;
  confidence: number;
};

/**
 * Whether a scan can still happen.
 *
 * 'error' is false, and that is the fix. It used to be true, so a model that
 * had failed to load kept a scan control on screen that answered "the model is
 * still loading" for as long as the app stayed open.
 */
export function canScan(status: DetectorStatus): boolean {
  return status === 'loading' || status === 'ready';
}

/**
 * What to tell someone who cannot scan, or null when they can.
 *
 * Never empty when `canScan` is false. Silence is what made a missing native
 * runtime and a working-but-unbuilt feature indistinguishable.
 */
export function detectorMessage(status: DetectorStatus, reason?: string | null): string | null {
  if (canScan(status)) return null;
  if (reason && reason.trim()) return reason.trim();
  if (status === 'unsupported') return 'This build does not include the on-device scanner.';
  if (status === 'no-model') return 'The scanner is in this build, but no model is bundled with it.';
  return 'The model could not be loaded.';
}

/** The highest-scoring detection, or null when the scan found nothing. */
export function topCandidate<T extends Candidate>(detections: readonly T[]): T | null {
  return detections.reduce<T | null>(
    (best, item) => (!best || item.confidence > best.confidence ? item : best),
    null,
  );
}

/**
 * The note that travels with a model-assisted report.
 *
 * Says what the model saw and what it scored, in that order, and then asks for
 * the judgment it is not entitled to make. Written here so the wording cannot
 * drift into a verdict one screen at a time.
 */
export function candidateNote(label: string, confidence: number): string {
  const percent = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  return `Model-assisted. It found a possible ${label.toLowerCase()} at about ${percent}% confidence. Confirm it, and say how urgent it looks.`;
}

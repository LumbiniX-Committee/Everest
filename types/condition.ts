/**
 * Condition reporting.
 *
 * The model behind §10's flow: what did you notice → category → detail →
 * severity → note. Four decisions, each one narrowing the last, so an observer
 * standing in the sun with one hand free is never facing a form.
 *
 * Categories are deliberately coarse. A visitor is not a conservator, and
 * asking them to distinguish efflorescence from subflorescence produces worse
 * data than asking them to point at "surface" and describe what they saw.
 */

export type ConditionCategory =
  | 'biology'
  | 'structural'
  | 'water'
  | 'surface'
  | 'human-impact'
  | 'encroachment'
  | 'environment'
  | 'management';

/** Display order. Roughly most- to least-commonly reported by visitors. */
export const CONDITION_CATEGORIES: ConditionCategory[] = [
  'biology',
  'surface',
  'structural',
  'water',
  'human-impact',
  'encroachment',
  'environment',
  'management',
];

export const CONDITION_CATEGORY_LABELS: Record<ConditionCategory, string> = {
  biology: 'Biological growth',
  structural: 'Structural',
  water: 'Water',
  surface: 'Surface',
  'human-impact': 'Human impact',
  encroachment: 'Encroachment',
  environment: 'Environment',
  management: 'Management',
};

/** One line, plain language, shown under the category name while choosing. */
export const CONDITION_CATEGORY_HINTS: Record<ConditionCategory, string> = {
  biology: 'Moss, algae, roots, nesting, insect activity',
  structural: 'Cracking, leaning, displacement, missing material',
  water: 'Pooling, seepage, staining, drainage failure',
  surface: 'Flaking, salt, discolouration, wear',
  'human-impact': 'Touching, climbing, graffiti, litter',
  encroachment: 'Building, planting, or use pressing on the site',
  environment: 'Flooding, storm damage, heat, dust',
  management: 'Signage, barriers, lighting, or paths needing attention',
};

/**
 * The narrowing step. Free of jargon on purpose — these are the words a visitor
 * would use, not the words a condition survey would use.
 */
export const CONDITION_SUBTYPES: Record<ConditionCategory, string[]> = {
  biology: ['Moss or algae', 'Plant roots', 'Nesting', 'Insect activity', 'Something else'],
  structural: ['New crack', 'Widening crack', 'Leaning', 'Missing piece', 'Something else'],
  water: ['Standing water', 'Seepage', 'Water staining', 'Blocked drainage', 'Something else'],
  surface: ['Flaking', 'Salt deposit', 'Discolouration', 'Worn by touch', 'Something else'],
  'human-impact': ['Graffiti', 'Litter', 'Climbing or sitting', 'Touching', 'Something else'],
  encroachment: ['New construction', 'Planting', 'Vehicles', 'Vending', 'Something else'],
  environment: ['Flood damage', 'Storm damage', 'Dust', 'Heat damage', 'Something else'],
  management: ['Signage', 'Barrier', 'Lighting', 'Path', 'Something else'],
};

/**
 * Three steps, not five.
 *
 * A visitor cannot calibrate a ten-point scale, and pretending otherwise gives
 * conservators noise that looks like signal. The labels describe *urgency of
 * attention*, which a non-specialist can judge, rather than *extent of damage*,
 * which they cannot.
 */
export type ConditionSeverity = 'noted' | 'concerning' | 'urgent';

export const SEVERITY_LABELS: Record<ConditionSeverity, string> = {
  noted: 'Worth noting',
  concerning: 'Concerning',
  urgent: 'Needs attention soon',
};

export const SEVERITY_HINTS: Record<ConditionSeverity, string> = {
  noted: 'Stable as far as you can tell. Recorded for the series.',
  concerning: 'Changed, or getting worse. Someone should look.',
  urgent: 'Active damage or a risk to people.',
};

/**
 * A condition report attached to an observation.
 *
 * Always attached — a report without a photograph at a known vantage is an
 * opinion, and the point of Sākṣī is that it is evidence.
 */
export type ConditionReport = {
  id: string;
  observationId: string;
  siteId: string;
  category: ConditionCategory;
  /** One of `CONDITION_SUBTYPES[category]`. Stored as text, not an index. */
  subtype: string;
  severity: ConditionSeverity;
  /** The observer's own words. Optional and genuinely so. */
  note?: string;
  /** ISO 8601, UTC. */
  recordedAt: string;
  /**
   * True when the report was pre-filled from an on-device damage-detection
   * candidate and then confirmed by the observer. The observer still chose to
   * file it; this only records that a machine suggested it first, so a later
   * reader can weigh assisted findings against unaided ones. Absent/false means
   * entirely by hand.
   */
  aiAssisted?: boolean;
  synced: boolean;
};

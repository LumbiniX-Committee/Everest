import type { InterfaceLanguage, ConditionCategory, ConditionSeverity } from '@/types';
import { visitorCopy, type VisitorCopyKey } from './visitor';

const CATEGORY_KEYS = {
  biology: 'condition.category.biology',
  structural: 'condition.category.structural',
  water: 'condition.category.water',
  surface: 'condition.category.surface',
  'human-impact': 'condition.category.human-impact',
  encroachment: 'condition.category.encroachment',
  environment: 'condition.category.environment',
  management: 'condition.category.management',
} as const satisfies Record<ConditionCategory, VisitorCopyKey>;

const CATEGORY_HINT_KEYS = {
  biology: 'condition.hint.biology',
  structural: 'condition.hint.structural',
  water: 'condition.hint.water',
  surface: 'condition.hint.surface',
  'human-impact': 'condition.hint.human-impact',
  encroachment: 'condition.hint.encroachment',
  environment: 'condition.hint.environment',
  management: 'condition.hint.management',
} as const satisfies Record<ConditionCategory, VisitorCopyKey>;

const SEVERITY_KEYS = {
  noted: 'condition.severity.noted',
  concerning: 'condition.severity.concerning',
  urgent: 'condition.severity.urgent',
} as const satisfies Record<ConditionSeverity, VisitorCopyKey>;

const SEVERITY_HINT_KEYS = {
  noted: 'condition.severityHint.noted',
  concerning: 'condition.severityHint.concerning',
  urgent: 'condition.severityHint.urgent',
} as const satisfies Record<ConditionSeverity, VisitorCopyKey>;

const SUBTYPE_KEYS = {
  'Moss or algae': 'condition.subtype.moss',
  'Plant roots': 'condition.subtype.roots',
  Nesting: 'condition.subtype.nesting',
  'Insect activity': 'condition.subtype.insects',
  'Something else': 'condition.subtype.other',
  'New crack': 'condition.subtype.newCrack',
  'Widening crack': 'condition.subtype.wideningCrack',
  Leaning: 'condition.subtype.leaning',
  'Missing piece': 'condition.subtype.missingPiece',
  'Standing water': 'condition.subtype.standingWater',
  Seepage: 'condition.subtype.seepage',
  'Water staining': 'condition.subtype.waterStaining',
  'Blocked drainage': 'condition.subtype.blockedDrainage',
  Flaking: 'condition.subtype.flaking',
  'Salt deposit': 'condition.subtype.salt',
  Discolouration: 'condition.subtype.discolouration',
  'Worn by touch': 'condition.subtype.wornByTouch',
  Graffiti: 'condition.subtype.graffiti',
  Litter: 'condition.subtype.litter',
  'Climbing or sitting': 'condition.subtype.climbing',
  Touching: 'condition.subtype.touching',
  'New construction': 'condition.subtype.construction',
  Planting: 'condition.subtype.planting',
  Vehicles: 'condition.subtype.vehicles',
  Vending: 'condition.subtype.vending',
  'Flood damage': 'condition.subtype.flood',
  'Storm damage': 'condition.subtype.storm',
  Dust: 'condition.subtype.dust',
  'Heat damage': 'condition.subtype.heat',
  Signage: 'condition.subtype.signage',
  Barrier: 'condition.subtype.barrier',
  Lighting: 'condition.subtype.lighting',
  Path: 'condition.subtype.path',
} as const satisfies Record<string, VisitorCopyKey>;

export function conditionCategoryCopy(
  language: InterfaceLanguage,
  category: ConditionCategory,
): string {
  return visitorCopy(language, CATEGORY_KEYS[category]);
}

export function conditionCategoryHint(
  language: InterfaceLanguage,
  category: ConditionCategory,
): string {
  return visitorCopy(language, CATEGORY_HINT_KEYS[category]);
}

export function conditionSeverityCopy(
  language: InterfaceLanguage,
  severity: ConditionSeverity,
): string {
  return visitorCopy(language, SEVERITY_KEYS[severity]);
}

export function conditionSeverityHint(
  language: InterfaceLanguage,
  severity: ConditionSeverity,
): string {
  return visitorCopy(language, SEVERITY_HINT_KEYS[severity]);
}

export function conditionSubtypeCopy(language: InterfaceLanguage, subtype: string): string {
  const key = SUBTYPE_KEYS[subtype as keyof typeof SUBTYPE_KEYS];
  return key ? visitorCopy(language, key) : subtype;
}

/**
 * shared/types.ts — the lane boundary contract.
 *
 * Every type here crosses a lane boundary. Per SETUP-EVERYONE.md §4.4 this file
 * changes ONLY by group agreement, announced to everyone. If you need a shape
 * that only your lane uses, put it in your lane's directory instead.
 *
 * Source of truth: 04-ARCHITECTURE.md §2 (schema) and §3 (API contract).
 *
 * Style note: union types and `as const` objects, never TS `enum`. Enums do not
 * survive type-stripping (`node --experimental-strip-types`) and they compile to
 * runtime objects that Metro then has to carry. Unions cost nothing.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** ISO-8601 with timezone, e.g. "2026-08-08T04:12:33Z". */
export type Timestamp = string;
/** ISO date, no time, e.g. "2026-08-08". Used for the daily merit cap. */
export type DateOnly = string;
export type Uuid = string;

export interface Coords {
  lat: number;
  lon: number;
}

/**
 * Nepali is a first-class language, not an afterthought (05-CONTENT-SPEC §7).
 * `pi` is Pali/Sanskrit where it is meaningful, omitted where it is not.
 */
export interface LocalisedText {
  en: string;
  ne: string;
  pi?: string;
}

/** Languages shipped at build. Everything else is machine-translated and labelled. */
export type Language = 'en' | 'ne';

/**
 * Honesty marker on every localised string set that was drafted rather than
 * written by a speaker. 05-CONTENT-SPEC §7: label machine output as machine
 * output. A judge who speaks the language and finds a bad translation you
 * claimed was human is worse than an honest label.
 */
export type ReviewState = 'pending' | 'human' | 'machine';

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

export type Zone =
  | 'sacred_garden'
  | 'monastic_east'
  | 'monastic_west'
  | 'greater_lumbini';

/** 1 = primary, 2 = secondary, 3 = contextual. Significance, never rarity. */
export type Tier = 1 | 2 | 3;

/**
 * Charter non-negotiable #8: photography is hard-disabled in restricted
 * geofences. Verify each site's real restriction on arrival.
 */
export type Photography = 'allowed' | 'restricted' | 'prohibited';

export interface Fact {
  label: LocalisedText;
  value: LocalisedText;
}

export interface Source {
  title: string;
  url: string;
  /** Optional page/plate reference, e.g. "Plate XII". */
  locator?: string;
}

export interface Inscription {
  transliteration: string;
  translation: LocalisedText;
  /** Which published edition this reading comes from. Never leave blank. */
  source: Source;
}

/** Negative years are BCE. `to: null` means "to the present". */
export interface Period {
  from: number | null;
  to: number | null;
}

export interface Site {
  id: string;
  name: LocalisedText;
  zone: Zone;
  tier: Tier;
  coords: Coords;
  /**
   * Where the coordinate came from. 05-CONTENT-SPEC §1 says verify every
   * coordinate against OpenStreetMap before shipping — this records whether
   * that happened, so nobody has to guess which ones are still planning
   * approximations. tools/validate-seed.mjs reports any that are still 'doc'.
   */
  coords_source: 'osm' | 'wikidata' | 'doc' | 'field';
  /** Darśana radius in metres. 30–50 m in practice. */
  geofence_m: number;
  period: Period;
  photography: Photography;
  /** ≤ 200 words. A phone screen, not an essay. */
  summary: LocalisedText;
  ne_review: ReviewState;
  facts: Fact[];
  inscription?: Inscription;
  /** TimelinePhase ids, in order. */
  timeline: string[];
  /** Plate ids. */
  plates: string[];
  /** Vantage ids. */
  vantages: string[];
  /** SuttaCentral uids this site relates to, e.g. "dn16". */
  dhamma_links: string[];
  sources: Source[];
}

// ---------------------------------------------------------------------------
// Conservation timeline (05-CONTENT-SPEC §3)
// ---------------------------------------------------------------------------

export interface TimelinePhase {
  id: string;
  label: LocalisedText;
  year_from: number;
  /** null = ongoing. */
  year_to: number | null;
  description: LocalisedText;
  ne_review: ReviewState;
  sources: Source[];
}

// ---------------------------------------------------------------------------
// Plates — reconstruction and historical imagery
// ---------------------------------------------------------------------------

/**
 * Charter non-negotiable #6: every generated image carries its tier label. No
 * exceptions, no "we'll add it later". Tiers per 02-ASSETS-AND-3D-PIPELINE §6.1.
 */
export type EvidenceTier =
  /** A real historical photograph or survey drawing. Nothing generated. */
  | 'historical_photograph'
  /** Measured drawing, plan or section from a published survey. */
  | 'survey_drawing'
  /** Image-to-image, structure conditioned on a cited historical source. */
  | 'conditioned_reconstruction'
  /** Artist's impression informed by evidence but not conditioned on an image. */
  | 'artistic_impression';

export interface Plate {
  id: string;
  site_id: string;
  caption: LocalisedText;
  /** Relative path under assets/plates/. */
  image: string;
  /** Never optional. See Charter #6. */
  evidence_tier: EvidenceTier;
  /** For conditioned_reconstruction: what it was conditioned on. */
  conditioned_on?: Source;
  year?: number;
  licence: string;
  attribution: string;
  sources: Source[];
}

// ---------------------------------------------------------------------------
// Vantages — position + heading = the definition of a repeatable view
// ---------------------------------------------------------------------------

export interface Vantage {
  id: string;
  site_id: string;
  label: LocalisedText;
  coords: Coords;
  /** 0–360, true north. */
  heading_deg: number;
  pitch_deg: number;
  hfov_deg: number;
  /** Tolerances feed the alignment engine (04-ARCHITECTURE §5). */
  tol_pos_m: number;
  tol_heading_deg: number;
  /** The ghost image the user aligns against. */
  reference_url: string | null;
  reference_year: number | null;
  /** e.g. "mukherji-1901-pl-xii" or "mapillary:1234567890". */
  reference_src: string | null;
  reference_lic: string | null;
  /** How many harvested images formed this cluster. Evidence, not decoration. */
  cluster_n: number;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Captures
// ---------------------------------------------------------------------------

export interface Capture {
  id: Uuid;
  vantage_id: string;
  user_id: Uuid;
  image_url: string;
  thumb_url: string | null;
  captured_at: Timestamp;
  lat: number;
  lon: number;
  gps_acc_m: number;
  heading_deg: number;
  /** 0–1, from the alignment engine. Stored with every capture — it is the
   *  quality metric and it is a real number for a real slide. */
  align_score: number;
  device: string | null;
  queued_offline: boolean;
}

// ---------------------------------------------------------------------------
// Condition reports (05-CONTENT-SPEC §4)
// ---------------------------------------------------------------------------

export type ConditionCategory =
  | 'biological_growth'
  | 'structural'
  | 'water'
  | 'surface'
  | 'human_impact'
  | 'encroachment'
  | 'environmental'
  | 'management';

/** The published subtype vocabulary, so the export reads to a conservator. */
export const CONDITION_SUBTYPES = {
  biological_growth: ['moss', 'lichen', 'algae', 'root_intrusion', 'vegetation_in_masonry'],
  structural: ['crack', 'spalling', 'displacement', 'subsidence', 'leaning', 'fabric_loss'],
  water: ['ingress', 'staining', 'pooling', 'drainage_failure', 'flood_damage'],
  surface: ['erosion', 'efflorescence', 'salt_crystallisation', 'delamination', 'discolouration'],
  human_impact: ['graffiti', 'vandalism', 'touch_wear', 'unauthorised_offering', 'litter'],
  encroachment: ['unauthorised_construction', 'vehicle_intrusion', 'boundary_violation'],
  environmental: ['deposition', 'tree_loss', 'habitat_disturbance'],
  management: ['signage_failure', 'barrier_damage', 'lighting', 'waste_handling'],
} as const;

export type ConditionSubtype =
  (typeof CONDITION_SUBTYPES)[ConditionCategory][number];

export type Severity = 1 | 2 | 3 | 4 | 5;
export type ReporterConfidence = 1 | 2 | 3;

export type ReportStatus =
  | 'open'
  | 'corroborated'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved';

export interface ConditionReport {
  id: Uuid;
  capture_id: Uuid | null;
  site_id: string;
  category: ConditionCategory;
  subtype: ConditionSubtype | null;
  severity: Severity;
  reporter_conf: ReporterConfidence;
  note: string | null;
  /** ~76 m clustering cell. */
  geohash7: string;
  corroborations: number;
  status: ReportStatus;
  custodian_note: string | null;
  acknowledged_at: Timestamp | null;
  created_at: Timestamp;
}

// ---------------------------------------------------------------------------
// Merit — earned, never transferred
// ---------------------------------------------------------------------------

export type MeritKind =
  | 'resurvey'
  | 'corroboration'
  | 'first_report'
  | 'attention_quest'
  | 'path_quest'
  | 'contribution';

/**
 * Append-only, earning-only (Charter non-negotiable #9). There is no spend
 * column, no transfer, and `amount` is always positive. Non-transferability is
 * a schema decision, not a consensus mechanism.
 */
export interface MeritEvent {
  id: Uuid;
  user_id: Uuid;
  kind: MeritKind;
  /** What earned it — a vantage id, quest id, report id. */
  ref_id: string | null;
  /** Always > 0. Enforced in the type and again at runtime. */
  amount: number;
  day: DateOnly;
  created_at: Timestamp;
}

export interface MeritSummary {
  balance: number;
  today: number;
  cap: number;
  /** cap - today, floored at 0. */
  remaining: number;
  /** true once today >= cap. The app then says "You've done enough today." */
  complete: boolean;
  events: MeritEvent[];
}

// ---------------------------------------------------------------------------
// Dāna — merit determines allocation; the app never handles funds
// ---------------------------------------------------------------------------

export interface Need {
  id: string;
  site_id: string;
  title: LocalisedText;
  description: LocalisedText;
  ne_review: ReviewState;
  funded_by: string;
  target_npr: number;
  allocated_merit: number;
  status: 'open' | 'funded' | 'in_progress' | 'complete';
}

export interface Allocation {
  id: Uuid;
  user_id: Uuid;
  need_id: string;
  merit_spent: number;
  created_at: Timestamp;
}

// ---------------------------------------------------------------------------
// Quests (05-CONTENT-SPEC §5 + the observation riddle family, 10-REVIEW §1)
// ---------------------------------------------------------------------------

export type QuestFamily = 'witness' | 'path' | 'attention' | 'observation';

/**
 * Time window in local site time, "HH:MM". `q.first-light` is 05:30–07:00 only,
 * because raking light reveals surface deterioration that midday light hides.
 */
export interface TimeWindow {
  from: string;
  to: string;
}

export interface RiddleAnswer {
  /** Accepted answers, compared after normalisation. */
  accept: string[];
  /** Shown on a wrong answer. A hint, never a penalty. */
  hint: LocalisedText;
}

export interface Quest {
  id: string;
  family: QuestFamily;
  title: LocalisedText;
  description: LocalisedText;
  ne_review: ReviewState;
  site_id: string | null;
  /** For witness quests, the vantage to resurvey. */
  vantage_id?: string;
  merit: number;
  /** Only available inside this window, if set. */
  window?: TimeWindow;
  /** Attention quests: required duration in seconds. */
  duration_s?: number;
  /** Path quests: the centroid to circumambulate, and its radius. */
  centroid?: Coords;
  radius_m?: number;
  /** Observation riddles. */
  riddle?: RiddleAnswer;
}

export type QuestAvailability =
  | 'available'
  | 'too_far'
  | 'outside_window'
  | 'completed'
  | 'rate_limited';

export interface QuestState {
  quest_id: string;
  availability: QuestAvailability;
  /** Metres to the quest's site, when it has one. */
  distance_m: number | null;
  completed_at: Timestamp | null;
}

export interface QuestCompletion {
  id: Uuid;
  user_id: Uuid;
  quest_id: string;
  completed_at: Timestamp;
  /** The capture, report or riddle answer that evidences it. */
  evidence_id: Uuid | null;
  merit_awarded: number;
}

// ---------------------------------------------------------------------------
// Chaityāvalī — the register of monuments witnessed. Not a collection.
// ---------------------------------------------------------------------------

export interface ChaityavaliEntry {
  site_id: string;
  /** First darśana. */
  first_witnessed_at: Timestamp;
  /** Total days on which this site was visited. Never a streak. */
  days_visited: number;
  /** The user's own captures, bound in. */
  capture_ids: Uuid[];
}

// ---------------------------------------------------------------------------
// Dhamma engine (06-DHAMMA-ENGINE §3)
// ---------------------------------------------------------------------------

export interface DhammaRequest {
  question: string;
  lang: Language;
  /** Where the question was asked, if known. Grounds answers in place. */
  site_id?: string;
}

export interface Citation {
  /** e.g. "dn16:6.7.2" — must resolve to a real segment id or it is stripped. */
  segment_id: string;
  sutta_uid: string;
  /** e.g. "DN 16:6.7" — what the chip shows. */
  display: string;
}

export interface Passage {
  segment_id: string;
  pali: string;
  english: string;
  translator: string;
  collection: string;
  licence: string;
}

/** Which degradation tier produced this answer (06-DHAMMA-ENGINE §6). */
export type DhammaTier =
  /** Cloud LLM, citation-validated. */
  | 'generated'
  /** On-device model, citation-validated. */
  | 'on_device'
  /** Raw retrieved passages, zero generation. Can never hallucinate. */
  | 'passages_only';

export interface DhammaResponse {
  /** null when `refused` is true. */
  answer: string | null;
  refused: boolean;
  /** Why it refused — shown on the refusal card. */
  refusal_reason?: 'out_of_scope' | 'below_grounding_threshold' | 'unsafe';
  citations: Citation[];
  passages: Passage[];
  tier: DhammaTier;
}

// ---------------------------------------------------------------------------
// Dashboard and export
// ---------------------------------------------------------------------------

export interface DashboardStats {
  /** Share of active vantages resurveyed within the freshness window. */
  coverage_pct: number;
  vantages_total: number;
  vantages_surveyed: number;
  captures_total: number;
  median_align_score: number;
  reports_by_status: Record<ReportStatus, number>;
  /** Hours from report to custodian acknowledgement. */
  median_ack_hours: number | null;
}

export type ExportFormat = 'csv' | 'geojson' | 'crm';

// ---------------------------------------------------------------------------
// Offline contract (04-ARCHITECTURE §3)
// ---------------------------------------------------------------------------

/**
 * Every POST is queued locally with a client-generated UUID, applied
 * optimistically to local state, and flushed on reconnect. The client id is
 * what makes a retry idempotent — the server must treat a repeat as the same
 * write, not a second one.
 */
export interface QueuedMutation<T = unknown> {
  client_id: Uuid;
  endpoint: string;
  method: 'POST';
  body: T;
  created_at: Timestamp;
  attempts: number;
  last_error: string | null;
}

// ---------------------------------------------------------------------------
// API request/response shapes (04-ARCHITECTURE §3)
// ---------------------------------------------------------------------------

export interface SiteDetailResponse {
  site: Site;
  vantages: Vantage[];
  plates: Plate[];
  timeline: TimelinePhase[];
}

export interface CreateCaptureRequest {
  client_id: Uuid;
  vantage_id: string;
  lat: number;
  lon: number;
  heading_deg: number;
  align_score: number;
  captured_at: Timestamp;
}

export interface CreateCaptureResponse {
  id: Uuid;
  align_score: number;
  series_url: string;
}

export interface CreateReportRequest {
  client_id: Uuid;
  capture_id: Uuid | null;
  site_id: string;
  category: ConditionCategory;
  subtype: ConditionSubtype | null;
  severity: Severity;
  reporter_conf: ReporterConfidence;
  note?: string;
}

export interface CreateReportResponse {
  id: Uuid;
  status: ReportStatus;
  cluster_id: string;
}

export interface CorroborateResponse {
  corroborations: number;
  status: ReportStatus;
}

export interface CreateAllocationRequest {
  client_id: Uuid;
  need_id: string;
  merit_spent: number;
}

export interface CompleteQuestRequest {
  client_id: Uuid;
  evidence_id?: Uuid;
  /** Observation riddles submit their answer here. */
  answer?: string;
}

export interface CompleteQuestResponse {
  merit_awarded: number;
  evidence_id: Uuid | null;
  /** False when the daily cap is already reached — the completion still
   *  records, the merit does not. The app congratulates and stops. */
  merit_capped: boolean;
}

/** Errors are never vague and never apologise (07-DESIGN-SYSTEM §6). */
export interface ApiError {
  error: string;
  detail: string;
}

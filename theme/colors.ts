/**
 * Sākṣī colour tokens.
 *
 * The palette is the spec's dark instrument (07-DESIGN-SYSTEM §2): "the interface
 * is dark because the instrument requires it." Sal-grove greens under shade, with
 * Chunar sandstone for text and a single reserved lapis for alignment.
 *
 * Never hardcode a hex value in a component. Import from `@/theme`.
 *
 * Two naming layers are exported, deliberately:
 *   - the spec names (`ground`, `sand`, `lock`, …) — use these in new code.
 *   - the legacy role names (`background`, `surface`, `alignmentLocked`, …) —
 *     kept so existing components need no change in this palette swap. Values
 *     first, names later: a follow-up pass deprecates the legacy set.
 */

// ── Spec palette (07-DESIGN-SYSTEM §2) ──────────────────────────────────────
const ground = '#0E1512'; // sal-grove shade, desaturated green-black — the page
const ground2 = '#161F1A'; // raised surfaces, cards
const ground3 = '#1F2A23'; // pressed, borders
const sand = '#C9B79A'; // Chunar sandstone, the pillar's own colour
const sand_dim = '#8E836F'; // secondary text
const sand_faint = '#8A8172'; // tertiary, disabled
const brick = '#8A4B39'; // weathered Mauryan brick
const lock = '#3E7CC4'; // alignment achieved. Lapis. Appears nowhere else.
const seek = '#D9A441'; // alignment in progress, amber
const change = '#C25B4E'; // detected change / open condition report
const resolved = '#5E8C6A'; // acknowledged / resolved
const white = '#F2EFE9';

// ── Map surfaces ────────────────────────────────────────────────────────────
// The map needs a vocabulary of its own. Borrowing semantic tokens for terrain
// was actively wrong in two ways: `alignmentLocked` is reserved lapis that must
// mean "locked" and nothing else, and it was painting water; and `surface`
// (a *raised* colour, #161F1A) was painting roads, which on this ground came
// out at 1.10:1 — invisible.
//
// Values are chosen against measured contrast on `ground`, not by eye. Terrain
// is legible without competing with the monuments, which are the content.
const map_water = '#26565A'; // still water, 2.26:1 — a teal, deliberately not lapis
const map_vegetation = '#294034'; // sal grove under shade, 1.65:1 across large fills
const map_landuse = '#243029'; // compound and precinct ground, 1.35:1 as a wash
const map_road = '#4A554C'; // metalled road, 2.38:1
const map_road_major = '#626B5E'; // the approach roads, 3.33:1
const map_path = '#7A6C58'; // packed earth walking path, 3.63:1

export const colors = {
  // Spec names — prefer these in new code.
  ground,
  ground2,
  ground3,
  sand,
  sand_dim,
  sand_faint,
  brick,
  lock,
  seek,
  change,
  white,

  /** Map terrain. Not interchangeable with the semantic tokens above. */
  mapWater: map_water,
  mapVegetation: map_vegetation,
  mapLanduse: map_landuse,
  mapRoad: map_road,
  mapRoadMajor: map_road_major,
  mapPath: map_path,

  // ── Legacy role names, remapped onto the dark palette ─────────────────────
  /** Page ground. */
  background: ground,
  /** Raised cards, sheets, list rows. */
  surface: ground2,
  /** Recessed surfaces, inactive fields, muted blocks. */
  surfaceSecondary: ground3,
  /** Hairlines, dividers, field outlines — a touch lighter than ground3 so it reads. */
  border: '#2A362E',

  /** Primary accent — sandstone. Buttons, active navigation, emphasis. */
  sandstone: sand,
  /** Pressed / hovered sandstone. */
  sandstoneDeep: sand_dim,
  /** Excavated brick. Sparingly, for the deepest accent. */
  earth: brick,

  textPrimary: white,
  textSecondary: sand_dim,
  textMuted: sand_faint,

  /** Alignment in progress — the reticle is searching for the vantage. */
  alignmentSeeking: seek,
  /**
   * Alignment achieved — the device matches the fixed viewpoint.
   *
   * RESERVED. This lapis means "locked" and nothing else. Never a generic
   * primary, link, brand, or the manual "match by eye" escape hatch. Spending it
   * anywhere else destroys its meaning (07-DESIGN-SYSTEM §2 discipline rule).
   */
  alignmentLocked: lock,

  /** A condition observation that is open / unresolved. Not an error colour. */
  openCondition: change,
  /** A condition observation that has been resolved. */
  resolved,
} as const;

export type ColorToken = keyof typeof colors;

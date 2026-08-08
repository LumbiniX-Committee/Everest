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
const sand_faint = '#5A544A'; // tertiary, disabled
const brick = '#8A4B39'; // weathered Mauryan brick
const lock = '#3E7CC4'; // alignment achieved. Lapis. Appears nowhere else.
const seek = '#D9A441'; // alignment in progress, amber
const change = '#C25B4E'; // detected change / open condition report
const resolved = '#5E8C6A'; // acknowledged / resolved
const white = '#F2EFE9';

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

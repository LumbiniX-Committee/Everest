/**
 * app/src/design/tokens.ts — the palette and spacing scale.
 *
 * Source: 07-DESIGN-SYSTEM §2, verbatim. These are the actual colours of
 * Lumbini — sal-grove shade, Chunar sandstone, weathered Mauryan brick, the
 * still water of the Puskarini — not the AI-default cream-and-terracotta.
 *
 * Pure data, no react-native import, so it typechecks and is testable before
 * B's native build lands. Lane A's screens import from here.
 */

export const color = {
  // Ground — sal-grove shade, a desaturated green-black
  ground: '#0E1512',
  ground2: '#161F1A', // raised surfaces, cards
  ground3: '#1F2A23', // pressed, borders

  // Primary — Chunar sandstone, the pillar's own colour
  sand: '#C9B79A',
  sand_dim: '#8E836F', // secondary text
  sand_faint: '#5A544A', // tertiary, disabled

  // Structure — weathered Mauryan brick
  brick: '#8A4B39',

  // Signal — each used for exactly one thing
  lock: '#3E7CC4', // alignment achieved. Lapis. Appears nowhere else.
  seek: '#D9A441', // alignment in progress, amber
  change: '#C25B4E', // detected change / open condition report
  resolved: '#5E8C6A', // acknowledged / resolved

  // Pure
  white: '#F2EFE9',
} as const;

export type ColorToken = keyof typeof color;

/**
 * DISCIPLINE RULES — enforced by review and by tools/lint-vocab.mjs's sibling
 * intent. Breaking these is how the design dies by a thousand cuts.
 *
 *  - `lock` (lapis) appears ONLY when alignment succeeds. Never a button, never
 *    a link, never decoration. Its whole meaning is "you are standing in the
 *    right place, facing the right way." Spend it elsewhere and it means nothing.
 *  - `change` appears ONLY on open conditions. It is not a generic error colour.
 *  - `resolved` appears ONLY on acknowledged / resolved conditions.
 *  - Anything not carrying a signal is `sand` or `sand_dim` on `ground`.
 */

/** 8-pt spacing scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

/** Hairline borders read as precision — the instrument, not the brochure. */
export const border = {
  hairline: 1,
  thick: 2,
} as const;

/** Ghost overlay default opacity in capture mode (07 §5). Pinch-adjustable. */
export const GHOST_OPACITY = 0.35;

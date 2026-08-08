/**
 * Corner radii.
 *
 * The visual metaphor is a measuring instrument cut from stone — corners are
 * softened, never rounded into pills, except for genuinely circular controls.
 */
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  /** Circles only: the reticle, capture control, avatar. */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;

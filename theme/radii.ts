/**
 * Corner radii.
 *
 * Soft and generous, echoing the lotus petal in the mark, without turning cards
 * into pills.
 */
export const radii = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 30,
  /** Pills and circles. */
  full: 999,
} as const;

export type RadiusToken = keyof typeof radii;

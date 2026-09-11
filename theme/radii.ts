/**
 * Corner radii.
 *
 * Cards stay clearly rectangular while controls remain soft enough for touch.
 */
export const radii = {
  none: 0,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  /** Pills and circles. */
  full: 999,
} as const;

export type RadiusToken = keyof typeof radii;

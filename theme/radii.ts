/**
 * Corner radii.
 *
 * Restrained: controls 8–12, cards and sheets 16. Larger radii made every card
 * look like a toy; one quiet curve across the app reads as one designed system.
 */
export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  /** Pills and circles. */
  full: 999,
} as const;

export type RadiusToken = keyof typeof radii;

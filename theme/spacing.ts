/**
 * Spacing scale, 4pt based.
 *
 * Sākṣī screens are quiet: prefer the larger step when unsure. Onboarding in
 * particular is built from `xl` and up.
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  /** Full-bleed screen gutter. */
  gutter: 24,
} as const;

export type SpacingToken = keyof typeof spacing;

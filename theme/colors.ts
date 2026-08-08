/**
 * Sākṣī colour tokens.
 *
 * The palette is Lumbini stone under daylight: weathered white, sandstone,
 * earth. Nothing here is decorative — each token has a job.
 *
 * Never hardcode a hex value in a component. Import from `@/theme`.
 */
export const colors = {
  /** Page ground. Pale, warm, slightly dusty. */
  background: '#F4F1E8',
  /** Raised cards, sheets, list rows. */
  surface: '#FFFFFF',
  /** Recessed surfaces, inactive fields, muted blocks. */
  surfaceSecondary: '#E9E6DC',
  /** Hairlines, dividers, field outlines. */
  border: '#D8D2C5',

  /** Primary accent — sandstone. Buttons, active navigation, emphasis. */
  sandstone: '#B79B72',
  /** Pressed / hovered sandstone, and sandstone text on pale ground. */
  sandstoneDeep: '#8E7657',
  /** Excavated earth. Sparingly, for the deepest accent. */
  earth: '#8A5A45',

  textPrimary: '#252A27',
  textSecondary: '#62645E',
  textMuted: '#8D8D84',

  /** Alignment in progress — the reticle is searching for the vantage. */
  alignmentSeeking: '#C89432',
  /**
   * Alignment achieved — the device matches the fixed viewpoint.
   *
   * RESERVED. This blue means "locked" and nothing else. Do not use it as a
   * generic primary, link, or brand colour.
   */
  alignmentLocked: '#557FA5',

  /** A condition observation that is open / unresolved. */
  openCondition: '#A95C4E',
  /** A condition observation that has been resolved. */
  resolved: '#63816B',
} as const;

export type ColorToken = keyof typeof colors;

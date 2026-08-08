export { colors, type ColorToken } from './colors';
export { spacing, type SpacingToken } from './spacing';
export { radii, type RadiusToken } from './radii';
export {
  font,
  fontFamilies,
  text,
  typography,
  setFontsAvailable,
  areFontsAvailable,
  type FontRole,
  type FontWeightName,
  type TypographyVariant,
} from './typography';
export { useAppFonts } from './fonts';
export { layers } from './layers';

import { colors } from './colors';
import { spacing } from './spacing';
import { radii } from './radii';

/** Convenience bundle for anything that wants the whole set at once. */
export const theme = { colors, spacing, radii } as const;
export type Theme = typeof theme;

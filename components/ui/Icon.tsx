// The family directly, not through the package barrel: the barrel pulls in every
// icon family and every one of their fonts. One family, one font file.
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors } from '@/theme';

/**
 * The only icon in the app.
 *
 * Icons used to be emoji. Emoji are rendered by the *system* emoji font, which
 * means they arrive pre-coloured — a blue gear, a yellow lotus — and they cannot
 * be tinted, so they never sit inside the palette. They also differ per vendor:
 * the same glyph is a different drawing on Samsung, Pixel and iOS. For chrome
 * that has to read as one designed surface, that is disqualifying.
 *
 * This wrapper exists so no feature file imports the icon library directly. That
 * keeps the swap to another set a one-file change, and it makes `colors` the
 * default tint rather than something each call site has to remember.
 *
 * Typographic marks — `‹ › ✕ ✦ ✓` — are *not* icons and stay as text. They are
 * monochrome, they inherit colour, and they are set in the same face as the text
 * beside them.
 */

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type IconProps = {
  name: IconName;
  size?: number;
  /** Defaults to the teal the rest of the interactive chrome is drawn in. */
  color?: string;
  style?: React.ComponentProps<typeof MaterialCommunityIcons>['style'];
};

export function Icon({ name, size = 22, color = colors.primary, style }: IconProps) {
  return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
}

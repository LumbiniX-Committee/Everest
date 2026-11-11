import { Image, type ImageStyle, type StyleProp } from 'react-native';

/**
 * The app's four original characters. None is a religious figure: deities and
 * sacred objects are described in words, never drawn as characters.
 *
 * - guide: a licensed local guide, on Explore.
 * - porter: a trekking porter (a porter, not "a Sherpa": Sherpa is a people).
 * - monkey: a rhesus macaque of the temple steps, for empty and tip states.
 * - woodcarver: a Newar woodcarver at a lattice window, beside the 3D models.
 *
 * Sources and art: brand/mascots/*.svg, exported to assets/mascots/.
 */
const SOURCES = {
  guide: require('../../assets/mascots/guide.webp'),
  porter: require('../../assets/mascots/porter.webp'),
  monkey: require('../../assets/mascots/monkey.webp'),
  woodcarver: require('../../assets/mascots/woodcarver.webp'),
} as const;

export type MascotName = keyof typeof SOURCES;

/** Width : height of every mascot drawing. */
const RATIO = 240 / 320;

export function Mascot({ name, height, style }: { name: MascotName; height: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={SOURCES[name]}
      style={[{ height, width: height * RATIO }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      // Decorative: the screen around it already says what it shows.
      accessible={false}
    />
  );
}

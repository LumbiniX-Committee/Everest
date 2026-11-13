import type { ColorTheme } from '@/types';

/**
 * Saksi colour tokens: "Lumbini at first light".
 *
 * Every hue comes from the place. Jade is the Puskarini pond, marigold is the
 * sayapatri garland, maroon is a monk's robe, and the dusk ground is the
 * Himalayan sky after sunset.
 *
 * Both palettes expose the same semantic roles. Components name the role they
 * need, while the boot entry selects a palette before route modules create
 * their static StyleSheets. That ordering keeps the switch consistent across
 * native and web without duplicating component styles.
 *
 * Text on a filled surface must use its paired `on*` role. `primary` is dark in
 * the morning palette and bright at dusk, so no fixed text colour can sit on it
 * in both. tests/native/theme-contrast.test.ts holds these pairs to WCAG AA.
 *
 * The persisted theme keys stay `navy` and `white` so existing preferences keep
 * working. Visitors see them as Himalayan dusk and Lumbini morning.
 */

/** Colours that mean the same thing in both palettes. */
const shared = {
  /** Sayapatri marigold. A fill, never text on a light ground. */
  accent: '#F7A823',
  accentSoft: 'rgba(247, 168, 35, 0.22)',
  onAccent: '#241703',
  /** Dark in both palettes, for captions and controls laid over photographs. */
  scrim: 'rgba(8, 31, 28, 0.84)',
  scrimStrong: 'rgba(6, 24, 22, 0.9)',
  scrimSoft: 'rgba(6, 24, 22, 0.14)',
  onScrim: '#FFFFFF',
  onScrimBorder: 'rgba(255, 255, 255, 0.26)',
} as const;

export const navyColors = {
  ...shared,
  onPrimary: '#241703',
  /** Laid over the Dhamma illustration so white text stays readable on it. */
  heroVeil: 'rgba(7, 22, 25, 0.72)',

  backgroundDeep: '#071619',
  surfaceRaised: '#183D42',
  surfaceSelected: 'rgba(247, 168, 35, 0.12)',
  primary: '#F7B32B',
  primaryPressed: '#DE9A17',
  primarySoft: 'rgba(247, 179, 43, 0.17)',
  borderStrong: 'rgba(247, 179, 43, 0.58)',
  warning: '#F7B32B',
  navigationRoute: '#5AA9F8',
  error: '#F49384',
  overlay: 'rgba(4, 16, 18, 0.68)',
  shadow: '#030E10',
  heritageGold: '#F7B32B',

  ground: '#0B2024',
  ground2: '#102B30',
  ground3: '#183D42',
  sand: '#F7B32B',
  sand_dim: '#DE9A17',
  sand_faint: '#93ACA5',
  brick: '#D0916C',
  lock: '#62D3B4',
  seek: '#F7B32B',
  change: '#F49384',
  white: '#F5F8F3',

  mapBase: '#0C2226',
  mapWater: '#0F4C5A',
  mapVegetation: '#134036',
  mapPark: '#185240',
  mapLanduse: '#113130',
  mapRoad: '#3D5C60',
  mapRoadCasing: '#1D3B3F',
  mapPath: '#DBA743',
  mapBuilding: '#1C3B40',
  mapBuildingRoof: '#2B5054',
  mapLabel: '#E4EFEA',
  mapLabelHalo: '#0B2024',

  background: '#0B2024',
  surface: '#102B30',
  surfaceSecondary: '#183D42',
  border: 'rgba(172, 208, 198, 0.25)',
  sandstone: '#F7B32B',
  sandstoneDeep: '#F7B32B',
  earth: '#D0916C',
  textPrimary: '#F5F8F3',
  textSecondary: '#BACDC7',
  textMuted: '#93ACA5',
  alignmentSeeking: '#F7B32B',
  alignmentLocked: '#62D3B4',
  openCondition: '#F49384',
  resolved: '#73D29B',
} as const;

export type ColorPalette = { [K in keyof typeof navyColors]: string };

/** The default palette: bright, cool morning light over the Sacred Garden. */
export const whiteColors = {
  ...shared,
  onPrimary: '#FFFFFF',
  /** Lifts the Dhamma illustration behind dark text, rather than muddying it. */
  heroVeil: 'rgba(245, 248, 243, 0.42)',

  backgroundDeep: '#0D2B27',
  surfaceRaised: '#FFFFFF',
  surfaceSelected: 'rgba(14, 110, 98, 0.1)',
  primary: '#0E6E62',
  primaryPressed: '#0A564C',
  primarySoft: 'rgba(14, 110, 98, 0.14)',
  borderStrong: '#0E6E62',
  warning: '#945900',
  navigationRoute: '#1F6FD6',
  error: '#B3261E',
  overlay: 'rgba(13, 43, 39, 0.56)',
  shadow: '#0D2B27',
  heritageGold: '#945900',

  ground: '#F5F8F3',
  ground2: '#FFFFFF',
  ground3: '#E6EFE8',
  sand: '#0E6E62',
  sand_dim: '#0A564C',
  sand_faint: '#55706A',
  brick: '#8C3B3F',
  lock: '#0E6E62',
  seek: '#945900',
  change: '#B3261E',
  white: '#FFFFFF',

  // Read off satellite views of the valley: warm grey-tan ground, deep tree
  // green, grey-blue water, pale concrete streets and brick-and-concrete roofs.
  mapBase: '#E4DFD3',
  mapWater: '#86AEB8',
  mapVegetation: '#9CBB88',
  mapPark: '#AFCB9C',
  mapLanduse: '#DCD5C6',
  mapRoad: '#F6F3EC',
  mapRoadCasing: '#C9C1B1',
  mapPath: '#E29A1F',
  mapBuilding: '#CDBDA6',
  mapBuildingRoof: '#BBA88E',
  mapLabel: '#24423C',
  mapLabelHalo: '#F5F8F3',

  background: '#F5F8F3',
  surface: '#FFFFFF',
  surfaceSecondary: '#E6EFE8',
  border: '#CFDBD3',
  sandstone: '#0E6E62',
  sandstoneDeep: '#0A564C',
  earth: '#8C3B3F',
  textPrimary: '#12302B',
  textSecondary: '#3B5851',
  textMuted: '#55706A',
  alignmentSeeking: '#945900',
  alignmentLocked: '#0E6E62',
  openCondition: '#B3261E',
  resolved: '#1B7246',
} satisfies ColorPalette;

/**
 * Sunlight: the morning palette pushed for reading outdoors.
 *
 * A phone screen in midday sun loses most of its contrast to reflection, so
 * primary text here is near black on white (well over 7:1, the target from
 * the design research, against WCAG AA's 4.5:1 floor), secondary text and
 * borders are darker, and accents deepen so they still read as colour.
 */
export const outdoorColors = {
  ...whiteColors,
  primary: '#0A564C',
  primaryPressed: '#06423A',
  borderStrong: '#06423A',
  warning: '#7A4800',
  error: '#9A1F18',
  heritageGold: '#7A4800',
  ground: '#FFFFFF',
  ground3: '#E3EBE5',
  sand: '#0A564C',
  sand_dim: '#06423A',
  sand_faint: '#33473F',
  lock: '#0A564C',
  seek: '#7A4800',
  change: '#9A1F18',
  mapLabel: '#0E1F1B',
  mapLabelHalo: '#FFFFFF',
  background: '#FFFFFF',
  surfaceSecondary: '#E3EBE5',
  border: '#8FA39A',
  sandstone: '#0A564C',
  sandstoneDeep: '#06423A',
  textPrimary: '#05110E',
  textSecondary: '#1E322D',
  textMuted: '#33473F',
  alignmentSeeking: '#7A4800',
  alignmentLocked: '#0A564C',
  openCondition: '#9A1F18',
  resolved: '#145A36',
} satisfies ColorPalette;

/**
 * The five colours of a Himalayan prayer flag, in their traditional order: sky,
 * air, fire, water, earth. Celebration uses these instead of an arbitrary
 * rainbow. They are decoration only and never carry text.
 */
export const prayerFlags = ['#2F6FD0', '#FFFFFF', '#D8412F', '#1F9D6B', '#F7C325'] as const;

const palettes: Record<ColorTheme, ColorPalette> = {
  navy: navyColors,
  white: whiteColors,
  outdoor: outdoorColors,
};

let initialColorTheme: ColorTheme = 'white';

/**
 * A stable object is intentional: the theme barrel and any early importer keep
 * the same reference while boot replaces its values before screens load.
 */
export const colors: ColorPalette = { ...whiteColors };

export function setInitialColorTheme(theme: ColorTheme): void {
  initialColorTheme = theme;
  Object.assign(colors, palettes[theme]);
}

export function getInitialColorTheme(): ColorTheme {
  return initialColorTheme;
}

export type ColorToken = keyof ColorPalette;

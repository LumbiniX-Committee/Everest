import type { ColorTheme } from '@/types';

/**
 * Saksi colour tokens.
 *
 * Both palettes expose the same semantic roles. Components name the role they
 * need, while the boot entry selects navy or white before route modules create
 * their static StyleSheets. That ordering keeps the switch consistent across
 * native and web without duplicating component styles.
 */
export const navyColors = {
  backgroundDeep: '#051521',
  surfaceRaised: '#102B3D',
  surfaceSelected: 'rgba(77, 198, 194, 0.10)',
  primary: '#4DC6C2',
  primaryPressed: '#38AAA8',
  primarySoft: 'rgba(77, 198, 194, 0.16)',
  borderStrong: 'rgba(77, 198, 194, 0.55)',
  warning: '#F0B23B',
  error: '#E16F6F',
  overlay: 'rgba(3, 14, 23, 0.66)',
  shadow: '#020B12',
  heritageGold: '#C6A66A',

  ground: '#071A2A',
  ground2: '#0C2234',
  ground3: '#102B3D',
  sand: '#4DC6C2',
  sand_dim: '#38AAA8',
  sand_faint: '#7890A2',
  brick: '#9A6D4E',
  lock: '#4DC6C2',
  seek: '#F0B23B',
  change: '#E16F6F',
  white: '#F4F7FA',

  mapBase: '#071B2B',
  mapWater: '#0A4050',
  mapVegetation: '#103A3B',
  mapPark: '#164541',
  mapLanduse: '#102B38',
  mapRoad: '#3A5267',
  mapRoadCasing: '#1D3549',
  mapPath: '#3F7775',
  mapBuilding: '#193447',
  mapBuildingRoof: '#27465A',
  mapLabel: '#DCE6ED',
  mapLabelHalo: '#071A2A',

  background: '#071A2A',
  surface: '#0C2234',
  surfaceSecondary: '#102B3D',
  border: 'rgba(126, 169, 190, 0.28)',
  sandstone: '#4DC6C2',
  sandstoneDeep: '#38AAA8',
  earth: '#9A6D4E',
  textPrimary: '#F4F7FA',
  textSecondary: '#A7B8C5',
  textMuted: '#7890A2',
  alignmentSeeking: '#4DC6C2',
  alignmentLocked: '#4DC6C2',
  openCondition: '#E16F6F',
  resolved: '#64A67B',
} as const;

export type ColorPalette = { [K in keyof typeof navyColors]: string };

/** Main's daylight palette, extended with the roles used by the navy UI. */
export const whiteColors = {
  backgroundDeep: '#252A27',
  surfaceRaised: '#FFFFFF',
  surfaceSelected: 'rgba(183, 155, 114, 0.14)',
  primary: '#B79B72',
  primaryPressed: '#8E7657',
  primarySoft: 'rgba(183, 155, 114, 0.18)',
  borderStrong: '#B79B72',
  warning: '#A9761D',
  error: '#A8443A',
  overlay: 'rgba(37, 42, 39, 0.58)',
  shadow: '#252A27',
  heritageGold: '#A9761D',

  ground: '#F5F3EE',
  ground2: '#FFFFFF',
  ground3: '#E8E5DD',
  sand: '#B79B72',
  sand_dim: '#8E7657',
  sand_faint: '#6E7069',
  brick: '#8A5A45',
  lock: '#3E7CC4',
  seek: '#A9761D',
  change: '#A8443A',
  white: '#FFFFFF',

  mapBase: '#F2EFE7',
  mapWater: '#8FBBD9',
  mapVegetation: '#A9C99A',
  mapPark: '#BBD6A8',
  mapLanduse: '#E7DFCC',
  mapRoad: '#FFFFFF',
  mapRoadCasing: '#D8CBB2',
  mapPath: '#C08A4E',
  mapBuilding: '#DDCFB6',
  mapBuildingRoof: '#CBB99A',
  mapLabel: '#4A4438',
  mapLabelHalo: '#F7F4EC',

  background: '#F5F3EE',
  surface: '#FFFFFF',
  surfaceSecondary: '#E8E5DD',
  border: '#D6D1C6',
  sandstone: '#B79B72',
  sandstoneDeep: '#8E7657',
  earth: '#8A5A45',
  textPrimary: '#252A27',
  textSecondary: '#5A5C56',
  textMuted: '#6E7069',
  alignmentSeeking: '#A9761D',
  alignmentLocked: '#3E7CC4',
  openCondition: '#A8443A',
  resolved: '#477052',
} satisfies ColorPalette;

const palettes: Record<ColorTheme, ColorPalette> = {
  navy: navyColors,
  white: whiteColors,
};

let initialColorTheme: ColorTheme = 'navy';

/**
 * A stable object is intentional: the theme barrel and any early importer keep
 * the same reference while boot replaces its values before screens load.
 */
export const colors: ColorPalette = { ...navyColors };

export function setInitialColorTheme(theme: ColorTheme): void {
  initialColorTheme = theme;
  Object.assign(colors, palettes[theme]);
}

export function getInitialColorTheme(): ColorTheme {
  return initialColorTheme;
}

export type ColorToken = keyof ColorPalette;

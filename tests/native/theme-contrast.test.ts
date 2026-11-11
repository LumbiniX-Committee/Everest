import { navyColors, outdoorColors, prayerFlags, whiteColors, type ColorPalette } from '@/theme/colors';

/** WCAG relative luminance for a #RRGGBB colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [hi, lo] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/** Flattens a translucent scrim onto the darkest it could plausibly sit over: pure white. */
function worstCaseScrim(rgba: string): string {
  const [r, g, b, a] = rgba.match(/[\d.]+/g)!.map(Number);
  const mix = (c: number) => Math.round(c * a + 255 * (1 - a)).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

/** Foreground and background roles that really do appear together. */
const TEXT_PAIRS: [keyof ColorPalette, keyof ColorPalette][] = [
  ['textPrimary', 'background'],
  ['textPrimary', 'surface'],
  ['textPrimary', 'surfaceSecondary'],
  ['textSecondary', 'background'],
  ['textSecondary', 'surface'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['onPrimary', 'primary'],
  ['onPrimary', 'primaryPressed'],
  ['onAccent', 'accent'],
  // The Explore hero: white and marigold type on the deep jade card.
  ['onScrim', 'backgroundDeep'],
  ['accent', 'backgroundDeep'],
  ['sandstoneDeep', 'background'],
  ['sandstoneDeep', 'surface'],
  ['primary', 'surface'],
  ['alignmentLocked', 'surface'],
  ['alignmentSeeking', 'surface'],
  ['warning', 'surface'],
  ['error', 'surface'],
  ['openCondition', 'surface'],
  ['resolved', 'surface'],
];

describe.each([
  ['Lumbini morning', whiteColors],
  ['Himalayan dusk', navyColors],
  ['Sunlight', outdoorColors],
] as const)('%s palette', (_name, palette: ColorPalette) => {
  it.each(TEXT_PAIRS)('%s on %s reaches AA for text', (foreground, background) => {
    expect(contrast(palette[foreground], palette[background])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps captions readable over the brightest photograph', () => {
    expect(contrast(palette.onScrim, worstCaseScrim(palette.scrim))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.accent, worstCaseScrim(palette.scrim))).toBeGreaterThanOrEqual(4.5);
  });

  it('exposes every role the other palette has', () => {
    expect(Object.keys(palette).sort()).toEqual(Object.keys(navyColors).sort());
  });
});

it('carries all five prayer flag colours', () => {
  expect(new Set(prayerFlags).size).toBe(5);
});

it('the Sunlight palette holds reading text to 7:1, for use in direct sun', () => {
  for (const ground of ['background', 'surface', 'surfaceSecondary'] as const) {
    expect(contrast(outdoorColors.textPrimary, outdoorColors[ground])).toBeGreaterThanOrEqual(7);
    expect(contrast(outdoorColors.textSecondary, outdoorColors[ground])).toBeGreaterThanOrEqual(7);
  }
});

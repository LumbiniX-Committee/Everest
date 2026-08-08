import { Platform, type TextStyle } from 'react-native';

/**
 * Typography abstraction.
 *
 * Three families carry the whole app:
 *   display — Anek. Headings, heritage site names, Nepali/Devanagari text.
 *   body    — IBM Plex Sans. UI, navigation, descriptions, buttons.
 *   mono    — IBM Plex Mono. Coordinates, distances, timestamps, alignment values.
 *
 * The font files are not vendored yet. Until they are, family names resolve to
 * the platform default — that is the intended fallback, not a bug. Drop the
 * .ttf files into `assets/fonts/`, register them in `theme/fonts.ts`, and every
 * component picks them up with no edits.
 *
 * Styles are resolved lazily via `text()` rather than baked into a constant, so
 * a screen rendered after the fonts load gets the real families.
 */

export type FontRole = 'display' | 'body' | 'mono';
export type FontWeightName = 'regular' | 'medium' | 'semibold';

/** Family names as registered with `useFonts`. See `theme/fonts.ts`. */
export const fontFamilies: Record<FontRole, Record<FontWeightName, string>> = {
  display: {
    regular: 'Anek-Regular',
    medium: 'Anek-Medium',
    semibold: 'Anek-SemiBold',
  },
  body: {
    regular: 'IBMPlexSans-Regular',
    medium: 'IBMPlexSans-Medium',
    semibold: 'IBMPlexSans-SemiBold',
  },
  mono: {
    regular: 'IBMPlexMono-Regular',
    medium: 'IBMPlexMono-Medium',
    semibold: 'IBMPlexMono-SemiBold',
  },
};

/**
 * Flipped by `theme/fonts.ts` once the real files are bundled and loaded. While
 * false we must not name a family the native layer cannot resolve — Android
 * renders a blank glyph run rather than falling back gracefully.
 */
let fontsAvailable = false;

export function setFontsAvailable(value: boolean) {
  fontsAvailable = value;
}

export function areFontsAvailable() {
  return fontsAvailable;
}

function fallbackStyle(role: FontRole, weight: FontWeightName): TextStyle {
  const fontWeight: TextStyle['fontWeight'] =
    weight === 'regular' ? '400' : weight === 'medium' ? '500' : '600';

  if (role === 'mono') {
    return {
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      fontWeight,
    };
  }
  return { fontWeight };
}

/**
 * The only sanctioned way to ask for a font. Composes:
 * `{ ...font('display', 'medium'), fontSize: 32 }`.
 */
export function font(role: FontRole, weight: FontWeightName = 'regular'): TextStyle {
  if (!fontsAvailable) return fallbackStyle(role, weight);
  return { fontFamily: fontFamilies[role][weight] };
}

type ScaleEntry = {
  role: FontRole;
  weight: FontWeightName;
  fontSize: number;
  lineHeight?: number;
  letterSpacing?: number;
};

/** Named text roles. Components reach for these, never for raw sizes. */
const scale = {
  /** The wordmark and first-run titles. Wide tracking, quiet weight. */
  display: { role: 'display', weight: 'medium', fontSize: 34, lineHeight: 42, letterSpacing: 2 },
  /** Screen titles and heritage site names. */
  title: { role: 'display', weight: 'medium', fontSize: 26, lineHeight: 34, letterSpacing: 0.4 },
  /** Section heads inside a screen. */
  heading: { role: 'body', weight: 'semibold', fontSize: 18, lineHeight: 26 },
  body: { role: 'body', weight: 'regular', fontSize: 16, lineHeight: 25 },
  /** Onboarding prose — large type, large whitespace. */
  bodyLarge: { role: 'body', weight: 'regular', fontSize: 20, lineHeight: 31 },
  caption: { role: 'body', weight: 'regular', fontSize: 13, lineHeight: 19 },
  button: { role: 'body', weight: 'medium', fontSize: 16, letterSpacing: 0.3 },
  /** Field labels and nav labels. Set uppercase at the call site. */
  label: { role: 'body', weight: 'medium', fontSize: 11, lineHeight: 14, letterSpacing: 1.4 },
  /** Coordinates, bearings, distances, timestamps. Never prose. */
  mono: { role: 'mono', weight: 'regular', fontSize: 13, lineHeight: 19, letterSpacing: 0.2 },
  monoLarge: { role: 'mono', weight: 'medium', fontSize: 22, lineHeight: 28, letterSpacing: 0.5 },
} as const satisfies Record<string, ScaleEntry>;

export type TypographyVariant = keyof typeof scale;

/** Resolve a named variant to a style. Call during render, not at module scope. */
export function text(variant: TypographyVariant): TextStyle {
  const { role, weight, ...rest } = scale[variant];
  return { ...font(role, weight), ...rest };
}

export const typography = { scale, text, font } as const;

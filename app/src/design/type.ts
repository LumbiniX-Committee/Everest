/**
 * app/src/design/type.ts — the seven type roles.
 *
 * Source: 07-DESIGN-SYSTEM §3. Three faces, all open-source, all with proper
 * Devanagari cuts, because Nepali is a first-class language here:
 *   - Display: Anek Devanagari / Anek Latin (Ek Type) — one design system for
 *     both scripts, not a Latin face with a bolted-on Devanagari.
 *   - Body:    IBM Plex Sans + IBM Plex Sans Devanagari.
 *   - Data:    IBM Plex Mono — coordinates, headings, align scores, segment ids.
 *
 * Font files go in app/assets/fonts/ (see fontFiles below); downloading and
 * registering them with expo-font is a lane-B/asset step. Pure data here.
 */

export interface TypeRole {
  family: string;
  weight: number;
  /** px */
  size: number;
  /** line height, px */
  lh: number;
  /** letter spacing, px */
  ls?: number;
  transform?: 'uppercase';
}

export const type = {
  /** Site names and section heads only. Never below 20px, never in prose. */
  display: { family: 'AnekDevanagari', weight: 600, size: 28, lh: 34, ls: -0.4 },
  title: { family: 'AnekDevanagari', weight: 500, size: 20, lh: 26 },
  body: { family: 'IBMPlexSans', weight: 400, size: 16, lh: 24 },
  bodySm: { family: 'IBMPlexSans', weight: 400, size: 14, lh: 20 },
  label: { family: 'IBMPlexSans', weight: 500, size: 12, lh: 16, ls: 0.6, transform: 'uppercase' },
  /** Data face — anything a machine produced. */
  data: { family: 'IBMPlexMono', weight: 400, size: 13, lh: 18 },
  /** Alignment score, merit balance — the numbers that are the product. */
  dataLg: { family: 'IBMPlexMono', weight: 500, size: 22, lh: 26 },
} as const satisfies Record<string, TypeRole>;

export type TypeToken = keyof typeof type;

/**
 * RULES (07 §3):
 *  - Display face never below 20px, never in running prose.
 *  - Data face for anything a machine produced.
 *  - Sentence case throughout — no Title Case Headings.
 *  - Pali diacritics must render: test Mahāparinibbāna, paṭiccasamuppāda,
 *    appamāda before shipping.
 */

/** The font files to bundle under app/assets/fonts/ and register with expo-font. */
export const fontFiles = {
  AnekDevanagari: 'AnekDevanagari-VariableFont.ttf',
  IBMPlexSans: 'IBMPlexSans-Regular.ttf',
  IBMPlexSansMedium: 'IBMPlexSans-Medium.ttf',
  IBMPlexSansDevanagari: 'IBMPlexSansDevanagari-Regular.ttf',
  IBMPlexMono: 'IBMPlexMono-Regular.ttf',
  IBMPlexMonoMedium: 'IBMPlexMono-Medium.ttf',
} as const;

import type { EvidenceTier } from '@/types';

/**
 * Plate and "now" image registry.
 *
 * Metro's `require()` needs a statically-analysable literal path — you cannot
 * `require(someVariable)` — so every bundled image is enumerated here by hand.
 *
 * GENERATED SHAPE: this file is hand-written for Phase 1, but its shape is the
 * exact output `tools/gen-data.mjs` will emit in Phase 3 from `seed/plates.json`
 * and `seed/now-images.json`. Keep the shape stable so the swap is mechanical.
 *
 * Charter #6: every entry in `plateMeta` carries an `evidenceTier`. The four
 * tiers are shown in the UI so a reconstruction is never mistaken for a
 * photograph — that transparency is the product.
 */

/** Historical plates, keyed by plate id. Only ids with a file on disk appear. */
export const plateImages = {
  'ashokan-pillar.1899-south': require('../assets/plates/ashokan-pillar.1899-south.webp'),
  'ashokan-pillar.pre1896-jungle': require('../assets/plates/ashokan-pillar.pre1896-jungle.webp'),
  'ashokan-pillar.rummindei-inscription': require('../assets/plates/ashokan-pillar.rummindei-inscription.webp'),
  'maya-devi-temple.mukherji-1899-plan': require('../assets/plates/maya-devi-temple.mukherji-1899-plan.webp'),
  'lumbini.mukherji-1899-general-plan': require('../assets/plates/lumbini.mukherji-1899-general-plan.webp'),
  'puskarini.earthen-pond-pre1930s': require('../assets/plates/puskarini.earthen-pond-pre1930s.webp'),
} as const;

export type PlateId = keyof typeof plateImages;

/**
 * Modern "now" photographs, keyed by canonical seed site id. Licence-clean
 * CC BY-SA 4.0, credited below.
 */
export const nowImages: Record<string, number> = {
  'ashokan-pillar': require('../assets/plates/now.ashokan-pillar.webp'),
  'maya-devi-temple': require('../assets/plates/now.maya-devi-temple.webp'),
  'puskarini': require('../assets/plates/now.puskarini.webp'),
};

export type PlateMeta = {
  evidenceTier: EvidenceTier;
  caption: string;
  attribution: string;
  year?: number;
};

export const plateMeta: Record<PlateId, PlateMeta> = {
  'ashokan-pillar.1899-south': {
    evidenceTier: 'historical_photograph',
    caption: 'Rummindei (Lumbini): view of the ruins from the south, 1899.',
    attribution: 'P. C. Mukherji, Archaeological Survey of India, December 1899',
    year: 1899,
  },
  'ashokan-pillar.pre1896-jungle': {
    evidenceTier: 'conditioned_reconstruction',
    caption: 'Before rediscovery: the pillar as a jungle-covered mound, pre-1896.',
    attribution: "Sākṣī reconstruction, conditioned on Mukherji's 1899 photograph",
  },
  'ashokan-pillar.rummindei-inscription': {
    evidenceTier: 'survey_drawing',
    caption: 'Facsimile of the Rummindei Pillar Edict in Brahmi.',
    attribution: 'P. C. Mukherji (drawn by Sohan Lall), ASI, 1901',
    year: 1901,
  },
  'maya-devi-temple.mukherji-1899-plan': {
    evidenceTier: 'survey_drawing',
    caption: 'Measured ground plan of the Maya Devi Temple, Mukherji survey.',
    attribution: 'P. C. Mukherji (drawn by Sohan Lall), ASI, 1901',
    year: 1901,
  },
  'lumbini.mukherji-1899-general-plan': {
    evidenceTier: 'survey_drawing',
    caption: 'General plan of the ruins at Rummin-dei, with pillar, temple and tank.',
    attribution: 'P. C. Mukherji (drawn by Sohan Lall), ASI, 1901',
    year: 1901,
  },
  'puskarini.earthen-pond-pre1930s': {
    evidenceTier: 'conditioned_reconstruction',
    caption: 'Before the 1930s: the Puskarini as a natural earthen oval pond.',
    attribution: 'Sākṣī reconstruction, conditioned on a modern CC BY-SA photograph',
  },
};

/** The modern reference photograph for a site, if one is bundled. */
export function nowImageForSite(siteId: string): number | undefined {
  return nowImages[siteId];
}

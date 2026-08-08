import type { HistoricalImage } from '@/types';

import { plateImages, plateMeta } from '../plates';

/**
 * Historical imagery for Then / Now.
 *
 * These records now carry real, licence-clean images — Mukherji's 1899
 * photographs and survey drawings (public domain) and Sākṣī reconstructions
 * conditioned on cited sources. Each declares its `evidenceTier` (Charter #6),
 * which the comparison renders so a reconstruction is never read as a
 * photograph. The paired modern photograph is resolved per site by
 * `nowImageForSite` in `../plates`.
 *
 * Site ids here are the app's current ids (`ashoka-pillar`, `puskarini-pond`);
 * Phase 3 migrates them to the canonical seed ids.
 *
 * Sites without a comparably-framed plate (e.g. Maya Devi, whose only plate is a
 * plan-view drawing that cannot align with an oblique photograph) are omitted
 * deliberately rather than paired with something that would mislead — a neutral
 * "no record yet" state beats a comparison the viewer cannot trust.
 */
export const demoHistoricalImages: HistoricalImage[] = [
  {
    id: 'ashoka-pillar.1899-south',
    siteId: 'ashoka-pillar',
    vantageId: 'ashoka-pillar-south',
    date: '1899',
    capturedAt: '1899-12-01T00:00:00.000Z',
    caption: plateMeta['ashokan-pillar.1899-south'].caption,
    image: plateImages['ashokan-pillar.1899-south'],
    evidenceTier: plateMeta['ashokan-pillar.1899-south'].evidenceTier,
    attribution: plateMeta['ashokan-pillar.1899-south'].attribution,
    sourceId: 'mukherji-1901',
    // A real fixed-point photograph, but the modern vantage is a re-survey of
    // the same view rather than the identical 1899 tripod position.
    viewpointConfirmed: false,
  },
  {
    id: 'ashoka-pillar.pre1896-jungle',
    siteId: 'ashoka-pillar',
    vantageId: 'ashoka-pillar-south',
    date: 'pre-1896',
    caption: plateMeta['ashokan-pillar.pre1896-jungle'].caption,
    image: plateImages['ashokan-pillar.pre1896-jungle'],
    evidenceTier: plateMeta['ashokan-pillar.pre1896-jungle'].evidenceTier,
    attribution: plateMeta['ashokan-pillar.pre1896-jungle'].attribution,
    sourceId: 'mukherji-1901',
    viewpointConfirmed: false,
  },
  {
    id: 'puskarini.earthen-pond-pre1930s',
    siteId: 'puskarini-pond',
    vantageId: 'puskarini-north-step',
    date: 'pre-1930s',
    caption: plateMeta['puskarini.earthen-pond-pre1930s'].caption,
    image: plateImages['puskarini.earthen-pond-pre1930s'],
    evidenceTier: plateMeta['puskarini.earthen-pond-pre1930s'].evidenceTier,
    attribution: plateMeta['puskarini.earthen-pond-pre1930s'].attribution,
    sourceId: 'unesco-1997',
    viewpointConfirmed: false,
  },
];

/** Oldest first — Then / Now reads forward through the record. */
export function historicalImagesForSite(siteId: string): HistoricalImage[] {
  return demoHistoricalImages.filter((image) => image.siteId === siteId);
}

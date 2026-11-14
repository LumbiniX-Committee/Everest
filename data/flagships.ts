import seed from '../seed/flagships.json';

import type { Bilingual, Flagship, InterfaceLanguage } from '@/types';

import { commonsThumb } from './places';

/**
 * The three flagship places: Swayambhu, Lumbini's Sacred Garden and
 * Basantapur (Kathmandu Durbar Square). Read straight from seed, as
 * sitePhotos.ts reads its seed, because there is no presentation mapping to
 * generate: the seed already has the app's shape. Licences are re-checked
 * against Commons by tools/data/check-flagship-photos.mjs.
 */
export const FLAGSHIPS: Flagship[] = (seed as { flagships: Flagship[] }).flagships;

const bySite = new Map<string, Flagship>();
const byPlace = new Map<string, Flagship>();
for (const flagship of FLAGSHIPS) {
  for (const id of flagship.siteIds) bySite.set(id, flagship);
  for (const id of flagship.placeIds) byPlace.set(id, flagship);
}

export function flagshipForSite(siteId: string): Flagship | undefined {
  return bySite.get(siteId);
}

export function flagshipForPlace(placeId: string): Flagship | undefined {
  return byPlace.get(placeId);
}

/** The text in the reader's language; English where the Nepali is missing. */
export function inLanguage(text: Bilingual, language: InterfaceLanguage): string {
  return language === 'ne' && text.ne.trim() ? text.ne : text.en;
}

/** The cover photograph, as a sized Commons thumbnail with its credit line. */
export function flagshipCover(flagship: Flagship, width = 1280): { uri: string; credit: string } {
  const cover = flagship.photos[0];
  return { uri: commonsThumb(cover.file, width), credit: `Photo: ${cover.author}, ${cover.licence}, Wikimedia Commons` };
}

import seed from '../seed/site-photos.json';

import { flagshipForSite } from './flagships';
import { commonsThumb } from './places';
import { nowImageCredits } from './plates';

type SitePhoto = { file: string; licence: string; author: string; wikidata: string; matchedM: number };

const PHOTOS = (seed as { photos: Record<string, SitePhoto> }).photos;

/**
 * A credited Commons photograph of a site, loaded from Wikimedia rather than
 * bundled, so the app stays small. Matched by Wikidata name and coordinates in
 * tools/data/build-site-photos.mjs; null where no confident match exists.
 */
export function remotePhotoForSite(siteId: string, width = 900): { uri: string; credit: string } | null {
  const photo = PHOTOS[siteId];
  if (!photo) {
    // A flagship's curated cover outranks the schematic: these are the places
    // most people open first, so they never open on a drawing.
    const flagship = flagshipForSite(siteId);
    if (!flagship) return null;
    const cover = flagship.photos[0];
    return { uri: commonsThumb(cover.file, width), credit: `Photo: ${cover.author}, ${cover.licence}, Wikimedia Commons` };
  }
  return { uri: commonsThumb(photo.file, width), credit: `Photo: ${photo.author}, ${photo.licence}, Wikimedia Commons` };
}

/** The credit line for whatever photograph a site shows, bundled or remote. */
export function photoCreditForSite(siteId: string): string | null {
  return nowImageCredits[siteId] ?? remotePhotoForSite(siteId)?.credit ?? null;
}

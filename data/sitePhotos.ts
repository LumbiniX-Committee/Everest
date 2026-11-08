import seed from '../seed/site-photos.json';

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
  if (!photo) return null;
  return { uri: commonsThumb(photo.file, width), credit: `Photo: ${photo.author}, ${photo.licence}, Wikimedia Commons` };
}

/** The credit line for whatever photograph a site shows, bundled or remote. */
export function photoCreditForSite(siteId: string): string | null {
  return nowImageCredits[siteId] ?? (PHOTOS[siteId] ? remotePhotoForSite(siteId)!.credit : null);
}

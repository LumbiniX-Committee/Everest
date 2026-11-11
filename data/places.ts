import type { EntryFee, HeritageSite, HomeHub, Place, VisitorType } from '@/types';
import { distanceMeters } from '@/utils';

import { ENTRY_FEES, FEE_SITE_IDS, FEES_SOURCE, PLACES } from './generated/places';

export { PLACES, FEES_SOURCE };

const byId = new Map(PLACES.map((place) => [place.id, place]));

export function findPlace(id: string): Place | undefined {
  return byId.get(id);
}

/** Nearest first, within `radiusM`. */
export function placesNear(coordinate: { latitude: number; longitude: number }, radiusM = 5_000, limit = 12): Place[] {
  return PLACES.map((place) => ({ place, d: distanceMeters(coordinate, place.coordinate) }))
    .filter(({ d }) => d <= radiusM)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ place }) => place);
}

/** The best-described places in a starting area first: those with a description and a photograph. */
export function placesForHub(hub: HomeHub, limit = 12): Place[] {
  if (hub === 'unset' || hub === 'near-me') return [];
  const score = (place: Place) => (place.description ? 2 : 0) + (place.image ? 1 : 0) + (place.feeId ? 1 : 0);
  return PLACES.filter((place) => place.hub === hub)
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

const feeById = new Map(ENTRY_FEES.map((fee) => [fee.id, fee]));

/** The official fee for a curated site, through the site itself or its parent complex. */
export function feeForSite(site: Pick<HeritageSite, 'id' | 'parentSiteId'>): EntryFee | undefined {
  const ids = [site.id, site.parentSiteId].filter(Boolean);
  const feeId = Object.entries(FEE_SITE_IDS).find(([, siteIds]) => ids.some((id) => siteIds.includes(id as string)))?.[0];
  return feeId ? feeById.get(feeId) : undefined;
}

export function feeForPlace(place: Place): EntryFee | undefined {
  return place.feeId ? feeById.get(place.feeId) : undefined;
}

/** The amount for this visitor, in rupees. Unset visitors see the foreign rate, and are told. */
export function feeAmount(fee: EntryFee, visitor: VisitorType): number {
  return visitor === 'nepali' ? fee.nepali : fee.foreign;
}

/** A Commons file as a sized thumbnail URL. */
export function commonsThumb(file: string, width = 640): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

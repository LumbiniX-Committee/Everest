/**
 * Data access lives behind this barrel so screens never import from
 * `data/demo/*` directly. When real content arrives — LDT survey data, a synced
 * catalogue — it is swapped in here and no screen changes.
 */
export * from './demo';
export * from './generated';
export * from './plates';
export * from './audio';
export * from './questExperiences';

export { HUB_BOUNDS, HUB_CENTRES, hubCentre } from './hubs';
export { commonsThumb, feeAmount, feeForPlace, feeForSite, findPlace, placesForHub, placesNear, PLACES, FEES_SOURCE } from './places';
export { MODELS } from './generated/models';
export { modelFor, findModel } from './models';
export { TREKS, dayStops, findTrek, trekLine, trekStop } from './treks';
export { ESSENTIALS, essentialsFor, essentialsNear, findEssential } from './essentials';
export { photoCreditForSite, remotePhotoForSite } from './sitePhotos';
export { trekPhoto } from './trekPhotos';
export { placeNote, type PlaceNote } from './placeNotes';

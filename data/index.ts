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

export { HUB_CENTRES, hubCentre } from './hubs';
export { commonsThumb, feeAmount, feeForPlace, feeForSite, findPlace, placesForHub, placesNear, PLACES, FEES_SOURCE } from './places';

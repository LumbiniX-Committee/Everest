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
export { modelFor, findModel, modelPlacements } from './models';
export type { ModelPlacement } from './models';
export { MAP_SCANS, type MapScan } from './mapScans';
export { MODEL_INFO, MODEL_INFO_SOURCE, type ModelInfo } from './modelInfo';
export { TREKS, dayDrawLine, dayStops, findTrek, trekDrawLine, trekLine, trekProfile, trekStop, TREK_DRAW_TOLERANCE_M } from './treks';
export { ESSENTIALS, essentialsFor, essentialsNear, findEssential } from './essentials';
export { photoCreditForSite, remotePhotoForSite } from './sitePhotos';
export { trekPhoto } from './trekPhotos';
export { placeNote, type PlaceNote } from './placeNotes';
export { guideFor, PLACE_GUIDES } from './guides';
export { FLAGSHIPS, flagshipCover, flagshipForPlace, flagshipForSite, inLanguage } from './flagships';
export { SCANS, scanEmbedUrl, scansFor, scanSpots, type Scan, type ScanSpot } from './generated/scans';
export { PANORAMAS, findPanorama, panoramasFor, type Panorama, type PanoramaHotspot, type PanoramaSegment, type PanoramaText } from './panoramas';

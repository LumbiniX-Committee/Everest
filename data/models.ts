import type { MonumentModel } from '@/types';

import { MODELS } from './generated/models';
import { findSite } from './generated/sites';
import { findPlace } from './places';

const byTarget = new Map(MODELS.flatMap((model) => model.targets.map((target) => [target, model] as const)));

/** The 3D model for a site or place, if one exists. */
export function modelFor(siteOrPlaceId: string): MonumentModel | undefined {
  return byTarget.get(siteOrPlaceId);
}

export function findModel(id: string): MonumentModel | undefined {
  return MODELS.find((model) => model.id === id);
}

/** Where a model stands on the map: the first of its targets with a known coordinate. */
export type ModelPlacement = {
  id: string;
  longitude: number;
  latitude: number;
  /** Every site or place it stands for, so their drawn shapes can step aside. */
  targets: string[];
};

/**
 * Where OpenStreetMap places a monument better than our site record does:
 * Swayambhunath's record is rounded to 27.715, 85.29, and the Kasthamandap
 * and Maju Dega records sit over 100 m from the buildings the map draws.
 * [latitude, longitude] of the OSM feature named.
 */
const OSM_POSITION: Record<string, [number, number]> = {
  swayambhunath: [27.714931, 85.290391], // OSM way 201223707
  kasthamandap: [27.703934, 85.305779], // OSM way 183558418
  'maju-dega': [27.704264, 85.306173], // OSM way 183562980
};

export function modelPlacements(): ModelPlacement[] {
  return MODELS.flatMap((model) => {
    const osm = OSM_POSITION[model.id];
    if (osm) return [{ id: model.id, latitude: osm[0], longitude: osm[1], targets: model.targets }];
    for (const target of model.targets) {
      const coordinate = findSite(target)?.coordinate ?? findPlace(target)?.coordinate;
      if (coordinate) {
        return [{ id: model.id, longitude: coordinate.longitude, latitude: coordinate.latitude, targets: model.targets }];
      }
    }
    return [];
  });
}

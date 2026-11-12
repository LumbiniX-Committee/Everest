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

export function modelPlacements(): ModelPlacement[] {
  return MODELS.flatMap((model) => {
    for (const target of model.targets) {
      const coordinate = findSite(target)?.coordinate ?? findPlace(target)?.coordinate;
      if (coordinate) {
        return [{ id: model.id, longitude: coordinate.longitude, latitude: coordinate.latitude, targets: model.targets }];
      }
    }
    return [];
  });
}

import type { MonumentModel } from '@/types';

import { MODELS } from './generated/models';

const byTarget = new Map(MODELS.flatMap((model) => model.targets.map((target) => [target, model] as const)));

/** The 3D model for a site or place, if one exists. */
export function modelFor(siteOrPlaceId: string): MonumentModel | undefined {
  return byTarget.get(siteOrPlaceId);
}

export function findModel(id: string): MonumentModel | undefined {
  return MODELS.find((model) => model.id === id);
}

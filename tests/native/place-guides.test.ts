import glyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';

import { findPlace, MODELS, PLACE_GUIDES } from '@/data';
import { distanceMeters } from '@/utils';

/** The long-form guides: every reference resolves, and no stop is pinned somewhere implausible. */
describe('place guides', () => {
  it('covers at least three major places, each a listed place', () => {
    expect(PLACE_GUIDES.length).toBeGreaterThanOrEqual(3);
    for (const guide of PLACE_GUIDES) expect(findPlace(guide.placeId)).toBeDefined();
  });

  it('names only 3D models that exist', () => {
    const ids = new Set(MODELS.map((model) => model.id));
    for (const guide of PLACE_GUIDES) if (guide.modelId) expect(ids.has(guide.modelId)).toBe(true);
  });

  it('credits every photograph under a free licence', () => {
    for (const guide of PLACE_GUIDES) {
      expect(guide.photos.length).toBeGreaterThan(0);
      for (const photo of guide.photos) {
        expect(photo.author.length).toBeGreaterThan(0);
        expect(photo.licence).toMatch(/^(CC0|CC BY(-SA)? [0-9.]+|Public domain)$/);
      }
    }
  });

  it('writes every chapter at all three depths and cites its sources', () => {
    for (const guide of PLACE_GUIDES) {
      expect(guide.sources.length).toBeGreaterThan(0);
      for (const chapter of guide.chapters) {
        expect(chapter.glance && chapter.story && chapter.scholar).toBeTruthy();
      }
    }
  });

  it('keeps every mapped stop within 1.5 km of its place', () => {
    for (const guide of PLACE_GUIDES) {
      const place = findPlace(guide.placeId)!;
      for (const stop of guide.walk.stops) {
        if (stop.coordinate) expect(distanceMeters(place.coordinate, stop.coordinate)).toBeLessThan(1500);
      }
    }
  });

  it('uses only icons the icon font has', () => {
    for (const guide of PLACE_GUIDES) {
      for (const tip of guide.beforeYouGo) expect(glyphMap).toHaveProperty(tip.icon);
    }
  });
});

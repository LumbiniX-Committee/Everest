import glyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';

import { findPlace, findSite, FLAGSHIPS, flagshipForPlace, flagshipForSite, photoCreditForSite, remotePhotoForSite } from '@/data';
import type { Bilingual, Flagship } from '@/types';
import { distanceMeters } from '@/utils';

/** Every Bilingual string in a flagship, so none is left half-translated. */
function texts(flagship: Flagship): Bilingual[] {
  return [
    flagship.name,
    flagship.glance.essentials,
    ...flagship.glance.facts.flatMap((fact) => [fact.label, fact.value]),
    ...flagship.glance.tips,
    ...flagship.story.chapters.flatMap((chapter) => [chapter.title, chapter.body]),
    ...flagship.story.timeline.flatMap((entry) => [entry.when, entry.what]),
    ...flagship.scholar.sections.flatMap((section) => [section.title, section.body]),
    ...Object.values(flagship.visit),
    ...flagship.subsites.flatMap((subsite) => [subsite.name, subsite.note]),
    ...flagship.photos.map((photo) => photo.caption),
  ];
}

const words = (text: string) => text.split(/\s+/).length;

describe('flagship places', () => {
  it('covers Swayambhu, Lumbini and Basantapur, each attached to a real page', () => {
    expect(FLAGSHIPS.map((flagship) => flagship.id).sort()).toEqual(['basantapur', 'lumbini', 'swayambhu']);
    for (const flagship of FLAGSHIPS) {
      expect(flagship.siteIds.length + flagship.placeIds.length).toBeGreaterThan(0);
      for (const id of flagship.siteIds) {
        expect(findSite(id)).toBeDefined();
        expect(flagshipForSite(id)).toBe(flagship);
      }
      for (const id of flagship.placeIds) {
        expect(findPlace(id)).toBeDefined();
        expect(flagshipForPlace(id)).toBe(flagship);
      }
    }
  });

  it('writes every string in English and Nepali', () => {
    for (const flagship of FLAGSHIPS) {
      for (const text of texts(flagship)) {
        expect(text.en.trim()).not.toBe('');
        expect(text.ne.trim()).not.toBe('');
        expect(text.ne).toMatch(/[ऀ-ॿ]/);
      }
    }
  });

  it('makes the three depths different texts of different weight', () => {
    for (const flagship of FLAGSHIPS) {
      const glance = words(flagship.glance.essentials.en);
      const story = flagship.story.chapters.reduce((sum, chapter) => sum + words(chapter.body.en), 0);
      const scholar = flagship.scholar.sections.reduce((sum, section) => sum + words(section.body.en), 0);
      expect(glance).toBeLessThan(90);
      expect(story).toBeGreaterThan(glance * 3);
      expect(scholar).toBeGreaterThan(story);
      expect(flagship.glance.facts.length).toBeGreaterThanOrEqual(4);
      expect(flagship.glance.tips.length).toBeGreaterThanOrEqual(3);
      expect(flagship.story.timeline.length).toBeGreaterThanOrEqual(5);
      const storyText = new Set(flagship.story.chapters.map((chapter) => chapter.body.en));
      for (const section of flagship.scholar.sections) expect(storyText.has(section.body.en)).toBe(false);
    }
  });

  it('illustrates every story chapter and cites every scholar section', () => {
    for (const flagship of FLAGSHIPS) {
      for (const chapter of flagship.story.chapters) {
        expect(chapter.photo).toBeDefined();
        expect(flagship.photos[chapter.photo!]).toBeDefined();
      }
      for (const section of flagship.scholar.sections) {
        expect(section.cites.length).toBeGreaterThan(0);
        for (const index of section.cites) expect(flagship.sources[index]).toBeDefined();
      }
      for (const source of flagship.sources) expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it('credits every photograph under a free licence, the cover first', () => {
    for (const flagship of FLAGSHIPS) {
      expect(flagship.photos.length).toBeGreaterThanOrEqual(5);
      for (const photo of flagship.photos) {
        expect(photo.author.trim()).not.toBe('');
        expect(photo.licence).toMatch(/^(CC0|CC BY(-SA)? [0-9.]+|Public domain)$/);
      }
    }
  });

  it('opens Kathmandu Durbar Square on a photograph, not the schematic', () => {
    const photo = remotePhotoForSite('kathmandu-durbar-square');
    expect(photo?.uri).toContain(encodeURIComponent(flagshipForSite('kathmandu-durbar-square')!.photos[0].file));
    expect(photoCreditForSite('kathmandu-durbar-square')).toMatch(/^Photo: .+, CC BY/);
  });

  it('links sub-sites to real pages or plausible pins', () => {
    for (const flagship of FLAGSHIPS) {
      expect(flagship.subsites.length).toBeGreaterThanOrEqual(6);
      const anchor = flagship.siteIds.length ? findSite(flagship.siteIds[0])!.coordinate : findPlace(flagship.placeIds[0])!.coordinate;
      for (const subsite of flagship.subsites) {
        if (subsite.siteId) expect(findSite(subsite.siteId)).toBeDefined();
        if (subsite.coordinate) expect(distanceMeters(anchor, subsite.coordinate)).toBeLessThan(1500);
      }
    }
  });

  it('uses only icons the icon font has', () => {
    for (const icon of ['check-circle-outline', 'clock-outline', 'tshirt-crew-outline', 'map-marker-path', 'camera-outline', 'chevron-right', 'map-marker-outline']) {
      expect(glyphMap).toHaveProperty(icon);
    }
  });
});

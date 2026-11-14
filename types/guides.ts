import type { Coordinate } from './heritage';

/** One piece of a guide, written at the three depths the app offers. */
export type GuideChapter = {
  title: string;
  /** Glance: one or two sentences. */
  glance: string;
  /** Story: added under the glance. */
  story: string;
  /** Scholar: added under the story, with the evidence and its limits. */
  scholar: string;
};

export type GuidePhoto = {
  /** Wikimedia Commons file name. */
  file: string;
  author: string;
  licence: string;
  caption: string;
};

export type GuideStop = {
  name: string;
  note: string;
  /** From OpenStreetMap. Null when no one has mapped it, so no pin is invented. */
  coordinate: Coordinate | null;
};

/**
 * A long-form guide for one of the major places: photographs, the story at
 * three depths, a walk with mapped stops, and what to know before going.
 * Written from the listed sources, and marked as not yet reviewed on site.
 */
export type PlaceGuide = {
  placeId: string;
  modelId?: string;
  eyebrow: string;
  tagline: string;
  /** The first is the cover. */
  photos: GuidePhoto[];
  facts: { label: string; value: string }[];
  chapters: GuideChapter[];
  walk: { title: string; intro: string; stops: GuideStop[] };
  beforeYouGo: { icon: string; title: string; body: string }[];
  questions: string[];
  sources: { title: string; url: string }[];
};

/** Text in both languages the app speaks. Nepali falls back to English only if empty. */
export type Bilingual = { en: string; ne: string };

export type FlagshipPhoto = { file: string; author: string; licence: string; caption: Bilingual };

/**
 * One of the three flagship places (Swayambhu, Lumbini, Basantapur), written
 * so each depth is its own text rather than the next one's first paragraph:
 * Glance is the essentials and practical facts, Story a narrative with a
 * photograph per chapter and a timeline, Scholar the evidence, the debates and
 * numbered citations into `sources`. Content lives in seed/flagships.json.
 */
export type Flagship = {
  id: string;
  /** Heritage sites whose page shows this flagship. */
  siteIds: string[];
  /** Listed places whose page and guide show it. */
  placeIds: string[];
  name: Bilingual;
  /** The first is the cover. */
  photos: FlagshipPhoto[];
  glance: {
    essentials: Bilingual;
    facts: { label: Bilingual; value: Bilingual }[];
    tips: Bilingual[];
  };
  story: {
    /** `photo` indexes `photos`. */
    chapters: { title: Bilingual; body: Bilingual; photo?: number }[];
    timeline: { when: Bilingual; what: Bilingual }[];
  };
  scholar: {
    /** `cites` index `sources`. */
    sections: { title: Bilingual; body: Bilingual; cites: number[] }[];
  };
  visit: { hours: Bilingual; dress: Bilingual; route: Bilingual; photography: Bilingual };
  subsites: {
    name: Bilingual;
    note: Bilingual;
    /** A site with its own page, when there is one. */
    siteId?: string;
    /** From OpenStreetMap; absent when no one has mapped it. */
    coordinate?: Coordinate;
  }[];
  sources: { title: string; url: string }[];
};

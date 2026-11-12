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

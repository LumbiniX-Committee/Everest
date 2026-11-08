/**
 * A practical place for visitors: somewhere to stay, eat, get help or money.
 * From Overture Maps Places; unknown fields are null, never guessed.
 */
export type EssentialKind = 'stay' | 'food' | 'health' | 'money' | 'travel' | 'transport' | 'police';

export type Essential = {
  /** `ov-` plus the Overture id, stable across releases. */
  id: string;
  name: string;
  kind: EssentialKind;
  /** Overture's own category, such as `pharmacy_and_drug_store`. */
  category: string;
  coordinate: { latitude: number; longitude: number };
  phone: string | null;
  website: string | null;
  address: string | null;
  /** Overture's confidence that the place exists, 0 to 1. */
  confidence: number;
  /** A hub id or a trek id. */
  area: string;
  /** On a trek, the stop it is closest to (within 1.5 km), or null. */
  near: string | null;
  /** The dataset that supplied it, such as `meta` or `Foursquare`. */
  source: string;
  license: string;
};

/** A place listed from open data, lighter than one of the app's curated heritage sites. */
export type PlaceCategory =
  | 'temple'
  | 'stupa'
  | 'monastery'
  | 'monument'
  | 'museum'
  | 'palace'
  | 'archaeological'
  | 'viewpoint'
  | 'nature'
  | 'attraction';

export type Place = {
  /** Route-safe, stable across rebuilds: `wd-Q123` or `osm-node-123`. */
  id: string;
  name: string;
  nameNepali: string | null;
  /** Wikidata's own short description. Null rather than written by us. */
  description: string | null;
  category: PlaceCategory;
  coordinate: { latitude: number; longitude: number };
  hub: 'lumbini' | 'kathmandu' | 'pokhara' | 'chitwan' | null;
  /** OSM opening_hours, exactly as mapped. Null when nobody has recorded them. */
  hours: string | null;
  website: string | null;
  /** OSM wheelchair access: 'yes', 'limited', 'no', or null when not recorded. */
  wheelchair: string | null;
  wikipedia: string | null;
  wikidata: string | null;
  /** A Wikimedia Commons file name. */
  image: string | null;
  feeId: string | null;
  sources: ('osm' | 'wikidata')[];
};

/** An official entry fee, in rupees, by the visitor categories the site itself uses. */
export type EntryFee = {
  id: string;
  label: string;
  foreign: number;
  saarc: number;
  chinese: number;
  nepali: number;
  note?: string;
};

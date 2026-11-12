/**
 * Real scans that stand on the map itself, not only in Sketchfab's player.
 *
 * Only openly licensed scans can be here: the file is copied, reduced for a
 * phone and served by our website (`landing/public/models/scans/`). Each was
 * downloaded with `tools/data/fetch-sketchfab.mjs` (CC0/CC BY only) and reduced
 * with glTF-Transform (simplified, WebP textures, quantized geometry), which is
 * a modification CC BY allows with credit.
 *
 * Position is the named OpenStreetMap feature. Size is as captured (drone
 * photogrammetry in metres, not checked against a survey); heading was set by
 * eye against the map's own buildings and roads. A pin, not a survey.
 */
export type MapScan = {
  /** File name under /models/scans/, without `.glb`. */
  id: string;
  /** The Sketchfab model it came from. */
  scanId: string;
  title: string;
  creator: string;
  licence: string;
  latitude: number;
  longitude: number;
  /** Degrees clockwise from north that the scan is turned to line up with the map. */
  headingDeg: number;
  /** Multiplier on the scan's own units (1 = metres as captured). */
  scale: number;
  /** Sites or places it stands for, so their drawn shapes step aside. */
  targets: string[];
  bytes: number;
};

export const MAP_SCANS: MapScan[] = [
  {
    id: 'yetkha-bahal',
    scanId: 'dedca951739f4362b51b777d3ea826e1',
    title: 'Yetkha Bahal',
    creator: 'Airlift Technology',
    licence: 'CC BY 4.0',
    latitude: 27.706655, // OSM way 80913260, the courtyard; the stupa stands at its centre
    longitude: 85.306527,
    headingDeg: 0,
    scale: 1,
    targets: ['osm-way-80913260'],
    bytes: 1_360_000,
  },
  {
    id: 'keshar-mahal',
    scanId: 'c5bdfc4d02fa4c668b8e1bf31beca067',
    title: 'Keshar Mahal, National Library',
    creator: 'Bhugol Tour',
    licence: 'CC BY 4.0',
    latitude: 27.714221, // OSM way 201527440, the palace
    longitude: 85.314718,
    headingDeg: 0,
    scale: 1,
    targets: ['osm-node-1962909336'],
    bytes: 3_870_000,
  },
  {
    id: 'nagbahal-hiti',
    scanId: '38aa9a9e585d4bcd956897b472165fd0',
    title: 'Stone tap (dhunge dhara), Nag Bahal',
    creator: 'Semantic Creation',
    licence: 'CC BY 4.0',
    latitude: 27.6759896, // OSM way 608630219, Nagbahal hiti
    longitude: 85.3242483,
    headingDeg: 0, // not checked: the spout's facing is not mapped
    scale: 1,
    targets: [],
    bytes: 1_860_000,
  },
  {
    id: 'bagdwar',
    scanId: 'c7452743c2f44ce3bacc212b7b4c5ee0',
    title: 'Bagdwar, source of the Bagmati',
    creator: 'robert.jackisch',
    licence: 'CC BY 4.0',
    latitude: 27.8113122, // the creator's stated coordinates
    longitude: 85.3904385,
    headingDeg: 0, // not checked: no map feature to line it up with
    scale: 1,
    targets: [],
    bytes: 2_210_000,
  },
  {
    id: 'tusha-hiti',
    scanId: 'ae79c0cca5c34f0f9a9d869eeccdb983',
    title: 'Tusha Hiti, Patan',
    creator: 'rbm.1world',
    licence: 'CC BY 4.0',
    latitude: 27.672722, // OSM node 10034234966, the spout
    longitude: 85.325134,
    headingDeg: 0, // set by eye against Sundari Chowk's walls
    scale: 1,
    // Not the courtyard's site id: that would clear the whole palace wing.
    targets: [],
    bytes: 3_570_000,
  },
];

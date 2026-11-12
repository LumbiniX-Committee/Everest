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
  /**
   * Set when this is our own model, built in Blender from photos and map data,
   * not a scan: its shape is judged by eye, so it is credited as modelled and
   * never as a scan. The file lives under /models/modelled/.
   */
  modelled?: true;
  /** File name under /models/modelled/ when one model stands in several places. Defaults to `id`. */
  file?: string;
  /** For our own models: the OpenStreetMap feature that sets its place and size, e.g. `way/844764523`. */
  osm?: string;
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
  {
    id: 'world-peace-pagoda',
    scanId: '',
    title: 'World Peace Pagoda (Shanti Stupa), Lumbini',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/world-peace-pagoda.py)',
    latitude: 27.498881, // OSM way 844764523, the pagoda's footprint
    longitude: 83.27626,
    headingDeg: 0, // modelled north-up, main stairs south toward the entrance path
    scale: 1, // lowest terrace 62 m across, as the OSM footprint; heights by eye
    targets: ['world-peace-pagoda'],
    bytes: 2527464,
    modelled: true,
    osm: 'way/844764523',
  },
  {
    id: 'maya-devi-temple',
    scanId: '',
    title: 'Maya Devi Temple, Lumbini',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/maya-devi-temple.py)',
    latitude: 27.469609, // OSM way 343151593, the temple's footprint (30 × 26 m)
    longitude: 83.275832,
    headingDeg: 0, // modelled north-up, entrance south toward the pond
    scale: 1, // footprint as mapped; heights by eye from 2021–2023 photos
    targets: ['maya-devi-temple'],
    bytes: 598364,
    modelled: true,
    osm: 'way/343151593',
  },
  {
    id: 'swayambhu-stupa',
    scanId: '',
    title: 'Swayambhu Mahachaitya',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/swayambhu.py)',
    latitude: 27.714931, // OSM way 201223707, the stupa (26.8 m across)
    longitude: 85.290391,
    headingDeg: 0, // the eyes face the four directions
    scale: 1, // footprint as mapped; heights by eye from 2017–2023 photos
    targets: [],
    bytes: 1548444,
    modelled: true,
    osm: 'way/201223707',
  },
  {
    id: 'pratappur-shikhara',
    scanId: '',
    title: 'Pratappur Shikhara, Swayambhu',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/swayambhu.py)',
    latitude: 27.714985, // OSM way 115376623 (height 17 m as tagged)
    longitude: 85.290579,
    headingDeg: 0, // not checked: which side the door faces
    scale: 1,
    targets: [],
    bytes: 111464,
    modelled: true,
    osm: 'way/115376623',
    file: 'swayambhu-shikhara',
  },
  {
    id: 'anantapur-shikhara',
    scanId: '',
    title: 'Anantapur Shikhara, Swayambhu',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/swayambhu.py)',
    latitude: 27.714758, // OSM way 255752871 (height 17 m as tagged)
    longitude: 85.290484,
    headingDeg: 0, // not checked: which side the door faces
    scale: 1,
    targets: [],
    bytes: 111464,
    modelled: true,
    osm: 'way/255752871',
    file: 'swayambhu-shikhara',
  },
  {
    id: 'swayambhu-vajra',
    scanId: '',
    title: 'The great vajra, Swayambhu',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/swayambhu.py)',
    latitude: 27.71485, // OSM way 1179993484 ("Dorje")
    longitude: 85.290654,
    headingDeg: 0, // not checked: modelled lying east-west
    scale: 1,
    targets: [],
    bytes: 87940,
    modelled: true,
    osm: 'way/1179993484',
  },
  {
    id: 'nyatapola',
    scanId: '',
    title: 'Nyatapola Temple, Bhaktapur',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/newar-temple.py)',
    latitude: 27.671410, // OSM way 85470341, the plinth's footprint
    longitude: 85.429372,
    headingDeg: 0, // modelled north-up; stairs and main door as in photos
    scale: 1, // footprint as mapped; roofs and plinth steps from photos, heights by eye
    targets: [],
    bytes: 349804,
    modelled: true,
    osm: 'way/85470341',
  },
  {
    id: 'bhairavnath',
    scanId: '',
    title: 'Bhairavnath Temple, Bhaktapur',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/newar-temple.py)',
    latitude: 27.671094, // OSM way 185746728, the plinth's footprint
    longitude: 85.429470,
    headingDeg: 0, // modelled north-up; stairs and main door as in photos
    scale: 1, // footprint as mapped; roofs and plinth steps from photos, heights by eye
    targets: [],
    bytes: 279260,
    modelled: true,
    osm: 'way/185746728',
  },
  {
    id: 'maju-dega',
    scanId: '',
    title: 'Maju Dega, Kathmandu Durbar Square',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/newar-temple.py)',
    latitude: 27.704264, // OSM way 183562980, the plinth's footprint
    longitude: 85.306174,
    headingDeg: 0, // modelled north-up; stairs and main door as in photos
    scale: 1, // footprint as mapped; roofs and plinth steps from photos, heights by eye
    targets: [],
    bytes: 285332,
    modelled: true,
    osm: 'way/183562980',
  },
  {
    id: 'kasthamandap',
    scanId: '',
    title: 'Kasthamandap, Kathmandu Durbar Square',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/newar-temple.py)',
    latitude: 27.703934, // OSM way 183558418, the plinth's footprint
    longitude: 85.305779,
    headingDeg: 0, // modelled north-up; stairs and main door as in photos
    scale: 1, // footprint as mapped; roofs and plinth steps from photos, heights by eye
    targets: [],
    bytes: 328600,
    modelled: true,
    osm: 'way/183558418',
  },
  {
    id: 'narayan-mandir',
    scanId: '',
    title: 'Narayan Mandir, Kathmandu Durbar Square',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/newar-temple.py)',
    latitude: 27.704451, // OSM way 111984927, the plinth's footprint
    longitude: 85.306281,
    headingDeg: 0, // modelled north-up; stairs and main door as in photos
    scale: 1, // footprint as mapped; roofs and plinth steps from photos, heights by eye
    targets: [],
    bytes: 217732,
    modelled: true,
    osm: 'way/111984927',
  },
  {
    id: 'trailokya-mohan',
    scanId: '',
    title: 'Trailokya Mohan Narayan, Kathmandu Durbar Square',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/newar-temple.py)',
    latitude: 27.703957, // OSM way 1414593331, the plinth's footprint
    longitude: 85.306273,
    headingDeg: 0, // modelled north-up; stairs and main door as in photos
    scale: 1, // footprint as mapped; roofs and plinth steps from photos, heights by eye
    targets: [],
    bytes: 208604,
    modelled: true,
    osm: 'way/1414593331',
  },
  {
    id: 'jagannath',
    scanId: '',
    title: 'Jagannath Temple, Kathmandu Durbar Square',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/newar-temple.py)',
    latitude: 27.704647, // OSM way 169429518, the plinth's footprint
    longitude: 85.307220,
    headingDeg: 0, // modelled north-up; stairs and main door as in photos
    scale: 1, // footprint as mapped; roofs and plinth steps from photos, heights by eye
    targets: [],
    bytes: 217680,
    modelled: true,
    osm: 'way/169429518',
  },
  {
    id: 'hari-shankar',
    scanId: '',
    title: 'Hari Shankar Temple, Patan Durbar Square',
    creator: 'Sākṣī',
    licence: 'Our own model (tools/models/blender/newar-temple.py)',
    latitude: 27.673210, // OSM way 120443315, the plinth's footprint
    longitude: 85.324956,
    headingDeg: 0, // modelled north-up; stairs and main door as in photos
    scale: 1, // footprint as mapped; roofs and plinth steps from photos, heights by eye
    targets: [],
    bytes: 187356,
    modelled: true,
    osm: 'way/120443315',
  },
];

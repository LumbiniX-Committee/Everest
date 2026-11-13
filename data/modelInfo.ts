/**
 * Info points on our own 3D models: tap one on the 3D map to read what you
 * are looking at.
 *
 * Text by OMX Lab (the company behind Sākṣī), from its heritage model notes
 * (`omx_heritage_models/metadata`). Only the words are used here, never the
 * models those notes were written for. Each point stands on the OpenStreetMap
 * feature its model is placed by (see `data/mapScans.ts`), so it is as precise
 * as the model's own pin.
 *
 * Lumbini's points (Maya Devi Temple, the Ashokan Pillar, Puskarini, the
 * vihara remains, the World Peace Pagoda) are already sites with their own
 * pages, so they are not repeated here.
 */
export type ModelInfo = {
  id: string;
  /** The `MAP_SCANS` entry this point belongs to. */
  modelId: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle: string;
  body: string;
};

export const MODEL_INFO_SOURCE = 'OMX Lab';

export const MODEL_INFO: ModelInfo[] = [
  {
    id: 'swayambhu-stupa',
    modelId: 'swayambhu-stupa',
    latitude: 27.714931, // OSM way 201223707
    longitude: 85.290391,
    title: 'Swayambhu Stupa',
    subtitle: 'Eyes of the Buddha',
    body:
      'The great stupa: a whitewashed dome topped by a gilded harmika painted on each side with the eyes of the Buddha, crowned by a 13-tiered spire representing the stages to enlightenment.',
  },
  {
    id: 'pratappur-shikhara',
    modelId: 'pratappur-shikhara',
    latitude: 27.714985, // OSM way 115376623
    longitude: 85.290579,
    title: 'Pratappur Shikhara',
    subtitle: 'One of a pair beside the stupa',
    body:
      'One of the two white shikhara-style temples, Pratappur and Anantapur, built in the 17th century under King Pratap Malla beside the great stupa.',
  },
  {
    id: 'anantapur-shikhara',
    modelId: 'anantapur-shikhara',
    latitude: 27.714758, // OSM way 255752871
    longitude: 85.290484,
    title: 'Anantapur Shikhara',
    subtitle: 'One of a pair beside the stupa',
    body:
      'One of the two white shikhara-style temples, Pratappur and Anantapur, built in the 17th century under King Pratap Malla beside the great stupa.',
  },
];

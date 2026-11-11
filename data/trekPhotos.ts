import { commonsThumb } from './places';

/**
 * One credited Commons photograph per trek, chosen from the Wikidata item for
 * the trek's landmark and checked by eye. Loaded from Wikimedia, not bundled;
 * screens fall back to no image offline.
 */
const PHOTOS: Record<string, { file: string; credit: string }> = {
  'poon-hill': { file: 'Poon Hill-68-Besucher vor Dhaulagiri-2013-gje.jpg', credit: 'Dawn on Poon Hill, facing Dhaulagiri. Photo: Gerd Eichmann, CC BY-SA 4.0, Wikimedia Commons' },
  'langtang-valley': { file: 'Starry night in Langtang National Park.jpg', credit: 'Night over Langtang National Park. Photo: Q-lieb-in, CC BY-SA 4.0, Wikimedia Commons' },
  'everest-base-camp': { file: 'Everest Base Camp from Kala Patther.jpg', credit: 'Everest Base Camp from Kala Patthar. Photo: Goutam1962, CC BY-SA 4.0, Wikimedia Commons' },
};

export function trekPhoto(trekId: string, width = 900): { uri: string; credit: string } | null {
  const photo = PHOTOS[trekId];
  return photo ? { uri: commonsThumb(photo.file, width), credit: photo.credit } : null;
}

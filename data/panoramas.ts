/**
 * 360° panoramas for the "Look around" view.
 *
 * Only openly licensed equirectangular photographs from Wikimedia Commons, each
 * checked through the Commons API (size, licence, author) on 2026-11-13 and
 * credited on the viewer and in LICENCES.md. They are loaded from Commons at a
 * phone-sized width and never copied into the app.
 *
 * Searched and not found: no openly licensed 360° panorama of Lumbini (Maya
 * Devi Temple or the Sacred Garden) or of Kathmandu Durbar Square / Basantapur
 * exists on Commons. A geosearch of every geotagged file within 1 km of the
 * Maya Devi Temple and 120 m of the square found no 2:1 image, and the 360°
 * categories and templates have none for either. 360cities and Sketchfab were
 * not used: their terms are not open.
 *
 * `northU` is the image column that faces true north. Neither photograph
 * records a compass bearing, so both are estimated from where the sun stands in
 * the frame against its computed position at the time the camera recorded
 * (NOAA solar position, Nepal time). The elevation of the sun in each frame
 * agrees with the computed one to within 3°, which supports the timestamps, but
 * the result is still an estimate: `northApproximate` says so on screen.
 */

export type PanoramaText = { en: string; ne: string };

export type PanoramaHotspot = {
  id: string;
  /** Position in the image: 0→1 left to right, 0→1 top to bottom. */
  u: number;
  v: number;
  title: PanoramaText;
};

export type PanoramaSegment = PanoramaText & {
  /** The feature this sentence is about; the view turns to it while it is read. */
  hotspotId?: string;
};

export type Panorama = {
  id: string;
  /** Site or place ids whose pages offer this view. */
  placeIds: string[];
  title: PanoramaText;
  /** The Commons file name. */
  file: string;
  /** 3840 px wide, Commons' largest standard thumbnail under 4096. */
  imageUrl: string;
  /** 1920 px wide, for phones whose GPU cannot take a 4096 texture. */
  fallbackUrl: string;
  sourcePage: string;
  author: string;
  licence: string;
  licenceUrl: string;
  /** Camera time recorded in the file, Nepal time. */
  takenAt: string;
  /** Where the camera stood, from the file's GPS. */
  coordinate: { latitude: number; longitude: number };
  northU: number;
  northApproximate: boolean;
  /** Compass direction the view opens facing. */
  startAzimuth: number;
  hotspots: PanoramaHotspot[];
  narration: PanoramaSegment[];
};

const thumb = (path: string, file: string, width: number) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/${width}px-${file}`;

export const PANORAMAS: Panorama[] = [
  {
    id: 'swayambhu-stupa-terrace',
    placeIds: ['wd-Q12946982'],
    title: { en: 'Below the great stupa', ne: 'महाचैत्यको फेदमा' },
    file: 'Swayambhunath_Area_13.jpg',
    imageUrl: thumb('8/8c', 'Swayambhunath_Area_13.jpg', 3840),
    fallbackUrl: thumb('8/8c', 'Swayambhunath_Area_13.jpg', 1920),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Swayambhunath_Area_13.jpg',
    author: 'Acharya Bipin',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    takenAt: '2018-11-24 11:48',
    coordinate: { latitude: 27.714756, longitude: 85.290364 },
    // Sun at u 0.986, computed azimuth 179.1° and elevation 41.9° (seen at 44°).
    northU: 0.4885,
    northApproximate: true,
    startAzimuth: 0,
    hotspots: [
      { id: 'steps', u: 0.452, v: 0.52, title: { en: 'Steps to the great stupa', ne: 'महाचैत्य जाने खुड्किला' } },
      { id: 'shikhara', u: 0.3, v: 0.22, title: { en: 'White shikhara temple', ne: 'सेतो शिखर मन्दिर' } },
      { id: 'flags', u: 0.4, v: 0.37, title: { en: 'Prayer flags', ne: 'प्रार्थना झण्डा' } },
      { id: 'valley', u: 0.78, v: 0.49, title: { en: 'Kathmandu Valley', ne: 'काठमाडौं उपत्यका' } },
    ],
    narration: [
      {
        en: 'You are on Swayambhu hill, west of Kathmandu, a few steps below the great stupa.',
        ne: 'तपाईं काठमाडौंको पश्चिममा रहेको स्वयम्भू डाँडामा, महाचैत्यभन्दा केही खुड्किला तल हुनुहुन्छ।',
      },
      {
        hotspotId: 'steps',
        en: 'These steps lead up to the stupa itself: a white dome crowned by a gilded tower, painted on all four sides with the eyes of the Buddha.',
        ne: 'यी खुड्किला सिधै स्तूपासम्म पुग्छन्: सेतो गुम्बज, जसको माथिको सुनौलो धुरीमा चारैतिर बुद्धका आँखा कोरिएका छन्।',
      },
      {
        hotspotId: 'shikhara',
        en: 'White shikhara temples like this one stand around the stupa. Swayambhu is honoured by Buddhists and Hindus alike.',
        ne: 'यस्तै सेता शिखर शैलीका मन्दिर स्तूपाको वरिपरि छन्। स्वयम्भूलाई बौद्ध र हिन्दु दुवैले पूज्छन्।',
      },
      {
        hotspotId: 'flags',
        en: 'Prayer flags in five colours are strung across the terrace. The wind is said to carry their printed prayers out over the valley.',
        ne: 'पाँच रङका प्रार्थना झण्डा चौरभरि टाँगिएका छन्। हावाले तिनमा छापिएका प्रार्थना उपत्यकाभरि पुर्‍याउँछ भन्ने विश्वास छ।',
      },
      {
        hotspotId: 'valley',
        en: 'Below lies the Kathmandu Valley. Legend says it was once a lake, and that a lotus of light rose on its water here: Swayambhu, the self-arisen.',
        ne: 'तल काठमाडौं उपत्यका फैलिएको छ। किंवदन्तीअनुसार यो पहिले ताल थियो, र यहीँ त्यसको पानीमा ज्योतिको कमल प्रकट भयो: स्वयम्भू, अर्थात् आफैं उत्पन्न।',
      },
    ],
  },
  {
    id: 'swayambhu-buddha-park',
    placeIds: ['wd-Q12946982'],
    title: { en: 'Buddha Park', ne: 'बुद्ध पार्क' },
    file: 'Swayambhunath_Area_01_360.jpg',
    imageUrl: thumb('4/4e', 'Swayambhunath_Area_01_360.jpg', 3840),
    fallbackUrl: thumb('4/4e', 'Swayambhunath_Area_01_360.jpg', 1920),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Swayambhunath_Area_01_360.jpg',
    author: 'Acharya Bipin',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    takenAt: '2018-11-24 09:46',
    coordinate: { latitude: 27.716256, longitude: 85.283922 },
    // Sun behind the Buddha's head at u 0.435, computed azimuth 144.5° and elevation 33.3° (seen at 36°).
    northU: 0.0336,
    northApproximate: true,
    startAzimuth: 145,
    hotspots: [
      { id: 'statues', u: 0.435, v: 0.33, title: { en: 'The three statues', ne: 'तीन मूर्ति' } },
      // Bearing 103° to the stupa (27.714931, 85.290391), about 650 m.
      { id: 'stupa', u: 0.3197, v: 0.47, title: { en: 'Towards the great stupa', ne: 'महाचैत्यतर्फ' } },
    ],
    narration: [
      {
        en: 'This is Buddha Park, on the western side of Swayambhu hill.',
        ne: 'यो स्वयम्भू डाँडाको पश्चिमपट्टि रहेको बुद्ध पार्क हो।',
      },
      {
        hotspotId: 'statues',
        en: 'Three great gilded statues rise above the garden: the Buddha at the centre, with Avalokiteshvara, the bodhisattva of compassion, and Guru Rinpoche beside him.',
        ne: 'बगैंचामाथि तीनवटा ठूला सुनौला मूर्ति छन्: बीचमा बुद्ध, र छेउमा करुणाका बोधिसत्त्व अवलोकितेश्वर र गुरु रिन्पोछे।',
      },
      {
        hotspotId: 'stupa',
        en: 'The great stupa stands about 650 metres east of here, at the top of the hill.',
        ne: 'महाचैत्य यहाँबाट करिब ६५० मिटर पूर्वमा, डाँडाको टुप्पोमा छ।',
      },
      {
        en: 'Many visitors walk the circuit around the hill, turning prayer wheels as they go.',
        ne: 'धेरै यात्रु माने घुमाउँदै डाँडाको परिक्रमा गर्छन्।',
      },
    ],
  },
];

/** The panoramas a site or place page can open. */
export function panoramasFor(placeId: string): Panorama[] {
  return PANORAMAS.filter((panorama) => panorama.placeIds.includes(placeId));
}

export function findPanorama(id: string): Panorama | undefined {
  return PANORAMAS.find((panorama) => panorama.id === id);
}

/**
 * Curated words for listed places that need more than an open-data line.
 *
 * Written for places of worship where how to speak about the deity, and how
 * to behave, matters as much as the facts. Deities are described in words
 * only: the app never draws or animates them.
 */
export type PlaceNote = {
  heading: string;
  body: string;
  /** Visitor rules, stated as the site states them. */
  rules: string[];
  sources: { title: string; url: string }[];
};

const NOTES: Record<string, PlaceNote> = {
  'wd-Q380384': {
    heading: 'Who is worshipped here',
    body:
      'Pashupatinath is the temple of Lord Shiva as Pashupati, the lord and protector of all beings, and Nepal’s most revered Hindu shrine. He is worshipped as a lingam with four faces turned to the four directions, and a fifth, formless face turned upward. Daily worship is led by priests of a long-standing lineage from southern India, and on Maha Shivaratri pilgrims from across Nepal and India fill the precinct.',
    rules: [
      'Only Hindus may enter the main temple courtyard. Everyone may watch from the ghats and from the terraces across the Bagmati.',
      'No leather inside the precinct, including shoes, belts and bags.',
      'Photographing the sanctum is prohibited. Cremations on the ghats are private family rites: please do not photograph them.',
    ],
    sources: [
      { title: 'Pashupati Area Development Trust', url: 'https://pashupati.org.np/' },
      { title: 'Nepal Tourism Board: Pashupatinath', url: 'https://ntb.gov.np/' },
    ],
  },
};

export function placeNote(placeId: string): PlaceNote | undefined {
  return NOTES[placeId];
}

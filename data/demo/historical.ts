import type { HistoricalImage } from '@/types';

/**
 * Historical imagery for Then / Now.
 *
 * DEMONSTRATION DATA. None of these records carries an image file yet, so the
 * comparison renders a labelled placeholder in the "then" panel. That is the
 * intended state until archive material is cleared, not a gap to paper over —
 * §36's rule is that a neutral placeholder beats an invented fact, and an
 * invented photograph would be the worst version of an invented fact.
 *
 * The dates and captions below describe what each viewpoint *would* show, drawn
 * from the documented history of the site. They are framing, not claims about a
 * specific negative in a specific archive.
 *
 * To bring a record to life: clear the image, drop it in `assets/historical/`,
 * set `image: require(...)`, confirm the viewpoint against the vantage, and set
 * `viewpointConfirmed` accordingly. No component changes.
 */
export const demoHistoricalImages: HistoricalImage[] = [
  {
    id: 'maya-devi-1899',
    siteId: 'maya-devi-temple',
    vantageId: 'maya-devi-east-approach',
    date: 'c. 1899',
    caption:
      'The temple mound shortly after the site was cleared, before the modern shelter was built over the excavated brickwork.',
    sourceId: 'fuhrer-1896',
    // The east approach is a modern surveyed vantage; no late-19th-century
    // photograph was taken from a fixed point, so any pairing is approximate.
    viewpointConfirmed: false,
  },
  {
    id: 'maya-devi-1995',
    siteId: 'maya-devi-temple',
    vantageId: 'maya-devi-east-approach',
    date: '1995',
    capturedAt: '1995-01-01T00:00:00.000Z',
    caption:
      'The east elevation two years before World Heritage inscription, during the excavation season that exposed the marker stone.',
    sourceId: 'ldt-excavation',
    viewpointConfirmed: false,
  },
  {
    id: 'ashoka-pillar-1896',
    siteId: 'ashoka-pillar',
    vantageId: 'ashoka-pillar-south',
    date: '1896',
    caption:
      'The pillar as recorded at its rediscovery, the inscription panel still partly buried.',
    sourceId: 'fuhrer-1896',
    viewpointConfirmed: false,
  },
  {
    id: 'puskarini-1970s',
    siteId: 'puskarini-pond',
    vantageId: 'puskarini-north-step',
    date: 'c. 1975',
    caption: 'The tank before the terracing was restored, with the north steps partly collapsed.',
    sourceId: 'ldt-conservation',
    viewpointConfirmed: false,
  },
];

/** Oldest first — Then / Now reads forward through the record. */
export function historicalImagesForSite(siteId: string): HistoricalImage[] {
  return demoHistoricalImages.filter((image) => image.siteId === siteId);
}

export function findHistoricalImage(id: string): HistoricalImage | undefined {
  return demoHistoricalImages.find((image) => image.id === id);
}

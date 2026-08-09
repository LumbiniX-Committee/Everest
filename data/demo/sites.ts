import type { HeritageSite, Vantage } from '@/types';

/**
 * Demonstration data for the Lumbini sacred garden and monastic zone.
 *
 * These are real places with approximate coordinates, adequate for building and
 * testing the flow. They are NOT survey-grade, and the vantage points here are
 * illustrative rather than established viewpoints. Before any of this reaches a
 * real observer it must be replaced with Lumbini Development Trust survey data
 * and vantages fixed on site.
 *
 * The `sourceTier` field exists so provenance is visible in the UI rather than
 * implied — a community-reported site should never look like an excavated one.
 */

export const demoSites: HeritageSite[] = [
  {
    id: 'maya-devi-temple',
    name: 'Maya Devi Temple',
    nameNepali: 'मायादेवी मन्दिर',
    summary: 'The birthplace marker and the nativity sculpture',
    description:
      'The temple encloses the marker stone identified as the exact birthplace of the Buddha, together with the brick foundations of successive structures dating back to the third century BCE. The present shelter protects the excavated remains and the nativity relief.',
    coordinate: { latitude: 27.46924, longitude: 83.27581 },
    elevation: 105,
    sourceTier: 'archaeological',
    sourceIds: ['unesco-1997', 'ldt-excavation'],
    condition: 'watch',
    image: require('../../assets/plates/maya-devi-temple.aerial.jpg'),
    vantageIds: ['maya-devi-east-approach', 'maya-devi-pond-edge'],
  },
  {
    id: 'ashoka-pillar',
    name: 'Ashoka Pillar',
    nameNepali: 'अशोक स्तम्भ',
    summary: 'Third century BCE inscribed pillar',
    description:
      'Erected by Emperor Ashoka in 249 BCE, the pillar carries the inscription identifying Lumbini as the Buddha’s birthplace — the earliest surviving epigraphic evidence for the site.',
    coordinate: { latitude: 27.46905, longitude: 83.27614 },
    elevation: 105,
    sourceTier: 'archaeological',
    sourceIds: ['fuhrer-1896', 'rummindei-inscription'],
    condition: 'stable',
    vantageIds: ['ashoka-pillar-south'],
  },
  {
    id: 'puskarini-pond',
    name: 'Puskarini',
    nameNepali: 'पुष्करिणी',
    summary: 'The sacred bathing pond',
    description:
      'The stepped tank immediately south of the Maya Devi Temple, traditionally identified as the pool in which Maya Devi bathed before the birth. The terracing has been restored in stages.',
    coordinate: { latitude: 27.46886, longitude: 83.27575 },
    sourceTier: 'documented',
    sourceIds: ['ldt-conservation'],
    condition: 'open',
    vantageIds: ['puskarini-north-step'],
  },
  {
    id: 'bodhi-tree',
    name: 'The Bodhi Tree',
    summary: 'Pipal tree west of the temple',
    description:
      'A large pipal on the western edge of the sacred garden, hung with prayer flags and a focus for circumambulation. Root activity near the excavated brickwork is under periodic review.',
    coordinate: { latitude: 27.46939, longitude: 83.27529 },
    sourceTier: 'community',
    condition: 'watch',
    vantageIds: [],
  },
  {
    id: 'eternal-flame',
    name: 'Eternal Peace Flame',
    summary: 'Lit 1986, at the head of the central canal',
    description:
      'Lit in 1986 for the International Year of Peace, the flame stands at the northern head of the central canal that runs the length of the monastic zone.',
    coordinate: { latitude: 27.47418, longitude: 83.27594 },
    sourceTier: 'documented',
    condition: 'stable',
    vantageIds: [],
  },
  {
    id: 'world-peace-pagoda',
    name: 'World Peace Pagoda',
    summary: 'White stupa at the northern edge of the zone',
    description:
      'A Nipponzan-Myōhōji peace pagoda completed in 2001, standing beyond the northern boundary of the monastic zone. Its white surface weathers visibly with each monsoon.',
    coordinate: { latitude: 27.49015, longitude: 83.26758 },
    sourceTier: 'documented',
    condition: 'stable',
    vantageIds: [],
  },
];

export const demoVantages: Vantage[] = [
  {
    id: 'maya-devi-east-approach',
    siteId: 'maya-devi-temple',
    label: 'East approach',
    coordinate: { latitude: 27.46921, longitude: 83.27614 },
    bearing: 271,
    pitch: 4,
    positionToleranceM: 3,
    bearingToleranceDeg: 6,
    note: 'Frames the full east elevation with the pillar out of shot. Stand on the paving edge, not the grass.',
    seriesBegan: '2024-03-11T04:12:00.000Z',
  },
  {
    id: 'maya-devi-pond-edge',
    siteId: 'maya-devi-temple',
    label: 'Pond edge, south',
    coordinate: { latitude: 27.46893, longitude: 83.27578 },
    bearing: 3,
    pitch: 6,
    positionToleranceM: 2.5,
    bearingToleranceDeg: 5,
    note: 'Records the south wall and its reflection. Best in the hour after sunrise, before the water is disturbed.',
    seriesBegan: '2024-05-02T01:40:00.000Z',
  },
  {
    id: 'ashoka-pillar-south',
    siteId: 'ashoka-pillar',
    label: 'South face',
    coordinate: { latitude: 27.46888, longitude: 83.27615 },
    bearing: 358,
    pitch: 22,
    positionToleranceM: 2,
    bearingToleranceDeg: 4,
    note: 'The inscription panel. Tight tolerance — small changes in angle make the surface uncomparable.',
    seriesBegan: '2023-11-19T03:05:00.000Z',
  },
  {
    id: 'puskarini-north-step',
    siteId: 'puskarini-pond',
    label: 'North step',
    coordinate: { latitude: 27.46901, longitude: 83.27574 },
    bearing: 182,
    pitch: -8,
    positionToleranceM: 3,
    bearingToleranceDeg: 8,
    note: 'Looks down the terracing. Water level varies by season and is part of the record, not a fault.',
    seriesBegan: '2024-01-28T02:55:00.000Z',
  },
];

export function findSite(siteId: string): HeritageSite | undefined {
  return demoSites.find((site) => site.id === siteId);
}

export function findVantage(vantageId: string): Vantage | undefined {
  return demoVantages.find((vantage) => vantage.id === vantageId);
}

export function vantagesForSite(siteId: string): Vantage[] {
  return demoVantages.filter((vantage) => vantage.siteId === siteId);
}

import type { Source } from '@/types';

/**
 * The source registry.
 *
 * One record per source, cited by id from anywhere — a Dhamma answer, a site
 * description, a historical photograph. Heritage and Dhamma deliberately draw
 * from the same table, so a reader learns one way of judging evidence and uses
 * it on both surfaces.
 *
 * Editorial rule for this file: a source is a real, checkable publication or
 * artefact. Nothing invented, and no filled-in page numbers or dates that have
 * not been verified — an unverified `reference` is worse than none, because it
 * looks like precision. Where a reading is contested, `caveat` says so.
 */
export const demoSources: Source[] = [
  {
    id: 'rummindei-inscription',
    kind: 'inscription',
    title: 'Rummindei pillar inscription',
    attribution: 'Emperor Ashoka; translated by E. Hultzsch',
    date: '249 BCE (translation 1925)',
    reference: 'Inscriptions of Asoka, Corpus Inscriptionum Indicarum vol. I',
    caveat:
      'The inscription records what was believed in 249 BCE, roughly two centuries after the events it commemorates. It is testimony, not a contemporaneous record.',
  },
  {
    id: 'dn-16',
    kind: 'sutta',
    title: 'Mahāparinibbāna Sutta',
    attribution: 'Dīgha Nikāya 16, Pali Canon',
    caveat:
      'Translations vary considerably in the urgency they give to appamāda. Comparing two or three is worthwhile.',
  },
  {
    id: 'sn-11-3',
    kind: 'sutta',
    title: 'Dhajagga Sutta',
    attribution: 'Saṃyutta Nikāya 11.3, Pali Canon',
    caveat:
      'The ehipassiko formula occurs in many places in the canon; this is one of the more commonly cited.',
  },
  {
    id: 'monier-williams',
    kind: 'commentary',
    title: 'A Sanskrit–English Dictionary',
    attribution: 'Monier Monier-Williams',
    date: '1899',
    reference: 's.v. sākṣin',
  },
  {
    id: 'unesco-1997',
    kind: 'record',
    title: 'Lumbini, the Birthplace of the Lord Buddha — World Heritage inscription',
    attribution: 'UNESCO World Heritage Centre',
    date: '1997',
    reference: 'Criterion (iii), (vi)',
    url: 'https://whc.unesco.org/en/list/666/',
  },
  {
    id: 'ldt-excavation',
    kind: 'archaeological',
    title: 'Maya Devi Temple excavation records',
    attribution: 'Lumbini Development Trust',
    caveat:
      'Demonstration reference. Specific report titles, dates and plate numbers must be confirmed with the Trust before this ships.',
  },
  {
    id: 'fuhrer-1896',
    kind: 'archaeological',
    title: 'Report on the rediscovery of the Ashokan pillar at Rummindei',
    attribution: 'Alois Anton Führer',
    date: '1896',
    caveat:
      'Führer was later discredited for fabrications elsewhere in his work. The pillar and its inscription have been independently confirmed many times since; his wider reporting has not.',
  },
  {
    id: 'ldt-conservation',
    kind: 'survey',
    title: 'Sacred Garden conservation assessments',
    attribution: 'Lumbini Development Trust',
    caveat:
      'Demonstration reference. Replace with the specific assessment and its date before release.',
  },
];

export function findSource(id: string): Source | undefined {
  return demoSources.find((source) => source.id === id);
}

/** Resolves a list of ids, dropping any that do not exist. */
export function resolveSources(ids: readonly string[]): Source[] {
  return ids.map(findSource).filter((source): source is Source => source != null);
}

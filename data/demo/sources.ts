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
  {
    id: 'mukherji-1901',
    kind: 'archaeological',
    title: 'A Report on a Tour of Exploration of the Antiquities in the Tarai, Nepal',
    attribution: 'P. C. Mukherji, Archaeological Survey of India (Imperial Series XXVI, Part 1)',
    date: '1901 (survey December 1899)',
    reference: 'Plates XVIII–XX',
    url: 'https://archive.org/details/bub_gb_5iYXAAAAYAAJ',
    caveat:
      'Public domain. Mukherji re-surveyed Rummindei after Führer’s discredited reporting; his plates and measured plans are the primary photographic record of the site at rediscovery.',
  },

  // ── Conservation doctrine & Kathmandu Valley heritage ───────────────────
  // Added alongside the Pali canon so the Dhamma engine can ground a
  // conservation or Kathmandu Valley heritage question the same way it
  // grounds a question about the suttas — a real, checkable text, cited by
  // segment, or a refusal. See core/dhamma/heritage.ts.
  {
    id: 'venice-1964',
    kind: 'record',
    title: 'International Charter for the Conservation and Restoration of Monuments and Sites (the Venice Charter)',
    attribution: 'IInd International Congress of Architects and Technicians of Historic Monuments; adopted by ICOMOS, 1965',
    date: '1964',
    reference: 'Articles 1–16',
    url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
    caveat: 'Reproduced by ICOMOS for quotation with attribution; not independently CC-licensed.',
  },
  {
    id: 'burra-2013',
    kind: 'record',
    title: 'The Burra Charter: The Australia ICOMOS Charter for Places of Cultural Significance, 2013',
    attribution: 'Australia ICOMOS Incorporated',
    date: '2013 (first adopted 1979, at Burra, South Australia)',
    reference: 'Articles 1–34',
    url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
    caveat: 'May be quoted in part with citation and acknowledgement, per the Charter’s own terms.',
  },
  {
    id: 'unesco-kv-1979',
    kind: 'record',
    title: 'Kathmandu Valley — World Heritage inscription',
    attribution: 'UNESCO World Heritage Centre',
    date: '1979 (3rd Session); inscribed as Property 121, ref. 120bis',
    reference: 'Criteria (iii), (iv), (vi)',
    url: 'https://whc.unesco.org/en/list/121/',
    caveat:
      'Seven monument zones (Durbar Squares of Kathmandu, Patan and Bhaktapur; Swayambhu; Boudhanath; Pashupatinath; Changu Narayan). Placed on the List of World Heritage in Danger in 2003 over loss of authenticity, delisted 2007. Exact OUV wording should be confirmed against the live WHC listing before this ships.',
  },
  {
    id: 'changu-manadeva-inscription',
    kind: 'inscription',
    title: 'Pillar inscription of King Mānadeva, Changu Narayan',
    attribution: 'Mānadeva I; first transcribed by Georg Bühler and Bhagwanlal Indraji, 1885',
    date: 'c. 464–505 CE (Licchavi period)',
    reference: 'D. R. Regmi, Inscriptions of Ancient Nepal (1983)',
    caveat:
      'Among the oldest surviving dated inscriptions from the Kathmandu Valley. Precise verse-by-verse text should be checked against Regmi’s edition before a full transcription ships.',
  },
  {
    id: 'slusser-1982',
    kind: 'archaeological',
    title: 'Nepal Mandala: A Cultural Study of the Kathmandu Valley',
    attribution: 'Mary Shepherd Slusser',
    date: '1982',
    reference: 'Princeton University Press',
    caveat:
      'The standard scholarly reference for Newar architecture and the valley’s dhunge dhara (stone spout) water system. Facts here are relayed from secondary summaries; direct page citations should be confirmed against the volume before this ships.',
  },
  {
    id: 'doa-nepal',
    kind: 'record',
    title: 'Department of Archaeology, Government of Nepal',
    attribution: 'Department of Archaeology, Ministry of Culture, Tourism and Civil Aviation',
    date: 'established 1953',
    caveat: 'Nepal’s heritage authority; led post-2015-earthquake damage assessment and reconstruction of monuments.',
  },
];

export function findSource(id: string): Source | undefined {
  return demoSources.find((source) => source.id === id);
}

/** Resolves a list of ids, dropping any that do not exist. */
export function resolveSources(ids: readonly string[]): Source[] {
  return ids.map(findSource).filter((source): source is Source => source != null);
}

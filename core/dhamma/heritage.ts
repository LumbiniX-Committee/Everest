/**
 * core/dhamma/heritage.ts
 *
 * The heritage/conservation corpus — the second half of the Dhamma engine's
 * widening from "a Buddhist chatbot" to "a source-grounded interpretation
 * engine that refuses when it cannot cite." Same mechanism, wider subject
 * matter: a conservation or Kathmandu Valley heritage question now resolves
 * to a real, checkable passage — an ICOMOS charter article, a UNESCO
 * inscription record, a dated inscription, an archaeological source — cited
 * by segment, exactly as `bilara.ts` already does for the Pali canon.
 *
 * ── Why hand-written rather than a `fetch-heritage.mjs` generator ──────────
 *
 * `tools/fetch-bilara.mjs` works because bilara-data exposes one canonical
 * text per segment ID through a stable JSON API — there is nothing to curate,
 * only to retrieve. No equivalent exists here. The Venice and Burra Charters
 * are stable PDFs (verified against icomos.org and australia.icomos.org while
 * building this file — full text below is transcribed from those, not
 * paraphrased); a UNESCO World Heritage listing, a pillar inscription's
 * dating, and a monument's earthquake-reconstruction history are facts drawn
 * from named, checkable secondary sources (UNESCO, Regmi, Slusser, the
 * Department of Archaeology), not a single machine-readable feed. Writing a
 * script that "fetches" two PDFs and hand-curates the rest would be the same
 * curation work wearing a fetcher's clothes — so this follows the precedent
 * `CANONICAL_CHUNKS` already sets in `bilara.ts`: a small, hand-verified seed
 * set, committed rather than generated, for exactly the same reason — offline
 * reliability and a known-good demo.
 *
 * Every chunk's `source_id` resolves in `data/demo/sources.ts`. `uid` is set
 * equal to `source_id` by convention, so a citation resolves to a real source
 * card through the existing fallback in `services/dhamma/index.ts`
 * (`sourceIdFor`) without that file needing to change.
 */

import type { BilaraChunk } from './bilara.ts';

export const HERITAGE_CHUNKS: BilaraChunk[] = [
  // ── Venice Charter 1964 — full text verified against icomos.org ─────────
  {
    chunk_id: 'venice-1964:art1',
    uid: 'venice-1964',
    collection: 'charter',
    segments: ['venice-1964:art1'],
    corpus: 'heritage',
    pali: '',
    english:
      'The concept of a historic monument embraces not only the single architectural work but also the urban or rural setting in which is found the evidence of a particular civilization, a significant development or a historic event. This applies not only to great works of art but also to more modest works of the past which have acquired cultural significance with the passing of time.',
    translator: 'ICOMOS',
    title_pi: '',
    title_en: 'Venice Charter, Article 1 — Definitions',
    license: 'ICOMOS 1964/1965 — quotation with attribution permitted',
    source_id: 'venice-1964',
    source_url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
  },
  {
    chunk_id: 'venice-1964:art3',
    uid: 'venice-1964',
    collection: 'charter',
    segments: ['venice-1964:art3'],
    corpus: 'heritage',
    pali: '',
    english:
      'The intention in conserving and restoring monuments is to safeguard them no less as works of art than as historical evidence.',
    translator: 'ICOMOS',
    title_pi: '',
    title_en: 'Venice Charter, Article 3 — Conservation',
    license: 'ICOMOS 1964/1965 — quotation with attribution permitted',
    source_id: 'venice-1964',
    source_url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
  },
  {
    chunk_id: 'venice-1964:art6',
    uid: 'venice-1964',
    collection: 'charter',
    segments: ['venice-1964:art6'],
    corpus: 'heritage',
    pali: '',
    english:
      'The conservation of a monument implies preserving a setting which is not out of scale. Wherever the traditional setting exists, it must be kept. No new construction, demolition or modification which would alter the relations of mass and colour must be allowed.',
    translator: 'ICOMOS',
    title_pi: '',
    title_en: 'Venice Charter, Article 6 — Setting',
    license: 'ICOMOS 1964/1965 — quotation with attribution permitted',
    source_id: 'venice-1964',
    source_url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
  },
  {
    chunk_id: 'venice-1964:art9',
    uid: 'venice-1964',
    collection: 'charter',
    segments: ['venice-1964:art9'],
    corpus: 'heritage',
    pali: '',
    english:
      'The process of restoration is a highly specialized operation. Its aim is to preserve and reveal the aesthetic and historic value of the monument and is based on respect for original material and authentic documents. It must stop at the point where conjecture begins, and in this case moreover any extra work which is indispensable must be distinct from the architectural composition and must bear a contemporary stamp. The restoration in any case must be preceded and followed by an archaeological and historical study of the monument.',
    translator: 'ICOMOS',
    title_pi: '',
    title_en: 'Venice Charter, Article 9 — Restoration',
    license: 'ICOMOS 1964/1965 — quotation with attribution permitted',
    source_id: 'venice-1964',
    source_url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
  },
  {
    chunk_id: 'venice-1964:art11',
    uid: 'venice-1964',
    collection: 'charter',
    segments: ['venice-1964:art11'],
    corpus: 'heritage',
    pali: '',
    english:
      'The valid contributions of all periods to the building of a monument must be respected, since unity of style is not the aim of a restoration. When a building includes the superimposed work of different periods, the revealing of the underlying state can only be justified in exceptional circumstances.',
    translator: 'ICOMOS',
    title_pi: '',
    title_en: 'Venice Charter, Article 11 — Restoration',
    license: 'ICOMOS 1964/1965 — quotation with attribution permitted',
    source_id: 'venice-1964',
    source_url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
  },
  {
    chunk_id: 'venice-1964:art12',
    uid: 'venice-1964',
    collection: 'charter',
    segments: ['venice-1964:art12'],
    corpus: 'heritage',
    pali: '',
    english:
      'Replacements of missing parts must integrate harmoniously with the whole, but at the same time must be distinguishable from the original so that restoration does not falsify the artistic or historic evidence.',
    translator: 'ICOMOS',
    title_pi: '',
    title_en: 'Venice Charter, Article 12 — Restoration',
    license: 'ICOMOS 1964/1965 — quotation with attribution permitted',
    source_id: 'venice-1964',
    source_url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
  },
  {
    chunk_id: 'venice-1964:art15',
    uid: 'venice-1964',
    collection: 'charter',
    segments: ['venice-1964:art15'],
    corpus: 'heritage',
    pali: '',
    english:
      'Excavations should be carried out in accordance with scientific standards. Ruins must be maintained and measures necessary for the permanent conservation and protection of architectural features and of objects discovered must be taken. All reconstruction work should however be ruled out "a priori". Only anastylosis, that is to say, the reassembling of existing but dismembered parts, can be permitted. The material used for integration should always be recognizable.',
    translator: 'ICOMOS',
    title_pi: '',
    title_en: 'Venice Charter, Article 15 — Excavations',
    license: 'ICOMOS 1964/1965 — quotation with attribution permitted',
    source_id: 'venice-1964',
    source_url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
  },
  {
    chunk_id: 'venice-1964:art16',
    uid: 'venice-1964',
    collection: 'charter',
    segments: ['venice-1964:art16'],
    corpus: 'heritage',
    pali: '',
    english:
      'In all works of preservation, restoration or excavation, there should always be precise documentation in the form of analytical and critical reports, illustrated with drawings and photographs. This record should be placed in the archives of a public institution and made available to research workers. It is recommended that the report should be published.',
    translator: 'ICOMOS',
    title_pi: '',
    title_en: 'Venice Charter, Article 16 — Publication',
    license: 'ICOMOS 1964/1965 — quotation with attribution permitted',
    source_id: 'venice-1964',
    source_url: 'https://www.icomos.org/images/DOCUMENTS/Charters/venice_e.pdf',
  },

  // ── Burra Charter 2013 — full text verified against australia.icomos.org
  {
    chunk_id: 'burra-2013:art1.7',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art1.7'],
    corpus: 'heritage',
    pali: '',
    english:
      'Restoration means returning a place to a known earlier state by removing accretions or by reassembling existing elements without the introduction of new material.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 1.7 — Definitions: Restoration',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art1.8',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art1.8'],
    corpus: 'heritage',
    pali: '',
    english:
      'Reconstruction means returning a place to a known earlier state and is distinguished from restoration by the introduction of new material.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 1.8 — Definitions: Reconstruction',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art3.1',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art3.1'],
    corpus: 'heritage',
    pali: '',
    english:
      'Conservation is based on a respect for the existing fabric, use, associations and meanings. It requires a cautious approach of changing as much as necessary but as little as possible.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 3.1 — Cautious approach',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art3.2',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art3.2'],
    corpus: 'heritage',
    pali: '',
    english: 'Changes to a place should not distort the physical or other evidence it provides, nor be based on conjecture.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 3.2 — Cautious approach',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art19',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art19'],
    corpus: 'heritage',
    pali: '',
    english: 'Restoration is appropriate only if there is sufficient evidence of an earlier state of the fabric.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 19 — Restoration',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art20.1',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art20.1'],
    corpus: 'heritage',
    pali: '',
    english:
      'Reconstruction is appropriate only where a place is incomplete through damage or alteration, and only where there is sufficient evidence to reproduce an earlier state of the fabric. In some cases, reconstruction may also be appropriate as part of a use or practice that retains the cultural significance of the place.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 20.1 — Reconstruction',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art20.2',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art20.2'],
    corpus: 'heritage',
    pali: '',
    english: 'Reconstruction should be identifiable on close inspection or through additional interpretation.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 20.2 — Reconstruction',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art25',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art25'],
    corpus: 'heritage',
    pali: '',
    english:
      'The cultural significance of many places is not readily apparent, and should be explained by interpretation. Interpretation should enhance understanding and engagement, and be culturally appropriate.', // lint-vocab:allow — verbatim Burra Charter Art. 25; "engagement" here is the charter's own word, not gamification copy
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 25 — Interpretation',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art26.1',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art26.1'],
    corpus: 'heritage',
    pali: '',
    english:
      'Work on a place should be preceded by studies to understand the place which should include analysis of physical, documentary, oral and other evidence, drawing on appropriate knowledge, skills and disciplines.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 26.1 — Applying the Burra Charter Process',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },
  {
    chunk_id: 'burra-2013:art27.2',
    uid: 'burra-2013',
    collection: 'charter',
    segments: ['burra-2013:art27.2'],
    corpus: 'heritage',
    pali: '',
    english: 'Existing fabric, use, associations and meanings should be adequately recorded before and after any changes are made to the place.',
    translator: 'Australia ICOMOS',
    title_pi: '',
    title_en: 'Burra Charter, Article 27.2 — Managing change',
    license: 'Australia ICOMOS 2013 — quotation with citation and acknowledgement permitted',
    source_id: 'burra-2013',
    source_url: 'https://australia.icomos.org/wp-content/uploads/The-Burra-Charter-2013-Adopted-31.10.2013.pdf',
  },

  // ── UNESCO World Heritage — Lumbini (666) and Kathmandu Valley (120bis) ──
  {
    chunk_id: 'unesco-1997:criteria',
    uid: 'unesco-1997',
    collection: 'whs',
    segments: ['unesco-1997:criteria'],
    corpus: 'heritage',
    pali: '',
    english:
      'Lumbini, the Birthplace of the Lord Buddha, was inscribed on the UNESCO World Heritage List in 1997 (21st Session) under cultural criteria (iii) and (vi), recognising it as a place of exceptional testimony to a living tradition, and as directly associated with an event of outstanding universal significance: the birth of the Buddha.',
    translator: 'UNESCO World Heritage Centre',
    title_pi: '',
    title_en: 'Lumbini, the Birthplace of the Lord Buddha — World Heritage inscription',
    license: '© UNESCO — reference use',
    source_id: 'unesco-1997',
    source_url: 'https://whc.unesco.org/en/list/666/',
  },
  {
    chunk_id: 'unesco-kv-1979:zones',
    uid: 'unesco-kv-1979',
    collection: 'whs',
    segments: ['unesco-kv-1979:zones'],
    corpus: 'heritage',
    pali: '',
    english:
      'The Kathmandu Valley was inscribed on the UNESCO World Heritage List in 1979 as a single property (ref. 120bis) comprising seven monument zones: the Durbar Squares of Kathmandu (Hanuman Dhoka), Patan and Bhaktapur; the stupas of Swayambhu and Boudhanath; and the temples of Pashupatinath and Changu Narayan.',
    translator: 'UNESCO World Heritage Centre',
    title_pi: '',
    title_en: 'Kathmandu Valley — World Heritage inscription, the seven monument zones',
    license: '© UNESCO — reference use',
    source_id: 'unesco-kv-1979',
    source_url: 'https://whc.unesco.org/en/list/121/',
  },
  {
    chunk_id: 'unesco-kv-1979:danger-list',
    uid: 'unesco-kv-1979',
    collection: 'whs',
    segments: ['unesco-kv-1979:danger-list'],
    corpus: 'heritage',
    pali: '',
    english:
      'The Kathmandu Valley was placed on the List of World Heritage in Danger in 2003, UNESCO citing concern about "the ongoing loss of authenticity and the outstanding universal value of the cultural property." The property was removed from the danger list in 2007 after conservation and management improvements.',
    translator: 'UNESCO World Heritage Centre',
    title_pi: '',
    title_en: 'Kathmandu Valley — World Heritage in Danger listing, 2003–2007',
    license: '© UNESCO — reference use',
    source_id: 'unesco-kv-1979',
    source_url: 'https://whc.unesco.org/en/list/121/',
  },

  // ── Archaeology & site records — Kathmandu Valley ────────────────────────
  {
    chunk_id: 'changu-manadeva-inscription:date',
    uid: 'changu-manadeva-inscription',
    collection: 'inscription',
    segments: ['changu-manadeva-inscription:date'],
    corpus: 'heritage',
    pali: '',
    english:
      'The pillar inscription of King Mānadeva at Changu Narayan dates from his reign, c. 464–505 CE, and is among the oldest surviving dated inscriptions in the Kathmandu Valley. It was first transcribed and published in 1885 by Georg Bühler and Bhagwanlal Indraji.',
    translator: 'D. R. Regmi (transcription); Bühler & Indraji (1885)',
    title_pi: '',
    title_en: 'Changu Narayan — the Mānadeva pillar inscription',
    license: 'Reference use — see caveat in the source registry',
    source_id: 'changu-manadeva-inscription',
  },
  {
    chunk_id: 'changu-narayan:earthquake-2015',
    uid: 'doa-nepal',
    collection: 'archaeology',
    segments: ['changu-narayan:earthquake-2015'],
    corpus: 'heritage',
    pali: '',
    english:
      'Changu Narayan temple, one of the seven Kathmandu Valley monument zones, was destroyed in the April 2015 Nepal earthquake. Reconstruction, carried out with international technical support, was completed roughly five years later — a monitoring gap the temple shares with every other severely damaged monument in the valley.',
    translator: 'Department of Archaeology, Nepal',
    title_pi: '',
    title_en: 'Changu Narayan — 2015 earthquake damage and reconstruction',
    license: 'Reference use — see caveat in the source registry',
    source_id: 'doa-nepal',
  },
  {
    chunk_id: 'patan-durbar-square:construction',
    uid: 'slusser-1982',
    collection: 'archaeology',
    segments: ['patan-durbar-square:construction'],
    corpus: 'heritage',
    pali: '',
    english:
      'Patan Durbar Square took most of its present form under the Malla kings of Lalitpur in the 17th century. King Siddhi Narsingh Malla built the Krishna Mandir in 1667 and the Vishwanath Temple in 1627; his son Srinivasa Malla built the Bhimsen Temple in 1680. The Taleju Bhawani Temple was built in 1640 and rebuilt in 1667.',
    translator: 'Mary Shepherd Slusser',
    title_pi: '',
    title_en: 'Patan Durbar Square — Malla-era construction',
    license: 'Reference use — see caveat in the source registry',
    source_id: 'slusser-1982',
  },
  {
    chunk_id: 'patan-durbar-square:earthquake-2015',
    uid: 'doa-nepal',
    collection: 'archaeology',
    segments: ['patan-durbar-square:earthquake-2015'],
    corpus: 'heritage',
    pali: '',
    english:
      'Patan Durbar Square was heavily damaged in the April 2015 earthquake; the Hari Shankar Temple collapsed completely. Its restoration was completed in 2023 — eight years after the damage, and eight years during which the square\'s condition changed in ways no fixed monitoring programme was recording continuously.',
    translator: 'Department of Archaeology, Nepal',
    title_pi: '',
    title_en: 'Patan Durbar Square — 2015 earthquake damage and reconstruction',
    license: 'Reference use — see caveat in the source registry',
    source_id: 'doa-nepal',
  },
  {
    chunk_id: 'dhunge-dhara:origin',
    uid: 'slusser-1982',
    collection: 'archaeology',
    segments: ['dhunge-dhara:origin'],
    corpus: 'heritage',
    pali: '',
    english:
      'Dhunge dhara (hiti) are carved stone water spouts fed by underground infiltration chambers and stone conduits, a technology dating to the Licchavi period (c. 400–750 CE). Manga Hiti at Mangal Bazar in Patan, built in 570 CE, is considered the oldest working dhunge dhara on record. The last was built in 1829.',
    translator: 'Mary Shepherd Slusser',
    title_pi: '',
    title_en: 'Dhunge dhara — origin of the Kathmandu Valley stone-spout water system',
    license: 'Reference use — see caveat in the source registry',
    source_id: 'slusser-1982',
  },
  {
    chunk_id: 'dhunge-dhara:decline',
    uid: 'slusser-1982',
    collection: 'archaeology',
    segments: ['dhunge-dhara:decline'],
    corpus: 'heritage',
    pali: '',
    english:
      'A 2019 survey recorded 573 dhunge dharas across the Kathmandu Valley\'s municipalities. Of these, 94 had already been lost entirely, and only 224 of the remaining 479 still produced water. This decline followed the introduction of piped municipal water from 1891 onward, and it is largely undocumented outside occasional surveys — visibly dying infrastructure nobody is continuously watching.',
    translator: 'Mary Shepherd Slusser',
    title_pi: '',
    title_en: 'Dhunge dhara — the 2019 survey and the scale of loss',
    license: 'Reference use — see caveat in the source registry',
    source_id: 'slusser-1982',
  },
  {
    chunk_id: 'doa-nepal:role',
    uid: 'doa-nepal',
    collection: 'record',
    segments: ['doa-nepal:role'],
    corpus: 'heritage',
    pali: '',
    english:
      'Nepal\'s Department of Archaeology, established in 1953, is the government authority responsible for protected monuments. After the April and May 2015 earthquakes, it led the analysis and reconstruction of damaged heritage buildings across the country, including the Kathmandu Valley\'s monument zones.',
    translator: 'Department of Archaeology, Nepal',
    title_pi: '',
    title_en: 'Department of Archaeology, Nepal — role and post-2015 reconstruction',
    license: 'Reference use — see caveat in the source registry',
    source_id: 'doa-nepal',
  },
];

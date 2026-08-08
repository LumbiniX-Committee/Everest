/**
 * Dhamma demonstration content.
 *
 * The governing rule for this surface: nothing is asserted without a source.
 * Every entry carries citations the reader can check, and where a rendering is
 * contested the entry says so. Paraphrase is marked as paraphrase.
 *
 * Public-domain translations only. The Pali quotations below are from editions
 * long out of copyright; anything newer needs clearance before it ships.
 *
 * Citations point into `data/demo/sources.ts` rather than carrying their own
 * prose. That indirection is the point: the same inscription cited here and on
 * a site detail screen resolves to one record, so it cannot drift into two
 * slightly different descriptions of the same artefact, and a correction lands
 * in one place.
 */

import type { Citation } from '@/types';

export type DhammaEntry = {
  id: string;
  /** The question a visitor actually asks, in their words. */
  question: string;
  /** A direct answer. Short. No embellishment. */
  answer: string;
  /** Non-empty. An entry without a source does not ship. */
  citations: Citation[];
  /** Pali or Sanskrit line, where one anchors the answer. */
  original?: string;
  /**
   * A caveat specific to this answer. Caveats belonging to the source itself
   * live on the Source record and are rendered from there, so they are stated
   * once wherever that source appears.
   */
  caveat?: string;
  /** Offered after the answer has been read. Optional to take up. */
  reflectionPrompt?: string;
};

export const demoDhammaEntries: DhammaEntry[] = [
  {
    id: 'why-lumbini',
    question: 'Why is Lumbini the birthplace?',
    answer:
      'Because Ashoka said so on site, in stone, in 249 BCE. His pillar inscription records that he came in person, and that the village was made tax-exempt because "here the Buddha was born". It is the earliest physical evidence for any event in the Buddha\'s life.',
    citations: [{ sourceId: 'rummindei-inscription' }],
    original: 'hida budhe jāte sākyamunīti',
    reflectionPrompt:
      'The stone records a belief held two centuries after the event. What would you accept as evidence of something that far back?',
  },
  {
    id: 'appamada',
    question: 'What does appamādena sampādetha mean?',
    answer:
      'It is usually rendered "strive on with diligence" or "accomplish your purpose without negligence". Appamāda is the opposite of letting things slide — sustained, unglamorous attention. Tradition holds these were the Buddha\'s last words.',
    citations: [{ sourceId: 'dn-16' }],
    original: 'vayadhammā saṅkhārā, appamādena sampādetha',
    reflectionPrompt: 'Where in the last week did you let something slide that mattered?',
  },
  {
    id: 'what-is-sakshi',
    question: 'What does sākṣī mean?',
    answer:
      'A witness — one who sees directly and can testify to it. The word carries the sense of first-hand presence rather than report. The app takes the name literally: you go, you look, you record what is there.',
    citations: [{ sourceId: 'monier-williams' }],
  },
  {
    id: 'ehipassiko',
    question: 'Am I meant to take this on faith?',
    answer:
      'The traditional description of the teaching is ehipassiko — "come and see". It invites checking rather than assent. That is also why every answer on this surface carries a citation you can go and read.',
    citations: [{ sourceId: 'sn-11-3' }],
    original: 'ehipassiko opanayiko paccattaṃ veditabbo viññūhi',
  },
];

export function findDhammaEntry(id: string): DhammaEntry | undefined {
  return demoDhammaEntries.find((entry) => entry.id === id);
}

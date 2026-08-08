/**
 * Dhamma demonstration content.
 *
 * The governing rule for this surface: nothing is asserted without a source.
 * Every entry carries a citation the reader can check, and where a rendering is
 * contested the entry says so. Paraphrase is marked as paraphrase.
 *
 * Public-domain translations only. The Pali quotations below are from editions
 * long out of copyright; anything newer needs clearance before it ships.
 */

export type DhammaSourceKind = 'sutta' | 'inscription' | 'commentary';

export type DhammaEntry = {
  id: string;
  /** The question a visitor actually asks, in their words. */
  question: string;
  /** A direct answer. Short. No embellishment. */
  answer: string;
  /** Where the answer comes from. Required — an entry without one does not ship. */
  citation: string;
  kind: DhammaSourceKind;
  /** Pali or Sanskrit line, where one anchors the answer. */
  original?: string;
  /** Stated plainly when scholarship is not settled. */
  caveat?: string;
};

export const demoDhammaEntries: DhammaEntry[] = [
  {
    id: 'why-lumbini',
    question: 'Why is Lumbini the birthplace?',
    answer:
      'Because Ashoka said so on site, in stone, in 249 BCE. His pillar inscription records that he came in person, and that the village was made tax-exempt because "here the Buddha was born". It is the earliest physical evidence for any event in the Buddha\'s life.',
    citation: 'Rummindei pillar inscription, translated by Hultzsch, Inscriptions of Asoka, 1925.',
    kind: 'inscription',
    original: 'hida budhe jāte sākyamunīti',
    caveat:
      'The inscription fixes what was believed in 249 BCE — roughly two centuries after the event. It is testimony, not a birth record.',
  },
  {
    id: 'appamada',
    question: 'What does appamādena sampādetha mean?',
    answer:
      'It is usually rendered "strive on with diligence" or "accomplish your purpose without negligence". Appamāda is the opposite of letting things slide — sustained, unglamorous attention. Tradition holds these were the Buddha\'s last words.',
    citation: 'Mahāparinibbāna Sutta, Dīgha Nikāya 16.',
    kind: 'sutta',
    original: 'vayadhammā saṅkhārā, appamādena sampādetha',
    caveat: 'Translations vary in how much urgency they place on appamāda. Compare several.',
  },
  {
    id: 'what-is-sakshi',
    question: 'What does sākṣī mean?',
    answer:
      'A witness — one who sees directly and can testify to it. The word carries the sense of first-hand presence rather than report. The app takes the name literally: you go, you look, you record what is there.',
    citation: 'Monier-Williams, Sanskrit–English Dictionary, 1899, s.v. sākṣin.',
    kind: 'commentary',
  },
  {
    id: 'ehipassiko',
    question: 'Am I meant to take this on faith?',
    answer:
      'The traditional description of the teaching is ehipassiko — "come and see". It invites checking rather than assent. That is also why every answer on this surface carries a citation you can go and read.',
    citation: 'Dhajagga Sutta, Saṃyutta Nikāya 11.3, among many occurrences of the formula.',
    kind: 'sutta',
    original: 'ehipassiko opanayiko paccattaṃ veditabbo viññūhi',
  },
];

export function findDhammaEntry(id: string): DhammaEntry | undefined {
  return demoDhammaEntries.find((entry) => entry.id === id);
}

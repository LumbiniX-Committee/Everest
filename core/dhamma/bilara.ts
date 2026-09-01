/**
 * core/dhamma/bilara.ts
 *
 * SuttaCentral / Bilara-data canonical corpus parser & chunking infrastructure.
 *
 * Implements segment-aligned chunking over canonical Pali texts (DN, MN, SN, AN, Dhp)
 * preserving immutable segment IDs (e.g. dn16:6.7.1) for sub-sutta citation resolution.
 * CC0 license attribution per SuttaCentral guidelines.
 */

export type BilaraChunk = {
  chunk_id: string;
  uid: string;
  collection: 'dn' | 'mn' | 'sn' | 'an' | 'kn/dhp' | string;
  segments: string[];
  pali: string;
  english: string;
  translator: string;
  title_pi: string;
  title_en: string;
  license: string;
  /**
   * 'heritage' marks a chunk from the conservation/heritage corpus (charters,
   * WHS records, archaeology, law) rather than the Pali canon. Absent (or
   * 'pali') is the original corpus this type was built for — every existing
   * chunk and every consumer of `pali`/`title_pi` predates this field, so it
   * defaults to the old behaviour rather than requiring every call site to
   * branch on it.
   */
  corpus?: 'pali' | 'heritage';
  /**
   * Keys into `data/demo/sources.ts` — the app's shared source registry, so a
   * heritage citation resolves to a real, checkable source card the same way
   * a Dhamma citation resolves to a sutta (see `sourceIdFor` in
   * services/dhamma/index.ts, which already falls back to a chunk's `uid` and
   * so needs no change: a heritage chunk's `uid` is set to its `source_id`).
   */
  source_id?: string;
  source_url?: string;
};

/** Seed canonical corpus chunks for offline execution & offline RAG indexing */
import { GENERATED_CHUNKS } from './corpus.generated.ts';
import { HERITAGE_CHUNKS } from './heritage.ts';

export const CANONICAL_CHUNKS: BilaraChunk[] = [
  {
    chunk_id: 'dn16:5.8',
    uid: 'dn16',
    collection: 'dn',
    segments: ['dn16:5.8.1', 'dn16:5.8.2', 'dn16:5.8.3'],
    pali: 'Cattārimāni ānanda saddhassa kulaputtassa dassanīyāni saṃvejanīyāni ṭhānāni. Katamāni cattāri? Idha tathāgato jāto…',
    english: 'Ānanda, there are these four places that a faithful person should see and feel awe for. What four? "Here the Tathāgata was born" — this is a place a faithful person should see and feel awe for.',
    translator: 'Bhikkhu Sujato',
    title_pi: 'Mahāparinibbānasutta',
    title_en: "The Great Discourse on the Buddha's Extinguishment",
    license: 'CC0-1.0',
  },
  {
    chunk_id: 'dn16:6.7',
    uid: 'dn16',
    collection: 'dn',
    segments: ['dn16:6.7.1', 'dn16:6.7.2'],
    pali: 'Handa dāni bhikkhave āmantayāmi vo: Vayadhammā saṅkhārā appamādena sampādethā’ti. Ayaṃ tathāgatassa pacchimā vācā.',
    english: 'Come now, mendicants, I declare to you: all conditioned things are subject to decay. Strive with diligence! This was the Tathāgata’s last word.',
    translator: 'Bhikkhu Sujato',
    title_pi: 'Mahāparinibbānasutta',
    title_en: "The Great Discourse on the Buddha's Extinguishment",
    license: 'CC0-1.0',
  },
  {
    chunk_id: 'sn56.11:1.1',
    uid: 'sn56.11',
    collection: 'sn',
    segments: ['sn56.11:1.1.1', 'sn56.11:1.1.2'],
    pali: 'Dveme bhikkhave antā pabbajitena na sevitabbā. Katame dve? Yo cāyaṃ kāmesu kāmasukhallikānuyogo…',
    english: 'Mendicants, these two extremes should not be cultivated by one who has gone forth. What two? Indulgence in sensual pleasures and devotion to self-mortification.',
    translator: 'Bhikkhu Sujato',
    title_pi: 'Dhammacakkappavattanasutta',
    title_en: 'Setting in Motion the Wheel of the Dhamma',
    license: 'CC0-1.0',
  },
  {
    chunk_id: 'sn56.11:4.2',
    uid: 'sn56.11',
    collection: 'sn',
    segments: ['sn56.11:4.2.1', 'sn56.11:4.2.2'],
    pali: 'Idaṃ kho pana bhikkhave dukkhaṃ ariya-saccaṃ: jāti pi dukkhā, jarā pi dukkhā, vyādhi pi dukkho, maraṇaṃ pi dukkhaṃ…',
    english: 'Now this, mendicants, is the noble truth of suffering: birth is suffering, aging is suffering, illness is suffering, death is suffering, association with the disliked is suffering, separation from the liked is suffering.',
    translator: 'Bhikkhu Sujato',
    title_pi: 'Dhammacakkappavattanasutta',
    title_en: 'Setting in Motion the Wheel of the Dhamma',
    license: 'CC0-1.0',
  },
  {
    chunk_id: 'an3.65:3.1',
    uid: 'an3.65',
    collection: 'an',
    segments: ['an3.65:3.1.1', 'an3.65:3.1.2'],
    pali: 'Etha tumhe kālāmā mā anussavena, mā paramparāya, mā itikirāya, mā piṭakasampadānena, mā takkahetu, mā nayahetu…',
    english: 'Come, Kālāmas, do not go by oral tradition, by lineage, by hearsay, by scriptural authority, by logical reasoning, by inference. When you know for yourselves that these qualities are unskillful, then abandon them.',
    translator: 'Bhikkhu Sujato',
    title_pi: 'Kesamuttisutta (Kālāmasutta)',
    title_en: 'To the Kālāmas',
    license: 'CC0-1.0',
  },
  {
    chunk_id: 'mn63:5.1',
    uid: 'mn63',
    collection: 'mn',
    segments: ['mn63:5.1.1', 'mn63:5.1.2'],
    pali: 'Yāni cāni mayā a-byākatāni: sassato loko ti pi mayā a-byākataṃ, asassato loko ti pi mayā a-byākataṃ…',
    english: 'And what have I left undeclared? That the world is eternal, that the world is not eternal... Why have I left these undeclared? Because they are unbeneficial, unessential to the holy life, and do not lead to peace.',
    translator: 'Bhikkhu Sujato',
    title_pi: 'Cūḷamālukyasutta',
    title_en: 'The Shorter Discourse to Mālukyaputta',
    license: 'CC0-1.0',
  },
  {
    chunk_id: 'dhp1:1',
    uid: 'dhp1-20',
    collection: 'kn/dhp',
    segments: ['dhp1:1'],
    pali: 'Manopubbaṅgamā dhammā manoseṭṭhā manomayā, manasā ce paduṭṭhena bhāsati vā karoti vā, tato naṃ dukkhamanveti cakkaṃva vahato padaṃ.',
    english: 'Mind precedes all mental states. Mind is their chief; they are all mind-made. If with an impure mind a person speaks or acts, suffering follows him like the wheel follows the foot of the ox.',
    translator: 'Bhikkhu Sujato',
    title_pi: 'Yamakavagga',
    title_en: 'Pairs',
    license: 'CC0-1.0',
  },
  {
    chunk_id: 'an5.177:1.1',
    uid: 'an5.177',
    collection: 'an',
    segments: ['an5.177:1.1.1'],
    pali: 'Pañcimā bhikkhave vaṇijjā upāsakena akaraṇīyā. Katamā pañca? Satthavaṇijjā, sattavaṇijjā, maṃsavaṇijjā, majjavaṇijjā, visavaṇijjā.',
    english: 'Mendicants, a lay follower should not engage in five trades: trade in weapons, trade in living beings, trade in meat, trade in intoxicants, and trade in poison.',
    translator: 'Bhikkhu Sujato',
    title_pi: 'Vaṇijjāsutta',
    title_en: 'Trade',
    license: 'CC0-1.0',
  },
];

/**
 * Seed chunks first, then everything fetched from bilara-data.
 *
 * The seed entries are hand-written and deliberately kept: they are the
 * passages the demo leans on, and having them in source means the engine still
 * answers its core questions if the generated file is ever missing or being
 * regenerated. Where a chunk_id appears in both, the seed wins — it was written
 * against a known-good demo, and a generated file should not silently move the
 * ground under a scripted answer.
 */
const ALL_CHUNKS: BilaraChunk[] = [
  ...CANONICAL_CHUNKS,
  ...GENERATED_CHUNKS.filter(
    (generated) => !CANONICAL_CHUNKS.some((seed) => seed.chunk_id === generated.chunk_id),
  ),
  // Heritage corpus (charters, WHS records, archaeology, law) — see
  // core/dhamma/heritage.ts for why this is a hand-written seed module rather
  // than a fetched one, same as CANONICAL_CHUNKS above.
  ...HERITAGE_CHUNKS,
];

/** Map of chunk_id -> BilaraChunk for sub-second resolution */
const chunkByIdMap = new Map<string, BilaraChunk>();
for (const chunk of ALL_CHUNKS) {
  chunkByIdMap.set(chunk.chunk_id, chunk);
  for (const segId of chunk.segments) {
    // A segment already claimed by a seed chunk keeps it, for the same reason.
    if (!chunkByIdMap.has(segId)) chunkByIdMap.set(segId, chunk);
  }
}

/** Resolves a chunk ID or segment ID to its parent canonical chunk */
export function resolveSegment(segmentOrChunkId: string): BilaraChunk | undefined {
  return chunkByIdMap.get(segmentOrChunkId.trim());
}

/** Returns all canonical chunks in the corpus */
export function getAllChunks(): BilaraChunk[] {
  return ALL_CHUNKS;
}

/**
 * tools/fetch-bilara.mjs — build the canonical corpus from SuttaCentral.
 *
 *   node tools/fetch-bilara.mjs
 *
 * Writes `core/dhamma/corpus.generated.ts`, which `bilara.ts` merges with its
 * hand-written seed chunks.
 *
 * ── Why fetched rather than typed ──────────────────────────────────────────
 *
 * The corpus is nine chunks, and the Dhamma pillar's whole claim is that its
 * answers come from authentic texts rather than from a model's memory. Typing
 * more Pali by hand would put *my* recollection of a canonical text into the
 * position the claim reserves for the text itself — the exact substitution the
 * feature exists to prevent. A misremembered verse in a heritage app is not a
 * typo, it is a fabricated source with a citation attached.
 *
 * So the passages come from bilara-data, segment by segment, with the root Pali
 * and the English translation aligned on SuttaCentral's own immutable segment
 * IDs. Those IDs are what make `sn56.11:4.2` resolvable rather than decorative.
 *
 * Licensing: root Pali (Mahāsaṅgīti) and Bhikkhu Sujato's translations are both
 * released CC0, which is why the existing chunks already carry that field. The
 * attribution is kept per chunk regardless — CC0 removes the obligation, not
 * the courtesy.
 *
 * ── Chunking ───────────────────────────────────────────────────────────────
 *
 * One chunk per numbered subsection (`dn16:6.7.1` and `dn16:6.7.2` belong to
 * chunk `dn16:6.7`), which is the granularity the retrieval scores over and the
 * granularity a citation should point at. Finer would cite half a sentence;
 * coarser would cite a page and make the citation unfalsifiable.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://raw.githubusercontent.com/suttacentral/bilara-data/published';

/**
 * What to ingest, and why each one earns its place.
 *
 * Chosen against `core/dhamma/eval.ts`: every answerable item in the benchmark
 * should have its passage present, and the benchmark's one standing failure —
 * "the three marks of existence" — is why Dhp 277–279 and SN 22.59 are here.
 */
const SOURCES = [
  { uid: 'dhp273-289', collection: 'kn/dhp', path: 'sutta/kn/dhp/dhp273-289',
    title_pi: 'Maggavagga', title_en: 'The Path',
    note: 'Dhp 277-279 — the three marks: anicca, dukkha, anatta' },
  { uid: 'sn22.59', collection: 'sn', path: 'sutta/sn/sn22/sn22.59',
    title_pi: 'Anattalakkhaṇasutta', title_en: 'The Characteristic of Not-Self',
    note: 'The second discourse; not-self argued in full' },
  { uid: 'sn56.11', collection: 'sn', path: 'sutta/sn/sn56/sn56.11',
    title_pi: 'Dhammacakkappavattanasutta', title_en: 'Setting in Motion the Wheel of the Dhamma',
    note: 'Four noble truths, first teaching' },
  { uid: 'dn16', collection: 'dn', path: 'sutta/dn/dn16',
    title_pi: 'Mahāparinibbānasutta', title_en: "The Great Discourse on the Buddha's Extinguishment",
    note: 'Four pilgrimage places incl. Lumbini; the last words' },
  { uid: 'mn10', collection: 'mn', path: 'sutta/mn/mn10',
    title_pi: 'Satipaṭṭhānasutta', title_en: 'Mindfulness Meditation',
    note: 'The four kinds of mindfulness meditation' },
  { uid: 'an3.65', collection: 'an', path: 'sutta/an/an3/an3.65',
    title_pi: 'Kesamuttisutta', title_en: 'With the Kālāmas',
    note: 'Test teachings against your own experience — the app says this a lot' },
  { uid: 'mn21', collection: 'mn', path: 'sutta/mn/mn21',
    title_pi: 'Kakacūpamasutta', title_en: 'The Simile of the Saw',
    note: 'Patience under provocation; the anger question people actually ask' },
  { uid: 'snp1.8', collection: 'kn/snp', path: 'sutta/kn/snp/vagga1/snp1.8',
    title_pi: 'Mettasutta', title_en: 'Loving-Kindness',
    note: 'Recited daily at Lumbini' },
];

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

/** `dn16:6.7.1` -> `dn16:6.7`. Segments ending a subsection group together. */
function chunkIdOf(segmentId) {
  const [uid, ref] = segmentId.split(':');
  if (!ref) return segmentId;
  const parts = ref.split('.');
  return parts.length <= 1 ? segmentId : `${uid}:${parts.slice(0, -1).join('.')}`;
}

const chunks = [];
let skipped = [];

for (const source of SOURCES) {
  const pali = await fetchJson(`${BASE}/root/pli/ms/${source.path}_root-pli-ms.json`);
  const english = await fetchJson(`${BASE}/translation/en/sujato/${source.path}_translation-en-sujato.json`);

  if (!pali || !english) {
    skipped.push(source.uid);
    continue;
  }

  const grouped = new Map();
  for (const [segmentId, paliText] of Object.entries(pali)) {
    const englishText = english[segmentId];
    // Only segments with both halves. A Pali line with no translation cannot be
    // shown to a reader, and an English line with no root cannot be checked.
    if (!paliText?.trim() || !englishText?.trim()) continue;

    const id = chunkIdOf(segmentId);
    const bucket = grouped.get(id) ?? { segments: [], pali: [], english: [] };
    bucket.segments.push(segmentId);
    bucket.pali.push(paliText.trim());
    bucket.english.push(englishText.trim());
    grouped.set(id, bucket);
  }

  for (const [chunk_id, bucket] of grouped) {
    const englishText = bucket.english.join(' ').replace(/\s+/g, ' ').trim();
    // Headings and single words carry no retrievable meaning and would only
    // dilute the scoring.
    if (englishText.length < 40) continue;

    chunks.push({
      chunk_id,
      uid: source.uid,
      collection: source.collection,
      segments: bucket.segments,
      pali: bucket.pali.join(' ').replace(/\s+/g, ' ').trim(),
      english: englishText,
      translator: 'Bhikkhu Sujato',
      title_pi: source.title_pi,
      title_en: source.title_en,
      license: 'CC0-1.0',
    });
  }

  console.log(`  ${source.uid.padEnd(12)} ${grouped.size} subsections -> ${chunks.filter((c) => c.uid === source.uid).length} chunks`);
}

const header = `/**
 * core/dhamma/corpus.generated.ts — DO NOT EDIT BY HAND.
 *
 * Generated by tools/fetch-bilara.mjs from SuttaCentral bilara-data.
 * Root Pali (Mahāsaṅgīti) and translations by Bhikkhu Sujato, both CC0-1.0.
 *
 * Regenerate with:  node tools/fetch-bilara.mjs
 *
 * Committed rather than fetched at runtime: the app has to answer with no
 * network, which is the case that actually happens in the Sacred Garden.
 */

import type { BilaraChunk } from './bilara.ts';

export const GENERATED_CHUNKS: BilaraChunk[] = ${JSON.stringify(chunks, null, 2)};
`;

writeFileSync(join(ROOT, 'core/dhamma/corpus.generated.ts'), header);

console.log(`\n${chunks.length} chunks written to core/dhamma/corpus.generated.ts`);
if (skipped.length) console.log(`skipped (not found upstream): ${skipped.join(', ')}`);

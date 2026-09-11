/**
 * tools/dhamma-eval.mjs — run the Dhamma engine against its own benchmark.
 *
 *   npm run eval:dhamma
 *   npm run eval:dhamma -- --verbose
 *
 * `core/dhamma/eval.ts` has carried a 50-question benchmark since it was
 * written — answerable, adjacent, out-of-scope, adversarial and Nepali items,
 * each declaring whether a refusal is the correct outcome, and the answerable
 * ones naming a segment that must appear in the citations. Nothing ever ran it.
 *
 * That matters more here than a coverage number would. The product claim is
 * that this engine does not invent: it answers from retrieved canonical
 * passages or it declines. A claim like that is either measured or it is
 * marketing, and the measurement was sitting unused in the repository.
 *
 * This runs the **deterministic** path only — `askDhamma`, not
 * `askDhammaAsync`. No provider is called, no key is needed, and the result is
 * reproducible. That is the path a phone in the Sacred Garden takes anyway.
 *
 * ── Why it transpiles rather than using node --test ─────────────────────────
 *
 * `tools/run-tests.mjs` runs `node --experimental-strip-types`, which needs
 * Node 22.6+. On Node 20 that flag does not exist and the whole harness is
 * unrunnable, which is part of why this benchmark stayed unrun. TypeScript is
 * already a dependency, so transpiling on require costs nothing and works on
 * every version anyone here has.
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ts = require('typescript');
const Module = require('module');

// core/dhamma imports its siblings with explicit `.ts` extensions, so
// registering that extension is all the resolution this needs.
Module._extensions['.ts'] = (mod, filename) => {
  const source = readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  mod._compile(outputText, filename);
};

const { askDhamma, validateCitations } = require(join(ROOT, 'core/dhamma/engine.ts'));
const { hybridRetrieve } = require(join(ROOT, 'core/dhamma/retrieval.ts'));
const { getAllChunks } = require(join(ROOT, 'core/dhamma/bilara.ts'));
const { EVAL_QUESTIONS } = require(join(ROOT, 'core/dhamma/eval.ts'));

const verbose = process.argv.includes('--verbose');

const results = EVAL_QUESTIONS.map((item) => {
  const response = askDhamma({ question: item.question, language: item.category === 'nepali' ? 'ne' : 'en' });

  const refused = response.refused === true;
  const citations = response.citations ?? [];

  // Three separate things can be wrong, and they are not the same failure.
  const wrongDecision = refused !== item.expect_refuse;

  //  An answer with no citation is the failure this engine exists to prevent:
  //  prose without provenance is indistinguishable from invention.
  const uncited = !refused && citations.length === 0;

  //  A named target segment must actually appear. Answering the right question
  //  from the wrong passage is a subtler wrong answer, not a pass.
  const segments = citations.map((c) => c.segment_id ?? '');
  const missedTarget =
    !refused &&
    item.target_segment != null &&
    !segments.some((segment) => segment.startsWith(item.target_segment));

  return { item, response, refused, citations, wrongDecision, uncited, missedTarget,
           pass: !wrongDecision && !uncited && !missedTarget };
});

// ── report ───────────────────────────────────────────────────────────────────
const byCategory = new Map();
for (const r of results) {
  const bucket = byCategory.get(r.item.category) ?? { pass: 0, total: 0 };
  bucket.total += 1;
  if (r.pass) bucket.pass += 1;
  byCategory.set(r.item.category, bucket);
}

const passed = results.filter((r) => r.pass).length;
const total = results.length;

console.log('\nDhamma engine — deterministic benchmark');
console.log('='.repeat(52));
for (const [category, { pass, total: n }] of byCategory) {
  const flag = pass === n ? ' ' : '!';
  console.log(` ${flag} ${category.padEnd(14)} ${String(pass).padStart(2)}/${n}`);
}
console.log('-'.repeat(52));
console.log(`   ${'total'.padEnd(14)} ${passed}/${total}`);

// Silence is not evidence. Anything that failed is named, with the reason.
const failures = results.filter((r) => !r.pass);
if (failures.length > 0) {
  console.log('\nFailures');
  console.log('-'.repeat(52));
  for (const f of failures) {
    const why = f.wrongDecision
      ? (f.item.expect_refuse ? 'answered, should have refused' : 'refused, should have answered')
      : f.uncited
        ? 'answered with no citation'
        : `cited ${f.citations.map((c) => c.segment_id).join(', ') || 'nothing'}, wanted ${f.item.target_segment}`;
    console.log(`  ${f.item.id}  ${f.item.category.padEnd(13)} ${why}`);
    console.log(`      "${f.item.question}"`);
    if (verbose && f.response.answer) console.log(`      -> ${f.response.answer.slice(0, 160)}`);
  }
}

// A citation naming a passage that was never retrieved would be the worst
// outcome available — a fabricated source. Checked separately from the pass
// counts because it is a different class of wrong.
let fabricated = 0;
for (const r of results) {
  if (r.refused) continue;
  const retrieved = hybridRetrieve(r.item.question, 5);
  const valid = new Set(validateCitations(r.response.answer ?? '', retrieved).map((c) => c.segment_id));
  for (const citation of r.citations) {
    if (!valid.has(citation.segment_id)) fabricated += 1;
  }
}
console.log(`\nCitations naming an unretrieved passage: ${fabricated}`);

// ── Span-level faithfulness ─────────────────────────────────────────────────
//
// The check above asks "does this citation resolve to something retrieved?"
// It says nothing about whether the SPECIFIC passage a claim cites actually
// supports that claim. DEMO_CACHE's four-noble-truths entry passed that check
// for months while citing only sn56.11:4.2 — a segment that states the first
// truth alone — for a sentence that asserted the content of all four. The
// citation resolved (sn56.11:4.2 really is retrieved), so the check above
// stayed at zero while the sentence it decorated said something that specific
// passage does not. See engine.ts's fix to that entry and
// 15-POST-HACKATHON-STRATEGY §5.
//
// This has to check against the CITED passage specifically, not the wider
// retrieved set: a first attempt here compared each sentence against the
// union of everything `hybridRetrieve(question, 5)` returned, and the
// original bug slipped straight through it, because a different retrieved
// passage (dn16:2.2, which genuinely does name all four truths) happened to
// also be in that top-5 and covered the words the cited passage did not. That
// measures "is this vocabulary present somewhere nearby", not "does the
// citation this sentence actually gives support this sentence" — the second
// is the real claim, and it is what failed.
//
// Method: split the answer into sentences, keeping each sentence's own
// `[segment_id]` markers intact. A sentence that carries one or more
// citations has its content words checked against THOSE segments' own
// pali/english/title/translator text, looked up directly by id from the full
// corpus (`getAllChunks`) rather than by re-running retrieval, so this cannot
// be rescued by whatever else a live retrieval call happens to rank nearby. A
// sentence with no citation of its own (a lead-in clause before a bracket
// that closes at the end) falls back to the whole answer's citations. Token
// overlap with a threshold, no model call, reproducible.
//
// Scoped to `cached_demo` only. `full_rag`'s deterministic answer is built at
// engine.ts's `answerText = According to ... [chunk_id]: chunk.english` —
// assembled verbatim from a retrieved chunk's own text, so it is faithful to
// what was retrieved by construction; scoring it would measure the template
// string, not a claim. `passages_only` and the LLM-synthesis path
// (askDhammaAsync, which needs a provider key and is not reproducible) are
// out of scope for the same reason the rest of this file only runs the
// deterministic path.
const FAITHFULNESS_STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'this', 'that', 'these', 'those', 'and', 'or', 'but', 'not', 'for',
  'with', 'about', 'from', 'into', 'onto', 'has', 'have', 'had', 'of',
  'to', 'in', 'on', 'at', 'it', 'its', 'as', 'by', 'which', 'who', 'what',
  'when', 'where', 'why', 'how', 'their', 'his', 'her', 'they', 'he',
  'she', 'all', 'both', 'than', 'then', 'there', 'according',
]);

const COMBINING_MARKS_RX = /[\u0300-\u036f]/g;

function contentWords(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(COMBINING_MARKS_RX, '') // fold diacritics, same as retrieval.ts
    .replace(/\[[^\]]*\]/g, ' ') // strip [segment_id] markers
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !FAITHFULNESS_STOPWORDS.has(w));
}

const CITATION_RX = /\[([a-z0-9_.:-]+)\]/gi;

// Split on sentence and semicolon boundaries only, not the colon. A colon
// almost always introduces supporting detail for the clause before it ("the
// truth of suffering is stated in full at [seg]: birth is suffering...") and
// splitting there orphans the lead-in as a low-content fragment that fails on
// generic reporting words ("stated", "in full") no source text would ever
// contain. The four-truths bug this check exists to catch was still a single
// sentence's worth of comma-joined clauses, so sentence-level granularity
// catches it without that false positive.
//
// Citations are extracted and masked out BEFORE splitting, not after: a
// segment id like "sn56.11:4.2" contains periods, and splitting on `.` first
// would sever the bracket itself into fragments ("[sn56", "11:4", "2]"),
// losing the citation the very next line needs to read. Each returned
// sentence carries the ids of whichever citations fell inside it.
function answerSentences(answer) {
  const citedIds = [];
  const masked = answer.replace(CITATION_RX, (_match, id) => {
    citedIds.push(id);
    return ` ${citedIds.length - 1} `;
  });
  return masked
    .split(/[.!?;]+/)
    .map((raw) => {
      const ids = [...raw.matchAll(/ (\d+) /g)].map((m) => citedIds[Number(m[1])]);
      const text = raw.replace(/ \d+ /g, ' ').trim();
      return { text, ids };
    })
    .filter((s) => s.text.length > 0 || s.ids.length > 0);
}

// Titles and translator credits are included alongside pali/english: naming
// which sutta or translator a passage comes from is metadata the citation
// itself already carries, not a content claim the passage's body has to
// separately restate, and penalising it would make an accurate "in the
// Mahāparinibbāna Sutta [dn16:6.7]" read as unsupported.
//
// Substring containment, not word-set membership: Pali titles are often
// romanised as one compound word in bilara.ts ("Mahāparinibbānasutta") but
// written with a space in ordinary prose ("Mahāparinibbāna Sutta"). Exact
// word matching would fail an accurate claim purely because the corpus fused
// two words the answer separated; `.includes()` finds "mahaparinibbana" and
// "sutta" inside "mahaparinibbanasutta" either way.
function passageText(chunk) {
  if (!chunk) return '';
  return `${chunk.pali} ${chunk.english} ${chunk.title_pi} ${chunk.title_en} ${chunk.translator}`;
}

const chunkById = new Map(getAllChunks().map((c) => [c.chunk_id, c]));

// 0.75, not a stricter round number: the last-words entry's own accurate text
// ("final words") paraphrases its cited segment's translation ("last word"),
// costing two of nine content words on a true claim. The original
// four-noble-truths bug scored 0.33 under this same per-citation design (only
// its own cited segment, not the wider retrieved set) — comfortably below
// even a lenient cut, so loosening this far to absorb one reasonable
// synonym does not reopen the gap this check exists to close.
const SUPPORT_THRESHOLD = 0.75;
let unsupportedSpans = 0;
const faithfulnessFailures = [];
for (const r of results) {
  if (r.refused || r.response.tier !== 'cached_demo') continue;
  const answerCitationIds = r.citations.map((c) => c.segment_id);
  for (const { text, ids: ownIds } of answerSentences(r.response.answer ?? '')) {
    const ids = ownIds.length > 0 ? ownIds : answerCitationIds;
    const corpusText = contentWords(ids.map((id) => passageText(chunkById.get(id))).join(' ')).join(' ');
    const words = contentWords(text);
    if (words.length === 0) continue;
    const covered = words.filter((w) => corpusText.includes(w));
    const ratio = covered.length / words.length;
    if (ratio < SUPPORT_THRESHOLD) {
      unsupportedSpans += 1;
      faithfulnessFailures.push({ id: r.item.id, span: text, ratio, missing: words.filter((w) => !corpusText.includes(w)) });
    }
  }
}
console.log(`Cached-demo answer spans unsupported by their own citation: ${unsupportedSpans}`);
if (verbose && faithfulnessFailures.length) {
  for (const f of faithfulnessFailures) {
    console.log(`  ${f.id}  "${f.span}"  (${Math.round(f.ratio * 100)}% covered, missing: ${f.missing.join(', ') || 'none'})`);
  }
}

console.log('');
process.exit(failures.length === 0 && fabricated === 0 && unsupportedSpans === 0 ? 0 : 1);

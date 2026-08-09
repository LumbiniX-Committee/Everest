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

console.log('');
process.exit(failures.length === 0 && fabricated === 0 ? 0 : 1);

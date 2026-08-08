/**
 * tools/lint-vocab.mjs — the vocabulary linter.
 *
 * TEAM-CHARTER's vocabulary rule turned into something that fails a build
 * instead of something four tired people remember at hour 40. Scans seed/,
 * core/ and deck/ for the banned gamification lexicon.
 *
 *   node tools/lint-vocab.mjs
 *
 * Suppress a deliberate, justified use with a trailing `lint-vocab:allow`
 * comment on the same line.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_DIRS = ['seed', 'core', 'deck'];
const EXTS = new Set(['.ts', '.tsx', '.json', '.md']);

// The banned lexicon (TEAM-CHARTER). Say darśana, puṇya, pradakṣiṇā, vantage,
// resurvey, sangha task, appamāda — never these.
const BANNED = [
  'points', 'tokens', 'coins', 'xp', 'level up', 'levelup', 'level-up',
  'streak', 'leaderboard', 'grind', 'daily login', 'check in', 'check-in',
  'collect', 'catch', 'pokedex', 'pokédex', 'lap', 'loop', 'raid', 'gym',
  'pvp', 'payout', 'cashout', 'rewards', 'photo spot', 'engagement', 'retention',
];

// Legitimate, non-gamification uses that would otherwise trip the scan. Kept
// narrow and explicit so the linter stays honest. A line matching any of these
// is exempt (as is any line carrying a `lint-vocab:allow` comment).
//  - `tokens` here means DESIGN tokens — the palette module 04-ARCHITECTURE §4
//    itself names `design/tokens.ts`. Not reward tokens.
//  - "never a streak" is the charter concept being explicitly negated in a doc
//    comment, not a streak mechanic.
const ALLOW = [
  /[/'"`.]tokens(\.ts)?\b/, // import of / reference to the design tokens module
  /design[ /-]tokens?/i,
  /never a streak/i,
  /catch\s*[({]/, // the JS error-handling keyword, not the Pokémon verb
  /}\s*catch\b/,
];

// Word-boundary-ish matcher. \b does not work before non-word chars like é, so
// we bound on start/whitespace/punctuation.
const patterns = BANNED.map((w) => ({
  word: w,
  rx: new RegExp(`(^|[^\\p{L}\\p{N}_])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=$|[^\\p{L}\\p{N}_])`, 'iu'),
}));

function walk(dir) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTS.has(extname(name))) out.push(full);
  }
  return out;
}

const hits = [];
for (const d of TARGET_DIRS) {
  for (const file of walk(join(root, d))) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (line.includes('lint-vocab:allow')) return;
      if (ALLOW.some((rx) => rx.test(line))) return;
      for (const { word, rx } of patterns) {
        const m = line.match(rx);
        if (m) hits.push({ file: relative(root, file), line: i + 1, word, text: line.trim().slice(0, 100) });
      }
    });
  }
}

if (hits.length) {
  for (const h of hits) console.error(`  ${h.file}:${h.line}  banned "${h.word}"  ${h.text}`);
  console.error(`\n${hits.length} banned-vocabulary use(s). Rephrase, or add a justified 'lint-vocab:allow' comment.`);
  process.exit(1);
}
console.log('vocab: clean — no banned gamification lexicon in seed/, core/ or deck/.');

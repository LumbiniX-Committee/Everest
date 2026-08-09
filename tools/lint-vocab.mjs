/**
 * tools/lint-vocab.mjs — the vocabulary linter.
 *
 * TEAM-CHARTER's vocabulary rule turned into something that fails a build
 * instead of something four tired people remember at hour 40.
 *
 *   node tools/lint-vocab.mjs
 *
 * Two scopes, because the app and our own content earn different strictness:
 *  - CONTENT dirs (seed/, core/, deck/) — our authored copy. The FULL banned
 *    list applies, including words that are only banned in the game sense
 *    (points, loop, tokens, …), because we control every string here.
 *  - APP dirs (features/, components/, app/, …) — lane B's code, where "vantage
 *    point", "witness loop" and "colour tokens" are legitimate and mandated.
 *    Only the UNAMBIGUOUS gamification terms (xp, leaderboard, streak, grind,
 *    rewards, check-in, …) are enforced there, so the sweep protects vocabulary
 *    without fighting ordinary English.
 *
 * Suppress a deliberate, justified use with a trailing `lint-vocab:allow`
 * comment on the same line.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIRS = ['seed', 'core', 'deck'];

// Files this linter has no business editorialising over. The canonical corpus
// is fetched from SuttaCentral, not written here: "collect uncarded cotton"
// (DN 16, the funeral rites) and "the lap of the gods" are translations of
// Pali, and rephrasing scripture to satisfy a vocabulary rule about
// gamification would be absurd — and would break the citations that make the
// Dhamma engine checkable.
const SKIP_FILES = [/core\/dhamma\/corpus\.generated\.ts$/];

// ── The leaderboard exemption ──────────────────────────────────────────────
//
// `leaderboard` is on the banned list because the charter refused competitive
// ranking at a sacred site, and this linter is how that refusal was enforced.
// That decision has been reversed deliberately, by the team, for the pitch —
// the app now has a global board, and the feature cannot be named without the
// word.
//
// Exempted by path rather than by scattering twelve suppressions, and recorded
// here rather than by deleting the word from the ban list, because the ban
// still holds everywhere else. Tīrtha, Sākṣī, Dhamma and the practice surfaces
// must not start talking about ranks; only the surface that *is* a ranking may.
//
// If the leaderboard is ever removed, delete this block and the word goes back
// to being banned everywhere with no further edits.
const RANKING_FEATURE = [
  /services\/leaderboard\//,
  /features\/leaderboard\//,
  /app\/\(main\)\/sakshi\/guardians\.tsx$/,
];
const APP_DIRS = [
  'app', 'features', 'components', 'store', 'hooks',
  'services', 'theme', 'types', 'data', 'constants',
];
const EXTS = new Set(['.ts', '.tsx', '.json', '.md']);

// Unambiguous gamification terms — wrong anywhere, including lane B's app code.
const BANNED_HARD = [
  'coins', 'xp', 'level up', 'levelup', 'level-up', 'streak', 'leaderboard',
  'grind', 'daily login', 'check in', 'check-in', 'pokedex', 'pokédex', 'raid',
  'gym', 'pvp', 'payout', 'cashout', 'rewards', 'photo spot', 'engagement',
  'retention',
];
// Ambiguous with legitimate English/design/JS ("vantage point", "witness loop",
// "design tokens", the JS `catch`). Banned only in our own CONTENT dirs.
const BANNED_SOFT = ['points', 'tokens', 'collect', 'catch', 'lap', 'loop'];
const BANNED = [...BANNED_HARD, ...BANNED_SOFT];

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
  /colou?r tokens?/i, // theme/colors.ts header — palette tokens, not reward tokens
  /never a streak/i,
  /no\s+[`'"]?streak/i, // "no `streak`" — the mechanic being explicitly refused
  /catch\s*[({]/, // the JS error-handling keyword, not the Pokémon verb
  /}\s*catch\b/,
];

// Word-boundary-ish matcher. \b does not work before non-word chars like é, so
// we bound on start/whitespace/punctuation.
const makePatterns = (list) =>
  list.map((w) => ({
    word: w,
    rx: new RegExp(`(^|[^\\p{L}\\p{N}_])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=$|[^\\p{L}\\p{N}_])`, 'iu'),
  }));
const patternsFull = makePatterns(BANNED);
const patternsHard = makePatterns(BANNED_HARD);

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
function scan(dirs, patterns) {
  for (const d of dirs) {
    for (const file of walk(join(root, d))) {
      const posix = file.replace(/\\/g, '/');
      if (SKIP_FILES.some((rx) => rx.test(posix))) continue;
      const rankingFeature = RANKING_FEATURE.some((rx) => rx.test(posix));
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, i) => {
        if (line.includes('lint-vocab:allow')) return;
        if (ALLOW.some((rx) => rx.test(line))) return;
        for (const { word, rx } of patterns) {
          // Only the feature's own name is forgiven here. `points`, `streak`,
          // `grind` and the rest stay banned even on the ranking surface.
          if (rankingFeature && word === 'leaderboard') continue;
          if (rx.test(line)) hits.push({ file: relative(root, file), line: i + 1, word, text: line.trim().slice(0, 100) });
        }
      });
    }
  }
}
scan(CONTENT_DIRS, patternsFull); // our content: full strictness
scan(APP_DIRS, patternsHard);     // lane B's app: unambiguous terms only

if (hits.length) {
  for (const h of hits) console.error(`  ${h.file}:${h.line}  banned "${h.word}"  ${h.text}`);
  console.error(`\n${hits.length} banned-vocabulary use(s). Rephrase, or add a justified 'lint-vocab:allow' comment.`);
  process.exit(1);
}
console.log('vocab: clean — content (seed/ core/ deck/) full sweep + app hard-term sweep both pass.');

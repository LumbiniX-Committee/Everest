# tools

Lane-A/D build and verification scripts. All of `run-tests`, `validate-seed`
and `lint-vocab` run with **no npm install** — Node 22 is enough.

## Run the logic tests (zero install)

```bash
node tools/run-tests.mjs
```

Globs `core/**/*.test.ts` and runs them under Node's built-in test runner
with type-stripping. This is the check that matters: it verifies the merit
ledger, cap, pradakṣiṇā, geofence hysteresis, quests, stillness, riddles, the
close ritual and directed dāna — all without a phone or an app build.

## Validate the seed

```bash
node tools/validate-seed.mjs
```

Fails on structural problems (dangling references, coords outside the Lumbini
bbox, a site with no sources, a plate missing its evidence tier). Warns — but
does not fail — on coordinates still marked `doc` (verify against OSM/Wikidata
before shipping, per 05-CONTENT-SPEC §1) and on plate ids not yet produced.

## Lint the vocabulary

```bash
node tools/lint-vocab.mjs
```

Two scopes. In our own content (`seed/`, `core/`, `deck/`) the **full** banned
list applies (points, tokens, streak, leaderboard, collect, catch, loop, …). In
the app (`features/`, `components/`, `app/`, …) only the **unambiguous**
gamification terms are enforced (xp, leaderboard, streak, grind, rewards,
check-in, …), so "vantage point", the "witness loop" and "colour tokens" stay
legal. This is TEAM-CHARTER's vocabulary rule made enforceable. Suppress a
justified use with a trailing `lint-vocab:allow` comment.

## Optional: richer harness (needs npm)

```bash
cd tools/test
npm install
npm run typecheck   # tsc --noEmit over shared/ + core logic
npm test            # vitest
```

The RN-dependent files (`*.tsx`, `core/screens/`) are excluded from the
typecheck until B's native build provides react-native's types.

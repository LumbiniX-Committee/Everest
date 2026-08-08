# Sākṣī — Handoff for Person B, Phases 8 & 9

You are picking up a large refactor of the Sākṣī Expo/React Native app on branch
`Aaditya`. Phases 0–7 are done, committed, and pushed. This document is
everything you need to finish **Phase 8 (map)** and **Phase 9 (narration, sync,
preferences, quests-to-spec, docs)** without re-deriving context.

Read this whole file before touching anything.

---

## 0. What Sākṣī is (one paragraph)

A heritage-conservation / pilgrimage app for Lumbini, Nepal (LumbiniX 2026
hackathon). Three surfaces: **Tīrtha** (map + sites), **Sākṣī** (fixed-point
photo capture + condition reports), **Dhamma** (citation-locked Q&A that refuses
rather than hallucinate). The thesis: turn pilgrims into a conservation
monitoring network by making *paying attention* the practice. It is
anti-gamification on purpose (no points-chasing language, a daily merit cap, a
"use it less" ethic) and evidence-obsessed (every reconstructed image is
tier-labelled; nothing fakes a measurement).

**The full spec is in the repo: `SAKSHI-COMPLETE.md`** (6,892 lines, 23
concatenated docs). The ones you'll want: `04-ARCHITECTURE` (schema + API +
alignment maths), `05-CONTENT-SPEC` (sites, quests, merit table, condition
taxonomy), `07-DESIGN-SYSTEM` (palette, type, reticle, motion),
`A-MAP-AND-GAME` (Person A's map + game scope — the map is formally A's lane),
`B-CAPTURE-AND-AR` (Person B's scope), `TEAM-CHARTER` (the 10 non-negotiables).

---

## 1. Environment gotchas (THESE WILL BITE YOU — read first)

- **OS/shell:** Windows 11. A Bash tool (Git Bash/MSYS) and PowerShell are both
  available. In Bash, git commands with a `:` in an argument (e.g.
  `git show HEAD:file`) get mangled by MSYS path conversion — prefix with
  `export MSYS_NO_PATHCONV=1;`.
- **`.expo/types/router.d.ts` is POISONED by the running Metro dev server.**
  A running `expo start` regenerates that file on every file change, and in this
  environment it regenerates *polluted*: it lists every non-route `.tsx` in the
  project as a bogus `/../components/...` route, which makes ~7 `router.push`/
  `router.replace` calls fail typecheck (TS2345 on `/(main)/settings`,
  `/(main)/tirtha/quests`, etc.). **These are false positives.** The code is
  correct. Two ways to deal with it:
  - For a clean `tsc` locally: `rm -f .expo/types/router.d.ts && npx tsc --noEmit`
    (delete it immediately before, with no file writes in between; the absent
    file falls back to `string` route typing → 0 errors).
  - The real fix is to **restart the Metro dev server with `npx expo start -c`**
    (clears the cache and regenerates clean typed routes). Do this once at the
    start of your session.
  - When you read `tsc` output, filter the noise:
    `npx tsc --noEmit 2>&1 | grep -v "router.d.ts\|(main)/settings\|(main)/tirtha/quests\|CompassCalibration"`
- **CRLF warnings** ("LF will be replaced by CRLF") on commit are harmless
  (autocrlf is on). Ignore them.
- **Commits: NO `Co-Authored-By` trailer.** The team convention. Commit prefix
  `b:` for this work.
- **Branch:** work on `Aaditya`. It is pushed to `origin/Aaditya`.
  **`main` is NOT updated with Phases 0–7** — only `Aaditya` has them. The user
  merges to `main` themselves (usually via PR, or a direct push they authorise).
  Do not push to `main` without being told to.

### The verify gate (run after every phase; all must pass)

```bash
npm run verify        # = typecheck && test && validate && vocab
# individually:
npx tsc --noEmit      # 0 errors (see router.d.ts note above)
node tools/run-tests.mjs      # 48 tests, all pass — the core/ logic suite
node tools/validate-seed.mjs  # "OK — no errors, 5 warning(s)" (coord warnings are fine)
node tools/lint-vocab.mjs     # "vocab: clean"
node tools/gen-data.mjs       # regenerate data/generated/ after ANY seed/ change; must be idempotent
```

- **Vocab linter** (`tools/lint-vocab.mjs`): banned gamification terms —
  `points, tokens, coins, xp, level up, streak, leaderboard, grind, daily login,
  check in, collect, catch, pokedex, raid, gym, pvp, payout, cashout, rewards,
  photo spot, engagement, retention`, etc. Two scopes: full list over
  `seed/ core/ deck/`; the "hard" subset over `app` dirs. Escape hatch: put
  `lint-vocab:allow` on the offending line (only for a justified mention, e.g. a
  comment naming an anti-pattern it refuses). **Watch this when writing merit /
  quest / narration copy** — it is where banned words creep in.
- **No device this session was possible.** All Phase 0–7 code is
  typecheck-verified and (for pure logic) unit-tested, but NOT run on a phone.
  If you can run a dev build, do — especially the camera, compass, GPS and map.

---

## 2. What's already done (Phases 0–7)

Commits on `Aaditya` (newest last): `174cff4` P0, `a1cd5c9` P1, `5573284` P2,
`a336a37` P3, `b7d832f` P4, `89e3c20` P5, `b4902b7` P6, `160d7ce` P7.

- **P0** — `npm install` (repo now builds; two deps were declared-not-installed);
  fixed a Rules-of-Hooks crash in `features/sakshi/ObservationScreen.tsx`;
  added `test/validate/vocab/verify` npm scripts; **moved `app/assets/` → root
  `assets/`** (the router scans `app/`, so binaries there polluted route types);
  committed `SAKSHI-COMPLETE.md` (it was untracked — the only copy of the spec).
- **P1** — the Then/Now flagship renders **real** licensed plates + a modern
  photo, each with an **evidence-tier label** (Charter #6). See
  `data/plates.ts`, `data/demo/historical.ts`,
  `components/thennow/EvidenceTierLabel.tsx`, `features/tirtha/ThenNowScreen.tsx`.
  Real pairs exist for `ashokan-pillar` (1899 photo + pre-1896 reconstruction)
  and `puskarini` (pre-1930s reconstruction). Maya-devi is left honest-empty
  (its only plate is a plan drawing that can't align with an oblique photo).
- **P2** — the spec **dark palette** in `theme/colors.ts` (values-first: legacy
  token names kept, remapped; spec names `ground/sand/lock/seek/change/...`
  added). `lock #3E7CC4` lapis is **reserved for alignment only** — never reuse
  it. `app.json` userInterfaceStyle dark + dark splash; StatusBar light.
- **P3** — **the app now runs on `seed/` as source of truth.**
  `tools/gen-data.mjs` reads `seed/{sites,vantages,needs}.json` → emits
  `data/generated/{sites,index}.ts` (committed). 12 sites with `zone`, `tier`,
  `radiusMeters` (geofence), `photography`, `namePali`, `facts`, OSM coords, and
  realistic vantage tolerances (8 m / 12°). **Site IDs are the seed ids**
  (`ashokan-pillar`, `puskarini`, …). `LEGACY_ID_ALIASES` in the generated file
  maps old app ids at the read boundary. `data/index.ts` is the barrel; app code
  imports `@/data`, never `data/demo/*` or `data/generated/*` directly.
- **P4** — real compass + honest alignment. `core/alignment/score.ts` (pure,
  6 tests) is the spec's weighted score `0.30·pos + 0.50·head + 0.20·pitch`,
  lock at `≥0.75 && gps≤15m && sHead≥0.5`. `hooks/useAlignment.ts` imports it.
  Heading now comes from `Location.watchHeadingAsync` (tilt-compensated) not raw
  magnetometer. **Deleted the fake "Simulate Standing at Vantage" toggle** that
  fabricated a locked state; replaced with an honest `manual` ("Match by eye")
  phase that never claims lock and never uses lapis.
- **P5** — capture integrity. Photos are copied out of the camera cache to
  `FileSystem.documentDirectory` before insert; the observer's **real GPS fix**
  is recorded (not the vantage coordinate); error fields are **null, not 0**,
  when there's no signal; **Charter #8 photography lockout** blocks capture at
  restricted/prohibited sites; the by-eye path records `gate_mode: 'manual'`
  honestly. Deleted a duplicate condition form that silently discarded data.
- **P6** — **weighted puṇya** (05-CONTENT-SPEC §6): witness/resurvey 50,
  observation 25, study 30, reflection 70; **daily cap 200**. `merit_events`
  gained `amount` + `day_key` (migration index 6). Balance = `SUM(amount)`,
  never stored (Charter #9). A capped act still writes at amount 0. See
  `types/practice.ts`, `store/practice.tsx`, `services/database/index.ts`.
- **P7 (partial)** — deduped the byte-identical geo math: `utils/geo.ts` is now a
  thin adapter over `shared/geo.ts`. Confirmed the app imports both `@/core` and
  `@/shared` cleanly (Metro alias `@/*` → repo root, via
  `experiments.tsconfigPaths` in `app.json`). **The rest of the `core/`
  integration was deliberately deferred — see §5.**

---

## 3. Architecture you must know

- **Data pipeline:** `seed/*.json` → `node tools/gen-data.mjs` →
  `data/generated/*.ts` (committed) → re-exported by `data/index.ts` (the barrel)
  → consumed via `@/data`. **Never hand-edit `data/generated/`.** Change `seed/`
  then regenerate. `tools/validate-seed.mjs` guards seed integrity.
- **`@/` alias** = repo root (`tsconfig.json` `paths: {"@/*": ["./*"]}`).
  `@/core` and `@/shared` resolve even though they're outside the tsconfig
  `include` (proven working in P4/P7). `core/` and `shared/` use explicit `.ts`
  import extensions internally; keep that if you add files there.
- **DB migrations** (`services/database/index.ts`, `migrations: string[]`):
  **append-only, indexed by `PRAGMA user_version`.** Currently **7 entries
  (indexes 0–6)**. The next migration is index 7 — append it, never edit an
  existing one. `foreign_keys = ON`; avoid table rebuilds (there's an FK from
  `condition_reports`). Prefer `ALTER TABLE ... ADD COLUMN`.
- **Merit honesty invariants (do not break):** balance is `SUM(amount)`, never a
  stored column; no spend/transfer; severity never scales reward; capped acts
  still get a row (amount 0).
- **Capture honesty invariants:** `gate_mode` ('aligned'|'manual') is the source
  of truth — `manual` captures report position/bearing error as **null**, never
  0; never fabricate a lock; `lock #3E7CC4` lapis only ever means real alignment.
- **Theme:** import colours from `@/theme` — no hardcoded hex in components
  (the P2 grep found and fixed all of them; keep it that way). Fonts in
  `theme/fonts.ts` are all commented out (`assets/fonts/` has only a README) —
  the app runs on platform fonts. Don't uncomment font `require()`s unless the
  files actually exist (instant red screen otherwise).
- **expo-file-system SDK 57:** the classic API (`documentDirectory`,
  `copyAsync`, `makeDirectoryAsync`) is under **`expo-file-system/legacy`**, not
  the main entry. (`services/supabase/sync.ts` still imports the main entry for
  the functions it uses; `features/sakshi/CaptureScreen.tsx` uses `/legacy`.)

---

## 4. PHASE 8 — The map

Currently **there is no map.** `features/tirtha/TirthaScreen.tsx` renders
`components/map/SitePlan.tsx`, a schematic rectangle with dots interpolated from
lat/lon against a hardcoded box in `constants/geo.ts`. It is honest about being a
schematic in its own docstring. The map is formally **Person A's lane**
(`A-MAP-AND-GAME` §1) but you're completing it here.

Do it in two stages; **M0 ships first and de-risks everything.**

### M0 — Upgrade `SitePlan` (JS only, zero native risk) — DO THIS FIRST
Give the existing schematic the *behaviour* the spec wants, using data that now
exists on every site after P3:
- Render pins from `demoSites` (via `@/data`), **sized/styled by `site.tier`**
  (1 primary, 2 secondary, 3 contextual).
- Draw the **geofence ring** from `site.radiusMeters`.
- Show **live position + a heading cone** (use `useCurrentPosition` and
  `useHeading` from `@/hooks`).
- Live **distance-to-site labels** (`distanceMeters` from `@/utils`).
- **Wire the `onSelectSite` prop** — `TirthaScreen.tsx` currently passes `sites`
  and `observer` but no `onSelectSite`, so the plan is non-interactive. Tapping a
  pin should navigate to `/(main)/tirtha/site/[siteId]`.
This alone satisfies two Charter "never-cut" items (a map, geofence arrival) with
no native code. **Keep the file's honesty** — it's a survey schematic, say so.

### M1 — MapLibre + offline tiles (native; timebox to ~3h on a branch)
- `@maplibre/maplibre-react-native` is **native → cannot run in Expo Go.** It
  needs `npx expo prebuild` + a **development build** (EAS or local
  `expo run:android`). Everything else you need (expo-audio, netinfo,
  image-manipulator) works in Expo Go, so MapLibre is the *only* reason to leave
  the managed path — weigh that.
- **Success criterion, stated up front:** renders Lumbini tiles **in airplane
  mode**. If the timebox expires, abandon the branch — M0 already shipped.
- **Bundled PMTiles is the risky part**, not MapLibre. `pmtiles://` support in
  maplibre-*native* (vs gl-js) is not a safe bet — spike it, don't plan around
  it. Fallback: `OfflineManager.createPack()` prefetches the Lumbini region
  (z10–16) once on wifi — genuinely offline, but a **deviation from "bundled
  assets"** you should say out loud, not hide.
- **Feature-flag the choice** in `components/map/index.tsx` (MapLibre vs the M0
  `SitePlan`). `main` must never be in a half-migrated state — the dissolve and
  the rest of the app keep working regardless.

Style per `07-DESIGN-SYSTEM` (dark, the Kenzo Tange canal axis if you have time).
Centre on Lumbini `27.4696, 83.2758`.

---

## 5. PHASE 9 — Remaining surface (in value order)

**#1 is the biggest single win and a Charter never-cut item currently at zero.**

1. **Narration (never-cut, currently no playback at all).**
   12 `.opus` files exist at `assets/audio/<site-id>.en.opus` (one per seed site;
   git-ignored placeholders from a SAPI generator, but present). There is NO
   audio code and NO audio dependency. Add **`expo-audio`** (Expo Go-compatible,
   no dev build), a require-map for the clips (extend the `data/plates.ts` pattern
   — Metro `require()` needs static literal paths, so enumerate them; or add a
   `data/audio.ts`), and a play/pause control on the site-detail screen
   (`features/tirtha/SiteDetailScreen.tsx`). `seed/narration.json` has the text +
   `approx_seconds` per site. There's also an en/ne switch to honour eventually
   (seed narration has both languages; only `.en.opus` files exist so far).

2. **Sync honesty.** `services/sync/index.ts` is **110 lines of dead code**
   (exported via `services/index.ts`, imported by nothing, wrong bucket name) —
   delete it; the live one is `services/supabase/sync.ts`. Then:
   `.env.local` is byte-identical to `.env.example` (placeholder
   `https://your-project.supabase.co`), so `isConfigured()` returns true and
   every sync hits a dead host — make `isConfigured()` reject the placeholder.
   There's no connectivity check (no `@react-native-community/netinfo`) —
   `hooks/useSync.ts` reports "Offline" purely because rows are unsynced, which
   is a lie with full signal; add netinfo. Add auto-sync on foreground + after
   capture. `useSync.ts:~34` swallows the error unlogged and `failed` is
   terminal — log it and make it recoverable.

3. **Preferences theatre.** `store/preferences.tsx` persists 7 preferences;
   **6 are read by nothing** (`PreferencesScreen.tsx` claims "nothing here is
   cosmetic"). Either implement or delete. Cheapest honest fix: implement
   `distanceUnit` (`utils/format.ts`), `photoQuality`
   (`services/camera/index.ts` — currently hardcoded 0.9), and `hapticsEnabled`
   (add `expo-haptics`; you want it anyway for the reticle lock pulse per
   `07 §2`), and **delete** `alignmentTolerance`, `autoCapture`,
   `scriptPreference`, `offlineSyncMode` until they do something.

4. **Quests to spec — this is the big deferred one (see §6).** The app ships 4
   ad-hoc demo quests (`data/demo/quests.ts`, categories survey/epigraphy/…) with
   dangling `targetId`s and **no verification** — you can complete "Capture East
   Approach Vantage" from your sofa and collect puṇya, which lets the merit cap be
   farmed. `seed/quests.json` has the **6 spec quests + 4 riddles** with proper
   families, windows, merit, and riddle answers. Migrate the app onto seed quests
   (via `gen-data.mjs`, same pattern as sites), then wire the **tested `core/`
   modules** that verify/gate them (§6). Do this before quest merit is demoed.

5. **Compression** (deferred from P5): add `expo-image-manipulator`, resize
   captures to 2048px long edge, target <1MB, strip EXIF except
   timestamp/GPS/heading (`04 §6`). It's an Expo-Go-compatible dep.

6. **Fonts** — only once `assets/fonts/` actually contains the files: Anek
   Devanagari (display), IBM Plex Sans + Sans Devanagari (body), IBM Plex Mono
   (data). Until then leave `theme/fonts.ts` commented.

7. **Dead-code sweep:** `services/sync/index.ts`, `features/practice/index.ts`,
   `services/camera/index.ts` `CaptureResult` type, `mock-api/`,
   `constants/geo.ts` unused constants, and eventually `data/demo/sites.ts`
   (kept as a fallback during the migration; safe to delete once stable).
   `components/reticle/CompassCalibrationPrompt.tsx` is still unrendered — either
   wire it (see §6) or note it.

8. **Docs:** `PROJECT.md` is stale (marks the shipped Settings phase as PLANNED;
   documents a quests schema that doesn't match migration 4; names 5 files that
   don't exist). `TEST_INFRA.md` claims "0 typecheck errors" — reconcile with the
   router-types note. **Charter #7:** `LICENCES.md` is auto-generated from the
   harvest manifest (`harvest/`), never hand-edited.

---

## 6. The deferred `core/` modules (tested, ready, UNWIRED)

`core/` + `shared/` hold pure, unit-tested domain logic (run via
`node tools/run-tests.mjs`, 48 tests). Most of it is NOT wired into the app yet
because it's entangled with the quest-model migration (§5.4) and needs device
sensors. Wire them **as part of Phase 9.4**, in this order:

| Module | What it gives | Prereq |
|---|---|---|
| `core/map/geofence.ts` | `GeofenceWatcher` — per-site radius + 1.15 exit hysteresis, enter/exit/dwell, `nearestSite`. Unlocks real **darśana arrival**. | `radiusMeters` (exists) |
| `core/quests/registry.ts` | quest availability by proximity + time window (midnight-wrap safe). Unlocks `q.first-light`'s 05:30–07:00 window, and **quest task verification** (stop sofa-completion). | seed quests migrated |
| `core/map/pradakshina.ts` | signed angular sum, complete ≥330° clockwise / ≤30° reverse / reject stray >2× radius. | live GPS track (device) |
| `core/quests/stillness.ts` | 10-min stillness detector (screen-off + accel variance + geofence), debug 20s. "Best single feature" per spec. | accelerometer + screen state (device) |
| `core/quests/riddles.ts` + `core/copy/failure-lines.ts` | 4 observation riddles, tolerant matching, hint-not-fail. | seed quests migrated |
| `core/session/closeRitual.ts` + `notifications.ts` | 20-min close ritual overlay + notification suppression in the Sacred Garden. | session timing (device) |
| `core/dana/allocation.ts` | directed dāna against `seed/needs.json` — merit determines allocation, no funds move. Needs a new UI screen. | weighted merit (done, P6) |
| `core/adapters/coords.ts` | `{lat,lon}`↔`{latitude,longitude}` bridge, already written, unused. | — |

Each has colocated `*.test.ts`. `core/INTEGRATION.md` is a wiring guide (note: it
predates P3/P6, so its "no per-site radius" blocker is already resolved, and its
"never store a balance" rule is honoured). These are essentially **Person A game
features** — treat them as new surfaces, and verify on a device where the
behaviour is sensor-driven.

---

## 7. Cut ladder (if you run out of time)

Drop in this order: i18n → custom fonts → dāna + close ritual + notification
suppression → riddles → stillness + pradakṣiṇā → preferences (delete dead
toggles rather than implement) → sync entirely (offline-first-by-design is a
fine story) → MapLibre M1 (keep the M0 `SitePlan`, say on stage it's a survey
schematic).

**Never cut:** the Then/Now dissolve, the honest by-eye escape hatch, capture
persistence + null-not-zero error fields, the daily merit cap, and the Dhamma
refusal path (already shipped and working — don't touch it). Those are the
integrity claims; a demo without them is a different product.

---

## 8. First moves when you start

1. `git checkout Aaditya && git pull` (you should be at `160d7ce` or later).
2. `npm install` (in case deps drift), then `npx expo start -c` once to
   regenerate clean router types.
3. `npm run verify` — confirm the baseline is green (48 tests, tsc 0 with the
   router-types caveat, seed OK, vocab clean).
4. Start Phase 8 **M0** (safe, high value). Commit per numbered item, `b:`
   prefix, no Co-Authored-By. Push to `Aaditya`. Do not touch `main`.

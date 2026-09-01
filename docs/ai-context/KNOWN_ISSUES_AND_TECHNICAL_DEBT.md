# Known Issues and Technical Debt

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

Every item below was **verified during this audit**. Nothing here was fixed — this is a report.

> **There are zero `TODO`, `FIXME`, `HACK` or `XXX` markers** anywhere in `app/`, `features/`, `components/`, `hooks/`, `store/`, `services/`, `core/`, `shared/`, `utils/`, `types/`. Incomplete work is **not** flagged inline in this codebase, so absence of a marker is not evidence of completeness.

---

## Severity scale

| Level | Meaning |
|---|---|
| **Critical** | Can break the app or lose data in production |
| **High** | Blocks a core flow, or a silent-failure trap |
| **Medium** | Real defect or debt; workaround exists |
| **Low** | Cosmetic, stylistic, or unverified |

---

## Critical

### C1 — Migration 0007 can lock out all writes

- **Evidence:** [services/supabase/auth.ts](../../services/supabase/auth.ts) states migration 0007 "removes that fallback, and **must not be applied until both have happened**" (clients updated **and** anonymous sign-in enabled). [supabase/migrations/0007_retire_anonymous_writes.sql](../../supabase/migrations/0007_retire_anonymous_writes.sql) exists in the repo and drops every `anon` write policy on all three tables and both storage buckets.
- **Impact:** If 0007 is applied while anonymous sign-in is disabled in the Supabase dashboard, `ensureSession()` returns `null`, no `anon` fallback remains, and **every write from every device fails** — silently, since sync errors are swallowed.
- **Fix:** Verify in the Supabase dashboard that Authentication → Sign In / Providers → anonymous is **enabled** before (or immediately after) applying 0007. Confirm which migrations are actually applied.
- **Risk of fixing:** None — a dashboard check.
- **Validation:** Capture an observation on a fresh install, foreground the app, confirm the row appears in `observations`.
- **Status:** **Needs verification against the live project.** Cannot be determined from source.

---

## High

### H1 — Two `demoSites` exports with different site ids; the dead one fails silently

- **Evidence:** `data/generated/sites.ts` exports `demoSites` (**live**, via `@/data`). `data/demo/sites.ts` also exports `demoSites` but is **not** barrel-exported. [services/location/demoWalk.ts](../../services/location/demoWalk.ts) documents the consequence: the dead file has "a *different* set of ids (`ashoka-pillar`, `puskarini-pond`, `bodhi-tree`) … an itinerary written against those names resolves nothing and **silently skips every leg**."
- **Impact:** Any new code written against the wrong ids fails silently — no error, no crash, just nothing happening. Highly likely to catch an AI agent or new contributor.
- **Fix:** Delete `data/demo/sites.ts`, or rename its export to `legacyDemoSites`.
- **Risk of fixing:** Low. Verify nothing imports it first (**confirmed: nothing does**).
- **Validation:** `npm run typecheck && npm test && npm run validate`.

### H2 — `lint` is excluded from `npm run verify`

- **Evidence:** `verify` = `typecheck && test && validate && vocab && eval:dhamma`. No `lint`.
- **Impact:** 16 lint errors coexist with a green `verify`. Anyone (human or agent) trusting `verify` as "all clean" is misled.
- **Fix:** Fix H3, then add `lint` to the chain.
- **Risk of fixing:** Low, once H3 is resolved.

### H3 — 16 lint errors in `SpeechCloud.tsx`

- **Evidence:** `npm run lint` → 16 errors, **all** in [components/monk/SpeechCloud.tsx](../../components/monk/SpeechCloud.tsx): 15 × `react-hooks/refs`, 1 × `react-hooks/set-state-in-effect`. Example: `{ translateY: cloudAnim.interpolate({...}) }` → *"Passing a ref to a function may read its value during render."*
- **Impact:** Blocks a clean lint run. The pattern (reading an `Animated.Value` ref during render) is a legacy RN idiom that may break under React Compiler optimisation. Likely works at runtime today.
- **Fix:** Migrate the component to Reanimated (used elsewhere in the project), or restructure so the animated value is not read during render.
- **Risk of fixing:** Medium — animation regressions are visual and untested.
- **Validation:** `npm run lint` clean; visually verify the monk speech animation.

### H4 — `expo-file-system/legacy` on the most critical path

- **Evidence:** [features/sakshi/CaptureScreen.tsx](../../features/sakshi/CaptureScreen.tsx) — `import * as FileSystem from 'expo-file-system/legacy'`.
- **Impact:** The `/legacy` surface is explicitly transitional and will be removed in a future SDK. It sits on the app's core capture loop.
- **Fix:** Migrate to the modern `expo-file-system` API.
- **Risk of fixing:** **High** — this path writes evidence photographs. A mistake loses captures.
- **Validation:** Capture in both `aligned` and `manual` modes; confirm the file persists, the row is inserted, and sync uploads it.

### H5 — The React layer has no tests at all

- **Evidence:** All 18 test files are under `core/`. Zero tests for screens, components, hooks, stores, services, or navigation.
- **Impact:** The entire UI, state, and platform-integration surface is verified by hand only. Highest-risk untested area is the capture → sync pipeline.
- **Fix:** Add tests for provider composition, the boot gate, and `isConfigured()` behaviour first.
- **Risk of fixing:** None.

---

## Medium

### M1 — `core/` and `shared/` are not type-checked by `npm run typecheck`

- **Evidence:** [tsconfig.json](../../tsconfig.json) `exclude` lists both. Their config lives in [tools/test/](../../tools/test/), which no npm script invokes.
- **Impact:** A type error in the domain layer passes `npm run verify`. Only runtime test failures would catch it.
- **Fix:** Add a script running `tsc -p tools/tsconfig.test.json --noEmit` and include it in `verify`.

### M2 — Five sites have unverified coordinates

- **Evidence:** `npm run validate` warns for `puskarini`, `marker-stone`, `vihara-remains`, `tilaurakot`, `ramagrama`: *"coords still 'doc' — verify against OSM/Wikidata before shipping."*
- **Impact:** 5 of 12 sites may be mispositioned. Interacts with `SITE_VISIT_RADIUS_M = 80` — a wrong coordinate silently denies visit credit, or grants it in the wrong place.
- **Fix:** Verify against OSM/Wikidata; update `seed/sites.json`; `npm run gen`.
- **Validation:** `npm run validate` shows 0 warnings.

### M3 — The 200/day merit cap is duplicated in TS and SQL

- **Evidence:** [shared/merit.ts](../../shared/merit.ts) and the `leaderboard` view in [0008](../../supabase/migrations/0008_leaderboard.sql) (`least(sum(points), 200)`). The view's comment names the file, but nothing enforces agreement.
- **Impact:** Changing one silently diverges client and server totals.
- **Fix:** Cannot be fully DRY across the boundary. Add a comment in `shared/merit.ts` pointing at 0008, and a checklist item.

### M4 — Point values are duplicated the same way

- **Evidence:** The view hardcodes 50 (observation), 25 (condition report), 30 (quest submission). Client merit rules live in [core/merit/rules.ts](../../core/merit/rules.ts).
- **Impact:** Same divergence risk as M3.

### M5 — `PROJECT.md` is stale

- **Evidence:** References `hooks/useUserPreferences.ts` (**does not exist** — it is `usePreferences()` in `store/preferences.tsx`) and screen names that no longer match: `SettingsHomeScreen`, `PermissionsSettingsScreen`, `StorageExportScreen`, `OfflineRetentionScreen`, `AboutLegalScreen` (actual: `SettingsScreen`, `PermissionsScreen`, `StorageScreen`, `SyncScreen`, `AboutScreen`).
- **Impact:** An agent following it looks for files that do not exist.
- **Fix:** Update, or add a pointer to `docs/ai-context/`.

### M6 — `features/practice/` is a barrel with no screen

- **Evidence:** Contains only `index.ts`. Merit UI lives in `components/practice/` and `store/practice.tsx`.
- **Impact:** Misleading structure.
- **Fix:** Remove, or document why it is reserved.

### M7 — Two components named `PermissionsScreen`

- **Evidence:** [features/onboarding/PermissionsScreen.tsx](../../features/onboarding/PermissionsScreen.tsx) and [features/settings/PermissionsScreen.tsx](../../features/settings/PermissionsScreen.tsx).
- **Impact:** Easy to edit the wrong one.
- **Fix:** Rename one (e.g. `OnboardingPermissionsScreen`).

### M8 — No CI/CD

- **Evidence:** No `.github/workflows/`, `.gitlab-ci.yml`, or equivalent.
- **Impact:** Nothing enforces `verify` before merge.

### M9 — 22 npm vulnerabilities

- **Evidence:** `npm install` reports 22 (13 moderate, 9 high).
- **Impact:** Unassessed. Most are likely transitive dev-tooling.
- **Fix:** `npm audit` to itemise. **Do not run `npm audit fix --force`** — it can break the Expo SDK version alignment.

### M10 — Background location may be missing for arrivals

- **Evidence:** `app.json` declares only `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `CAMERA`. Geofencing uses `expo-task-manager` + `expo-location`.
- **Impact:** Arrival notifications may not fire with the app backgrounded — the main use case (walking the garden with the phone pocketed).
- **Status:** **Needs verification** on a device.

### M11 — Expo SDK is behind

- **Evidence:** Dev server reports `expo 57.0.11 → ~57.0.16` available, "16 other packages may need updating."
- **Fix:** `npx expo install --check`.
- **Risk:** Low within a patch range, but touches native modules — rebuild and retest the map and detector.

---

## Low

### L1 — Two animation systems coexist
Reanimated 4 (`Reticle`, `OnboardingFrame`, `AlignmentRehearsal`) vs RN `Animated` (`SpeechCloud`). Related to H3.

### L2 — `npm run android` / `ios` do not target a platform
Both run bare `expo start`. Misleading names.

### L3 — Two Dhamma eval scripts
[tools/dhamma-eval.mjs](../../tools/dhamma-eval.mjs) (wired to `eval:dhamma`) and [tools/run-dhamma-eval.mjs](../../tools/run-dhamma-eval.mjs) (not wired). Purpose of the second: **Needs verification**.

### L4 — Vitest harness may be dormant
[tools/test/](../../tools/test/) has its own `package.json` and `vitest.config.ts`, but no root script invokes it. **Needs verification.**

### L5 — `MODULE_TYPELESS_PACKAGE_JSON` warnings on every test file
Noise from no `"type": "module"` in `package.json`. Cosmetic.

### L6 — ~700 KB of unaudited root documentation
`SAKSHI-COMPLETE.md` (384 KB), `handbook.md` (156 KB), `documentation.md` (58 KB), `explanation.md` (34 KB), `SAKSHI-PROJECT-STATUS.md` (32 KB), `HANDOFF-PHASE-8-9.md` (21 KB). Not verified against code; may contain further stale claims like M5.

### L7 — `EXPO_PUBLIC_API_URL` may be unused
Documented in `.env.example` and served by `mock-api/`, but **no app-code importer was found**. Either dead config or a path not traced. **Needs verification.**

### L8 — Accessibility is unverified
Some `accessibilityLabel` / `accessibilityHint` props exist. No systematic audit, no tests.

### L9 — Circuit breaker call sites untraced
[core/net/breaker.ts](../../core/net/breaker.ts) is implemented and tested, but no consumer was confirmed. May be dead code. **Needs verification.**

### L10 — iOS never verified
Configured (`supportsTablet`, bundle id) but no evidence of an iOS build. EAS submit config is Android-only.

---

## Security notes

| Item | Assessment |
|---|---|
| `EXPO_PUBLIC_*` in the bundle | **Correct by design** — publishable values only; documented clearly |
| RLS owner-scoping (0006) | **Good** — `user_id` from JWT default, never client-sent |
| Private storage buckets | **Good** — both non-public |
| Leaderboard view | **Good** — aggregate only; explicit privacy contract |
| `profiles` retains `anon` write post-0007 | ⚠️ Handles are spoofable — **acknowledged in the table comment**; scores are not affected |
| `google-play-service-account.json` | Correctly absent and `.easignore`d |
| Anonymous auth | Reinstall = new identity, **documented as a known limitation** |

**No secrets were found committed** in the audited files.

---

## Performance notes

| Item | Note |
|---|---|
| ~11 MB dev JS bundle | Normal for RN dev; production is minified |
| `assetBundlePatterns: assets/**/*` | Ships ~20 MB of assets. Deliberate — offline operation |
| ONNX inference on device | Untested for latency in this audit |
| No list virtualisation confirmed | Site/quest lists are small (12/10 items) — not a concern yet |

---

## Priority order *(Suggested)*

1. **C1** — verify Supabase auth/migration state (operational, zero code risk)
2. **H1** — delete the dead `data/demo/sites.ts` (removes a silent-failure trap)
3. **M2** — resolve the 5 coordinate warnings (data correctness)
4. **H3 → H2** — fix `SpeechCloud`, then add `lint` to `verify`
5. **M1** — type-check `core/` in `verify`
6. **H5** — first React-layer tests
7. **H4** — migrate off `expo-file-system/legacy` (carefully — evidence path)

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*

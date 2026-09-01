# Testing and Quality

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

All results below were **actually executed** during this audit.

---

## 1. Quality gate summary

| Check | Command | Result at this commit |
|---|---|---|
| Type check | `npm run typecheck` | ✅ Clean |
| Unit tests | `npm test` | ✅ **126/126 pass** |
| Seed validation | `npm run validate` | ✅ Pass, 5 warnings |
| Vocabulary lint | `npm run vocab` | ✅ Clean |
| Dhamma eval | `npm run eval:dhamma` | ✅ **50/50** |
| **ESLint** | `npm run lint` | ❌ **16 errors** |
| Aggregate | `npm run verify` | ✅ Passes (**excludes lint**) |

> **The most important fact here:** `npm run verify` = `typecheck && test && validate && vocab && eval:dhamma`. **`lint` is not in the chain.** That is how 16 lint errors coexist with a green `verify`. If you want a true all-green gate, run `npm run verify && npm run lint`.

---

## 2. Two test mechanisms

### 2.1 Primary: zero-install Node runner — [tools/run-tests.mjs](../../tools/run-tests.mjs)

`npm test` → `node tools/run-tests.mjs`. Its own header states the design intent:

> "the zero-install test runner. Globs core for `*.test.ts` and runs them under Node's built-in test runner with type-stripping. **No npm install, nothing to break on venue wifi.**"

Mechanics:
- Recursively finds `*.test.ts` under **`core/` only**
- Runs `node --experimental-strip-types --test <files>`
- Exits 1 if no tests found

This is a hackathon-pragmatic choice: the suite runs with nothing installed, which matters when demoing on unreliable connectivity.

**Known noise:** every test file emits `MODULE_TYPELESS_PACKAGE_JSON` warnings ("Reparsing as ES module … incurs a performance overhead"). Harmless; would be silenced by `"type": "module"` in `package.json`, which is not set.

### 2.2 Secondary: Vitest harness — [tools/test/](../../tools/test/)

A richer harness exists at [tools/test/](../../tools/test/) — `package.json`, `tsconfig.json`, `vitest.config.ts`, plus [tools/tsconfig.test.json](../../tools/tsconfig.test.json).

Per the runner's header, this is "vitest + coverage + tsc --noEmit … for when you have a working npm; this is the fallback that always runs."

> Vitest is **not** a dependency of the root `package.json` and there is **no root npm script that invokes it**. It has its own nested package manifest. Whether it currently runs is **Needs verification** — treat `npm test` as the live suite.

### 2.3 Where `core/` gets type-checked

The root `npm run typecheck` **excludes** `core/` and `shared/` ([tsconfig.json](../../tsconfig.json) `exclude`). Their type checking belongs to [tools/test/tsconfig.json](../../tools/test/tsconfig.json) / [tools/tsconfig.test.json](../../tools/tsconfig.test.json).

**Implication:** a type error introduced in `core/` will **not** be caught by `npm run verify`. The tests will catch runtime breakage, but not type-only regressions.

---

## 3. Test inventory — 18 files, 126 tests

**Every test file lives under [core/](../../core/).** There are **zero** component tests, zero screen tests, zero hook tests, zero integration or E2E tests.

| Test file | Covers |
|---|---|
| [core/alignment/score.test.ts](../../core/alignment/score.test.ts) | Viewpoint alignment scoring |
| [core/chaityavali/register.test.ts](../../core/chaityavali/register.test.ts) | Site register |
| [core/dana/allocation.test.ts](../../core/dana/allocation.test.ts) | Dāna allocation |
| [core/dhamma/dhamma.test.ts](../../core/dhamma/dhamma.test.ts) | Dhamma retrieval/engine |
| [core/dhamma/llm.test.ts](../../core/dhamma/llm.test.ts) | LLM provider layer |
| [core/dhamma/reflection.test.ts](../../core/dhamma/reflection.test.ts) | Reflection generation |
| [core/guide/index.test.ts](../../core/guide/index.test.ts) | Guidance |
| [core/map/map.test.ts](../../core/map/map.test.ts) | Geofence / pradakshina |
| [core/merit/merit.test.ts](../../core/merit/merit.test.ts) | Merit rules and daily cap |
| [core/net/breaker.test.ts](../../core/net/breaker.test.ts) | Circuit breaker |
| [core/progression/progression.test.ts](../../core/progression/progression.test.ts) | Progression |
| [core/quests/quests.test.ts](../../core/quests/quests.test.ts) | Quest registry/logic |
| [core/session/session.test.ts](../../core/session/session.test.ts) | Session + close ritual |
| [core/story/story.test.ts](../../core/story/story.test.ts) | Story sequences |
| [core/vision/candidate.test.ts](../../core/vision/candidate.test.ts) | Detection candidates |
| [core/vision/detect.test.ts](../../core/vision/detect.test.ts) | Detection pipeline |
| [core/vision/letterbox.test.ts](../../core/vision/letterbox.test.ts) | Image letterboxing + inverse transform |
| [core/vision/yolo.test.ts](../../core/vision/yolo.test.ts) | YOLO decode, IoU, NMS |

The vision and merit suites are notably thorough — e.g. `letterbox` tests the forward transform, its inverse, clamping, corner normalisation, degenerate geometry, and CHW plane layout; `yolo` tests both channel-major and transposed output layouts, argmax class selection, IoU bounds, NMS suppression and the detection cap.

---

## 4. Content-quality gates (unusual, and worth knowing)

This project verifies **content**, not just code.

### 4.1 Seed validation — [tools/validate-seed.mjs](../../tools/validate-seed.mjs)

```
seed: 12 sites, 6 vantages, 10 quests, 3 needs, 5 timeline, 10 plates
OK — no errors, 5 warning(s).
```

The 5 warnings are all the same class — sites whose coordinates are still documentation-sourced:

`puskarini`, `marker-stone`, `vihara-remains`, `tilaurakot`, `ramagrama` — each *"coords still 'doc' — verify against OSM/Wikidata before shipping"*.

**These are tracked, accepted warnings.** They represent real data debt: 5 of 12 sites may have imprecise coordinates, which matters because [constants/geo.ts](../../constants/geo.ts) uses an 80 m `SITE_VISIT_RADIUS_M` to credit a visit.

### 4.2 Vocabulary lint — [tools/lint-vocab.mjs](../../tools/lint-vocab.mjs)

```
vocab: clean — content and app sweeps pass, and no em dash reaches a reader.
```

The project enforces its **own terminology and typography** across code and content. Note the explicit em-dash prohibition in user-facing text, and the allow-list mechanism seen in [services/index.ts](../../services/index.ts):

```ts
export * as leaderboard from './leaderboard'; // lint-vocab:allow — the ranking surface, exempted by team decision
```

**If you add user-facing copy, run `npm run vocab`.** Use `// lint-vocab:allow` with a reason only when the team has decided the term is warranted.

### 4.3 Dhamma answer eval — [tools/dhamma-eval.mjs](../../tools/dhamma-eval.mjs)

```
   answerable     18/18
   adjacent       10/10
   out_of_scope   12/12
   adversarial     6/6
   nepali          4/4
   total          50/50

Citations naming an unretrieved passage: 0
```

This is a **grounding/hallucination gate**. It checks not only that answerable questions are answered, but that out-of-scope and adversarial prompts are correctly refused, that Nepali-language queries work, and — critically — that **zero citations name a passage that was not actually retrieved**.

**That last line is the anti-fabrication invariant.** If you change retrieval, synthesis, or citation formatting in [core/dhamma/](../../core/dhamma/), this number must stay 0.

---

## 5. Lint failures — the one real code-quality defect

`npm run lint` reports **16 errors, all in one file**:

| File | Rule | Count |
|---|---|---|
| [components/monk/SpeechCloud.tsx](../../components/monk/SpeechCloud.tsx) | `react-hooks/refs` | 15 |
| [components/monk/SpeechCloud.tsx](../../components/monk/SpeechCloud.tsx) | `react-hooks/set-state-in-effect` | 1 |

Representative error:

```
components\monk\SpeechCloud.tsx:151:29
  { translateY: cloudAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                ^^^^^^^^^ Passing a ref to a function may read its value during render
```

**Diagnosis:** the component holds an `Animated.Value` in a ref and calls `.interpolate()` on it during render. Under the React Compiler-era `react-hooks` rules this is flagged as reading a ref during render.

**Severity: Low–Medium.** The code very likely works at runtime (this is a long-standing `Animated` idiom), but it blocks a clean lint run and could break under future React Compiler optimisation.

**No other file in the codebase produces a lint error.**

---

## 6. Coverage gaps — what is NOT tested

| Area | Test coverage |
|---|---|
| `core/` domain logic | ✅ Good — 126 tests |
| Screens (`features/**/*Screen.tsx`) | ❌ **None** |
| Components (`components/**`) | ❌ **None** |
| Hooks (`hooks/**`) | ❌ **None** |
| Stores (`store/**`) | ❌ **None** |
| Services (`services/**`) | ❌ **None** |
| Navigation / routing | ❌ **None** |
| Supabase sync round-trip | ❌ **None** |
| Camera / capture flow | ❌ **None** |
| Permissions flow | ❌ **None** |
| E2E | ❌ **None** — no Detox, Maestro, or Playwright config |

**The entire React layer is untested.** Everything in the table's bottom half is verified by hand only.

> `@testing-library/*` and `react-test-renderer` types appear in the lockfile as transitive dependencies, not as configured test tooling. Do not mistake their presence for a component test setup.

---

## 7. High-risk regression areas

Ranked by (blast radius × absence of automated coverage):

1. **Capture → sync pipeline** — [features/sakshi/CaptureScreen.tsx](../../features/sakshi/CaptureScreen.tsx) → [services/supabase/sync.ts](../../services/supabase/sync.ts). Untested, involves camera + filesystem + storage upload + DB upsert, and has a strict ordering invariant (upload before row insert).
2. **Provider nesting / boot gate** — [app/_layout.tsx](../../app/_layout.tsx) + [store/index.tsx](../../store/index.tsx). A mistake here is a white screen at launch, and nothing tests it.
3. **Supabase client lazy construction** — [services/supabase/index.ts](../../services/supabase/index.ts). Moving it to module scope crashes every screen on a clone without `.env.local`. Documented in-source as a past regression.
4. **RLS / migration ordering** — applying [0007](../../supabase/migrations/0007_retire_anonymous_writes.sql) before anonymous sign-in is enabled breaks all writes. No test can catch this; it is an operational check.
5. **Dhamma citation grounding** — covered by `eval:dhamma`, but that gate must be re-run after any retrieval change.
6. **`components/ui/*` primitives** — used by nearly every screen; a change there regresses broadly with no test to catch it.
7. **Metro asset extensions** — [metro.config.js](../../metro.config.js). Dropping `wasm`/`opus`/`onnx` silently breaks audio, SQLite-on-web, or the detector at runtime only.

---

## 8. Manual smoke-test checklist

No automated E2E exists, so this is the real regression net. Derived from the feature set and route map; **not yet executed end-to-end on a device during this audit.**

### Boot & onboarding
- [ ] Fresh install launches to `/onboarding/welcome` (not a flash of the main app)
- [ ] Walk all 5 steps: welcome → purpose → how-it-works → align → permissions
- [ ] Alignment rehearsal responds to device motion
- [ ] Permission prompts appear; denying still allows completing onboarding
- [ ] Completing onboarding lands on the Tīrtha map
- [ ] Relaunch goes **straight** to the map, with no onboarding flash

### Navigation
- [ ] All three tabs switch: Tīrtha, Sākṣī, Dhamma
- [ ] Settings is reachable from the header on each surface, and is **not** a tab
- [ ] Push into a site detail — tab bar stays visible
- [ ] Back pops within the surface, not out of it

### Tīrtha
- [ ] Map renders and shows sites (needs a full build, not Expo Go)
- [ ] Tapping a site opens its detail page
- [ ] Then/Now comparison renders both plates
- [ ] Narration audio plays
- [ ] Quest list, quest detail, quest completion screens render

### Sākṣī (capture)
- [ ] Vantage list shows the 6 seeded vantages
- [ ] Camera opens with the reticle overlay
- [ ] Alignment readout responds to movement; tolerance gate engages
- [ ] Capture succeeds in **aligned** mode
- [ ] Capture succeeds in **by-eye/manual** mode
- [ ] Captured frame opens the comparison review with the previous/reference image
- [ ] Submission data matches the shutter-time coordinate, bearing, pitch, GPS accuracy, errors, score and gate mode
- [ ] Retake returns to the camera without adding an observation to the local register
- [ ] Submit persists the photo and local observation before opening the observation screen
- [ ] Damage detection overlay runs on the captured frame
- [ ] Condition report can be filed against an observation
- [ ] Observation appears in the local register

### Dhamma
- [ ] Ask an answerable question → grounded answer **with citations**
- [ ] Ask an out-of-scope question → refused, not fabricated
- [ ] Ask in Nepali → works
- [ ] With **no** `EXPO_PUBLIC_LLM_API_KEY`: still answers via deterministic retrieval
- [ ] Reflection screen works

### Sync & offline
- [ ] Capture with airplane mode on → queues locally, no crash
- [ ] Restore network, background then foreground the app → sync fires
- [ ] Sync screen shows pending/synced state
- [ ] Re-running sync does **not** duplicate rows (upsert idempotency)
- [ ] With Supabase unconfigured, the app still runs and shows a directed message

### Permissions & settings
- [ ] Deny location → app degrades, no crash
- [ ] Permanently deny → "open settings" path works
- [ ] Every preference toggle persists across restart
- [ ] Storage screen reports usage; reset works
- [ ] Offline-AI screen reflects model state

### Arrivals
- [ ] `simulateArrival` produces a notification
- [ ] Tapping a **site** arrival opens that site's page
- [ ] Tapping a **precinct** arrival opens the map
- [ ] Re-entering the same precinct does not re-notify immediately

---

## 9. Recommended additions *(Suggested — not a project requirement)*

1. Add `lint` to `verify`, after fixing the 16 `SpeechCloud.tsx` errors.
2. Add a smoke test for provider composition and the boot gate — the highest-blast-radius untested code.
3. Add a test for `isConfigured()` returning `false` on `.env.example` placeholder values.
4. Type-check `core/` in CI via [tools/tsconfig.test.json](../../tools/tsconfig.test.json), closing the `verify` gap.
5. Resolve the 5 `coords still 'doc'` warnings before any public release.
6. Introduce CI (none exists) running `npm run verify && npm run lint`.

---

## Needs verification

1. Whether the Vitest harness in [tools/test/](../../tools/test/) currently runs, and what it covers beyond `npm test`.
2. Whether [tools/run-dhamma-eval.mjs](../../tools/run-dhamma-eval.mjs) differs from [tools/dhamma-eval.mjs](../../tools/dhamma-eval.mjs) (two similarly named scripts exist; only the latter is wired to a npm script).
3. Whether [TEST_INFRA.md](../../TEST_INFRA.md) at repo root still matches this setup.
4. Actual device behaviour for the checklist above — not executed in this audit.

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*

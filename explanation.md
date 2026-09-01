# Sākṣī: Code Explanation, File by File

*A comprehensive walkthrough of the code in this project. It is organized by
folder, and within each folder it explains every file: what it is for, what it
exports, and how its logic works. Read it beside the code.*

*A note on scope: the project is about 45,000 lines across roughly 357 source
files. A literal line-by-line transcript of all of them would be longer than the
code and far less useful. Instead this explains every file's purpose and its key
logic in detail, so you can open any file and know exactly what you are looking
at and why. The deepest, most important logic (alignment, the Dhamma engine, the
vision pipeline, the database) is explained closest to the line.*

*Last updated: 2026-08-10.*

---

## Table of contents

1. [The mental model of the whole codebase](#1-the-mental-model-of-the-whole-codebase)
2. [`shared/` the ground floor](#2-shared-the-ground-floor)
3. [`core/` the pure brain](#3-core-the-pure-brain)
4. [`types/` the domain vocabulary](#4-types-the-domain-vocabulary)
5. [`constants/`, `theme/`, `utils/`](#5-constants-theme-utils)
6. [`seed/` and `data/` the content pipeline](#6-seed-and-data-the-content-pipeline)
7. [`services/` the boundaries to the outside](#7-services-the-boundaries-to-the-outside)
8. [`hooks/` reusable behaviour](#8-hooks-reusable-behaviour)
9. [`store/` app-wide state](#9-store-app-wide-state)
10. [`components/` the UI toolkit](#10-components-the-ui-toolkit)
11. [`features/` the screens](#11-features-the-screens)
12. [`app/` the route tree](#12-app-the-route-tree)
13. [`tools/` the scripts and the gate](#13-tools-the-scripts-and-the-gate)
14. [`mock-api/` and `supabase/` the backend](#14-mock-api-and-supabase-the-backend)
15. [`patches/` and root config files](#15-patches-and-root-config-files)
16. [How a single tap flows through the layers](#16-how-a-single-tap-flows-through-the-layers)

---

## 1. The mental model of the whole codebase

Before the files, hold this picture. Data and control flow **inward and then back
out**:

```
app/        (routes: read params, render a screen)
  |
features/   (the screen: state, layout, user interaction)
  |
components/ (reusable UI pieces) and hooks/ (reusable behaviour)
  |
services/   (talk to the phone and the cloud: camera, GPS, DB, sync, AI runtimes)
  |
core/       (pure logic: no phone, fully testable)
  |
shared/     (tiny math and type primitives both app and core use)
```

The single rule that keeps this clean: **`core/` and `shared/` import nothing from
above them.** They are pure. That is why `npm run test` can run them on a laptop
with no phone attached.

Two support columns sit beside this stack: **`seed/` -> `data/`** (content), and
**`types/`, `constants/`, `theme/`, `utils/`** (shared vocabulary and helpers).

---

## 2. `shared/` the ground floor

Three tiny files that both the app and the pure core depend on. They are kept
separate from `core/` so there is no import cycle.

- **`shared/geo.ts`** Pure geodesy and number helpers. The most used export is
  `clamp01(x)` (force a number into the 0 to 1 range), which the alignment scorer
  leans on. Also holds distance and bearing math between two lat/long points, used
  by geofencing and the map. No dependencies, so it is safe to import anywhere.
- **`shared/merit.ts`** The merit constants and the shape of a merit event, shared
  between the on-device ledger (`core/merit`) and the server-side scoring, so both
  sides agree on what an action is worth.
- **`shared/types.ts`** The canonical `Citation` and `Passage` types for the
  Dhamma engine. They live here, in one place, because they used to be declared in
  two files with identical fields, which made `@/core` ambiguous and refused to
  compile (TypeScript TS2308). Declaring them once here and re-exporting fixed the
  barrel.

---

## 3. `core/` the pure brain

This is the most important folder to understand. Everything here is pure
TypeScript with no React and no device APIs, and almost every module has a
`.test.ts` beside it.

### `core/index.ts` and `core/INTEGRATION.md`

`index.ts` is the barrel that re-exports the public core API. `INTEGRATION.md`
documents the contract other lanes import against.

### `core/alignment/score.ts` (the survey instrument)

The single most important pure function in the app: `alignmentScore(input)`. It
takes the distance from the vantage, the heading delta, the pitch delta, the
tolerances, and the GPS accuracy, and returns the sub-scores, the combined
`align`, whether the shutter `canLock`, and `blockedBy` (what to fix first).

Key logic, line by line in spirit:

- `sPos`, `sHead`, `sPitch` are each `clamp01(1 - error / tolerance)`. A perfect
  match scores 1, a match at the tolerance edge scores 0.
- Missing position or heading scores **0**, because they are required, not
  assumed. Missing pitch degrades to `1` ("assume level") rather than blocking,
  because a phone held roughly upright is usually fine.
- The weighted combination is `0.30*sPos + 0.50*sHead + 0.20*sPitch`. Heading has
  the highest weight because facing the wrong way makes the photo worthless.
- The lock gate is a series of `if`s in the order the hint should nag you: GPS
  first (must be `<= 15 m`), then a hard **heading floor** (`sHead >= 0.5`, so a
  great GPS fix can never lock a photo that faces the wrong way), then the overall
  `align >= 0.75`. When only the overall threshold fails, it names the weakest
  axis so the hint is specific.

`score.test.ts` checks the weights, the floors, the null handling, and the
`blockedBy` ordering.

### `core/dhamma/` (the grounded question engine)

The most validated subsystem. Files:

- **`engine.ts`** The pipeline. `askDhamma(req)` is the synchronous, deterministic
  path and `askDhammaAsync(req)` layers a real LLM on top. The order inside
  `askDhamma`:
  1. `isDomainQuery` gate. The question is split into tokens and checked against
     `DOMAIN_VOCAB`, a large hand-curated set of Pali, Buddhist, pilgrimage, and
     Nepali terms. No domain token means an immediate refusal, before any work.
     The long comment above it explains *why* there is no numeric retrieval
     threshold: measured across the benchmark, the scores for "should answer" and
     "should refuse" overlap almost entirely, so a number would either admit
     nonsense or refuse legitimate questions. The vocabulary gate carries the
     refusal instead.
  2. `IMPERSONATION_PATTERNS`, a list of regexes catching "speak as the Buddha",
     prompt-injection ("previous instructions", "no restrictions"), and
     fabricated-citation bait ("Buddha said X, what sutta?"). Any match refuses.
  3. `DEMO_CACHE`, five hand-written, fully-cited answers for the scripted demo
     questions, so a dead venue wifi cannot break the presentation.
  4. `hybridRetrieve` returns the top passages; if none, refuse.
  5. A `passages_only` mode returns sources with no generated prose.
  6. Otherwise it builds a deterministic answer from the top chunk, validates its
     citation, and returns it with `tier: 'full_rag'`.
  `askDhammaAsync` first runs the sync path; if it refused or is a non-Nepali
  cached answer it returns as-is. Otherwise, and **only if `hasProvider()`**, it
  calls the cloud LLM through `callLlm`, trims a truncated reply back to the last
  complete sentence, and runs `validateCitations` on the result. An LLM answer
  whose citations do not survive validation is **discarded** in favour of the
  cited deterministic answer, because attaching unchecked references to prose is
  the one thing the engine exists to prevent.
  `validateCitations` scans for `[segment_id]` brackets, resolves each against the
  retrieved set, deduplicates by segment (so the same source cited twice does not
  render as two passages or trigger React key warnings), and returns clean
  `Citation` objects.
- **`retrieval.ts`** `hybridRetrieve` fuses lexical and semantic search with
  reciprocal rank fusion (RRF), returning the best chunks for a query.
- **`bilara.ts`** Resolves a citation id like `dn16:6.7` to its chunk and sutta
  metadata (`resolveSegment`). Bilara is the segmentation format that gives stable
  ids.
- **`corpus.generated.ts`** The canonical passages, generated from source, never
  edited by hand. It is on the vocabulary linter's skip list because it is
  translated scripture, not app copy.
- **`llm.ts`** The single provider client. `callLlm(system, user, maxTokens)`
  returns `{ text, truncated }` and **never throws** (a failed call returns null),
  so callers degrade instead of crashing. `hasProvider()` reports whether a
  credential exists, so no call is attempted without one. `trimToCompleteSentence`
  cuts a truncated reply back to its last full stop. This file replaced three
  hand-rolled copies of the same request that each had the same three bugs (a
  token ceiling that severed answers, an untyped network `data`, and a leaked
  timer).
- **`reflection.ts`** The "reflection companion" path: for personal questions it
  offers inquiry ("what might you notice...") rather than advice.
- **`eval.ts`** The benchmark harness used by `tools/dhamma-eval.mjs`.
- **`index.ts`** The Dhamma barrel.
- Tests: `dhamma.test.ts`, `llm.test.ts`, `reflection.test.ts` cover the gates,
  the citation validation, the provider client, and the reflection tone.

### `core/vision/` (the crack detector's pure half)

The geometry and decoding, kept pure so they can be tested without a device or a
model.

- **`letterbox.ts`** Resizes a photo to the model's square input while keeping
  aspect ratio and padding the rest with grey, and (crucially) provides the
  inverse mapping so detection boxes can be placed back on the original photo.
  Defines the `Box` type.
- **`yolo.ts`** Turns the model's raw output tensor into boxes.
  - `decodeYolo(data, dims, numClasses, confThreshold)` reads each anchor's box
    (`cx, cy, w, h`) and its best class score, drops anything under the
    confidence threshold, and returns corner-form boxes. It detects whether the
    export is channel-major `[1, 4+classes, anchors]` or its transpose, so either
    export decodes correctly. It invents nothing: every box out was in the tensor.
  - `iou(a, b)` is intersection-over-union, zero when boxes do not overlap.
  - `nms(boxes, iouThreshold, maxDetections)` is non-max suppression: keep the
    highest-scoring box, drop lower-scoring boxes of the **same class** that
    overlap it too much, cap the count. Different classes never suppress each other
    (a crack overlapping moss is two findings).
- **`detect.ts`** The pure orchestration that ties letterbox and yolo together
  into "pixels in, mapped boxes out".
- **`candidate.ts`** The decision layer that the UI reads. `canScan(status)`
  (which excludes the `'error'` state), `detectorMessage(...)` (the honest line
  explaining why a detector is or is not available), `topCandidate(...)`, and
  `candidateNote(...)`. This is the module that decides whether the scan button and
  results appear at all.
- Tests: `letterbox.test.ts`, `yolo.test.ts`, `detect.test.ts`,
  `candidate.test.ts` (the last covers exactly the decision that once hid the
  feature).

### `core/merit/` (puṇya, not points)

- **`rules.ts`** The weights: what each contributing action is worth. Unit-tested.
- **`cap.ts`** The daily cap logic. Past the cap, actions still record with
  `amount = 0`, so the ledger never lies by omission.
- **`ledger.ts`** The append-only ledger: the balance is `SUM(amount)`, never a
  stored mutable number.
- `merit.test.ts` covers weights, cap behaviour, and the ledger sum.

### `core/quests/` and `core/session/` (contemplative mechanics)

- **`registry.ts`** The quest definitions and availability logic (by proximity and
  time window).
- **`reports.ts`, `riddles.ts`, `stillness.ts`** The individual mechanics:
  evidence reports, riddle checking, and the stillness timer.
- **`session/closeRitual.ts`, `session/notifications.ts`** The end-of-visit ritual
  and the arrival/notification policy.
- Tests: `quests.test.ts`, `session.test.ts`.

### The rest of `core/`

- **`guide/index.ts`** The on-site guide's voice as pure text, shared with the
  backend. Exports `guideSystem(lang)` (the system prompt making it a warm on-site
  guide), `guidePrompt(question, site, name)` (the per-question prompt carrying the
  site's own description), `tidyGuideText`, and the English/Nepali system strings.
  Its two hard rules live here: never state a monument's physical condition, and
  never claim to quote a source.
- **`map/geofence.ts`** Whether a point is inside a site's radius, used for
  arrivals. `map/pradakshina.ts` tracks ritual circumambulation. `map.test.ts`
  covers both.
- **`wisdom/index.ts`** The "wisdom tier" policy (`basic` to `custom`) shared by
  the site page and the arrival notification, so a `basic` user never gets a
  scriptural push.
- **`story/index.ts`** The story-beat sequencing for story mode. `story.test.ts`.
- **`chaityavali/register.ts`** The shrine-register logic. `register.test.ts`.
- **`dana/allocation.ts`** The (deferred) directed-giving allocation math.
  `allocation.test.ts`.
- **`progression/index.ts`** Visit progression state. `progression.test.ts`.
- **`copy/failure-lines.ts`** Honest, non-blaming copy for failure states, kept in
  core so both app and backend use the same words.
- **`adapters/coords.ts`** Coordinate adapters between formats.

---

## 4. `types/` the domain vocabulary

Pure TypeScript type definitions, no logic. Each file names one part of the
domain: `heritage.ts` (a Site, a Vantage), `condition.ts` (a ConditionReport and
its categories), `dhamma.ts` (question/answer shapes), `practice.ts` (merit and
practice), `quests.ts`, `precinct.ts`, `permissions.ts`, `preferences.ts`,
`source.ts` (citations and evidence tiers), and `declarations.d.ts` (module
declarations for asset imports like `.onnx` and images). `index.ts` re-exports
them. These are the shared nouns every other layer speaks.

---

## 5. `constants/`, `theme/`, `utils/`

**`constants/`** Fixed values: `app.ts` (identity strings, app-wide constants),
`geo.ts` (Lumbini geography, default coordinates), `storage.ts` (the string keys
for every stored preference, namespaced like `sakshi.v1.preferences.*`), and
`index.ts`.

**`theme/`** The design tokens. `colors.ts` (the palette, including the one blue
reserved for "locked"), `typography.ts` and `fonts.ts` (Anek, IBM Plex Sans and
Mono, wired but falling back to the platform default until the licensed files are
added), `spacing.ts`, `radii.ts`, `layers.ts` (z-index layers), `mapStyle.ts`
(the MapLibre style), and `index.ts`. The rule: nothing outside `components/ui`
names a raw colour or font; everything goes through these tokens.

**`utils/`** Pure helpers: `format.ts` (number, distance, and date formatting),
`geo.ts` (app-side geo helpers), `alignmentHint.ts` (turns a `blockedBy` value
into human hint text), and `index.ts`.

---

## 6. `seed/` and `data/` the content pipeline

**`seed/`** is the source of truth for content, as human-editable JSON: `sites`,
`vantages`, `quests`, `plates` (historical images), `history`, `narration`,
`timeline`, and more (17 files). Humans edit here.

**`data/`** is what the app imports. `data/generated/*.ts` is produced from the
seed by `tools/gen-data.mjs` and never hand-edited; it contains the literal
`require('./path')` calls Metro needs to bundle images and audio offline.
`data/index.ts` is the single adapter: one place decides whether the app reads
generated or demo content, and it exports the lookups screens use, like
`findSite(id)`. `data/audio.ts` registers narration clips. This is why editing a
JSON file, running `npm run gen`, and rebuilding is the whole content workflow.

---

## 7. `services/` the boundaries to the outside

Every connection to the phone or the cloud has exactly one file here. `index.ts`
is the barrel (`export * as camera from './camera'`, and so on), so screens import
`{ camera, location, dhamma, guide } from '@/services'`.

- **`ai/onnx.ts`** The only file that touches the native ONNX runtime. It loads
  the runtime and the model behind guards, and (after the fix) records *why* a load
  failed via `onnxUnavailableReason`, so a missing binary is distinguishable from a
  missing model. It loads the model by local URI where possible and falls back to
  base64. All three device-only seams (runtime load, resize API, box coordinate
  space) are isolated here.
- **`ai/yoloEngine.ts`** The React-facing detector. `useOnnxDamageDetector` is a
  hook exposing `{ status, scan, boxes, reason, ... }`; `scanToSuggestion` turns a
  detection into a pre-filled condition draft (using `topCandidate` and
  `candidateNote` from core). The `status` reducer carries the real error message
  now, so a failed scan no longer says "still loading" forever.
- **`camera/index.ts`** Camera permission and capture helpers, including copying
  the photo out of the temporary cache into durable storage.
- **`location/index.ts`** GPS access and watching; `demoWalk.ts` simulates walking
  a route for demos; `watchTeardown.ts` safely stops a location watch.
- **`sensors/index.ts`** Compass heading and motion/pitch.
- **`database/index.ts`** The SQLite layer. It defines the migration array (each
  entry is a version; `CREATE TABLE`/`ALTER TABLE` statements for `observations`,
  `condition_reports`, `merit_events`, `site_visits`, `quests`, `quest_progress`,
  `quest_completions`, `quest_submissions`, and later additions of `align_score`,
  `gps_acc_m`, `gate_mode`, a `synced` flag, and `ai_assisted`). `migrate(db)`
  reads `PRAGMA user_version`, applies only the migrations past it in order, and
  bumps the version after each. It also holds the typed CRUD helpers every record
  uses. Migrations are append-only: never edit an old one.
- **`storage/index.ts`** AsyncStorage key-value preferences, keyed by
  `constants/storage.ts`.
- **`supabase/index.ts`, `auth.ts`, `sync.ts`** The cloud client, anonymous auth,
  and the record sync (photo to the private bucket first, then the row).
- **`sync/index.ts`** The higher-level sync orchestration and queue.
- **`dhamma/index.ts`** The app-side Dhamma service: calls the backend
  `/dhamma/ask`, or falls back to the deterministic engine in `core`.
- **`guide/index.ts`** The app-side guide service. `askGuide(request)` resolves in
  order backend, then a direct provider call if a credential is present, then the
  site's own bundled description; it never throws and never refuses.
  `usableGuideText` trims a truncated provider reply and requires at least 40
  characters, else it falls through. `fallbackReply` and `opening` keep the guide's
  voice in one place.
- **`offlineModel/index.ts`** The optional on-device LLM. `offlineModelStatus()`
  reports `unsupported / missing / downloading / ready / error`; it reads a
  `.verified` marker instead of hashing 484 MB before every answer.
  `downloadOfflineModel` is resumable (it keeps the `.part` file and resume token
  and continues rather than restarting), verifies size and MD5 once at the end, and
  only then activates the file. `generateOfflineGroundedAnswer` runs llama.rn over
  retrieved passages and discards any answer that does not cite a real segment.
- **`arrival/index.ts`** Ties geofence crossings to the arrival experience.
- **`geofencing/index.ts`** Background geofence registration.
- **`notifications/index.ts`** Local notifications for arrivals, respecting the
  wisdom tier.
- **`audio/index.ts`** Narration playback.
- **`voice/index.ts`** Text-to-speech only, loaded lazily behind
  `isSpeechSupported()` so a build without `expo-speech` degrades to a no-op.
  Speech *input* was removed on purpose.
- **`device/index.ts`** Device info helpers.
- **`integrity/index.ts`** Contribution-integrity helpers for the server-scored
  leaderboard.
- **`leaderboard/index.ts`** The one place allowed to use the word "leaderboard",
  exempted in the linter. Fetches the server-computed ranking.
- **`questReview/index.ts`** Quest submission review helpers.
- **`permissions/index.ts`** A unified permission model. It distinguishes `denied`
  (ask again) from `blocked` (Settings only) so the UI never offers a dead button.

---

## 8. `hooks/` reusable behaviour

React hooks that compose services into behaviour screens can drop in.

- **`useAlignment.ts`** Combines position, heading, and pitch into a live
  `alignmentScore`, the engine behind the reticle.
- **`useCurrentPosition.ts`, `useHeading.ts`** Live GPS and compass.
- **`useNearbySites.ts`** Sites within range of the current position.
- **`useSiteArrival.ts`** Fires the arrival experience when you enter a geofence.
- **`useDemoWalk.ts`** Drives the simulated walk for demos.
- **`useHaptics.ts`** Haptic feedback, respecting the user preference.
- **`useNarration.ts`** Narration playback state.
- **`useStoryProgress.ts`** Story-beat progression.
- **`useSync.ts`** Sync status for the UI.
- **`useKeyboardInset.ts`** Measures the keyboard height from the window bottom.
- **`useSceneBottomGap.ts`** Measures how far a scene already sits above the window
  bottom (because Dhamma screens render inside the Tabs navigator). Screens pad by
  `max(0, keyboardInset - sceneGap)`, which is what closed the dead band under the
  composer.
- **`index.ts`** The barrel.

---

## 9. `store/` app-wide state

React Context providers for state that many screens share.

- **`app-state.tsx`** First-launch and global app state.
- **`permissions.tsx`** The live permission state, so the UI reacts to grants.
- **`preferences.tsx`** User preferences (units, photo quality, haptics, scripts,
  wisdom tier), backed by `services/storage`.
- **`practice.tsx`** Merit and practice state.
- **`quests.tsx`** Quest progress state.
- **`arrival.tsx`** The current arrival, shared between the geofence and the UI.
- **`index.tsx`** Composes all providers into one tree wrapped around the app.

---

## 10. `components/` the UI toolkit

Reusable UI, from primitives up to feature-specific pieces.

- **`ui/`** The primitive layer, and the only place allowed to name a raw colour
  or font: `Text`, `Button`, `Card`, `Chip`, `Badge`, `Divider`, `Icon`,
  `Screen`, `BottomSheet`, `MetaRow`, `ProgressIndicator`, `ProgressRing`. Every
  other component builds from these.
- **`chat/`** The Dhamma chat pieces: `ChatComposer` (the input bar, with a fixed
  bottom padding after the keyboard fix), `ChatBubble`, `ChatTranscript` (accepts a
  `paddingBottom` so it reserves room for the tab bar), `SourceList`.
- **`monk/`** `GreetingMonk` (the illustration) and `SpeechCloud` (the shared warm
  cloud with a monk slide-in, a typewriter reveal via `useTypingText`, a tail, and
  an eyebrow pill), used by both story mode and the on-site guide.
- **`observation/`** `ConditionSheet` (the structured condition report, opening at
  the first unfilled step), `PathologySummaryCard` (what the detector found, with
  honest confidence, and a one-tap "file this as a report"), and
  `YoloVisionOverlay` (the dashed candidate boxes drawn over the photo).
- **`reticle/`** `Reticle` (the alignment target, blue only when locked),
  `AlignmentReadout` (the live numbers), `CompassCalibrationPrompt`.
- **`thennow/`** `ThenNowCompare` (the fade between old and new) and
  `EvidenceTierLabel` (the trust label on every image).
- **`map/`** `SitePlan` (the pure-JS schematic map), `SiteMap3D` and `MapWebView`
  (the native MapLibre map, with `.web.tsx` fallbacks), and `mapHtml.ts` (the
  WebView bridge; exempt from the em-dash rule because it holds developer comments
  inside a template literal).
- **`source/`** `Citation`, `SourceCard`, `SourceDetailSheet` for showing Dhamma
  sources.
- **`site/`** `SiteListItem`, `VantageListItem`, `SiteVisual`, `NarrationPlayer`.
- **`series/`** `TimeSeriesScrubber` for scrubbing an observation time-series.
- **`timeline/`** `Timeline` for a site's historical timeline.
- **`arrival/`** `ArrivalWisdom` renders the arrival content at the chosen wisdom
  tier.
- **`practice/`** `MeritAcknowledgement` and `PracticeSummaryCard`.
- **`navigation/`** `SurfaceTabBar`, the three-surface bottom bar (the offline
  banner was unmounted here).
- **`voice/`** `SpeakButton`, the text-to-speech control.
- **`common/`** `EmptyState`, `ErrorState`, `LoadingState`, `ScreenHeader`,
  `SettingsButton`, `OfflineBanner` (built but no longer mounted).
- Each folder has an `index.ts` barrel; `components/index.ts` re-exports the lot.

---

## 11. `features/` the screens

The real screen implementations, grouped by surface. Each folder has an `index.ts`
barrel.

**`features/tirtha/`** The place layer. `TirthaScreen` (the surface home),
`LiveMapScreen` (the map dock, with the readout strip removed), `SiteDetailScreen`,
`ThenNowScreen`, `StorySequence` (story mode using the shared cloud), `BuddhaChat`
(the on-site guide, rebuilt to use the shared cloud, one exchange at a time),
`AskThisPlace`, `PlacePicker`, `QuestHud`, `QuestSheet`, `DemoWalkPanel`, and
`wisdom.ts`.

**`features/sakshi/`** The witness loop. `SakshiScreen` (the surface home),
`VantageScreen` (pick and line up a vantage), `CaptureScreen` (the shutter and
capture integrity), `ObservationScreen` (the post-capture screen that auto-runs the
scan when detector and photo are ready, shows the summary, and files the report
with `aiAssisted` carried through).

**`features/dhamma/`** The knowledge layer. `DhammaScreen` (the surface home, with
voice input removed), `DhammaChatScreen` (the grounded chat, with the "collections
searched" and suggestion furniture removed and the keyboard dead band fixed),
`ReflectionScreen` (the reflection companion, with a Nepali/English label table).

**`features/onboarding/`** The first-run flow: `WelcomeScreen`, `PurposeScreen`,
`HowItWorksScreen`, `PermissionsScreen`, `AlignScreen` with an
`AlignmentRehearsal`, wrapped in `OnboardingFrame`, sequenced by `steps.ts`.

**`features/quests/`** `QuestListScreen`, `QuestDetailScreen`,
`QuestCompletedScreen`, and components (`QuestCard`, `QuestCategoryBadge`,
`QuestProgressBar`, `QuestTaskItem`, `TaskEvidenceSheet`, `TaskProximity`).

**`features/settings/`** `SettingsScreen` and the sub-screens
(`PreferencesScreen`, `PermissionsScreen`, `StorageScreen`, `SyncScreen`,
`AboutScreen`, `ArrivalsScreen`, `OfflineAIScreen`) plus shared settings controls
(`SettingsRow`, `SettingsToggle`, `SettingsChoice`, `SettingsSection`).

**`features/leaderboard/`** `LeaderboardScreen` (the "Guardians" ranking).

**`features/chaityavali/`** `ChaityavaliScreen` and `SiteHistoryScreen`, the shrine
register and site-history browser.

**`features/practice/`** The practice summary entry point.

Each screen follows the same shape: read state from hooks and stores, lay out UI
from components, and call services or core for anything real.

---

## 12. `app/` the route tree

Thin files that map URLs to screens using Expo Router. A file's path is its route.

- **`app/_layout.tsx`** The root layout: wraps the whole app in the store
  providers and the font loader.
- **`app/index.tsx`** The entry redirect (to onboarding on first launch, else the
  main tabs).
- **`app/onboarding/`** The onboarding stack (`welcome`, `purpose`,
  `how-it-works`, `permissions`, `align`) with its `_layout.tsx`.
- **`app/(main)/_layout.tsx`** The main Tabs navigator that renders the three
  surfaces. This is why Dhamma scenes sit inside tabs, which is what
  `useSceneBottomGap` accounts for.
- **`app/(main)/tirtha/`** Routes: `index`, `map`, `site/[siteId]`,
  `then-now/[siteId]`, and the quest routes (`quests/index`, `quests/[questId]`,
  `quests/completed/[questId]`).
- **`app/(main)/sakshi/`** Routes: `index`, `vantage`, `capture`, `observation`,
  `guardians` (the leaderboard), `register/index`, `register/[siteId]`,
  `then-now/[siteId]`.
- **`app/(main)/dhamma/`** Routes: `index`, `question`, `reflect`.
- **`app/(main)/settings/`** The settings stack: `index`, `preferences`,
  `permissions`, `storage`, `sync`, `about`, `arrivals`, `offline-ai`.

Each route file reads its params (for example `siteId` from the URL) and renders
the matching feature screen. That is all a route does.

---

## 13. `tools/` the scripts and the gate

Node scripts (ESM `.mjs`) that build content and enforce quality.

- **`gen-data.mjs`** Reads `seed/*.json`, validates, and writes
  `data/generated/*.ts` with literal `require()` calls. Run with `npm run gen`.
- **`validate-seed.mjs`** The content gate: coordinates present, evidence tiers
  set, every referenced image exists on disk. `npm run validate`.
- **`run-tests.mjs`** The pure-logic test runner over all the `core/*.test.ts`
  files (over 110 tests). `npm run test`.
- **`lint-vocab.mjs`** The vocabulary and em-dash linter. It has two scopes:
  content dirs (`seed`, `core`, `deck`) get the full banned list including
  soft-ambiguous words; app dirs get only the unambiguous gamification terms. It
  also scans `seed`, `app`, `features`, `components` for em dashes in text a
  visitor reads (skipping comments, `.md`, and the map's template literal), and
  fails the build on one. The leaderboard word is exempt only on the ranking
  surface. `npm run vocab`.
- **`dhamma-eval.mjs`** Runs the 50-question benchmark against the engine.
  `npm run eval:dhamma`.
- **`fetch-bilara.mjs`** Fetches the canonical corpus from SuttaCentral.
  `npm run corpus:fetch`.
- Plus supporting scripts and `tools/test/` (a separate stricter typecheck for
  `core/` and `shared/`).

`npm run verify` chains typecheck, tests, validate, vocab, and eval. All must
pass.

---

## 14. `mock-api/` and `supabase/` the backend

**`mock-api/server.mjs`** A zero-dependency in-memory backend for demos. It
implements every endpoint the app calls: sites, captures, condition reports,
merit, quests, `/dhamma/ask`, `/tirtha/guide`, exports, and a custodian
dashboard. It lazily loads `core/guide` and `core/dhamma/llm` to serve the guide
and Dhamma routes with the same logic the app uses. Run with `npm run api`, which
passes Node's `--experimental-strip-types` so it can import `.ts` directly. State
resets on restart; it is not a production backend.

**`supabase/`** The cloud database as SQL migrations (`0001` through `0008`,
including `0008_leaderboard.sql`). They define the tables that records sync into,
the Row-Level Security policies (author-scoped), the private photo bucket, and the
`aligned`-requires-measurements constraint. Some later migrations are written but
not yet applied, with preconditions documented.

---

## 15. `patches/` and root config files

- **`patches/onnxruntime-react-native+1.24.3.patch`** The `patch-package` fix for
  the ONNX runtime's Gradle 8 incompatibility, reapplied on every `npm install` by
  the `postinstall` script.
- **`package.json`** Dependencies and the script definitions (`start`, `api`,
  `gen`, `test`, `validate`, `vocab`, `verify`, `eval:dhamma`, `postinstall`, and
  the build helpers).
- **`app.json`** The app manifest: name, slug, owner, version, icons, permissions,
  the plugin list (`onnxruntime-react-native`, `llama.rn`, maps, camera, location,
  sensors, and so on), `assetBundlePatterns`, and the EAS project id and updates
  URL.
- **`app.config.js`** A gitignored local override for personal EAS builds.
- **`eas.json`** The three build profiles (`development`, `preview`,
  `production`).
- **`metro.config.js`** Registers model and asset file extensions with the
  bundler.
- **`tsconfig.json`** TypeScript config, including the `@/` path alias.
- **`eslint.config.js`** Lint config.
- **`.env.example`** The template for `.env.local`.
- **`.gitignore`** Ignores `node_modules`, native folders, env files, downloaded
  models, and the working screenshot dirs.

---

## 16. How a single tap flows through the layers

To tie it together, follow "the user taps the shutter" through the stack:

1. **`app/(main)/sakshi/capture.tsx`** matches the route and renders
   `features/sakshi/CaptureScreen`.
2. **`CaptureScreen`** reads live alignment from **`hooks/useAlignment`**, which
   combines **`services/location`** and **`services/sensors`** and scores them with
   **`core/alignment/score.ts`**. The **`components/reticle/Reticle`** shows the
   result; it turns blue only when `canLock` is true.
3. On shutter, `CaptureScreen` calls **`services/camera`** to take the photo and
   copy it to durable storage, records the *actual* GPS fix (or `null`), and writes
   a row through **`services/database`**, with `gate_mode` set to `aligned` or
   `manual` from the score.
4. It navigates to **`features/sakshi/ObservationScreen`**, which asks
   **`services/ai/yoloEngine`** to scan the photo. That uses **`services/ai/onnx`**
   (native runtime) plus **`core/vision`** (letterbox, decode, NMS) to produce
   boxes, drawn by **`components/observation/YoloVisionOverlay`**.
5. **`core/vision/candidate`** decides whether to show the scan and its summary.
   **`PathologySummaryCard`** offers "file this as a report", which opens
   **`ConditionSheet`** at severity, and the confirmed report is written with
   `ai_assisted = 1`.
6. Later, when there is signal, **`services/sync`** and **`services/supabase`**
   copy the observation and its report to the cloud, photo to the private bucket
   first.

Every step wrote to the phone first, never faked a measurement, and let the AI
suggest while the human confirmed. That is the whole architecture in one tap.

---

*This walkthrough pairs with `documentation.md` (the product and system
overview). When you add or move a file, update the matching section here so this
stays a true map of the code.*

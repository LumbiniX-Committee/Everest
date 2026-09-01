# Feature Inventory

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

---

## Status labels

| Label | Meaning |
|---|---|
| **Fully implemented** | Complete, reachable path from a screen through to persistence or display |
| **Partially implemented** | Core works; a documented sub-capability is missing or optional |
| **UI-only** | Renders, but its actions do not persist or fetch |
| **Mock-data only** | Works, but reads hardcoded content with no live source |
| **Placeholder** | Stub |
| **Disabled** | Present but switched off |
| **Unused / dead code** | Not reachable |
| **Needs verification** | Not confirmed in this audit |

> **Bundled seed content is not "mock data."** Sites, quests, plates and narration are the app's *real, intended* content, deliberately bundled so the app works offline in the Sacred Garden. They are marked **Fully implemented (bundled content)**.

---

## Summary

| # | Feature | Status | Entry route | Data source |
|---|---|---|---|---|
| 1 | Onboarding | **Fully implemented** | `/onboarding` | Local |
| 2 | Fixed-viewpoint capture | **Fully implemented** | `/(main)/sakshi/capture` | SQLite + files |
| 3 | Alignment gate | **Fully implemented** | within capture | Sensors + `core/alignment` |
| 4 | Condition reporting | **Fully implemented** | `/(main)/sakshi/observation` | SQLite |
| 5 | On-device damage detection | **Fully implemented** | within capture/observation | ONNX + `core/vision` |
| 6 | Map exploration | **Fully implemented** (needs dev build) | `/(main)/tirtha/map` | `@/data` + MapLibre |
| 7 | Site detail + narration | **Fully implemented** (bundled content) | `/(main)/tirtha/site/[siteId]` | `@/data` + `.opus` |
| 8 | Then / Now comparison | **Fully implemented** (bundled content) | `/(main)/tirtha/then-now/[siteId]` | `assets/plates/` |
| 9 | Dhamma Q&A | **Fully implemented**; LLM optional | `/(main)/dhamma` | `core/dhamma` corpus |
| 10 | Reflection | **Fully implemented** | `/(main)/dhamma/reflect` | `core/dhamma/reflection` |
| 11 | Quests | **Fully implemented** | `/(main)/tirtha/quests` | SQLite + `@/data` |
| 12 | AI quest photo review | **Partially implemented — advisory by design** | within quest task | Vision LLM, optional |
| 13 | Merit ledger | **Fully implemented** | cross-cutting | SQLite |
| 14 | Leaderboard ("Guardians") | **Fully implemented** | `/(main)/sakshi/guardians` | **Live Supabase** |
| 15 | Chaityāvalī register | **Fully implemented** | `/(main)/sakshi/register` | SQLite + `@/data` |
| 16 | Arrival notifications | **Fully implemented** | background + settings | Geofence + notifications |
| 17 | Offline sync | **Fully implemented** | automatic + `/settings/sync` | Supabase |
| 18 | Settings (8 screens) | **Fully implemented** | `/(main)/settings` | AsyncStorage |
| 19 | Offline on-device LLM | **Needs verification** | `/settings/offline-ai` | llama.rn |
| 20 | Demo walk | **Fully implemented** (demo tool) | within map | Scripted itinerary |
| 21 | Practice feature dir | **Unused / dead code** | — | — |

---

## 1. Onboarding — Fully implemented

**Purpose:** First-run introduction, ending with permission priming.

**Flow:** `/onboarding` redirects to `onboardingSteps[0]`, then welcome → purpose → how-it-works → align → permissions → `completeOnboarding()` → `/(main)/tirtha/map`.

The sequence is **data-driven** from [features/onboarding/steps.ts](../../features/onboarding/steps.ts) (`onboardingSteps`, `nextRoute()`, `TOTAL_STEPS`) — declared as data "so the flow can be reordered or extended in one place and the progress indicator stays honest."

**Files:** [features/onboarding/](../../features/onboarding/) — `WelcomeScreen`, `PurposeScreen`, `HowItWorksScreen`, `AlignScreen`, `PermissionsScreen`, plus `OnboardingFrame` (shared chrome) and `AlignmentRehearsal` (interactive practice using Reanimated + gesture-handler + haptics).

**State:** `useAppState().completeOnboarding()` → `StorageKeys.onboardingComplete`.

**Extending safely:** add a step to `steps.ts` **and** a route file under `app/onboarding/`, then `npx expo start -c`.

---

## 2. Fixed-viewpoint capture — Fully implemented

**The app's core loop.** Verified wired end to end.

**Entry:** `/(main)/sakshi` → vantage list → `/(main)/sakshi/vantage?vantageId=…` → `/(main)/sakshi/capture?vantageId=…`

**Traced path** in [features/sakshi/CaptureScreen.tsx](../../features/sakshi/CaptureScreen.tsx):

```
findVantage/findSite (@/data)
  → useAlignment() telemetry (GPS + heading + pitch)
  → CameraView.takePictureAsync(captureOptions)
  → immutable draft with the shutter-time sensor readings
  → ThenNowCompare against the previous/reference frame
  → explicit Retake or Submit observation
  → FileSystem (persist submitted photo)
  → observation object incl. gateMode and capture telemetry
  → database.insertObservation(observation)
  → router.replace(...)  → observation screen
```

**Dependencies:** `expo-camera`, `expo-file-system/legacy`, `Reticle`, `ThenNowCompare`, `useAlignment`, `usePermission`, `usePreferences`, `database`, `cameraService`.

**Review and submission:** Pressing the shutter no longer writes an observation immediately. `CaptureScreen` freezes the photo, timestamp, observer coordinate, heading, pitch, position/bearing error, alignment score, GPS accuracy and gate mode in a draft. The review shows a wipe comparison with the latest local frame from that vantage, falling back to a matched historical image or labelled site reference. `submitDraft()` then moves the photograph out of the camera cache and writes the local SQLite row before navigation. `Retake` creates no observation row.

**Permissions:** Camera (required), Location + Motion (for the alignment gate).

**Honesty guarantees:**
- `gateMode` is recorded as `aligned` or `manual`
- Unmeasured errors persist as `null`, never `0`
- Bearing, pitch and coordinate come from the same sensor snapshot that fed the reticle
- A SQL `CHECK` refuses an `aligned` claim without measurements

**Photo quality** honours the `photoQuality` preference via `captureOptions`.

**Known issue:** imports `expo-file-system/legacy` — a deprecated API surface that will need migrating.

---

## 3. Alignment gate — Fully implemented

Compares live heading/position against a vantage's target. Logic in [core/alignment/score.ts](../../core/alignment/score.ts) (**tested**); React binding in [hooks/useAlignment.ts](../../hooks/useAlignment.ts) + [useHeading.ts](../../hooks/useHeading.ts); UI in [components/reticle/](../../components/reticle/) (`Reticle` with Reanimated, `AlignmentReadout`, `CompassCalibrationPrompt`).

Tolerance is user-configurable (`alignmentTolerance`). A user may capture out of tolerance — that is the documented "escape hatch," and it is what records `gate_mode = 'manual'`.

---

## 4. Condition reporting — Fully implemented

**Entry:** `/(main)/sakshi/observation?observationId=…`

Files: [features/sakshi/ObservationScreen.tsx](../../features/sakshi/ObservationScreen.tsx), [components/observation/ConditionSheet.tsx](../../components/observation/ConditionSheet.tsx), [PathologySummaryCard.tsx](../../components/observation/PathologySummaryCard.tsx). Types in [types/condition.ts](../../types/condition.ts). Persists to `condition_reports` (local + remote, FK cascade from `observations`).

Also credits quests via `creditConditionReport(siteId)` ([store/quests.tsx](../../store/quests.tsx)).

---

## 5. On-device damage detection — Fully implemented

Runs **locally**, no network.

**Pipeline:** `services/ai/onnx.ts` (image → `expo-image-manipulator` → `jpeg-js` → letterbox → ONNX session) → `core/vision/letterbox.ts` → `yolo.ts` (decode, IoU, NMS) → `detect.ts` → `candidate.ts` → overlay in [components/observation/YoloVisionOverlay.tsx](../../components/observation/YoloVisionOverlay.tsx).

**Model:** [assets/models/crack-seg.onnx](../../assets/models/crack-seg.onnx), bundled.

**Test coverage is the strongest in the codebase** — 4 test files covering both output layouts, argmax selection, IoU, NMS, the cap, letterbox inverse transform, clamping, and degenerate geometry.

**Requires a development build** (native ONNX module). See the [withOnnxAutolink](../../plugins/withOnnxAutolink.js) note in [NATIVE_AND_PERMISSIONS.md](NATIVE_AND_PERMISSIONS.md) — this is the single native module most likely to break silently on EAS.

**Promise upheld:** produces *candidates* for a human to confirm; it never files a report.

---

## 6. Map exploration — Fully implemented (needs a development build)

[features/tirtha/LiveMapScreen.tsx](../../features/tirtha/LiveMapScreen.tsx) with MapLibre. Sub-components mounted inside it: `DemoWalkPanel`, `PlacePicker`, `QuestHud`, `QuestSheet`.

Map components: [components/map/SiteMap3D.tsx](../../components/map/SiteMap3D.tsx), [MapWebView.tsx](../../components/map/MapWebView.tsx), [SitePlan.tsx](../../components/map/SitePlan.tsx), [mapHtml.ts](../../components/map/mapHtml.ts) — **each with a `.web.tsx` variant** for web fallback. Style tokens in [theme/mapStyle.ts](../../theme/mapStyle.ts).

Geo constants in [constants/geo.ts](../../constants/geo.ts): centre `27.4692, 83.2757` (Maya Devi Temple), bounds, `ON_SITE_RADIUS_M = 4000`, `SITE_VISIT_RADIUS_M = 80`.

The 80 m visit radius is deliberately generous — GPS under tree cover "is routinely out by twenty metres or more," and the errors are asymmetric: missing a real visit "quietly loses something from somebody's register," while a slightly early mark "costs nothing that matters."

---

## 7. Site detail and narration — Fully implemented (bundled content)

[features/tirtha/SiteDetailScreen.tsx](../../features/tirtha/SiteDetailScreen.tsx), with `StorySequence`, `AskThisPlace`, `BuddhaChat` as sub-components. Narration: [components/site/NarrationPlayer.tsx](../../components/site/NarrationPlayer.tsx) + [hooks/useNarration.ts](../../hooks/useNarration.ts) + `expo-audio`.

**12 `.opus` narration files** in [assets/audio/](../../assets/audio/), mapped by [data/audio.ts](../../data/audio.ts).

Story-read state persists to `StorageKeys.storiesRead` — deliberately **outside** the merit ledger, since re-reading "is not a second act worth recording."

---

## 8. Then / Now comparison — Fully implemented (bundled content)

[features/tirtha/ThenNowScreen.tsx](../../features/tirtha/ThenNowScreen.tsx) + [components/thennow/ThenNowCompare.tsx](../../components/thennow/ThenNowCompare.tsx) + [EvidenceTierLabel.tsx](../../components/thennow/EvidenceTierLabel.tsx). Also [components/series/TimeSeriesScrubber.tsx](../../components/series/TimeSeriesScrubber.tsx) and [components/timeline/Timeline.tsx](../../components/timeline/Timeline.tsx).

**11 historical plates** in [assets/plates/](../../assets/plates/), including Mukherji's 1899 survey plans and pre-1896 jungle photographs, indexed by [data/plates.ts](../../data/plates.ts). Sourced by the [harvest/](../../harvest/) pipeline; licensing in [LICENCES.md](../../LICENCES.md).

`EvidenceTierLabel` surfaces the provenance/reliability tier of each image — consistent with the honesty promises.

> **Mounted at two routes** — under `tirtha/` and under `sakshi/`. Edits affect both.

---

## 9. Dhamma Q&A — Fully implemented; LLM optional

**Entry:** `/(main)/dhamma` → `/(main)/dhamma/question?questionId=…&q=…`

Screens: [DhammaScreen](../../features/dhamma/DhammaScreen.tsx), [DhammaChatScreen](../../features/dhamma/DhammaChatScreen.tsx). Chat UI in [components/chat/](../../components/chat/); citations in [components/source/](../../components/source/).

Logic: [core/dhamma/](../../core/dhamma/) — `retrieval.ts`, `engine.ts`, `llm.ts`, `corpus.generated.ts`, `bilara.ts`, `eval.ts`.

**Retrieval is the ground; the LLM only phrases.** Without `EXPO_PUBLIC_LLM_API_KEY`, it "falls back to deterministic retrieval, which is still grounded and still cited."

**Verified quality gate** — `npm run eval:dhamma`:
```
answerable 18/18 · adjacent 10/10 · out_of_scope 12/12
adversarial 6/6 · nepali 4/4 · total 50/50
Citations naming an unretrieved passage: 0
```

**Any change to retrieval, synthesis or citation must keep that last number at 0.**

Nepali-language support is verified (4/4).

---

## 10. Reflection — Fully implemented

[features/dhamma/ReflectionScreen.tsx](../../features/dhamma/ReflectionScreen.tsx) at `/(main)/dhamma/reflect?siteId=…` (siteId optional). Logic in [core/dhamma/reflection.ts](../../core/dhamma/reflection.ts) (**tested**); content in `seed/reflections.json`. Credits merit kind `reflection`.

---

## 11. Quests — Fully implemented

**Entry:** `/(main)/tirtha/quests` → `/[questId]` → `/completed/[questId]`

Screens in [features/quests/](../../features/quests/); components: `QuestCard`, `QuestCategoryBadge`, `QuestProgressBar`, `QuestTaskItem`, `TaskEvidenceSheet`, `TaskProximity`.

State: [store/quests.tsx](../../store/quests.tsx) — `startQuest`, `completeTask` → `TaskCompletionResult { progress, questCompleted, rewardGranted }`, `uncompleteTask`, `creditConditionReport`, `resetQuests`.

Logic in [core/quests/](../../core/quests/) — `registry.ts`, `reports.ts`, `riddles.ts`, `stillness.ts` (**tested**). Local tables `quests`, `quest_progress`, `quest_completions`, `quest_submissions`.

Task types include proximity (GPS), photo evidence (`expo-image-picker` in `TaskEvidenceSheet`), riddles, and stillness.

**10 quests** in `seed/quests.json`.

**`getQuestById` returns `undefined` for unknown ids**, and route files default `questId` to `''` — always handle not-found.

---

## 12. AI quest photo review — Partially implemented (advisory by design)

[services/questReview/index.ts](../../services/questReview/index.ts), using `EXPO_PUBLIC_VISION_MODEL`.

Schema columns exist: `review_verdict` (`looks-right | looks-wrong | unsure | unavailable`), `review_comment`, `review_model`, `reviewed_at`.

**"Partially implemented" describes the optional dependency, not a defect.** The migration comment is explicit: the verdict is "Advisory AI opinion at submission time … **Never a finding, never gated submission.** Null = not reviewed." Without a key it reports `unavailable`.

**Do not make submission conditional on the verdict** — that would break the "AI suggests, never decides" promise.

`review_model` is stored because it is "Required to read `review_verdict` as an opinion rather than an assessment."

---

## 13. Merit ledger — Fully implemented

Cross-cutting. [store/practice.tsx](../../store/practice.tsx) + [core/merit/](../../core/merit/) (`rules.ts`, `cap.ts`, `ledger.ts` — **tested**) + [shared/merit.ts](../../shared/merit.ts). Local table `merit_events`. UI in [components/practice/](../../components/practice/).

Six merit kinds: `witness`, `observation`, `resurvey`, `study`, `reflection`, `wisdom` — each with its own acknowledgement copy.

**Append-only.** `recognise()` returns `null` when not credited (e.g. daily cap) — a normal outcome.

**Daily cap of 200 points** is mirrored in the Supabase `leaderboard` view. **Change both together or client and server diverge.**

---

## 14. Leaderboard ("Guardians") — Fully implemented, live data

**Verified reading real Supabase data**, not mocks.

[features/leaderboard/LeaderboardScreen.tsx](../../features/leaderboard/LeaderboardScreen.tsx) → [services/leaderboard/index.ts](../../services/leaderboard/index.ts):

| Function | Target |
|---|---|
| `fetchLeaderboard(range)` | `.from('leaderboard')` view — returns `[]` when unconfigured |
| `setHandle(handle)` | `.from('profiles')` — throws "Not connected: this name will not be saved." |
| `getHandle()` | `.from('profiles')` — returns `null` when unconfigured |

The screen implements **all four states**: `LoadingState`, `ErrorState`, `EmptyState`, plus `RefreshControl` and range switching (`LeaderboardRange`).

**Privacy contract** (view comment): exposes handle, points and a day count only — "never observations, coordinates, photographs or which sites anyone visited."

Route: `/(main)/sakshi/guardians`.

---

## 15. Chaityāvalī register — Fully implemented

[features/chaityavali/](../../features/chaityavali/) — `ChaityavaliScreen`, `SiteHistoryScreen`, `register.ts`; logic in [core/chaityavali/register.ts](../../core/chaityavali/register.ts) (**tested**).

Routes: `/(main)/sakshi/register` and `/register/[siteId]`. *Chaityāvalī* = a register/garland of shrines — the personal record of places witnessed.

---

## 16. Arrival notifications — Fully implemented

[store/arrival.tsx](../../store/arrival.tsx) + [services/geofencing/](../../services/geofencing/) (`expo-task-manager` + `expo-location`) + [services/notifications/](../../services/notifications/) + [services/arrival/](../../services/arrival/). Precincts from [data/demo/precincts.ts](../../data/demo/precincts.ts); geofence logic in [core/map/geofence.ts](../../core/map/geofence.ts) (**tested**).

**Tap routing** is wired in [app/_layout.tsx](../../app/_layout.tsx): a `site` target opens that site; a `precinct` target opens the map.

**Cooldown** via `StorageKeys.arrivalsLastNotified`, preventing re-notification when walking a boundary.

`simulateArrival(precinctId)` allows demonstrating arrivals without walking. Settings UI: [features/settings/ArrivalsScreen.tsx](../../features/settings/ArrivalsScreen.tsx).

**Needs verification:** whether background operation requires `ACCESS_BACKGROUND_LOCATION`, which is **not** declared.

---

## 17. Offline sync — Fully implemented

[services/supabase/sync.ts](../../services/supabase/sync.ts). Triggered automatically on app foreground ([app/_layout.tsx](../../app/_layout.tsx)) and manually from [features/settings/SyncScreen.tsx](../../features/settings/SyncScreen.tsx) via [hooks/useSync.ts](../../hooks/useSync.ts).

Uploads photo → **then** upserts row, for observations, condition reports and quest submissions. Idempotent. Degrades cleanly when unconfigured or unauthenticated.

Full detail in [BACKEND_AND_API.md](BACKEND_AND_API.md).

---

## 18. Settings — Fully implemented (8 screens)

| Screen | Purpose |
|---|---|
| [SettingsScreen](../../features/settings/SettingsScreen.tsx) | Hub |
| [PreferencesScreen](../../features/settings/PreferencesScreen.tsx) | 10 preferences |
| [PermissionsScreen](../../features/settings/PermissionsScreen.tsx) | Status + re-request + open-settings |
| [StorageScreen](../../features/settings/StorageScreen.tsx) | Usage, export, cache clearing |
| [SyncScreen](../../features/settings/SyncScreen.tsx) | Queue status + manual sync |
| [ArrivalsScreen](../../features/settings/ArrivalsScreen.tsx) | Geofence toggle + simulate |
| [OfflineAIScreen](../../features/settings/OfflineAIScreen.tsx) | On-device model management |
| [AboutScreen](../../features/settings/AboutScreen.tsx) | Metadata + LDT provenance |

Shared components in [features/settings/components/](../../features/settings/components/): `SettingsSection`, `SettingsRow`, `SettingsToggle`, `SettingsChoice`.

Reached from a header control ([components/common/SettingsButton.tsx](../../components/common/SettingsButton.tsx)) — **never a tab**.

---

## 19. Offline on-device LLM — Needs verification

[services/offlineModel/index.ts](../../services/offlineModel/index.ts) uses `llama.rn`; UI at [features/settings/OfflineAIScreen.tsx](../../features/settings/OfflineAIScreen.tsx).

**No GGUF model file is bundled** — [assets/models/](../../assets/models/) contains only `crack-seg.onnx` and a README. Presumably the model is downloaded on demand. **The download/activation path was not traced in this audit.**

---

## 20. Demo walk — Fully implemented (demo tool)

[services/location/demoWalk.ts](../../services/location/demoWalk.ts) + [hooks/useDemoWalk.ts](../../hooks/useDemoWalk.ts) + [features/tirtha/DemoWalkPanel.tsx](../../features/tirtha/DemoWalkPanel.tsx).

Simulates a pilgrim's walk: south gate → pond → temple → clockwise circuit → pillar → vihāra remains → north canal → East Monastic Zone, returning to the pond "so the demo can loop without teleporting, and so a second pass demonstrates the arrival cooldown."

⚠️ Its ids come from `data/generated/sites.ts`. See the dead-code trap in [REPOSITORY_MAP.md](REPOSITORY_MAP.md) §7.

---

## 21. `features/practice/` — Unused / dead code

Contains **only** `index.ts`, no screen. Merit functionality lives in [store/practice.tsx](../../store/practice.tsx) and [components/practice/](../../components/practice/). No route renders anything from this directory.

---

## Cross-cutting gaps

| Gap | Impact |
|---|---|
| **No tests for any feature** | All 21 features are verified by hand only |
| **5 sites with unverified coordinates** | Against an 80 m visit radius |
| **`expo-file-system/legacy`** in CaptureScreen | Deprecated API on the most critical path |
| **16 lint errors** in `SpeechCloud.tsx` | Blocks a clean lint run |
| **No background-location permission** | May limit arrivals |

---

## Needs verification

1. Per-screen loading/empty/error coverage beyond `LeaderboardScreen` (confirmed complete) and the shared `components/common/*` states.
2. Offline LLM model acquisition path.
3. Host screens for `AskThisPlace`, `BuddhaChat`, `StorySequence`.
4. Whether `TirthaScreen` (`/(main)/tirtha`) is reachable, given the launch redirect targets `/map`.
5. Whether arrivals work with the app backgrounded.
6. `core/dana/` (allocation) and `core/progression/` — tested, but no UI surface was traced.

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*

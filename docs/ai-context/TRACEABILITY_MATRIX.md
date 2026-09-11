# Traceability Matrix

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

Cross-reference for impact analysis: given any one column, find everything connected to it.

**Legend** — ✅ Fully implemented · ⚠️ Partial / optional · ❓ Needs verification

---

## 1. Feature → everything

| Feature | Route(s) | Screen | Store | Service | Core | Table | Permission | Test | Status |
|---|---|---|---|---|---|---|---|---|---|
| Onboarding | `/onboarding/*` (5) | `features/onboarding/*Screen` | `app-state` | `storage`, `permissions` | — | AsyncStorage | camera, location, motion | ❌ | ✅ |
| Capture review + submission | `/(main)/sakshi/capture` | `sakshi/CaptureScreen` | `preferences`, `permissions` | `camera`, `database` | `alignment/score` | `observations` | **camera**, location, motion | ✅ core only | ✅ |
| Alignment gate | *(within capture)* | `components/reticle/*` | `preferences` | `sensors`, `location` | `alignment/score` | — | motion, location | ✅ | ✅ |
| Condition report | `/(main)/sakshi/observation` | `sakshi/ObservationScreen` | `quests` | `database` | `quests/reports` | `condition_reports` | — | ✅ core only | ✅ |
| Damage detection | *(within capture)* | `observation/YoloVisionOverlay` | — | `ai/onnx`, `ai/yoloEngine` | `vision/*` (4 files) | — | camera | ✅ **4 files** | ✅ |
| Map | `/(main)/tirtha/map` | `tirtha/LiveMapScreen` | `arrival` | `location` | `map/*` | — | location | ✅ core only | ✅ dev build |
| Site detail | `/(main)/tirtha/site/[siteId]` | `tirtha/SiteDetailScreen` | `practice` | `audio`, `guide` | `story`, `wisdom` | `site_visits` | location | ✅ `story` | ✅ |
| Then / Now | `/(main)/tirtha/then-now/[siteId]`<br/>`/(main)/sakshi/then-now/[siteId]` | `tirtha/ThenNowScreen` | — | — | — | — | — | ❌ | ✅ |
| Dhamma Q&A | `/(main)/dhamma`, `/question` | `dhamma/DhammaScreen`, `DhammaChatScreen` | `practice` | `dhamma` | `dhamma/*` (8) | — | — | ✅ **3 files + eval** | ✅ / ⚠️ LLM |
| Reflection | `/(main)/dhamma/reflect` | `dhamma/ReflectionScreen` | `practice` | `dhamma` | `dhamma/reflection` | — | — | ✅ | ✅ |
| Quests | `/(main)/tirtha/quests/*` (3) | `features/quests/*Screen` | **`quests`** | `database`, `questReview` | `quests/*` (4) | `quests`, `quest_progress`, `quest_completions`, `quest_submissions` | location, camera | ✅ core only | ✅ |
| AI quest review | *(within quest task)* | `quests/components/TaskEvidenceSheet` | `quests` | `questReview` | — | `quest_submissions.review_*` | camera | ❌ | ⚠️ advisory |
| Merit ledger | *(cross-cutting)* | `components/practice/*` | **`practice`** | `database` | `merit/*` (3) | `merit_events` | — | ✅ | ✅ |
| Leaderboard | `/(main)/sakshi/guardians` | `leaderboard/LeaderboardScreen` | — | `leaderboard` | — | `leaderboard` view, `profiles` | — | ❌ | ✅ **live** |
| Chaityāvalī | `/(main)/sakshi/register`, `/[siteId]` | `chaityavali/*Screen` | `practice` | `database` | `chaityavali/register` | `site_visits` | — | ✅ | ✅ |
| Arrivals | *(background)* + `/settings/arrivals` | `settings/ArrivalsScreen` | **`arrival`** | `geofencing`, `notifications`, `arrival` | `map/geofence` | AsyncStorage | location, notifications | ✅ core only | ✅ ❓ background |
| Sync | *(auto)* + `/settings/sync` | `settings/SyncScreen` | — | `supabase/sync`, `sync`, `net` | `net/breaker` ❓ | all remote | — | ✅ breaker only | ✅ |
| Settings | `/(main)/settings/*` (8) | `features/settings/*Screen` | `preferences`, `permissions` | `storage`, `device` | — | AsyncStorage | all | ❌ | ✅ |
| Offline AI | `/settings/offline-ai` | `settings/OfflineAIScreen` | — | `offlineModel` | — | — | — | ❌ | ❓ |
| Demo walk | *(within map)* | `tirtha/DemoWalkPanel` | `arrival` | `location/demoWalk` | — | — | location | ❌ | ✅ demo |

---

## 2. Route → screen → feature

| Route | Screen component | Owning folder |
|---|---|---|
| `/` | `Redirect` | `app/` |
| `/onboarding` | `Redirect` → `steps[0]` | `features/onboarding` |
| `/onboarding/welcome\|purpose\|how-it-works\|align\|permissions` | `WelcomeScreen`, `PurposeScreen`, `HowItWorksScreen`, `AlignScreen`, `PermissionsScreen` | `features/onboarding` |
| `/(main)/tirtha` | `TirthaScreen` | `features/tirtha` |
| `/(main)/tirtha/map` | `LiveMapScreen` | `features/tirtha` |
| `/(main)/tirtha/site/[siteId]` | `SiteDetailScreen` | `features/tirtha` |
| `/(main)/tirtha/then-now/[siteId]` | `ThenNowScreen` | `features/tirtha` |
| `/(main)/tirtha/quests` | `QuestListScreen` | **`features/quests`** |
| `/(main)/tirtha/quests/[questId]` | `QuestDetailScreen` | **`features/quests`** |
| `/(main)/tirtha/quests/completed/[questId]` | `QuestCompletedScreen` | **`features/quests`** |
| `/(main)/sakshi` | `SakshiScreen` | `features/sakshi` |
| `/(main)/sakshi/vantage` | `VantageScreen` | `features/sakshi` |
| `/(main)/sakshi/capture` | `CaptureScreen` | `features/sakshi` |
| `/(main)/sakshi/observation` | `ObservationScreen` | `features/sakshi` |
| `/(main)/sakshi/guardians` | `LeaderboardScreen` | **`features/leaderboard`** |
| `/(main)/sakshi/register` | `ChaityavaliScreen` | **`features/chaityavali`** |
| `/(main)/sakshi/register/[siteId]` | `SiteHistoryScreen` | **`features/chaityavali`** |
| `/(main)/sakshi/then-now/[siteId]` | `ThenNowScreen` | **`features/tirtha`** |
| `/(main)/dhamma` | `DhammaScreen` | `features/dhamma` |
| `/(main)/dhamma/question` | `DhammaChatScreen` | `features/dhamma` |
| `/(main)/dhamma/reflect` | `ReflectionScreen` | `features/dhamma` |
| `/(main)/settings` + 7 sub-routes | `SettingsScreen`, `AboutScreen`, `ArrivalsScreen`, `OfflineAIScreen`, `PermissionsScreen`, `PreferencesScreen`, `StorageScreen`, `SyncScreen` | `features/settings` |

**Bold = the folder does not match the route surface.** Six routes render a component owned by a different feature folder.

---

## 3. Store → consumers

| Store | Hook | Persistence | Consumed by |
|---|---|---|---|
| `app-state` | `useAppState()` | `StorageKeys.onboardingComplete` | `app/_layout.tsx`, `app/index.tsx`, onboarding |
| `preferences` | `usePreferences()` | 10 keys | `CaptureScreen`, `PreferencesScreen`, reticle, site lists, name rendering |
| `permissions` | `usePermissions()`, `usePermission(kind)` | — (live) | Both `PermissionsScreen`s, `CaptureScreen`, map |
| `practice` | `usePractice()` | `merit_events` (SQLite) | `components/practice/*`, site detail, dhamma, capture |
| `quests` | `useQuests()` | quest tables (SQLite) | All quest screens, `QuestHud`, `QuestSheet`, `ObservationScreen` |
| `arrival` | `useArrival()` | `StorageKeys.arrivalsLastNotified` | `ArrivalsScreen`, map, `app/_layout.tsx` (tap routing) |

---

## 4. Table → writer → reader

### Remote (Supabase)

| Table / bucket | Written by | Read by | RLS |
|---|---|---|---|
| `observations` | `supabase/sync.ts` upsert | *(no client read path traced)* | Owner-scoped (0006); anon dropped (0007) |
| `condition_reports` | `supabase/sync.ts` upsert | — | Owner-scoped |
| `quest_submissions` | `supabase/sync.ts` upsert | — | Owner-scoped |
| `profiles` | `services/leaderboard` `setHandle()` | `getHandle()` | Anon **and** owner write; **open select** |
| `leaderboard` (view) | *(derived)* | `services/leaderboard` `fetchLeaderboard()` | Granted to anon + authenticated |
| bucket `observations` | `uploadPhoto()` | — | Private |
| bucket `quest-evidence` | `uploadPhoto()` | — | Private |

### Local (SQLite, `sakshi.db`)

`observations` · `condition_reports` · `merit_events` · `site_visits` · `quests` · `quest_progress` · `quest_completions` · `quest_submissions` — all via [services/database/index.ts](../../services/database/index.ts) (migrations 0–7).

---

## 5. Permission → dependents

| Permission | Requested by | Features affected | If denied |
|---|---|---|---|
| **Camera** | `Camera.requestCameraPermissionsAsync()` | Capture, quest photo evidence | Core loop blocked |
| **Location** | `Location.requestForegroundPermissionsAsync()` | Map, nearby sites, arrivals, quest proximity, alignment position | Distance/visit credit lost |
| **Motion** | `DeviceMotion.requestPermissionsAsync()` | Alignment gate, compass | `manual` gate mode only |
| **Notifications** | `expo-notifications` ❓ | Arrivals | No arrival banners |

All three tracked in `store/permissions.tsx`; `canAskAgain: false` → `openSettings()`.

---

## 6. Core module → consumers → tests

| Core module | Consumed by | Test |
|---|---|---|
| `alignment/score` | `hooks/useAlignment`, `CaptureScreen` | ✅ |
| `chaityavali/register` | `features/chaityavali` | ✅ |
| `dana/allocation` | ❓ **no UI traced** | ✅ |
| `dhamma/*` (8 files) | `services/dhamma`, dhamma screens | ✅ ×3 + eval |
| `guide` | `services/guide` | ✅ |
| `map/geofence`, `map/pradakshina` | `services/geofencing`, map | ✅ |
| `merit/{rules,cap,ledger}` | `store/practice` | ✅ |
| `net/breaker` | ❓ **no consumer traced** | ✅ |
| `progression` | ❓ **no UI traced** | ✅ |
| `quests/{registry,reports,riddles,stillness}` | `store/quests`, quest screens | ✅ |
| `session/{closeRitual,notifications}` | `services/notifications` | ✅ |
| `story` | `StorySequence`, `useStoryProgress` | ✅ |
| `vision/{candidate,detect,letterbox,yolo}` | `services/ai/*` | ✅ **×4** |
| `wisdom` | `ArrivalWisdom`, `features/tirtha/wisdom` | ❌ **no test** |
| `copy/failure-lines` | error states | ❌ |
| `adapters/coords` | geo conversions | ❌ |

---

## 7. Asset → consumer

| Asset group | Registry | Rendered by |
|---|---|---|
| `assets/audio/*.opus` (12) | [data/audio.ts](../../data/audio.ts) | `NarrationPlayer`, `useNarration` |
| `assets/plates/*` (11) | [data/plates.ts](../../data/plates.ts), `seed/plates.json` | `ThenNowCompare`, `SiteVisual` |
| `assets/monk/*` (11) | direct `require()` | `GreetingMonk` |
| `assets/models/crack-seg.onnx` | `expo-asset` | `services/ai/onnx` |
| `assets/dhamma/hero.png` | direct | Dhamma surface |
| Icons / splash / favicon (6) | `app.json` | Native |

---

## 8. Cross-cutting invariants

| Invariant | Enforced in |
|---|---|
| Unmeasured → `null`, never `0` | `types/heritage.ts`, `CaptureScreen`, SQL `CHECK` in 0003 |
| `aligned` requires measurements | SQL constraint `observations_aligned_is_measured` |
| AI is advisory | `quest_submissions.review_verdict` comment; `core/vision` candidate flow |
| Zero ungrounded citations | `npm run eval:dhamma` |
| Upload before insert | `services/supabase/sync.ts` |
| Idempotent sync | `upsert` everywhere |
| 200/day cap | **`shared/merit.ts` AND SQL view 0008** ⚠️ duplicated |
| Points 50/25/30 | **`core/merit/rules.ts` AND SQL view 0008** ⚠️ duplicated |
| Three surfaces only | `constants/app.ts` `SURFACES`, `app/(main)/_layout.tsx` |
| Keys centralised | `constants/storage.ts` |

---

## 9. Test coverage map

| Layer | Coverage |
|---|---|
| `core/` | ✅ **126 tests, 18 files** |
| `shared/` | ❌ |
| `services/` | ❌ |
| `store/` | ❌ |
| `hooks/` | ❌ |
| `components/` | ❌ |
| `features/` | ❌ |
| `app/` (routing) | ❌ |
| Content | ✅ `validate`, `vocab`, `eval:dhamma` |

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*

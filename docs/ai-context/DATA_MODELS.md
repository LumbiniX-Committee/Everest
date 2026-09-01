# Data Models

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

All types live in [types/](../../types/), re-exported by [types/index.ts](../../types/index.ts). Import as `from '@/types'`.

```ts
export * from './heritage';   export * from './permissions';  export * from './source';
export * from './condition';  export * from './practice';     export * from './dhamma';
export * from './quests';     export * from './preferences';  export * from './precinct';
```

> `types/declarations.d.ts` is **not** in the barrel — it holds ambient module declarations (e.g. for `expo-sensors`).

---

## 1. `types/heritage.ts` — the core domain

### `Coordinate`
```ts
{ latitude: number; longitude: number }
```
Used everywhere geographic. Also `constants/geo.ts` → `LUMBINI_CENTER`.

### `HeritageSite`

| Field | Type | Req | Meaning |
|---|---|---|---|
| `id` | `string` | ✅ | **Live ids come from `data/generated/sites.ts`** — see the trap below |
| `name` | `string` | ✅ | English name |
| `nameNepali` | `string` | ○ | Devanagari |
| `namePali` | `string` | ○ | Pali |
| `summary` | `string` | ✅ | Short description |
| `description` | `string` | ✅ | Full text |
| `coordinate` | `Coordinate` | ✅ | Position |
| `zone` | `Zone` | ○ | `sacred_garden \| monastic_east \| monastic_west \| greater_lumbini` |
| `tier` | `1 \| 2 \| 3` | ○ | Importance |
| `radiusMeters` | `number` | ○ | Site extent |
| `photography` | `PhotographyPolicy` | ○ | `allowed \| restricted \| prohibited` |
| `elevation` | `number` | ○ | Metres |
| `facts` | `SiteFact[]` | ○ | `{ label, value }` pairs |
| `dhammaLinks` | `string[]` | ○ | Related Dhamma passages |
| `sourceTier` | `SourceTier` | ✅ | `archaeological \| documented \| community` |
| `sourceIds` | `string[]` | ○ | Citations |
| `condition` | `ConditionStatus` | ✅ | `stable \| watch \| open \| resolved` |
| `vantageIds` | `string[]` | ✅ | Fixed viewpoints at this site |

> ⚠️ **`photography: 'prohibited'` is a real content field.** Check it before offering capture at a site.

### `Vantage` — a fixed viewpoint

| Field | Type | Req | Meaning |
|---|---|---|---|
| `id`, `siteId`, `label` | `string` | ✅ | Identity |
| `coordinate` | `Coordinate` | ✅ | Where to stand |
| `bearing` | `number` | ✅ | Target compass bearing |
| `pitch` | `number` | ✅ | Target device pitch |
| `positionToleranceM` | `number` | ✅ | Metres allowed for an `aligned` capture |
| `bearingToleranceDeg` | `number` | ✅ | Degrees allowed |
| `hfovDeg` | `number` | ○ | Horizontal field of view |
| `note` | `string` | ○ | Guidance |
| `seriesBegan` | `string` | ○ | When the time series started |
| `referenceUrl` / `referenceLocal` | `string` | ○ | Reference image |

The two tolerance fields **are** the alignment gate. Widening them silently weakens every `aligned` claim in the record.

### `ObservationAssessment` — read the reasoning before changing it

```ts
'unreviewed' | 'no-change' | 'reported'
```

The source is emphatic that `no-change` must not be collapsed into `unreviewed`:

> "`no-change` is a **finding**, not an absence of one. In condition monitoring a dated photograph with 'nothing has changed here' attached is evidence of stability, and a series of them is how you establish that a site is holding. Collapsing it into `unreviewed` would throw that away."

### `Observation` — the central record

| Field | Type | Req | Meaning |
|---|---|---|---|
| `id`, `vantageId`, `siteId` | `string` | ✅ | Identity |
| `capturedAt` | `string` | ✅ | **ISO 8601, always UTC** |
| `photoUri` | `string` | ✅ | Local file URI |
| `coordinate` | `Coordinate` | ✅ | **The observer's own GPS fix — not the catalogued vantage point** |
| `bearing`, `pitch` | `number` | ✅ | Actually recorded at capture |
| `positionErrorM` | `number \| null` | ✅ | **Null when there was no fix. "A missing signal is not zero error"** |
| `bearingErrorDeg` | `number \| null` | ✅ | Null on a by-eye capture |
| `alignScore` | `number \| null` | ○ | 0–1. Persisted "so 'median align score 0.86 across N' is real" |
| `gpsAccuracyM` | `number \| null` | ○ | GPS accuracy at capture |
| `gateMode` | `'aligned' \| 'manual'` | ○ | **Never faked** — `manual` "does not claim to be comparable within tolerance" |
| `note` | `string` | ○ | Observer's note |
| `assessment` | `ObservationAssessment` | ✅ | What the observer said |
| `synced` | `boolean` | ✅ | False until it has left the device |

> **The `| null` on the error fields is a product guarantee, not a convenience.** Never default them to `0`. A SQL `CHECK` constraint enforces the same rule server-side.

### Evidence tiers (Charter #6)

Every historical plate declares a tier, and the UI displays it, "so a viewer can always tell a photograph from a reconstruction." Strongest first, beginning `historical_photograph` — "a real historical photo. Nothing generated."

Rendered by [components/thennow/EvidenceTierLabel.tsx](../../components/thennow/EvidenceTierLabel.tsx). **Full enum: see [types/heritage.ts](../../types/heritage.ts).**

---

## 2. `types/preferences.ts`

### `UserPreferences` — with defaults

| Field | Type | Default |
|---|---|---|
| `alignmentTolerance` | `'strict' \| 'standard' \| 'forgiving'` | `'standard'` |
| `hapticsEnabled` | `boolean` | `true` |
| `autoCapture` | `boolean` | `false` |
| `scriptPreference` | `'diacritics' \| 'plain'` | `'diacritics'` |
| `distanceUnit` | `'metric' \| 'imperial'` | `'metric'` |
| `offlineSyncMode` | `'wifi' \| 'any' \| 'manual'` | `'wifi'` |
| `photoQuality` | `'standard' \| 'high'` | `'standard'` |
| `wisdomTier` | `'basic' \| 'medium' \| 'high' \| 'custom'` | `'medium'` |
| `autoWisdom` | `boolean` | `true` |
| `autoNarration` | `boolean` | `true` |
| `colorTheme` | `'navy' \| 'white'` | `'navy'` |

`DEFAULT_USER_PREFERENCES` is the fallback for every unset key. `ALIGNMENT_TOLERANCE_OPTIONS` (and siblings) drive the settings UI.

**Adding a preference requires four edits:**
1. Field + default in `types/preferences.ts`
2. Key in `constants/storage.ts` → `StorageKeys`
3. Mapping in `constants/storage.ts` → `PreferenceKeys`
4. UI row in [features/settings/PreferencesScreen.tsx](../../features/settings/PreferencesScreen.tsx)

One key per preference is deliberate — a later addition "reads as absent and falls back to its default, instead of failing to parse an older shape and losing every setting at once."

---

## 3. Other type modules

| File | Holds |
|---|---|
| [types/condition.ts](../../types/condition.ts) | Condition report categories, subtypes, severities |
| [types/practice.ts](../../types/practice.ts) | `MeritKind`, `MeritEvent`, `PracticeSummary` |
| [types/quests.ts](../../types/quests.ts) | `Quest`, `QuestProgress`, `QuestWithProgress`, task types |
| [types/dhamma.ts](../../types/dhamma.ts) | Question, answer, passage, citation shapes |
| [types/source.ts](../../types/source.ts) | Citation/source records |
| [types/permissions.ts](../../types/permissions.ts) | `PermissionKind`, `PermissionState`, `PermissionMap` |
| [types/precinct.ts](../../types/precinct.ts) | `Precinct` — geofenced areas (distinct from sites) |
| [types/declarations.d.ts](../../types/declarations.d.ts) | Ambient module declarations |

**Known shapes** (from usage):
- `PermissionKind` = `'location' | 'camera' | 'motion'`
- `PermissionState` = `{ status: ...; canAskAgain: boolean }`
- `MeritKind` = `'witness' | 'observation' | 'resurvey' | 'study' | 'reflection' | 'wisdom'`
- `PracticeSummary` = `{ todayMerit, dayComplete, balance, sitesWitnessed }`
- `TaskCompletionResult` = `{ progress, questCompleted, rewardGranted }` (defined in `store/quests.tsx`)

---

## 4. `shared/` — cross-boundary types

[shared/types.ts](../../shared/types.ts), [shared/geo.ts](../../shared/geo.ts), [shared/merit.ts](../../shared/merit.ts) are excluded from the app tsconfig alongside `core/` and are framework-free.

**`shared/merit.ts` holds the 200/day cap**, which is duplicated in the SQL `leaderboard` view. The view's comment names the file explicitly: "with the 200/day cap from `shared/merit.ts` applied."

> ⚠️ **Known duplication.** The cap exists in TypeScript *and* in SQL. There is no mechanism keeping them in sync. Change both together.

**Needs verification:** whether `shared/types.ts` overlaps or conflicts with `types/*.ts`.

---

## 5. Route parameter types

All read via `useLocalSearchParams<T>()` in `app/`. **URL params are always `string`.**

| Route | Params |
|---|---|
| `tirtha/site/[siteId]`, `tirtha/then-now/[siteId]`, `sakshi/then-now/[siteId]`, `sakshi/register/[siteId]` | `{ siteId: string }` |
| `tirtha/quests/[questId]`, `tirtha/quests/completed/[questId]` | `{ questId: string }` — defaulted `?? ''` |
| `sakshi/vantage`, `sakshi/capture` | `{ vantageId: string }` |
| `sakshi/observation` | `{ observationId: string }` |
| `dhamma/question` | `{ questionId?: string; q?: string }` — **both optional**; `q` maps to prop `query` |
| `dhamma/reflect` | `{ siteId?: string }` — **optional** |

**No route validates its id against a known list.** Lookups return `undefined` (`findSite`, `findVantage`, `getQuestById`) — every consumer must handle not-found.

---

## 6. Local ↔ remote field mapping

TypeScript uses `camelCase`; Postgres uses `snake_case`. Mapping happens in [services/supabase/sync.ts](../../services/supabase/sync.ts).

| `Observation` (TS) | `observations` (SQL) |
|---|---|
| `capturedAt` | `captured_at` |
| `photoUri` | `photo_path` *(local URI → bucket path)* |
| `coordinate.latitude/.longitude` | `latitude` / `longitude` |
| `positionErrorM` | `position_error_m` |
| `bearingErrorDeg` | `bearing_error_deg` |
| `alignScore` | `align_score` |
| `gpsAccuracyM` | `gps_acc_m` |
| `gateMode` | `gate_mode` |
| `synced` | *(local only — not a column)* |
| *(not sent)* | `user_id` — **filled by DB default `auth.uid()`** |
| *(not sent)* | `received_at` — server timestamp |

> **`photoUri` → `photo_path` is a transformation, not a rename**: a local file URI becomes a storage bucket path.
>
> **`user_id` is never sent by the client.** The database fills it from the JWT.

---

## 7. Content data shapes

| Export | From | Type |
|---|---|---|
| `demoSites` | `data/generated/sites.ts` | `HeritageSite[]` — **12 sites** |
| `demoVantages` | `data/generated/sites.ts` | `Vantage[]` — **6 vantages** |
| `seedQuests` | `data/generated/quests.ts` | `SeedQuest[]` — **10 quests** |
| `demoQuests` | `data/demo/quests.ts` | `Quest[]` |

Helper functions: `findSite(siteId)`, `findVantage(vantageId)`, `vantagesForSite(siteId)`, `findSeedQuest(id)`, `seedQuestsForSite(siteId)`, `questsForSite(siteId)`, `siteIdsForQuest(quest)`, `primarySiteForQuest(quest)`.

### ⚠️ Two `demoSites` exist — the most dangerous naming collision in the repo

| File | Status |
|---|---|
| `data/generated/sites.ts` → `demoSites` | ✅ **LIVE** — exported through `@/data` |
| `data/demo/sites.ts` → `demoSites` | ❌ **DEAD** — not barrel-exported, **different ids** |

The dead file uses ids like `ashoka-pillar`, `puskarini-pond`, `bodhi-tree`. Per [services/location/demoWalk.ts](../../services/location/demoWalk.ts), code written against those names "resolves nothing and **silently skips every leg**."

**Two quest shapes also coexist** — `Quest` (demo) and `SeedQuest` (generated). No name collision, but confirm which one an API expects. **Needs verification** of their differences.

---

## 8. Type-safety notes

- `strict: true` throughout
- `PreferencesProvider.update` is generically typed: `<K extends keyof UserPreferences>(field: K, value: UserPreferences[K])` — a mismatched value is a compile error
- **`core/` and `shared/` are excluded from `npm run typecheck`** — type errors there are caught only by their separate config
- `SURFACE_ICONS` names are "typed against the glyph map at the call site, so a mistyped one is a compile error rather than a missing tab"

---

## Needs verification

1. Full field lists for `condition.ts`, `practice.ts`, `quests.ts`, `dhamma.ts`, `source.ts`, `precinct.ts`.
2. Complete `EvidenceTier` enum members.
3. Whether `shared/types.ts` duplicates anything in `types/`.
4. Differences between `Quest` and `SeedQuest`.
5. Exact column definitions of the 8 local SQLite tables.

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*

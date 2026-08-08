# Sākṣī — MVP Audit & Implementation Plan

Stage A deliverable. Audit of the codebase as it stands, the gap to the MVP
brief, and the phased route between them.

---

## 1. Current state

### Platform

| | |
|---|---|
| Expo | ~57.0.11 (SDK 57) |
| React Native | 0.86.2 |
| React | 19.2.3 |
| TypeScript | ~6.0.3, strict, `@/*` path alias, typed routes on |
| Router | expo-router ~57.0.11, `expo-router/entry` |
| Package manager | npm |
| Local DB | expo-sqlite |
| Backend | Supabase (`@supabase/supabase-js`), lazy client, unused so far |
| Build | EAS configured, `@aadityabro1/sakshi` |

Native capability already wired: `expo-camera`, `expo-location`, `expo-sensors`,
`expo-sqlite`, plus reanimated and gesture-handler.

### Architecture

The existing structure already matches the §51 target. **No restructuring is
needed** — this plan builds into it rather than over it.

```
app/          expo-router routes, thin — each delegates to features/
components/   ui, common, navigation, reticle, site, map
features/     onboarding, tirtha, sakshi, dhamma, practice (empty)
services/     camera, database, location, permissions, sensors, storage, supabase
store/        React Context: app-state, permissions
theme/        colors, typography, spacing, radii, layers, fonts
types/        heritage, permissions
data/demo/    sites, dhamma
hooks/        useAlignment, useCurrentPosition, useHeading, useNearbySites
constants/    app, geo, storage
```

Roughly 4,650 lines. The layering rule from §38 (`screen → hook → service →
native`) is already observed: no screen touches a native API directly.

### What is genuinely good, and must be preserved

These are not placeholders. They are correct, and the plan reuses them as-is.

- **`theme/colors.ts`** — matches the §30 palette token-for-token. Carries the
  constraint that `alignmentLocked` is reserved and never a generic primary.
- **`theme/typography.ts`** — the three-family model from §31, resolved lazily
  through `text()` so screens pick up real fonts with no edits when the files
  land. Fallback is deliberate, documented, and Android-safe.
- **`types/permissions.ts`** — models `denied` vs `blocked` separately with
  `canPrompt`/`needsSettings` helpers. This is the distinction that decides
  whether a "Grant" button does anything, and it is already right.
- **`store/permissions.tsx`** — re-checks on app foreground, so a grant made in
  Settings is noticed on return.
- **`services/database/index.ts`** — versioned append-only migrations against
  `PRAGMA user_version`, WAL mode, failed-open handle not cached.
- **`components/ui/Text.tsx`** — the only `Text`. No component names a font,
  size, or hex.
- **`app/_layout.tsx`** — holds the splash until fonts *and* the persisted
  first-launch flag resolve, so returning users never flash onboarding.
- **`data/demo/sites.ts`** — real places, explicitly marked non-survey-grade,
  with `sourceTier` so provenance shows in the UI rather than being implied.

### What exists at the route level

| Area | Routes present |
|---|---|
| System | launch router (`app/index.tsx`) |
| Onboarding | index, welcome, purpose, how-it-works, permissions |
| Tīrtha | index (map), `site/[siteId]` |
| Sākṣī | index, vantage, capture, observation |
| Dhamma | index, question |

---

## 2. Gaps

Measured against the §6 inventory of 66 screens. Roughly 17 are present in some
form; the following are absent.

### Blocking the §45 golden demo

These four break the demonstration flow outright:

1. **Then / Now** — no route, no component, no `HistoricalImage` type, no demo
   imagery. §22 calls it one of the most important screens.
2. **Source / citation system** — §24 asks for `SourceCard`, `SourceBadge`,
   `Citation`, `SourceDetail` shared between heritage and Dhamma. Only
   `SourceBadge` exists, and Dhamma citations are currently loose strings on
   `DhammaEntry` rather than a shared `Source` type.
3. **Puṇya / practice** — `features/practice/` is an empty barrel. No merit
   event, no practice summary, no daily limit.
4. **Chaityāvalī + time series** — the entire personal register, and the
   time-series view that gives the witness loop its payoff.

### Also missing

- Quests (§13) — four screens, no types
- Dhamma refusal (§25), reflection companion, source detail
- Settings (§15) — six screens
- Offline UX (§17) — no banner, no queue, no sync state
- Restricted-area photography state (§26)
- Timeline and conservation-status sections on site detail

### Component library gaps (§32)

Present: `Text`, `Button`, `Card`, `Divider`, `Badge` (Condition + Source),
`MetaRow`, `Screen`, `EmptyState`, `ScreenHeader`, `SurfaceTabBar`, `Reticle`,
`AlignmentReadout`, `SitePlan`, `SiteListItem`, `VantageListItem`.

Missing: `Chip`, `IconButton`, `Heading`, `Surface`, `StatusBadge`,
`ProgressIndicator`, `PermissionCard`, `LoadingState`, `ErrorState`,
`OfflineBanner`, `Toast`, `Modal`, `BottomSheet`, `Timeline`, `SourceCard`,
`SitePreview`, `SiteMarker`.

### Data model gaps (§35)

Defined: `HeritageSite`, `Vantage`, `Observation`, `AlignmentState`,
`Coordinate`, permission types.

Missing: `Source`, `Citation`, `HistoricalImage`, `ConditionReport`, `Quest`,
`QuestProgress`, `MeritEvent`, `DhammaQuestion`, `DhammaAnswer`,
`UserPreferences`.

### Database gaps (§37)

Only `observations` exists. Missing: `sites`, `viewpoints`, `captures`,
`condition_reports`, `sources`, `merit_events`, `quest_progress`.

### Problems found

| Severity | Finding |
|---|---|
| Medium | `features/practice/index.ts` is an empty barrel — dead export in the graph |
| Medium | Dhamma citations are strings, not the shared `Source` type §24 requires. Fixing this later means touching every Dhamma screen; fix it before building more of them. |
| Medium | No global states beyond default/empty. §16 requires loading, error, offline, permission-denied on every important screen. |
| Low | Fonts not vendored — deliberate and documented, but the MVP will not look like §31 until the nine `.ttf` files land in `assets/fonts/` |
| Low | No test setup at all; §49 asks for typecheck + lint + manual pass per phase |
| Low | `condition: ConditionStatus` on a site is a single enum; §10's eight condition categories have no model yet |

Nothing here is architectural rot. The codebase is a well-built foundation with
roughly two-thirds of the surface area not yet started.

---

## 3. Target architecture

Unchanged from what exists, with these additions:

```
components/
├── ui/            + Chip, IconButton, StatusBadge, ProgressIndicator,
│                    LoadingState, ErrorState, OfflineBanner, Toast, BottomSheet
├── source/        SourceCard, Citation, SourceDetail        (new)
├── timeline/      Timeline, TimeSeriesStrip                 (new)
├── thennow/       ThenNowCompare                            (new)
├── observation/   CategoryGrid, SeverityScale               (new)
└── practice/      MeritCard, PracticeSummary                (new)

features/
├── practice/      (fill the empty barrel)
├── chaityavali/   (new)
└── quests/        (new)

services/
├── sync/          offline queue + retry                     (new)
└── dhamma/        retrieval + refusal, mock first           (new)
```

### State model (§39)

Three tiers, kept separate:

- **UI state** — local `useState` in the screen. Never lifted unless shared.
- **Domain state** — Context providers alongside `app-state`: observations,
  merit, quests, register.
- **Device state** — already correct: `store/permissions`, `useCurrentPosition`,
  `useHeading`, `useAlignment`.

### Source model (§24) — the one refactor worth doing early

```ts
type Source = {
  id: string;
  kind: 'archaeological' | 'inscription' | 'sutta' | 'survey' | 'photograph' | 'commentary';
  title: string;
  attribution: string;   // author or institution
  date?: string;
  reference?: string;    // page, plate, catalogue no.
  note?: string;         // contested reading, translation caveat
};

type Citation = { sourceId: string; locator?: string };
```

Heritage sites and Dhamma answers then cite the same registry through the same
components, which is what §24 is actually asking for.

---

## 4. Implementation phases

| Phase | Contents | Depends on |
|---|---|---|
| **0** | Audit | — (this document) |
| **1** | Domain types + component library completion | 0 |
| **2** | Source system; refactor Dhamma citations onto it | 1 |
| **3** | Then / Now + site detail IA (facts, timeline, conservation, sources) | 2 |
| **4** | Global states: loading, error, offline, permission-denied | 1 |
| **5** | Witness loop completion: capture result → observation → condition report | 1, 4 |
| **6** | Practice: merit event, practice summary, daily limit | 5 |
| **7** | Chaityāvalī + time series | 5, 6 |
| **8** | Dhamma: grounded answer, sources, refusal, reflection | 2 |
| **9** | Quests | 6 |
| **10** | Offline queue + sync state | 4, 5 |
| **11** | Settings | 1 |
| **12** | Polish, consistency audit, QA against §45 | all |

Phases 3 and 4 are independent and can interleave. Phase 8 only needs Phase 2.

### Verification per phase (§49)

`npm run typecheck` → `npm run lint` → `expo start` → walk the affected flow →
walk its edge states. Not deferred to the end.

---

## 5. Screen inventory status

| # | Screen | State |
|---|---|---|
| 1–3 | Splash, launch router, restore | ✅ done |
| 4–12 | Onboarding (9) | 🟡 5 of 9 |
| 13–23 | Tīrtha (11) | 🟡 2 of 11 |
| 24–42 | Sākṣī witness (19) | 🟡 4 of 19 |
| 43–47 | Chaityāvalī (5) | ⬜ none |
| 48–51 | Quests (4) | ⬜ none |
| 52–60 | Dhamma (9) | 🟡 2 of 9 |
| 61–66 | Settings (6) | ⬜ none |

Per §43, several inventory entries should not become routes. Site Facts,
Conservation Status, and Sources are sections of site detail, not screens.
Condition Category / Subtype / Severity / Note are steps in one sheet, not four
routes. Applying that rule takes the real route count from 66 to roughly 38.

---

## 6. Non-goals for this MVP

Per §52 — social features, profiles, leaderboards, streaks, spendable currency,
a large settings system, and any real Dhamma retrieval backend. Mock services
behind real interfaces (§48), swapped later without touching screens.

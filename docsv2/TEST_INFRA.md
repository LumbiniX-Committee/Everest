# E2E Test Infra: Sākṣī MVP

## Test Philosophy
- Static analysis & runtime verification: `npm run typecheck` (`tsc --noEmit`), `npm run lint` (`expo lint`).
- Manual and automated screen/component rendering and state transitions.

## Feature Inventory & Test Mapping
| # | Feature | Verification Mechanism | Status |
|---|---------|-----------------------|--------|
| 1 | SQLite Quests Migration | `npm run typecheck` + SQLite table creation test helper | Tier 1 |
| 2 | Quest Domain Types & Store | TypeScript type compliance + `useQuests()` state hydration | Tier 1 |
| 3 | Demo Quest Datasets | Seed function populating 4 Lumbini quests | Tier 1 |
| 4 | Quest UI & Screens | Rendering `QuestListScreen`, `QuestDetailScreen`, `QuestCompletedScreen` | Tier 1 & 2 |
| 5 | Quests Routing & Tirtha Entry | `app/(main)/tirtha/quests/` navigation stack and `TirthaScreen` card | Tier 1 & 3 |
| 6 | Settings Preferences | Preference read/write persistence via `AsyncStorage` | Tier 1 |
| 7 | Settings Navigation & Layout | `app/(main)/settings/` stack routing and header entry buttons | Tier 1 & 3 |
| 8 | 6 Settings Screens | Rendering Overview, Preferences, Permissions, Storage, Sync, About screens | Tier 1, 2, 4 |
| 9 | OfflineBanner Mounting | Banner rendering on `SakshiScreen`, `ObservationScreen`, `TirthaScreen` | Tier 2 & 4 |
| 10 | Camera Capture Loading/Error | Async loading state & error handling during capture | Tier 2 & 4 |

## Coverage Thresholds
- `npm run verify`: all green (`npm run typecheck`, `node tools/run-tests.mjs`, `node tools/validate-seed.mjs`, `node tools/lint-vocab.mjs`)
- `node tools/run-tests.mjs`: 48 tests pass (core domain logic suite)
- `node tools/validate-seed.mjs`: OK (0 errors)
- `node tools/lint-vocab.mjs`: clean (0 prohibited gamification terms)
- Schema migration: `services/database/index.ts` has migrations index 0–7 (observations, reports, merit, visits, quests, alignment metrics, weighted merit, quest completions).


# Project: Sākṣī MVP Remaining Phases (Phase 9, 11, 12)

## Architecture
- **Framework**: React Native 0.86.2 with Expo SDK 57, `expo-router` for file-based navigation.
- **Surface Architecture**: Three primary surfaces (Tīrtha, Sākṣī, Dhamma) plus Chaityāvalī register and Settings stack.
- **Database & Storage**: `expo-sqlite` WAL mode with migration system in `services/database/index.ts`. `AsyncStorage` key-value preference storage in `services/storage/index.ts`.
- **State Management**: React Context Providers in `store/` (`AppState`, `Permissions`, `Practice`, `Quests`).
- **Feature Layering**: Thin routes in `app/(main)/` delegating to rich feature views in `features/`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | SQLite Quests Migration | Migration index 4 in `services/database/index.ts` creating `quests` and `quest_progress` tables with CRUD helpers | M1 (Quests) | R1 |
| 2 | Quest Domain Types & Store | TypeScript interfaces in `types/quests.ts` and `QuestsProvider` context in `store/quests.tsx` | M1 (Quests) | R1 |
| 3 | Demo Quest Datasets | Realistic Lumbini quests in `data/demo/quests.ts` (Sacred Garden, Ashokan Epigraphy, Puskarini Water Watch, Monastic Zone) | M1 (Quests) | R1 |
| 4 | Quest UI & Screens | `features/quests/` containing `QuestListScreen`, `QuestDetailScreen`, `QuestCompletedScreen` and components (`QuestCard`, `QuestTaskItem`, `QuestProgressBar`, `QuestCategoryBadge`) | M1 (Quests) | R1 |
| 5 | Quests Routing & Tirtha Integration | Routes in `app/(main)/tirtha/quests/` and Quests section/card on `TirthaScreen` | M1 (Quests) | R1 |
| 6 | Settings Preference Hook & Storage | `useUserPreferences()` hook and storage keys in `constants/storage.ts` and `services/storage/index.ts` | M2 (Settings) | R2 |
| 7 | Settings Navigation & Layout | `app/(main)/settings/_layout.tsx` stack navigator and header entry icons on main surfaces | M2 (Settings) | R2 |
| 8 | Settings HomeScreen | `SettingsHomeScreen` (`index.tsx`) overview with quick status chips and navigation list | M2 (Settings) | R2 |
| 9 | Preferences Screen | `PreferencesScreen` (`preferences.tsx`) for reticle tolerance, haptics, auto-capture, script display, and distance units | M2 (Settings) | R2 |
| 10 | Permissions Settings Screen | `PermissionsSettingsScreen` (`permissions.tsx`) for location, camera, and motion sensor status, direct permission requests, and live sensor diagnostics | M2 (Settings) | R2 |
| 11 | Storage & Data Export Screen | `StorageExportScreen` (`storage.tsx`) for DB/photo storage size breakdown, observation JSON export, image cache clearing, and database vacuuming | M2 (Settings) | R2 |
| 12 | Offline & Sync Policy Screen | `OfflineRetentionScreen` (`sync.tsx`) for offline sync queue status, network policy (Wi-Fi/Cellular/Manual), photo quality selection, and manual trigger | M2 (Settings) | R2 |
| 13 | About & Legal Screen | `AboutLegalScreen` (`about.tsx`) for app metadata, Lumbini Development Trust provenance statement, privacy policy, and onboarding reset debug tool | M2 (Settings) | R2 |
| 14 | OfflineBanner Mounting | Mount `OfflineBanner` on `SakshiScreen`, `ObservationScreen`, and `TirthaScreen` to display unsynced state and pending observation queue | M3 (Polish/QA) | R3 |
| 15 | Camera Capture Loading & Error Recovery | Wrap camera capture async flow in `CaptureScreen.tsx` with `LoadingState` spinner during SQLite insert/disk save, and error handling | M3 (Polish/QA) | R3 |
| 16 | Consistency Audit & Edge States | Enforce typography, color tokens (`theme/colors.ts`), minimum 44x44 touch targets, and robust empty/error fallbacks across all surfaces | M3 (Polish/QA) | R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Phase 9: Quests | SQLite migrations, domain types, `QuestsProvider`, demo data, `features/quests/` UI screens/components, routes in `app/(main)/tirtha/quests/`, and `TirthaScreen` entry | None | DONE |
| M2 | Phase 11: Settings | Preference storage hook, 6 Settings screens in `features/settings/`, stack routes in `app/(main)/settings/`, and main screen header entry buttons | M1 | PLANNED |
| M3 | Phase 12: Polish & QA | Mount `OfflineBanner`, camera capture loading/error handling, edge-state coverage (loading, error, offline, permissions), design consistency audit | M1, M2 | PLANNED |

## Code Layout
- `features/quests/`: Feature components and screens for Quests (`QuestListScreen`, `QuestDetailScreen`, `QuestCompletedScreen`, `components/`)
- `features/settings/`: Feature components and screens for Settings (`SettingsHomeScreen`, `PreferencesScreen`, `PermissionsSettingsScreen`, `StorageExportScreen`, `OfflineRetentionScreen`, `AboutLegalScreen`)
- `app/(main)/tirtha/quests/`: Route handlers for Quests
- `app/(main)/settings/`: Route handlers for Settings stack
- `services/database/index.ts`: SQLite migration 4 (`quests`, `quest_progress`) & DB access helpers
- `services/storage/index.ts` & `constants/storage.ts`: AsyncStorage key-value preferences
- `store/quests.tsx`: Quests context provider
- `hooks/useUserPreferences.ts`: Custom hook for user preference read/write

## Interface Contracts

### Quests Database Schema (Migration 4)
```sql
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'survey' | 'epigraphy' | 'ecology' | 'monastic'
  difficulty TEXT NOT NULL, -- 'easy' | 'moderate' | 'challenging'
  punya_reward INTEGER NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  icon TEXT NOT NULL,
  prerequisite_quest_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_progress (
  quest_id TEXT PRIMARY KEY,
  status TEXT NOT NULL, -- 'not_started' | 'in_progress' | 'completed'
  completed_tasks TEXT NOT NULL, -- JSON string array of task IDs
  started_at INTEGER,
  completed_at INTEGER,
  FOREIGN KEY (quest_id) REFERENCES quests (id) ON DELETE CASCADE
);
```

### Preference Keys (`constants/storage.ts`)
```ts
export const StorageKeys = {
  // ... existing keys
  alignmentTolerance: 'sakshi.v1.preferences.alignmentTolerance',
  hapticsEnabled: 'sakshi.v1.preferences.hapticsEnabled',
  autoCapture: 'sakshi.v1.preferences.autoCapture',
  scriptPreference: 'sakshi.v1.preferences.scriptPreference',
  distanceUnit: 'sakshi.v1.preferences.distanceUnit',
  offlineSyncMode: 'sakshi.v1.preferences.offlineSyncMode',
  photoQuality: 'sakshi.v1.preferences.photoQuality',
} as const;
```

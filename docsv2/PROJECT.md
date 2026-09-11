# Project: Sākṣī MVP

## Architecture
- **Framework**: React Native 0.86.2 with Expo SDK 57, `expo-router` for file-based navigation.
- **Surface Architecture**: Three primary surfaces (Tīrtha, Sākṣī, Dhamma) plus Chaityāvalī register and Settings stack.
- **Database & Storage**: `expo-sqlite` WAL mode with migration system in `services/database/index.ts` (migrations 0–7). `AsyncStorage` key-value preference storage in `services/storage/index.ts`.
- **State Management**: React Context Providers in `store/` (`AppState`, `Permissions`, `Practice`, `Quests`).
- **Feature Layering**: Thin routes in `app/(main)/` delegating to rich feature views in `features/`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | SQLite Quests Migration | Migrations in `services/database/index.ts` creating `quests`, `quest_progress`, and `quest_completions` tables with CRUD helpers | M1 (Quests) | R1 |
| 2 | Quest Domain Types & Store | TypeScript interfaces in `types/quests.ts` and `QuestsProvider` context in `store/quests.tsx` | M1 (Quests) | R1 |
| 3 | Seed Quest Datasets | Canonical Lumbini quests in `seed/quests.json` and generated in `data/generated/quests.ts` | M1 (Quests) | R1 |
| 4 | Quest UI & Screens | `features/quests/` containing `QuestListScreen`, `QuestDetailScreen`, `QuestCompletedScreen` and components | M1 (Quests) | R1 |
| 5 | Quests Routing & Tirtha Integration | Routes in `app/(main)/tirtha/quests/` and Quests section/card on `TirthaScreen` | M1 (Quests) | R1 |
| 6 | Settings Preference Hook & Storage | `useUserPreferences()` hook and storage keys in `constants/storage.ts` and `services/storage/index.ts` | M2 (Settings) | R2 |
| 7 | Settings Navigation & Layout | `app/(main)/settings/_layout.tsx` stack navigator and header entry icons on main surfaces | M2 (Settings) | R2 |
| 8 | Settings HomeScreen | `SettingsHomeScreen` (`index.tsx`) overview with quick status chips and navigation list | M2 (Settings) | R2 |
| 9 | Preferences Screen | `PreferencesScreen` (`preferences.tsx`) with real preferences (`distanceUnit`, `photoQuality`, `hapticsEnabled`) | M2 (Settings) | R2 |
| 10 | Permissions Settings Screen | `PermissionsSettingsScreen` (`permissions.tsx`) for location, camera, and motion sensor status | M2 (Settings) | R2 |
| 11 | Storage & Data Export Screen | `StorageExportScreen` (`storage.tsx`) for DB/photo storage size breakdown, observation JSON export, image cache clearing | M2 (Settings) | R2 |
| 12 | Offline & Sync Policy Screen | `OfflineRetentionScreen` (`sync.tsx`) for offline sync queue status and Supabase sync controls | M2 (Settings) | R2 |
| 13 | About & Legal Screen | `AboutLegalScreen` (`about.tsx`) for app metadata and Lumbini Development Trust provenance statement | M2 (Settings) | R2 |
| 14 | OfflineBanner Mounting | Mount `OfflineBanner` on `SakshiScreen`, `ObservationScreen`, and `TirthaScreen` | M3 (Polish/QA) | R3 |
| 15 | Camera Capture Loading & Error Recovery | Camera capture async flow in `CaptureScreen.tsx` with documentDirectory saving and null error metrics | M3 (Polish/QA) | R3 |
| 16 | Consistency Audit & Edge States | Dark theme palette (`theme/colors.ts`), honest alignment escape hatches, and error fallbacks | M3 (Polish/QA) | R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Phase 9: Quests | SQLite migrations, domain types, `QuestsProvider`, seed data, `features/quests/` UI screens/components, routes in `app/(main)/tirtha/quests/`, and `TirthaScreen` entry | None | DONE |
| M2 | Phase 11: Settings | Preference storage hook, 6 Settings screens in `features/settings/`, stack routes in `app/(main)/settings/`, and main screen header entry buttons | M1 | DONE |
| M3 | Phase 12: Polish & QA | Mount `OfflineBanner`, camera capture loading/error handling, edge-state coverage, dark theme consistency | M1, M2 | DONE |

## Code Layout
- `features/quests/`: Feature components and screens for Quests (`QuestListScreen`, `QuestDetailScreen`, `QuestCompletedScreen`, `components/`)
- `features/settings/`: Feature components and screens for Settings (`SettingsHomeScreen`, `PreferencesScreen`, `PermissionsSettingsScreen`, `StorageExportScreen`, `OfflineRetentionScreen`, `AboutLegalScreen`)
- `app/(main)/tirtha/quests/`: Route handlers for Quests
- `app/(main)/settings/`: Route handlers for Settings stack
- `services/database/index.ts`: SQLite migrations (0–7) & DB access helpers
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

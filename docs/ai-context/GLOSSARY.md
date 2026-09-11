# Glossary

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

This project uses Sanskrit, Pali and Nepali terms as **identifiers in code**, not just in copy. Understanding them is necessary to navigate the repository.

---

## 1. Sanskrit / Pali terms used as identifiers

| Term | Script | Meaning | In the code |
|---|---|---|---|
| **Sākṣī** | साक्षी | **Witness** — one who sees directly and can speak to it | The app name; the capture surface; `features/sakshi/`; `app/(main)/sakshi/` |
| **Tīrtha** | तीर्थ | A **sacred place**; a crossing-place | The explore surface; `features/tirtha/`; `app/(main)/tirtha/` |
| **Dhamma** | धम्म | The **teaching** (Pali; Skt. *dharma*) | The Q&A surface; `features/dhamma/`; `core/dhamma/` |
| **Chaityāvalī** | चैत्यावली | A **register/garland of shrines** (*chaitya* = shrine, *āvalī* = row) | The personal register of witnessed sites; `features/chaityavali/`; routed as `/sakshi/register` |
| **Dāna** | दान | **Giving**, generosity | `core/dana/allocation.ts` — allocation logic |
| **Pradakṣiṇā** | प्रदक्षिणा | **Clockwise circumambulation** of a sacred object | `core/map/pradakshina.ts` — detecting a circuit |
| **Appamādena sampādetha** | — | *"Strive on with diligence"* — Dhammapada 20.21, the Buddha's last words | `APP_EPIGRAPH` in `constants/app.ts` |
| **Vihāra** | विहार | A monastery / monastic dwelling | Site id `vihara-remains` |
| **Puṣkariṇī / Puskarini** | पुष्करिणी | The **sacred pond** where Maya Devi is said to have bathed | Site id `puskarini` |

---

## 2. Domain terms

| Term | Meaning |
|---|---|
| **Vantage** | A **fixed viewpoint** — a catalogued position, bearing and pitch from which repeat photographs are taken. The unit that makes a time series comparable. Type: `Vantage` |
| **Observation** | One recorded witness event at a vantage: photograph + position + bearing + errors + assessment. The app's central record. Type: `Observation` |
| **Condition report** | A structured damage/change finding attached to an observation (category, subtype, severity) |
| **Then / Now** | Comparing a historical photograph with a modern one from the same vantage |
| **Plate** | A historical image (from Mukherji's 1899 survey, archives, etc.). `assets/plates/` |
| **Evidence tier** | Charter #6 classification of an image's reliability — strongest is `historical_photograph`, "a real historical photo. Nothing generated." Rendered by `EvidenceTierLabel` |
| **Merit** | Recognition for an act of attention. Append-only ledger. **Not points for their own sake** |
| **Guardian** | A contributor on the leaderboard. Default handle: `'Unnamed guardian'` |
| **Precinct** | A geofenced **area** (e.g. the Sacred Garden), as opposed to a **site** (a single monument). Arrival notifications fire for precincts |
| **Site** | A single heritage monument. Type: `HeritageSite` |
| **Arrival** | Entering a precinct's geofence, producing a notification |
| **Surface** | One of the three top-level places in the app. `SURFACES = ['tirtha', 'sakshi', 'dhamma']` |
| **Wisdom** | Contextual teaching content offered on arrival. `core/wisdom/`, `WisdomTier` preference |
| **Stillness** | A quest task type requiring the visitor to remain still. `core/quests/stillness.ts` |
| **Riddle** | A quest task type. `core/quests/riddles.ts` |
| **Resurvey** | Returning to a vantage and re-photographing it. A merit kind — "You returned. That is what makes the series worth having." |
| **Demo walk** | A scripted simulated walk through Lumbini for demonstration. `services/location/demoWalk.ts` |

---

## 3. Technical terms specific to this project

| Term | Meaning |
|---|---|
| **Gate mode** | How a capture was framed. `'aligned'` = passed the tolerance gate, errors **are** measurements. `'manual'` = framed by eye, errors are **not** a claim of accuracy. `null` = predates the recording |
| **Alignment gate** | The tolerance check comparing live heading/position against a vantage's target |
| **Align score** | Weighted 0–1 alignment quality at capture. **Meaningful only when `gate_mode = 'aligned'`** |
| **By-eye capture** | A `manual` capture. Its error fields are `null` — "a missing signal is not zero error" |
| **Hydrated** | A store flag: the persisted value has been read back from disk. The app gates rendering on it |
| **Boot gate** | `RootNavigator` returning `null` until fonts **and** hydration settle, keeping the splash up |
| **The barrel** | `data/index.ts` — the single import point for content, "so screens never import from `data/demo/*` directly" |
| **Seed** | Hand-authored source content in `seed/*.json` → generates `data/generated/` |
| **Generated data** | `data/generated/*.ts` — **never hand-edit**; `npm run verify` fails if stale |
| **Vocab lint** | `npm run vocab` — enforces project terminology **and typography** (no em dash reaches a reader) |
| **Dhamma eval** | `npm run eval:dhamma` — 50 cases; must report **0 citations naming an unretrieved passage** |
| **Device id** | Opaque per-install id. "Not a person, not authenticated, not stable across reinstall." The only storage key without a version prefix |
| **The five promises** | The project's stated invariants — see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) §4 |
| **Charter #N** | Reference to an internal project charter (e.g. Charter #6 = evidence tiers) |
| **§NN** | Reference to an internal numbered rule (e.g. §51 = three surfaces, no Settings tab) |

---

## 4. Status labels used in this documentation

| Label | Meaning |
|---|---|
| **Fully implemented** | Complete, reachable path through to persistence or display |
| **Partially implemented** | Core works; a sub-capability is missing or optional by design |
| **UI-only** | Renders, but actions do not persist or fetch |
| **Mock-data only** | Works, but reads hardcoded content with no live source |
| **Placeholder** | Stub |
| **Disabled** | Present but switched off |
| **Unused / dead code** | Not reachable |
| **Planned / mentioned only** | Referenced but not built |
| **Needs verification** | Not confirmed during this audit |

> **Bundled seed content is not "mock data."** Sites, quests, plates and narration are the real intended content, bundled deliberately for offline use.

---

## 5. Naming aliases — same thing, different names

| In the UI | In the code | In the database |
|---|---|---|
| Guardians | `features/leaderboard/` | `leaderboard` view, `profiles` |
| Register | `features/chaityavali/` | `site_visits` |
| Witness / capture | `features/sakshi/` | `observations` |
| Explore | `features/tirtha/` | — |
| Viewpoint | `Vantage` | `vantage_id` |
| Photo | `photoUri` (local) | `photo_path` (bucket) |
| Merit | `PracticeProvider`, `MeritEvent` | `merit_events` |

**`practice` ↔ `merit` are used interchangeably**: the store is `PracticeProvider`, the type is `MeritEvent`, the table is `merit_events`, the core module is `core/merit/`.

---

## 6. Abbreviations

| Abbr | Expansion |
|---|---|
| **LDT** | Lumbini Development Trust — the site's governing body |
| **LumbiniX** | The 2026 hackathon this was built for |
| **RLS** | Row Level Security (Postgres) |
| **EAS** | Expo Application Services |
| **OTA** | Over-the-air update |
| **AAB / APK** | Android App Bundle / Android Package |
| **ONNX** | Open Neural Network Exchange — the detector model format |
| **YOLO** | "You Only Look Once" — object-detection architecture |
| **NMS** | Non-Maximum Suppression |
| **IoU** | Intersection over Union |
| **CHW** | Channel-Height-Width tensor layout |
| **GGUF** | llama.cpp model format |
| **WAL** | Write-Ahead Logging (SQLite mode) |
| **HFOV** | Horizontal field of view |
| **Bilara** | SuttaCentral's translation data format — the Dhamma corpus source |
| **OSM** | OpenStreetMap |
| **COEP / COOP** | Cross-Origin Embedder/Opener Policy headers |

---

## 7. Places in Lumbini

| Name | Note |
|---|---|
| **Maya Devi Temple** | The birthplace itself. `LUMBINI_CENTER` = 27.4692, 83.2757 |
| **Ashokan Pillar** | Erected by Emperor Ashoka, 249 BCE; bears the Rummindei inscription |
| **Rummindei inscription** | Ashoka's inscription attesting the birthplace |
| **Marker Stone** | Marks the precise birth spot. Shares a coordinate with the temple enclosing it |
| **Puskarini** | The sacred pond |
| **Sacred Garden** | The core precinct |
| **Monastic Zone (East / West)** | International monastery precincts |
| **World Peace Pagoda** | Japanese-built stupa |
| **Tilaurakot** | Ancient Kapilavastu — the Buddha's childhood city |
| **Ramagrama** | Stupa holding relics of the Buddha |
| **Mukherji** | P.C. Mukherji, whose **1899 survey** produced the historical plates |

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*

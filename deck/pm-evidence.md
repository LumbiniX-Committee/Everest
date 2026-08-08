# Project-management evidence

Source: D-CONTENT-AND-PITCH task 8.3–8.4. The Project Management criterion is
scored on visible discipline: a decisions log with dates, a status board, and a
**cut log** — every cut written down, with the reason. The many-small-commits
git history is the other half of this evidence; keep committing every ~30 min
with the `a:` / `d:` prefixes.

_All dates absolute. "Today" at authoring = 2026-08-08._

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-08-08 | File layout: lane-owned dirs at documented paths (`shared/ seed/ mock-api/ harvest/ deck/ tools/`, `app/src/…`) | Zero file overlap with lane B's native scaffold, so the merge with the project root is a union, not a conflict |
| 2026-08-08 | Nepali: drafted here, every string `ne_review: "pending"`; a speaker flips to `"human"` | Nothing claims to be human-written until it is (05 §7) |
| 2026-08-08 | Lane A: device-independent logic **with runnable tests first**, then screens | The logic is verifiable today without a phone; 45 tests pass under Node's runner |
| 2026-08-08 | Geo primitives live once in `shared/geo.ts` | Lane A (geofence/pradakṣiṇā) and lane B (alignment) must not disagree by a metre — **message B to import it, not re-write it** |
| 2026-08-08 | Pradakṣiṇā threshold: 05 §5 (≥330°, ≤30° reverse) over A-doc's ±350° | Reconciled toward the quest definition; both exposed as named constants |
| 2026-08-08 | Coordinates verified against OpenStreetMap before shipping | 05 §1. `coords_source` on every site; validator warns on any still `doc` |
| 2026-08-08 | Merit ledger is append-only, earning-only (no spend column) | Non-transferability is a schema decision, not a blockchain (10-REVIEW §3) |

## Status board

| Area | State |
|---|---|
| All-hands artefacts (`shared/`, mock API, `.env.example`, deploy config) | Done |
| Seed — 12 sites, quests, needs, timeline, vantages | Done; validates clean |
| Lane A logic core + tests | Done; 45/45 passing, tsc clean |
| Lane D design system + copy | Done |
| Lane A screens + route wrappers + API client | Written & typechecked; run against lane B's build |
| Harvest pipeline (00–06) | Written; `01`/`06` runnable today, ML steps need `pip install` |
| Deck | Done |
| Railway deploy | One command behind a login (Aaditya runs it, pastes URL into `.env.example`) |
| Nepali human pass | Pending a speaker |
| Reconstruction plates / narration audio | Manifests + prompts prepared; generation is a person's step |

## Cut log

| Cut | Reason |
|---|---|
| Inscription OCR / raking-light close-ups | No fieldwork; use a curated verified transliteration instead (03 §0). Dropped to stretch. |
| Generative "restoration" of the 1899 plates | An AI-hallucinated archival photo is the exact failure mode we argue against (Charter #6) |
| Blockchain / soulbound token minting | Regulatory (NRB), anti-pattern, conservation hazard, and timeline fantasy (10-REVIEW §3) |
| A Buddha persona / fine-tune | The teaching is the teacher; a fine-tune can't cite (10-REVIEW §4, decisions D5/D6) |
| `react-native-maps` / Google imagery | Google ToS surface, no offline story; we keep MapLibre + PMTiles |
| More than 12 sites | 8 well-written beats 12 half-written (05 §8); 12 shipped, tier-3 flagged approximate |

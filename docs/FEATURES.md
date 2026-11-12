# Sākṣī feature guide

What the app does, where each feature lives in the code, and how far each one has been checked. Current as of 2026-11-11 (commit `b4f91ef` and later).

Sākṣī is a real-time guide to Nepal's heritage sites and treks, built around three verbs:

- **Guide:** where you are, explained as deeply as you want.
- **Ask:** answers that show their sources, or say they don't know.
- **Report:** flag a problem at a place, then follow what happens to it.

Everything follows the five promises in `AGENTS.md`. Unmeasured is null, never 0. By eye is never shown as measured. The AI suggests and never decides. Nothing is deleted. The phone is the source of truth.

## How far each feature is checked

| Mark | Meaning |
| --- | --- |
| **Tested** | Covered by automated tests (`npm run verify`) or checked by rendering in a browser. |
| **Phone** | Confirmed on a real phone. **Nothing has this mark yet.** The field checklist is in `docs/APP_GUIDE.md`. |
| **Blocked** | Waiting on something outside the code. |

Where it ships:

- **Play bundle 1.0.0** (`e08d04d`, EAS `df541c44`): everything up to the release-readiness work.
- **Everything marked "Since 1.0"** is in preview APKs only (latest from `5c5b8b5`). No new Play bundle has been built: the Expo free plan's Android builds for November are used up.

---

## 1. First run and plans

**Onboarding** (`features/onboarding/`, routes `app/onboarding/*`): language, then who is visiting (abroad or Nepali, which sets fees and currency), then what the app does, then where to start. Permissions are asked only when first needed. **Tested.**

**Plans** (`features/plans/`, `core/plans/`, migration `0011_plans.sql`):
- **Free and Pro** with activation codes, stored as one-way hashes.
- **Gating** is on only in development and preview builds (`EXPO_PUBLIC_PRO_GATING`).
- **Store builds** open every feature and show no prices or code box. `tools/check-release-config.mjs` fails a production build if gating is on.
- **Tested:** end to end against production on 2026-11-07. **Blocked:** selling Pro needs Google Play Billing.

## 2. Explore (Tīrtha) home

`features/tirtha/TirthaScreen.tsx`

- **Since 1.0: the Guide card** (`features/tirtha/VerbBar.tsx`):
  - a deep-jade card reading "Know where you are, as deeply as you want";
  - live **Glance · Story · Scholar** pills;
  - an "Open the guide map" button;
  - the guide mascot.
  - Ask and Report sit beside it as two cards.
- **Since 1.0: the plan list** (`features/tirtha/PlanList.tsx`): Trekking routes and Essentials as a quiet list. The duplicate "Start here" box was removed.
- **Tested** (contrast pairs in `tests/native/theme-contrast.test.ts`).

## 3. Guide: place and site pages

**Curated sites** (74, `features/tirtha/SiteDetailScreen.tsx`):
- **Since 1.0: depth control.** A **Glance · Story · Scholar** segmented control (`components/ui/SegmentedControl.tsx`) above the text. It writes the remembered `wisdomTier` preference, so the choice carries from place to place, and the content swaps in place. Labels live in `WISDOM_TIER_OPTIONS` in `types/preferences.ts`. Only on curated sites, not on the 435 listed places.
- **Since 1.0: photo hero.** Each page opens on its photograph, historical plate or labelled schematic (`components/site/SiteVisual.tsx`), with the photo's credit laid on the image.
- **Fees** by visitor type (Nepal Tourism Board, dated), narration, scripture links, 3D view and quests.

**Listed places** (435, `features/tirtha/PlaceDetailScreen.tsx`, from OSM and Wikidata via `tools/data/build-places.mjs`):
- **Since 1.0: curated words** for places that need them (`data/placeNotes.ts`). For now that is Pashupatinath: who is worshipped there (in words only), the visitor rules, and sources.
- **Since 1.0: Bhaktapur Durbar Square** is listed (a named Wikidata extra, `Q4900869`), so its fee attaches.

**Tested** (React and data tests). **Not checked:** listings on site.

## 4. Map

`features/tirtha/LiveMapScreen.tsx`, `components/map/`

- **Modes:** Standard, 3D, Terrain, Satellite and Hybrid. Satellite is **Blocked**: Google Map Tiles needs a prepayment, so it shows "Coming soon".
- **Clustering, walking directions** (Valhalla) and the walking figure.
- **Offline map packs** (`services/offlineMaps`, `core/map/tiles.ts`): save a hub or a trek. Tested in Chrome with the tile hosts blocked.
- **Since 1.0: the 3D town** (`components/map/townLayer.ts`). In 3D mode at zoom 15 and closer, OSM buildings are drawn as houses rather than boxes:
  - walls with window rows;
  - hipped terracotta or tin roofs on small buildings, and flat concrete roofs with a parapet on large ones;
  - colours from `MAP_MATERIALS` in `theme/mapStyle.ts`, fixed per building so a street never changes between redraws;
  - monuments drawn as what they are (stupa, column, mound, low ruins, plain shelter);
  - capped at 1,400 buildings.
- **Tested** in a browser (`tests/native/map-html.test.ts`). **Not checked:** frame rate on a low-end phone.

## 5. 3D monument models

`tools/models/build-models.mjs` → `landing/public/models/*.gltf` (served by the website) and `data/generated/models.ts`; viewer in `features/models/ModelScreen.tsx`.

**13 schematic models:** Swayambhunath, Boudhanath, two World Peace Pagodas, Nyatapola, Pashupatinath, Changu Narayan, Krishna Mandir, Ashokan Pillar, the Basantapur tower with Lohan Chowk, Taleju, Kasthamandap and Maju Dega.

**Since 1.0: a detailed builder.** `newarTemple()` adds a door on each face, carved struts, flared hipped roofs and a stacked gilt finial. It sizes the finial so a sourced overall height is honoured.

**Since 1.0: Pashupatinath rebuilt** with its courtyard and west gate, the Nandi, Vasuki, Unmatta Bhairav, the Bagmati and the 15 Pandra Shivalaya shrines.

**Sourced:** only overall heights (Pashupatinath ~23.7 m, Taleju 35 m, Kasthamandap ~20 m) and counts. Every other size is an estimate from photographs, and each model's points say so. The research is in `docs/research/Pashupati and Basantapur 3D models.md`.

**Tested** (rendered in Chrome). **Needs:** cultural review.

## 6. Trekking

`features/treks/`, `data/generated/treks.ts`, built by `tools/data/build-treks.mjs`

- **Three routes:** Ghorepani–Poon Hill, Langtang Valley and Everest Base Camp. Each is day by day, with OSM stops, Valhalla routing and Copernicus DEM altitudes, plus a warning on days that climb too fast and a trail map with live progress (`core/treks/progress.ts`).
- **Since 1.0: photos.** One credited Commons photo per trek (`data/trekPhotos.ts`, `components/site/PhotoHero.tsx`).
- **Since 1.0: the porter mascot** and a porter-welfare note on the trek list.
- **Tested.** **Not checked:** walking a route with the app.

## 7. Essentials

`features/essentials/`, `seed/essentials.json`, built by `tools/data/build_overture.py`

- **1,086 places** to stay, eat, get help or money, from Overture Maps (licence per record).
- **Call, Directions and Website** on each place. No opening hours: Overture has none.
- **Since 1.0: the macaque mascot** in the empty state.
- **Tested.** **Not checked:** listings on site.

## 8. Ask (Dhamma)

`features/dhamma/`, `core/dhamma/`

- Grounded answers with numbered, checkable sources, and a refusal when nothing supports an answer.
- **Since 1.0:** the two promises shown under the title.
- **Note:** `eas.json` sets no `EXPO_PUBLIC_LLM_API_KEY`, so store builds most likely answer from retrieval alone, still cited. Confirm the EAS environment before marketing Ask as AI chat.
- **Since 1.0: questions about places.** A question that names a place is answered by quoting that place's own page (fee, rules, photography, history), with its source. 631 passages from the 74 curated sites, official fees and listed places (`tools/gen-site-corpus.mjs`, `core/dhamma/sites.ts`). History questions about a place the heritage corpus covers still use the hand-checked passage. Opening hours nobody recorded are said to be unrecorded.
- **Since 1.0: suggested and recent questions** on the Ask page. Recent questions stay on the phone and are cleared by "Delete my data".
- **Tested** (Dhamma benchmark in `verify`, 74/74; `core/dhamma/sites.test.ts`).

## 9. Report (Sākṣī)

`features/sakshi/`

- **Capture:** guided alignment at a marked viewpoint, or a by-eye capture, then a condition report with optional on-device damage scan. Records are offline-first and sync later.
- **Since 1.0: the report timeline** (`core/reports/timeline.ts`, `components/report/ReportTimeline.tsx`, `services/reportStatus`):
  - the steps are waiting to send, received, acknowledged, being worked on and resolved, each dated, with the custodian's note;
  - backed by `my_report_timeline()` (migration `0013`), applied to production on 2026-11-08: authenticated users can run it, anonymous users cannot;
  - the reporter sees only their own reports, never who acted;
  - no step is ever inferred;
  - the last copy is cached for offline viewing.
- **Since 1.0: the Report hero card** (`features/sakshi/ReportHero.tsx`).
- **Tested** (4 core tests, pgTAP `supabase/tests/reporter_timeline.test.sql`). **Blocked:** no custodian is onboarded yet, so no report can move past "received".

## 10. Settings, privacy and themes

`features/settings/`

- **Privacy:** export, and delete. Delete clears this phone's copy and gives a new identity; records already shared stay, unlinked.
- **About:** data credits and the privacy policy link.
- **Storage** and offline maps, preferences and plans.
- **Since 1.0: the Sunlight theme** (`outdoorColors` in `theme/colors.ts`): Settings → Appearance → "High contrast for sunlight". Primary and secondary text are held to 7:1 by `tests/native/theme-contrast.test.ts`.
- **Tested.**

## 10a. Your record

Since 1.0. `features/me/MeScreen.tsx`, from Explore's plan list or Settings.

- Places visited (first and last visit), photos taken, quests done.
- **Every report in one list**, at the step it has really reached (`core/reports/board.ts`), with the custodian's note and when the steps were last checked.
- Records waiting to send, the plan, and a link to export or delete.
- **Tested** (core tests for the report list). **Not checked:** on a phone.

## 11. Characters

Since 1.0. Four original, non-sacred mascots (`components/mascot/`, art in `brand/mascots/*.svg`, exported to `assets/mascots/`):

| Character | Where |
| --- | --- |
| Guide | Explore |
| Porter (never "a Sherpa", which is a people) | Trek list |
| Rhesus macaque | Empty states |
| Newar woodcarver | 3D viewer |

**Deities are never drawn as characters.** The older monk character's future is an open decision for the owner (see `DESIGN.md`).

## 12. Languages

English and Nepali throughout. New strings must be registered in `i18n/literals.ts`; `npm run verify` fails on unregistered ones. **Needs:** review by a native speaker.

## 13. Website and custodian portal

`landing/` (Next.js, deployed on Vercel at saksi-beta.vercel.app)

- **Since 1.0: redesign:**
  - Newsreader serif and a frosted pill navigation bar;
  - a hero with साक्षी set large and a phone at Maya Devi;
  - a bento grid, "one place, three verbs", and the visit circle;
  - "where the answers come from" and an institutions band;
  - a dark install panel.
  - All motion stops under reduced motion.
- **Since 1.0: explorer map fix.** The MapLibre worker's `maplibre-gl-shared.mjs` chunk is now copied.
- **Privacy policy:** names every outside service and has a `#delete` anchor.
- **Custodian portal:** at `/custodian`.
- **Since 1.0: admin console** at `/admin`, for the service owner (`landing/app/admin`, migration `0014_platform_admin.sql`):
  - reports waiting on each site, the oldest open one, and sites with no custodian (whose reports cannot move);
  - site access by email: grant, change role, turn off (never delete);
  - Pro codes: issue a labelled batch (shown once), see redemptions, revoke a batch;
  - recent crashes (no user id or stack) and a log of every admin change.
  - **Not yet live:** the migration must be applied and the first admin granted with `tools/grant-admin.mjs`.
- **Tested** (`npm run verify` in `landing/`: typecheck, lint, 30 tests, build).

## 14. Data pipelines

| Script | Output |
| --- | --- |
| `tools/data/build-places.mjs` | `seed/places.json` (OSM and Wikidata; named extras such as Bhaktapur Durbar Square) |
| `tools/data/gen-places.mjs` | `data/generated/places.ts` |
| `tools/data/build-treks.mjs` | `data/generated/treks.ts` |
| `tools/data/build_overture.py` | `seed/essentials.json`, `data/generated/essentials.ts` |
| `tools/data/build-site-photos.mjs` | `seed/site-photos.json`. A match needs both the Wikidata name and coordinates within 600 m; Basantapur's match was rejected by eye. |
| `tools/models/build-models.mjs` | 3D models and their manifest |
| `tools/brand/brand.py` | brand assets and the feature graphic |

Licences for all of it are in `LICENCES.md` and `NOTICE`.

## 15. Release

- **Release kit:** `docs/PLAY-STORE-HANDOFF.md`.
- **Marketing kit:** `docs/research/Sākṣī features fit and marketing kit.md`.

**Before a public launch:**
1. Build a new production bundle and test it on a phone.
2. Have a native speaker review the Nepali.
3. Onboard one custodian, ideally the Lumbini Development Trust.

**Blocked:**
- A Play developer account.
- The Google prepayment for satellite imagery.
- Expo's Android build quota until 1 December, or a paid plan.

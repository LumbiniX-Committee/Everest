# Work log

What changed in each milestone, what was verified, and what was not. Newest first. The plan lives in the delivery plan; this records what actually happened.

## Nepal in 3D: real scans and AR (2026-11-12, night)

- **0015 applied to production** with the owner's approval. Checked by calling `admin_weekly_activity`, `admin_list_reports`, `admin_crash_groups`, `admin_list_admins` and `admin_overview` as the admin in a rolled-back transaction. The console's sections now load live data.
- **Research.** No Nepali project publishes its heritage scans under an open licence that would let us copy them. The strongest were found on Sketchfab:
  - Bhugol Tour (Nepali drone surveys of Lumbini and Kasthamandap);
  - 3Dystopia's "Nepal Heritage" series (paid, Standard licence);
  - the UNC Chapel Hill Swayambhu project (scanned with the custodians' permission);
  - Visualising Heritage (research reconstructions);
  - Durham University's UNESCO Chair (Tilaurakot);
  - drone surveys of Kathmandu after the 2015 earthquake.
- **11 scans chosen by eye** (`tools/data/build-scans.mjs` → `seed/scans.json`):
  - only one is CC BY (Kasthamandap, rebuilding);
  - the rest are shown only in Sketchfab's own embedded player, with the creator's credit and `dnt=1`, and are never copied;
  - interior altars and patchy reconstructions were left out.
- **App:**
  - "Nepal in 3D" (`/(main)/tirtha/in-3d`, from Explore's plan list);
  - a scan screen (`/(main)/tirtha/scan/[scanId]`) whose player loads only when opened;
  - scan cards on the site page, the place page, the place guides and the model screen;
  - "View in your space" on Android, which opens our model in Google's Scene Viewer for AR (`models.arIntentUrl`) and falls back to the website.
- **Website:** `/[locale]/3d`, with:
  - a model-viewer stage for all 13 models, with numbered features, sources and an AR button (WebXR, Scene Viewer, and Quick Look on iPhone);
  - a scan gallery that loads Sketchfab only on click.
  - model-viewer is served from our own domain (`landing/public/vendor`), so no CDN is involved.
  - `tools/gen-3d-web.mjs` feeds both from one source; `npm run validate` fails if its output is stale.
- **Privacy policy** names Sketchfab and Scene Viewer.

**Verified:**
- App verify: 201 core tests and 114 React tests, plus 5 new scan tests run separately; 114 links across 51 routes.
- Website verify: 42 tests and the build.
- In headless Chrome, model-viewer loaded and drew the models on the 3D page.

**Not verified:**
- Sketchfab's player failed to start in headless Chrome (software WebGL), so scan playback has not been seen working.
- AR has not been tried on a phone: neither Scene Viewer from the app nor Quick Look and WebXR from the website.
- VR rests on Sketchfab's own player and has not been tried.
- No creator has been asked. Embedding is what Sketchfab offers for public models, but asking Bhugol Tour and the others would be courteous, and is needed before using any scan beyond the embed.

## Detailed admin console, change password, new website type (2026-11-12, evening)

- **Admin console** is now a full app at `/admin`:
  - sidebar sections with their own addresses: Overview, Reports, Sites, Access, Pro codes, Crashes, Admin log, Account;
  - the overview leads with "Needs attention", then headline numbers against the previous window, 12 weeks of activity, where reports stand, the oldest open reports by site, plans and people;
  - reports filter by status and site, page through, and expand to the visitor's note and the site's full action history.
- **Database:** migration `0015_admin_detail.sql` (read-only, admin-only), with pgTAP test `supabase/tests/admin_detail.test.sql`, which passed in CI.
- **Change password** at `/admin/account`, and at `/account` for custodians (linked from the portal):
  - the current password is checked with a session-less client before the change;
  - the rules live in `lib/password-policy.ts`;
  - the route has tests.
- **Website type:** Source Serif 4 and Source Sans 3 replace Newsreader and Mukta, chosen because they carry every IAST mark; Noto Devanagari carries Nepali. The hero line and heading accents are upright (a faked italic had been slanting Devanagari).

**Verified:**
- `landing` verify: 42 tests and the build.
- Every admin page rendered in headless Chrome at 1440 and 390 px with sample data, and checked by eye.
- The English and Nepali home pages rendered in the new type.

**Not done:**
- **Migration 0015 is not applied to production.** The session's permission check blocked it, so until it is applied the Overview and Reports pages show "Could not load".
- The password change was not run against the live auth server.
- No phone test.

## Place guides, and the admin console live (2026-11-12, later)

- **Place guides** for Pashupatinath, Boudhanath and Swayambhunath (`features/guides`, content in `data/guides.ts`). Each has:
  - a full-bleed cover photograph;
  - quick facts;
  - three chapters at Glance, Story and Scholar depth;
  - a credited gallery;
  - a numbered walk whose stops carry OpenStreetMap positions ("Show on the map"), or say "Not mapped yet";
  - before-you-go cards, the official fee, Ask shortcuts and sources.
  - They open from an "In depth" shelf on Explore and from each place's page.
  - Their text also feeds Ask (643 passages).
- **Admin console live:**
  - migration 0014 applied to production, with 0013 and 0014 recorded in `schema_migrations`;
  - the owner's account created and made a platform admin, with the grant logged;
  - checked by signing in as that account and calling `is_platform_admin` and `admin_overview`;
  - 10 Pro codes issued through `admin_issue_codes` (batch "Owner test codes, 2026-11-12").

**Verified:**
- `npm run verify`: 201 core tests, 114 React tests (6 new for the guides), 110 links across 49 routes, Ask benchmark 74/74.
- Lint holds at 59 errors.
- The guide pages and the Explore shelf were rendered in headless Chrome on the web build and checked by eye.

**Not verified:**
- On a phone.
- Guide text has not been reviewed by the site trusts or a priest or lama.
- Facts that rest on Wikipedia (heights, dates) should be checked against primary sources.

## Visitor record, Ask about places, admin console (2026-11-12)

- **Your record** (`features/me`): places visited, photos, every report at the step it has really reached, pending sync and plan, from this phone's database and the cached report steps. Reached from Explore's plan list and from Settings.
- **Ask about places:** 631 passages built from the 74 curated site pages, the official fees, Pashupatinath's note and the listed places with a Wikidata description. A question that names a place (every distinctive word of its name, or its Devanagari stem) is answered by quoting that place's page, with its source. The hand-checked heritage passages still win for history questions about the same place; the page wins for fees, rules and photography. Unrecorded opening hours are said to be unrecorded. The 74-question benchmark still passes 74/74; 9 new tests.
- **Ask page:** suggested questions, the visitor's recent questions (on this phone; "Delete my data" now clears them and the cached report steps), and a scope note that matches what it answers.
- **Admin console** at `/admin` on the website: reports waiting on each site, sites with no custodian, site access by email, Pro codes (issue, see batches, revoke), recent crashes and an admin log. Migration `0014_platform_admin.sql`.

**Verified:** `npm run verify` (200 core tests, 108 React tests, 103 links across 48 routes, benchmark 74/74), `landing` verify (36 tests and the build), lint at 59 known errors.
**Not verified:** the pgTAP test for 0014 runs in CI only (no local database: the disk is full); 0014 was applied to production later the same day (see above); `/admin` has not been opened against real data; none of it has been tried on a phone. Answers about places are in English even when asked in Nepali, unless a language model is configured.

## Design, Guide · Ask · Report, and new content (2026-11-08 to 2026-11-11)

Built after the 1.0 production bundle (`e08d04d`). **It is in preview APKs only (latest from `5c5b8b5`), not in any Play bundle.** None of it has been tried on a phone.

- **Guide:** the Glance · Story · Scholar depth control on the 74 curated site pages (not the 434 listed places), remembered across places. Explore opens on Guide · Ask · Report.
- **Report:** a timeline under each report (received, acknowledged, being worked on, resolved), from migration `0013_reporter_timeline.sql`. It was applied to production on 2026-11-08 and checked live: authenticated users can run it, anonymous users cannot.
- **Map:** a 3D town in 3D mode at street zoom (`components/map/townLayer.ts`); monuments drawn as what they are.
- **Photos:** 10 more sites and the three treks have credited Commons photos, loaded online with a fallback offline.
- **Sunlight theme:** primary and secondary text at 7:1, tested.
- **3D models:** 13 now. Pashupatinath was rebuilt in detail; Basantapur tower, Taleju, Kasthamandap and Maju Dega are new. Only overall heights and counts are sourced.
- **Words and characters:** Pashupati is described in words only. Four original mascots: guide, porter, macaque and woodcarver.
- **Website:** redesigned (Newsreader serif, bento grid, the visit circle), and the explorer map fixed (the MapLibre worker's shared chunk was missing).
- **Ask in store builds:** no language-model key is set in `eas.json`, so Ask likely answers from retrieval alone, still cited. Confirm the EAS environment before marketing it as AI chat.

## Release readiness for 1.0 (2026-11-08)

**Store-policy fixes**
- **Store builds no longer show prices or a code box.** With gating off, the Plans screen and the onboarding plan step still showed NPR 1,000 / USD 20 and "Redeem code", which review reads as selling digital features outside Play billing. Now the plan step is skipped, the Plans screen says everything is included, and `tools/check-release-config.mjs` fails a production build with gating on.
- **Permissions:** the app asks for foreground location and camera only. Blocked: `RECORD_AUDIO`, `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` (all unused, each a Play declaration), background location and the overlay permission.
- **Privacy policy:** it linked `PRIVACY.md` in the private repo, which the public got as a 404. The link is gone. The policy now names every outside service, covers plans and crash reports, in English and Nepali, and has a `#delete` anchor for Play's deletion URL.
- **In-app:** Settings → About has map and data credits (OSM, OpenFreeMap, Copernicus DEM, Overture with Foursquare's notice) and a link to the privacy policy.

**Store assets and security**
- **Store kit:** `docs/PLAY-STORE-HANDOFF.md` is rewritten. It has the listing in English and Nepali, the Data safety answers (declaring that walking directions share location with the routing server), the content rating, app access, a screenshot shot list and a pre-launch checklist.
- **Feature graphic:** regenerated with "Your real-time guide to Nepal".
- **Security:** no secrets in tracked files; `.easignore` excludes env files, the service account and `.envrc`.
- **Production bundle:** EAS build `df541c44`, version 1.0.0 (version code 4), from `e08d04d`: https://expo.dev/artifacts/eas/t0ZGWBvfYG9gRz0cIfKos3v_YQJuAISYK79evNOVzOk.aab. CI green; the live privacy page has the services section and the `#delete` anchor.
- **Not done here:** screenshots (no emulator on this machine), testing on a real phone, the Play account and listing.

## Visitor essentials from Overture Maps (2026-11-08)

- **Source check:**
  - Overture Places (2026-10-21.0) holds 95,227 places in Nepal: about 93,300 from Meta and 1,061 from Microsoft (CDLA-Permissive-2.0), about 1,200 from Uberall, 142 from AllThePlaces (CC0) and 119 from Foursquare (Apache-2.0).
  - Foursquare's own Open Source Places is now gated behind sign-up, and Overture carries its records with their licence, so one import covers both.
  - Overture has no opening hours.
- **Imported:** 1,086 essentials at confidence ≥ 0.8:
  - **Kathmandu:** 385
  - **Pokhara:** 337
  - **Chitwan:** 165
  - **Lumbini:** 68
  - **Along the treks:** 85 (Everest Base Camp), 38 (Poon Hill) and 9 (Langtang), each tagged with its nearest stop.
  - 999 have a phone number and 751 a website.
  - Built by `tools/data/build_overture.py`.
- **Found while testing:** one record's phone was an empty string, which would have given a Call button that dials nothing; blank phones and websites are now null. Animal hospitals are filed as "hospital" by Overture; they are now excluded from Health.
- **Not checked:** listings are open data and not verified on site.

## Offline maps and loose ends (2026-11-08)

- **Offline map packs (Pro):** save a hub from Settings → Storage, or a trek from its page.
  - **Saved:** the basemap to zoom 14, terrain to zoom 12, and label fonts, including Devanagari.
  - **How it works:** the map loads them through a `saksi://` protocol that tries the network first, so online behaviour is unchanged.
  - **Checked:** headless Chrome with the tile hosts blocked drew the same 278 features and 34 labels as online.
  - **Not checked:** a real phone in flight mode.
- **Found and fixed:** listed-place names never showed on the full-screen map. Their layer reused the basemap's `place-label` id, and MapLibre rejected it.
- **Tilt honesty:** an aligned record from a phone without a motion sensor now says tilt was not measured; the record already stored it as null.
- **Checked:** migration `0010` is applied in production.

## Trekking routes and Google imagery (2026-11-08)

- **Treks:** Ghorepani–Poon Hill (5 days, 47.9 km, 2,617 m of climb), Langtang Valley (6 days, 66.8 km, 3,102 m) and Everest Base Camp (11 days, 111.8 km, 4,510 m).
  - **Data:** words from `seed/treks.json`; stops matched in OpenStreetMap; days routed with Valhalla; altitudes from the Copernicus DEM via Open-Meteo, smoothed over about 600 m. Built with `npm run data:treks`.
  - **Checked against known heights:** Kyanjin Ri was first matched wrongly (4,079 m) because OSM spells it "Kyāṅjiṅ Ri"; fixed (4,541 m against a mapped 4,604 m).
  - **Walking times:** raw elevation data doubled the climb and inflated times; now within about 40 minutes of commonly quoted stage times on average.
  - **Trail map:** places the visitor along the day's trail and measures the distance and climb to the next stop (`core/treks/progress.ts`).
  - **Map fix:** the map page only built its route, position and stop layers when the 3D figure was on; that code is now always included.
- **Google imagery:** `services/imagery` uses `EXPO_PUBLIC_GOOGLE_MAPS_KEY` for Map Tiles sessions, with MapTiler as fallback. The key currently answers "enable billing" (Google requires a prepayment on this account), so satellite stays hidden and listed as coming soon until a session succeeds.

## Precision pass and Pro verification (2026-11-07)

- **Close-up precision:**
  - GPS fixes are blended by their accuracy (`smoothFix`).
  - A lock must hold 0.8 s, and survives a wobble under 0.5 s.
  - A compass the phone calls unreliable can never lock.
  - Hints never quote a distance finer than GPS error.
  - The step list and the lock share one tolerance.
- **Pro, tested end to end against production:**
  - Wrong code refused.
  - Real code redeems (case and spacing insensitive) and survives a reload.
  - A reinstall gets the same end date.
  - A third phone is refused.
  - The unbuilt features were moved to "Coming soon".
- **Left on the server:** one internal test code and two test entitlements.

## Milestone 6: 3D monuments

### Changed
- **`tools/models/build-models.mjs`:** generates schematic glTF models for nine monuments from architectural shapes such as stepped plinths, domes, harmikas, tiered spires, pagoda roofs and shikhara towers.
  - The nine: Swayambhunath, Boudhanath, the World Peace Pagodas in Lumbini and Pokhara, Nyatapola, Pashupatinath, Changu Narayan, Patan Krishna Mandir, and the Ashokan Pillar.
  - Each model has features to point out, and a Wikipedia source link. Text is never copied.
- **Viewer:** `@google/model-viewer` 4.4.0, bundled into `components/models/vendor.generated.ts` so 3D works offline.
  - It isn't an npm dependency, because it declares a newer three.js than the map uses as a peer. Installing it with `--legacy-peer-deps` silently removed the Jest preset, which this milestone caught and reverted.
- **Delivery:** models are served from the website (`landing/public/models`, 34–237 KB each), downloaded the first time they're opened, and saved on the phone. The download is written to a temporary file and moved into place only when complete.
- **Screen:** `/(main)/tirtha/model/[modelId]`.
  - Every model carries the label "Schematic model: shapes and proportions are approximate… Nothing here is measured."
  - Tapping a feature turns the camera to it.
  - "View in 3D" appears on site and place pages that have a model.
- **Pro:** 3D views are Pro. Swayambhunath is the free sample.

### Verified
- The real viewer page rendered in Chrome for four models: each loads, posts ready, has no errors, and is recognisable.

### Not verified, and decisions
- WebView performance on a mid-range Android phone.
- **Maya Devi Temple was left out on purpose:** there were no reliable proportions for the 2003 structure.
- A site expert should review the models for respectful representation before they are promoted.

## Milestone 5: close-up guided visit

### Changed
- **Step tracker:** the viewpoint screen shows five steps: get there, stand on the mark, face the view, hold level, take the photograph.
  - The current step comes from live readings, with one written instruction. The voice hint is no longer the only way to hear it, and it now uses the visitor's language.
  - A direction arrow, live location accuracy, and the reason the lock is waiting: GPS, compass, tilt or position. `blockedBy` is now passed through instead of being dropped.
  - This is the "close-up guidance" Pro feature. Capture by eye stays free.
- **Compass calibration:** the prompt existed but was never shown. It is now offered when the compass is what's blocking the lock.
- **Photography restriction:** shown on the viewpoint screen before the camera, and the capture button is disabled there.
- **Estimated viewpoints:** the 41 generated viewpoints are flagged `estimated` and labelled as placed from a map, not surveyed, on the viewpoint screen and in site lists.
- **Arrival needs a fine enough fix:** a fix looser than max(20 m, 1.5 × the site's reach) can no longer mark arrival.
- **Crowded sites:** where the fix can't separate neighbouring monuments, the map asks "Which monument are you at?" instead of guessing (`core/map/presence.ts`, tested).
- **Choosing a viewpoint:** "Witness" on the map opens the site's viewpoint list when there's more than one, instead of always the first.
- **Copy fix:** removed text promising a "ghost overlay", which does not exist.

### Verified
- Presence and ambiguity unit tests.
- Viewpoint screen in the browser: the restriction notice, and the no-location path.

### Not verified
- Every step that depends on a live sensor, which needs a phone on site.

### Decisions for the site authority
- Maya Devi Temple and the Marker Stone are recorded as `photography: restricted` at site level, so exterior viewpoints are blocked too.
- Photography is usually allowed outside and forbidden inside, but the data doesn't record that, and the charter rule is a hard block. The rule was left as it is, and the decision belongs to the site authority.
- If exteriors are confirmed, add an interior or exterior field to vantages.

## Milestone 4: real data

### Changed
- **`tools/data/build-places.mjs`:** fetches tourist places from OpenStreetMap (Overpass) for the four hubs and notable places nationwide from Wikidata, then merges, de-duplicates and filters them.
  - Each record keeps its source.
  - Places that duplicate a curated heritage site are dropped.
  - Nothing is filled in.
  - Raw responses are cached in `harvest/places-cache/`, which isn't uploaded to EAS.
- **Result: 434 places.** By hub: Lumbini 19, Kathmandu Valley 228, Pokhara 56, Chitwan 6. Another 125 are elsewhere in Nepal.
  - 187 have Nepali names, 204 descriptions, 143 Commons photos, and 181 Wikipedia links.
- **`seed/fees.json`:** official entry fees for 10 sites, recorded as facts from the Nepal Tourism Board with a last-checked date (2026-11-07). They are attached to curated sites by ID and to listed places by exact name.
- **New screens:**
  - **Place page:** photo, names, description, directions, fee for the visitor's type, opening hours, step-free access, and source attribution ("not yet checked on site").
  - **"Plan your visit" on site pages:** fees, hours and access, showing "Not known" when unknown.
  - **Elsewhere:** places appear on the map from zoom 13, on Home (near you, or in your starting area), and in map search.
- **Validation:** `validate-seed` now checks places and fees. It also warns once fees go unchecked for six months, and fails if the generated module is stale.

### Licences
- OpenStreetMap data is ODbL and kept as a separate file (`seed/places.json`), with "© OpenStreetMap contributors" shown wherever it appears.
- Wikidata is CC0.
- Photos load from Wikimedia Commons and are credited on the place page.
- Wikipedia text is never copied; only links are kept.

### Not verified, and known gaps
- These listings have not been checked on site, and say so.
- **Chitwan has only 6 places,** because OpenStreetMap has little there. It needs local data.
- **Bhaktapur Durbar Square isn't in the listing,** so its fee isn't attached. **Resolved 2026-11-11:** added by Wikidata id (Q4900869) as a named extra in `tools/data/build-places.mjs`; its fee now attaches.
- Opening hours exist for only 22 places, so most show "Not known". That is honest, but thin.
- Wikidata descriptions are shown as written, which sometimes means awkward phrasing.

## Milestone 3: a clear map

### Changed
- MapLibre GL JS 4.7.1 and three.js are bundled into the app (`tools/vendor-map.mjs`, `npm run vendor:map`), so the map opens with no network and no CDN dependency.
- **Map modes:** Standard (flat, north up, the new default), 3D (tilted, buildings, schematic monument massing), and Terrain (relief from the open AWS elevation tiles). Satellite and Hybrid appear only when `EXPO_PUBLIC_MAPTILER_KEY` is set, and are Pro.
- **Invented structure removed:** precinct walls generated from geofence circles are gone from both maps.
- **Places:** clustered when zoomed out, with larger tap targets, and sorted by importance when labels collide.
- **Your position:** an accuracy circle sized in real metres. Panning stops follow mode, and the recenter button brings it back.
- **Search:** the "Go to" list searches by name, ignoring diacritics and case.
- **Directions:**
  - Walking directions to any site or viewpoint, from the site page ("Directions") and the viewpoint screen.
  - Turn-by-turn instructions from Valhalla.
  - A new route only when the walker leaves the line, judged against GPS accuracy (`core/map/route.ts`, tested).
  - A 12-second timeout.
- **Reliability:** a tile error after load no longer swaps the whole map for the schematic plan.
- **Opening view:** the map opens on the starting area chosen in onboarding.
- **Schematic plan:** no longer clamps Kathmandu sites into a corner of Lumbini's frame.

### Verified
- The generated map page, rendered in Chrome: standard, clustered, 3D and terrain views. All layers present, no page errors, satellite falling back to standard without a key.
- Route geometry unit tests.

### Not verified
- The map inside the phone's WebView, GPS accuracy display, and turn-by-turn on a real walk.
- Valhalla's instruction language is English.
- **Offline map packs are not built yet.** The map's own code works offline, but tiles still need a connection.
- **Basemap labels use English names,** because MapLibre GL JS does not shape Devanagari correctly. Nepali labels need a native renderer or a pre-shaped font.

## Milestone 2: onboarding and plans

### Changed

**Onboarding**
- New first-run flow:
  1. Language, preselected from the phone.
  2. Who is visiting: self-declared, with no documents.
  3. What the app does.
  4. Where to start.
  5. Free compared with Pro, with "Continue free" as the main action.
- Steps after the second can be skipped.
- Permissions are no longer asked up front; each is asked when first needed.
- The alignment rehearsal moved to `/visit/practice`, offered from the viewpoint screen.
- Home has a "Start here" guide with three real actions, and asks visitor type once for people who installed before this existed.
- Settings has "Your trip": plan, visitor type, and Replay introduction.

**Plans**
- `core/plans` holds the Pro feature list, prices (NPR 1,000 or USD 20 a month), the 3-day offline grace, and code normalising, with tests.
- `supabase/migrations/0011_plans.sql`:
  - Only hashes of activation codes are stored.
  - Single-user entitlements, readable only by their owner.
  - Redemption through a function that rate-limits failed guesses and allows one reinstall without granting extra time.
- `tools/issue-codes.mjs` creates codes using the service role. No payment happens in the app.
- `ProGate` gates narration and the reflection companion. Directions, records and safety information can never be gated.
- **Gating is on in development and preview builds only** (`EXPO_PUBLIC_PRO_GATING` in `eas.json`). Store builds keep everything open until the stores' rules on selling digital features outside their billing have been checked.

### Verified
- `npm run verify` green, with 156 core tests, including 8 new plan tests.
- Browser walkthrough: language, visitor, discover, start, plan, then Home, Settings and plans, with no page errors.
- `supabase/tests/plans.test.sql` (12 checks) runs in CI against a local database.

### Not verified
- Redeeming a real code on a phone.
- The Nepali text in this milestone needs review by a native speaker.

## Milestone 1: navigation and record truth

### Changed

**Navigation**
- Each tab stack is anchored to its home, so a screen opened from another tab can no longer strand that tab.
- Back follows history rather than always jumping to the first tab.
- The app launches on Tīrtha Home, not the map.
- Viewpoint, capture and observation moved into a root-level Visit flow (`app/visit`). Finishing returns to the screen it started from, and the tab bar stays off the camera.
- Added `useSafeBack`, `useExitVisit`, `useOpenInTabs`, `useConfirmLeave`, `BackBar` and `NextStep`.
- Deep links can no longer skip onboarding.
- Unsaved captures and typed reflections ask before being discarded.
- Android back closes the story overlay.
- Fixed wrong destinations: featured quest, Compare, All Quests, quest completion stacking, the last camera task.
- Added "See on the map" on site pages and "Guide me" on arrival tasks.
- Empty states and completion screens now offer a next action.
- `tools/validate-routes.mjs` (in `npm run verify`) fails on broken links, bare `router.back()`, and pushed screens with no back control.

**Records**
- A capture is `aligned` only if the shutter fires at a live lock, with no compass correction and no demo position.
- Compass nudge is capped at ±15° and recorded.
- Demo captures are flagged, stay on the phone, and earn nothing.
- Readings a phone could not provide are marked unmeasured, shown as "Not measured", and uploaded as null.
- Pitch now uses camera elevation (`core/alignment/attitude.ts`). The old value compared about 90° on an upright phone against targets near 0°.
- Open data marks only field-measured coordinates as `surveyed`.

**Connected features**
- All task completions go through `settleTask`, so every finished quest earns merit.
- One visit per arrival within 20 minutes, from any surface, instead of inflated counts.
- Reading a place earns wisdom once per site, from either surface.
- The upload setting (Wi-Fi, any, manual) now controls every upload, and quest photos count as pending.
- The alignment tolerance and auto-capture settings now take effect.

### Verified
- `npm run verify`: 148 core tests, 70 React tests, 74/74 Dhamma benchmark, lint, types, routes.
- 20 browser scenarios on the web build, including launch, onboarding gate, cold deep links, first-visit tab homes, Visit flow return, and history-based back.

### Not verified
- **Nothing here has run on a real phone.** Web can't exercise the camera, GPS, compass, Android back button or swipe gestures.
- **The pitch fix follows Expo's documented axis and must be confirmed on a phone**, on both Android and iOS.
- `useConfirmLeave` behaviour with native back gestures.

### Required before the next app build
`supabase/migrations/0010_observation_integrity.sql` must be applied to production. Sync sends `heading_nudge_deg`, so uploads will fail until that column exists.

### Known and left for later
- A phone with no motion sensor still scores pitch as level, so the reticle can lock. **Resolved 2026-11-08:** the record already sends pitch as null and lists it unmeasured; the record screen now also says tilt was not measured.
- Nepali strings added in this milestone are mine and need review by a native speaker.

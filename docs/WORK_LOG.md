# Work log

What changed in each milestone, what was verified, and what was not. Newest first. The plan lives in the delivery plan; this records what actually happened.

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
- A phone with no motion sensor still scores pitch as satisfied. The record marks pitch as unmeasured, but the score can still lock. Revisit in Milestone 5.
- Nepali strings added in this milestone are mine and need review by a native speaker.

# Sākṣī app guide

> The full feature guide, with where each feature lives and how far it is verified, is [FEATURES.md](FEATURES.md). Changes for users are in [CHANGELOG.md](../CHANGELOG.md).

The living guide to what the app is, how it works, and how to run, test and release it. What changed and when is in [WORK_LOG.md](WORK_LOG.md). The rules for working in the code are in [AGENTS.md](../AGENTS.md), and the design system is in [DESIGN.md](../DESIGN.md).

## What it is

A real-time guide companion for heritage, nature and culture in Nepal, for foreign and Nepali visitors. It shows places on a map, walks you there, explains them as you arrive, shows monuments in 3D, and lets you add your own photograph to a record of how each place changes over time.

It keeps five promises, which outrank any feature:
1. Unmeasured is `null`, never `0`.
2. "By eye" is never shown as measured.
3. The AI suggests, it never decides.
4. Nothing is ever deleted.
5. The phone is the source of truth.

## The three tabs

| Tab | Visitors see it as | What it holds |
| --- | --- | --- |
| Tīrtha | Explore | Home, the map, sites, listed places, quests, 3D views |
| Sākṣī | Witness | Viewpoints, the guided visit, photographs, the record |
| Dhamma | Ask | Sourced answers, and the reflection companion (Pro) |

Settings opens from the gear on each tab. It covers the plan, the visitor type, replaying the introduction, language, privacy and crash reports.

## First run
The introduction asks for:
1. The language.
2. Who is visiting: self-declared, with no documents.
3. Nothing, on the "what you can do" screen.
4. Where to start: near you, or one of Lumbini, Kathmandu Valley, Pokhara and Chitwan.
5. A plan, with "Continue free" as the main action.

It lands on Home with a "Start here" guide. Permissions are asked when first needed. Replay it from Settings → Your trip.

## Plans

| | Free | Pro |
| --- | --- | --- |
| Map, search, walking directions | ✓ | ✓ |
| Site basics, entry fees, hours | ✓ | ✓ |
| Photographs and your own record | ✓ | ✓ |
| Offline maps (hubs and treks) | | ✓ (guides are bundled and always work offline) |
| 3D monument views | Swayambhunath only | ✓ |
| Satellite and hybrid map | | Coming soon until an imagery provider answers (Google needs billing on), then ✓ |
| Step-by-step close-up guidance | | ✓ |
| Audio narration | | ✓ |
| Reflection companion | | ✓ |

- **Prices:** NPR 1,000 a month for Nepali visitors, USD 20 a month for everyone else.
- **No payment in the app.** Pro is unlocked with an activation code.
- **Gating:** enforced in development and preview builds only, through `EXPO_PUBLIC_PRO_GATING` in `eas.json`. Store builds keep everything open until the stores' rules on selling digital features outside their billing have been checked for your markets.
- **Store builds show no prices and no code box:** the onboarding plan step is skipped, and Settings → Your plan says everything is included. `tools/check-release-config.mjs` fails a production build if gating is on. The full Play release kit is [PLAY-STORE-HANDOFF.md](PLAY-STORE-HANDOFF.md).

### Issuing codes

```sh
SUPABASE_URL=https://xvahqoivcmfiasffuufr.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<server secret, never in the app> \
node tools/issue-codes.mjs --count 10 --days 30 --note "Kathmandu agents, May"
```

- Codes print once, and only their hashes are stored.
- A code works on one phone, plus one reinstall that gets back the same end date.
- Failed guesses are limited to 8 an hour.

## Data

| Data | Where | Source and licence |
| --- | --- | --- |
| 74 curated heritage sites, 53 viewpoints | `seed/` → `data/generated/sites.ts` | Cited sources per site (see `LICENSE-CONTENT`) |
| 434 listed places | `seed/places.json` → `data/generated/places.ts` | OpenStreetMap (ODbL, attribution shown) and Wikidata (CC0) |
| 1,086 visitor essentials (stay, eat, health, money, travel, transport, police) | `seed/essentials.json` → `data/generated/essentials.ts` | Overture Maps Places, per-record licence (CDLA-Permissive-2.0, CC0, Apache-2.0); `python3 tools/data/build_overture.py` |
| Entry fees, 10 sites | `seed/fees.json` | Nepal Tourism Board, with the date last checked |
| Photos of listed places | Loaded from Wikimedia Commons | Per-file licences, credited |
| 13 schematic 3D models | `landing/public/models/` → `data/generated/models.ts` | Generated; labelled as schematic and unmeasured |

**Refreshing data:**
- `npm run data:places` re-fetches places from OSM and Wikidata, then regenerates the module.
- Re-check fees against the NTB page and update `lastChecked`. `validate-seed` warns after six months.
- `npm run models` regenerates the 3D models.

**Known gaps:**
- Chitwan has only 6 listed places.
- Opening hours are known for only 22 places.
- Generated viewpoints are labelled "Estimated" until someone surveys them on site.

## The map

The map is MapLibre GL JS 4.7.1 in a WebView, bundled with the app (`components/map/vendor.generated.ts`, refreshed with `npm run vendor:map`).

- **Basemap:** OpenFreeMap vector tiles.
- **Modes:** Standard (default, flat), 3D, Terrain (AWS open elevation tiles), and Satellite and Hybrid (Pro).
- **3D monuments (2026-11-11):**
  - **Pashupatinath** is rebuilt in detail: the two gilded tiers, silver doors, carved struts, the gilt pinnacle, the walled courtyard with its west gate, the gilded Nandi, Vasuki, Unmatta Bhairav, the Bagmati, and the fifteen Pandra Shivalaya shrines.
  - **New models:** the Basantapur tower with Lohan Chowk, Taleju (35 m, twelve plinths, three roofs), and Kasthamandap (about 20 m, 32 outer columns, four great pillars).
  - **Maju Dega** (nine-step plinth about 28 m square, three roofs): rebuilt after 2015. Travel sources say it reopened around 2022, but no official handover was found, so its note asks visitors to check on site.
  - **Face meanings:** the lingam's face directions are stated; their meanings are not, because only secondary sources map them.
  - **Sourced vs estimated:** only the overall heights (Pashupatinath about 23.7 m, Taleju 35 m, Kasthamandap about 20 m) and the counts are sourced. Every other size is an estimate from photographs, and each model's points say so.
- **3D town:** in 3D mode at street zoom (15 and closer), buildings are drawn as houses rather than boxes (`components/map/townLayer.ts`, three.js).
  - **Houses:** OpenStreetMap footprints and heights, walls with window rows, and pitched terracotta or tin roofs on small buildings. Large or irregular buildings get flat concrete roofs with a parapet.
  - **Colours:** from `MAP_MATERIALS` in the theme.
  - **Monuments are drawn as what they are, never grander:** stupas as domes, the Ashokan Pillar as a column, Ramagrama as a mound, excavated remains as low brick, and the Maya Devi Temple as the plain white building it is.
  - **Below zoom 15, and on maps without the figure,** the plain extrusions remain.
  - **Not tested:** frame rate on a low-end phone.
- **Imagery:** Google Map Tiles API with `EXPO_PUBLIC_GOOGLE_MAPS_KEY` (`services/imagery`), falling back to MapTiler with `EXPO_PUBLIC_MAPTILER_KEY`. Google needs **billing enabled and the Map Tiles API turned on** in its Cloud project; until a session is actually created, Satellite and Hybrid stay hidden and the Pro list says "Coming soon". Google hybrid uses Google's own road layer, so Google imagery is never mixed with OSM map data, and the on-screen credit shows Google's copyright for the current view.
- **Key safety:** an `EXPO_PUBLIC_` key ships inside the app. In Google Cloud, restrict it to the Map Tiles API only. An Android-app restriction does not help here, because the WebView's requests carry no app signature.
- **Routes:** walking directions come from Valhalla at `valhalla1.openstreetmap.de`, or `EXPO_PUBLIC_ROUTING_URL`. Self-host it for production if its terms don't allow your use.
- **Labels:** the basemap uses English names, because the renderer doesn't shape Devanagari.

## Offline maps

- **Saving:** Pro visitors save a hub from Settings → Storage → Offline maps, or a trek from its page. A pack holds the basemap to zoom 14, terrain to zoom 12, and label fonts. A trek corridor is a few hundred tiles.
- **How it works:** the map loads everything through a `saksi://` protocol. Online it fetches from the servers as before; only a failed fetch asks the app for a saved file (`services/offlineMaps`). Checked in headless Chrome with the network blocked: identical features and labels drawn.
- **Not saved:** satellite imagery (provider terms) and walking directions (Valhalla needs a connection).
- **Size and courtesy:** OpenFreeMap asks people not to bulk-download, so packs are one area each and tiles shared between packs are stored once.

## Trekking routes

Ghorepani–Poon Hill (5 days), Langtang Valley (6 days) and Everest Base Camp (11 days), from the "Trekking routes" card on Explore.

- **Each trek:** totals, an altitude profile, every day with distance, climb, descent, estimated walking hours, where you sleep and how high, plus seasons, access, permits, the guide rule and safety.
- **Altitude warning:** a day is flagged when you sleep above 3,000 m and more than 500 m higher than the night before.
- **Trail map:** the day's line on terrain, stops you can tap, and your position measured along the trail: what's done, what's left, and the distance and climb to the next stop. More than 150 m (plus GPS error) from the trail, it says so instead of guessing.
- **Data:** `npm run data:treks` rebuilds from `seed/treks.json`, OSM, Valhalla and the Open-Meteo elevation model. Fees are agency-published and dated; confirm with NTB.
- **Field checks still needed:** walk a day of each trek with the trail map; confirm stops marked approximate.

## The guided visit

The viewpoint screen walks through five steps: get there, stand on the mark, face the view, hold level, take the photograph.

- It shows one written instruction, a direction arrow, live accuracy, and the reason the lock is waiting.
- A photograph counts as "aligned" only with a live lock, no compass correction and no demo position. Anything else is saved as "by eye".
- Demo-walk photographs stay on the phone and earn nothing.

### Field checklist

These can only be checked on site with a phone:
- [ ] Location accuracy shown is close to the real error at Maya Devi Temple and Patan Durbar Square
- [ ] Pitch reads about 0° with the phone held upright, on both Android and iPhone
- [ ] A lock is reachable at a surveyed viewpoint, and the steps advance in order
- [ ] Arrival triggers once at each monument, and "Which monument are you at?" appears where monuments crowd together
- [ ] Generated viewpoints that are confirmed on site get `estimated` removed in `tools/gen-data.mjs`
- [ ] Maya Devi Temple: confirm with the site authority whether exterior photography is allowed

## Running it

```sh
nvm use 22            # verify needs Node 22
npm ci
npx expo start        # development
npm run verify        # types, tests, data, i18n, routes, Dhamma benchmark, lint
```

Keys live in `.env.tools.local`, which is gitignored and not uploaded to EAS: `GITHUB_TOKEN`, `VERCEL_TOKEN`, `EXPO_TOKEN`, `SUPABASE_ACCESS_TOKEN`. The app's public Supabase values live in `.env.local` locally. For builds, they live in EAS environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`, `EXPO_PUBLIC_PORTAL_URL`). A production build fails its pre-install check if any is missing.

## Testing

| Layer | Command | Covers |
| --- | --- | --- |
| Core | `npm test` | 162 tests: alignment, presence, routes, plans, sync policy and more |
| React | `npm run test:react` | 70 tests, including palette contrast |
| Database | CI: `supabase test db` | Row-level security, plans and redemption |
| Navigation | `npm run routes` | Every link resolves; no bare back; every pushed screen has a way back |
| End to end | `maestro test .maestro/` | Needs a development build on a phone or emulator |

## Releasing

1. **Commit:** `npm run verify` must pass, then push `main`. CI runs, and the website deploys from Vercel.
2. **Database changes:** apply new migrations in `supabase/migrations/` to production after CI passes.
3. **App build:**
   - Preview APK: `npx eas-cli build --platform android --profile preview`. The website's download button picks it up automatically.
   - Store: `--profile production` builds an app bundle. The last one was 170.9 MB, about 108 MB to download on a 64-bit phone once Play removes the debug symbols.
   - Submitting needs `google-play-service-account.json` for Play and an Apple Developer account for iOS.

## Accounts

| Service | Account | Notes |
| --- | --- | --- |
| GitHub | `siddantasodari4-eng/saksi` | Private |
| Expo | `@saksi-nepal/saksi` | App ID `com.saksinepal.saksi` |
| Vercel | Project `saksi` | https://saksi-beta.vercel.app |
| Supabase | `xvahqoivcmfiasffuufr` | Sydney region |

The older Everest project is a separate checkout (`~/Everest`) with its own accounts. Never mix their keys.

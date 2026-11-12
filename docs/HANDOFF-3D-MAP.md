# Handoff: realistic 3D map and walking character

Written 2026-11-12 so a new session can finish this task. Everything below is the state at commit `ac6a205` (saksi `main`, also merged into Everest `main` and `fix/system-robustness`) plus one uncommitted file.

## The user's request (verbatim)

> implement in our real time map based app: https://sketchfab.com/developers, here many 3d models are their so analyse them and implement in our map for realistic view.. and update that character in map with realistic human walking in precise manner..

Before that (done and live): "apply 0015" and "analyse the nepali project which recreats 3d detailed of heritage site of nepali and now integreate then in our site so our system look so clean and fully 3d ar/vr models.."

## Ground rules (from memory and AGENTS.md)

- Work in `~/saksi` (GitHub `siddantasodari4-eng/saksi`, Vercel `saksi`, Supabase `xvahqoivcmfiasffuufr`, Expo `@saksi-nepal/saksi`). Keys in `~/saksi/.env.tools.local` (GITHUB_TOKEN, VERCEL_TOKEN, EXPO_TOKEN, SUPABASE_ACCESS_TOKEN).
- `~/Everest` is a separate repo (`LumbiniX-Committee/Everest`), pushed with the global gh login. **Never push Everest from a shell that loaded saksi's `.env.tools.local`** (it 403s). Sync with: `cd ~/Everest && git fetch /home/mac/saksi main && git merge --no-edit FETCH_HEAD && git push origin fix/system-robustness && git checkout main && git merge --no-edit fix/system-robustness && git push origin main && git checkout fix/system-robustness`.
- Push saksi with its own token: `GITHUB_TOKEN=$(grep '^GITHUB_TOKEN=' .env.tools.local | cut -d= -f2-) bash -c 'git -c credential.helper= -c "credential.helper=!f() { echo username=x-access-token; echo password=$GITHUB_TOKEN; }; f" push origin main'`.
- Node 22 for checks: `export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"`. Run `npm run verify` (app) and `cd landing && npm run verify` (website). `npm run lint:all` must stay at **59 errors**.
- New UI strings must be registered in `i18n/literals.ts` (English → Nepali) or `npm run i18n` fails.
- After adding a route: `CI=1 timeout 70 npx expo start -c --port 8099` regenerates typed routes.
- Five promises: unmeasured is null never 0; by-eye never shown as measured; AI suggests never decides; nothing deleted; the phone is the source of truth.
- Production DB changes need the user's explicit approval (the auto-mode classifier blocks them otherwise). Apply via the Supabase Management API after CI passes, and insert the row into `supabase_migrations.schema_migrations`.
- Disk is nearly full (~500 MB free). Clean scratch files; local `supabase start` and local builds are impossible.
- Killing processes: never `pkill -f <pattern>` (it kills your own shell). Use `ps -eo pid,args | awk '/next de[v] -p 3123/ {print $1}'` and `kill` those pids.

## What is already done (live)

- Migration 0015 applied to production; admin console works.
- "Nepal in 3D": 11 Sketchfab scans embedded (player only, never copied), `seed/scans.json` from `tools/data/build-scans.mjs`, `tools/gen-3d-web.mjs` feeds `data/generated/scans.ts`, `landing/lib/generated/{scans,models}.ts`, `landing/public/vendor/model-viewer.min.js`. App screens `features/models/{ScanScreen,NepalIn3DScreen}.tsx`, `components/models/{ScanPlayer,ScanCards}.tsx`, Android AR via `models.arIntentUrl` (Scene Viewer). Website `/[locale]/3d` (`landing/components/Nepal3D.tsx`).
- Not verified: Sketchfab playback (headless Chrome cannot run it; the Chrome extension was not connected), AR/VR on a phone.

## Findings for this task

### The map today
- `components/map/mapHtml.ts` builds the MapLibre page in a WebView. three.js **0.160.0** is vendored as a global UMD build (`THREE_JS` in `components/map/vendor.generated.ts`, written by `tools/vendor-map.mjs`). **No GLTFLoader is bundled.**
- The character is `AVATAR_LAYER` in `mapHtml.ts` (around line 950–1170): a procedural robed figure from three.js primitives, a custom layer `sakshi-figure`, Z-up, screen-constant size (`FIGURE_PX = 46`), walk phase driven by `pose.speed > 0.35`, position smoothed by `advancePose(k)` (`POSITION_MARKER`, ~line 600) which owns `pose = { lng, lat, heading, drawLng, drawLat, drawHeading, speed, ... }`. `window.sakshiSetPose` feeds it. The MapLibre circle/arrow marker is the fallback that must never fail.
- 3D buildings: `components/map/townLayer.ts` (houses from OSM, monuments drawn as shapes, `MAP_MATERIALS` in `theme/mapStyle.ts`).

### Sketchfab
- Download API needs the user's **API token** (Sketchfab → Settings → Password & API). We have none. Only CC0/CC BY downloadable models may be copied into the map; most Nepali heritage scans are not downloadable (see `docs/WORK_LOG.md`, "Nepal in 3D").
- Best realistic walking human: **"Nathan Animated 003 - Walking 3D Man" by Renderpeople**, uid `143a2b1ea5eb4385ae90a73657aca3bc`, CC BY, 21,506 faces, 1 animation (walk). Alternative: "Scanned animated walking man" by 1-3D.com, uid `bfbb95c3cb2b4e89a20d3d201b05045f`, CC BY. Needs token to download.
- CC BY monument candidates (downloadable, mostly heavy or rough): Kasthamandap Rebuilding Process `a172a6c625a84181b68fa4284679de1e` (115k faces), Swayambhu Stupa `44bc6c3fc17b4d04914a7903f34c28b9` (25k, CG), Boudhanath Temple Nepal `39d450564b0f43998af8a28b845a2d34` (15k), Tusa hiti `ae79c0cca5c34f0f9a9d869eeccdb983` (2.3M, too heavy). Recommendation: use **our own 13 glTF models** (`landing/public/models/*.gltf`, true metre scale, self-contained) on the map; add Sketchfab CC BY ones only after a token, decimated, with on-map credit.

### Interim character (uncommitted)
- `landing/public/characters/cesium-man.glb` (438 KB) downloaded from KhronosGroup glTF-Sample-Assets, **CC BY 4.0 by Cesium**, walk animation. **Its licence excludes the Cesium logo**, which appears to be on the shirt texture. Was about to extract the texture to check (script failed on `animations[].name` KeyError; use `.get('name')`). If the logo is there, blank it or do not use CesiumMan; prefer the Renderpeople model once a token exists.

## Progress since the handoff was first written (2026-11-12, later)

Saved on branch **`wip/realistic-walker`** (not on `main`, not deployed):

- The user gave a Sketchfab API token. It is stored only in `~/saksi/.env.tools.local` as `SKETCHFAB_API_TOKEN` (git-ignored) and verified (account `MiddleMacaw667`).
- **Downloaded** Renderpeople "Nathan Animated 003 - Walking 3D Man" (uid `143a2b1ea5eb4385ae90a73657aca3bc`, **CC BY 4.0**) as `landing/public/characters/walker.glb` (1.8 MB, 89 joints, one 2.23 s in-place walk clip "Take 001", Y-up, cm units under a root matrix). The CesiumMan stand-in was deleted (its logo was excluded from its licence).
- **Step 1 done:** `tools/vendor-gltf-loader.mjs` → `components/map/gltfLoader.generated.ts` (`GLTF_LOADER_JS`, three 0.160.0, 108 KB, parses). Injected after `THREE_JS` in `buildMapHtml` when `avatar` is on.
- **Step 2 written, not yet seen working:** in `AVATAR_LAYER` (`components/map/mapHtml.ts`), `WALKER_URL` = website `/characters/walker.glb`. On load: scale to 1.75 m, feet at origin, Y-up→Z-up (`upright.rotation.x = π/2`), `walker.rotation.z = π` (assumes the model walks toward +Z; **check by eye**), `AnimationMixer`. `measureWalk()` estimates natural speed from the left-foot bone's sweep (stance ≈ 60% of cycle) and finds "feet together" times. Each frame: walking → `timeScale = clamp(speed / naturalSpeed, 0.35, 2.2)`; stopping → finish the step at 0.8× and stop at a neutral time. The robed figure hides except its shadow; it remains the fallback (offline, load error). Posts `figure-ready` / `figure-model-failed`.
- **Website:** `landing/next.config.mjs` adds `Access-Control-Allow-Origin: *` and caching for `/characters/*` and `/models/*`, because the WebView page has no origin.
- `npx tsc` clean; `tests/native/map-html.test.ts` passes (6). Full `npm run verify`, website verify and lint not yet run on this branch.

**Step 1 checked by eye (2026-11-12, uncommitted fixes in `mapHtml.ts`):** rendered in headless Chrome (swiftshader) with `walker.glb` served locally with CORS. Facing is right as written (`walker.rotation.z = π`): back view looking north, face looking south, profile looking east. Height and grounding look right. Fixed: (a) `measureWalk` measured in the scan's centimetres (`worldToLocal` undid the scale) and missed the crossing at the loop seam, so it was always rejected and fell back to defaults; it now gives 1.02 m/s, 1.117 s cycle, four feet-together times; (b) stopping used a ±0.04 s window a slow frame could skip, so it now stops exactly on the next feet-together time; (c) GPS sends no fixes when standing still (`distanceInterval` 2 m), so the last speed stood forever; speed now counts as 0 once a fix is overdue (> max(2.5 s, 4 m ÷ speed)); (d) `maxZoom` is 19, so the 46 px figure is always ≥ 3.5× life size and the planted foot slid 0.5–1 m per step. **The user chose planted feet:** `timeScale = speed / (naturalSpeed × drawnScale)`, clamped 0.2–2.2, so he takes fewer, longer strides. Measured foot drift per stance is now 1–13 cm at z19 and 20 cm at z18 (≤ 1 px). The scale also never drops below life size (inactive while maxZoom is 19). Known limit: the clip has no idle, so the stop pose is the "feet passing" frame of the walk (one knee slightly forward), not a relaxed stance.

**Next on this branch:**
1. ~~Render the map page in Chrome to check the walker by eye~~ (done, above): dump `buildMapHtml({ fullscreen: true, interactive: true, avatar: true })` from a throwaway Jest test into the scratchpad (and delete the test afterwards), open it with puppeteer-core (scratchpad `pp/` has it; launch args `--use-angle=swiftshader --enable-unsafe-swiftshader`), call `window.sakshiSetPose` with moving positions, and screenshot. Check facing (flip `walker.rotation.z` if he walks backwards), height, the feet not sliding, and the stop pose. The walker only loads once the website has deployed the CORS headers and `walker.glb`, or serve them locally.
2. ~~Credit Renderpeople~~ (done: `LICENCES.md` and the map attribution).
3. ~~Steps 3–6~~ done, uncommitted (see `docs/WORK_LOG.md`, "Realistic walking figure and monuments on the map"): monuments on the map (`components/map/monumentModels.ts`), `tools/data/fetch-sketchfab.mjs`, credits, app verify, lint at 59, website typecheck/lint/tests, docs. Bhugol Tour's profile (sketchfab.com/Raj.Bikram.Maharjan) explored: 25 scans, 7 CC BY downloadable, the Lumbini ones not.
4. **Shipped 2026-11-12:** commit `39b97d0` on `main` (and `wip/realistic-walker`); Vercel production deploy `dpl_HiBAwmNXeBPynK5LBf1jhmp3drn7` READY, with `saksi-beta.vercel.app/characters/walker.glb` and `/models/*.gltf` served with `Access-Control-Allow-Origin: *`; Everest synced (`main` and `fix/system-robustness`); OTA update to the Android **preview** channel, group `e4bfd706-0394-4643-87c3-dfed138016ea` (runtime 1.0.0; no native change). **Still open:** a look on a real phone (frame rate, figure, monuments); terrain mode with models; the website build was only run on Vercel; production channel not updated. Optional: fix Swayambhunath's coordinate at its source; consider Bhugol Tour's CC BY "Kasthamandap Rebuilding Process" (5 MB) as a scanned monument on the map.

## Plan to finish

1. **Vendor GLTFLoader for the map.** Write `tools/vendor-gltf-loader.mjs`: read `node_modules/three/examples/jsm/loaders/GLTFLoader.js` (three 0.160.0), replace its `import {...} from 'three'` with `const {...} = THREE;`, inline `toTrianglesDrawMode` from `examples/jsm/utils/BufferGeometryUtils.js` (line 746, destructuring `TrianglesDrawMode, TriangleFanDrawMode, TriangleStripDrawMode` from THREE), drop `export`, wrap in an IIFE that sets `THREE.GLTFLoader`. Output `GLTF_LOADER_JS` into `components/map/vendor.generated.ts` or a new generated file, and inject it after `THREE_JS` in `mapHtml.ts`. No bundler is installed (no esbuild/rollup).
2. **Character.** In `AVATAR_LAYER`, load the walking human glTF (from `https://saksi-beta.vercel.app/characters/<file>.glb`, same base as `services/models` `BASE_URL`), with an `AnimationMixer`. Keep the procedural figure as the fallback until it loads or if it fails. The glTF is Y-up: rotate +90° about X to stand it in the map's Z-up frame, then turn about Z by `-drawHeading`. "Precise" walking: `action.timeScale = pose.speed / CLIP_NATURAL_SPEED` (measure the clip's root travel or stride length ÷ duration; about 1.3 m/s typical), clamp; ease to a standing pose (pause the action at a neutral frame and fade weight) when `pose.speed < 0.35`; keep feet from sliding by syncing timeScale to speed. Keep the screen-constant size, but switch to true scale (1.75 m) once true scale exceeds `FIGURE_PX`.
3. **Monuments on the map.** A custom layer (3D mode, zoom ≥ 16) that loads our models from `/models/<id>.gltf` for sites and places in view (`data/generated/models.ts` `targets` → coordinates via `findSite`/`findPlace`), at true scale, north-aligned, Y-up → Z-up as above; suppress `townLayer`'s OSM monument shape within the model's footprint; small on-map credit "Schematic model". Cap at a few models at once; dispose when out of view.
4. **Sketchfab download script** (once the user adds `SKETCHFAB_API_TOKEN` to `.env.tools.local`): `tools/data/fetch-sketchfab.mjs` calls `GET https://api.sketchfab.com/v3/models/{uid}/download` with header `Authorization: Token <token>`, fetches the `glb` (or `gltf` zip), checks the licence is CC0/CC BY, writes to `landing/public/characters/` or `landing/public/models/scans/`, and records credit in `LICENCES.md`. Then swap the character to Renderpeople's Nathan.
5. **Credits:** add CesiumMan/Renderpeople to `LICENCES.md` and an on-map attribution (MapLibre attribution control) and the privacy policy if a new host is contacted.
6. **Checks and docs:** app `npm run verify`, website verify, lint at 59; update `docs/WORK_LOG.md`, `docs/FEATURES.md` §4 Map, `docs/ai-context/FEATURES.md`, `CHANGELOG.md`. The character and monuments are WebView/WebGL: say plainly that frame rate and look on a low-end phone are unverified. Optionally publish an OTA update to the preview channel (`npx eas-cli update --channel preview --environment preview --platform android`, with EXPO_TOKEN from `.env.tools.local`) after confirming no native dependency changed.

## Ask the user

- Their Sketchfab API token (to put in `~/saksi/.env.tools.local` as `SKETCHFAB_API_TOKEN=...`), so the Renderpeople walking man can replace the interim figure.
- Whether to also write to the scan creators (Bhugol Tour, 3Dystopia, Renderpeople, UNC) for permission beyond embedding.

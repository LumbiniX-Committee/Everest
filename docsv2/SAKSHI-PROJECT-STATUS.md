# Sākṣī — Project Status, Reality Check, and Hackathon Plan

**Audit date:** 2026-08-08  
**Repository:** `LumbiniX-Committee/Everest`  
**Current synchronized commit:** `9592a7a`  
**Branches:** `main` and `Aaditya` both point to the same commit and both track their remote branches.  
**Audit basis:** source code, routes, data, tests, deployment files, `SAKSHI-COMPLETE.md`, `PROJECT.md`, `README.md`, and `HANDOFF-PHASE-8-9.md`.

> This is an evidence-based implementation report. “Implemented in code” means the repository contains the feature. “Demo-ready” additionally requires a successful run on the actual presentation device and a known-good backend/configuration.

## Executive summary

Sākṣī is a heritage-conservation and pilgrimage application for Lumbini. Its central idea is to turn a visitor’s attention into evidence: a person visits a site, aligns with a fixed viewpoint, records what is there, and contributes a time-series that can help people notice change.

The repository has a substantial MVP already built:

- Three product surfaces exist: **Tīrtha**, **Sākṣī**, and **Dhamma**.
- The Expo Router app has onboarding, main navigation, settings, site detail, Then/Now, capture, observation, register, quests, and Dhamma routes.
- Seed-driven content exists for 12 sites, 6 vantages, 10 quests, 3 needs, 5 timeline entries, and 10 plates.
- Camera capture, location, heading, pitch, alignment scoring, local SQLite persistence, condition reports, merit accounting, and offline-first queues are implemented in code.
- The Dhamma engine has canonical Bilara passages, hybrid retrieval, grounding/refusal gates, citation validation, adversarial checks, Nepali safety checks, deterministic fallback, and Ollama Cloud synthesis.
- Expo now sends Dhamma requests to `/dhamma/ask`; Nepali is the default response language and the answer screen has an English/Nepali toggle.
- The 50-question Dhamma benchmark scores **49/50, 98%**, with all mandatory gates passing.
- The core test suite passes **55/55**.
- TypeScript passes.
- Seed validation passes with 5 coordinate-quality warnings.
- The combined `npm run verify` gate currently fails at the vocabulary lint stage because six occurrences of the banned word `tokens` are in retrieval variable names. This is a cleanup issue, not a product logic failure, but it must be fixed before claiming a completely green verification gate.

The main remaining work is not “build the whole product from zero.” It is to make the strongest existing path reliable and provable:

1. Make the Dhamma backend deployable and configured with a rotated Ollama key.
2. Test Nepali-first Dhamma responses and language toggling on the exact phone used for judging.
3. Complete one reliable end-to-end conservation loop on a physical device.
4. Verify the public or LAN API, camera, GPS, heading, storage, and offline behavior on-device.
5. Fix the verification gate, coordinate warnings, content/provenance gaps, and stale documentation.
6. Prepare a six-minute demo, a short slide deck, and a failure-safe backup path.

## The product in one sentence

Sākṣī turns pilgrimage attention into conservation evidence: explore a real place, witness it from a repeatable viewpoint, record its condition, and ask only source-backed questions about what the place and the canon can support.

## What the master documentation intended

`SAKSHI-COMPLETE.md` defines three surfaces and several non-negotiable principles:

### Tīrtha

The place layer: a Lumbini map, twelve sites, site detail, historical Then/Now material, arrival context, narrated content, and a restrained quest layer.

### Sākṣī

The witness layer: fixed-point rephotography, alignment, capture, structured condition reporting, local persistence, later synchronization, and a register of observations.

### Dhamma

The knowledge layer: citation-locked retrieval over a deliberately narrow canonical corpus, refusal when evidence is insufficient, no Buddha impersonation, and reflection rather than advice.

### Product principles that are present in the code

- Evidence is more important than engagement mechanics.
- A manual “match by eye” path must not pretend that a sensor-verified alignment happened.
- Missing measurements remain `null`; they are not converted into fake zeroes.
- Offline-first storage is safer than treating the network as the source of truth for a photograph.
- Merit is non-transferable and capped; it is not presented as cash, points, or a payout.
- Dhamma answers must have citations or become a refusal.
- The application should be useful with restraint rather than optimized for compulsive use.

## Current system shape

```text
Expo Router app
  ├─ onboarding
  ├─ Tīrtha: map → site → Then/Now / narration / arrival / quests
  ├─ Sākṣī: vantage → alignment → capture → observation → register / series
  ├─ Dhamma: question → API request → grounded answer/refusal → citation
  └─ Settings: preferences, permissions, storage, sync, about, arrivals

Local data path
  seed/*.json
    → tools/gen-data.mjs
    → data/generated/*.ts
    → data/index.ts
    → feature screens

Observation path
  camera + GPS + heading + pitch
    → alignment score / manual gate
    → SQLite observation + condition report
    → offline queue
    → optional Supabase sync

Dhamma path
  AnswerScreen
    → services/dhamma.ask(question, language)
    → POST /dhamma/ask
    → core/dhamma/engine.ts
    → grounding gate + retrieval
    → Ollama Cloud synthesis when configured
    → citation validation
    → deterministic cited fallback if generation fails
```

## Implementation inventory

### 1. App shell and navigation — complete in code

Present:

- Expo SDK 57 and React Native 0.86.
- Expo Router file-based navigation.
- Onboarding routes for welcome, purpose, permissions, and how-it-works.
- Main navigation for Tīrtha, Sākṣī, and Dhamma.
- Settings stack for preferences, permissions, storage, sync, about, and arrivals.
- Shared UI primitives, theme tokens, typography, spacing, radii, cards, buttons, loading, error, empty, and offline states.

Relevant locations:

- `app/`
- `components/ui/`
- `components/navigation/`
- `theme/`
- `store/`

Demo status: **likely ready**, but every route still needs a final smoke test on the presentation device.

### 2. Tīrtha map and site exploration — substantially complete in code

Present:

- Twelve seeded Lumbini sites.
- Site list and site detail screens.
- Map screen and recent map work for color, zoom, responsive layout, and monument massing.
- Web and native map implementations/fallbacks.
- Site facts, tiers, zones, photography policy, coordinates, and geofence radii in generated data.
- Arrival-aware content and site wisdom components.
- Historical Then/Now flow with evidence-tier labels.
- Timeline and narration components.

Important qualification:

- Several coordinates are still marked `doc`, not field-verified survey coordinates.
- The site model is strong enough for a controlled demo, not yet a survey-grade conservation deployment.
- The map must be tested on the exact device and network used in the demo, especially its native/web split and map asset loading.

Demo status: **demo-ready after device smoke test**.

### 3. Then/Now evidence experience — one of the strongest completed features

Present:

- Historical plates and modern imagery data structures.
- Evidence-tier labels.
- A comparison/scrubber-style presentation.
- Honest empty/placeholder behavior where an image pair cannot be aligned responsibly.
- Ashokan Pillar and Puskarini content paths.

This should be the visual hook of the pitch because it communicates the product immediately and does not require the judge to understand the entire backend.

Remaining:

- Confirm every displayed image has correct license/provenance text.
- Verify all assets load offline in the build used at the venue.
- Do not imply that a reconstruction is a measured historical photograph.

### 4. Sākṣī capture and alignment — core implementation present

Present:

- Camera capture screen.
- Capture file copied from camera cache into durable document storage.
- Real observer GPS recorded rather than silently substituting the target vantage coordinate.
- Heading from location heading APIs rather than a fake magnetometer-only state.
- Pitch/roll sensor integration and safe web fallbacks.
- Pure alignment scoring with the documented weighting:

```text
0.30 × position score
+ 0.50 × heading score
+ 0.20 × pitch score
```

- Lock threshold and GPS/heading constraints.
- Honest manual “match by eye” path that does not claim a sensor lock.
- Photography lockout support for restricted/prohibited locations.
- Null error fields when a sensor is unavailable.
- Capture persistence into SQLite.
- Observation register and time-series components.

Demo status: **not proven until tested on a physical device**. Camera, GPS, compass, pitch, filesystem persistence, and permissions are device behaviors, not fully proven by unit tests.

### 5. Structured condition reports — implemented in code

Present:

- Condition category/subtype/severity structure.
- Optional note field.
- Reports linked to observations.
- Local database persistence.
- Offline queue fields.
- Mock backend report and corroboration endpoints.

Remaining:

- Test the complete path on a device: capture → condition report → save → restart app → inspect register.
- Confirm that empty notes and missing measurements remain honest.
- Verify the backend sync path with a real Supabase project if live collaboration is part of the pitch.

### 6. Quests and pilgrimage mechanics — broad implementation present, integration needs proof

Present:

- Quest seed data and generated quest data.
- Quest list, detail, task, and completion screens.
- SQLite quest tables, progress, completions, and migration support.
- Local quest provider/store.
- Tested availability, distance, time windows, riddles, stillness, pradakṣiṇā, and session/close-ritual logic in `core/`.
- Mock API quest availability and completion endpoints.
- Merit awarding and daily cap behavior.

Important distinction:

- Many `core/` modules are tested pure logic but are not necessarily wired into live device behavior throughout the app.
- A judge should not be shown an elaborate quest system unless one quest has been physically verified end to end.
- The “best single feature” candidates are stillness, a careful witness quest, or a simple arrival-to-capture flow; do not demonstrate five fragile mechanics.

Recommended demo scope: one nearby witness quest, one observation task, one completion acknowledgement, and the merit cap as a quiet integrity detail.

### 7. Merit and dāna — implemented as a local product rule

Present:

- Weighted merit rules.
- Daily cap of 200.
- Local ledger and event records.
- Balance derived from events rather than stored as an authoritative mutable number.
- Directed dāna/allocation core logic against seeded needs without moving real money.
- Practice acknowledgement UI.

Remaining:

- Decide whether dāna appears in the final demo. It is a good ethics answer but not a core visual moment.
- Keep all wording away from real-currency or payout claims.
- Verify the daily-cap behavior on a clean local database.

### 8. Dhamma engine — technically the strongest validated subsystem

Present in `core/dhamma/`:

- Bilara segment-aligned corpus loader.
- Canonical segment IDs such as `dn16:6.7` and `sn56.11:4.2`.
- Lexical and semantic-proxy retrieval with reciprocal-rank fusion.
- Domain vocabulary gate.
- Prompt-injection and impersonation gate.
- Citation validator.
- Refusal path for unsupported questions.
- Nepali query-intent handling.
- Nepali distress/self-harm override with helpline output.
- Reflection companion designed as inquiry rather than advice.
- Deterministic fallback when the provider is unavailable.
- Demo cache/offline resilience in the engine.
- Evaluation suite with 50 questions.

Current benchmark result:

| Category | Result |
|---|---:|
| Answerable | 18/18 |
| Adjacent | 9/10 |
| Out of scope | 12/12 |
| Adversarial | 6/6 |
| Nepali | 4/4 |
| Overall | 49/50 — 98% |

The mandatory gates pass:

- Adversarial refusal: 100%.
- Nepali distress safety override: passed.
- Refusal precision/recall thresholds: passed.
- Citation hit-rate threshold: passed.

### 9. Dhamma API and bilingual behavior — implemented, configuration-sensitive

The request path is:

```text
features/dhamma/AnswerScreen.tsx
  → services/dhamma/index.ts
  → POST ${EXPO_PUBLIC_API_URL}/dhamma/ask
  → mock-api/server.mjs
  → core/dhamma/engine.ts
  → Ollama Cloud, if OLLAMA_API_KEY exists
```

Current behavior:

- Expo sends `language: "ne"` by default.
- Nepali is the default answer language.
- The answer screen allows `नेपाली` and `English` toggling.
- Toggling re-requests the same question with the selected language.
- Existing browse questions also use the API path.
- Citations and source evidence remain attached to both languages.
- If the API is unreachable, the app falls back to the local small corpus.
- If the backend cannot reach Ollama, it falls back to deterministic cited RAG.

This is a layered fallback, not proof that Ollama is always being called. To claim “real AI” during the demo, the backend response must contain its provider note or the server logs must show a successful provider call, and the answer must be tested in Nepali.

Operational requirements:

- `EXPO_PUBLIC_API_URL` belongs in the Expo environment and must be a complete URL.
- Physical phone testing uses `http://<computer-LAN-IP>:8000`.
- The backend must be running and reachable from the phone.
- `OLLAMA_API_KEY` belongs only in the backend environment.
- The previously exposed Ollama key must be revoked/rotated.
- Expo must restart after any `EXPO_PUBLIC_*` change.

### 10. Mock API — broad demo backend, not production infrastructure

`mock-api/server.mjs` currently provides:

- `/health`
- sites and site details
- vantages and series
- captures
- reports and corroboration
- merit summary
- needs and allocations
- quests and completion
- `/dhamma/ask`
- `/dhamma/reflect`
- custodian acknowledgements
- Dhamma audit log
- dashboard and dashboard summary
- CSV, GeoJSON, and CRM-shaped export

The server is zero-dependency and in-memory for most mutable state. That is excellent for a controlled hackathon demo and unsuitable as the final conservation backend without durable storage, authentication, authorization, rate limiting, monitoring, and a real data model.

### 11. Supabase sync — code exists, production configuration is not complete

Present:

- Supabase client boundary.
- AsyncStorage session adapter.
- Sync functions for unsynced observations and condition reports.
- Local SQLite remains the first write.
- Settings screen exposes sync policy/status.

Not complete for a live deployment:

- `.env.local` still contains placeholder Supabase URL/key values unless the developer fills them locally.
- A real Supabase project/schema/RLS policy is not proven by this repository audit.
- Authentication/user identity is not demonstrated.
- The mock API uses `demo-user` and in-memory state.

For the hackathon, either configure and prove Supabase or clearly frame sync as a post-demo deployment lane. Do not imply that cloud persistence is live if the demo only uses SQLite or the mock server.

### 12. Settings, storage, permissions, and offline policy — implemented in code

Present:

- Preferences screen and storage-backed settings.
- Permission status screens.
- Storage/export/clear behavior.
- Sync status and retention screen.
- About/legal/provenance screen.
- Offline banner and error/loading/empty states.

Remaining:

- Test permission-denied, permission-blocked, no-location, no-heading, camera-failure, storage-full, and offline states on-device.
- Remove or hide settings that are not genuinely supported in the final demo build.

## Verification status

### Passing checks

```text
npm run typecheck       PASS
npm run test            PASS — 55/55
node --experimental-strip-types tools/run-dhamma-eval.mjs
                         PASS — 49/50, all mandatory gates green
node tools/validate-seed.mjs
                         PASS with 5 coordinate warnings
```

### Current verification failure

`npm run verify` currently reaches the vocabulary linter and exits non-zero because six occurrences of `tokens` are detected in variable names in:

- `core/dhamma/engine.ts`
- `core/dhamma/retrieval.ts`

The linter is intentionally strict because the product avoids game/engagement vocabulary. In this case the hits are implementation variable names, not user-facing product claims. Rename the variables to `terms` or add a narrowly justified allow comment, then rerun `npm run verify`.

### Seed warnings

Five sites still have coordinates marked `doc` and need verification against an authoritative source or field survey:

- Puskarini
- Marker Stone
- Vihara Remains
- Tilaurakot
- Ramagrama

These are acceptable for a prototype map if labeled honestly. They are not acceptable as survey-grade conservation coordinates.

### Test limitations

The 55 tests are primarily pure domain/unit tests. They do not prove:

- Expo Go can reach the LAN API.
- The physical phone camera works with permissions.
- The compass is calibrated.
- GPS accuracy is adequate at Lumbini.
- Android/iOS native map behavior is stable.
- A real Supabase project accepts the sync payload.
- Ollama is reachable with the current rotated key.
- All assets load in airplane mode.

## What is complete versus what is proven

| Area | Code status | Device/demo proof | Production status |
|---|---|---|---|
| Expo shell/navigation | Complete | Needs final smoke test | Prototype-ready |
| Tīrtha/site browsing | Substantial | Needs map/device smoke test | Content verification pending |
| Then/Now | Strong | Needs offline asset test | Provenance review pending |
| Capture/alignment | Implemented | Must test on physical device | Sensor/site calibration pending |
| Condition reports | Implemented | Must test persistence/restart | Durable sync/auth pending |
| Quests | Broad local implementation | One quest must be proven | Full live integration pending |
| Merit | Implemented/tested | Needs clean-device demo | Product ethics okay; cloud ledger pending |
| Dhamma retrieval/gates | Strong and benchmarked | Needs live Nepali phone test | Provider/deployment hardening pending |
| Dhamma Ollama synthesis | Implemented behind env key | Must show real Nepali response | Key rotation, monitoring, limits pending |
| Bilingual UI | Implemented | Must test toggle on device | Translation QA/content expansion pending |
| Mock API | Broad and demo-useful | LAN test required | Not production backend |
| Supabase sync | Code exists | Not proven | Project/RLS/auth setup pending |
| Dashboard/export | Mock endpoints exist | Needs endpoint demo decision | Durable analytics pending |
| EAS build | Configuration exists | Build/install proof pending | Store submission not complete |

## What is left to build

### P0 — Must finish before a judge sees it

1. **Device smoke test.** Test the exact demo build on the exact phone.
2. **Dhamma production path.** Use a rotated Ollama key only on the backend, verify `/health`, `/dhamma/ask`, Nepali output, English toggle, citations, refusal, and fallback.
3. **Network reliability.** Prefer a deployed HTTPS backend for judging. LAN testing is useful but fragile because of Wi-Fi isolation, firewall rules, changing IPs, and laptop sleep.
4. **One complete conservation loop.** Site → arrival → vantage → alignment/manual honesty → photo → condition report → local register.
5. **Offline fallback.** Prove the core demo still works with the network disabled and clearly label what is local versus cloud-generated.
6. **Fix `npm run verify`.** Rename the six banned variable-name occurrences and rerun all gates.
7. **Freeze the demo path.** Remove accidental navigation branches and ensure the judge can recover from every failure.

### P1 — Strongly improves hackathon credibility

1. Verify the five coordinate warnings or display a clear “approximate/documentary coordinate” label.
2. Configure a real Supabase project if cloud sync is part of the pitch.
3. Add a tiny API smoke-test script that checks health, Dhamma answer, refusal, language, and citation shape.
4. Add a visible Dhamma status/debug screen for development only: backend reachable, provider generation versus deterministic fallback, latency, and citation count.
5. Test Android and web separately because map implementations differ.
6. Verify all asset licenses and make the provenance path easy to explain.
7. Record a backup demo video or capture screenshots in case venue Wi-Fi fails.

### P2 — Defer unless the core demo is completely stable

- Full production authentication and role management.
- Durable custodian dashboard.
- Real public API and database migrations.
- More languages beyond Nepali and English.
- Image understanding or voice input.
- Full markerless AR/3D reconstruction.
- Expanded quests and sensor-driven pilgrimage mechanics.
- Public moderation and anti-abuse operations.
- Store release and long-term operations.

## Recommended hackathon demo

### Six-minute script

#### 0:00–0:40 — Problem and thesis

“Lumbini is visited by many people, but most visits disappear as memory. Sākṣī turns attention into a repeatable conservation record.”

Show the three surfaces briefly. State that this is not a generic chatbot, a points app, or a sightseeing brochure.

#### 0:40–1:40 — Tīrtha and Then/Now

1. Open the map.
2. Select Ashokan Pillar or Puskarini.
3. Show the site fact and historical/modern image pair.
4. Point out the evidence-tier label and honest limitations.

This gives the judge immediate place, history, and evidence context.

#### 1:40–3:20 — Sākṣī witness loop

1. Open a vantage.
2. Show the reticle and alignment state.
3. If conditions are good, demonstrate sensor lock.
4. If the venue is bad, use “Match by eye” and explicitly say that it does not claim a measurement.
5. Capture the photo.
6. Add one structured condition report.
7. Open the register/time-series view.

The key line: “The app records what was measured, what was observed, and what was not available.”

#### 3:20–4:50 — Nepali-first Dhamma

Ask:

```text
बुद्धका अन्तिम शब्दहरू के थिए?
```

Show Nepali response and `[dn16:6.7]`. Toggle English. Ask an unsupported question and show refusal. Ask an adversarial impersonation question and show refusal.

The key line: “The model is allowed to synthesize only over retrieved canonical passages; when the evidence is not there, refusal is the answer.”

#### 4:50–5:30 — Merit and ethics

Show the practice acknowledgement or merit summary. Mention the daily cap and non-transferable design only if the screen is stable.

#### 5:30–6:00 — Close

“The output is not one more feed. It is a chain: place, witness, evidence, source, and responsible return.”

## Backup demo order

If the network, GPS, or camera fails:

1. Use the local Then/Now assets.
2. Use the pre-seeded Dhamma questions and deterministic fallback.
3. Use the local site and quest content.
4. Use a prepared capture from the device only if the UI clearly labels it as a demonstration record.
5. Never pretend that a failed sensor produced a valid lock.

## Exact pre-demo checklist

### Repository and build

- [ ] `git status` is clean.
- [ ] `main` and `Aaditya` are synchronized.
- [ ] `npm run verify` passes without known failures.
- [ ] `npx expo start -c` starts cleanly.
- [ ] A development/preview build is installed on the demo phone.
- [ ] The demo commit is tagged or recorded.

### Backend

- [ ] Ollama key has been rotated after the previous exposure.
- [ ] `OLLAMA_API_KEY` is set only on the backend.
- [ ] Backend starts with the TypeScript strip flag.
- [ ] `/health` works.
- [ ] `/dhamma/ask` returns a grounded response.
- [ ] Nepali response is actually generated, not an English fallback.
- [ ] English toggle works.
- [ ] Refusal and adversarial checks work.
- [ ] Backend is HTTPS/public or the LAN is proven stable.
- [ ] API timeout/fallback behavior is intentional and tested.

### Phone

- [ ] Phone has a charged battery and power bank.
- [ ] Correct app build is installed.
- [ ] Camera permission is granted.
- [ ] Location permission is granted.
- [ ] Motion/heading permission is granted where applicable.
- [ ] Compass is calibrated.
- [ ] Photo capture saves after app restart.
- [ ] App can reach the backend from the phone browser.
- [ ] Airplane-mode/local fallback path has been rehearsed.
- [ ] Notifications and unrelated apps are silenced.

### Content and pitch

- [ ] Hero site and hero question are decided.
- [ ] All displayed licenses/provenance are defensible.
- [ ] Approximate coordinates are not presented as survey-grade.
- [ ] Team members use the same vocabulary: witness, evidence, source, refusal, merit.
- [ ] No one claims the model speaks as the Buddha.
- [ ] No one claims the app is production conservation infrastructure.
- [ ] Every judge question has a short honest answer.

## Architecture and operational risks

### Highest risk: local-network demo dependency

The current Expo setup can call a LAN IP, but a physical-phone demo depends on Wi-Fi routing and firewall behavior. A deployed HTTPS backend is safer for judging. Keep the LAN path as a development fallback, not the only plan.

### High risk: confusing fallback with real AI

The app intentionally hides provider failure behind deterministic retrieval. This prevents crashes but can make it unclear whether Ollama is active. Add a development-only status indicator or verify server logs before the demo.

### High risk: stale credentials

The Ollama credential was previously present in project material. It must be revoked and replaced. Never place the replacement in an Expo-public environment variable.

### Medium risk: documentation drift

`README.md` still describes the project as an initial architecture and says Dhamma is demo/local in older wording. `HANDOFF-PHASE-8-9.md` contains historical counts, old branch instructions, and deferred-work notes that no longer exactly match the current branch. This report is the current status reference; update the older documents or label them historical.

### Medium risk: mock backend scope

The mock server is excellent for demonstrating contracts, but its state resets on restart and its user is `demo-user`. It cannot be described as a production multi-user backend.

### Medium risk: coordinates and provenance

Five coordinate records are still documentary approximations. Historical and reconstructed assets need source/licensing explanations in the demo.

### Medium risk: sensor variance

A compass, GPS, camera, and motion sensor can fail or behave differently across devices. The manual path is an integrity feature and should be part of the rehearsed fallback.

## Recommended order from now

### Day 1: make the core demo boringly reliable

1. Fix the vocabulary lint failures.
2. Decide the hero route and remove anything not used by it from the demo.
3. Deploy or stabilize the backend.
4. Rotate/configure the Ollama key.
5. Test Nepali and English Dhamma responses from web and physical phone.
6. Test the conservation loop on the actual phone.
7. Capture evidence of successful runs and timings.

### Day 2: harden and explain

1. Verify coordinates/provenance for the displayed hero content.
2. Test offline fallback.
3. Test failure states.
4. Prepare slides and six-minute script.
5. Record a backup video.
6. Run the full verify gate.
7. Push a final tagged commit and do not add new features after the freeze.

## Definition of hackathon success

Sākṣī does not need every planned feature to win. It needs one coherent, credible story with a working proof:

1. A real Lumbini place is visible.
2. The visitor can compare then and now without misleading reconstruction claims.
3. A witness record can be created with honest measurement state.
4. A structured condition observation persists locally.
5. A Nepali-first Dhamma question returns a concise, cited answer.
6. English toggle works.
7. Unsupported and impersonation questions refuse.
8. The app continues safely when network or sensors fail.
9. The team can explain what is implemented, what is simulated, and what is planned.

That combination is more persuasive than a large number of unproven screens.

## Final status statement

The repository is beyond skeleton stage and contains a credible, technically differentiated MVP. The Dhamma engine is the most objectively validated component; the Then/Now evidence experience is the strongest visual hook; and the Sākṣī capture loop is the product’s most important real-world proof.

The project is not yet fully production-ready, fully cloud-backed, survey-grade, or device-verified. The remaining work is concentrated and manageable: prove the core loop on hardware, make the AI path visibly real and Nepali-first, clean the verification gate, stabilize deployment, and rehearse a disciplined story.

**Recommended next action:** freeze new feature development and complete the P0 checklist above on the final presentation device.

## Post-audit synchronization update

After the main audit, the remote `main` branch received and was merged into both synchronized branches. The final repository commit is now `21df471` on `main`, `Aaditya`, `origin/main`, and `origin/Aaditya`.

At the time of this post-merge audit, the synchronized application code was at `21df471`; the report update itself may be a later documentation commit. The merged work adds or improves:

- Back navigation and map-hang fixes.
- Narration audio wiring.
- Alignment rehearsal during onboarding.
- Quest evidence capture and second-opinion review flow.
- Related onboarding, quest, database, and map integration changes.

The final post-merge verification has this status:

| Check | Result |
|---|---|
| Core tests | PASS — 55/55 |
| Seed validation | PASS — 5 documentary-coordinate warnings |
| Dhamma evaluation | PASS — 49/50, mandatory gates green |
| TypeScript | FAIL — new route typing issue plus missing `expo-image-picker` dependency |
| Vocabulary lint | FAIL — 6 existing `tokens` variable-name hits |

The two TypeScript errors are:

1. `features/onboarding/steps.ts` references `/onboarding/align`, but the generated Expo typed-route declaration has not been regenerated or does not include the new route. Restart Expo with `npx expo start -c`, regenerate/refresh `.expo` route types, and rerun typecheck.
2. `features/quests/components/TaskEvidenceSheet.tsx` imports `expo-image-picker`, but that package is not currently present in `package.json`/installed dependencies. Add it with the Expo-SDK-compatible version using `npx expo install expo-image-picker`, then rerun `npm install`, typecheck, and the full verification gate.

Do not call the final repository “fully green” until these two TypeScript issues and the six vocabulary lint hits are resolved. After fixing them, rerun:

```powershell
npx expo start -c
npm run verify
```

Then commit the dependency/type fixes and synchronize `main` and `Aaditya` again.

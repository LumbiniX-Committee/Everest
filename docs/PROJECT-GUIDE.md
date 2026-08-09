# Sākṣī — The Complete Project Guide

*A plain-language explanation of everything in this project: what it is, why it
exists, how every part works, and how the pieces fit together. Start at the top
and read down — it goes from fundamentals to the sophisticated parts.*

*Last updated: 2026-08-09.*

---

## Table of contents

1. [The one-sentence idea](#1-the-one-sentence-idea)
2. [The soul of the project: honesty over engagement](#2-the-soul-of-the-project-honesty-over-engagement)
3. [The three surfaces](#3-the-three-surfaces)
4. [How to run it](#4-how-to-run-it)
5. [The technology, explained simply](#5-the-technology-explained-simply)
6. [How the code is organised](#6-how-the-code-is-organised)
7. [The data pipeline: from JSON to screen](#7-the-data-pipeline-from-json-to-screen)
8. [The database: what is stored and why](#8-the-database-what-is-stored-and-why)
9. [Deep dive — Sākṣī (the witness loop)](#9-deep-dive--sākṣī-the-witness-loop)
10. [Deep dive — the damage detector (on-device AI vision)](#10-deep-dive--the-damage-detector-on-device-ai-vision)
11. [Deep dive — Tīrtha (place, map, then/now)](#11-deep-dive--tīrtha-place-map-thennow)
12. [Deep dive — Dhamma (the grounded AI)](#12-deep-dive--dhamma-the-grounded-ai)
13. [Merit, and the leaderboard tension](#13-merit-and-the-leaderboard-tension)
14. [Quests and pilgrimage mechanics](#14-quests-and-pilgrimage-mechanics)
15. [Voice and multilingual](#15-voice-and-multilingual)
16. [The backend: mock API and Supabase](#16-the-backend-mock-api-and-supabase)
17. [The verification gate: how we keep it honest and working](#17-the-verification-gate-how-we-keep-it-honest-and-working)
18. [Current status: built vs proven vs planned](#18-current-status-built-vs-proven-vs-planned)
19. [Glossary](#19-glossary)

---

## 1. The one-sentence idea

**Sākṣī turns a visitor's attention into conservation evidence.**

*Sākṣī* (साक्षी) is Sanskrit/Pali for **witness** — one who sees something
directly and can testify to it. The app takes the name literally:

> You go to a heritage site in Lumbini, walk to a **fixed photographic
> viewpoint** (a "vantage"), align your phone to that exact viewpoint, and record
> what the place looks like **today**. Do that again next month, next year, and
> the photographs line up into a **time-series** — visible, comparable evidence
> of how a place is changing, gathered by the ordinary people standing in front
> of it.

That is the whole product in one image: two photographs of the same spot, taken
from the same point, that you can fade between and *see the difference*.

Everything else — the map, the history, the AI, the quests — exists to **produce,
describe, or motivate that single irreplaceable thing**: a photograph taken from
a known point on a known day.

**Lumbini** is the birthplace of the Buddha, a UNESCO World Heritage Site in
Nepal. This is a **hackathon project** (LumbiniX 2026) built by the
`LumbiniX-Committee/Everest` team.

---

## 2. The soul of the project: honesty over engagement

Before any feature, understand this — it explains ninety percent of the design
decisions, and it is what makes the project distinctive.

Most apps optimise for **engagement**: keep you tapping, coming back, competing.
Sākṣī deliberately does the opposite. Its product is **evidence**, and evidence
is only worth anything if it is **true**. So the project holds a set of
non-negotiable rules — think of them as a constitution. They are enforced not
just by intention but by code and automated checks.

**The honesty invariants (the "charter"):**

- **A measurement is never faked.** If the GPS didn't get a fix, the app records
  `null` (unknown) — never `0`, because `0` would read as "perfectly accurate".
- **"By eye" never masquerades as "measured".** If you frame a shot by eye
  instead of getting a sensor-verified alignment lock, the record says so
  (`gate_mode: 'manual'`), and it is visually and textually distinct.
- **The AI offers candidates, never verdicts.** The damage detector suggests;
  the human confirms. The Dhamma engine answers only from cited sources and
  **refuses** when it can't.
- **Nothing is deleted.** An observation is evidence. A mistake is corrected by
  *adding* a new record, never by erasing the old one.
- **No gamification vocabulary.** Words like *streak, XP, level, badge, reward,
  leaderboard-as-points* are banned in content — there is even an automated
  linter that fails the build if they appear (see §17). Merit is *puṇya*
  (spiritual merit), which has no score and cannot be spent or transferred.
- **The device is the source of truth; the network is a copy.** A phone in the
  Sacred Garden has no signal for hours. Writes land locally first, always.

Whenever you wonder "why is it built this way?", the answer is usually one of
these rules.

---

## 3. The three surfaces

The app has **exactly three destinations**. This is deliberate — they are the
*conceptual model* of the product, not just navigation tabs. There is no Home,
Explore, Profile, or Rewards tab. Adding one is supposed to require a hard
decision.

| Surface | Sanskrit meaning | What you do there |
|---|---|---|
| **Tīrtha** | *a sacred crossing / pilgrimage place* | Explore Lumbini: a map of heritage sites, site details, history, and the "then/now" photo comparison. |
| **Sākṣī** | *witness* | The core loop: pick a vantage, align, capture a photo, record its condition. |
| **Dhamma** | *the teaching / the truth* | Ask questions and get **source-backed** answers from the Buddhist canon — or an honest refusal. |

```
                         ┌─────────────────────────┐
                         │        Sākṣī app        │
                         └────────────┬────────────┘
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
        ┌──────────┐            ┌──────────┐            ┌──────────┐
        │  Tīrtha  │            │  Sākṣī   │            │  Dhamma  │
        │  place   │            │ witness  │            │knowledge │
        ├──────────┤            ├──────────┤            ├──────────┤
        │ map      │            │ vantage  │            │ ask      │
        │ sites    │            │ align    │            │ retrieve │
        │ then/now │            │ capture  │            │ cite     │
        │ quests   │            │ condition│            │ refuse   │
        │ arrivals │            │ register │            │ reflect  │
        └──────────┘            └──────────┘            └──────────┘
```

---

## 4. How to run it

```bash
npm install                     # install dependencies (also applies patches, see §10)
cp .env.example .env.local      # then fill in Supabase + API values
npx expo start                  # start the Metro bundler
```

Then press `a` (Android) or `i` (iOS), or scan the QR code with **Expo Go**.

**Important caveat:** some features need real hardware and a **development build**
(not Expo Go), because they use *native modules* Expo Go doesn't include:

- Camera, GPS, compass, motion sensors → need a physical device.
- The **map** (MapLibre) and the **damage detector** (onnxruntime) → need a
  *dev build* (`eas build --profile development`), because they are native code.

Everything else (UI, then/now, Dhamma over the API, database) runs in Expo Go.

**The one command that proves the code is healthy:**

```bash
npm run verify
```

This runs typecheck + tests + seed validation + vocabulary lint + Dhamma
evaluation. See §17 for what each does.

---

## 5. The technology, explained simply

If you're newer to this stack, here's what each piece is and why it's here.

| Technology | What it is, in one line | Why we use it |
|---|---|---|
| **React Native** | Write an app in JavaScript/TypeScript that runs as a real native iOS & Android app. | One codebase, two platforms. |
| **Expo (SDK 57)** | A toolkit on top of React Native that handles building, native modules, and device APIs (camera, GPS…). | Removes most native-build pain. |
| **Expo Router** | File-based navigation: a file at `app/(main)/tirtha/map.tsx` *is* the `/tirtha/map` screen. | The folder structure *is* the app map. |
| **TypeScript** | JavaScript with types, so mistakes are caught before running. | Safety; `npm run typecheck` is a gate. |
| **expo-sqlite** | A real SQL database that lives *on the phone*. | Offline-first record storage. |
| **expo-camera / expo-location / expo-sensors** | Device APIs for the camera, GPS, and compass/motion. | The "instrument" that makes a witness record. |
| **MapLibre** | An open-source map renderer (like Mapbox). | The Lumbini map. Native → dev build only. |
| **onnxruntime-react-native** | Runs a trained AI model *on the phone*, offline. | The crack/damage detector (§10). |
| **Supabase** | Hosted Postgres database + auth + file storage. | The cloud copy that observations sync to. |
| **Ollama Cloud** | Runs a large language model in the cloud. | Dhamma answer synthesis (§12). |

**The New Architecture** is turned on (React Native's modern rendering/native
bridge system). It's required by the AI vision module.

---

## 6. How the code is organised

The repository is large (~37,000 lines of TypeScript). Here is the map, with a
plain description of each folder's job.

```
app/          The route tree. Thin files — each just reads params and renders a
              feature screen. This folder IS the navigation map of the app.

features/     The actual screen implementations, grouped by surface
              (features/sakshi, features/tirtha, features/dhamma, …).

components/   Reusable UI. components/ui is the primitive layer (Button, Card,
              Text) — nothing outside it is allowed to name a raw colour or font.

core/         Pure logic with NO device dependencies: alignment scoring, merit
              rules, the Dhamma AI engine, the vision decoder, geofencing.
              This is the "brain" and it is heavily unit-tested.

services/     The boundaries to the outside world: camera, location, sensors,
              the SQLite database, Supabase sync, the AI runtimes.

hooks/        Composed React behaviour: useAlignment, useHeading, usePosition.

store/        App-wide state (first-launch, permissions, preferences, quests).

data/         Content the app ships with. data/generated/ is built from seed/.
              data/index.ts is the single switch between demo and generated data.

seed/         The SOURCE OF TRUTH for content, as human-editable JSON
              (sites, vantages, quests, plates, history, narration…).

tools/        Build + check scripts (gen-data, run-tests, validate-seed,
              lint-vocab, dhamma-eval).

shared/       Pure helpers shared between app and core (geodesy math).

types/        TypeScript type definitions for the domain (a Site, an Observation…).

theme/        Design tokens: colours, typography, spacing, radii.

assets/       Images, fonts, audio narration, and the AI model file.

supabase/     SQL migrations for the cloud database.

mock-api/     A zero-dependency fake backend for demos.

docs/         Architecture and planning documents (this file lives here).
```

**The golden rule of the layering:** `core/` never imports from `app/`,
`features/`, or `services/`. It is pure and portable, which is exactly why it can
be tested without a phone. Dependencies point *inward*: screens use services and
core; core uses nothing from above it.

---

## 7. The data pipeline: from JSON to screen

The content you see (12 sites, their coordinates, history, quests) is not
hard-coded in screens. It flows through a **build-time pipeline**:

```
seed/*.json                 You edit these. Human-readable JSON.
     │                      (sites.json, vantages.json, quests.json, plates.json,
     │                       history.json, narration.json, timeline.json, …)
     ▼
tools/gen-data.mjs          A build script reads the seed, validates it, and
     │                      generates typed TypeScript.
     ▼
data/generated/*.ts         Machine-generated. Never edited by hand.
     │
     ▼
data/index.ts               The single adapter. One line here decides whether
     │                      the app reads generated or demo data.
     ▼
feature screens             import { findSite, demoSites } from '@/data'
```

**Why generate code instead of just loading JSON at runtime?** Because of the
images and audio. React Native's bundler (Metro) can only bundle a file if it
sees a literal `require('./path')` in the code — you cannot write
`require(someVariable)`. The generator writes those literal `require()` calls for
every historical plate and every narration clip, so they get bundled correctly
and work **offline**. It also lets `tools/validate-seed.mjs` act as a permanent
quality gate (checking coordinates, evidence tiers, and that every referenced
image actually exists on disk).

**Run it with:** `npm run gen`. Validation runs inside `npm run verify`.

---

## 8. The database: what is stored and why

Sākṣī is **offline-first**. Every write goes to a **SQLite database on the phone
first**, and only later syncs to the cloud. The network is treated as an
optimisation, never as the truth. (Full detail: `docs/DATA-ARCHITECTURE.md`.)

### Three classes of data

Almost every design question ("should this sync? who owns it? does it survive a
reinstall?") is answered by which class a piece of data belongs to:

| Class | Who makes it | Where it lives | Survives reinstall? | Examples |
|---|---|---|---|---|
| **Reference** | us, in advance | shipped in the app | reshipped | sites, vantages, quests, plates |
| **Record** | the person, on site | device → cloud | **must** | observations, condition reports |
| **Personal** | the person, incidentally | device only | not yet | merit, quest progress, visits |

### The eight local tables

Migrations are **append-only**: the position of a migration in the array *is* the
schema version, and an existing migration is never edited (that would corrupt
phones already on that version). New columns are added as new entries at the end.

| Table | Class | Syncs to cloud? |
|---|---|---|
| `observations` | record | yes (all 15 columns) |
| `condition_reports` | record | yes (includes `ai_assisted`, see §10) |
| `quest_submissions` | record | yes |
| `merit_events` | personal | **no, by design** |
| `site_visits` | personal | no |
| `quest_progress` | personal | no |
| `quest_completions` | personal | no |
| `quests` | reference | seeded locally |

### The honesty in the schema

The database enforces the honesty invariants at the column level. The clearest
example is `gate_mode`:

- `gate_mode = 'aligned'` → the alignment gate passed; the error columns are real
  measurements.
- `gate_mode = 'manual'` → framed by eye; the error columns are **not** claims of
  accuracy.
- `gate_mode = null` → unknown; read with the same caution as `manual`.

The cloud database has a constraint that says: *a row claiming `aligned` must
carry the measurements that claim rests on.* You cannot store a "measured"
observation without the measurements. The honesty is not a convention — it's a
rule the database refuses to break.

---

## 9. Deep dive — Sākṣī (the witness loop)

This is the heart of the product. The flow is:

```
pick a site  →  pick a vantage  →  align the phone  →  capture  →  record condition  →  register
```

### Alignment — turning a phone into a survey instrument

A "vantage" is a fixed viewpoint with a known **position** (GPS), **bearing**
(compass direction), and **pitch** (up/down tilt). To make a photo comparable to
last year's from the same vantage, you must stand in the same place and point the
phone the same way. The app guides you there with a **reticle** (an on-screen
alignment target) and computes a single **alignment score**:

```
align = 0.30 × position_score
      + 0.50 × heading_score      ← heading matters most: face the wrong way and the photo is worthless
      + 0.20 × pitch_score
```

You get a **lock** (the honest, sensor-verified state) only when:

```
align ≥ 0.75   AND   gps_accuracy ≤ 15 metres   AND   heading_score ≥ 0.5
```

That last condition is a **hard floor**: you can never lock while facing the
wrong way, even with a perfect GPS fix. The scoring is pure logic in
`core/alignment/score.ts`, so it's unit-tested without needing a phone.

### The honest escape hatch: "Match by eye"

Sometimes conditions are bad — poor GPS, magnetic interference. Rather than block
the person, the app offers **"Match by eye"**. But it is scrupulously honest:

- It records `gate_mode: 'manual'`, **never** a fake lock.
- It stores the *actually measured* score (or `null`), never `1.0`.
- Its reticle is a **dashed sand-coloured** hatch — it never shows the blue
  "lock" colour, because colouring an eyeballed frame as locked would be the same
  lie as faking the measurement.
- The observation screen labels it "Framed by eye — not within measured
  tolerance", so no one mistakes it for a survey-grade frame.

### Capture integrity

When you press the shutter (`features/sakshi/CaptureScreen.tsx`):

1. The photo is **copied out of the camera's temporary cache** into durable
   storage immediately — otherwise the OS could delete the file and leave a
   record pointing at nothing.
2. It records **your actual GPS fix**, not the vantage's catalogued coordinate
   (which would falsely claim you stood exactly on the survey point).
3. Missing signals are stored as `null`, never `0`.
4. In photography-restricted sites, the camera **won't even open** — with an
   explanation (a charter rule).

### Condition reports

After capturing, you can attach a structured **condition report**: what you
noticed about the site's state (a crack, moss, water damage, litter…). It's
deliberately simple — a visitor is not a conservator:

- **Category** (8 coarse buckets: biology, structural, water, surface, human
  impact, encroachment, environment, management)
- **Subtype** (plain-language: "New crack", "Moss or algae"…)
- **Severity** (only three levels — "Worth noting / Concerning / Needs attention
  soon" — because a visitor cannot calibrate a 10-point scale honestly)
- **Note** (optional, their own words)

---

## 10. Deep dive — the damage detector (on-device AI vision)

*This is the newest sophisticated feature (built 2026-08). It is the app's AI
that looks at a captured photo and suggests damage.*

### The story

The app originally had a **fake** damage detector: it hashed the photo's
*filename* into invented boxes, made-up confidence scores, and a fake "surface
integrity %". That was the deepest possible violation of the project's honesty
thesis — so it was removed and replaced with a **real** one.

### What it does now

A real **YOLOv8n** object-detection model, trained to find **cracks**, runs
**entirely on the phone** (no internet needed) against a captured photograph and
offers **candidates** the surveyor confirms.

- **Real accuracy, reported honestly:** the model reports its true **mAP50 of
  0.8167** (an 82% score on a standard accuracy metric) — shown in the UI, never
  rounded up.
- **Candidates, not verdicts:** the boxes are drawn **dashed**, and the card
  reads "Candidates for you to verify — not a conservator's assessment."
- **The AI fills *what*, the human decides *how urgent*:** it pre-fills the
  category and kind; the person always sets the severity.
- **Provenance is recorded:** a confirmed-from-AI report is stored with
  `ai_assisted = 1`, so a later reader can weigh assisted findings differently.
- **The feature is invisible if the model or runtime is absent** — honest by
  omission, and it never crashes the app.

### How it works (the pipeline)

An AI vision model doesn't take a photo and return boxes directly. There are
several steps, and this project splits them into **pure, testable logic** (in
`core/vision/`) and the **device glue** (in `services/ai/`):

```
photo (any size)
   │
   ▼  services/ai/onnx.ts  +  core/vision/letterbox.ts
resize & "letterbox" to 640×640 (preserve aspect ratio, pad with grey)
   │
   ▼  decode the JPEG into raw pixels, pack into a number grid the model expects
run the model  (onnxruntime-react-native, native, on-device)
   │
   ▼  core/vision/yolo.ts
decode the raw output tensor → candidate boxes + scores
   │
   ▼  NMS (non-max suppression): remove duplicate overlapping boxes
   │
   ▼  core/vision/letterbox.ts
map boxes back to the original photo's coordinates
   │
   ▼  yoloEngine.ts → UI
dashed candidate boxes + honest summary → optional one-tap condition pre-fill
```

The geometry and decoding — the parts most likely to be subtly wrong — live in
`core/vision/` and are covered by **12 unit tests**, so they're verified without a
device. The one file that touches the native runtime is `services/ai/onnx.ts`;
swapping to a different AI runtime later would only touch that one file.

### The training notebook

The model was trained on Google Colab (free GPU) using
`docs/train-crack-seg.ipynb` — a ready-to-run notebook that downloads a public
4,000-image crack dataset, trains YOLOv8, prints the honest mAP50, and exports
the `.onnx` model file. Reproducing or improving the model is a documented,
repeatable process (see `docs/DAMAGE-MODEL.md`).

### A real-world gotcha we hit and fixed

The AI runtime (`onnxruntime-react-native`) had a **bug**: its Android build
script referenced `VersionNumber`, a Gradle class that **Gradle 8 removed**, so
the app failed to compile. We fixed it with **`patch-package`** — a tool that
records a small patch to the dependency and re-applies it automatically on every
install (including on the cloud build server). The patch lives in
`patches/onnxruntime-react-native+1.24.3.patch`.

**To activate the detector on a phone:** build a dev client
(`eas build --profile development --platform android`) — the deps are installed
and the model is committed; the UI lights up automatically once the native
runtime is present.

---

## 11. Deep dive — Tīrtha (place, map, then/now)

Tīrtha is the "place" layer — where you explore Lumbini.

### The map

An interactive map of Lumbini showing the 12 heritage sites, styled by their
importance tier, with geofence rings and your live position. It has two
implementations behind a feature flag:

- A **schematic site-plan** (pure JavaScript, works everywhere including Expo Go)
- A full **MapLibre** map (native, needs a dev build, aims for real offline map
  tiles).

### Then/Now — the visual hook

This is the feature that communicates the whole product in one gesture. You pick
a site, and you see a **historical photograph** and a **modern photograph** of
the same spot, and you **fade (dissolve) between them** to see what changed.

- Real licensed historical plates (e.g., of the Ashokan Pillar, the Puskarini
  pond) are bundled with the app.
- Every image carries an **evidence-tier label** — a charter requirement — so a
  viewer always knows whether they're looking at a genuine historical photograph,
  a documented reconstruction, or a modern capture. **A reconstruction is never
  presented as a measured historical photograph.**
- Where an honest image pair can't be assembled, the app shows an honest empty
  state rather than a misleading placeholder.

### Arrivals and wisdom tiers

When you reach a site (physically, via geofence, or by opening it), the app can
tell you what the place holds. **How much it says is a user setting** — the
"wisdom tier" (`core/wisdom/index.ts`):

- `basic` — just the essentials.
- richer tiers add history and scriptural context.
- `custom` — you type your own question about the place ("Ask this place"), which
  routes to the Dhamma engine.

The policy lives in `core/` because two surfaces must agree on it: the site page
you open *deliberately*, and the notification that arrives *unasked* when you
cross a geofence. If they disagreed, someone who chose `basic` could get a
scriptural push notification — exactly the intrusion the setting exists to
prevent.

---

## 12. Deep dive — Dhamma (the grounded AI)

Dhamma is the knowledge layer, and it is the **most technically validated
subsystem** in the project. It answers questions about Buddhist teaching — but
under strict rules that make it trustworthy.

### The core principle: cite or refuse

A normal chatbot will happily make things up ("hallucinate"). Dhamma **cannot**.
It uses **RAG (Retrieval-Augmented Generation)**:

```
your question
   │
   ▼  safety + language detection (Nepali distress → helpline, immediately)
   │
   ▼  grounding gate: is this even a question the canon can answer?  (else refuse)
   │
   ▼  hybrid retrieval: find the most relevant canonical passages
   │     (lexical search + semantic search, fused with "reciprocal rank fusion")
   │
   ▼  synthesis: an LLM (Ollama Cloud) writes an answer USING ONLY those passages
   │
   ▼  citation validation: every claim must map to a real passage ID
   │     (e.g., [dn16:6.7] = Dīgha Nikāya, sutta 16, segment 6.7)
   │
   ▼  answer + citations   OR   deterministic cited fallback if the LLM is down
```

If the retrieved evidence doesn't support an answer, the honest output is a
**refusal**, not a guess. The corpus is a **deliberately narrow** set of
canonical (Bilara-aligned) Buddhist texts — quality over coverage.

### The guardrails

- **No impersonation.** It will refuse to "speak as the Buddha".
- **Prompt-injection resistant.** Attempts to trick it into ignoring its rules
  are caught by an adversarial gate.
- **Nepali-first.** Nepali is the default answer language, with an English
  toggle. Citations, source IDs, and Pali text are **never machine-translated**.
- **Reflection, not advice.** For personal questions it offers inquiry ("what
  might you notice…"), not life advice.

### How good is it?

There's a 50-question benchmark (`npm run eval:dhamma`) covering answerable,
out-of-scope, adversarial, and Nepali questions. It scores **~49/50 (98%)** with
all mandatory safety gates passing (100% adversarial refusal, Nepali distress
override, citation-hit thresholds).

### Offline capability

If there's no network, it degrades gracefully: the local canonical corpus and
deterministic retrieval **always work**; an optional small on-device model
(Qwen3-0.6B) can be downloaded to synthesise short answers offline. If the model
is missing, the deterministic corpus remains the source of truth — the offline
model may only rephrase retrieved passages, never invent facts or citations.
(Full plan: `docs/MULTILINGUAL-AI-PLAN.md`.)

---

## 13. Merit, and the leaderboard tension

### Puṇya (merit)

When you contribute (record an observation, complete a quest), you earn **puṇya**
— spiritual merit. But it is deliberately **not** game points:

- It has **no total you can spend**. Your balance is computed as `SUM(amount)`
  from an append-only ledger — never stored as a mutable number.
- It is **capped at 200 per day**. Once you hit the cap, further acts are still
  recorded (with `amount = 0`) — because the act happened; only the merit was
  capped. Suppressing the record would make an append-only ledger lie.
- It is **non-transferable**. No spending, no trading, no cash-out language.

Weights live in `core/merit/rules.ts` and are unit-tested.

### The leaderboard — an honest exception, recorded plainly

Later, a **leaderboard** feature was added (accessible as "Guardians"). This is
worth understanding because it is a **genuine tension** with the original charter,
and the project documents it honestly rather than hiding it:

- The charter originally **refused ranking**. The leaderboard reverses that: the
  app now ranks people.
- **But it does not rank puṇya.** Merit stays on the device, unranked, untouched.
- The board ranks **contribution to the shared record** — points computed *on the
  server* from evidence that already syncs (observations, condition reports,
  quest submissions).
- This design has an integrity payoff: because the score is derived from uploaded
  evidence rather than sent by the app, **you can't fake it** — inflating your
  rank requires actually doing the work. A client-reported score is a number the
  client chose; a server-derived one must be earned.

(See `docs/DATA-ARCHITECTURE.md` §5 and `supabase/migrations/0008_leaderboard.sql`.)

---

## 14. Quests and pilgrimage mechanics

Quests are a **restrained** layer that guides meaningful visits (not a points
grind). The pure logic in `core/quests/` and `core/session/` is tested and
includes:

- **Availability** by proximity and time-window (e.g., a "first light" quest only
  available at dawn, on site).
- **Verified completion** — you can't complete "Capture the East Approach
  Vantage" from your sofa; it checks you were actually there.
- **Stillness**, **pradakṣiṇā** (ritual circumambulation), **riddles**, and a
  **close ritual** — contemplative mechanics rather than addictive ones.

A key honesty point (from the status audit): many `core/` quest modules are
**tested pure logic** but the recommendation for a demo is to prove **one** quest
end-to-end on a real device rather than show five fragile mechanics.

---

## 15. Voice and multilingual

- **Four independent language settings**: UI language, input language, output
  language, and source (corpus) language. Initially English + Nepali, extensible.
- **Voice** uses the system's on-device speech recognition and `expo-speech` for
  text-to-speech, with a typed fallback where a language pack is missing. No
  custom voice model ships in the first release.
- (There is a `14-VOICE-FEATURES.md` planning doc at the repo root for the voice
  roadmap.)

---

## 16. The backend: mock API and Supabase

There are **two** backend stories:

### Mock API (`mock-api/server.mjs`)

A **zero-dependency, in-memory** fake backend for demos. It implements every
endpoint the app calls (sites, captures, reports, merit, quests, `/dhamma/ask`,
exports, a custodian dashboard…). Run it with `npm run api`. It's perfect for a
controlled demo and explicitly **not** a production backend (state resets on
restart, single `demo-user`).

### Supabase (the real cloud)

The production-facing path: hosted Postgres + auth + private file storage for
photographs. The sync layer writes local SQLite records up to Supabase.

- Uses **anonymous sessions** so someone standing at a temple doesn't have to
  make an account before recording — the account exists to *own rows*, not to
  identify a person.
- **Row-Level Security (RLS)** is author-scoped, so you can only touch your own
  rows.
- Photographs go to a **private bucket**, uploaded *before* the database row is
  written (so a row never points at a missing file).
- Migrations `0001`–`0008` are written; some (like retiring the anonymous write
  path, `0007`) are written but not yet applied, with the preconditions documented
  honestly.

**Security note:** `OLLAMA_API_KEY` is **server-only** and must never go in an
`EXPO_PUBLIC_` variable (those are baked into the app bundle). Only publishable
values belong in the app.

---

## 17. The verification gate: how we keep it honest and working

`npm run verify` runs five checks. All five must pass. This is the project's
quality-and-integrity backbone:

| Check | Command | What it proves |
|---|---|---|
| **Typecheck** | `tsc --noEmit` | No TypeScript errors anywhere. |
| **Tests** | `node tools/run-tests.mjs` | The pure `core/` logic is correct (currently **72 tests**). |
| **Seed validation** | `tools/validate-seed.mjs` | Content is well-formed: coordinates present, evidence tiers set, every referenced image exists on disk. |
| **Vocabulary lint** | `tools/lint-vocab.mjs` | **No banned gamification words** crept into content or the app. This is the honesty invariant, automated. |
| **Dhamma eval** | `tools/dhamma-eval.mjs` | The AI still answers/refuses correctly across the benchmark. |

There's also a **separate, stricter typecheck** for `core/` + `shared/`
(`cd tools/test && npm run typecheck`) that isn't in the main gate.

**Testing philosophy:** the project extracts pure logic *into* `core/`
(alignment scoring, merit weighting, vision decoding, quest rules) precisely
because that's where the test harness can cover it **for free, without a device**.
Device behaviour (camera, GPS, the map) is proven by hand on hardware, not
pretended-at with mocks.

---

## 18. Current status: built vs proven vs planned

Be precise about three different things (this framing is from the project's own
audit, `SAKSHI-PROJECT-STATUS.md`):

- **Built in code** = the repository contains the feature.
- **Proven on device** = it's been run successfully on the actual demo phone.
- **Production-ready** = durable, secure, survey-grade.

| Area | Built in code | Proven on device | Production |
|---|---|---|---|
| App shell & navigation | ✅ | needs smoke test | prototype |
| Tīrtha / site browsing | ✅ | needs map test | content review pending |
| Then/Now | ✅ (strong) | needs offline test | provenance review pending |
| Capture / alignment | ✅ | **must test on hardware** | sensor calibration pending |
| Condition reports | ✅ | needs restart test | durable sync pending |
| **Damage detector (ONNX)** | ✅ (new) | **needs dev-build device test** | crack-only, honest mAP |
| Quests | ✅ (broad) | prove ONE end-to-end | full integration pending |
| Merit | ✅ (tested) | needs clean-device demo | ethics OK; cloud ledger pending |
| Dhamma retrieval / gates | ✅ (benchmarked 98%) | needs live Nepali phone test | provider hardening pending |
| Leaderboard | ✅ (new) | needs live Supabase test | pending |
| Supabase sync | ✅ (code) | not proven | project/RLS/auth setup pending |
| Mock API | ✅ | LAN test required | not a production backend |

**Known honest caveats to keep saying out loud:**

- Five site coordinates are still marked `doc` (documentary approximations, not
  field-surveyed): Puskarini, Marker Stone, Vihara Remains, Tilaurakot, Ramagrama.
- The damage detector has **three device-verification seams** (model loading,
  the image-resize API version, and box coordinate space) that can only be
  confirmed on a real dev build — all isolated in `services/ai/onnx.ts`.
- The mock API resets on restart and uses a single demo user.

**What "success" looks like** (not "every feature works" but "one coherent,
credible, honest story with working proof"): a real Lumbini place is visible;
you can compare then and now without misleading claims; a witness record is
created with honest measurement state; a condition report persists locally; a
Nepali Dhamma question returns a cited answer; unsupported/impersonation
questions refuse; and the app stays safe when the network or a sensor fails.

*The full six-minute demo script and the pre-demo checklist are in
`SAKSHI-PROJECT-STATUS.md`.*

---

## 19. Glossary

**Terms from the domain (Sanskrit/Pali):**

| Term | Meaning |
|---|---|
| **Sākṣī** (साक्षी) | Witness — one who sees and can testify. The app's name and core act. |
| **Tīrtha** | A sacred crossing / pilgrimage place. The "explore" surface. |
| **Dhamma** | The Buddha's teaching / the truth. The "knowledge" surface. |
| **Puṇya** | Spiritual merit. Earned, capped, non-transferable — *not* points. |
| **Dāna** | Generosity / giving. A (deferred) directed-giving feature. |
| **Pradakṣiṇā** | Ritual clockwise circumambulation of a sacred object. |
| **Chaityavali** | A register/garland of shrines (a quest/register concept). |
| **Bilara** | The segmentation format for the canonical Buddhist texts (gives stable citation IDs like `dn16:6.7`). |

**Technical terms:**

| Term | Meaning |
|---|---|
| **Vantage** | A fixed, catalogued photographic viewpoint (position + bearing + pitch). |
| **Alignment score** | 0–1 measure of how well your phone matches a vantage. Lock at ≥ 0.75. |
| **gate_mode** | `aligned` (measured) vs `manual` (by eye) vs `null` (unknown). The source of truth for honesty. |
| **Then/Now (dissolve)** | Fading between a historical and modern photo of the same spot. |
| **Evidence tier** | A label on every historical image saying how trustworthy it is. |
| **RAG** | Retrieval-Augmented Generation — an AI answers only from retrieved sources. |
| **Refusal** | Dhamma's honest "I can't answer that from the sources" — a feature, not a bug. |
| **YOLOv8 / ONNX** | The on-device AI model (YOLO) and the portable format (ONNX) used for damage detection. |
| **mAP50** | A standard object-detection accuracy metric (ours: 0.8167). |
| **NMS** | Non-Max Suppression — removes duplicate overlapping detection boxes. |
| **Letterbox** | Resizing an image to a square while preserving aspect ratio, padding the rest. |
| **Migration** | An append-only schema change to the database, versioned by position. |
| **RLS** | Row-Level Security — the cloud DB rule that you can only touch your own rows. |
| **Geofence** | A virtual radius around a site that triggers "arrival" behaviour. |
| **Codegen** | Generating `data/generated/*.ts` from `seed/*.json` at build time. |

---

## Where to go next

- **Understand the data rules:** `docs/DATA-ARCHITECTURE.md`
- **Reproduce/improve the AI vision model:** `docs/DAMAGE-MODEL.md` +
  `docs/train-crack-seg.ipynb`
- **The multilingual/AI plan:** `docs/MULTILINGUAL-AI-PLAN.md`
- **The demo script and pre-demo checklist:** `SAKSHI-PROJECT-STATUS.md`
- **The full original specification:** `SAKSHI-COMPLETE.md` (large — the 23-doc
  master spec)
- **Deployment:** `docs/DEPLOYMENT.md`

*This guide describes the project as it stands on 2026-08-09. When features
change, update the section that changed rather than adding a new one.*

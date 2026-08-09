# Sākṣī: Full Product Documentation

*Everything there is to know about the product, written in plain language, from
the basic idea to the deepest technical parts. If you read this top to bottom you
will understand what we built, why we built it that way, how each part works, and
what its limits are.*

*Project: LumbiniX-Committee/Everest. Event: LumbiniX 2026 hackathon. Last
updated: 2026-08-10.*

---

## Table of contents

1. [The one-line idea](#1-the-one-line-idea)
2. [The problem we are solving](#2-the-problem-we-are-solving)
3. [Our proposed solution](#3-our-proposed-solution)
4. [The values that shape every decision](#4-the-values-that-shape-every-decision)
5. [The three parts of the app](#5-the-three-parts-of-the-app)
6. [System design and architecture](#6-system-design-and-architecture)
7. [The technology stack, explained simply](#7-the-technology-stack-explained-simply)
8. [How the code is organized](#8-how-the-code-is-organized)
9. [The data pipeline: from JSON to screen](#9-the-data-pipeline-from-json-to-screen)
10. [The database: what is stored and why](#10-the-database-what-is-stored-and-why)
11. [Section deep dive: Tīrtha (place and map)](#11-section-deep-dive-tirtha-place-and-map)
12. [Section deep dive: Sākṣī (the witness loop)](#12-section-deep-dive-sakshi-the-witness-loop)
13. [Section deep dive: the damage detector (on-device AI)](#13-section-deep-dive-the-damage-detector-on-device-ai)
14. [Section deep dive: Dhamma (the grounded AI)](#14-section-deep-dive-dhamma-the-grounded-ai)
15. [Section deep dive: the on-site guide](#15-section-deep-dive-the-on-site-guide)
16. [Merit, quests, and the leaderboard](#16-merit-quests-and-the-leaderboard)
17. [Voice and multiple languages](#17-voice-and-multiple-languages)
18. [The backend: mock API and Supabase](#18-the-backend-mock-api-and-supabase)
19. [How we keep it honest and working (the verify gate)](#19-how-we-keep-it-honest-and-working-the-verify-gate)
20. [How it is set up and configured](#20-how-it-is-set-up-and-configured)
21. [How to build and deploy](#21-how-to-build-and-deploy)
22. [The business model](#22-the-business-model)
23. [Limitations and honest caveats](#23-limitations-and-honest-caveats)
24. [Questions people may ask, with answers](#24-questions-people-may-ask-with-answers)
25. [Glossary](#25-glossary)

---

## 1. The one-line idea

**Sākṣī turns a visitor's attention into conservation evidence.**

*Sākṣī* (साक्षी) is Sanskrit and Pali for **witness**: someone who sees a thing
with their own eyes and can speak to it. The app takes the name at face value.

> You go to a heritage site in Lumbini. You walk to a fixed photo viewpoint (we
> call it a "vantage"). You line your phone up with that exact viewpoint. You take
> a photo of what the place looks like **today**. Do that again next month, next
> year, and the photos line up into a **time-series**: visible, comparable proof
> of how a place is changing, gathered by the ordinary people standing in front of
> it.

That is the whole product in one image: two photos of the same spot, taken from
the same point, that you can fade between and see the difference.

Everything else in the app (the map, the history, the AI, the guided visits)
exists to **produce, describe, or motivate** that one irreplaceable thing: a
photo taken from a known point on a known day.

Lumbini is the birthplace of the Buddha and a UNESCO World Heritage Site in
Nepal.

---

## 2. The problem we are solving

Heritage conservation has a data problem that sounds boring and is actually
urgent.

**Monitoring heritage sites is slow, expensive, and rare.** A professional
condition survey of a monument needs trained surveyors, equipment, and time. It
happens once every few years, if that. Between surveys, small changes go
unrecorded: a hairline crack that widens over a monsoon, moss creeping across
carved stone, water pooling where it did not before, litter and encroachment at
the edges. By the time the next official survey notices, the cheap early fix is no
longer possible.

**Meanwhile, thousands of people visit these sites every week.** Pilgrims,
tourists, students, monks. Every one of them is standing in front of the monument
with a high-quality camera in their pocket. That is an enormous, continuous stream
of observation that is completely wasted today, because a random tourist photo,
taken from a random angle on a random day, is not comparable to anything and
proves nothing.

**The gap:** there is no easy way for an ordinary visitor to contribute a photo
that a conservator can actually trust and use. Trust needs three things a casual
photo does not have:

- **Position:** it must be taken from the same spot every time, or you cannot
  compare it.
- **Honesty about accuracy:** a conservator must be able to tell a carefully
  aligned survey-grade frame from a rough one lined up by eye, otherwise the whole
  dataset is poisoned.
- **Provenance:** who took it, when, where, and how it was verified.

There are also two smaller problems specific to a pilgrimage site:

- **Visitors want to understand the place,** but reliable, source-backed answers
  about Buddhist heritage are hard to find. General chatbots happily make things
  up, which is the opposite of what a sacred and historical context needs.
- **Gamified "engagement" apps are wrong for a sacred site.** Points, streaks,
  and leaderboards-as-scores cheapen the experience and, worse, they reward
  activity over truth. That is poison for an evidence product.

---

## 3. Our proposed solution

Sākṣī is a mobile app that lets any visitor create **trustworthy conservation
evidence** as part of a meaningful visit, and lets them **understand the place**
through honest, source-backed information.

It does this with four moves:

1. **Turn the phone into a simple survey instrument.** Using GPS, the compass,
   and the motion sensors, the app guides you to stand in the same place and point
   the phone the same way as a catalogued viewpoint. It only grants a verified
   "lock" when the match is genuinely good. This makes the photo **comparable**.

2. **Be ruthlessly honest about accuracy.** If you cannot get a good lock, you can
   still take the photo "by eye", but the record clearly marks it as such and
   never claims a measurement it does not have. A conservator can therefore filter
   the dataset by trust level. This makes the photo **usable**.

3. **Add real, honest AI where it helps and never where it lies.** An on-device
   model looks at your photo and suggests cracks as candidates for a human to
   confirm. A grounded question-answering engine answers about Buddhist texts only
   from real sources, and refuses when it cannot. The AI **offers**, the human
   **decides**.

4. **Motivate contribution without gamifying truth.** Instead of points and
   streaks, the app uses *puṇya* (spiritual merit), which cannot be spent, traded,
   or ranked. A separate leaderboard ranks contribution to the shared record, and
   because that score is computed on the server from evidence that was actually
   uploaded, it **cannot be faked**.

The output is a growing, position-anchored, honesty-labelled photographic record
of Lumbini's heritage, plus a trustworthy way to learn about the place, built by
the people who are already there.

---

## 4. The values that shape every decision

Before any feature, understand this. It explains most of the design choices, and
it is what makes the project distinctive. We call it the **charter**, and it is
enforced by code and automated checks, not just by intention.

- **A measurement is never faked.** If the GPS did not get a fix, the app records
  `null` (unknown), never `0`, because `0` would read as "perfectly accurate".
- **"By eye" never masquerades as "measured".** If you frame a shot by eye instead
  of getting a sensor-verified lock, the record says so (`gate_mode: 'manual'`)
  and it looks visibly different on screen.
- **The AI offers candidates, never verdicts.** The damage detector suggests; the
  human confirms severity. The Dhamma engine answers only from cited sources and
  **refuses** when it cannot.
- **Nothing is ever deleted.** An observation is evidence. A mistake is corrected
  by *adding* a new record, never by erasing the old one.
- **No gamification vocabulary.** Words like streak, XP, level, badge, reward, and
  leaderboard-as-points are banned in content. An automated linter fails the build
  if they appear. Merit is *puṇya*, which has no score and cannot be spent.
- **The device is the source of truth; the network is a copy.** A phone in the
  Sacred Garden may have no signal for hours. Writes always land locally first.

Whenever you wonder "why is it built this way?", the answer is usually one of
these rules.

---

## 5. The three parts of the app

The app has **exactly three destinations**. This is deliberate. They are the
*conceptual model* of the product, not just navigation tabs. There is no Home,
Explore, Profile, or Rewards tab, and adding one is meant to require a hard
decision.

| Part | Name means | What you do there |
|---|---|---|
| **Tīrtha** | a sacred crossing / pilgrimage place | Explore Lumbini: a map of heritage sites, site details, history, and the "then and now" photo comparison. |
| **Sākṣī** | witness | The core loop: pick a viewpoint, line up, capture a photo, record its condition. |
| **Dhamma** | the teaching / the truth | Ask questions and get source-backed answers from the Buddhist canon, or an honest refusal. |

```
                         +-------------------------+
                         |        Sakshi app       |
                         +------------+------------+
              +-----------------------+-----------------------+
              v                       v                       v
        +----------+            +----------+            +----------+
        |  Tirtha  |            |  Sakshi  |            |  Dhamma  |
        |  place   |            | witness  |            |knowledge |
        +----------+            +----------+            +----------+
        | map      |            | vantage  |            | ask      |
        | sites    |            | align    |            | retrieve |
        | then/now |            | capture  |            | cite     |
        | quests   |            | condition|            | refuse   |
        | arrivals |            | register |            | reflect  |
        +----------+            +----------+            +----------+
```

Behind those three there are two supporting stacks: a **Settings** stack and a
**Chaityāvalī** register (a garland of shrines, the site history browser).

---

## 6. System design and architecture

### The shape of the whole system

```
   +----------------------------------------------------------+
   |                     THE PHONE (offline-first)            |
   |                                                          |
   |   React Native + Expo app                                |
   |   +--------------------+   +--------------------------+   |
   |   |   UI layer         |   |   Device sensors          |   |
   |   |   app/ features/   |<->|   camera, GPS, compass    |   |
   |   |   components/      |   |   motion (via services/)  |   |
   |   +---------+----------+   +--------------------------+   |
   |             |                                            |
   |   +---------v----------+   +--------------------------+   |
   |   |   core/ (pure      |   |   on-device AI            |   |
   |   |   logic: scoring,  |   |   ONNX crack detector     |   |
   |   |   dhamma, vision,  |   |   Qwen3 offline LLM       |   |
   |   |   merit, quests)   |   |   (optional download)     |   |
   |   +---------+----------+   +--------------------------+   |
   |             |                                            |
   |   +---------v-----------------------------------------+  |
   |   |   SQLite database (the record, written first)     |  |
   |   +---------+-----------------------------------------+  |
   +-------------|--------------------------------------------+
                 |  sync when there is signal (best effort)
                 v
   +----------------------------------------------------------+
   |                     THE CLOUD (a copy)                    |
   |                                                          |
   |   Supabase: Postgres + Auth + private file storage       |
   |   Row-Level Security, anonymous sessions, photo bucket   |
   |                                                          |
   |   Ollama Cloud: the large language model for Dhamma      |
   |   answer synthesis (called through our backend only)     |
   +----------------------------------------------------------+

   For demos: mock-api/ is a tiny fake backend that replaces
   Supabase + Ollama and runs with zero external dependencies.
```

### The five architectural principles

1. **Offline-first.** Every write goes to the phone's SQLite database first. The
   network is treated as an optimization, never as the truth. This is not a nice
   extra; a phone in the Sacred Garden genuinely has no signal for hours.

2. **A pure core.** All the important logic (alignment scoring, the Dhamma engine,
   the vision decoding, merit rules, quest rules) lives in `core/`, which imports
   nothing from the phone. It is pure TypeScript. This is why it can be tested
   without a device, and it is where the automated tests concentrate.

3. **Thin routes, rich features.** The `app/` folder is the navigation map: each
   file just reads its parameters and renders a screen. The real screen code lives
   in `features/`. This keeps the route tree readable as a map of the product.

4. **One boundary per outside thing.** Every connection to the outside world
   (camera, location, sensors, database, cloud, AI runtimes) has exactly one file
   in `services/`. If we ever swap a provider, only that one file changes.

5. **Content is data, not code.** The 12 sites, their coordinates, history, and
   quests live in editable JSON in `seed/`, and a build step turns them into typed
   code. Nobody edits content inside a screen.

### The dependency rule

Dependencies point **inward**. Screens use services and core. Core uses nothing
above it. `core/` never imports from `app/`, `features/`, or `services/`. This one
rule is what makes the brain of the app portable and testable.

---

## 7. The technology stack, explained simply

| Technology | What it is, in one line | Why we use it |
|---|---|---|
| **React Native (0.86.2)** | Write an app in TypeScript that runs as a real native iOS and Android app. | One codebase, two platforms. |
| **Expo (SDK 57)** | A toolkit on top of React Native that handles building and device APIs. | Removes most of the native-build pain. |
| **Expo Router** | File-based navigation: a file at `app/(main)/tirtha/map.tsx` *is* the `/tirtha/map` screen. | The folder structure is the app map. |
| **TypeScript** | JavaScript with types, so mistakes are caught before running. | Safety. The type check is a required gate. |
| **expo-sqlite** | A real SQL database that lives on the phone. | Offline-first record storage. |
| **expo-camera / expo-location / expo-sensors** | Device APIs for the camera, GPS, and compass/motion. | The instrument that makes a witness record. |
| **MapLibre** | An open-source map renderer. | The Lumbini map. Native, so it needs a full build. |
| **onnxruntime-react-native** | Runs a trained AI model on the phone, offline. | The crack detector. |
| **llama.rn** | Runs a small language model on the phone. | The optional offline Dhamma answers. |
| **Supabase** | Hosted Postgres database, plus auth and private file storage. | The cloud copy that observations sync to. |
| **Ollama Cloud** | Runs a large language model in the cloud. | Dhamma answer writing (through our backend). |
| **Reanimated / Gesture Handler** | Smooth animations and gestures. | The reticle, the story clouds, the then-and-now fade. |

React Native's **New Architecture** is turned on. It is required by the on-device
AI vision module.

---

## 8. How the code is organized

The repository is about 45,000 lines of TypeScript across roughly 357 tracked
source files. Here is the map, with a plain description of each folder's job.

```
app/          The route tree. Thin files. Each just reads params and renders a
              feature screen. This folder IS the navigation map of the app.

features/     The real screen code, grouped by part
              (features/sakshi, features/tirtha, features/dhamma, ...).

components/   Reusable UI. components/ui is the primitive layer (Button, Card,
              Text). Nothing outside it is allowed to name a raw colour or font.

core/         Pure logic with NO device parts: alignment scoring, merit rules,
              the Dhamma engine, the vision decoder, quests, geofencing.
              This is the brain, and it is heavily unit-tested.

services/     The boundaries to the outside world: camera, location, sensors,
              the SQLite database, Supabase sync, the AI runtimes.

hooks/        Reusable React behaviour: useAlignment, useHeading, usePosition.

store/        App-wide state (first-launch, permissions, preferences, quests).

seed/         The SOURCE OF TRUTH for content, as human-editable JSON.

data/         Content the app ships with. data/generated/ is built from seed/.
              data/index.ts is the single switch between demo and generated data.

tools/        Build and check scripts (gen-data, run-tests, validate-seed,
              lint-vocab, dhamma-eval).

shared/       Pure helpers shared between app and core (geodesy math, types).

types/        TypeScript type definitions for the domain.

theme/        Design tokens: colours, typography, spacing, radii.

constants/    Identity strings, geography, storage keys.

utils/        Pure helpers (formatting, geo, alignment hints).

assets/       Images, fonts, audio narration, and the AI model file.

supabase/     SQL migrations for the cloud database.

mock-api/     A zero-dependency fake backend for demos.

docs/         Longer guides and the training notebook.
```

---

## 9. The data pipeline: from JSON to screen

The content you see (12 sites, their coordinates, history, quests) is not
hard-coded in screens. It flows through a **build-time pipeline**:

```
seed/*.json                 You edit these. Human-readable JSON.
     |                      (sites.json, vantages.json, quests.json,
     |                       plates.json, history.json, narration.json, ...)
     v
tools/gen-data.mjs          A build script reads the seed, validates it, and
     |                      generates typed TypeScript.
     v
data/generated/*.ts         Machine-generated. Never edited by hand.
     |
     v
data/index.ts               The single adapter. One line here decides whether
     |                      the app reads generated or demo data.
     v
feature screens             import { findSite } from '@/data'
```

**Why generate code instead of just loading JSON at runtime?** Because of the
images and audio. React Native's bundler (Metro) can only bundle a file if it
sees a literal `require('./path')` in the code; you cannot write
`require(someVariable)`. The generator writes those literal `require()` calls for
every historical plate and every narration clip, so they get bundled and work
**offline**. It also lets `tools/validate-seed.mjs` act as a permanent quality
gate, checking coordinates, evidence tiers, and that every referenced image really
exists on disk.

Run it with `npm run gen`. Validation runs inside `npm run verify`.

---

## 10. The database: what is stored and why

Sākṣī is **offline-first**. Every write goes to a SQLite database on the phone
first, and only later syncs to the cloud.

### Three classes of data

Almost every design question ("should this sync? who owns it? does it survive a
reinstall?") is answered by which class a piece of data belongs to:

| Class | Who makes it | Where it lives | Survives reinstall? | Examples |
|---|---|---|---|---|
| **Reference** | us, in advance | shipped in the app | reshipped | sites, vantages, quests, plates |
| **Record** | the person, on site | device then cloud | **must** | observations, condition reports |
| **Personal** | the person, incidentally | device only | not yet | merit, quest progress, visits |

### The local tables

The schema is built by **append-only migrations** in
`services/database/index.ts`. The position of a migration in the array *is* the
schema version, and an existing migration is never edited, because that would
corrupt phones already on that version. New columns are added as new entries at
the end. The migrations create and extend:

| Table | Class | Syncs to cloud? | Notes |
|---|---|---|---|
| `observations` | record | yes | includes `align_score`, `gps_acc_m`, `gate_mode` (added in a later migration) |
| `condition_reports` | record | yes | includes `ai_assisted` (added in the latest migration) |
| `quest_submissions` | record | yes | has a `synced` flag |
| `merit_events` | personal | **no, by design** | append-only ledger with `amount` and `day_key` |
| `site_visits` | personal | no | |
| `quest_progress` | personal | no | |
| `quest_completions` | personal | no | |
| `quests` | reference | seeded locally | |

The migration runner reads `PRAGMA user_version`, applies any migrations past that
number in order, and bumps the version after each one.

### The honesty in the schema

The database enforces the charter at the column level. The clearest example is
`gate_mode`:

- `gate_mode = 'aligned'` means the alignment gate passed and the error columns
  are real measurements.
- `gate_mode = 'manual'` means the photo was framed by eye and the error columns
  are **not** claims of accuracy.
- `gate_mode = null` means unknown, read with the same caution as manual.

In the cloud, a constraint says a row claiming `aligned` must carry the
measurements that claim rests on. You cannot store a "measured" observation
without the measurements. The honesty is a rule the database refuses to break, not
a convention.

---

## 11. Section deep dive: Tīrtha (place and map)

Tīrtha is the "place" layer, where you explore Lumbini.

### The map

An interactive map of Lumbini showing the 12 heritage sites, styled by their
importance tier, with geofence rings and your live position. It has two
implementations behind a feature flag:

- A **schematic site-plan** written in pure JavaScript that works everywhere,
  including Expo Go (`components/map/SitePlan.tsx`).
- A full **MapLibre** map, which is native and needs a full build, aiming at real
  offline map tiles (`components/map/SiteMap3D.tsx`, with a WebView bridge in
  `components/map/mapHtml.ts`).

The `.web.tsx` variants exist so the same screen renders on the web export without
pulling in native map code.

### Then and now: the visual hook

This is the feature that communicates the whole product in one gesture. Pick a
site and you see a **historical photograph** and a **modern photograph** of the
same spot, and you **fade between them** to see what changed
(`components/thennow/ThenNowCompare.tsx`).

- Real licensed historical plates (for example of the Ashokan Pillar and the
  Puskarini pond) are bundled with the app.
- Every image carries an **evidence-tier label**
  (`components/thennow/EvidenceTierLabel.tsx`), a charter requirement, so a viewer
  always knows whether they are looking at a genuine historical photograph, a
  documented reconstruction, or a modern capture. A reconstruction is never
  presented as a measured historical photograph.
- Where an honest image pair cannot be assembled, the app shows an honest empty
  state rather than a misleading placeholder.

### Arrivals and wisdom tiers

When you reach a site (physically, through a geofence, or by opening it), the app
can tell you what the place holds. **How much it says is a user setting**, the
"wisdom tier" (`core/wisdom/index.ts`):

- `basic` gives just the essentials.
- richer tiers add history and scriptural context.
- `custom` lets you type your own question about the place, which routes to the
  Dhamma engine.

The policy lives in `core/` because two surfaces must agree on it: the site page
you open deliberately, and the notification that arrives unasked when you cross a
geofence. If they disagreed, someone who chose `basic` could get a scriptural push
notification, exactly the intrusion the setting exists to prevent.

### Story mode

`features/tirtha/StorySequence.tsx` presents a site's story as a sequence of
narrated "beats", each shown in a warm speech-cloud with a monk illustration and a
typewriter reveal. The cloud component is shared with the on-site guide (see
section 15).

---

## 12. Section deep dive: Sākṣī (the witness loop)

This is the heart of the product. The flow is:

```
pick a site -> pick a vantage -> line up the phone -> capture -> record condition -> register
```

### Alignment: turning a phone into a survey instrument

A "vantage" is a fixed viewpoint with a known **position** (GPS), **bearing**
(compass direction), and **pitch** (up or down tilt). To make a photo comparable
to last year's from the same vantage, you must stand in the same place and point
the phone the same way. The app guides you with an on-screen target (a reticle)
and computes a single **alignment score** in `core/alignment/score.ts`:

```
align = 0.30 x position_score
      + 0.50 x heading_score      (heading matters most: face the wrong way and
      + 0.20 x pitch_score         the photo is worthless)
```

You get a **lock** (the honest, sensor-verified state) only when all of these
hold:

```
align >= 0.75   AND   gps_accuracy <= 15 metres   AND   heading_score >= 0.5
```

The heading floor is a hard rule: you can never lock while facing the wrong way,
even with a perfect GPS fix. Missing position or heading scores `0` (they are
required, not assumed); a missing pitch reading degrades to "assume level" rather
than blocking. The function also reports `blockedBy` (`gps`, `heading`,
`position`, or `pitch`) so the hint text can tell you what to fix first. All of
this is pure logic, unit-tested without a phone (`core/alignment/score.test.ts`).

### The honest escape hatch: "match by eye"

Sometimes conditions are bad: poor GPS, magnetic interference. Rather than block
the person, the app offers **"match by eye"**, and it is scrupulously honest:

- It records `gate_mode: 'manual'`, never a fake lock.
- It stores the actually measured score (or `null`), never `1.0`.
- Its reticle is a dashed sand-coloured hatch. It never shows the blue "lock"
  colour, because colouring an eyeballed frame as locked would be the same lie as
  faking the measurement.
- The observation screen labels it clearly, so no one mistakes it for a
  survey-grade frame.

### Capture integrity

When you press the shutter (`features/sakshi/CaptureScreen.tsx`):

1. The photo is copied out of the camera's temporary cache into durable storage
   immediately, otherwise the OS could delete the file and leave a record pointing
   at nothing.
2. It records your actual GPS fix, not the vantage's catalogued coordinate (which
   would falsely claim you stood exactly on the survey point).
3. Missing signals are stored as `null`, never `0`.
4. In photography-restricted sites, the camera will not even open, with an
   explanation. That is a charter rule.

### Condition reports

After capturing, you can attach a structured **condition report**: what you
noticed about the site's state. It is deliberately simple, because a visitor is
not a conservator (`components/observation/ConditionSheet.tsx`):

- **Category:** 8 coarse buckets (biology, structural, water, surface, human
  impact, encroachment, environment, management).
- **Subtype:** plain language ("new crack", "moss or algae").
- **Severity:** only three levels ("worth noting", "concerning", "needs
  attention soon"), because a visitor cannot honestly calibrate a 10-point scale.
- **Note:** optional, in their own words.

The sheet opens at the first unanswered field, which after an AI scan is severity,
because that is the one thing the model cannot know.

---

## 13. Section deep dive: the damage detector (on-device AI)

This is the newest sophisticated feature. It looks at a captured photo and
suggests damage.

### The story

The app originally had a **fake** damage detector: it hashed the photo's filename
into invented boxes, made-up confidence scores, and a fake "surface integrity %".
That was the deepest possible violation of the project's honesty thesis, so it was
removed and replaced with a **real** one.

### What it does now

A real **YOLOv8n** object-detection model, trained to find **cracks**, runs
entirely on the phone (no internet needed) against a captured photograph and
offers **candidates** the surveyor confirms.

- **Real accuracy, reported honestly.** The model reports its true **mAP50 of
  0.8167** (about 82% on a standard accuracy metric), shown in the UI and never
  rounded up.
- **Candidates, not verdicts.** The boxes are drawn dashed, and the card says
  they are candidates for a person to verify, not a conservator's assessment.
- **The AI fills in *what*, the human decides *how urgent*.** It pre-fills the
  category and kind; the person always sets the severity.
- **Provenance is recorded.** A confirmed-from-AI report is stored with
  `ai_assisted = 1`, so a later reader can weigh assisted findings differently.
- **The feature is invisible if the model or runtime is absent**, and it never
  crashes the app. When it fails, it now says *why* (no detector in this build,
  model failed to load, or scanning unavailable on web) instead of showing
  nothing.

### How it works (the pipeline)

An AI vision model does not take a photo and return boxes directly. There are
several steps, split into **pure, testable logic** (`core/vision/`) and the
**device glue** (`services/ai/`):

```
photo (any size)
   |
   v  services/ai/onnx.ts + core/vision/letterbox.ts
resize and "letterbox" to 640x640 (keep aspect ratio, pad with grey)
   |
   v  decode the JPEG into raw pixels, pack into the number grid the model expects
run the model  (onnxruntime-react-native, native, on-device)
   |
   v  core/vision/yolo.ts
decode the raw output tensor into candidate boxes and scores (decodeYolo)
   |
   v  NMS (non-max suppression): remove duplicate overlapping boxes
   |
   v  core/vision/letterbox.ts
map boxes back to the original photo's coordinates
   |
   v  services/ai/yoloEngine.ts -> UI
dashed candidate boxes + honest summary -> optional one-tap condition pre-fill
```

The geometry and decoding, the parts most likely to be subtly wrong, live in
`core/vision/` and are covered by unit tests, so they are verified without a
device. `decodeYolo` even detects which tensor layout the export used
(channel-major or its transpose) so either export decodes correctly. NMS keeps the
highest-scoring box and drops lower-scoring overlaps of the *same* class, so a
crack overlapping moss stays two findings, not one.

The one file that touches the native runtime is `services/ai/onnx.ts`. Swapping to
a different AI runtime later would only touch that one file.

### The training notebook

The model was trained on Google Colab using `docs/train-crack-seg.ipynb`, a
ready-to-run notebook that downloads a public crack dataset, trains YOLOv8, prints
the honest mAP50, and exports the `.onnx` model file. Reproducing or improving the
model is a documented, repeatable process (see `docs/DAMAGE-MODEL.md`).

### A real-world problem we hit and fixed

The AI runtime had a bug: its Android build script referenced `VersionNumber`, a
Gradle class that Gradle 8 removed, so the app failed to compile. We fixed it with
**patch-package**, a tool that records a small patch to the dependency and
reapplies it automatically on every install, including on the cloud build server.
The patch lives in `patches/onnxruntime-react-native+1.24.3.patch`.

A second, subtler bug hid the whole feature: `onnxruntime-react-native` calls
`Module.install()` at *import* time, which throws in a binary built before the
plugin was added. A bare `catch` returned `null`, and every downstream check then
rendered nothing, with no message. That is why a working model looked absent. The
fix records and surfaces the reason, so a missing binary is now visibly different
from a missing model.

**To activate the detector on a phone:** build a dev or preview client, because
the deps and the model are already there; the UI lights up once the native runtime
is present in the binary.

---

## 14. Section deep dive: Dhamma (the grounded AI)

Dhamma is the knowledge layer, and it is the most technically validated subsystem
in the project. It answers questions about Buddhist teaching under strict rules
that make it trustworthy.

### The core principle: cite or refuse

A normal chatbot will happily make things up ("hallucinate"). Dhamma cannot. It
uses **RAG (Retrieval-Augmented Generation)**, implemented in `core/dhamma/`:

```
your question
   |
   v  domain-vocabulary gate: does the question even contain a Dhamma term?
   |     (if not, refuse before doing any work)
   v  impersonation and prompt-injection gate
   |     (refuse "speak as the Buddha", fabricated-citation bait, etc.)
   v  scripted demo cache (for the five key questions, so a dead venue wifi
   |     cannot break the demo)
   v  hybrid retrieval: find the most relevant canonical passages
   |     (lexical + semantic, fused with "reciprocal rank fusion")
   v  synthesis: an LLM (Ollama Cloud) writes an answer USING ONLY those passages
   |     (only when a provider credential is present; otherwise deterministic)
   v  citation validation: every bracketed citation must map to a retrieved
   |     passage; an uncited synthesis is discarded in favour of the cited
   |     deterministic answer
   v  answer + citations   OR   an honest refusal
```

If the retrieved evidence does not support an answer, the honest output is a
**refusal**, not a guess. The corpus is a deliberately narrow set of canonical
(Bilara-aligned) Buddhist texts: quality over coverage.

An important design note from the code itself: there is deliberately **no
retrieval-score threshold**. Measured across the benchmark, the scores for
questions that should be answered and questions that must be refused overlap
almost completely, so a numeric cut would either admit nonsense or refuse
legitimate questions. The **domain-vocabulary gate** carries the refusal instead,
which is why it is extended carefully rather than replaced with a number.

### The guardrails

- **No impersonation.** It refuses to "speak as the Buddha".
- **Prompt-injection resistant.** Attempts to make it ignore its rules are caught
  by an adversarial gate.
- **Nepali-first.** Nepali is the default answer language, with an English toggle.
  Citations, source IDs, and Pali text are never machine-translated.
- **Reflection, not advice.** For personal questions it offers inquiry ("what
  might you notice..."), not life advice (`core/dhamma/reflection.ts`).

### How good is it?

There is a benchmark (`npm run eval:dhamma`) covering answerable, adjacent,
out-of-scope, adversarial, and Nepali questions. The deterministic engine scores
**50 out of 50** on it, with all mandatory safety gates passing: full adversarial
refusal, the Nepali distress override, and citation-hit thresholds.

### Offline capability

If there is no network, it degrades gracefully. The local canonical corpus and
deterministic retrieval always work. An optional small on-device model
(Qwen3-0.6B, downloaded on demand) can synthesize short answers offline. If the
model is missing, the deterministic corpus remains the source of truth, and even
when present the offline model may only rephrase retrieved passages, never invent
facts or citations. See `services/offlineModel/index.ts` and
`docs/MULTILINGUAL-AI-PLAN.md`.

---

## 15. Section deep dive: the on-site guide

The Dhamma engine is exactly right for a question about a sutta and exactly wrong
for a visitor standing in front of a building asking "what is this?". Running the
guide through the Dhamma engine produced *"I don't have enough reliable evidence
to answer this confidently"* followed by a reading list: a true sentence, and a
useless one.

So the guide is a **separate, free-but-grounded** mode (`core/guide/index.ts` and
`services/guide/index.ts`). Its voice lives in `core/`, shared with the backend so
the answer does not change depending on which one served it.

- It answers plainly, offers what is worth noticing, and suggests where to walk
  next.
- It keeps only **two** limits from the charter: it never states a measurement or
  condition about the fabric of a monument (that is Sākṣī's measured job), and it
  never claims to be quoting a source.
- It **never refuses and never shows an error card.** Its fallbacks run in order:
  the backend, then a direct provider call if a credential is present, then the
  site's own bundled description. The last needs no network at all, which is the
  case the Sacred Garden actually presents.

On screen it uses the same warm **speech-cloud** as story mode
(`components/monk/SpeechCloud.tsx`): one exchange at a time, your question as a
quiet line above the cloud, the guide's reply typed into the cloud, and back and
forward controls to re-read. Nothing in `core/dhamma` or `services/dhamma` is
touched by the guide.

---

## 16. Merit, quests, and the leaderboard

### Puṇya (merit)

When you contribute (record an observation, complete a quest) you earn **puṇya**,
spiritual merit. It is deliberately **not** game points (`core/merit/`):

- It has **no total you can spend.** Your balance is computed as `SUM(amount)`
  from an append-only ledger, never stored as a mutable number.
- It is **capped per day.** Once you hit the cap, further acts are still recorded
  (with `amount = 0`), because the act happened; only the merit was capped.
  Suppressing the record would make an append-only ledger lie.
- It is **non-transferable.** No spending, no trading, no cash-out language.

### Quests

Quests are a restrained layer that guides meaningful visits, not a points grind
(`core/quests/`, `core/session/`):

- **Availability** by proximity and time window (a "first light" quest is only
  available at dawn, on site).
- **Verified completion.** You cannot complete "capture the east approach
  vantage" from your sofa; it checks you were actually there.
- **Contemplative mechanics:** stillness, pradakṣiṇā (ritual circumambulation),
  riddles, and a close ritual, rather than addictive ones.

### The leaderboard: an honest exception, recorded plainly

A leaderboard feature was later added (accessible as "Guardians"). It is a genuine
tension with the original charter, and the project documents it honestly rather
than hiding it:

- The charter originally refused ranking. The leaderboard reverses that.
- **But it does not rank puṇya.** Merit stays on the device, unranked.
- The board ranks **contribution to the shared record**: points computed on the
  server from evidence that already syncs (observations, condition reports, quest
  submissions).
- This has an integrity payoff. Because the score is derived from uploaded
  evidence rather than sent by the app, **you cannot fake it.** Inflating your
  rank requires actually doing the work. A client-reported score is a number the
  client chose; a server-derived one must be earned.

The vocabulary linter still bans "leaderboard" everywhere except the one surface
that is a ranking, so no other part of the app starts talking about ranks.

---

## 17. Voice and multiple languages

- **Four independent language settings:** UI language, input language, output
  language, and source (corpus) language. Initially English and Nepali,
  extensible.
- **Text-to-speech** uses `expo-speech` (`services/voice/index.ts`), loaded lazily
  behind an availability check so a build without the module degrades to a no-op
  instead of failing to start. Reading an answer aloud works on every surface that
  had it.
- **Voice input has been removed from the Dhamma section** deliberately. It needed
  a native speech-recognition module that only worked in a full build, so in Expo
  Go it only ever printed an error, and typing a question was never the slow part.
  Removing it also took a native module out of the build, which is one less thing
  to fail on stage.
- There is a planning document at the repo root, `14-VOICE-FEATURES.md`, for the
  voice roadmap.

---

## 18. The backend: mock API and Supabase

There are two backend stories.

### Mock API (`mock-api/server.mjs`)

A **zero-dependency, in-memory** fake backend for demos. It implements every
endpoint the app calls (sites, captures, reports, merit, quests, `/dhamma/ask`,
`/tirtha/guide`, exports, a custodian dashboard). Run it with `npm run api`. It is
perfect for a controlled demo and explicitly not a production backend: state
resets on restart and it uses a single demo user. It runs with Node's
`--experimental-strip-types` flag so it can import the project's `.ts` core files
directly.

### Supabase (the real cloud)

The production-facing path: hosted Postgres, auth, and private file storage for
photographs. The sync layer (`services/sync/`, `services/supabase/`) writes local
SQLite records up to Supabase.

- It uses **anonymous sessions**, so someone standing at a temple does not have to
  make an account before recording. The account exists to *own rows*, not to
  identify a person.
- **Row-Level Security** is author-scoped, so you can only touch your own rows.
- Photographs go to a **private bucket**, uploaded *before* the database row is
  written, so a row never points at a missing file.
- Migrations `0001` through `0008` are written; some (like retiring the anonymous
  write path) are written but not yet applied, with the preconditions documented.

**Security note:** `OLLAMA_API_KEY` is **server-only** and must never go in an
`EXPO_PUBLIC_` variable, because those are baked into the app bundle. Only
publishable values belong in the app.

---

## 19. How we keep it honest and working (the verify gate)

`npm run verify` runs five checks. All five must pass. This is the project's
quality-and-integrity backbone:

| Check | Command | What it proves |
|---|---|---|
| **Typecheck** | `tsc --noEmit` | No TypeScript errors anywhere. |
| **Tests** | `node tools/run-tests.mjs` | The pure `core/` logic is correct (over 110 unit tests). |
| **Seed validation** | `tools/validate-seed.mjs` | Content is well-formed: coordinates present, evidence tiers set, every referenced image exists on disk. |
| **Vocabulary lint** | `tools/lint-vocab.mjs` | No banned gamification words, and no em dash in user-facing text. The honesty invariant, automated. |
| **Dhamma eval** | `tools/dhamma-eval.mjs` | The AI still answers and refuses correctly across the benchmark (50/50). |

There is also a separate, stricter typecheck for `core/` and `shared/`
(`cd tools/test && npm run typecheck`).

**Testing philosophy:** the project extracts pure logic *into* `core/` precisely
because that is where the test harness can cover it for free, without a device.
Device behaviour (camera, GPS, the map) is proven by hand on hardware, not
pretended at with mocks.

---

## 20. How it is set up and configured

### Running locally

```bash
npm install                     # installs deps and applies the patch (postinstall)
cp .env.example .env.local      # then fill in your own values
npx expo start                  # start the Metro bundler
```

Then press `a` (Android) or `i` (iOS), or scan the QR code with Expo Go.

### Configuration files

- **`.env.local`** holds your Supabase config and API values. It is gitignored and
  must never be committed. Copy `.env.example` and fill it in. Only `EXPO_PUBLIC_`
  variables reach the app bundle, and they are inlined at build time (so changing
  one needs `expo start -c`). Non-prefixed variables stay server-side.
- **`app.json`** is the app manifest: name, slug, owner, version, icons,
  permissions, the plugin list (which native modules ship), `assetBundlePatterns`
  (which pins the AI model into the build), and the EAS project id and updates URL.
- **`app.config.js`** is a gitignored local override for personal EAS builds.
- **`eas.json`** defines three build profiles: `development` (dev client),
  `preview` (an installable internal APK), and `production` (an app bundle).
- **`metro.config.js`** teaches the bundler to treat `.onnx` and other model files
  as assets.
- **`patches/`** holds the `patch-package` fix for the ONNX runtime, reapplied on
  every `npm install` by the `postinstall` script.
- **`tsconfig.json`** sets the `@/` path alias to the repo root.

### What needs real hardware

Most of the app runs in Expo Go and the simulator. These do not:

- Camera, GPS, and compass need a real phone.
- The MapLibre map and the damage detector need a full build (dev or preview), not
  Expo Go, because they are native code.

---

## 21. How to build and deploy

### The demo build

```bash
npx eas build --profile preview --platform android
```

This produces an installable Android APK (internal distribution). When it
finishes, EAS gives you a link or QR; open it on the demo phone and install.

During the build:

- `android/` is gitignored, so EAS regenerates it from `app.json`. This is how the
  plugin changes actually reach the binary.
- `postinstall` runs `patch-package`, reapplying the ONNX patch.
- `assetBundlePatterns` pins the `.onnx` detector model into the app.

**A rebuild is required** whenever the native side changes (a plugin added or
removed, a native module swapped). The current work removed the speech-recognition
plugin and needs the ONNX runtime in the binary, so a fresh build is needed before
the next demo.

**Check the build owner first.** `app.json` names an `owner` and an EAS
`projectId`; confirm with `npx eas whoami` and `npx eas build:list` before
spending queue time, because a wrong owner wastes the whole wait.

### Verification checklist before a demo

- On a device build: capture a photo, the scan runs unprompted, dashed boxes
  appear, "file this as a report" opens the sheet at severity, and the saved row
  has `ai_assisted = 1`.
- Type with the keyboard up on both Dhamma chats: no dead band, composer flush
  above the keys.
- Ask the on-site guide something at a site: it answers in the cloud and never
  refuses.
- Test in airplane mode to confirm the offline paths.

Full detail is in `docs/BUILD-AND-RUN.md` and `docs/DEPLOYMENT.md`.

---

## 22. The business model

Sākṣī is built as a hackathon project with a credible path to sustainability. It
is **not** built on advertising or engagement, because those directly conflict
with the honesty thesis. The realistic model is a mix of institutional support and
optional services.

### Who benefits, and who would pay

- **Heritage authorities and trusts** (for Lumbini, the Lumbini Development Trust;
  more broadly, archaeology and conservation departments). They get a continuous,
  low-cost monitoring stream that would otherwise require expensive periodic
  surveys. This is the primary institutional customer.
- **Researchers and universities** studying conservation, epigraphy, and heritage
  management get a structured, provenance-labelled dataset.
- **Pilgrims and visitors** get a richer, more trustworthy visit for free. They
  are the contributors, not the customers.

### Possible revenue paths

1. **Grants and institutional funding.** Heritage monitoring is exactly the kind
   of public-good work that UNESCO-linked bodies, conservation NGOs, and cultural
   ministries fund. This is the most natural first source.
2. **A licensed dashboard for authorities.** The visitor app stays free. The paid
   product is the custodian side: a dashboard that turns the incoming evidence into
   maps, trends, and alerts (which crack is widening, which site is deteriorating).
   The mock API already sketches a custodian dashboard endpoint.
3. **Data services for research,** provided ethically and with consent, under
   clear licensing.
4. **Optional premium visitor features** that never touch the evidence path:
   richer offline content packs, deeper guided tours, audio in more languages.

### Why the honesty model is also the business moat

The value of the dataset is entirely its trustworthiness. An engagement-optimized
competitor that rewards volume over accuracy would produce a large, useless pile
of uncomparable photos. Our alignment gate, honesty labelling, and
server-verified contribution scoring are what make the data worth paying for. The
values are not in tension with the business; they *are* the business.

### Cost structure

Costs are deliberately low. The app is offline-first, so most work happens on the
phone at no server cost. The heavy AI (crack detection) also runs on the phone.
The only recurring cloud costs are Supabase storage/database for synced evidence
and the optional Ollama Cloud calls for Dhamma synthesis, both of which scale
gently and can be capped.

---

## 23. Limitations and honest caveats

Being precise about limits is part of the charter, so here they are plainly.

### Data limitations

- **Some site coordinates are approximate.** Five are marked `doc` (documentary
  approximations, not field-surveyed): Puskarini, Marker Stone, Vihara Remains,
  Tilaurakot, and Ramagrama. They must be replaced with Lumbini Development Trust
  survey data before any of it reaches a real observer.
- **The vantage points are illustrative,** not established survey viewpoints yet.

### AI limitations

- **The crack detector finds cracks only.** It does not detect moss, water
  damage, or the other seven categories a human can log. Its honest accuracy is
  mAP50 0.8167, not perfection, and it offers candidates a human must confirm.
- **The detector has three seams that can only be verified on a real dev build:**
  model loading, the image-resize API version, and box coordinate space. All are
  isolated in `services/ai/onnx.ts`. If the build does not carry the native
  runtime, the honest message says so, which is the point, but it means the
  detector demo depends on a successful rebuild.
- **The Dhamma corpus is deliberately narrow.** It is quality over coverage. It
  will refuse many genuine questions simply because they are outside its small set
  of canonical texts. That is by design, but it is a coverage limit.
- **The offline LLM is small** (Qwen3-0.6B) and only rephrases retrieved passages;
  it is not a substitute for the cloud model.

### Backend limitations

- **The mock API is not a production backend.** It resets on restart and uses a
  single demo user.
- **Supabase sync is written but not fully proven end to end.** Some migrations
  are written but not yet applied.

### Process limitations

- Several features are **built in code but not yet proven on the demo phone**
  (see the status table in `SAKSHI-PROJECT-STATUS.md`). "Built" is not the same as
  "proven on device" is not the same as "production-ready", and we keep those
  three separate on purpose.

---

## 24. Questions people may ask, with answers

**Q: Isn't this just another photo-sharing app?**
No. A shared photo proves nothing to a conservator. The point is *comparability*:
a photo taken from a known viewpoint, with honest accuracy labelling and
provenance, so it can be placed in a time-series and trusted. The alignment
instrument and the honesty labelling are the product.

**Q: How do you stop people uploading junk or fake data?**
Three ways. The alignment gate makes a survey-grade frame hard to fake (you have
to actually be there, facing the right way). The honesty labelling marks anything
lined up by eye, so junk is filterable rather than poisonous. And the leaderboard
score is computed on the server from uploaded evidence, so you cannot inflate your
rank without doing real work.

**Q: Why not just use a normal chatbot for the questions?**
Because a normal chatbot makes things up, and a sacred and historical context is
the worst possible place for that. Our Dhamma engine answers only from cited
canonical sources and refuses when it cannot, which is a feature, not a bug.

**Q: Why does the AI never just tell me the answer or the verdict?**
By design. The AI offers candidates; a human confirms. For damage, the model
suggests a crack and its confidence, but a person sets the severity. For Dhamma,
every claim must map to a real source. This is the honesty thesis in action.

**Q: Does it work without internet?**
Yes, that is the core assumption. Every record is written to the phone first. The
map, then-and-now, condition reports, the crack detector, and the deterministic
Dhamma corpus all work offline. Sync happens later, when there is signal.

**Q: What happens to my privacy?**
Accounts are anonymous by default; the account exists to own your rows, not to
identify you. Photos go to a private bucket. Row-Level Security means you can only
touch your own data.

**Q: Why puṇya instead of points?**
Because points reward activity, and this product rewards truth. Puṇya cannot be
spent, traded, or ranked. It fits the sacred context and it keeps the incentives
pointed at honest contribution.

**Q: Isn't the leaderboard a contradiction of your no-gamification rule?**
Yes, and we say so plainly rather than hide it. It does not rank merit; it ranks
verified contribution to the shared record. Because the score is server-derived
from real evidence, it rewards doing the work, not gaming a mechanic.

**Q: Can this scale beyond Lumbini?**
Yes. Nothing in the architecture is Lumbini-specific except the seed content. The
same instrument, honesty model, and pipeline apply to any heritage site with
fixed viewpoints.

**Q: What is the single biggest risk for the demo?**
The crack detector depends on a successful native rebuild. If the build does not
carry the ONNX runtime, the honest message will say so (which is correct
behaviour), but the live detector demo needs that build to succeed. Start it
early.

**Q: What is the one thing that makes this hard to copy?**
The discipline. The honesty invariants are enforced by automated checks
(`npm run verify`), so the trustworthiness is structural, not a marketing claim.
That discipline is what makes the dataset valuable, and it is harder to copy than
any single feature.

---

## 25. Glossary

**Domain terms (Sanskrit/Pali):**

| Term | Meaning |
|---|---|
| **Sākṣī** (साक्षी) | Witness: one who sees and can testify. The app's name and core act. |
| **Tīrtha** | A sacred crossing or pilgrimage place. The "explore" surface. |
| **Dhamma** | The Buddha's teaching, the truth. The "knowledge" surface. |
| **Puṇya** | Spiritual merit. Earned, capped, non-transferable. Not points. |
| **Dāna** | Generosity, giving. A deferred directed-giving feature. |
| **Pradakṣiṇā** | Ritual clockwise circumambulation of a sacred object. |
| **Chaityāvalī** | A register or garland of shrines. The site-history browser. |
| **Bilara** | The segmentation format for the canonical texts, giving stable citation ids like `dn16:6.7`. |

**Technical terms:**

| Term | Meaning |
|---|---|
| **Vantage** | A fixed, catalogued photographic viewpoint (position + bearing + pitch). |
| **Alignment score** | A 0 to 1 measure of how well your phone matches a vantage. Lock at 0.75 or higher. |
| **gate_mode** | `aligned` (measured) vs `manual` (by eye) vs `null` (unknown). The source of truth for honesty. |
| **Then and now** | Fading between a historical and a modern photo of the same spot. |
| **Evidence tier** | A label on every historical image saying how trustworthy it is. |
| **RAG** | Retrieval-Augmented Generation: an AI answers only from retrieved sources. |
| **Refusal** | Dhamma's honest "I cannot answer that from the sources". A feature, not a bug. |
| **YOLOv8 / ONNX** | The on-device AI model (YOLO) and the portable format (ONNX) used for damage detection. |
| **mAP50** | A standard object-detection accuracy metric. Ours is 0.8167. |
| **NMS** | Non-Max Suppression: removes duplicate overlapping detection boxes. |
| **Letterbox** | Resizing an image to a square while keeping aspect ratio, padding the rest. |
| **Migration** | An append-only schema change to the database, versioned by position. |
| **RLS** | Row-Level Security: the cloud rule that you can only touch your own rows. |
| **Geofence** | A virtual radius around a site that triggers "arrival" behaviour. |
| **Codegen** | Generating `data/generated/*.ts` from `seed/*.json` at build time. |

---

*This document describes the project as it stands on 2026-08-10. When a feature
changes, update the section that changed rather than adding a new one. For a
line-by-line code walkthrough, see `explanation.md`. For the pitch deck, see
`slides.md`. For the demo recording plan, see `video-demo.md`.*

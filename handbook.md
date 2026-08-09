# Sākṣī: The Complete Handbook

*Everything about this product in one file. What it is, why it exists, how every
system works, how the AI behaves online and offline, how the model was trained,
how the build is produced, what the whole stack is, and what is honestly still
missing.*

*Plain language. No em dashes. This document merges the LumbiniX 2026 submission
document with a full technical walkthrough of the working tree, and every number
in it was checked against the code on 10 August 2026.*

---

## Contents

**Part I: The product**
1. [One page summary](#1-one-page-summary)
2. [The three problems](#2-the-three-problems)
3. [The solution and who it is for](#3-the-solution-and-who-it-is-for)
4. [The charter: wisdom made operational](#4-the-charter-wisdom-made-operational)

**Part II: How it is built**
5. [System architecture](#5-system-architecture)
6. [The complete tech stack](#6-the-complete-tech-stack)
7. [Every dependency and why it is there](#7-every-dependency-and-why-it-is-there)
8. [Content pipeline and provenance](#8-content-pipeline-and-provenance)
9. [Databases: local and cloud](#9-databases-local-and-cloud)
10. [End to end workflows](#10-end-to-end-workflows)

**Part III: The three surfaces**
11. [Tīrtha, the journey](#11-tīrtha-the-journey)
12. [Sākṣī, the witness](#12-sākṣī-the-witness)
13. [Merit, dāna, and the leaderboard](#13-merit-dāna-and-the-leaderboard)

**Part IV: The AI, in full**
14. [The AI overview, and online versus offline](#14-the-ai-overview-and-online-versus-offline)
15. [The crack detector: the running system](#15-the-crack-detector-the-running-system)
16. [YOLO: training, export, and the model](#16-yolo-training-export-and-the-model)
17. [The Dhamma engine](#17-the-dhamma-engine)
18. [The offline language model](#18-the-offline-language-model)
19. [The Tīrtha guide and reflection](#19-the-tīrtha-guide-and-reflection)
20. [The offline design philosophy](#20-the-offline-design-philosophy)

**Part V: Building and shipping**
21. [Expo, EAS, and the build system](#21-expo-eas-and-the-build-system)
22. [The verify gate and test strategy](#22-the-verify-gate-and-test-strategy)

**Part VI: The honest record**
23. [Business model](#23-business-model)
24. [Honest limitations](#24-honest-limitations)
25. [Bugs we shipped and then fixed](#25-bugs-we-shipped-and-then-fixed)
26. [Roadmap](#26-roadmap)
27. [The team](#27-the-team)
28. [Questions you will be asked](#28-questions-you-will-be-asked)

**Part VII: Scoring against the judges' criteria**
29. [The nine criteria, scored honestly](#29-the-nine-criteria-scored-honestly)

**Reference**
30. [Command reference](#30-command-reference)
31. [Glossary](#31-glossary)

---

# Part I: The product

## 1. One page summary

**Sākṣī** (Sanskrit *sākṣin*) means *witness*: one who sees a thing directly and
can testify to it. A witness who embellishes is worse than no witness at all.
That sentence is the entire product specification.

Sākṣī is a map based Android application for the Greater Lumbini Circuit that
turns a visitor's attention into conservation evidence. A pilgrim or tourist
opens the map, walks to one of twelve heritage sites, and receives that place's
own material at a depth that grows as they return. At each site there are fixed
photographic viewpoints. The app guides the visitor to stand where an earlier
observer stood, aligns the device against a stored heading and tilt, and records
what is there today. Those repeated frames become a comparable time series that a
conservation authority can actually use, and any damage a visitor notices becomes
a structured condition report with a photograph, a location, and a severity
attached.

Alongside it sits a question answering surface restricted to a narrow canonical
Buddhist corpus, which answers in Nepali or English with a citation to a specific
passage, and refuses when the sources do not support an answer.

### The hackathon theme, taken literally

> *What if Buddha were born in 2026? Build the future guided by the timeless
> wisdom of Lord Gautam Buddha.*

The Kālāma Sutta asks a listener not to accept a claim on the strength of
tradition, repetition, rumour, scripture, logic, inference, appearance, agreement
with one's own views, apparent competence, or the authority of a teacher, but to
test it.

That is a specification, and an unusually demanding one for software built in the
age of the confident language model. We took it literally. Every subsystem is
designed so that a claim it makes can be traced to something a person can check:
a canonical passage id, a timestamped photograph, a sensor reading with its
accuracy attached, or a coordinate with its provenance tier printed beside it.

### The numbers, verified today

| Figure | Value |
|---|---|
| Product surfaces | 3 |
| Heritage sites seeded | 12 |
| Vantages, quests, historical plates | 6, 10, 10 |
| Domain tests passing | **113 / 113** in 773 ms |
| Dhamma benchmark | **50 / 50** |
| Adversarial refusal rate | **100 %** |
| Citations naming an unretrieved passage | **0** |
| Crack detector accuracy | **mAP50 0.8167** |

*The submission PDF records 49/50 on the Dhamma benchmark. The adjacent category
has since been fixed and it is now 50/50. Both numbers are honest; this one is
current.*

### The three surfaces

| Surface | The question it answers | What it produces |
|---|---|---|
| **Tīrtha** (the journey) | What am I looking at, and what happened here? | Arrival aware context across four wisdom tiers, historical comparison imagery, a restrained quest layer |
| **Sākṣī** (the witness) | What does this look like today, compared with last time? | Aligned, dated, positioned photographs at fixed vantages, plus structured condition reports |
| **Dhamma** (the truth) | What do the sources actually say, and where? | Answers in Nepali or English carrying a canonical passage identifier, or an explicit refusal naming the missing evidence |

There is no Home, Explore, or Profile tab. Adding a fourth surface would require
an argument.

---

## 2. The three problems

### 2.1 The disconnect

A visitor standing in front of the Māyādevī Temple has three options for
understanding what they are looking at. They can read a weathered interpretive
board written for a general audience a decade ago. They can hire a guide, whose
quality is uneven and whose availability is seasonal. Or they can search the
internet, which returns a mixture of tourism marketing, devotional writing, and
confident summaries of uncertain provenance.

None of these is anchored to where the person is standing. None adapts to whether
this is their first visit or their fifth. None can tell them which claims are
archaeologically established and which are traditional.

The result is a specific kind of loss. A person travels a long way to a place of
genuine significance and leaves with a photograph and a vague impression. The
Ashokan pillar, which carries the inscription that identifies this site as the
birthplace, becomes a stone column in a queue. The material is extraordinary and
the encounter is thin, because nothing bridges the two at the moment the person
is actually there.

### 2.2 Heritage maintenance

The conservation problem is quieter and more serious. The monuments of the
Greater Lumbini Circuit are spread across a wide area, several of them excavated
brick structures exposed to monsoon, and the authorities responsible for them
have a small staff relative to the ground they cover. Condition assessment is
therefore episodic: a specialist survey happens, produces a report, and the next
one happens years later. Between those points there is no continuous record.

This matters because most heritage degradation is not dramatic. It is a crack
widening by millimetres a season, biological growth spreading across a brick
face, water pooling where drainage has silted up, and salt efflorescence
appearing after a wet year. These are visible to anyone who looks, and invisible
to anyone who is not comparing against a previous image from the same position.

Meanwhile several hundred thousand people a year photograph these monuments from
roughly the same spots, and none of that imagery is comparable, positioned, or
retained.

> **The specific gap.** There is no cheap, continuous, positionally comparable
> photographic record of the Lumbini monuments, despite an enormous volume of
> photography happening at them every day. The imagery exists. What is missing is
> the discipline of standing in the same place, the metadata to prove you did, and
> somewhere for it to go.

### 2.3 Misinformation

The third problem arrived recently and is getting worse. General purpose language
models answer questions about Buddhist doctrine and Lumbini's history fluently,
at length, and with no reliable signal of when they are reconstructing from
pattern rather than reporting from a source.

The failure modes are specific and damaging in this domain:

- They invent sutta references and attribute quotations to passages that do not
  contain them.
- They blend traditions, presenting a later Mahāyāna or Tibetan formulation as if
  it were an early Pāli teaching.
- They will adopt the voice of the Buddha and generate first person scripture on
  request.
- They are markedly worse in Nepali than in English, which means the people
  closest to the site get the least reliable answers.

For a religious and historical corpus this is not a quality of service issue. A
fabricated citation that looks like a real one is worse than a refusal, because
it is repeatable, quotable, and indistinguishable from a genuine reference to a
reader who does not have the canon open.

**Every safeguard in our knowledge surface is a response to a failure mode we
reproduced first.**

### The two problems underneath

Strip the three away and two engineering problems remain, and almost every design
decision in this document is downstream of them:

1. **Comparability.** How do you get an untrained person, holding a phone, to
   produce an image genuinely comparable to one taken months earlier by a
   stranger?
2. **Incentive corruption.** If you reward contribution, people optimise for the
   reward. If you pay more for finding damage, people will find damage whether or
   not it is there, and the dataset becomes worthless in a new way.

---

## 3. The solution and who it is for

### 3.1 The mechanism

The bridge between past and future in this application is a single mechanism used
three ways:

> **An attentive person, standing in a specific place, produces something
> durable.**

### 3.2 What each audience gives and receives

| Audience | What they get | What they contribute without extra effort |
|---|---|---|
| **Pilgrims** (international, devotional) | Context anchored to where they stand, deepening with return visits. Answers about doctrine that carry a verifiable citation. A practice register rather than a score. | A dated, positioned photograph of a monument, and any condition they noticed while looking closely. |
| **Tourists** (domestic, regional) | A guided route, historical comparison imagery that makes the ruins legible, and a reason to look carefully rather than photograph and move on. | The same photographic record, plus corroboration of reports other visitors filed. |
| **Heritage authorities** (LDT, municipalities, Department of Archaeology) | A continuous, positionally comparable condition record they did not have to staff, with structured reports triaged by severity and corroboration count. | Survey grade coordinates and vantage definitions, which is the one input only they can provide. |

The reciprocity matters to the design. We deliberately did not build a system
where the visitor is unpaid labour dressed as a game. The photographic
contribution is a by-product of an experience worth having on its own terms, and
the merit system that acknowledges it is explicitly non transferable, non
purchasable, and capped, so that it can never become the reason someone visits.

---

## 4. The charter: wisdom made operational

These are not metaphors bolted onto a feature list. Each one is enforced in code,
and each one is tested.

| Teaching | Made operational as |
|---|---|
| **Right view** | A citation validator. No claim reaches the reader without a source. |
| **Right speech** | A vocabulary linter that fails the build if engagement or gambling language reaches a screen. |
| **Non attachment** | A merit ledger with no transfer function, no expiry, and no purchase path. |
| **Mindfulness** | A stillness practice that requires the screen to be off. |
| **Testing claims (Kālāma)** | Every subsystem traces its claims to something checkable. |

### The five invariants

**1. Never fabricate a measurement or a finding.** If the app does not know a
number, that number is `null`. Never `0`, never a plausible guess. Zero means
"measured, and it was zero". Null means "not known". Confusing those two is how a
dataset silently becomes fiction.

**2. AI offers candidates, never verdicts.** The crack detector draws its boxes
with dashed lines on purpose. A dashed box means "look here", not "there is
damage here".

**3. Nothing is deleted from the record.** The merit ledger is append only.
Observations are not removed.

**4. Refusal is a feature.** When the sources do not support an answer, the engine
says so, without softening or hedging.

**5. Honesty about the record itself.** If a photo was framed by eye instead of
measured, the record says so, permanently.

> **The closing note from the submission document, which is the best single
> statement of the whole design:**
>
> A match by eye is not a sensor lock. A missing reading is not a zero. An uncited
> claim is not an answer. A detected crack is not a report until a person confirms
> it. A documentary coordinate is not a survey. Those are five separate mechanisms
> in five separate subsystems, and they are all the same decision, taken from the
> same instruction: do not accept a thing because it is said confidently. Test it,
> and see for yourself.

---

# Part II: How it is built

## 5. System architecture

### 5.1 A note on the stack, stated plainly

The hackathon submission template anticipates a Next.js and FastAPI web
application. Sākṣī is a native Android application, because its core features are
hardware features: camera, GPS, magnetometer, accelerometer, on-device inference,
and durable local storage. **A browser cannot deliver an alignment locked capture
with a compass reading attached.**

We do ship Next.js and Tailwind, for the public landing site. The knowledge
engine is a service the app calls, but it runs on **Node rather than Python**, so
that the identical engine file executes on the phone and on the server.

### 5.2 The layered architecture

```
┌──────────────────────────────────────────────────────────┐
│ app/                                          expo-router│
│ thin typed routes; a broken link fails the type check    │
├──────────────────────────────────────────────────────────┤
│ features/                                                │
│ tirtha · sakshi · dhamma · quests · chaityavali ·        │
│ practice · onboarding · leaderboard · settings           │
├──────────────────────────────────────────────────────────┤
│ components/                                              │
│ ui · chat · monk · observation · map · navigation        │
├──────────────────────────────────────────────────────────┤
│ store/ + hooks/                            React Context │
│ app state · permissions · quests · arrival · practice ·  │
│ preferences                                              │
├──────────────────────────────────────────────────────────┤
│ services/                                  21 boundaries │
│ THE ONLY LAYER PERMITTED TO TOUCH A DEVICE OR A SOCKET   │
│ sensors · camera · location · database · ai · dhamma ·   │
│ guide · sync · supabase · notifications · voice ·        │
│ offlineModel · leaderboard · integrity · permissions     │
├──────────────────────────────────────────────────────────┤
│ core/                                    pure TypeScript │
│ alignment · vision · dhamma · merit · map · quests ·     │
│ story · dana · progression · chaityavali · wisdom ·      │
│ session · guide · adapters · copy                        │
├──────────────────────────────────────────────────────────┤
│ shared/                        shared with the backend   │
│ geo · merit table · types                                │
├──────────────────────────────────────────────────────────┤
│ seed/ + data/ + SQLite                                   │
│ reviewable JSON compiled to typed constants · 8 versioned│
│ migrations · WAL mode                                    │
└──────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴────────────────────┐
        │           OUTSIDE THE APP              │
        │  Supabase: Postgres + RLS + storage +  │
        │            leaderboard, 8 migrations   │
        │  Knowledge API: Node service running   │
        │            the same core/dhamma        │
        │  Hosted model: OpenAI shaped chat      │
        │            completions                 │
        └────────────────────────────────────────┘
```

### 5.3 The rule that holds it together

**`core/` imports nothing from React, React Native, or the network.**

It computes. The app decides what to render and when to save. Imports go downward
only, and everything crosses through a single barrel module rather than reaching
into internal files, so the domain layer stays free to be reorganised.

This is not architectural fashion. It has three concrete payoffs:

1. **The whole domain layer is testable in plain Node.** 113 tests across 16 files
   run in under a second with no transpiler and no test framework.
2. **The same alignment and knowledge code runs on the phone and on the server.**
   The knowledge API is a Node service importing the very file the tests cover.
3. **The mistake it prevents is real.** Two important decisions (which detection
   becomes a report draft, and whether the screen says anything when the detector
   fails) once lived inside screen code where no test could reach them. The result
   was a trained, working model that appeared to users as a feature that had never
   been built.

Coordinates convert at the seam: the app speaks `latitude` and `longitude`, the
domain layer speaks `lat` and `lon`. `core/adapters/coords.ts` is that seam.

### 5.4 The folder map

| Folder | Rule | Contents |
|---|---|---|
| `shared/` | Pure, shared with backend | `geo.ts`, `merit.ts`, `types.ts` |
| `core/` | Pure, no services, no React | Every rule, formula, and policy |
| `types/` | Declarations only | The shape of the domain |
| `seed/` | Reviewable JSON | 12 sites, 6 vantages, 10 quests, 10 plates, 5 timeline, 3 needs |
| `data/` | Generated typed constants | Compiled from `seed/` by `tools/gen-data.mjs` |
| `services/` | The impure edge, 21 boundaries | Device, network, storage, AI |
| `store/` | React Context | Six providers of small global values |
| `components/` | Reusable UI, no domain knowledge | Buttons, cards, chat, monk cloud, overlays |
| `features/` | Screens, one folder per surface | Nine feature folders |
| `app/` | expo-router routes only | Thin files rendering a feature screen |
| `tools/` | Node scripts | Generation, validation, vocabulary lint, benchmark |
| `mock-api/` | Zero dependency Node service | The knowledge API harness |
| `patches/` | patch-package diffs | The onnxruntime fixes |

---

## 6. The complete tech stack

### 6.1 Component by component

| Component | What we shipped | Why, in one sentence |
|---|---|---|
| **Frontend** | Expo SDK 57, React Native 0.86.2, React 19.2.3, expo-router with typed routes | Every core feature is hardware bound, and typed routes turn a broken link into a compile error. |
| **Language** | TypeScript 6.0 | The domain layer is pure TypeScript, so it is testable in plain Node. |
| **Web presence** | Next.js 16, React 19, Tailwind CSS 4 | The public landing site, deployed independently of the app. |
| **Local database** | SQLite (expo-sqlite) in WAL mode, 8 versioned migrations | A photograph taken at a vantage on a given day cannot be retaken, so the device is the record. |
| **Cloud database** | Supabase, PostgreSQL, Row Level Security, 8 migrations | Real relational Postgres, with RLS as the actual protection so a publishable key in the bundle is safe by design. |
| **AI and logic service** | Zero dependency Node HTTP service importing the same `core/dhamma` the tests cover | Chosen over FastAPI so the engine that answers on the server is literally the file that runs on the phone. |
| **Retrieval** | Bilara segment aligned corpus, lexical plus semantic ranking fused by reciprocal rank | Usable recall over a deliberately narrow canon with no index server and no cold start. |
| **Mapping** | MapLibre GL Native, with a WebView implementation and a 3D site plan as fallbacks | Vector tiles, offline styling, no per view billing, and an open licence appropriate to a public trust. |
| **On-device vision** | ONNX Runtime, YOLOv8n crack detector, mAP50 0.8167 | Damage detection has to work in a garden with no signal, and the photograph should not have to leave the phone. |
| **On-device language** | llama.rn with Qwen3 0.6B Q4_K_M, 484 MB, downloaded and checksum verified rather than bundled | An answer with the radio switched off, without shipping half a gigabyte inside the APK. |
| **Animation** | react-native-reanimated 4.5.1, react-native-worklets | UI thread animation, and the reason the New Architecture cannot be disabled. |
| **Gestures** | react-native-gesture-handler 2.32 | The alignment rehearsal pan, and the then-and-now scrubber. |
| **Distribution** | EAS Build and EAS Update, runtime version pinned to app version | A JavaScript fix ships in seconds; a native change is forced through a new binary instead of crashing an old one. |

### 6.2 Choices we would defend, and the honest alternatives

| Decision | Why we chose it | The stronger alternative, honestly |
|---|---|---|
| **Expo over bare native** | Config plugins let us add MapLibre, ONNX Runtime, and llama.rn without hand maintaining an Android project, and EAS produces a signed build from a laptop. | Kotlin would win decisively on camera latency and sensor fusion, which is exactly where our hardest feature lives, at the cost of any iOS path. |
| **React Context over a store** | The genuinely global state is six providers of small values; the heavy state lives in SQLite and is queried, not held. | Zustand, and this is the closest call. Selector subscriptions would stop a provider that changes on every GPS tick from re-rendering a subtree. |
| **ONNX over TFLite** | It matched the export path straight out of the training notebook, and one runtime serves any future model. | LiteRT is faster on Android through mature GPU and NNAPI delegation, and is the upgrade when latency becomes the complaint. |
| **Rank fusion over embeddings** | Usable recall over a narrow canon with no index server, no embedding cost, and no cold start. | Real embeddings in pgvector would beat us on paraphrase and on Nepali. It is the first upgrade at ten times the corpus. |
| **Supabase over Firebase** | A conservation time series is relational, and PostGIS is one extension away when coordinates become survey grade. | Firebase is faster to wire and has the better turnkey offline SDK, and is weaker exactly where this domain is strong. |
| **An append only merit log** | The history is the record; balance, daily cap, and cooldown are all derived by reading rows, so they cannot drift out of step with a stored total. | This is also our answer to the blockchain question: merit is non transferable by construction, so the problem a distributed ledger solves never arises. |
| **Node over Python for the API** | The identical engine file executes on the phone and on the server, so they cannot disagree. | Python has the better ML ecosystem, which would matter if the server did inference. It does not; it calls a hosted model. |

---

## 7. Every dependency and why it is there

### Runtime and framework

| Package | Version | Role |
|---|---|---|
| `expo` | ~57.0.11 | The SDK and config plugin system |
| `react-native` | 0.86.2 | The runtime, New Architecture / bridgeless |
| `react`, `react-dom` | 19.2.3 | UI |
| `expo-router` | ~57.0.11 | File based typed routing |
| `typescript` | ~6.0.3 | Types |

### Device capability

| Package | Role in this app |
|---|---|
| `expo-camera` | The capture surface. Audio recording explicitly disabled. |
| `expo-location` | Position and GPS accuracy for the alignment score and geofences |
| `expo-sensors` | Magnetometer for heading, accelerometer for pitch and for the stillness detector |
| `expo-task-manager` | Background location tasks for arrival detection |
| `expo-notifications` | The arrival banner, suppressed inside consecrated zones |
| `expo-haptics` | The lock confirmation |
| `expo-image-manipulator` | Resizing a photograph before inference |
| `expo-image-picker` | Selecting an existing photo |
| `expo-file-system` | Model files, photographs, the offline model download |
| `expo-sqlite` | The local database |
| `expo-asset` | Resolving the bundled `.onnx` asset |
| `expo-audio`, `expo-speech` | Narration and text to speech |
| `expo-splash-screen`, `expo-font`, `expo-status-bar`, `expo-constants`, `expo-linking` | Shell |
| `expo-dev-client` | Development builds |
| `expo-updates` | Over the air JavaScript updates |

### The AI stack

| Package | Role |
|---|---|
| `onnxruntime-react-native` ^1.24.3 | Runs the YOLOv8n crack model on device |
| `jpeg-js` | Decodes the resized JPEG to raw pixels for the tensor |
| `base64-arraybuffer` | Converts base64 to bytes without a Node Buffer |
| `llama.rn` ^0.12.6 | Runs the quantised GGUF language model on device |

### UI and interaction

| Package | Role |
|---|---|
| `@maplibre/maplibre-react-native` ^11.3.6 | The vector map |
| `react-native-webview` 13.16.1 | The web map fallback and the 3D site plan |
| `react-native-reanimated` 4.5.1 | UI thread animation. **Requires the New Architecture.** |
| `react-native-worklets` 0.10.1 | Reanimated's worklet runtime |
| `react-native-gesture-handler` ~2.32 | The alignment rehearsal pan, the scrubber |
| `react-native-safe-area-context`, `react-native-screens` | Navigation primitives |
| `@expo-google-fonts/*` | Anek Devanagari for Nepali, IBM Plex Sans and Mono |
| `@expo/vector-icons` | Icons |

### Data and sync

| Package | Role |
|---|---|
| `@supabase/supabase-js` ^2.109 | Cloud sync and the leaderboard read |
| `@react-native-async-storage/async-storage` | Small preference values |

### Build tooling

| Package | Role |
|---|---|
| `patch-package` ^8.0.1 | Applies the onnxruntime fixes on every install, including on EAS |
| `postinstall-postinstall` | Makes `postinstall` run after `npm uninstall` too |
| `eslint`, `eslint-config-expo` | Linting |
| `@expo/ngrok` | Tunnelling for a device on a different network |

---

## 8. Content pipeline and provenance

**Content is never typed into components.** It lives as reviewable JSON, is
compiled into typed TypeScript constants by a generator, and is checked by a
validator before it can ship.

```
seed/*.json          reviewable, diffable, one author per change
     │
     ▼  npm run gen          (tools/gen-data.mjs)
data/*.generated.ts  typed constants the app imports
     │
     ▼  npm run validate     (tools/validate-seed.mjs)
OK, with warnings for documentary coordinates
     │
     ▼  startup              (services/integrity)
every site id referenced by a precinct, quest or vantage resolves
```

A change to a coordinate, an evidence tier, or a photography policy therefore
arrives as a diff with an author attached, which is the audit trail heritage
claims require.

### Coordinate provenance is a first class field

Five of the twelve sites carry coordinates marked `doc`, meaning documentary
rather than surveyed: Puskarini, Marker Stone, Vihara Remains, Tilaurakot, and
Ramagrama. **The validator warns about each of them on every build**, and the app
labels them rather than presenting them as survey grade.

This is the fifth invariant applied to geography. A documentary coordinate is not
a survey, and saying so costs us nothing except the appearance of precision we
have not earned.

### The startup integrity pass

`services/integrity/index.ts` verifies that every site identifier referenced
anywhere actually resolves. It exists because of a specific near miss described in
section 25. It **deliberately does not throw**: a dangling site id degrades one
feature, and taking the whole app down at launch over it would be a worse outcome
inflicted on users rather than on whoever introduced the bug. It reports loudly in
`__DEV__` and quietly in production.

### 8.1 Every piece of data, and where it came from

This is the full provenance of the product, one source at a time. The rule
across all of it is the charter rule: a source is a real, checkable publication
or artefact, nothing invented, and where a reading is contested the record says
so.

| Data | What it is | Source | Licence |
|---|---|---|---|
| Dhamma corpus | Canonical Buddhist passages, segment aligned | SuttaCentral `bilara-data` | CC0-1.0 (public domain) |
| Site descriptions and facts | 12 heritage sites | Authored from the cited source registry below | Own content |
| Site coordinates | 7 surveyed, 5 documentary | OpenStreetMap (7), documents (5, flagged) | ODbL (OSM) |
| Historical plates | 10 plates: photos, drawings, reconstructions | Mukherji 1901 (ASI), Wikimedia, own reconstructions | Public Domain / CC BY-SA 4.0 |
| Crack detector model | YOLOv8n weights | Trained by us on a public dataset | Own weights |
| Crack training images | 4,029 labelled crack images | Public `crack-seg` set via Ultralytics | Public dataset |
| Offline language model | Qwen3 0.6B Q4_K_M GGUF | Hugging Face (bartowski) | Apache-2.0 |
| Map tiles | Vector basemap | OpenFreeMap (OpenStreetMap data) | Open, no key |
| Map fonts (glyphs) | Label rendering | OpenFreeMap font stacks | Open |
| UI fonts | Anek Devanagari, IBM Plex Sans, IBM Plex Mono | Google Fonts | OFL |
| Crisis helplines | 3 verified Nepali numbers | Public helpline directories | Public |

Everything below expands one row.

### 8.2 The Dhamma corpus and its citations

The knowledge engine draws on a **segment aligned** slice of the Pali Canon from
**SuttaCentral's `bilara-data`**, fetched by `tools/fetch-bilara.mjs` from
`https://raw.githubusercontent.com/suttacentral/bilara-data/published` and frozen
into `core/dhamma/corpus.generated.ts`. Every passage carries its canonical
segment identifier (for example `dn16:6.7`), its Pali root, its English
translation, the translator, and the licence, so a reader can open the exact
segment on SuttaCentral and check it.

**Translations are by Bhikkhu Sujato, released CC0-1.0 (public domain).** That
licence is why we can ship the text inside the app and quote it in an answer
without restriction, and citing the translator is courtesy, not obligation.

The corpus is deliberately narrow. It is built on these texts:

| Sutta | Reference | What it anchors |
|---|---|---|
| Mahāparinibbāna Sutta | DN 16 | The Buddha's last days and last words; appamāda |
| Dhammacakkappavattana Sutta | SN 56.11 | The four noble truths and the eightfold path |
| Kālāma Sutta | AN 3.65 | Testing claims rather than accepting them on authority |
| (a discourse from) MN 63 | MN 63 | The unanswered questions; what the teaching is for |
| Dhammapada verses | Dhp 1 to 20 | The paired verses on mind and intention |
| AN 5.177 | AN 5.177 | Right livelihood, the trades to avoid |

Nepali questions are handled against this same English and Pali corpus through
query translation, not through a separate Nepali text set.

### 8.3 The source registry: heritage and Dhamma share one table

`data/demo/sources.ts` is the single citation registry. Heritage claims and
Dhamma answers both cite into it by id, so a reader learns one way of judging
evidence and uses it on both surfaces. Each record carries a `kind`, an
attribution, a date where known, a reference, and a `caveat` where the reading is
contested. The ten sources:

| Id | Title | Attribution | Kind |
|---|---|---|---|
| `rummindei-inscription` | Rummindei pillar inscription | Emperor Ashoka; tr. E. Hultzsch, 249 BCE | Inscription |
| `dn-16` | Mahāparinibbāna Sutta | Dīgha Nikāya 16, Pali Canon | Sutta |
| `sn-11-3` | Dhajagga Sutta | Saṃyutta Nikāya 11.3, Pali Canon | Sutta |
| `monier-williams` | A Sanskrit-English Dictionary | Monier Monier-Williams, 1899 | Commentary |
| `unesco-1997` | Lumbini World Heritage inscription | UNESCO World Heritage Centre, 1997 | Record |
| `ldt-excavation` | Maya Devi Temple excavation records | Lumbini Development Trust | Archaeological |
| `fuhrer-1896` | Rediscovery of the Ashokan pillar | Alois Anton Führer, 1896 | Archaeological |
| `ldt-conservation` | Sacred Garden conservation assessments | Lumbini Development Trust | Survey |
| `mukherji-1901` | Antiquities in the Tarai, Nepal | P. C. Mukherji, ASI Imperial Series XXVI/1 | Archaeological |

Two `caveat` fields are worth quoting, because they are the honesty rule working
on real data:

- **Führer (1896)** "was later discredited for fabrications elsewhere in his
  work. The pillar and its inscription have been independently confirmed many
  times since; his wider reporting has not." We cite him and warn about him in the
  same breath.
- **The two Lumbini Development Trust records** are marked as demonstration
  references: "Specific report titles, dates and plate numbers must be confirmed
  with the Trust before this ships." We do not present a placeholder as a verified
  citation.

The Mukherji 1901 report is public domain and available on the Internet Archive
(`archive.org/details/bub_gb_5iYXAAAAYAAJ`); it is the primary photographic record
of the site at its rediscovery.

### 8.4 The crack detector training data

The YOLOv8n crack model was trained on the **public `crack-seg` dataset, 4,029
labelled images**, downloaded automatically by Ultralytics during training. We
did not collect a dataset. The training run, its settings, and the honest
resulting accuracy (mAP50 0.8167) are documented in full in section 16 and are
reproducible from `docs/train-crack-seg.ipynb`.

The honesty note here matters: most public crack data is **single class**, so we
ship a good crack detector and report its accuracy unrounded rather than a bad
five class one. The model is not yet trained on Lumbini brick and sandstone
specifically; that is a Phase 1 roadmap item.

### 8.5 Historical plates: the then and now imagery

`seed/plates.json` holds 10 plates, and every one declares an evidence tier and a
licence so a reconstruction is never read as a photograph:

| Evidence tier | Count | Meaning |
|---|---|---|
| `historical_photograph` | 3 | A real historical photo. Nothing generated. |
| `survey_drawing` | 3 | A measured plan or facsimile from a survey. |
| `conditioned_reconstruction` | 4 | Image work, conditioned on a cited source, clearly labelled. |

The photographs and survey drawings come from **P. C. Mukherji's 1899 survey**
(published 1901, public domain), with some Wikimedia Commons material. The
reconstructions are our own, licensed CC BY-SA 4.0 and **labelled as
reconstructions in the UI**, never as photographs. Where a plate's source is not
yet resolved, its licence field literally says `pending`, so an unverified image
cannot silently ship as verified.

### 8.6 Everything else that is data

- **Offline language model:** Qwen3 0.6B Q4_K_M, a public **Apache-2.0**
  quantisation hosted on Hugging Face (bartowski). Downloaded into app-private
  storage, verified by byte count and MD5, never bundled. Details in section 18.
- **Map tiles:** **OpenFreeMap** (`tiles.openfreemap.org`), OpenStreetMap data on
  the OpenMapTiles schema, no API key and no per-view billing, which is why it
  suits a public trust. The map style itself (`theme/mapStyle.ts`) is ours.
- **Fonts:** Anek Devanagari (for Nepali), IBM Plex Sans and IBM Plex Mono, all
  from Google Fonts under the Open Font License. Devanagari is a first class
  citizen, not a fallback glyph.
- **Crisis helplines:** three verified Nepali numbers in
  `core/dhamma/reflection.ts` (`VERIFIED_NEPALI_HELPLINES`): the National Mental
  Health Helpline (TUTH), the Patan Hospital crisis line, and Nepal Police
  emergency services. These are surfaced by the distress override and are the one
  place the app gives a real-world number, so they are kept verified and few.
- **Timeline, quests, narration, needs:** authored seed content in `seed/`, each
  carrying its own `sources` array where it makes a historical claim, compiled and
  validated like everything else.

### 8.7 What we deliberately do not collect

Stated here because a data section that only lists what you gather is half the
picture. Sākṣī does not collect or sell visitor location traces, does not send
photographs off the device except through the user's own synced observations, and
holds the observation dataset for the heritage authority rather than for us (see
sections 13 and 23). The model provider key never ships in the app (section 14.2).

---

## 9. Databases: local and cloud

### 9.1 Local: SQLite

Configured with two pragmas that matter:

- `PRAGMA journal_mode = WAL`. Write ahead logging, so a read during a write does
  not block and a crash mid write does not corrupt the file.
- `PRAGMA foreign_keys = ON`. SQLite defaults this **off**, which surprises
  people. Without it a condition report can point at an observation that does not
  exist.

**Migrations** use `PRAGMA user_version`, an integer SQLite stores inside the
database file itself. On startup the code reads it and runs each migration above
that number in order, bumping the version after each. No migration library, no
extra table, and it works offline because it is entirely local. Eight versioned
migrations exist.

| Table | Holds |
|---|---|
| `observations` | Each capture: photo URI, vantage, all alignment numbers, and whether it was measured or framed by eye |
| `condition_reports` | Category, subtype, severity, note, position, photo, link to the observation, and `ai_assisted` |
| `merit_events` | The append only ledger |
| `site_visits` | Which sites were witnessed, on which distinct days |
| `quests` | Quest definitions |
| `quest_progress` | In flight state |
| `quest_completions` | Finished quests |
| `quest_submissions` | Evidence attached to a completion |

Condition report categories are fixed: **structural, biological, water, surface,
vegetation**, each with a subtype and a severity.

### 9.2 Cloud: Supabase

PostgreSQL with Row Level Security and eight migrations. RLS is the actual
protection, which is why a publishable anon key in the bundle is safe by design
rather than by obscurity.

Every observation is written to the device first and synchronised
opportunistically afterwards, through an offline queue of unsynced rows that is
retried when a network returns. A failed upload never loses a capture, because a
photograph taken at a vantage on a particular day cannot be retaken.

The leaderboard is computed **server side** from records that already synced
(migration `0008_leaderboard.sql`). There is no `submitScore` endpoint. Points
cannot be claimed, only earned by uploading work.

---

## 10. End to end workflows

### 10.1 The witness workflow, from walking up to synced

```
1  Walk toward a site
       └─ geofence watcher fires `enter` at radius r
       └─ arrival notification, unless the zone is consecrated
       └─ `dwell` fires after 60 continuous seconds inside
2  Open Sākṣī, choose a vantage
3  Hold the phone up
       └─ GPS      → distance from the vantage
       └─ compass  → heading delta
       └─ motion   → pitch delta
       └─ alignmentScore() computes sPos, sHead, sPitch, align, blockedBy
       └─ the reticle colour and the hint text both read from that one result
4  Reticle turns blue and locks, or you tap "match by eye"
       └─ lock:      verified = true,  align stored
       └─ by eye:    verified = false, and the record says so permanently
5  Capture
       └─ photo written to disk
       └─ row inserted into `observations` with every sensor value
       └─ a missing reading is stored as NULL, never as 0
6  Observation screen opens
       └─ the crack scan runs automatically, once, on device
       └─ dashed candidate boxes + summary card with real inference time
7  "File this as a report"
       └─ scanToSuggestion() builds a draft: category and subtype filled
       └─ ConditionSheet opens at severity, the first unanswered field
       └─ the human sets severity; the model never does
       └─ row inserted with ai_assisted = 1
8  Merit
       └─ awardResurvey / awardFirstReport, clipped to the daily cap
       └─ blocked by the 24 hour per vantage cooldown if applicable
9  Sync
       └─ both rows join the offline queue
       └─ retried when a network returns; the device stays the source of truth
```

**Nothing above step 9 needs a network.**

### 10.2 The knowledge workflow

```
Question (Nepali by default, English toggle)
       │
       ├─ distress / self harm detector ──► helplines, no retrieval at all
       │
       ├─ domain vocabulary gate ─────────► refusal: out of scope
       │
       ├─ impersonation / injection gate ─► refusal: names the Kālāma principle
       │
       ├─ scripted demo cache ────────────► instant cited answer
       │
       ├─ hybrid retrieval (BM25 + vector, fused by RRF, k = 60, top 4)
       │        │
       │        ├─ nothing retrieved ─────► refusal
       │        │
       │        └─ passages retrieved
       │                 │
       │                 ├─ provider reachable ──► synthesis from passages only
       │                 └─ no provider ─────────► deterministic assembled answer
       │                          │
       │                          ▼
       │                 citation validator
       │                 every claim maps to a retrieved segment id
       │                          │
       │                          ├─ uncitable ──► refusal, not a hedge
       │                          └─ valid ──────► answer with sources attached
```

**The bypass is the important edge.** A missing provider degrades the prose; it
never removes the citation. Every path out of this pipeline is either cited or a
refusal, which is why adversarial refusal can be reported as 100 percent rather
than as "usually".

---

# Part III: The three surfaces

## 11. Tīrtha, the journey

Tīrtha opens on a vector map of the Greater Lumbini Circuit with live position,
twelve seeded heritage sites, and their precinct groupings. Sites carry real
attributes rather than decorative ones: an evidence tier, a zone classification, a
photography policy (some areas of the Sacred Garden restrict or prohibit
photography, and the app enforces this rather than relying on signage), and a
geofence radius ranging from **thirty metres for the Ashokan pillar to forty five
metres for the temple**.

### Arrival detection with hysteresis

A naive radius test fires enter and exit repeatedly when a visitor stands near a
boundary with normal GPS jitter, producing a stream of notifications on
consecrated ground.

The fix is a **Schmitt trigger applied to geography**: `enter` fires at radius
`r`, `exit` only at `r × 1.15`. A separate `dwell` event fires after **sixty
continuous seconds** inside, which is what unlocks the deeper material.

The module is pure and holds no location subscription. The caller feeds positions
in through `update()`, which means the entire behaviour including the jitter case
is testable by passing a sequence of coordinates.

### Pradakṣiṇā tracking

Clockwise circumambulation is scored from the walked track by accumulating the
**signed angular sum** of the walker's bearing from the monument centroid.
Clockwise accumulates positive, which is why the shared `angleDiff` helper must
keep positive meaning clockwise.

Completion requires **at least 330 degrees clockwise with no more than 30 degrees
of reverse travel**.

Walking anticlockwise is **never treated as a failure**. It returns
`{ complete: false, teach: 'direction' }` so the app can give a gentle directional
hint. The practice is the point, and a scolding notification is not.

### Silence on consecrated ground

Inside a designated zone the app suppresses its own notifications. A device that
buzzes during someone else's prostration is a design failure regardless of what
the notification says.

### The tiered wisdom system

How much a place says depends on how much attention the visitor has given it.
This is a deliberate inversion of the usual pattern, where an app front loads
everything and hopes something is read.

| Tier | Unlocked by | What the place says |
|---|---|---|
| **Basic** | Arrival inside the geofence | Identification, date range, and the one fact that makes the place legible: what it is and why it is here |
| **Medium** | Dwell, or a completed observation | The site's own story beats: excavation history, what the evidence tier actually rests on, the Then and Now comparison |
| **High** | Repeat visits, quest completion, contributed observations | Epigraphic detail, contested interpretations stated as contested, source references, conservation status of the fabric |
| **Custom** | Asking | The on-site guide answers free form questions about the building in front of the visitor, in Nepali or English, at the depth they ask for |

The policy lives in `core/wisdom/` rather than inside a screen, because two
surfaces must agree about it: the site page you open deliberately, and the
notification that arrives unasked when you cross a geofence. If those disagree,
someone who chose `basic` gets a scriptural push notification, which is precisely
the intrusion the setting exists to prevent.

### The quest layer

Ten quests, categorised as survey, epigraphy, ecology, or monastic, each with a
difficulty, an estimated duration, an optional prerequisite, and an availability
window evaluated against proximity and time of day. Three mechanics are worth
naming.

**Observation riddles** give a hint on a wrong answer and never a penalty.

**Stillness** requires the screen off, low accelerometer variance, and presence
inside a geofence, all three at once, held for a target duration. Ten minutes at
the Puskarini with the phone face down. Break any one condition and the held time
resets. **Merit accrues while the app is not being used.** This is the quest that
gets a reaction, because it inverts what an app is for.

**The close ritual** offers a card after twenty minutes of continuous use inside
the Sacred Garden suggesting the session end:

> "You came here to see this place. We'll be here when you get back."

Leaving the zone resets the clock. It is the only feature in the application
designed to reduce its own usage, and it is the only honest expression of the
second noble truth that a piece of software can make.

---

## 12. Sākṣī, the witness

This is the module the project is named after and the reason the rest of it
exists.

**Fixed point rephotography** is an established conservation technique: return to
a defined viewpoint, reproduce the framing, and the difference between two images
becomes measurable rather than impressionistic. It is normally expensive because
it requires a trained surveyor to travel. Sākṣī makes it something an ordinary
visitor can do correctly, by moving the discipline into the device.

### 12.1 The alignment instrument

A **vantage** is a fixed viewpoint recorded in the seed data: a position, a
compass bearing, and tolerances.

```
align = 0.30 · sPos  +  0.50 · sHead  +  0.20 · sPitch
```

Each sub score is a linear falloff from perfect to zero at the tolerance
boundary, clamped to 0 to 1. For instance `sPos = clamp01(1 - distance /
tolerance)`.

**Heading carries the most weight, and that is the most important decision in this
system.** Being five metres off to the left produces a slightly different but
still comparable photograph. Facing thirty degrees the wrong way produces a
photograph of something else entirely. The weights encode which error actually
destroys comparability.

#### The lock gates

| Gate | Threshold | Why |
|---|---|---|
| Combined score | `align ≥ 0.75` | Overall quality |
| Heading floor | `sHead ≥ 0.5` | You can never lock while facing the wrong way |
| GPS accuracy | `≤ 15 m` | A worse fix cannot place the observer at all |
| Pitch tolerance | `10°` constant | A device limit, not a site one |

The heading floor is subtle and worth defending. A weighted sum alone can be
gamed: a perfect GPS fix and perfect tilt contribute 0.50 on their own, so a badly
wrong heading could creep toward the threshold. The floor blocks that.

But we deliberately did **not** use a strict `min()` across all three, which is
the obvious alternative. GPS is the noisiest axis, and a strict minimum lets a
momentarily poor fix veto an otherwise perfect alignment, which is maddening in
practice. The floor applies the hard rule to the axis that matters and lets the
weighted sum handle the rest.

#### Missing sensors degrade differently, on purpose

- **Missing position scores 0.** Required, not assumed.
- **Missing heading scores 0.** Required, not assumed.
- **Missing pitch scores 1.** Degrades to "assume level" rather than blocking.

Position and heading are the claim the record makes. Pitch is a refinement, and a
phone without a motion sensor should still be able to contribute.

#### Naming what is wrong

The score returns `blockedBy`, ordered to match what the person should fix first:
`gps`, then `heading`, then the weakest remaining axis. The on-screen hint reads
directly from it. Telling someone "not aligned" is useless. Telling them "turn
left" is an instrument.

#### One number, one truth

The alignment score is computed **once** and governs both the on-screen reticle
and whether the shutter unlocks. There is only ever one truth about how well
aligned a capture is, which is why the claim "median align score 0.86 across N
captures" is provably the same number the person saw at the moment of capture.

### 12.2 The honesty escape hatch

If conditions are bad you can still shoot. The capture is recorded as **framed by
eye, not measured against the vantage tolerance**, and the target reticle draws
dashed and sand coloured instead of solid blue.

That flag is permanent and it is the point. A conservator can filter the dataset
to measured captures only. Without the flag, one rough photo poisons the
comparability of everything around it. With it, a rough photo is still useful
context and is never mistaken for evidence.

### 12.3 Two comparison modes

**Then and Now** pairs a historical plate (archival photographs and documented
reconstructions, each carrying its evidence tier and licence provenance) against
modern imagery, presented through a scrubber. Where an honest alignment between an
archival plate and a modern frame is not possible, the app shows the pair
unaligned and says so rather than warping one to fit the other.

**The observation series** is the live product: every capture at a given vantage,
in date order, from the same position, so that change over a season is visible by
scrubbing rather than by argument.

### 12.4 Condition reports and corroboration

A condition report is structured, not free text. It carries a category
(structural, biological, water, surface, vegetation), a subtype, a severity, an
optional note, the photograph, the observer's real position, and a link to the
observation it came from. Reports are written to the device database immediately
and enter the same offline queue as the captures.

**Corroboration is a first class action.** A second visitor confirming an existing
report is worth recording, and is separately rewarded.

---

## 13. Merit, dāna, and the leaderboard

### 13.1 Two scoring systems, deliberately kept apart

Conflating them would undo the property the schema exists to preserve.

| | **Puṇya (merit)** | **Global leaderboard** |
|---|---|---|
| Lives | On the device, unsynced | In Postgres, global |
| Ranked | **Never.** There is no total shown as a score | Yes, openly competitive |
| Computed | Derived from an append only event log | Server side, from evidence that already synced |
| Transferable | No transfer function exists in the codebase | Not applicable |
| Anti-gaming | 200 per day cap; one merit earning resurvey per vantage per 24 hours; severity never scales a reward | There is no `submitScore` endpoint. Points cannot be claimed, only earned by uploading work |

### 13.2 The table

| Kind | Amount |
|---|---|
| Resurvey | 50 |
| Attention quest | 70 |
| Path quest | 40 |
| Contribution (translation, transcription, audio) | 30 |
| Corroboration | 25 |
| First report | 25 |
| **Daily cap** | **200** |

### 13.3 The six rules, each enforced in code

**1. Severity never scales reward.** `awardFirstReport()` does not take a severity
argument. It literally cannot pay more for worse damage. If it could, you would be
paying people to find damage, and they would find it whether or not it was there.
This single decision is what keeps the dataset trustworthy.

**2. One merit earning resurvey per vantage per user per 24 hours.** Enforced by a
cooldown checked against the ledger, not by a UI restriction.

**3. A resurvey pays 50 regardless of what it finds.** "Nothing has changed" is a
genuinely valuable observation, and paying less for it would quietly train people
to report only when something is wrong, biasing the entire record.

**4. The daily cap congratulates and stops.** At 200 the app says you have done
enough today. It does **not** nag and it does **not** hint at what you would earn
tomorrow. Past the cap a completion still records and awards zero. This is an
anti craving mechanic, and it is the design working against its own engagement
metrics.

**5. The ledger is append only.** Merit is never spent, never deducted, never
lost. Balance, daily cap, and cooldown are all derived by reading rows, so they
cannot drift out of step with a stored total.

**6. Directed dāna does not deduct.** Merit determines allocation against an
itemised, sponsor funded conservation need, and the sponsor's money moves directly
to the custodian. **The app never handles funds.** "Available to direct" is your
balance minus what you have already directed, computed as a view. The ledger stays
untouched, which is what stops merit becoming a currency.

### 13.4 Progression and the register

`core/progression/` computes wisdom and spiritual level **as a projection over the
existing ledger**, not as a parallel score. One source of truth, nothing to farm
separately.

**Chaityāvalī** is a register of the sites you have given darśana to, with your own
captures bound in. It is **not a collection**: no rarity, no completion
percentage, no "collect them all". `days_visited` counts distinct days a site was
witnessed and is deliberately **not a streak**, because breaking a streak must cost
nothing. Streaks manufacture anxiety, and anxiety at a pilgrimage site is the
opposite of the product.

---

# Part IV: The AI, in full

## 14. The AI overview, and online versus offline

There are **three separate AI systems** in this application, and they share no
code path. That separation is deliberate and it is load bearing.

| System | What it is | Where it runs | Can it refuse? |
|---|---|---|---|
| **Crack detector** | YOLOv8n vision model in ONNX | Always on device, never networked | Not applicable. It reports findings or none |
| **Dhamma engine** | Retrieval, gating, citation validation, optional synthesis | Server if configured, otherwise device | **Yes, and often** |
| **Tīrtha guide** | Free but bounded conversational guide | Server if configured, otherwise bundled text | **Never** |

Running the guide through the Dhamma engine was tried first and was instructive: a
visitor standing in front of a monastery asking "what is this building" received
*"I do not have enough reliable evidence to answer this confidently"* followed by
a reading list. A true sentence, and a useless one. **Grounding rules calibrated
for scripture are wrong for architecture**, so the guide is a separate voice with
its own limits, sharing no code path with the citation engine.

### 14.1 How the app reaches a server

There is exactly one setting: **`EXPO_PUBLIC_API_URL`**. Expo inlines any variable
beginning with `EXPO_PUBLIC_` into the JavaScript bundle **at build time**. When
present, the app makes ordinary `fetch` POST requests:

| Purpose | Endpoint |
|---|---|
| Dhamma question | `POST {API_URL}/dhamma/ask` |
| Reflection questions | `POST {API_URL}/dhamma/reflect/questions` |
| Reflection synthesis | `POST {API_URL}/dhamma/reflect` |
| Tīrtha guide | `POST {API_URL}/tirtha/guide` |

Each call uses an `AbortController` with a **30 second** timeout, deliberately
**longer than the server's own 20 second model deadline**.

That ordering is an invariant, not a preference. It was 12 seconds once, which
inverted the two budgets: the backend was still working on an answer it would have
returned at second eighteen when the app gave up at second twelve, fell back to
the on-device engine, and paid the model latency a second time. An outer deadline
shorter than the inner one cannot ever observe a slow success. It can only
manufacture failures.

### 14.2 The credential rule

`OLLAMA_API_KEY` has **no** `EXPO_PUBLIC_` prefix and never will. That prefix
means the value ships inside the APK where anyone can unzip and read it. The key
lives only in the backend environment. The phone knows a server URL and nothing
else.

### 14.3 What the current APK actually does

Checked directly:

- `.env.local` sets `EXPO_PUBLIC_API_URL` to a LAN address, but that file is
  gitignored so **EAS never receives it**.
- `eas.json` has no `env` block.
- `npx eas env:list --environment preview` returns **"No variables found"**.

Both services check `if (API_URL)` before doing anything, so every network call is
skipped. **The built APK runs fully on device, always.** That is a strength, and
it is also a claim you must not overstate on stage: in this build, answers do not
come from a server.

### 14.4 The complete online versus offline matrix

| Capability | With a configured server | With no server (current APK) | With no network at all |
|---|---|---|---|
| **Crack detection** | On device | On device | On device, identical |
| **Dhamma: scripted questions** | Server, cited | Device cache, instant, cited | Device cache, instant, cited |
| **Dhamma: other questions** | Server retrieval and synthesis | Device retrieval, deterministic assembled answer, cited | Same |
| **Dhamma: with local model downloaded** | Server preferred | Device retrieval, prose rewritten by Qwen3 from retrieved passages only | Same |
| **Dhamma refusals** | Identical | Identical | Identical |
| **Distress override** | Helplines, no retrieval | Helplines, no retrieval | Helplines, no retrieval |
| **Tīrtha guide** | Model reply, warm and specific | Site's own bundled description | Same |
| **Map** | Vector tiles | Cached or offline style | Cached or offline style |
| **Capture and alignment** | On device | On device | On device |
| **Reports and merit** | Written locally, queued | Written locally, queued | Written locally, queued |
| **Sync** | Immediate | Deferred | Deferred |
| **Leaderboard** | Live | Last fetched | Last fetched |

**The single most important row:** the refusal behaviour is identical in every
column. A missing provider degrades prose. It never removes a citation and never
turns a refusal into an answer.

---

## 15. The crack detector: the running system

### 15.1 Why the pipeline is written out by hand

The app was first scaffolded around `react-native-executorch`'s object detection
hook, which decodes YOLO output for you. The ExecuTorch `.pte` export is finicky,
so training produced a rock solid **ONNX** file instead.

`onnxruntime` hands back a **raw float tensor**, not detections. So every step the
hook would have hidden is written explicitly. That is inconvenient once and
testable forever, and it is why the decode is covered by the gate.

### 15.2 The full pipeline

```
photograph on disk
  │
  ├─► Image.getSize()                  measure the original, honestly
  │      └─ 0×0 → throw "could not be read", never a silent empty scan
  │
  ├─► letterbox(srcW, srcH, 640)       core/vision/letterbox.ts     PURE
  │      compute scale + padding to fit 640×640 without distortion
  │
  ├─► ImageManipulator.resize()        expo-image-manipulator
  │      aspect ratio preserved; grey padding added when packing
  │      saved as JPEG base64, compress 1
  │
  ├─► jpeg.decode()                    jpeg-js, useTArray
  │      → raw RGBA pixels
  │
  ├─► buildLetterboxedInput()          core/vision/letterbox.ts     PURE
  │      RGB → CHW float32, normalised, padded
  │      → new ort.Tensor('float32', input, [1, 3, 640, 640])
  │
  ├─► session.run()                    onnxruntime, wall clock timed
  │      → raw output tensor
  │
  ├─► decodeYolo(data, dims, 1, 0.35)  core/vision/yolo.ts          PURE
  │      per anchor: cx, cy, w, h + class scores
  │      score = best class probability; drop below 0.35
  │      → corner form boxes
  │
  ├─► nms(boxes, 0.45, max 50)         core/vision/yolo.ts          PURE
  │      keep highest, drop overlapping same-class, repeat
  │
  └─► undoLetterbox()                  core/vision/letterbox.ts     PURE
         map boxes back to original photograph pixels
         → { detections, imageW, imageH, inferenceMs }
```

Everything marked PURE runs in `npm test` on a laptop. The impure middle is three
library calls.

### 15.3 The details that are easy to get wrong

**Both tensor layouts.** Ultralytics exports either `[1, 4+numClasses, anchors]`
(channel major, the default) or its transpose. The decoder detects which from the
dims against the known class count, so an export in either layout decodes
correctly instead of producing silent garbage.

**NMS never crosses classes.** A crack overlapping moss is two findings, not one.
Only redundant copies of the same class are suppressed. NMS removes; it never
adds. Capped at 50 detections so a pathological frame cannot flood the UI.

**Loading the model by path first.** The `.onnx` asset is opened by local file
path, falling back to bytes. Reading an 11.7 MB file through base64 costs roughly
a 16 MB JavaScript string plus the decoded copy beside it, on a phone that is
simultaneously holding a camera preview. Bytes remain the fallback because path
formats differ across platforms while bytes are unambiguous.

**`assetBundlePatterns`** is set to `assets/**/*` in `app.json`, and `.onnx` is
registered in `metro.config.js` as a bundled asset extension, so the model is
explicitly pinned into the build rather than included by luck.

### 15.4 What the detector is not allowed to do

**It never sets severity.** `scanToSuggestion()` builds a report draft from what
was found, and `ConditionSheet` opens at the first unanswered field, which is
severity, because the model cannot know it. How urgent damage is is a human
judgment about consequences, not a visual property. A model that guessed it would
be asserting the one thing it cannot see.

Boxes are dashed. The summary card says candidates and shows the real inference
time and the honest mAP. The saved report carries `ai_assisted = 1`.

### 15.5 Saying so when it cannot run

`canScan()` treats `'error'` as **not** available. It used to return true, leaving
a scan control on screen that answered "the model is still loading" for as long as
the app stayed open.

When the detector cannot run, the screen states which case it is: no native
runtime in this build, model failed to load, or unsupported platform. Earlier this
rendered `null`, so a trained model that failed to load was indistinguishable from
a feature nobody had built.

> **The rule adopted afterwards:** every exit path from the detector must carry a
> reason string that reaches the screen, because honest-by-silence is
> indistinguishable from a feature that was never built.

---

## 16. YOLO: training, export, and the model

Everything in this section is reproducible from `docs/train-crack-seg.ipynb` and
documented in `docs/DAMAGE-MODEL.md`.

### 16.1 The model card

| Field | Value |
|---|---|
| Task | Detection (boxes), because the overlay draws boxes |
| Base model | `yolov8n.pt` (nano) |
| Dataset | Public `crack-seg` set, **4,029 images**, auto-downloaded by Ultralytics |
| Classes | 1: `crack` |
| Epochs | 80, with `patience=20` early stopping |
| Image size | 640 |
| Batch | 16 |
| Export | ONNX, `opset=12`, `simplify=True` |
| File | `assets/models/crack-seg.onnx`, 11.7 MB |
| **mAP50** | **0.8167** |
| Training hardware | Colab free T4 GPU, roughly 1.5 to 3 hours |

### 16.2 The training pipeline, step by step

**Step 0: confirm the GPU.** `!nvidia-smi` must print a Tesla T4. On CPU, 80
epochs takes all day.

**Step 1: install Ultralytics only.**

```python
!pip install -q -U ultralytics

import ultralytics, torch, torchvision
ultralytics.checks()
print('torch', torch.__version__, '| torchvision', torchvision.__version__)
# Guard: the exact op that fails on a torch/torchvision mismatch.
print('nms op OK →', torchvision.ops.nms)
```

**Do not install `executorch` here.** Its wheel drags in a torch build that
mismatches Colab's pre-compiled torchvision, which breaks torchvision's `nms` op
and kills training with `RuntimeError: operator torchvision::nms does not exist`.
The guard line above catches it before you waste an hour.

**Step 2: choose the task.**

```python
TASK   = 'detect'        # boxes only; matches the overlay
EPOCHS = 80
IMGSZ  = 640
DATA   = 'crack-seg.yaml'    # public 4,029-image set, auto-downloaded

BASE_MODEL = 'yolov8n.pt' if TASK == 'detect' else 'yolov8n-seg.pt'
RUN_NAME   = f'crack-{TASK}'
```

Segmentation would give masks the current UI would discard, so detection is the
simplest faithful match and exports most reliably.

**Step 3: train.**

```python
from ultralytics import YOLO

model = YOLO(BASE_MODEL)
results = model.train(
    task=TASK,
    data=DATA,
    epochs=EPOCHS,
    imgsz=IMGSZ,
    batch=16,
    patience=20,
    name=RUN_NAME,
    plots=True,
)
```

Weights land in `runs/<task>/<RUN_NAME>/weights/best.pt`.

**Step 4: read the honest mAP50.**

```python
from pathlib import Path

best = Path('runs') / TASK / RUN_NAME / 'weights' / 'best.pt'
assert best.exists(), f'No weights at {best} — did training finish?'

metrics  = YOLO(str(best)).val(data=DATA, imgsz=IMGSZ)
map50    = float(metrics.box.map50)   # box mAP@0.50 — what the UI shows
map5095  = float(metrics.box.map)     # mAP@0.50:0.95, reference only

print(f'  mAP50   = {map50:.4f}   ← paste into DAMAGE_MODEL.info.mAP50')
print(f'  mAP50-95= {map5095:.4f}   (reference only)')
```

> **Copy this number verbatim. Do not round it up.** This is the instruction in
> the notebook itself, and it is why the app shows `0.8167` rather than "over 80
> percent".

**Step 5: export to ONNX first, always.**

```python
m = YOLO(str(best))
path = m.export(format='onnx', imgsz=IMGSZ, opset=12, simplify=True)
shutil.copy(path, out / 'crack-seg.onnx')
shutil.copy(best, out / 'best.pt')      # keep weights to re-export later
```

ONNX is exported before anything risky is attempted, because the optional
ExecuTorch `.pte` export re-triggers the same torch/torchvision clash that breaks
training. Get the reliable file in hand first; if the `.pte` attempt corrupts the
session you have lost nothing.

**Step 6: sanity check on real images.**

```python
preds = YOLO(str(best)).predict(sample, imgsz=IMGSZ, conf=0.35, save=True)
```

This is proof the model actually detects cracks before it ships. The notebook says
plainly: if this is blank, do not drop it in and claim it works.

**Step 7: the model card is written automatically.**

```
Sakshi crack detector
task     : detect
base     : yolov8n.pt
dataset  : crack-seg.yaml (public crack set)
epochs   : 80 @ 640px
runtime  : onnx
mAP50    : 0.8167   <-- paste into DAMAGE_MODEL.info.mAP50
mAP50-95 : ...
file     : crack-seg.onnx
```

**Step 8: drop it into the app.** Place the file at
`assets/models/crack-seg.onnx` and set the config seam in
`services/ai/yoloEngine.ts`:

```ts
export const DAMAGE_MODEL = {
  source: require('../../assets/models/crack-seg.onnx'),
  info: {
    name: 'YOLOv8n crack detector',
    version: '0.1.0',
    classes: ['crack'],
    mAP50: 0.8167,
    runtime: 'onnx',
  },
};
```

Then rebuild, because the runtime is a native module and Expo Go cannot carry it.

### 16.3 Scoping honestly

> Most public crack data is **single class**. Ship a good crack detector rather
> than a bad five class one, and report mAP honestly. Do not claim conservator
> grade assessment.

That instruction is written into `docs/DAMAGE-MODEL.md` and it is why the app
detects one class well instead of five badly.

### 16.4 The runtime constants in the app

```
SCORE_THRESHOLD = 0.35     confidence floor for a candidate
IOU_THRESHOLD   = 0.45     NMS overlap threshold
INPUT_SIZE      = 640      matches IMGSZ at training time
maxDetections   = 50       flood protection
```

### 16.5 Swapping the runtime later

If a working `.pte` ever appears, **the only file that changes is
`services/ai/onnx.ts`.** The pure decode and geometry in `core/vision/` and the
entire UI stay put. That is what the guarded seam buys.

---

## 17. The Dhamma engine

This is the surface where an AI is most tempting to fake and most damaging to
fake.

### 17.1 The corpus, and why it is deliberately narrow

Built from **Bilara segment aligned texts**, which means every passage carries a
canonical identifier such as `dn16:6.7` or `sn56.11:4.2`. This is the load bearing
decision: a reader can open that exact segment and check us. A corpus of loose
paragraphs would make every downstream guarantee unverifiable.

The canon is anchored on:

- **Dhammacakkappavattana Sutta (SN 56.11)**, which sets out the four truths and
  the eightfold path
- **Mahāparinibbāna Sutta (DN 16)**
- **The Kālāma Sutta's** instruction on testing claims
- A small set of related discourses

The narrowness is the feature. A wide corpus invites the system to answer
questions it should decline, and every additional tradition admitted multiplies
the chance of a subtle attribution error that no reader will catch. We accept
refusals as the cost.

### 17.2 The four safeguards

**1. The grounding gate, before anything is generated.**

- A **domain vocabulary check** establishes whether the question is even in
  scope. This is deliberately not a numeric similarity threshold. A threshold on
  a weak match is exactly how confident nonsense gets produced. A vocabulary gate
  is crude, obvious, and cannot be argued with, which is what you want in the
  outer layer. It includes Devanagari stems so Nepali questions pass.
- A **prompt injection and impersonation check** catches "ignore your previous
  instructions", "answer as the Buddha in the first person", "secret teachings
  hidden from the monks", "verse 999", "never written down", requests for a
  password, comparative claims the canon does not support, and fabricated citation
  bait of the form "Buddha said [modern claim]. What sutta is this?"
- A **Nepali distress and self harm detector** bypasses the entire pipeline and
  returns verified helpline information, because that is not a retrieval problem
  and must not be handled as one.

The refusal names the Kālāma principle. That is not decoration: the Kālāma Sutta
is a canonical text about not accepting claims on authority, which makes it the
correct thing to cite when refusing to invent authority.

**2. Retrieval before generation, always.** The model never answers from its own
parameters. It is given retrieved passages and asked to write from them.

**3. The citation validator, after generation.** Every claim in the drafted answer
must map to a segment id that was actually retrieved. An answer that cannot be
validated **does not get softened or hedged. It becomes a refusal that names what
is missing.** This is what makes the refusal figures meaningful.

**4. A deterministic cited fallback.** If no model provider is reachable, the
engine assembles an answer directly from the retrieved passages. The prose is
plainer. **The citations are identical.** A missing API key degrades an answer; it
never fabricates one.

### 17.3 Hybrid retrieval and reciprocal rank fusion

Two independent retrievers run over the corpus:

- **BM25**, classic lexical scoring. Strong on exact terms and names.
- **Vector similarity**, term overlap with a tf-idf cosine proxy. Strong on
  meaning when the wording differs.

Their results are combined by **Reciprocal Rank Fusion**:

```
RRF(d) = 1 / (k + rank_bm25(d))  +  1 / (k + rank_vector(d))      k = 60
```

RRF fuses **ranks, not scores**, and that is precisely why it is the right choice
here. BM25 scores and cosine similarities are not on a comparable scale, and
normalising them is guesswork, whereas "third place" means the same thing in both
lists. The constant 60 is the standard value from the literature and dampens the
influence of the very top ranks so one confident retriever cannot dominate the
other.

Nepali queries are detected and translated before retrieval, so both retrievers
work against the same language as the corpus. Retrieval returns the top 4.

It runs identically inside the app and inside the backend, with no index server
and no cold start, because it is the same file.

### 17.4 The three tiers

| Tier | Meaning |
|---|---|
| `full_rag` | Retrieved, grounded, and synthesised |
| `cached_demo` | A precomputed scripted answer, cited, for dead venue wifi |
| `passages_only` | Retrieved passages returned raw, with zero generation |

`passages_only` exists as a floor. Even with no model available anywhere, the
surface can still show you the actual text and let you read it yourself. Degraded,
never dishonest.

### 17.5 The refusal, on screen

The reply is a refusal sentence plus a **Why**, in the user's language. We removed
the "collections searched" list and the suggestion chips that used to surround it,
because the machinery of the refusal was crowding out the refusal itself. The
sentence and the reason are the trust feature. The rest was furniture.

### 17.6 Reflection mode

Offered as a companion mode, framed as **inquiry rather than advice**: it asks
questions back rather than telling a person what to do, because the corpus does
not license personal counsel and the honest position is to say so.

Three to four tailored questions are generated from what the person shared, then a
synthesis. Every step falls back to the on-device engine rather than throwing.
This was once the one call in the trio that let a network failure escape, and it
is the **last** step of the conversation, so an unreachable backend produced
tailored questions, took all four answers, and then failed at the synthesis,
losing a reflection someone had just spent several minutes on. The engine that
would have answered was on the device the whole time.

A **synchronous distress guard** runs on every typed message, not only at the
server round trip, so a distress signal in a middle answer surfaces verified
helplines immediately.

### 17.7 The benchmark

`npm run eval:dhamma`, 50 questions in five categories, written to break our own
system.

| Category | Score | What it tests |
|---|---|---|
| Answerable | 18 / 18 | Questions the corpus genuinely supports |
| Adjacent | 10 / 10 | Near the corpus edge, where over-answering is the risk |
| Out of scope | 12 / 12 | Must refuse, and must say why |
| Adversarial | 6 / 6 | Injection and impersonation attempts |
| Nepali | 4 / 4 | Nepali intent handling, including the distress override |
| **Overall** | **50 / 50** | Refusal precision and recall, and citation hit rate |

Citations naming an unretrieved passage: **0**.

Adjacent is the hardest category and the one the submission document recorded a
lost point on, because it is where over-answering is most tempting. It has since
been fixed. Adversarial passes at 100 percent, which was a **mandatory gate rather
than a target**.

**Language parity:** Nepali is the default answer language, and hosted models are
markedly weaker in Nepali than English. Citations and source evidence are attached
identically in both languages, and the language toggle **re-requests the same
question** rather than machine translating an English answer, so a Nepali reader
is never given a translation of a claim that was only ever validated in English.

---

## 18. The offline language model

### 18.1 What it is

| Field | Value |
|---|---|
| Model | Qwen3 0.6B, Q4_K_M quantisation |
| File | `Qwen_Qwen3-0.6B-Q4_K_M.gguf` |
| Size | 484 MB |
| Source | Public Apache-2.0 quantisation hosted on Hugging Face (bartowski) |
| Verification | Expected byte count **and** MD5 |
| Storage | App private storage. **Never bundled in the APK.** |
| Runtime | `llama.rn` |

### 18.2 What it is allowed to do

It is given **only the retrieved passages** and asked to write from them. It
rephrases grounded material into better prose. It does not add knowledge, and it
cannot introduce a citation, because citations come from retrieval and are
validated afterwards regardless of which path produced the text.

If it is absent, not downloaded, or fails, the corpus answer stands unchanged and
still cited. The user loses prose quality and loses nothing else.

### 18.3 Why it is downloaded rather than bundled

484 MB inside an APK is not shippable. Downloading it makes the capability opt in,
which is also the honest framing: most users will never need it, because the
deterministic cited fallback already answers.

The Settings screen reports `unsupported` honestly when `llama.rn` is absent,
rather than appearing to offer a download that cannot work.

### 18.4 The bug that shaped the implementation

The first version verified the checksum to answer the question "is this file the
model", which meant **hashing 484 MB before every answer**, and a download that
failed at 90 percent restarted from zero.

The fix is a **resumable download** plus a **marker file written once after
verification succeeds**, so the question can be answered without re-reading the
file.

---

## 19. The Tīrtha guide and reflection

### 19.1 The two rules

The guide answers warmly and plainly, offers what is worth noticing, and suggests
where to walk next. Two rules survive from the charter, and only two:

1. **Never state a measurement, condition, or finding about the fabric of a
   monument.** That is Sākṣī's job, and Sākṣī measures rather than guesses.
2. **Never claim to be quoting a source.** Quoting is Dhamma's job, and Dhamma
   validates its citations.

Inside those limits it is free. **It never refuses and it never shows an error
card.**

### 19.2 The fallback chain

```
1. the backend           POST /tirtha/guide, if a URL is configured
2. a direct model call   only if a credential exists in this process
3. the site's own text   summary + description from seed/sites.json
4. a general line        when you are not at a known site
```

Step 3 is the important one. A guide that says "I could not reach the network" has
told the visitor about our infrastructure instead of about the place they are
standing in. The seed ships every site's own written description, so there is
always something true to say. **In the current APK this is the step that always
runs.**

Truncated model replies are trimmed back to the last complete sentence, and if
fewer than 40 characters survive the chain falls through. A severed sentence
presented as guidance is worse than saying nothing.

### 19.3 The presentation

The guide is not a chat log. It reuses the story mode **speech cloud**: the monk
lower left, a warm cloud with a tail, one exchange on screen at a time, revealed
with a typewriter effect, your question sitting quietly above it. No transcript,
no bubbles, no source list. A guide speaking to you is not a messaging app, and
the format says so.

### 19.4 Story mode

`core/story/` arranges a place's material as a sequence of beats: one short thing,
then NEXT, then the next. The whole design rests on one constraint: **it invents
nothing.** Every beat is a projection of material the app already holds and can
cite, from the site record, its facts table, the seed narration, and the canonical
passages `dhammaForSite` returns. A guide that improvised historical claims about
Lumbini would be the exact failure the Dhamma surface refuses, moved one screen
across.

---

## 20. The offline design philosophy

The application is **offline first by design**, for two reasons that are not about
convenience. The Sacred Garden has patchy signal. And a photograph taken at a
vantage on a particular day **cannot be retaken** if an upload fails.

### 20.1 The degradation ladder

Every AI surface degrades down a ladder, and each rung is a complete, honest
product rather than an error state.

**Crack detector**

```
native runtime present, model loads  →  full scan, dashed candidates
model fails to load                  →  a sentence saying so, manual report works
no native runtime in this build      →  a sentence saying so, manual report works
web                                  →  a sentence saying so, manual report works
```

**Dhamma**

```
server reachable                     →  server synthesis, cited
no server, local model downloaded    →  device retrieval, Qwen3 prose, cited
no server, no local model            →  device retrieval, deterministic prose, cited
scripted question                    →  instant cached answer, cited
retrieval finds nothing              →  refusal naming what is missing
passages_only mode                   →  raw passages, zero generation
```

**Guide**

```
server reachable                     →  a warm specific answer
no server                            →  the site's own description
not at a known site                  →  a general orienting line
```

### 20.2 The three rules that make it work

**1. Every optional native module is loaded through a guarded runtime `require`
that resolves to null.**

ONNX Runtime, llama.rn, MapLibre, speech, and notifications exist only in a build
that installed them. A static import of an absent package makes the bundler fail
to build **the entire application**: not the feature, the application, including
for a teammate who simply has not rebuilt yet, and including for an over the air
update landing on an older binary. The guarded require means one feature reports
an honest unsupported state and every other surface keeps running.

**2. The failure is recorded, not swallowed.**

`loadOptional()` catches the failure and **stores the message**, which
`onnxUnavailableReason` exports and the screen displays. A bare `catch` returning
null is how a working feature became invisible.

**3. Degradation never silently removes a guarantee.**

This is the subtle one, and it is the lesson from the environment variable bug in
section 25. A graceful degradation path **can hide a total outage of the thing
being degraded from**. The system did not fail; it fell through to the
deterministic fallback and returned a plausible, correctly cited answer every
time, which is precisely why nobody noticed the model was never called. We now
assert the provider path explicitly rather than inferring it from a good looking
answer, and the provider note is part of the response we check.

---

# Part V: Building and shipping

## 21. Expo, EAS, and the build system

### 21.1 App identity

| Field | Value |
|---|---|
| Name / slug | Sākṣī / `sakshi` |
| Android package | `org.lumbinix.sakshi` |
| Version | 0.1.0 |
| Runtime version | `0.1.0`, pinned explicitly |
| EAS project id | `e8454679-10b7-42cc-8961-95a421426705` |
| Update URL | `https://u.expo.dev/e8454679-...` |
| Asset bundle patterns | `assets/**/*` |
| Architecture | New Architecture, bridgeless (SDK 57 default) |

### 21.2 Config plugins

`android/` is **gitignored**. There is no checked in native project to drift out
of date. EAS regenerates it on every cloud build from `app.json` and its plugins:

```
expo-router, expo-font, expo-sqlite, expo-splash-screen,
expo-location    (with the permission sentence shown to the user),
expo-notifications (icon + colour),
expo-camera      (permission sentence; recordAudioAndroid: false),
expo-sensors     (motion permission sentence),
@maplibre/maplibre-react-native,
expo-audio,
onnxruntime-react-native,
expo-asset,
llama.rn
```

Android permissions requested: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`,
`CAMERA`. Nothing else.

The onnxruntime plugin adds `implementation project(':onnxruntime-react-native')`
to the app `build.gradle`, and autolinking supplies the corresponding
`settings.gradle` entry.

### 21.3 The build profiles

| Profile | Distribution | Output | Use |
|---|---|---|---|
| `development` | internal | Dev client | Day to day with Metro |
| `preview` | internal | **APK** | **The demo build. Install this.** |
| `production` | store | App bundle, auto increment | Submission |

```bash
npx eas build --profile preview --platform android
```

**Expo Go cannot run this app.** The map, the camera alignment, the ONNX runtime,
and llama.rn are all native.

### 21.4 patch-package, and why it must be committed

`postinstall` runs `patch-package`, which reapplies
`patches/onnxruntime-react-native+1.24.3.patch` on every install, **including on
EAS cloud builds**. Because EAS builds from committed git state, a patch that is
not committed never reaches the build.

The patch carries five fixes:

1. `android/build.gradle`: replaces a removed Gradle `VersionNumber` API with
   `REACT_NATIVE_MINOR_VERSION < 71`.
2. `lib/binding.ts`: the New Architecture module resolution fix.
3. `dist/commonjs/binding.js`: the same fix.
4. `dist/module/binding.js`: the same fix.
5. **`unimodule.json`: deleted**, so the package reaches React Native
   autolinking. Section 21.5 explains why this one is the difference between a
   detector that runs and one that does not.

### 21.5 The bridgeless bug, in full

This is worth understanding because it is a general React Native trap.

**Symptom.** `onnxruntime-react-native: Cannot read property 'install' of null`, on
a real EAS cloud build, on a real device.

**Cause.** `onnxruntime` resolves its native module at **import** time with
`NativeModules.Onnxruntime`, then immediately calls `.install()` on it.
`OnnxruntimeModule` is a legacy `ReactContextBaseJavaModule` registered through a
`ReactPackage`. Under bridgeless there is no classic native module registry, so
that lookup returns `null`. Legacy modules remain reachable through the
**TurboModule interop layer**, so the fix is a fallback to
`TurboModuleRegistry.get('Onnxruntime')`.

The New Architecture cannot simply be turned off, because
`react-native-reanimated` 4 requires it.

**The trap, which cost a full build cycle.** The first fix was applied to
`dist/binding.js`, and **that file is never loaded**. The package's `package.json`
declares `"react-native": "lib/index"`, and Metro's default `resolverMainFields`
checks `react-native` **before** `main`. The app bundles `lib/binding.ts`, the
TypeScript source. The patch was correct and sitting in a file that never ran.

> **The general lesson: when patching a node module for React Native, check which
> entry point Metro actually resolves.** `main`, `module`, and `react-native` can
> point at three different builds of the same code.

The patched code now also throws a **descriptive** error when the module is
genuinely absent, instead of dereferencing null. That mattered, because it turned
out there was a second, independent bug underneath.

### 21.6 The autolinking bug underneath it

With the resolution fixed, the device stopped saying "cannot read property
'install' of null" and started saying *"The Onnxruntime native module is not
registered"*. That is a different claim, and it was true: both registries returned
null because the package really was not registered.

**The cause.** `onnxruntime-react-native` ships a legacy `unimodule.json`. Expo's
autolinking reads that file and claims the package as an Expo module. Confirmed
directly with `npx expo-modules-autolinking search -p android`, which returned:

```text
'onnxruntime-react-native': {
  config: ExpoModuleConfig {
    rawConfig: { name: 'onnxruntime-react-native', platforms: ['ios','android'] }
  }
}
```

Note what is missing: there is **no `android.modules` list**, because this package
is not an Expo module at all. It provides a plain `ReactPackage`. So Expo
registers **zero** native modules from it.

And because Expo has claimed the package, it is **excluded from React Native CLI
autolinking**. `npx expo-modules-autolinking react-native-config -p android`
contained zero occurrences of onnxruntime.

The result is the worst of both worlds and explains every symptom exactly. The
Gradle project is included, the AAR compiles into the APK, the build succeeds, and
`OnnxruntimePackage` is never written into `PackageList.java`, so nothing ever
instantiates it and no registry can find it.

**The fix** is to delete `unimodule.json`, which makes Expo stop claiming the
package so React Native's own autolinking picks it up normally. Verified from a
clean install:

| Check | Before | After |
|---|---|---|
| Expo claims the package | yes | **no** |
| RN config emits `new OnnxruntimePackage()` | no | **yes** |
| `import ai.onnxruntime.reactnative.OnnxruntimePackage;` | absent | **present** |

Those last two lines are what generate `PackageList.java`.

> **The general lesson: in an Expo app, a package that is claimed by Expo
> autolinking is excluded from React Native autolinking.** If it is not really an
> Expo module, that exclusion silently unregisters it while the build stays green.
> A successful Gradle build proves the code compiled, not that the module was
> registered.

### 21.7 EAS Update

Runtime version is pinned to the app version. A JavaScript fix ships in seconds
over the air. A native change cannot be pushed over the air; it is forced through
a new binary instead of crashing an old one.

### 21.8 Environment variables

| Variable | Where it belongs | Shipped in the APK? |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Expo environment | Yes, it is only a URL |
| `EXPO_PUBLIC_SUPABASE_URL` / `_KEY` | Expo environment | Yes, RLS is the protection |
| `OLLAMA_API_KEY` | **Backend only** | **Never** |
| `PORT`, `FLICKR_API_KEY`, `MAPILLARY_TOKEN` | Tooling only | No |

`.env.local` is gitignored and must never be committed. To set a value for a cloud
build it has to go into the EAS environment:

```bash
npx eas env:create --environment preview
npx eas env:list  --environment preview
```

---

## 22. The verify gate and test strategy

One command has to pass before anything is committed:

```bash
rm -f .expo/types/router.d.ts && npm run verify
```

| Stage | Command | Result today |
|---|---|---|
| Type safety, including typed routes | `tsc --noEmit` | **CLEAN** |
| Domain logic, 16 test files | `npm test` | **113 / 113** in 773 ms |
| Seed content and coordinate provenance | `npm run validate` | **OK, 5 warnings** (the documentary coordinates) |
| Product vocabulary and typography | `npm run vocab` | **CLEAN** |
| Knowledge benchmark, 50 questions | `npm run eval:dhamma` | **50 / 50** |

### Why there is no test framework

The domain layer is pure TypeScript, so 113 tests across 16 files run in about two
seconds in plain Node with **no transpiler and no test framework**. That is a
direct dividend of the purity rule, and it is why the gate is cheap enough to run
on every commit.

### The vocabulary linter

Unusual enough to explain. It fails the build if engagement, gambling, or game
vocabulary reaches a user facing string. It also bans em dashes in UI copy,
because an em dash in interface text is almost always a sentence that should have
been two sentences, and it bans domain jargon leaking into `core/`.

That is how a product principle stays true at the fiftieth commit rather than only
in the README, **and it caught real drift during the hackathon.**

### What tests do not cover

Unit tests prove domain logic and nothing at all about a compass in a garden. See
section 24.

---

# Part VI: The honest record

## 23. Business model

Nothing in the revenue model touches the merit system. Puṇya has no purchase path,
and adding one would break the property it exists to hold.

### 23.1 Target audience

| Segment | Scale | What they are paying for, if anything |
|---|---|---|
| International pilgrims | Large, seasonal, high intent | Depth and trustworthiness. Already pays for guides, and unusually sensitive to whether a claim is sourced |
| Domestic and regional travellers | The largest group by headcount | Little or nothing. This tier must stay free and must work on a mid-range Android phone with poor connectivity |
| Heritage authorities | LDT, municipalities, Department of Archaeology | A continuous condition record and a triage dashboard they would otherwise have to staff |
| Institutions | Universities, conservation NGOs, monastic bodies | Access to the longitudinal dataset, and the ability to define their own vantages |

### 23.2 Revenue streams

**Freemium tiers on Tīrtha.** The free tier is not a demo. It carries the full
map, arrival detection, basic and medium wisdom, the complete witness workflow,
and unrestricted use of the knowledge surface. This is a deliberate constraint:
the conservation value of the product depends on the volume of observations, so
anything that reduces the number of people capturing is self defeating. The paid
tier sells **depth, not access**: curated multi-day routes across the Greater
Lumbini Circuit, offline map and narration bundles, the high wisdom tier with its
epigraphic and source detail, and multilingual audio guides. A guided circuit pass
sold seasonally to international visitors is the realistic first revenue line.

**B2G licensing on Sākṣī. This is the durable business.** The civic dashboard is
licensed per municipality or per heritage authority: the condition register,
severity and corroboration triage, the observation time series at each vantage,
exports as CSV and GeoJSON, and CRM shaped output for whatever case system the
authority already runs. The pricing argument is straightforward, because the
counterfactual is a commissioned survey. A licence that costs a fraction of one
specialist survey and produces a continuous record instead of a single snapshot is
an easy comparison, and it is made against a budget line that already exists.

**Ethical B2B sponsorship.** Named restoration and conservation needs can be
sponsored by institutions, monastic bodies, and businesses, with acknowledgement
rendered as a line in a register rather than as advertising placed between a
visitor and a monument. Three rules hold: no interstitials, no sponsored content
inside the knowledge surface, and no sponsor influence on what the condition data
says. The directed dāna mechanism already models allocation against named needs in
the codebase without moving real money, so the shape of this is built and the
payments integration is deferred rather than the concept being speculative.

> **What we will not sell.** Visitor location traces. Merit points or any in-app
> currency. Ranking positions on the leaderboard. Placement inside a Dhamma
> answer. Each of these would generate revenue and each would destroy the property
> that makes the corresponding feature worth having. The condition dataset is
> licensed to authorities and researchers, and the underlying observation record
> belongs to the heritage authority, not to us.

### 23.3 The impact metric

The headline metric is **monitored vantage coverage**: the number of established
viewpoints receiving at least one aligned capture per month, and the median
interval between captures at each. That single number is the difference between an
episodic survey regime and a continuous one, and it is the number a heritage
authority can act on.

Secondary metrics follow from it: time from a condition first appearing in imagery
to a report being filed, corroboration rate, and the proportion of reports that
reach a resolution.

The benefit to the local ecosystem in Nepal is meant to be **structural rather
than charitable**. The dataset is generated in Nepal, held for the authority
responsible for the site, and licensed on terms that keep it there. Content
production, meaning narration, translation into Nepali and regional languages, and
transcription, is work that is credited and compensable, and the merit system
already recognises contribution as a distinct earning category. Local guides are
complemented rather than displaced: the app handles the material a guide should
not have to repeat forty times a day, and directs paid demand toward the depth
only a person can provide.

Above all, a heritage authority that can see a crack widening across six months of
comparable photographs can intervene while the intervention is still cheap, which
is the whole economic argument for preventive conservation.

---

## 24. Honest limitations

We keep this list explicitly so that nothing in this document overstates the
position. Unit tests prove domain logic and nothing at all about a compass in a
garden.

### 24.1 Implemented but not yet proven

| Claim | Status | Why it is open |
|---|---|---|
| Camera, GPS and compass at Lumbini | **DEVICE ONLY** | Calibration and GPS accuracy under tree cover are field facts, not test facts |
| Live sync to a provisioned cloud project | **UNCONFIGURED** | Client and migrations exist; an end to end run against a live project with RLS enabled has not been done |
| Full offline behaviour in airplane mode | **UNTESTED** | Needs the exact build on the exact device with the radio off |
| iOS, anything at all | **NEVER BUILT** | No credentials and no build has ever run. Android only, and we say so rather than implying parity |
| Five site coordinates | **DOCUMENTARY** | Puskarini, Marker Stone, Vihara Remains, Tilaurakot and Ramagrama are documentary, not surveyed. The validator warns on every build |
| Provider key handling | **KNOWN DEFECT** | The code accepts a public-prefixed key fallback, which would be inlined into the bundle and readable by anyone with the APK. Acceptable only for a scoped, rotatable demo key. In the current build no key is set at all, so it is not exploited, but moving it behind the service is the first roadmap item |
| Device and end to end test coverage | **ABSENT** | The paths most likely to fail on stage are the ones with no automated coverage |

### 24.2 Product and model limits

**The detector finds one class.** Cracks only. Not moss, spalling, salt damage, or
vandalism. The pipeline is multi class throughout (NMS already keeps classes
separate), so this is a training data problem, not an architecture problem.

**mAP50 0.8167 means it is wrong sometimes.** Roughly one in five detections at
that threshold will not be right. This is exactly why boxes are dashed and why a
human confirms severity. A single class model at 0.82 demonstrates the pipeline;
**it is not yet a conservation instrument**, and it needs retraining on Lumbini
brick and sandstone specifically.

**The Dhamma corpus is small and narrow by choice.** It refuses a great deal. It is
not a general Buddhism assistant and does not pretend to be.

**Vector retrieval is a proxy**, using term overlap with a tf-idf cosine
approximation rather than learned embeddings. Real embeddings would improve recall
on paraphrase and on Nepali. RRF was chosen partly because it makes swapping in a
real vector index a drop in change.

**Vantages are seeded, not user created.** Six exist, and they are not yet
established survey grade viewpoints. Letting visitors define new vantages needs a
moderation story we have not built.

**The current build never calls the backend**, by configuration. Everything works,
but the live model path is not exercised.

**GPS indoors and near tall structures is poor.** The 15 metre gate will sometimes
refuse to lock where a person reasonably expects it to. Framing by eye is the
designed escape hatch, and it is flagged.

**The demo service deserves the same candour.** Most of its mutable state is in
memory, it authenticates nobody, and it should be deleted the day a real API
exists. It is a harness that lets the whole offline queue path be exercised on
venue wifi with no install step, and it is not infrastructure.

**Speech recognition was removed** from Dhamma, which took a native module out of
the build. Text to speech remains everywhere.

---

## 25. Bugs we shipped and then fixed

Each of these is a bug we shipped and then fixed, not a hypothetical. The fixes
are all in the repository history.

### The environment variable that was never read

The knowledge engine read its provider key from an unprefixed environment
variable. Expo only inlines variables carrying the public prefix into the
JavaScript bundle, so on every physical device the key was `undefined` and **the
model provider was never called at all**.

The system did not fail. It fell through to the deterministic cited fallback and
returned a plausible, correctly cited answer every time, which is precisely why
nobody noticed.

> **A graceful degradation path can hide a total outage of the thing being
> degraded from.**

We now assert the provider path explicitly rather than inferring it from a good
looking answer, and the provider note is part of the response we check.

### A damage detector that invented its own findings

The first version of the on-device damage detector **hashed the image filename**
into deterministic bounding boxes, confidence scores, and a "surface integrity"
percentage. It looked convincing in a demo and it was fabrication.

We replaced it with a real YOLOv8 detector exported to ONNX. The runtime returns a
raw tensor, so the letterboxing, decoding, non-maximum suppression, and mapping
back to original photograph pixels are all explicit pure functions with their own
tests rather than hidden inside a helper.

The rule adopted afterwards: **every exit path from the detector must carry a
reason string that reaches the screen**, because honest-by-silence is
indistinguishable from a feature that was never built.

### The rename that broke arrivals without breaking anything

A parallel branch migrated the site list onto generated seed data and renamed
identifiers on the way: `ashoka-pillar` became `ashokan-pillar`, `puskarini-pond`
became `puskarini`, and two sites were dropped.

Nothing in the type system noticed. The site lookup returned `undefined`, every
caller skipped it, and **arrivals silently stopped firing across three quarters of
the Sacred Garden while continuing to look like they worked. Git was perfectly
satisfied.**

We now run a referential integrity pass over the content at startup that fails
loudly when a precinct, quest, or vantage references a site that does not resolve.

### Half a gigabyte, rehashed on every question

Described in section 18.4. Fixed with a resumable download plus a marker file
written once after verification.

### Optional native modules and the bundler

A static import of an absent native package makes the bundler fail to build the
entire application, not just the feature. Every optional native module is now
loaded through a guarded runtime require that resolves to null.

### Geofence chatter

A naive radius test fired enter and exit repeatedly with normal GPS jitter,
producing a stream of notifications on consecrated ground. Hysteresis solved it:
enter at the radius, exit only at 1.15 times the radius, with a dwell timer for
events that should require actually staying.

### The onnxruntime bug, which was three bugs

Described in full in sections 21.5 and 21.6. It took three separate fixes and each
one exposed the next, which is why the same symptom survived two rebuilds.

1. **Resolution.** Under bridgeless, `NativeModules.Onnxruntime` is null for a
   legacy module. It needs `TurboModuleRegistry`.
2. **The wrong file.** The first fix was applied to `dist/binding.js`, which Metro
   never loads, because the package declares `"react-native": "lib/index"` and
   Metro checks that field before `main`.
3. **Registration.** The package's `unimodule.json` made Expo autolinking claim
   it, which excluded it from React Native autolinking, so `OnnxruntimePackage`
   never reached `PackageList.java`. The AAR was in the APK the whole time and
   nothing instantiated it.

The reason the third bug was findable at all is fix 1's descriptive error. When
the code stopped dereferencing null and started saying *"the native module is not
registered"*, it named the real problem. A `catch` that returns null would have
left all three looking identical.

### The onboarding permission that could never be tapped

The onboarding frame drew its body as a fixed `flex: 1` view with no scrolling.
The permissions step carries **four** cards, and the fourth was rendered past the
bottom edge of that box. On Android a view drawn outside its parent's bounds
receives no touches at all, so the Notifications "Allow" button was visible and
dead.

The body now scrolls, with the content container still growing to fill and centre
so short steps are unchanged. Scrolling is switched **off** for the alignment
rehearsal step, because that screen owns a vertical pan gesture a scroll view
would otherwise swallow.

---

## 26. Roadmap

### Phase 1: immediate, a pilot in the Greater Lumbini Circuit

The goal of this phase is not new features. It is to make the existing path
trustworthy enough that a heritage authority can rely on what comes out of it.

1. **Move the model provider key behind the service.** One environment variable
   and one request path. This closes the only genuine security defect in the
   current build and it is the first thing we do.
2. **Replace the demo service with a real API.** Authentication, durable storage,
   rate limiting, and monitoring, then delete the harness rather than letting it
   drift into production by accident.
3. **Establish survey grade vantages with the Lumbini Development Trust.** This is
   the input only they can provide, and it is what converts the app from a
   prototype into an instrument. Until both the coordinates and the vantages are
   fixed, the app should keep saying so on screen.
4. **Field test on the actual ground.** GPS accuracy under tree cover in the
   Sacred Garden, compass calibration, capture in bright daylight, and the
   complete flow in airplane mode.
5. **Add device level test coverage** for the capture, permission, and offline
   flows, since that is where a live failure will come from.
6. **Retrain the crack detector** on Lumbini brick and sandstone specifically.
7. **Run a bounded pilot**: a defined set of vantages, a small cohort of repeat
   observers, and a monthly report to the Trust, so the impact metric has a real
   baseline.

### Phase 2: mid-term, the civic dashboard beyond Lumbini

- **Municipal onboarding.** A heritage officer defines their own sites, vantages,
  and geofences without an engineer, which is the precondition for the product
  working anywhere we are not personally standing.
- **Triage and workflow.** Reports ranked by severity, corroboration count, and
  rate of change; assignment, resolution, and a resolved-condition record so the
  register shows repair as well as damage.
- **Change detection across the series.** Automatic flagging when consecutive
  captures at the same vantage differ beyond a threshold, which turns the archive
  from a lookup into an alert.
- **Data custody and export.** Formal agreements placing the observation record
  with the heritage authority, plus CSV, GeoJSON, and CRM shaped export.
- **Migrate retrieval to real embeddings** in pgvector as the corpus outgrows rank
  fusion, and move the hosted model to a provider materially stronger in Nepali.
  The latter is a single file change through an existing seam.
- **iOS.** Not begun, and honestly out of reach until Phase 1 is complete.

### Phase 3: long-term, the Kathmandu Valley Circuit

- **Scale to the Valley.** Swayambhunath, Boudhanath, Pashupatinath, and the three
  Durbar Squares, which are denser, more contested, and under far heavier visitor
  pressure than Lumbini. Post-2015 reconstruction makes a continuous photographic
  record particularly valuable there.
- **Multilingual audio guides.** Nepali, English, Hindi, Chinese, Japanese,
  Korean, Thai, Sinhala, and Burmese, matching actual pilgrimage traffic. Recorded
  by people rather than synthesised where the material is devotional, and credited
  as contribution work.
- **Open the dataset for research.** A longitudinal, positionally consistent
  photographic archive of South Asian heritage monuments is a genuinely novel
  research asset. Licensed openly for academic use, held in Nepal.
- **A vantage standard others can adopt.** The alignment scoring, the metadata
  schema, and the honesty rules generalise well beyond Buddhist heritage, and are
  more valuable as a published specification than as our private implementation.

---

## 27. The team

Four members, LumbiniX Committee, Nepal.

**Aaditya Sapkota**, AI Backend Engineer. Owns the knowledge engine end to end:
the Bilara corpus loader, hybrid retrieval and reciprocal rank fusion, the
grounding gate, the citation validator, the deterministic fallback, and the 50
question adversarial benchmark. Also responsible for the on-device inference path,
covering the ONNX vision runtime and the quantised offline language model.

**Binayak Gautam**, 3D Rendering and Frontend Engineer. Owns the visual surface:
the MapLibre implementation with its native, web, and 3D site plan variants,
monument massing and site plans, the Then and Now comparison and scrubber, the
capture and alignment reticle, and the theme and component system that keeps
colour and type out of individual screens.

**Nabin Poudel**, Research and Documentation. Owns content authenticity: site
research, evidence tiers and coordinate provenance, historical plate licensing,
the canonical corpus selection and its narrowness, Nepali language review, and the
submission document. Also maintains the seed validator warnings that keep
documentary coordinates from being presented as surveyed.

**Siddanta Sodari**, Full Stack Developer. Owns the application architecture and
the platform: the layered structure and its purity rule, the SQLite schema and
migrations, the offline queue and cloud sync, permissions and sensor boundaries,
the alignment scoring and merit systems, the demo service, the landing site, and
the EAS build and update pipeline.

### Links

| | |
|---|---|
| Repository | `github.com/LumbiniX-Committee/Everest` |
| Live build | `application-a925ec89-66ca-48ae-a9c8-744067a46082.apk` |
| Demo video | `drive.google.com/drive/folders/1by7PGKVBpTmufWhx-YoBqBDkdZ02BofS` |

---

## 28. Questions you will be asked

**"Isn't this just crowdsourced photos?"**
No. Crowdsourced photos are not comparable and therefore are not evidence. The
alignment instrument is the entire product. Remove it and you have a photo album.

**"What stops people gaming the merit system?"**
Severity does not scale reward, so there is no incentive to exaggerate. Resurvey
pays the same whether or not anything changed, so there is no incentive to invent
change. The daily cap stops grinding. There is no transfer function and no
purchase path. Leaderboard points are computed server side from uploaded evidence,
and there is no `submitScore` endpoint at all.

**"How do I know the AI isn't making things up?"**
Three independent mechanisms. Citations are validated against what was actually
retrieved, currently zero violations across 50 benchmark cases. The engine refuses
rather than guessing, and you can watch it refuse live. The detector marks its
output as candidates and displays its true accuracy unrounded.

**"Why not use a general LLM for the knowledge surface?"**
Because we reproduced its failure modes first. Invented sutta references, blended
traditions, first person scripture on request, and markedly worse Nepali. A
fabricated citation that looks real is worse than a refusal because it is
repeatable and quotable.

**"Why Node instead of Python for the AI service?"**
So the engine that answers on the server is literally the file that runs on the
phone. Two implementations of a grounding rule will drift, and a drift you cannot
see is the failure mode this whole product is about.

**"Why should a visitor bother?"**
They are already there and already photographing, and it takes about a minute.
Merit, the register of places witnessed, and directed dāna give recognition
without turning it into a game.

**"Why not a web app?"**
Compass, accelerometer, precise GPS, camera alignment, and offline model
inference. The web has none of them reliably. A browser cannot deliver an
alignment locked capture with a compass reading attached.

**"What if there is no internet at the site?"**
That is the normal case and the app is designed for it. The detector is fully on
device. Dhamma has a scripted cache, an on-device engine, and a deterministic
cited fallback. The guide falls back to bundled text. Nothing shows an error.

**"Is this only for Lumbini?"**
The seed content is Lumbini. The engine is not. A vantage is a coordinate, a
bearing, and tolerances. Any site with fixed viewpoints works with new seed data,
which is exactly what Phase 3 is.

**"What is the business model?"**
Freemium depth on Tīrtha, B2G licensing of the civic dashboard on Sākṣī, and
fenced sponsorship of named conservation needs. The contributor never pays, and
we will not sell location traces, merit, ranking, or placement in an answer.

**"Why not blockchain for the merit ledger?"**
Merit is non transferable by construction, so the problem a distributed ledger
solves never arises. The append only log gives us the audit property without the
cost.

**"What did you actually build versus integrate?"**
Built: the alignment scoring instrument, the full YOLO decode and NMS pipeline,
the Dhamma gating, RRF retrieval and citation validator, the 50 question
adversarial benchmark, the merit rules, geofence hysteresis, pradakṣiṇā detection,
the stillness detector, the close ritual, the seed generator and validator, and
the vocabulary linter. Integrated: ONNX Runtime, llama.rn, MapLibre, Expo modules,
SQLite, Supabase, and a base YOLOv8n we fine tuned ourselves.

**"What is the weakest part?"**
Device level testing. The paths most likely to fail in front of you are the ones
with no automated coverage, and we would rather say that than discover it live.

---

# Part VII: Scoring against the judges' criteria

## 29. The nine criteria, scored honestly

Nine criteria, 20 marks each, **180 total**. This section maps what we built onto
each one: the evidence, the single strongest proof, where we are genuinely weak,
and the thirty second answer to give.

Two things to notice about the rubric before you read on.

**Criteria 3 and 6 both mention theme alignment, and they are not the same
question.** Criterion 3 is about *ethics, sustainability, and social impact*.
Criterion 6 is about *real-world applicability*, whether this solves an actual
user problem. Give a different answer to each. Repeating the same speech twice
wastes 20 marks.

**Four criteria (3, 6, 9) reward the same underlying story**, which is our
strongest asset: a product whose ethics are enforced in code rather than claimed
in a README. Say it three different ways rather than three times.

### The honest self-assessment

| # | Criterion | Realistic band | Why | The single biggest risk |
|---|---|---|---|---|
| 1 | Technical Excellence | **16 to 18** | Layered pure-core architecture, 113 tests, five-stage gate, real on-device inference | No CI, no device tests, one known key-handling defect |
| 2 | Innovation & Problem Solving | **17 to 19** | The alignment instrument and the citation validator are genuinely novel work | Rephotography itself is an established technique, so lead with the instrument, not the idea |
| 3 | Theme Alignment (ethics, sustainability, social impact) | **18 to 20** | Teachings are enforced by a linter, a cap, and a validator | Merit and quests can *look* gamified for the first ten seconds |
| 4 | Product Development & Functionality | **14 to 17** | Three working surfaces, real APK, offline first | The detector needs the newest build; sync and iOS are unproven |
| 5 | UI/UX & User Experience | **15 to 18** | Design system, 173 accessibility props, Nepali default | No formal accessibility or contrast audit |
| 6 | Theme Alignment & Real-world Applicability | **17 to 19** | A named user with a named budget line: the LDT | No signed partnership or pilot data yet |
| 7 | Business Viability & Sustainability | **15 to 17** | B2G licensing against a real counterfactual cost | No pricing validation, no letters of intent |
| 8 | Project Management & Team Execution | **14 to 17** | 259 commits, four clear ownership areas, a gate that enforces process | No issue tracker or CI to point at; commit volume is uneven |
| 9 | Pitch & Overall Impact | **17 to 19** | The strongest narrative in the room if delivered calmly | A live demo failure, or overclaiming the server path |

**Honest expectation: roughly 143 to 164 out of 180.** The two you can most cheaply
improve before judging are 4 and 8. See the checklist at the end.

---

### Criterion 1: Technical Excellence
*Architecture, code quality, technology implementation, security, scalability, performance*

**What we have.**

| Evidence | Figure |
|---|---|
| TypeScript source files | 686 |
| Lines of TypeScript | 47,167 |
| Domain tests, plain Node, no framework | 113 across 16 files, 773 ms |
| Gates in the pre-commit chain | 5 |
| Service boundaries | 21 |
| Database migrations | 8 local, 8 cloud |
| On-device models | 2 (ONNX vision, GGUF language) |

**Architecture.** A strict layering rule with a purity constraint that is actually
enforced: `core/` imports nothing from React, React Native, or the network. That
is not decoration. It is why 113 tests run in under a second with no transpiler and
no test framework, and why the knowledge engine that answers on the server is
*literally the same file* that runs on the phone.

**Security.** Three specific decisions worth naming:

- `OLLAMA_API_KEY` carries no `EXPO_PUBLIC_` prefix, so it can never be inlined
  into the APK. We know exactly which prefix leaks and we treat it as a hard rule.
- Supabase uses **Row Level Security as the actual protection**, so a publishable
  key in the bundle is safe by design rather than by obscurity.
- Leaderboard points are computed **server side from synced evidence**. There is
  no `submitScore` endpoint, so a score cannot be claimed, only earned.

**Performance.** Offline first, so the common path has no network latency at all.
Model loaded by file path rather than base64 to avoid a 16 MB string on a phone
holding a camera preview. NMS capped at 50 boxes. SQLite in WAL mode so a read
during a write does not block.

**Scalability.** The retrieval layer was chosen so the upgrade path is a drop-in:
RRF fuses ranks, so swapping in pgvector embeddings changes one module. Postgres
with PostGIS one extension away when coordinates become survey grade.

**Where we are weak, and you should say it first.**

- **No CI.** The gate is real and enforced by discipline, not by a pipeline.
- **No device or end-to-end tests.** The paths most likely to fail on stage are
  exactly the ones with no automated coverage.
- **One known defect:** the code accepts a public-prefixed provider key fallback
  which would ship in the bundle. No key is set in this build, so it is not
  exploited, but it is the first roadmap item.
- **React Context over a store** is the closest architectural call we made. A
  provider that updates on every GPS tick re-renders its subtree, and selector
  subscriptions would fix it.

**The thirty second answer.** "The architecture rule is that everything which can
be pure, is pure. That is why 113 tests run in under a second with no framework,
and why the AI engine on our server is the same file that runs on the phone, so
they cannot disagree. The weakest part is that we have no CI and no device tests,
and the paths most likely to fail live are the ones with no coverage."

---

### Criterion 2: Innovation & Problem Solving
*Originality, creativity, technical complexity, research depth*

**The three genuinely original pieces.**

1. **The alignment instrument.** A weighted three-axis score
   (`0.30·position + 0.50·heading + 0.20·pitch`) with a separate heading floor and
   a GPS accuracy gate, driving a single number that governs both the reticle and
   the shutter. The *design reasoning* is the innovation: heading carries the most
   weight because being five metres left is still comparable while facing thirty
   degrees wrong is a different photograph, and we used a floor rather than a
   strict `min()` because GPS is the noisiest axis and must not veto a good
   alignment.
2. **Post-generation citation validation.** Most retrieval systems validate before
   generating. We validate *after*, checking every claim against the segment ids
   actually retrieved, and an answer that fails **becomes a refusal rather than a
   hedge**. That is what makes the refusal numbers meaningful.
3. **Anti-gamification as an engineering constraint.** A daily cap that
   congratulates and stops, a reward that cannot scale with severity, a ledger
   with no transfer function, and a linter that fails the build on engagement
   language. Building a system that deliberately resists its own engagement
   metrics is unusual, and every piece is testable.

**Research depth.** We reproduced the failure modes before designing against them:
invented sutta references, blended traditions, first-person scripture on request,
and markedly worse Nepali. The corpus is Bilara **segment aligned**, so every
passage carries a checkable identifier like `dn16:6.7`. We then wrote a 50
question adversarial suite designed to break our own system.

**Technical complexity, concretely.** Hand-written YOLOv8 tensor decoding handling
both Ultralytics export layouts, letterbox geometry and its inverse, NMS that
never crosses classes, reciprocal rank fusion over two retrievers, geofence
hysteresis, signed-angular-sum circumambulation detection, and a three-condition
stillness detector.

**Where we are weak.** Fixed point rephotography is an established conservation
technique and we say so in the document. Our contribution is making it possible
without a trained surveyor, not inventing it. Retrieval is rank fusion with a
tf-idf cosine proxy rather than learned embeddings.

**The thirty second answer.** "Rephotography is an established technique that
normally needs a trained surveyor. Our contribution is the instrument that lets an
untrained visitor do it correctly, and the reasoning inside it: heading carries
the most weight because facing the wrong way destroys comparability in a way that
being five metres off does not. The second original piece is validating citations
*after* generation, so an unciteable answer becomes a refusal rather than a
hedge."

---

### Criterion 3: Theme Alignment
*Alignment with the LumbiniX theme, ethics, sustainability, social impact*

**This is our strongest criterion. Lead with the mechanism, not the metaphor.**

The theme asks what a Buddha born in 2026 would build. Our answer is that the
sermon would not need a new medium so much as a new discipline. The Kālāma Sutta
instructs a listener not to accept a claim on tradition, repetition, scripture, or
the authority of a teacher, but to test it. **That is a software specification,
and an unusually demanding one in the age of the confident language model.**

| Teaching | Enforced in code as | Test |
|---|---|---|
| Right view | The citation validator | 0 unretrieved citations across 50 cases |
| Right speech | The vocabulary linter | `npm run vocab` fails the build |
| Non-attachment | No transfer function, no expiry, no purchase path | Grep the codebase |
| Mindfulness | Stillness requires the screen **off** | Merit accrues while unused |
| Testing claims | Every claim traces to a checkable source | Segment ids, sensor accuracy, provenance tiers |

**The close ritual** deserves its own sentence: after twenty minutes inside the
Sacred Garden the app suggests you stop. It is the only feature in the application
designed to reduce its own usage, and it is the only honest expression of the
second noble truth that software can make.

**Ethics, stated as refusals.** We will not sell visitor location traces, merit or
any in-app currency, leaderboard rank, or placement inside a Dhamma answer. Each
would generate revenue and each would destroy the property that makes the
corresponding feature worth having.

**Sustainability and social impact, structurally rather than charitably.** The
dataset is generated in Nepal, held for the authority responsible for the site,
and licensed on terms that keep it there. Narration, translation, and
transcription are credited and compensable, and the merit system already
recognises contribution as a distinct earning category. Local guides are
complemented rather than displaced: the app handles what a guide should not have
to repeat forty times a day.

**Where we are weak.** Merit, quests, and a leaderboard *look* gamified for the
first ten seconds. Get ahead of it: explain in the same breath that merit cannot
be spent, ranked, transferred, or bought, and that the leaderboard ranks uploaded
evidence rather than points.

**The thirty second answer.** "We took the Kālāma Sutta as a specification rather
than a quotation. Right view became a citation validator. Right speech became a
linter that fails our build if engagement language reaches a screen. Non-attachment
became a ledger with no transfer function. And after twenty minutes in the Sacred
Garden the app asks you to put it down, which is the only feature we built to
reduce our own usage."

---

### Criterion 4: Product Development & Functionality
*Working prototype, completeness, stability, features, reliability*

**What works, on a real installable APK.**

- Three complete surfaces: Tīrtha, Sākṣī, Dhamma.
- Live map, arrival detection with hysteresis, 12 seeded sites, four wisdom tiers.
- Full capture loop: vantage, live alignment, lock, capture, observation, report.
- On-device crack detection with dashed candidates and one-tap filing.
- Cited question answering with live refusals, in Nepali and English.
- Reflection mode with a synchronous distress guard and verified helplines.
- Merit, quests, stillness, close ritual, register, leaderboard.
- SQLite persistence with 8 migrations and an offline queue.

**Reliability is the interesting story here, and it is a strength if you tell it
right.** Every optional native module is loaded through a guarded require that
resolves to null, so an absent package degrades one feature instead of failing the
entire bundle. Every AI surface has a documented degradation ladder where each
rung is a complete, honest product rather than an error state.

**Where we are weak, and this is our lowest-scoring criterion.** Be first to say
it:

- **The crack detector needs the newest build.** It took three separate fixes:
  bridgeless module resolution, a patch applied to a file Metro never loads, and
  an autolinking conflict that kept the package out of `PackageList.java`. All
  three are fixed and verified from a clean install, but the fix must be in the
  APK you demo.
- **Live cloud sync is unconfigured.** Client and migrations exist; an end-to-end
  run against a live project with RLS has not been done.
- **Airplane mode is untested** on the exact build and device.
- **iOS has never been built.** Android only, and we say so rather than implying
  parity.
- **No device level test coverage.**

**The thirty second answer.** "Three surfaces work on a real APK, and the offline
behaviour is designed rather than accidental: every AI surface has a degradation
ladder where each rung is still an honest product. What is not proven is cloud
sync end to end, airplane mode on this exact device, and iOS, which we have never
built. We keep that list in the document so nothing overstates the position."

---

### Criterion 5: UI/UX & User Experience
*Design, ease of use, accessibility, user journey, practicality*

**Design system.** Colour, typography, and spacing live in `theme/` and
`constants/`, never in individual screens. Typography is Anek Devanagari for
Nepali alongside IBM Plex Sans and Mono, so Devanagari is a first-class citizen
rather than a fallback glyph.

**Accessibility, measured.** 173 accessibility props across the app:

| Prop | Count |
|---|---|
| `accessibilityLabel` | 72 |
| `accessibilityRole` | 58 |
| `accessibilityHint` | 27 |
| `accessibilityState` | 13 |
| `accessibilityValue` | 2 |
| `accessibilityLiveRegion` | 1 |

**Nepali is the default answer language**, not an afterthought. The language toggle
**re-requests the same question** rather than machine translating an English
answer, so a Nepali reader is never handed a translation of a claim that was only
validated in English. That is an accessibility decision as much as a linguistic
one.

**The user journey is the product.** Onboarding asks for each permission
individually, only after its reason is on screen, and "Enter Lumbini" is never
gated on a grant. Every refusal is a valid ending, stated on screen rather than
discovered later. Wisdom deepens with attention rather than front-loading
everything and hoping something is read.

**Restraint as a design principle.** Exactly three tabs. No Home, Explore, or
Profile. Adding a fourth would require an argument. We deleted a distance readout,
a saved-on-device banner, a "collections searched" list, and suggestion chips
because the machinery around a refusal was crowding out the refusal itself.

**Micro-decisions worth mentioning if asked.** Dashed sand-coloured reticle for a
by-eye capture versus solid blue for a measured lock, so the difference is visible
before it is read. Back sits beside the action rather than in a corner, because it
is reached one-handed. The guide uses a speech cloud rather than a chat log,
because a guide speaking to you is not a messaging app.

**Where we are weak.**

- **No formal accessibility audit.** No screen reader pass, no contrast ratio
  measurement, no dynamic type testing.
- **Not every screen is fully bilingual.** Dhamma and reflection are; some
  settings and secondary labels are English only.
- **We shipped a real usability bug**: the fourth onboarding permission was drawn
  outside its parent's bounds and could not be tapped at all on Android. Found and
  fixed. Worth mentioning as evidence we test on device, but only if asked.

**The thirty second answer.** "Nepali is the default, not a toggle, and the
language switch re-asks the question rather than translating an answer, so a
Nepali reader never gets a translation of a claim validated only in English. The
design principle is restraint: three tabs, and we deleted several features during
the build because they were crowding out the thing that mattered. What we have not
done is a formal accessibility audit."

---

### Criterion 6: Theme Alignment & Real-world Applicability
*Does it meaningfully address the theme and solve an actual user problem?*

**Do not repeat criterion 3. This one is about the user and the problem.**

**The problem is specific and verifiable.** Lumbini receives well over a million
visitors a year across a site complex spanning several square kilometres, with
monuments dating from the third century BCE. Condition assessment is episodic: a
specialist survey happens, produces a report, and the next happens years later.
Between those points there is no continuous record.

Most heritage degradation is not dramatic. It is a crack widening by millimetres a
season, biological growth spreading across brick, water pooling where drainage has
silted, salt efflorescence after a wet year. **Visible to anyone who looks, and
invisible to anyone not comparing against a previous image from the same
position.**

Meanwhile several hundred thousand people a year photograph these monuments from
roughly the same spots, and none of that imagery is comparable, positioned, or
retained.

> The imagery already exists. What is missing is the discipline of standing in the
> same place, the metadata to prove you did, and somewhere for it to go.

**There is a named user with a named budget line.** The Lumbini Development Trust,
municipal heritage officers, and the Department of Archaeology already commission
surveys. The pricing argument is not speculative: the counterfactual is a
commissioned survey, and a licence costing a fraction of one that produces a
continuous record instead of a single snapshot is an easy comparison made against
money that is already being spent.

**The contribution is a by-product, which is why it can work.** We deliberately
did not build a system where the visitor is unpaid labour dressed as a game. The
photograph is a by-product of an experience worth having on its own terms, which
is the only version of this that survives contact with real visitors.

**Three audiences, each giving and receiving.** Pilgrims get sourced depth and
give a positioned photograph. Tourists get legible ruins and give corroboration.
Authorities get a continuous record and give the one input only they can provide:
survey grade vantages.

**Where we are weak.**

- **No signed partnership or letter of intent** with the LDT yet.
- **Vantages are seeded by us, not established survey points.** Until the Trust
  fixes them, the app keeps saying so on screen.
- **Five of twelve site coordinates are documentary rather than surveyed**, and
  the validator warns on every build.

**The thirty second answer.** "Several hundred thousand people photograph these
monuments every year and none of it is comparable, so a crack widening over six
months is invisible to the authority responsible for the building. We are not
asking anyone to do extra work; the photograph is a by-product of a visit worth
having. And the buyer already exists, because the counterfactual is a commissioned
survey they are already paying for."

---

### Criterion 7: Business Viability & Sustainability
*Market need, business model, scalability, long-term impact*

**Three revenue streams, in order of durability.**

1. **B2G licensing on Sākṣī. This is the durable business.** The civic dashboard
   licensed per municipality or heritage authority: condition register, severity
   and corroboration triage, observation time series per vantage, CSV and GeoJSON
   export, and CRM-shaped output. Priced against an existing budget line.
2. **Freemium depth on Tīrtha.** The free tier is not a demo. It carries the full
   map, arrival detection, the complete witness workflow, and unrestricted use of
   the knowledge surface, because conservation value depends on the volume of
   observations and anything that reduces capture is self-defeating. The paid tier
   sells **depth, not access**: curated multi-day routes, offline bundles, the high
   wisdom tier, multilingual audio guides.
3. **Fenced sponsorship.** Named conservation needs sponsored by institutions,
   acknowledged as a line in a register rather than as advertising between a
   visitor and a monument. No interstitials, no sponsored content in the knowledge
   surface, no sponsor influence on what the condition data says.

**The impact metric is a single number a customer can act on: monitored vantage
coverage.** The count of established viewpoints receiving at least one aligned
capture per month, and the median interval between captures. That number *is* the
difference between an episodic survey regime and a continuous one.

**Scalability is designed in, not asserted.** A vantage is a coordinate, a
bearing, and tolerances. Any site with fixed viewpoints works with new seed data,
which is exactly what the Kathmandu Valley phase is. The retrieval upgrade to
pgvector is a drop-in. The hosted model is a single-file change through an
existing seam.

**Long-term impact.** A longitudinal, positionally consistent photographic archive
of South Asian heritage monuments is a genuinely novel research asset. And a
heritage authority that can see a crack widening across six months of comparable
photographs can intervene while the intervention is still cheap, which is the
entire economic argument for preventive conservation.

**Where we are weak.**

- **No pricing validation.** We have not tested a number with a real authority.
- **No letters of intent or pilot data.** The market need is well argued and not
  yet evidenced by a customer.
- **B2G sales cycles are slow**, which is the honest risk in the durable line.
- **Freemium conversion is unproven** for this audience.

**The thirty second answer.** "The durable business is licensing the condition
dashboard to heritage authorities, and the pricing argument is easy because the
counterfactual is a commissioned survey they already pay for. The consumer tier
sells depth rather than access, because anything that reduces the number of people
capturing destroys the dataset. What we do not have yet is a signed pilot, so the
market need is well argued and not yet evidenced."

---

### Criterion 8: Project Management & Team Execution
*Planning, collaboration, time management, organisation*

**The measurable record.**

| Evidence | Figure |
|---|---|
| Commits | 259 |
| Contributors | 6 |
| Window | 8 to 10 August 2026 |
| Source files | 686 |
| Lines of TypeScript | 47,167 |
| Documentation files | 8 in `docs/`, plus 6 at root |

**Four clearly owned areas, with no overlap** (see section 27). Aaditya owns the
knowledge engine and on-device inference. Binayak owns the visual surface and
mapping. Nabin owns content authenticity and research. Siddanta owns architecture,
platform, and the build pipeline.

**Process enforced by tooling rather than by agreement.** This is the strongest
thing we can say here. `npm run verify` runs five gates before every commit, and
the vocabulary linter fails the build if product principles drift. **That is how a
principle stays true at the fiftieth commit rather than only in the README, and it
caught real drift during the hackathon.**

**Coordination decisions visible in the code.** `shared/` exists specifically
because the merit cap is enforced both client-side and server-side, and two copies
of that number would drift. Branches are kept in sync deliberately, with a
fast-forward-only merge to `main` so history stays linear.

**Scope discipline.** We cut features during the build: speech recognition
removed, the map readout deleted, a banner unmounted, the refusal furniture
stripped. We also refused to add a fourth tab. Cutting during a hackathon is
better evidence of planning than shipping everything.

**Where we are weak, and this is the criterion where we have least to show.**

- **No issue tracker, board, or CI pipeline** to point at. The process is real and
  its artefacts are commits and gates, not tickets.
- **Commit volume is uneven** (121, 114, 28, 9), which invites a question about
  contribution balance. The honest answer is that ownership areas differ in commit
  granularity and that documentation and research work does not produce commits at
  the same rate as application code.
- **A three-day window** means very little of this was long-range planning.

**The thirty second answer.** "Four people, four clearly owned areas, 259 commits.
The thing we would point at is that our process is enforced by tooling rather than
by agreement: five gates run before every commit, and one of them fails the build
if engagement language reaches a user-facing string. It caught real drift during
the hackathon. What we do not have is a CI pipeline or an issue board, so our
evidence is commits and gates rather than tickets."

---

### Criterion 9: Pitch & Overall Impact
*Presentation, communication, Q&A, alignment with theme, social impact*

**The one-sentence pitch.** A witness that guides you, an AI that never lies, and
a record worth trusting, built by the people already standing in front of the
monument.

**The narrative arc that works, in five beats.**

1. **The gap.** Hundreds of thousands of photographs a year, none of it
   comparable, so a crack widening over six months is invisible.
2. **The instrument.** The phone becomes a survey instrument. Show the reticle
   locking. This is the moment the product becomes obvious.
3. **The honesty beat.** Show "match by eye" and the permanent flag. *This is the
   most important thirty seconds of the demo*, because it is where the charter
   stops being marketing.
4. **The refusal.** Ask Dhamma something out of scope and let it refuse on screen.
   An AI saying "I do not know" in 2026 is memorable.
5. **The close ritual.** The app asks you to put it down.

**The two beats you must never cut** are the honesty beat and the refusal. Every
team will demo features. Almost none will demo their product declining to answer.

**Q&A strategy: name your weaknesses before you are asked.** Judges score candour,
and every weakness in this document has a reason and a roadmap item attached. When
asked what is weakest, say "device level testing, because the paths most likely to
fail in front of you are the ones with no automated coverage" rather than
deflecting. That answer scores better than a defence.

**The thing you must not say.** Do not claim answers come from a live server. In
this build `EXPO_PUBLIC_API_URL` is unset, verified with `eas env:list`, so
everything runs on device. That is a strength. Overstating it is the one
avoidable way to lose credibility.

**Social impact, closing line.** The dataset is generated in Nepal, held for the
authority responsible for the site, and licensed on terms that keep it there. A
heritage authority that can see a crack widening across six months of comparable
photographs can intervene while it is still cheap.

**Where we are weak.**

- **Live demo risk.** Sensors, GPS, and the detector all have to work in a room.
- **The story is dense.** Three surfaces, three AI systems, and a charter is a lot
  for four minutes. Cut ruthlessly rather than compressing.

---

### The seven things only we can say

Use these when you need to differentiate in one line.

1. **Our AI refuses, and we can show you the number.** 50 out of 50, 100 percent
   adversarial refusal, and zero citations naming an unretrieved passage.
2. **Our build fails if the wrong word reaches a screen.** A vocabulary linter is
   a product principle with teeth.
3. **The same engine file runs on the phone and on the server**, so they cannot
   disagree about a grounding rule.
4. **We deleted our own fake AI.** The first damage detector hashed the filename
   into convincing boxes. We replaced it with a real trained model and wrote down
   that we had faked it.
5. **A missing reading is stored as null, never zero**, throughout the schema.
6. **We built a feature designed to reduce our own usage.**
7. **We publish our own gaps**, including one security defect and four unproven
   claims, in the submission document itself.

### Questions that will hurt, and the honest answer

| Question | The answer |
|---|---|
| "Your AI is just RAG with extra steps." | RAG validates before generating. We validate *after*, against the segment ids actually retrieved, and a failure becomes a refusal rather than a hedge. That is why the refusal figure is 100 percent and not "usually". |
| "0.82 mAP is not good enough for conservation." | Correct, and we say so in writing. It demonstrates the pipeline and is not yet a conservation instrument. It is why boxes are dashed, why a human sets severity, and why retraining on Lumbini brick is a Phase 1 item. |
| "Is the AI actually running, or is it scripted?" | Both, honestly. Five scripted questions are precomputed for dead venue wifi and are tagged `cached_demo`. Everything else runs live retrieval on device. Ask it something we have not scripted. |
| "Why should I trust your benchmark? You wrote it." | It is adversarial by design, written to break our own system, and the code is in the repository. Adversarial was a mandatory gate rather than a target. |
| "This looks gamified." | Merit cannot be spent, ranked, transferred, or bought. There is no transfer function in the codebase. The cap congratulates and stops rather than hinting at tomorrow. The leaderboard ranks uploaded evidence, and there is no endpoint to submit a score. |
| "Is this a real APK or a mockup?" | Real EAS build, installable, running on device. Some paths are unproven and they are listed in section 24. |
| "What is your moat?" | The dataset and the vantage definitions, which accrue with time and require the authority's cooperation. Nobody catches up by rewriting the app. |

### The pre-judging checklist

Cheapest first. Criteria 4 and 8 are where marks are most recoverable.

1. **Rebuild and install the newest APK**, then confirm the Sākṣī status line says
   "Ready in this build" and a capture produces dashed boxes. This is the single
   highest-value action, and criterion 4 depends on it.
2. **Test the full flow in airplane mode** on the demo device, which converts one
   `UNTESTED` row into a demonstrated strength.
3. **Rehearse the honesty beat and the refusal** until they are smooth. They are
   the two beats that win criteria 3, 6, and 9.
4. **Have the evidence pack ready to show on a laptop**: `npm run verify` output,
   the 50/50 benchmark, and `git log --oneline` for criterion 8.
5. **Agree who answers what.** Aaditya takes AI questions, Siddanta architecture
   and platform, Binayak design and mapping, Nabin content authenticity and
   sources. A confident handoff reads as a team; four people answering at once
   does not.
6. **Decide the one sentence you close on** and let one person say it.

---

## 30. Command reference

```bash
# Development
npm start                    # Metro
npm run dev-client           # Metro for a development build, over LAN
npm run api                  # the knowledge API harness, port from .env.local
npm run web                  # web build, for the surfaces that work there

# The gate. Run this before every commit.
rm -f .expo/types/router.d.ts && npm run verify

# Individual gates
npm run typecheck            # tsc --noEmit
npm test                     # 113 domain tests, plain Node
npm run validate             # seed content and coordinate provenance
npm run vocab                # vocabulary and typography linter
npm run eval:dhamma          # the 50 question benchmark

# Content
npm run gen                  # seed/*.json  →  data/*.generated.ts
npm run corpus:fetch         # refresh the Bilara canonical corpus

# Builds
npx eas build --profile preview    --platform android   # the demo APK
npx eas build --profile development --platform android  # dev client
npx eas build --profile production --platform android   # app bundle

# EAS environment
npx eas env:list   --environment preview
npx eas env:create --environment preview
npx eas build:list

# Diagnosing a device build
adb logcat | grep -i onnx
```

---

## 31. Glossary

| Term | Meaning |
|---|---|
| **Sākṣī** | Sanskrit *sākṣin*, witness: one who is present and can testify |
| **Tīrtha** | A sacred crossing place. The explore surface |
| **Dhamma** | The teaching. The knowledge surface |
| **Darśana** | Seeing and being seen by a sacred object |
| **Pradakṣiṇā** | Clockwise circumambulation |
| **Puṇya** | Merit. Append only, capped, unspendable, unrankable |
| **Dāna** | Giving. Here, directing sponsor funds to named conservation needs |
| **Chaityāvalī** | The register of monuments witnessed |
| **Vantage** | A recorded viewpoint: position, bearing, and tolerances |
| **Align score** | 0 to 1 quality of match between the phone and a vantage |
| **Lock** | The state where alignment is good enough to unlock the shutter |
| **Framed by eye** | Captured without meeting tolerance. Permanently flagged |
| **Observation** | One capture with all of its measurements |
| **Condition report** | A structured human judgment filed against an observation |
| **Corroboration** | A second visitor confirming an existing report |
| **Evidence tier** | How well established a claim about a site is |
| **Documentary coordinate** | A position from documents, not surveyed. Labelled as such |
| **Fixed point rephotography** | Returning to a defined viewpoint to make change measurable |
| **mAP50** | Mean average precision at 50 percent IoU. Standard detection accuracy |
| **NMS** | Non-maximum suppression. Removes duplicate boxes, never adds one |
| **IoU** | Intersection over union. How much two boxes overlap |
| **Letterbox** | Resizing to a square without distorting, using padding |
| **CHW** | Channel, height, width. The tensor layout the model expects |
| **Anchor** | One candidate position in a YOLO output tensor |
| **BM25** | Classic lexical relevance scoring |
| **RRF** | Reciprocal Rank Fusion. Combines two ranked lists by rank, not score |
| **Segment id** | A canonical passage address such as `dn16:6.7` |
| **Grounding** | Requiring an answer to be supported by retrieved sources |
| **GGUF** | The quantised model file format llama.cpp and llama.rn read |
| **Q4_K_M** | A 4-bit quantisation preset trading size for a small accuracy loss |
| **Bridgeless** | React Native's New Architecture mode, with no legacy bridge |
| **TurboModule** | The New Architecture's native module system |
| **Config plugin** | Expo's mechanism for modifying native project files at build time |
| **WAL** | Write ahead logging. SQLite's concurrent, crash resistant journal mode |
| **RLS** | Row Level Security. Postgres access control enforced in the database |

---

*Companion documents in this repository: `documentation.md` (product reference),
`explanation.md` (file by file code walkthrough), `slides.md` (the deck),
`video-demo.md` (the recording plan), `docs/DAMAGE-MODEL.md` (the model recipe),
`docs/train-crack-seg.ipynb` (the training notebook), and
`docs/Sakshi-LumbiniX-2026-Submission.pdf` (the formal submission).*

**साक्षी**

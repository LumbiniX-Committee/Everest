# Sākṣī

A conservation-evidence platform that uses pilgrimage and heritage tourism as
its distribution channel. It launched at Lumbini, Nepal, the birthplace of the
Buddha, and now covers three Kathmandu Valley UNESCO monument-zone sites
alongside it: Patan Durbar Square, Changu Narayan, and Manga Hiti.

Sākṣī (साक्षी) means *witness*: someone who sees a thing directly and can speak
to it. The app takes the name at face value. You go to a heritage site, stand at
a fixed viewpoint, line your phone up with it, and take a photo of what the place
looks like today. Come back next month or next year, take the photo again from
the same spot, and the two pictures line up. Over time they become a record of
how a place is changing, made by the people standing in front of it — and
brought to a custodian's dashboard where it can actually be acted on.

Built for the LumbiniX 2026 hackathon by the LumbiniX-Committee team.

## What the app does, in one line

It turns a visitor's attention into evidence a conservator can trust, and gets
that evidence in front of the institution responsible for the site.

Everything else in the app (the map, the history, the AI, the guided visits,
the custodian dashboard) exists to help you make, understand, act on, or care
about that one thing: a photo taken from a known spot on a known day.

## The three parts

The app has exactly three places you can go. They are the idea of the product,
not just tabs. There is no Home, Explore, Profile, or Rewards.

| Part | Name means | What you do there |
| --- | --- | --- |
| **Tīrtha** | a sacred place | Explore Lumbini and the Kathmandu Valley sites on a map, read about each place, and fade between an old photo and a new one to see what changed. Quests point at whatever vantage or spout has gone longest without a resurvey, not at what is popular. |
| **Sākṣī** | witness | The main loop: pick a viewpoint, line up your phone, take the photo, and note the condition of the site. A custodian (web dashboard in `landing/custodian`, or in-app under Settings) reads the reports and acknowledges them. |
| **Dhamma** | the teaching | Ask about Buddhist texts or heritage conservation — UNESCO records, the ICOMOS Venice and Burra Charters, Kathmandu Valley archaeology — and get answers backed by real, cited sources, or an honest "I cannot answer that." |

## What the app promises

These rules shape almost every decision in the code. They are kept honest by
automated checks, not just good intentions.

- **A measurement is never faked.** If the GPS did not get a fix, the app saves
  "unknown", never zero, because zero would look like a perfect reading.
- **"By eye" is never dressed up as "measured".** If you line up a shot by eye
  instead of getting a verified lock, the record says so, and it looks different
  on screen.
- **The AI suggests, it never decides.** The damage detector offers candidates
  for a person to confirm. The Dhamma answers only from real sources and says no
  when it cannot back an answer up.
- **Nothing is ever deleted.** A photo is evidence. You fix a mistake by adding a
  new record, not by erasing the old one.
- **The phone is the source of truth.** A phone in the Sacred Garden may have no
  signal for hours, so every record is saved on the device first. The cloud is a
  copy.

## Running it

You need Node.js and the Expo tooling. Then:

```bash
npm install                     # install everything (also applies a small fix, see below)
cp .env.example .env.local      # for Windows PowerShell: Copy-Item .env.example .env.local
npx expo start                  # start the app
```

Press `a` for Android, `i` for iOS, or scan the QR code with the Expo Go app.

Most of the app runs in Expo Go and in a simulator. A few things need a real
phone and a full build, because they use native code that Expo Go does not carry:

- The camera, GPS, and compass need a real phone.
- The map and the damage detector need a full build (`eas build --profile
  development`), not Expo Go.

### One command to check the code is healthy

```bash
npm run verify
```

This runs the type check, the tests, the content check, the word check, and the
Dhamma answer check, all at once. All of them must pass.

## Building a phone app

The demo build is an installable Android file:

```bash
npx eas build --profile preview --platform android
```

When it finishes you get a link. Open it on the phone and install. A build is
needed after changing the app's native parts (adding or removing a plugin, or
changing which native module ships), because the file on the phone is frozen at
build time.

Notes:

- The `android/` folder is not stored in the repository. The build tool creates
  it fresh from `app.json` each time.
- On install, a small fix to one dependency is applied automatically. It lives in
  `patches/` and is reapplied on every `npm install`.
- The damage detector model file ships inside the app, pinned by the
  `assetBundlePatterns` line in `app.json`.

## The main features

### Tīrtha: place, map, and then-and-now

An interactive map of Lumbini with its heritage sites, your live position, and a
ring around each site. Open a site and you can fade between a real old photograph
and a modern one of the same spot. Every image carries a label saying how
trustworthy it is, so a modern picture is never passed off as a historical one.

There is also a friendly on-site guide you can ask about a place. It answers in a
simple speech-cloud, the same style used in the story mode. It will never claim a
crack or a condition (that is Sākṣī's job, and it is measured) and it will never
pretend to quote a text.

### Sākṣī: the witness loop

```
pick a site  ->  pick a viewpoint  ->  line up the phone  ->  take the photo  ->  note the condition
```

Lining up the phone turns it into a simple survey tool. The app scores how well
your position, direction, and tilt match the saved viewpoint, and only gives you
a "lock" when the match is genuinely good and the GPS is accurate. If conditions
are bad, you can still line up by eye, and the record clearly says it was done by
eye, never faking a lock.

After you take a photo, the app looks at it and suggests any cracks it finds. The
suggestions are drawn as dashed boxes so no one mistakes them for a final call. A
person confirms how serious it is; the AI never sets that. A report made with the
AI's help is saved with a flag so a later reader knows.

### Dhamma: answers you can trust

Dhamma answers questions about Buddhist teaching *and* heritage conservation,
but only from real sources. Its corpus is the Pali canon alongside the ICOMOS
Venice (1964) and Burra (2013) Charters, UNESCO World Heritage records for both
Lumbini and the Kathmandu Valley, and named Kathmandu Valley archaeology (the
Mānadeva inscription at Changu Narayan, Patan's Malla-era construction, the
dhunge dhara water system). It finds the most relevant passages, writes an
answer using only those passages, and checks every claim points back to a real
passage. If the sources do not support an answer, it says so instead of
guessing. It refuses to pretend to be the Buddha, resists attempts to trick it,
and answers in Nepali by default with an English option. Source text and
citations are never machine-translated.

Without a network, the built-in text collection still works. An optional small
model can be downloaded to the phone to write short answers offline, and even
then it may only rephrase real passages, never invent facts.

### The custodian dashboard: closing the loop

A condition report a visitor files is only useful if someone responsible for
the site actually sees it. The custodian surface — a web dashboard at
`landing/custodian`, and an equivalent in-app screen under Settings →
Institutional — shows coverage, median time to acknowledgement, and every open
report by site and status, with CSV and GeoJSON export for a real GIS
workflow. A custodian can acknowledge, mark in-progress, or resolve a report
with a note, from either surface. There is deliberately no login: a
remembered name attached to what a device acknowledges, not an account,
because "no complex auth" is a stated design choice, not an oversight. The
ethics policy at `landing/app/ethics/page.tsx` states plainly what funds this:
no money from any commercial entity operating inside a site the app monitors.

## How the code is laid out

```
app/          The screen routes. Thin files. This folder is the map of the app.
features/     The real screen code, grouped by part (tirtha, sakshi, dhamma).
components/   Reusable pieces of UI.
core/         Pure logic with no phone parts: scoring, merit rules, the Dhamma
              engine, the vision decoder. This is the brain, and it is well tested.
services/     The edges that talk to the outside: camera, location, database,
              cloud, and the AI runtimes.
hooks/        Reusable React behaviour (alignment, heading, position).
store/        App-wide state (first launch, permissions, preferences).
seed/         The source of truth for content, as plain JSON you can edit.
data/         Content the app ships with, built from seed/.
tools/        Build and check scripts.
theme/        Colours, fonts, spacing.
assets/       Images, fonts, audio, and the AI model file.
supabase/     Cloud database setup.
mock-api/     A tiny fake backend for demos.
docs/         Longer guides. Start with docs/PROJECT-GUIDE.md.
```

One rule holds the layers together: `core/` never reaches up into `app/`,
`features/`, or `services/`. It stays pure, which is why it can be tested without
a phone.

## Conventions

- **Colours and fonts go through the theme.** No screen writes a raw colour or
  font. One blue means "locked" and nothing else, so it reads at a glance in
  sunlight.
- **Permissions are asked at the moment they are needed,** after the reason is on
  screen, never all at once on launch. Saying no is a normal outcome, not an
  error.
- **Settings live in `.env.local`,** which is never committed. Copy
  `.env.example` and fill it in. Only values that are safe to ship belong there.
  The Ollama key is server-only and must never be given an `EXPO_PUBLIC_` prefix,
  because those are baked into the app.
- **Records are saved on the phone first,** then copied to the cloud. A photo
  taken at a viewpoint on a given day cannot be retaken, so the phone is the
  record and the network is a bonus.

## Where to read more

- **The full plain-language tour:** `docs/PROJECT-GUIDE.md`
- **The data rules:** `docs/DATA-ARCHITECTURE.md`
- **Rebuild or improve the damage model:** `docs/DAMAGE-MODEL.md`
- **The offline and multilingual plan:** `docs/MULTILINGUAL-AI-PLAN.md`
- **Build and deploy:** `docs/BUILD-AND-RUN.md` and `docs/DEPLOYMENT.md`

## Licence

| What | Licence |
| --- | --- |
| Source code | [Apache 2.0](LICENSE) |
| Content and data — `seed/`, the site register, the published exports | [CC BY 4.0](LICENSE-CONTENT) |
| Coordinates marked `coords_source: osm` | ODbL applies in addition — © OpenStreetMap contributors |
| Photographs, audio, fonts, the damage model | Unchanged, per rights holder — itemised in [LICENCES.md](LICENCES.md) |

Two licences, because code and content carry different obligations. Permissive
on the code so a heritage office can adopt it without a legal review;
attribution on the content so the sourced record travels with its provenance,
which is the same rule the app holds itself to. The reasoning is written up in
[docs/LICENSING.md](docs/LICENSING.md).

The name **Sākṣī**, the wordmark and the reticle mark are not licensed. You may
say your product is built on Sākṣī; you may not call it Sākṣī.

## Status

This is a hackathon build. Site and viewpoint coordinates are real but not all
survey-grade, and a few are marked as approximate until field data replaces them.
The damage detector, the camera loop, and the keyboard behaviour are best judged
on a real phone build, not in a simulator. Patan Durbar Square, Changu Narayan,
and Manga Hiti ship with real, sourced facts, timeline, narration, and vantages,
but no reconstruction plate: producing one needs a harvested or generated image
this session did not have the tokens to fetch. Nine of the twelve Lumbini sites
already ship the same way, and the site detail screen says so honestly rather
than showing a placeholder.

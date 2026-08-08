# Everest

**Sākṣī** — a heritage-conservation and pilgrimage application for Lumbini, Nepal.

Sākṣī means *witness*: one who sees directly and can testify to it. The app takes
the name literally. You go to a heritage site, return to a fixed photographic
viewpoint, align your device with it, and record what is there today. Over time
those frames become a comparable time-series — evidence of how a place is
changing, gathered by the people standing in front of it.

## The three surfaces

The app has exactly three destinations, and they are its conceptual model rather
than a navigation convenience:

| Surface | What it is |
| --- | --- |
| **Tīrtha** | Explore Lumbini and discover heritage sites |
| **Sākṣī** | Witness — align to a vantage, capture, record |
| **Dhamma** | Grounded, source-backed knowledge |

There is no Home, Explore, Rewards, Profile or Settings tab. Adding one should
require a decision.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project values
npx expo start
```

Then press `a` for Android or `i` for iOS, or scan the QR code with Expo Go.

Camera, location and sensors need a development build or a physical device to
exercise properly; everything else runs in Expo Go and the simulator.

```bash
npm run typecheck   # tsc --noEmit, including typed routes
```

## Project layout

```
app/          Expo Router routes. Thin — each file resolves params and renders a feature screen.
features/     Screen implementations, grouped by surface.
components/   Shared UI. ui/ is the primitive layer; nothing outside it names a colour or a font.
theme/        Colour, typography, spacing, radii tokens.
services/     Platform boundaries: permissions, location, camera, sensors, storage, database, supabase.
store/        App-wide React context (first-launch state, permissions).
hooks/        Composed behaviour — alignment, position, heading.
data/         Content. Currently `demo/`; swapped behind `data/index.ts` when real data lands.
types/        Domain types.
utils/        Pure helpers — geodesy and formatting.
constants/    Identity strings, geography, storage keys.
```

Routes are thin on purpose. A screen's implementation lives in `features/`, so
the route tree stays readable as a map of the app rather than as a codebase.

## Conventions

**Colour and type go through tokens.** No component names a hex value or a font
family. `#557FA5` is reserved for successful alignment — it means *locked* and
nothing else, which is what makes it readable at a glance in daylight.

**Fonts are declared but not vendored.** Anek, IBM Plex Sans and IBM Plex Mono
are wired through `theme/typography.ts`; until the licensed files are added to
`assets/fonts/` the platform default stands in. See `theme/fonts.ts` for the
three-step process to enable them.

**Permissions are never requested at launch.** Each is asked for at the point of
use, after its reason is on screen. A refusal is a valid outcome, never an
error — `denied` (ask again) and `blocked` (Settings only) are distinguished so
the UI never offers a button that silently does nothing.

**Configuration lives in `.env.local`**, which is gitignored — copy `.env.example`
and fill it in. `EXPO_PUBLIC_` variables are inlined into the bundle at build
time, so only publishable values belong there; Row Level Security is what
protects the data, not the key.

**Observations are written locally first.** A photograph taken at a vantage on a
particular day cannot be retaken, so SQLite is the record and the network is an
optimisation.

## Status

This is the initial architecture and first flow: launch → onboarding → the three
surfaces, with alignment, capture and local persistence working end to end.

Site and vantage data in `data/demo/` is illustrative — real coordinates, but not
survey-grade, and the vantage points are not established viewpoints. It must be
replaced with Lumbini Development Trust survey data before any of it reaches a
real observer.

# Contributing to Sākṣī

Thank you for wanting to work on this. Sākṣī produces one irreplaceable thing —
a photograph taken from a known point on a known day — and most of the rules
below exist to protect that, not to police style.

## Before anything else: use Node 22

```bash
node --version   # must be 22 or newer
```

The test runner uses `node --experimental-strip-types`. Node 20 rejects that
flag outright with `bad option`, so the checks do not fail — they never start,
and everything looks fine. If you use `nvm`, `nvm use` reads `.nvmrc`.

## Getting set up

```bash
npm install                  # also applies a patch to one dependency
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
npx expo start
```

The website lives in `landing/` and is a separate install:

```bash
cd landing && npm install && npm run dev
```

## One command decides whether a change is acceptable

```bash
npm run verify
```

That runs the type check, the unit tests, seed validation, the vocabulary
linter, and the Dhamma answer evaluation. **All of them must pass.** The same
five run in CI on every pull request, so running them locally only saves you a
round trip — it does not change the outcome.

## The rules the checks enforce

These are the project's promises. A change that breaks one is not a change we
can take, however good the rest of it is.

- **A measurement is never faked.** If a sensor gave nothing, store `null`. Never
  `0` — a zeroed accuracy reads as a perfect reading, and one such row poisons a
  decade of comparisons.
- **"By eye" never dresses up as "measured".** A frame aligned without a verified
  sensor lock is recorded as `gate_mode: 'manual'` and must look different on
  screen.
- **The AI proposes; a person disposes.** The damage detector offers candidates.
  It must never set severity. The Dhamma engine answers only from retrieved
  passages and refuses when they will not carry an answer.
- **Nothing is deleted.** Correct a record by adding one that supersedes it.
- **No gamification vocabulary.** *Streak, XP, level, badge, reward, points* are
  banned in content, and `npm run vocab` fails the build if one appears. Merit is
  *puṇya*: unscored, unspendable, untransferable.
- **No em dashes in anything a reader sees.** The same linter checks this.
- **The device is the source of truth.** Writes land in SQLite first, always.

If you think a rule is wrong, open an issue and argue it. Do not route around it
in a pull request.

## Where things live

| Directory | What belongs there |
| --- | --- |
| `app/` | Expo Router routes. Thin — resolve params, render a feature screen. |
| `features/` | The real screen code, grouped by surface. |
| `components/ui/` | Primitives. Nothing outside this layer names a raw colour or font. |
| `core/` | Pure logic, no device APIs. Heavily tested. |
| `services/` | The edges: camera, location, database, cloud, AI runtimes. |
| `seed/` | The source of truth for content, as editable JSON. |
| `data/generated/` | Built from `seed/` by `npm run gen`. Never edited by hand. |
| `landing/` | The public website and the custodian dashboard. |

**The layering rule:** `core/` never imports from `app/`, `features/`, or
`services/`. Dependencies point inward. That is what lets `core/` be tested
without a phone.

## Changing content

Content lives in `seed/*.json`, never in a component. After editing:

```bash
npm run gen        # regenerate data/generated/
npm run validate   # check the seed is well formed
```

In `landing/`, `npm run data` regenerates the map explorer dataset and the open
data export from the same seed files. Those outputs are committed, and CI fails
if they are out of step — so commit them with your change.

**Coordinates need provenance.** A new site must carry `coords_source`. Use
`osm` only when you have checked the position against a gazetteer; otherwise use
`doc` and let it be exported as unsurveyed. An approximate coordinate honestly
labelled is useful. An approximate coordinate presented as a survey is not.

**Facts need sources.** Every claim on a site page resolves to a named,
checkable record. If you cannot cite it, it does not ship.

## Pull requests

- Branch from `main`. Keep one concern per pull request.
- Write the commit message for someone reading it in a year who was not here:
  what changed, and why it was worth changing.
- Say what you actually verified. "Tests pass" and "I ran this on a Pixel 6a and
  the lock engaged at the Ashokan Pillar" are different claims, and the second
  one is worth much more.
- Camera, GPS, compass, the map and the damage detector cannot be judged in a
  simulator. If you touched one, test on a real phone and say so.

## Reporting a data error

A wrong coordinate or a mistranslated inscription is a more serious bug than a
layout glitch. Open an issue using the **Site data correction** template and
include the source that shows the current value is wrong.

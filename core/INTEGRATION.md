# Wiring `core/` into the app

`core/` is the device-independent logic layer — merit, geofencing, pradakṣiṇā,
quests, stillness, riddles, the close ritual, chaityāvalī, and dāna. It is pure
TypeScript: **no react, no react-native, no network, no persistence.** It
computes; the app decides what to render and when to save.

This guide is for lane B — how to consume it from the Expo app.

## The one rule

Import everything from the barrel:

```ts
import { MeritLedger, awardResurvey, GeofenceWatcher, toCoords } from '@/core';
```

`@/core` resolves through the app's existing `@/*` alias. **Do not** import from
`core/<module>/...` directly — the barrel (`core/index.ts`) is the stable
contract; the internal file layout is not.

## The coordinate seam

The app uses `{ latitude, longitude }` (`Coordinate`). core uses `{ lat, lon }`
(`Coords`). Convert at the boundary — no global type change needed:

```ts
import { toCoords, toLatLng } from '@/core';

toCoords({ latitude: 27.4696, longitude: 83.2758 }); // -> { lat, lon }  (app -> core)
toLatLng({ lat: 27.4696, lon: 83.2758 });            // -> { latitude, longitude }  (core -> app)
```

Everything below assumes you `toCoords(...)` app positions before handing them
in. `useCurrentPosition().coordinate` is `Coordinate | null` while a fix is
acquiring — guard the null before converting.

> **Data gap to close first.** The geofence and pradakṣiṇā logic needs a
> **per-site radius**. Your `HeritageSite` doesn't have one yet (only the global
> `ON_SITE_RADIUS_M = 4000`), but every site in `seed/sites.json` carries a
> `geofence_m` (30 m for the pillar, 45 m for the temple, …). Either add a
> `geofenceM` field to `HeritageSite` and populate it from the seed, or look it
> up from the seed by `id`. The snippets below assume you have a `geofenceM` in
> scope.

## Where this lives in your architecture

Your `docs/MVP-PLAN.md` §39 puts domain state in Context providers next to
`store/app-state`. That is exactly the right home for these. The pattern for
each is: a provider holds the core object (or rehydrates it from SQLite), feeds
it device/UI input, and exposes the returned state to screens. Screens stay
dumb; core stays pure; `services/database` persists.

## The injected clock/id pattern

Award and allocation functions take a small context so core needs no
`node:crypto` and no ambient clock (which keeps it testable). Build it once:

```ts
import * as Crypto from 'expo-crypto'; // or any uuid source

const ctx = {
  userId,
  day: new Date().toISOString().slice(0, 10), // "YYYY-MM-DD", local day
  nowIso: new Date().toISOString(),
  nowMs: Date.now(),
  uuid: () => Crypto.randomUUID(),
};
```

---

## Merit — ledger, daily cap, earning rules

The ledger is **append-only and earning-only**: no spend column, no transfers,
no negative amounts (Charter #9 — this is also the answer to the blockchain
question). Persist the events; rehydrate the ledger from them.

```ts
import { MeritLedger, capState, awardResurvey, MERIT } from '@/core';

// Rehydrate from whatever you stored in expo-sqlite (merit_events table):
const ledger = new MeritLedger(storedEvents);

// Award a completed resurvey (50, unless the daily cap clips it):
const res = awardResurvey(ledger, vantageId, ctx);
// res: { awarded, capped, rateLimited, event }
if (res.event) await db.appendMeritEvent(res.event); // persist the new event only

// Today's cap state, for the "you've done enough today" screen:
const cap = capState(ledger, ctx.day);
// cap: { earnedToday, cap: 200, remaining, complete }
```

Other award functions, same shape `(ledger, refId, ctx) -> AwardResult`:
`awardCorroboration` (25), `awardFirstReport` (25, **never** scaled by severity),
`awardAttentionQuest` (70), `awardPathQuest` (40), `awardContribution` (30).
`canAwardResurvey(ledger, vantageId, nowMs)` tells you up front whether the
24h-per-vantage cooldown would refuse it (so the button can explain, not fail).

**Persist:** append `res.event` to a `merit_events` table. Never store a
computed balance — derive it from the events, so the ledger stays the source of
truth.

## Geofencing — darśana proximity (Tīrtha / capture)

Hysteresis is built in: you enter at `r`, leave at `r × 1.15`, so standing on
the boundary doesn't fire a storm of events.

```ts
import { GeofenceWatcher, nearestSite, toCoords } from '@/core';

const watcher = new GeofenceWatcher(
  sites.map((s) => ({ id: s.id, coords: toCoords(s.coordinate), geofence_m: s.geofenceM })),
  // ^ geofenceM comes from seed/sites.json (see the data-gap note above)
  { dwellMs: 60_000 }, // optional: fire a 'dwell' after 60s continuously inside
);

// On each position update from useCurrentPosition:
const events = watcher.update(toCoords(position.coordinate), Date.now());
// events: [{ type: 'enter'|'exit'|'dwell', site_id, distance_m, at }]

// For the bottom card "nearest site, 40 m":
const near = nearestSite(toCoords(position.coordinate), geofenceSites);
```

## Pradakṣiṇā — clockwise circumambulation

Feed the track of positions around a monument. Completion is **≥ 330° clockwise
with ≤ 30° reverse travel**. Anticlockwise is **never a failure** — it returns
`teach: 'direction'` so you can nudge, gently.

```ts
import { evaluatePradakshina, toCoords } from '@/core';

const result = evaluatePradakshina(
  toCoords(monument.coordinate),
  monument.geofenceM,       // radius, from seed/sites.json
  track.map(toCoords),      // positions sampled every ~2-3s while walking
);
// result: { complete, degrees, direction, reverse_deg, teach? }
// teach is 'direction' | 'incomplete' | 'strayed' — show a hint, not an error.
```

## Quests — availability by proximity and time window

```ts
import { evaluateQuests, toCoords } from '@/core';

const states = evaluateQuests(quests, {
  pos: toCoords(position.coordinate),
  minutesOfDay: new Date().getHours() * 60 + new Date().getMinutes(),
  completed: new Set(completedQuestIds),
  sites: new Map(sites.map((s) => [s.id, { coords: toCoords(s.coordinate), geofence_m: s.geofenceM }])),
});
// each: { quest_id, availability: 'available'|'outside_window'|'too_far'|'completed', distance_m, completed_at }
```

## Stillness — the phone-down quest

Screen off **and** low accelerometer variance **and** inside a geofence, held
for the target duration. Uses `expo-sensors` variance + screen state.

```ts
import { StillnessTracker } from '@/core';

const tracker = new StillnessTracker(__DEV__); // debug=true collapses 10min -> 20s for the demo

// on each sensor tick:
const st = tracker.update({ screenOn, accelVariance, insideGeofence, nowMs: Date.now() });
// st: { active, heldMs, complete }
```

## Observation riddles — hint on a wrong answer, never a penalty

```ts
import { checkRiddle } from '@/core';

const r = checkRiddle(riddle, userText, attemptNumber);
// r: { correct } | { correct: false, hint: LocalisedText }  ("Seek further, traveller…")
```

## Close ritual — after 20 min inside the Sacred Garden

```ts
import { SessionCloseTracker } from '@/core';

const closer = new SessionCloseTracker(__DEV__); // debug=true -> 30s
const s = closer.update({ insideSacredZone, nowMs: Date.now() });
if (s.shouldClose) showCloseCard();  // then closer.reset() when dismissed
```

## Notification suppression — silence on consecrated ground

```ts
import { shouldSuppressNotifications } from '@/core';

if (shouldSuppressNotifications({ zone: currentZone, insideGeofence })) {
  // don't post our own notifications
}
```

## Chaityāvalī — the register of sites witnessed (not a "collection")

```ts
import { ChaityavaliRegister } from '@/core';

const register = new ChaityavaliRegister(storedEntries);
register.witness(siteId, new Date().toISOString());
register.bindCapture(siteId, captureId, new Date().toISOString());
register.list();  // ChaityavaliEntry[] — persist these
```

## Dāna — directing merit toward a need (no money moves)

```ts
import { allocate, availableMerit } from '@/core';

const free = availableMerit(ledgerBalance, existingAllocations, userId);
const res = allocate(need, amount, ledgerBalance, existingAllocations, ctx);
// res: { ok } | { ok: false, reason: 'insufficient_merit'|'need_closed'|'non_positive' }
```

---

## Persistence checklist (expo-sqlite)

core computes; you store. Tables to add alongside `observations`:
`merit_events`, `chaityavali`, `allocations`, `quest_progress`. Rehydrate the
`MeritLedger` and `ChaityavaliRegister` from their rows at startup; append the
objects core returns. Never persist a derived balance.

## Demo flags

`StillnessTracker(true)` and `SessionCloseTracker(true)` collapse the 10- and
20-minute timers to 20s / 30s so the ritual is demoable on stage in under a
minute. Flip them back **off** for any non-demo run.

## What NOT to change

`shared/` and this barrel change **by group agreement only** — they are the
contract between lanes. If you need a shape that isn't here, raise it rather than
reaching past the barrel.

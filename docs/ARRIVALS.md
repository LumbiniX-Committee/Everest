# Arrivals

Being told what a place holds, once you are standing on it.

---

## The measurement that shaped this

The four Sacred Garden monuments sit within 92 m of each other:

| Pair | Distance |
|---|---|
| Maya Devi Temple ↔ Ashoka Pillar | **39 m** |
| Maya Devi Temple ↔ Puskarini | 43 m |
| Ashoka Pillar ↔ Puskarini | 44 m |
| Maya Devi Temple ↔ Bodhi Tree | 54 m |

OS geofencing is unreliable below a ~100 m radius — Android's own guidance
recommends 100 m or more, and iOS regions that small thrash against location
accuracy. **A geofence per monument would fire the wrong one, or all four.**

So the trigger is two-tier:

| Tier | Mechanism | Answers | Works when |
|---|---|---|---|
| Arrival | one geofence per **precinct** | *have you arrived* | app closed or backgrounded¹ |
| Monument | foreground fix + `nearestSite` | *which one* | app open |

¹ See the background-location note below — currently foreground-only.

Three precincts, against an iOS cap of 20 monitored regions. `validatePrecincts`
fails loudly at startup rather than letting the OS silently drop a region or
misbehave on a too-small radius.

---

## Why the OS watches, not us

`Location.startGeofencingAsync` hands region monitoring to the platform, which
uses cell and wifi transitions and wakes the app only on a crossing. Polling GPS
in the background to compare distances is the usual way this gets built, and it
will flatten a phone over a day of walking the site.

The cost is latency: enter events take **30 s to 3 minutes**, and Android
batches them. This is not tunable. Anything that needs to look instant — a stage
demo — must use the manual trigger in Settings → Arrivals, which runs the same
`handleArrival` the geofence calls.

---

## Background location is deliberately not enabled

`ACCESS_BACKGROUND_LOCATION` is **not** in `app.json`. Geofencing therefore
fires while the app is open or recently backgrounded, not when it has been
closed for hours.

That is a deliberate trade. Adding it requires:

- a separate Android runtime prompt, shown after foreground permission
- a Play Console declaration **plus a demonstration video**, reviewed manually
- on iOS, "Always" authorization, which App Store review questions

To enable it later, add the permission to `app.json`, request it after
foreground permission is granted, and budget for the store review.

---

## What an arrival says

The banner names the precinct and says there is something to read. It does
**not** quote the passage: a notification truncates and strips the citation, and
the citation is the point. The banner's job is to get someone to open the app.

Arrivals are silent by design — `shouldPlaySound: false`, and the Android
channel has `sound: null`. Someone standing in a temple precinct should not have
their phone chime.

A precinct announces itself at most once every **6 hours**
(`ARRIVAL_COOLDOWN_MS`). Not once-ever: a pilgrim may pass through the Sacred
Garden twice in a morning. Without it, lingering near a boundary produces a
stream of banners, because enter events re-fire on every crossing.

---

## The refusal

`dhammaForSite` returns only passages whose `siteIds` genuinely include that
site. It does not fall back to something loosely related.

This matters more than it looks. The alternative — handing someone a passage
about the Buddha's last words because they walked past a pond — is exactly the
failure the Dhamma surface exists to avoid, and §25 already refuses a weak
retrieval match rather than softening it. `ArrivalWisdom` renders nothing when
the corpus has nothing, and the precinct still announces the arrival.

### Current coverage

Only `why-lumbini` is tied to sites (`ashoka-pillar`, `maya-devi-temple`). The
other three entries are about the teaching rather than a place, and linking them
to a monument would be inventing a connection.

**The corpus needs site-grounded entries before this feature has much to say.**
The sources are already there to support them — `ldt-excavation`,
`fuhrer-1896`, `unesco-1997`, `ldt-conservation`. Writing those entries is
content work, not engineering, and each one needs checking against the source it
cites.

`sitesWithDhamma()` reports current coverage; Settings → Arrivals shows it
per site.

---

## Testing without walking to Lumbini

Settings → Arrivals → tap a precinct. This runs the real `handleArrival`,
cooldown included, so a suppressed repeat behaves exactly as it would on site.
"Reset arrival history" clears the cooldowns.

To test the geofence itself, use the emulator's mock-location controls to place
the device inside a precinct centre — the coordinates are in
`data/demo/precincts.ts`.

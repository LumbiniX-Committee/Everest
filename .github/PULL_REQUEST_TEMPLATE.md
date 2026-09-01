## What this changes, and why

<!-- Write for someone reading this in a year who was not here. -->

## What you verified

<!-- Be specific. "Tests pass" and "I ran this on a Pixel 6a and the lock
     engaged at the Ashokan Pillar" are different claims. -->

- [ ] `npm run verify` passes locally (Node 22 or newer)
- [ ] Tested on a real phone, if this touches camera, GPS, compass, the map, or the damage detector
- [ ] `npm run gen` / `landing: npm run data` re-run and committed, if `seed/` changed

## The promises

Tick only what applies, and say so plainly if something here is a genuine
trade-off rather than a clean pass.

- [ ] No measurement is faked — absent readings are `null`, never `0`
- [ ] Alignment done by eye is still recorded and displayed as by eye
- [ ] The AI proposes; a person still decides severity, and answers still refuse when unsupported
- [ ] Nothing is deleted; corrections supersede rather than overwrite
- [ ] New facts carry a named, checkable source
- [ ] New coordinates carry an honest `coords_source`

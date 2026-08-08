# Failure drills — rehearse these

Source: 09-PITCH-AND-DEMO §5. The difference between teams is not whether
something breaks on stage; it is whether the response was rehearsed.

| Failure | Response |
|---|---|
| **No network** | "We built this for a site with patchy connectivity." Demo entirely offline. The map, sites, dissolve, alignment and capture all work; the capture queues. **This is a feature demo, not an apology.** |
| **GPS won't lock indoors** | Pre-seed a mock location. Have the toggle ready and mention it in one clause: "I'm mocking location since we're indoors." Don't dwell. |
| **Camera permission dialog appears** | Grant it before you walk on stage. Check this in every rehearsal. |
| **AR tier 3 fails** | One tap to the dissolve. Say nothing about what didn't happen. |
| **App crashes** | Play the backup video, keep talking at the same pace. Do not restart the app on stage. |
| **Dhamma API times out** | Cached responses for the five scripted questions. It should look instant. |
| **Judge asks something you don't know** | "I don't know — that's on our open questions list." Then name a real one from 01-RESEARCH-DOSSIER §10. This lands better than a guess, every time. |

---

## Drill notes specific to what's built

- **Offline demo is real, not staged.** The mock API supports `?delay=` and
  `?fail=` so you can *rehearse* the loading and error states deliberately (see
  `mock-api/README.md`). Practise the "no network" path against `?fail=503`.
- **The close ritual is demoable in 30 seconds.** `SessionCloseTracker(true)` and
  `StillnessTracker(true)` collapse the 20- and 10-minute timers to 30 s / 20 s —
  flip the debug flag before the run, flip it back before shipping.
- **The reticle snap** is the visible signature; make sure screen mirroring
  captures the amber→lapis cross cleanly. Rehearse the rotate-to-lock on camera.

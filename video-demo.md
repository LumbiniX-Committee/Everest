# Sākṣī: Demo Video Script and Recording Plan

*How to record a demo video that tells one clear, honest story. It gives you the
running order, what to show on screen, what to say (voiceover), rough timings, and
the exact setup so nothing fails on camera.*

*Target length: about 4 to 4.5 minutes, extended from the original 3-to-4 once
the custodian dashboard earned its own beat — that closed loop, shown live, is
the moment that sells the institutional story. If you need a very short cut,
use the 2-minute version at the end.*

---

## Before you record: setup checklist

Do all of this first. Most demo failures are setup failures.

1. **Build a real phone app.** Run `npx eas build --profile preview --platform
   android` and install the APK on the demo phone. The map and the crack detector
   are native and will not work in Expo Go.
2. **Confirm the detector is in the build.** Open Sākṣī, capture one test photo,
   and check the scan runs and dashed boxes appear. If you see the honest "no
   detector in this build" line, the build did not carry the runtime; rebuild.
3. **Pre-seed one clean observation** so the then-and-now and time-series have
   something to show, if your demo data needs it.
4. **Decide your network story.** Either run the mock API (`npm run api`) on the
   same network for live guide and Dhamma answers, or accept the offline
   fallbacks. Both are honest; just know which you are showing.
5. **Charge the phone, set brightness high, turn on Do Not Disturb** so no
   notification pops mid-take.
6. **Pick one site** to use throughout (the Sacred Garden or the Ashokan Pillar is
   ideal) so the story stays coherent.
7. **Screen-record at high resolution.** On Android use the built-in recorder or a
   USB screen mirror. Record voiceover separately if the room is noisy.
8. **If showing the custodian dashboard**, run `node mock-api/server.mjs` and
   `npm run dev` in `landing/` on a laptop on the same network, with
   `NEXT_PUBLIC_API_URL` pointed at the mock API. Have `localhost:3000/custodian`
   already open in a browser tab before you start recording, so the cut from
   phone to laptop is instant.
9. **Have the six scripted Dhamma questions ready** (they are cached, so they
   answer instantly even with no wifi):
   - "What are the four noble truths?"
   - "What did the Buddha say to the Kalamas?"
   - "What were the last words of the Buddha?"
   - "What does the Burra Charter say about reconstruction?" (heritage corpus,
     not the Pali canon — this is the widened-scope beat)
   - "What does Buddhism say about cryptocurrency?" (this one refuses, on purpose)

---

## The running order (full 4 to 4.5 minute version)

### 0:00 to 0:20 | Open with the problem

- SHOW: A slow pan across a monument, then a close crop of a real crack or moss.
- SAY: "Heritage sites are surveyed once every few years. Between surveys, small
  damage goes unrecorded. Yet thousands of people visit every week with a camera
  in their pocket. Sākṣī turns that wasted attention into evidence a conservator
  can trust."

### 0:20 to 0:35 | Show the three parts

- SHOW: Open the app. Tap once through the three tabs: Tīrtha, Sākṣī, Dhamma.
- SAY: "The app has exactly three parts. Tīrtha, the place. Sākṣī, the witness.
  Dhamma, the knowledge. That's the whole idea."

### 0:35 to 1:00 | Tīrtha: place and then-and-now

- SHOW: Open Tīrtha, tap the map, open your chosen site, and open the
  then-and-now comparison. Drag the slider slowly to fade between old and new.
- SAY: "In Tīrtha you explore Lumbini. This is the heart of it: a historical photo
  and a modern one of the same spot, and you fade between them to see what changed.
  Every image is labelled with how trustworthy it is."
- OPTIONAL SHOW: Tap the on-site guide, ask "what is this place?", let the answer
  type into the speech-cloud.
- SAY (if shown): "There's a friendly guide too. It answers freely, but it never
  fakes a condition or pretends to quote a text."

### 1:00 to 1:50 | Sākṣī: the witness loop (the core)

- SHOW: Go to Sākṣī, pick the vantage, and hold the phone up. Show the reticle and
  the live alignment readout moving. Turn slightly the wrong way so the target
  stays unlocked, then line up until it turns blue and locks.
- SAY: "This is the core. The phone becomes a survey instrument. It scores your
  position, your direction, and your tilt into one number, and it only unlocks the
  shutter when the match is genuinely good. Heading matters most; you can never
  lock while facing the wrong way."
- SHOW: Take the photo.
- SHOW (honesty beat): Briefly demonstrate "match by eye". Show the dashed
  sand-coloured target and the honest label on the observation.
- SAY: "If conditions are bad, you can shoot by eye, but the record says so. It
  never dresses up a rough frame as a measured one. That's what makes the whole
  dataset usable."

### 1:50 to 2:30 | The on-device crack detector

- SHOW: On the observation screen, let the scan run automatically. Dashed
  candidate boxes appear over the photo, with the summary card and its confidence.
- SAY: "As soon as you capture, a real AI model runs on the phone, offline, and
  finds cracks. Its honest accuracy is 82%, shown right here, never rounded up.
  The boxes are dashed on purpose: these are candidates, not verdicts."
- SHOW: Tap "file this as a report". The condition sheet opens at severity. Set a
  severity and save.
- SAY: "The AI fills in what it found. The person always decides how urgent it is.
  And the saved report is flagged as AI-assisted, so a later reader knows."

### 2:30 to 3:00 | The custodian dashboard: closing the loop

- SHOW: Cut to a laptop browser, already open on `localhost:3000/custodian`. The
  report you just filed appears in the list. Filter to "Open", find it, type a
  short note, and tap Acknowledge. The status updates live.
- SAY: "That report doesn't just sit on the phone. It reaches a custodian
  dashboard — the same view works in-app for a caretaker without a laptop —
  showing every open report, and how long each one waited before someone
  looked. This is the product a heritage authority actually pays for."
- OPTIONAL SHOW: Tap the CSV or GeoJSON export link.
- SAY (if shown): "Export opens straight in QGIS. This is a real GIS workflow,
  not a screenshot of one."

### 3:00 to 3:40 | Dhamma: the grounded AI, now wider than the canon

- SHOW: Go to Dhamma. Ask "What are the four noble truths?" Show the answer with
  its citation and source card.
- SAY: "Dhamma answers questions about Buddhist teaching, but only from real
  canonical sources, always with a citation."
- SHOW: Ask "What does the Burra Charter say about reconstruction?" Show the
  cited answer from the conservation corpus.
- SAY: "Since the hackathon we widened the corpus. The same engine now answers
  a conservation question — UNESCO records, the ICOMOS charters, Kathmandu
  Valley archaeology — with the same discipline: cite a real source, or
  refuse. Same behaviour, wider subject matter."
- SHOW: Ask "What does Buddhism say about cryptocurrency?" Show the honest refusal.
- SAY: "And when the sources don't support an answer, it refuses. That refusal is
  the feature. A grounded AI that never makes things up is exactly what a sacred
  and historical context needs."

### 3:40 to 4:15 | The honest close

- SHOW: The Guardians leaderboard, briefly. Then a quick cut to the Manga Hiti
  site in the Kathmandu Valley, then return to the then-and-now fade.
- SAY: "Contribution is recognised without gamifying truth. Merit can't be spent or
  ranked, and the leaderboard ranks real uploaded evidence, so you can't fake it."
- SAY: "We piloted this at Lumbini and just generalised it to three Kathmandu
  Valley sites on the same architecture. There are over 1,200 UNESCO
  properties with the same gap."
- SAY: "Sākṣī: a witness that guides, an AI that never lies, a custodian who
  can act, and a record worth trusting, built by the people already standing
  in front of the monument. Thank you."

---

## The 2-minute cut

If you only have two minutes, keep these beats and drop the rest:

1. Problem (0:00 to 0:15).
2. Then-and-now fade (0:15 to 0:35).
3. The witness loop: reticle locking, capture, and the by-eye honesty beat (0:35
   to 1:15).
4. The crack detector: scan, dashed boxes, file the report (1:15 to 1:35).
5. The custodian dashboard: cut to the browser, acknowledge the report you just
   filed (1:35 to 1:50).
6. Dhamma: one cited answer and one refusal (1:50 to 2:05).

The three things you must never cut, because they are the whole pitch: the
**honesty beat** (by-eye vs measured), the **closed loop** (a custodian actually
acting on the report), and the **refusal** (an AI that says no).

---

## Recording tips

- **One take per section, then edit.** Do not try to do the whole app in one
  continuous take; a single stumble wastes it.
- **Move the phone slowly.** Fast motion looks bad on screen recordings and can
  blur the reticle.
- **Let text finish.** When the guide or Dhamma answer types out, wait for it to
  finish before cutting.
- **Show a real crack for the detector.** If you can point the camera at an actual
  cracked surface, do it; a real detection is far more convincing than a staged
  one.
- **Cut cleanly between phone and laptop for the custodian beat.** Have the
  dashboard tab already loaded and the report list already filtered, so the
  cut lands on the acknowledgement itself, not on page-load spinners.
- **Keep the voiceover calm.** The product's whole personality is honesty and
  restraint. Match that tone.
- **Caption the honest bits.** Add on-screen text for "mAP50 0.8167", "framed by
  eye, not measured", and "refused: not found in the canon", so a muted viewer
  still gets them.

---

## What each section proves (so you can defend it)

| Section shown | What it proves to a judge |
|---|---|
| Then-and-now fade | The product's value in one gesture: comparable evidence. |
| Reticle locking | The phone really is a survey instrument, not a camera. |
| By-eye honesty beat | The charter is real and enforced, not marketing. |
| Crack detector with dashed boxes | Real on-device AI, honest accuracy, candidates not verdicts. |
| AI-assisted flag on the report | Provenance is recorded end to end. |
| Custodian dashboard, live acknowledgement | The loop actually closes. This is the product an institution pays for, not a mockup. |
| Cited Dhamma answer (canon) | Grounded, source-backed knowledge. |
| Cited Dhamma answer (heritage corpus) | The refuse-or-cite discipline generalises past the Pali canon. |
| Dhamma refusal | The AI will not make things up. The trust feature. |
| Guardians leaderboard | Motivation without gaming the truth. |
| Manga Hiti / Kathmandu Valley cut | One pilot generalises to a platform, not a one-off demo. |

---

*This script pairs with `slides.md` (the deck) and `documentation.md` (the full
product and system details). Record the setup checklist first; it is where demos
are won or lost.*

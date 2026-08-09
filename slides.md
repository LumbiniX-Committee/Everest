# Sākṣī: Pitch Deck

*A simple, presentation-ready slide plan. Each slide has a title, the key points
to say, and a note on which screenshot or image to show. Keep one idea per slide.
Aim for about 12 to 15 slides and 6 to 8 minutes.*

*How to use this file: each `##` heading is one slide. The "SAY" lines are your
talking points (keep them short on screen, expand out loud). The "SHOW" line tells
you which image or screenshot to place on that slide.*

---

## Slide 1: Title

**Sākṣī**
Turning a visitor's attention into conservation evidence.

- SAY: Sākṣī means *witness*. A heritage and pilgrimage app for Lumbini, the
  birthplace of the Buddha.
- SAY: Built for LumbiniX 2026 by the LumbiniX-Committee team.
- SHOW: The app icon on a clean background, with the Lumbini Sacred Garden or the
  Ashokan Pillar behind it. Use `assets/icon.png` over a wide site photo.

---

## Slide 2: The problem

Heritage monitoring is slow, rare, and expensive. Visitor attention is wasted.

- SAY: A professional condition survey happens once every few years. Between them,
  small damage (a widening crack, creeping moss, water pooling) goes unrecorded.
- SAY: Meanwhile thousands of people visit every week with good cameras, and none
  of that observation is usable, because a random photo proves nothing.
- SHOW: A split image. Left: a beautiful monument. Right: a close crop of a real
  crack or moss on stone. Use a photo from `imagesupdate` era or a stock heritage
  crack image.

---

## Slide 3: Why casual photos do not work

Trust needs three things a tourist photo does not have.

- SAY: Position (same spot every time), honesty about accuracy (survey-grade vs
  by-eye), and provenance (who, when, where, how verified).
- SAY: Without those, more photos just means a bigger useless pile.
- SHOW: A simple three-icon graphic: a pin (position), a checkmark shield
  (honesty), a label tag (provenance). Plain icons, no screenshot needed.

---

## Slide 4: Our solution, in one image

Two photos of the same spot, from the same point, that you can fade between.

- SAY: The whole product is comparability. Line the phone up with a fixed
  viewpoint, capture today, and build a time-series a conservator can trust.
- SHOW: The **then-and-now** compare screen mid-fade. Screenshot the Tīrtha
  then-and-now screen (`app/(main)/tirtha/then-now/[siteId]`). This is your
  strongest single image.

---

## Slide 5: The three parts

Tīrtha, Sākṣī, Dhamma. Exactly three. No Home, no Rewards.

- SAY: Tīrtha is *place* (explore and compare). Sākṣī is *witness* (the capture
  loop). Dhamma is *knowledge* (source-backed answers).
- SAY: Three destinations is the whole conceptual model, not just tabs.
- SHOW: One image with three phone screenshots side by side, one per surface: the
  Tīrtha map, the Sākṣī capture/reticle screen, and the Dhamma answer screen.

---

## Slide 6: Tīrtha, the place layer

Explore Lumbini, read the history, compare then and now.

- SAY: An interactive map of the 12 sites, with a friendly on-site guide you can
  ask anything, and honest evidence-tier labels on every historical image.
- SAY: The guide answers freely but never fakes a condition or a quote.
- SHOW: Two screenshots stacked or side by side: the Tīrtha map
  (`app/(main)/tirtha/map`) and the on-site guide speech-cloud
  (`features/tirtha/BuddhaChat`).

---

## Slide 7: Sākṣī, the witness loop

Pick a viewpoint, line up, capture, record the condition.

- SAY: The phone becomes a survey instrument. One alignment score drives the
  on-screen target and unlocks the shutter only when the match is genuinely good.
- SAY: Heading matters most; you can never lock while facing the wrong way.
- SHOW: The capture screen with the **reticle** and the live alignment readout.
  Screenshot `features/sakshi/CaptureScreen` with the reticle near lock (blue).

---

## Slide 8: Honesty, the core idea

"By eye" is never dressed up as "measured".

- SAY: If you cannot get a good lock, you can still shoot by eye, but the record
  says so with a dashed sand-coloured target and a clear label, and it never
  stores a fake score.
- SAY: A conservator can filter the whole dataset by trust level. That is what
  makes it usable.
- SHOW: Side by side: a locked (blue) reticle vs a by-eye (dashed sand) reticle,
  with the observation screen's honesty label visible. Screenshot both states.

---

## Slide 9: Real on-device AI, the crack detector

The AI suggests candidates. A human confirms.

- SAY: A real YOLOv8 model runs on the phone, offline, and finds cracks. Honest
  accuracy: mAP50 of 0.8167, shown in the app, never rounded up.
- SAY: Boxes are dashed on purpose. The AI fills in *what*; the person always sets
  *how urgent*. Assisted reports are flagged in the record.
- SHOW: The observation screen with dashed candidate boxes over a real photo and
  the pathology summary card. Screenshot `ObservationScreen` after a scan
  (`YoloVisionOverlay` + `PathologySummaryCard`).

---

## Slide 10: Dhamma, the grounded AI

Cite or refuse. Never make things up.

- SAY: Questions about Buddhist teaching are answered only from real canonical
  sources, with citations, and refused when the sources do not support an answer.
- SAY: It scores 50 out of 50 on our benchmark, resists impersonation and
  prompt-injection, and is Nepali-first. It works offline too.
- SHOW: Two screenshots: a cited answer (`DhammaChatScreen` with a source card)
  and an honest refusal. Show both so the refusal reads as a feature.

---

## Slide 11: Merit and the honest leaderboard

Puṇya, not points. A leaderboard you cannot fake.

- SAY: Merit cannot be spent, traded, or ranked. It fits a sacred context.
- SAY: The "Guardians" leaderboard ranks contribution to the shared record,
  computed on the server from uploaded evidence, so you cannot inflate it without
  doing the work.
- SHOW: The Guardians leaderboard screen (`app/(main)/sakshi/guardians`), and
  optionally a small merit acknowledgement card.

---

## Slide 12: Architecture, at a glance

Offline-first phone, a pure testable brain, a cloud copy.

- SAY: Every record is written to the phone first. The heavy AI runs on the phone.
  The cloud (Supabase) is a copy. All the important logic is pure and unit-tested.
- SAY: Honesty is enforced by an automated gate, `npm run verify`, so
  trustworthiness is structural, not a claim.
- SHOW: The architecture diagram from `documentation.md` section 6 (phone on top,
  cloud below, mock API note). Redraw it cleanly as a slide graphic.

---

## Slide 13: Tech stack

- SAY: React Native and Expo (SDK 57), TypeScript, SQLite on device.
- SAY: onnxruntime for the crack detector, llama.rn for the offline LLM, MapLibre
  for the map, Supabase for the cloud, Ollama Cloud for Dhamma synthesis.
- SHOW: A simple grid of logos or labels. No screenshot. Keep it to one clean row
  of names.

---

## Slide 14: The business model

Free for visitors. Paid for the people who need the data.

- SAY: The visitor app stays free. Revenue comes from grants, a licensed custodian
  dashboard for heritage authorities, and ethical research data services.
- SAY: The honesty model is also the moat: only trustworthy data is worth paying
  for, and our discipline is hard to copy.
- SHOW: A simple diagram: visitors (free, contribute) -> evidence -> authorities
  (pay for the dashboard). Three boxes and two arrows.

---

## Slide 15: Limitations, honestly

We say our limits out loud. It is the whole point.

- SAY: Some coordinates are documentary approximations, not surveyed. The detector
  finds cracks only, at 82%, offering candidates. The corpus is deliberately
  narrow. Some sync paths are written but not fully proven.
- SAY: Being precise about limits is part of the charter, not an apology.
- SHOW: No screenshot. A clean bullet list, calm tone.

---

## Slide 16: Close

Sākṣī: a witness that guides, an AI that never lies, and a record worth trusting.

- SAY: Built by the people already standing in front of the monument. Scales to
  any heritage site.
- SAY: Thank you. Questions welcome.
- SHOW: The strongest single image again (the then-and-now fade), with the app
  name and the team name.

---

## Appendix: screenshot capture checklist

Capture these on a real phone build (dark or light, be consistent) before you
build the deck. File each under a `deck-shots/` folder named as noted.

| # | Screenshot | Where in app | Slide | Filename |
|---|---|---|---|---|
| 1 | App icon over a site photo | asset composite | 1 | `01-title.png` |
| 2 | Then-and-now mid-fade | Tīrtha then-and-now | 4, 16 | `04-thennow.png` |
| 3 | Three surfaces side by side | Tīrtha / Sākṣī / Dhamma homes | 5 | `05-three-surfaces.png` |
| 4 | Map of Lumbini | Tīrtha map | 6 | `06a-map.png` |
| 5 | On-site guide cloud | Tīrtha guide | 6 | `06b-guide.png` |
| 6 | Reticle near lock (blue) | Sākṣī capture | 7 | `07-reticle-lock.png` |
| 7 | Reticle by eye (dashed sand) | Sākṣī capture (manual) | 8 | `08a-reticle-eye.png` |
| 8 | Observation honesty label | Sākṣī observation | 8 | `08b-honesty-label.png` |
| 9 | Dashed crack boxes + summary | Sākṣī observation after scan | 9 | `09-detector.png` |
| 10 | Cited Dhamma answer | Dhamma chat | 10 | `10a-answer.png` |
| 11 | Honest refusal | Dhamma chat | 10 | `10b-refusal.png` |
| 12 | Guardians leaderboard | Sākṣī guardians | 11 | `11-guardians.png` |

Tips: use the same phone frame for all shots, hide the status-bar clutter, and
prefer real Lumbini content over demo placeholders wherever the data allows.

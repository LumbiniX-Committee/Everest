# Sākṣī: Pitch Deck

*A simple, presentation-ready slide plan. Each slide has a title, the key points
to say, and a note on which screenshot or image to show. Keep one idea per slide.
Aim for about 15 to 18 slides and 8 to 10 minutes — this grew from the original
12-to-15 plan once the custodian dashboard and the Kathmandu Valley sites earned
their own slides; cut the tech-stack slide first if you need to come back down.*

*How to use this file: each `##` heading is one slide. The "SAY" lines are your
talking points (keep them short on screen, expand out loud). The "SHOW" line tells
you which image or screenshot to place on that slide.*

*Refreshed 2026-09-12. The product is now live at
`https://project-saksi.vercel.app` (English and Nepali), and the custodian
dashboard runs there for real rather than only on a laptop — wherever a slide
below says "screenshot the dashboard," prefer a live browser tab over a
screenshot if you're presenting in person.*

---

## Slide 1: Title

**Sākṣī**
A conservation-evidence network that uses pilgrimage as its distribution channel.

- SAY: Sākṣī means *witness*. It launched at Lumbini, the birthplace of the
  Buddha, and now covers Kathmandu Valley UNESCO sites alongside it.
- SAY: Built for LumbiniX 2026 by the LumbiniX-Committee team. Now live at
  project-saksi.vercel.app, in English and Nepali.
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

- SAY: An interactive map of the sites, with a friendly on-site guide you can
  ask anything, and honest evidence-tier labels on every historical image.
- SAY: The guide answers freely but never fakes a condition or a quote.
- SAY: Quests do not point at what is popular. They point at whatever vantage
  or spout has gone longest without a resurvey. A visitor's discovery is
  always also a resurvey — the app is built so doing one does the other.
- SHOW: Two screenshots stacked or side by side: the Tīrtha map
  (`app/(main)/tirtha/map`) and the on-site guide speech-cloud
  (`features/tirtha/BuddhaChat`).

---

## Slide 6a: Beyond Lumbini — the platform

One pilgrimage app, or a network that generalises to any monitored site.

- SAY: We added three Kathmandu Valley UNESCO monument-zone sites —
  Patan Durbar Square, Changu Narayan, and Manga Hiti — on the same
  architecture, same corpus discipline, same custodian loop, no rewrite.
- SAY: Manga Hiti is the sharpest proof point: a 6th-century stone water
  spout. A 2019 valley-wide survey found fewer than half of its kind still
  flowing, and almost none are watched on any continuous schedule. That is
  exactly the gap this app exists to close.
- SAY: There are over 1,200 UNESCO World Heritage properties. The Lumbini
  pilot is the proof; the Kathmandu Valley sites are the first generalisation,
  not a special case.
- SHOW: The Tīrtha map or site list showing both regions, and the Manga Hiti
  site detail screen (`app/(main)/tirtha/site/manga-hiti`).

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

## Slide 9a: The custodian dashboard — closing the loop, live

A report nobody reads is not evidence. This is where it goes, and it's a real
address now, not a laptop demo.

- SAY: Every condition report reaches a custodian dashboard — a web view for
  a heritage office, and the same thing in-app for a caretaker on their
  phone — showing coverage, median time to acknowledgement, and every open
  report by site and status.
- SAY: It's live today at project-saksi.vercel.app/custodian. Access is
  invite-only and scoped per site by the database itself, not by a front-end
  check — a signed-in account with no site assigned sees nothing.
- SAY: A custodian acknowledges, marks in-progress, or resolves a report with
  a note, right from either surface. CSV and GeoJSON export open directly in
  QGIS for a real GIS workflow.
- SAY: This is the product an institution actually pays for. Everything else
  in the app exists to fill this dashboard with something worth reading.
- SHOW: The live web dashboard, in a browser tab if presenting in person, and
  the in-app custodian screen (`app/(main)/settings/custodian`) side by side.

---

## Slide 10: Dhamma, the grounded AI

Cite or refuse. Never make things up.

- SAY: Questions about Buddhist teaching *and* heritage conservation — UNESCO
  records, the ICOMOS Venice and Burra Charters, Kathmandu Valley archaeology,
  and now Hindu and Newar heritage sources too — are answered only from real
  sources, with citations, and refused when the sources do not support an
  answer.
- SAY: It scores 74 out of 74 on our benchmark — up from 68 at the hackathon
  — resists impersonation and prompt-injection, and is Nepali-first. It works
  offline too.
- SAY: We didn't stop at "the citation is real." A second, stricter check now
  verifies that every sentence of a cached answer is actually supported by
  the passage it cites, not just that the citation ID resolves. That check
  reads zero unsupported spans.
- SAY: The same refuse-rather-than-fabricate mechanism that won this
  hackathon on the Pali canon now answers a conservation question about a
  Malla-era temple, or a question about Vaishnava iconography at Changu
  Narayan, with a real, checkable citation. Same behaviour, wider subject
  matter.
- SHOW: Two screenshots: a cited answer (`DhammaChatScreen` with a source card)
  and an honest refusal. Show both so the refusal reads as a feature. If time
  allows, a third showing a heritage-corpus citation (e.g. asking about the
  Burra Charter or Manga Hiti) makes the widened scope concrete.

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

Offline-first phone, a pure testable brain, a cloud copy, a live web front door.

- SAY: Every record is written to the phone first. The heavy AI runs on the phone.
  The cloud (Supabase) is a copy, protected by row-level security scoped to who
  is actually signed in. All the important logic is pure and unit-tested.
- SAY: Honesty is enforced by an automated gate, `npm run verify`, across
  both the mobile app and the web dashboard — 185 tests total — so
  trustworthiness is structural, not a claim.
- SHOW: The architecture diagram (phone on top, cloud below, the public
  bilingual website and custodian dashboard as the front door). Redraw it
  cleanly as a slide graphic.

---

## Slide 13: Tech stack

- SAY: React Native and Expo (SDK 57), TypeScript, SQLite on device.
- SAY: onnxruntime for the crack detector, llama.rn for the offline LLM, MapLibre
  for the map, Supabase for the cloud and custodian auth, Next.js for the
  bilingual public website, Ollama Cloud for Dhamma synthesis.
- SHOW: A simple grid of logos or labels. No screenshot. Keep it to one clean row
  of names.

---

## Slide 14: The business model

Free for visitors. Paid for the people who need the data. Never paid by anyone
with a stake in what the record says.

- SAY: The visitor app stays free. Revenue comes from grants and a licensed
  custodian dashboard for heritage authorities — the same live dashboard just
  shown, not a hypothetical one.
- SAY: We publish an ethics policy and a privacy policy, both live on the
  website: no money, ever, from a commercial entity operating inside a site
  we monitor, no sponsored recommendations, and a plain statement of what
  personal data the app collects and how to remove it. A government buyer
  has to trust the record, and that trust does not survive a sponsor with a
  stake in what it says.
- SAY: The honesty model is also the moat: only trustworthy data is worth paying
  for, and our discipline is hard to copy.
- SHOW: A simple diagram: visitors (free, contribute) -> evidence -> authorities
  (pay for the dashboard). Three boxes and two arrows. Optionally overlay the
  ethics-policy URL (`project-saksi.vercel.app/en/ethics`) in a corner.

---

## Slide 15: Limitations, honestly

We say our limits out loud. It is the whole point.

- SAY: Some coordinates are documentary approximations, not surveyed. The detector
  finds cracks only, at 82%, offering candidates.
- SAY: The three Kathmandu Valley sites ship with real, sourced facts,
  timeline, and vantages, but some do not yet carry a reconstruction plate —
  that needs a harvested or generated image we did not have the pipeline
  access to produce this cycle. The site screen says so rather than faking a
  photo.
- SAY: No institutional partner has signed on yet. Outreach is underway; a
  screenshot of one supportive reply would be the next proof point.
- SAY: Play Store publication is prepared — production build pipeline done,
  listing content written — but submission through our partner publisher
  account is still in progress, not live yet.
- SAY: Being precise about limits is part of the charter, not an apology.
- SHOW: No screenshot. A clean bullet list, calm tone.

---

## Slide 16: Close

Sākṣī: a witness that guides, an AI that never lies, a custodian who can act,
and a record worth trusting.

- SAY: Built by the people already standing in front of the monument. Piloted
  at Lumbini, generalised to the Kathmandu Valley, live today at
  project-saksi.vercel.app in two languages, and built to scale to any of
  the world's 1,200-plus UNESCO sites nobody is watching continuously.
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
| 6 | Manga Hiti site detail (Kathmandu Valley) | Tīrtha site | 6a | `06c-manga-hiti.png` |
| 7 | Reticle near lock (blue) | Sākṣī capture | 7 | `07-reticle-lock.png` |
| 8 | Reticle by eye (dashed sand) | Sākṣī capture (manual) | 8 | `08a-reticle-eye.png` |
| 9 | Observation honesty label | Sākṣī observation | 8 | `08b-honesty-label.png` |
| 10 | Dashed crack boxes + summary | Sākṣī observation after scan | 9 | `09-detector.png` |
| 11 | Live custodian dashboard (browser) | `project-saksi.vercel.app/custodian` | 9a | `09a-dashboard-web.png` |
| 12 | Custodian in-app screen | Settings → Custodian | 9a | `09a-dashboard-app.png` |
| 13 | Cited Dhamma answer | Dhamma chat | 10 | `10a-answer.png` |
| 14 | Honest refusal | Dhamma chat | 10 | `10b-refusal.png` |
| 15 | Heritage-corpus citation (e.g. Burra Charter, Manga Hiti, Changu Narayan) | Dhamma chat | 10 | `10c-heritage-citation.png` |
| 16 | Guardians leaderboard | Sākṣī guardians | 11 | `11-guardians.png` |
| 17 | Bilingual public site (EN/NE side by side) | `project-saksi.vercel.app` `/en` and `/ne` | 1, 16 | `17-bilingual-site.png` |

Tips: use the same phone frame for all shots, hide the status-bar clutter, and
prefer real Lumbini and Kathmandu Valley content over demo placeholders
wherever the data allows. For the dashboard shot, a live browser screenshot
beats a screen recording still — it's proof the address in slide 1 is real.

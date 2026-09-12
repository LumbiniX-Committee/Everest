# ICT Award 2026 — Rising Star Innovation Award
## Sākṣī — submission copy

*Prepared 2026-08-31, refreshed 2026-09-12. Every figure below is verifiable
against this repository (`LumbiniX-Committee/Everest`) at commit `1a7b976`.
Fields marked **[FILL IN]** need information only the team has.*

---

# SECTION 1 — Primary Information

## Nominee & Project Information

**Name of Rising Star Project / Idea / Innovation / Work**
```
Sākṣī
```
*(If the form renders Devanagari poorly, use: `Sakshi (Sākṣī)`)*

**Full Name of Nominee / Representative**
```
Aaditya Sapkota
```

**Email Address**
```
sayhi.aaditya@gmail.com
```

**Country Code**
```
+977
```

**Contact Number (Mobile)**
```
9765662965
```

**Representative Name(s) (If Different From Above)**
```
Aaditya Sapkota (representing the LumbiniX-Committee team)
```

## Address Details

**Province** — **[FILL IN]**
**District** — **[FILL IN]**
**Local Government Body** — **[FILL IN]**
**Street** (max 255 chars) — **[FILL IN]** — format: `Street, Ward No, Tole`

## Team Member(s) — Full Name and DOB

**[FILL IN — one entry per member, each needs full legal name + DOB in YYYY-MM-DD]**

Known from the repository, to be confirmed and completed by you:
- Aaditya Sapkota — DOB: **[FILL IN]**
- Siddanta Sodari — DOB: **[FILL IN]** *(listed as EAS project owner in `app.json`)*
- **[FILL IN — remaining members]**

> Check the award's eligibility rules for a maximum team size and an upper age
> limit before submitting, and list members in the same order everywhere.

## Additional Information

**Alternative Contact Number / Email** — **[FILL IN, optional]**
*(Suggestion: use a second team member's contact so the nomination is reachable
if one phone is unavailable during judging.)*

**Relevant Educational Institution(s) or Affiliation(s)** — **[FILL IN]**

Suggested phrasing once you insert the institution name:
```
[Institution name], [Programme / Faculty] — all team members are currently
enrolled students. The project has no company affiliation, no corporate
sponsor, and no external commercial funding; it was built and is maintained
independently by the team under the name LumbiniX-Committee.
```

**Official Website or Project Page**
```
https://project-saksi.vercel.app
```
> Live and bilingual (English at `/en`, Nepali at `/ne`): the product
> explainer, the "for custodians" page, the published data-transparency and
> ethics pages, the privacy policy, and the authenticated custodian
> dashboard itself. Put the GitHub repository as a secondary link
> (`https://github.com/LumbiniX-Committee/Everest`) — the site is the first
> thing a judge should see; the source is where they check the site is real.

---

# SECTION 2 — Innovation / Project Details

## Category That Best Describes Your Innovation/Project

**[SELECT FROM THEIR DROPDOWN]** — I do not have the option list. In order of fit:

1. **AI / Machine Learning** — strongest fit. Two distinct AI systems ship in the
   product: on-device computer vision and a citation-locked retrieval engine.
2. **Social Impact / Sustainable Development** — if the list is impact-led.
3. **Tourism / Culture / Heritage Tech** — if such a category exists, this is the
   most precise description.
4. **Mobile Application** — accurate but undersells the work.

If you must pick one and "AI" is available, pick it: the refusal-and-citation
mechanism is the most defensible innovation claim in the submission.

---

## Description of the Project / Innovation / Idea / Work
*(Objective, problem it solves, target audience, current development stage)*

```
OBJECTIVE

Sākṣī turns a visitor's attention into conservation-grade evidence. It is a
mobile application that guides an ordinary person standing in front of a
heritage monument to produce a photograph precise enough for a conservator to
use as a measurement, and it delivers that evidence to the institution
responsible for the site.

Sākṣī (साक्षी) means "witness": someone who sees a thing directly and can speak
to it.

THE PROBLEM

Heritage monitoring in Nepal has a structural gap, not a funding failure. A
World Heritage property is formally assessed by expert missions that last days
and recur every few years. Between those missions, incremental change goes
unrecorded: a crack widening by a millimetre a season, moss advancing across a
plinth, a stone water spout that quietly stops flowing. Nobody is watching
continuously, because continuous expert observation is not affordable anywhere
in the world.

Nepal has specific, documented reasons to care. The Kathmandu Valley was placed
on the UNESCO List of World Heritage in Danger in 2003 over loss of
authenticity, and removed only in 2007. The April 2015 earthquake destroyed
Changu Narayan temple outright and collapsed the Hari Shankar Temple at Patan
Durbar Square; reconstruction took roughly five and eight years respectively,
and throughout that period no continuous, position-registered visual record was
being kept. A 2019 survey of the Valley's dhunge dhara (traditional stone water
spouts) recorded 573 across the Valley's municipalities: 94 had already been
lost entirely, and only 224 of the remaining 479 still produced water. That is
ongoing, measurable, largely undocumented loss.

Meanwhile, millions of visitors pass through these sites every year carrying
capable cameras, and none of that observation is usable. A tourist photograph
proves nothing, because it lacks the three properties evidence requires: a known
position, honest metadata about its own accuracy, and traceable provenance.

THE SOLUTION

Sākṣī applies fixed-point rephotography — a standard conservation technique,
normally requiring a surveyor — as a consumer mechanic. The app directs a
visitor to a surveyed vantage point and turns the phone into a survey
instrument: it fuses GPS position, compass bearing and device pitch into a
single weighted alignment score, and unlocks the shutter only when the match is
genuinely good and the GPS fix is accurate enough to trust. The result is not a
photo upload. It is a registered time series: the same frame, returned to across
months and years, in which change is legible by comparison rather than by
opinion.

Every capture is written to the phone first and carries its own honesty
metadata. If conditions make a proper lock impossible, the visitor can still
frame by eye — and the record says so, permanently and visibly, rather than
presenting a rough frame as a measured one. A conservator can therefore filter
the entire dataset by trust level, which is precisely what makes it usable.

TARGET AUDIENCE

Sākṣī has two distinct audiences by design, which is the core of the model:

- The people who PRODUCE the evidence: domestic and international visitors and
  pilgrims already standing at the monument. For them the app is a guide, a
  history, and a reason to look closely.
- The people who CONSUME it: heritage custodians and authorities — Nepal's
  Department of Archaeology, the Lumbini Development Trust, municipal heritage
  sections, site caretakers, and conservation researchers. For them the app is a
  monitoring dashboard fed by a stream of dated, position-registered
  observations they did not have to pay a surveyor to collect.

CURRENT DEVELOPMENT STAGE

A working, deployed system, not a slideware prototype. It won first place at
the LumbiniX 2026 national hackathon, and has since been substantially
expanded from a single-site demonstration into a live, bilingual, multi-region
platform. Concretely, as of this submission:

- 15 heritage sites across 2 regions (the Lumbini sacred garden and monastic
  zones; three Kathmandu Valley UNESCO monument-zone sites), plus detailed
  records for 18 Patan monuments and 40 Kathmandu Valley landmarks.
- 12 surveyed vantage points with per-vantage position and bearing tolerances.
- An on-device damage detector (YOLOv8, mAP50 0.8167) running offline.
- A citation-locked question-answering engine scoring 74/74 on its own
  adversarial benchmark — up from 68/68 at hackathon time, after widening the
  corpus to Hindu and Newar heritage sources — with zero fabricated citations
  and, on top of that, a second, stricter check that verifies the individual
  sentences of every cached answer are actually supported by the retrieved
  source text, not merely that a citation ID resolves. That check also reads
  zero unsupported spans.
- A live, public, bilingual (English and Nepali) website, including a
  published privacy policy, a public data-transparency page, and an
  authenticated custodian dashboard — the same product a heritage office would
  actually use, reachable at the URL in Section 1, not only on localhost.
- The same custodian dashboard also ships as an in-app screen, closing the
  loop from a visitor's report to a caretaker's acknowledgement from either
  surface.
- 185 automated tests passing across the mobile app and the web dashboard,
  plus an automated content and vocabulary gate, all enforced in one command.
- Installable Android builds produced through EAS, with a production release
  profile configured and a documented handoff process for Play Store
  submission through a partner publishing account.

The application runs on Android and iOS via Expo, with a public GitHub
repository. No institutional agreement has been signed yet — stated plainly
here rather than implied away.
```

---

## Features and Uniqueness of the Project

```
1. A GUIDED ALIGNMENT GATE THAT CANNOT BE FAKED

The central feature, and the one with no consumer equivalent. The app computes a
weighted alignment score from position error, bearing error and pitch error
against a surveyed vantage, with per-vantage tolerances (a stone slab and a
dispersed palace complex do not share a threshold). Bearing is weighted hardest:
you can never achieve a lock while facing the wrong way. The shutter unlocks on
a genuine match, not on the user's confidence.

What makes it unique is the escape hatch. A "match by eye" mode exists for bad
conditions — and every by-eye capture is stored, displayed and exported as
by-eye, with a visually distinct reticle and an explicit label. The app never
stores a fabricated score. Where there was no GPS fix it records "unknown", not
zero, because zero would read as a perfect measurement. This single discipline
is what converts a pile of photographs into a filterable dataset.

2. AN AI THAT REFUSES RATHER THAN FABRICATES

Sākṣī's question-answering engine retrieves passages from a fixed corpus, writes
an answer using only those passages, and then validates every citation in its
own output: any answer containing a citation that does not resolve to a genuinely
retrieved passage is discarded rather than shown. When the corpus does not
support an answer, it says so instead of guessing.

This is measured, not asserted, and the measurement recently got stricter. The
engine scores 74/74 on a purpose-built benchmark spanning answerable questions,
deliberately adjacent questions, out-of-scope questions that must be refused,
adversarial impersonation and prompt-injection attempts, Nepali-language
questions, and heritage-conservation questions — with the count of "citations
naming an unretrieved passage" held at zero. A second, span-level check goes
further than citation IDs: it strips the citation markers from every
hand-written cached answer, splits the answer into spans, and confirms each
span's content is actually covered by the source text the citation points to —
not merely that the ID is a real one. That check reads zero unsupported spans
too. Both benchmarks run in the automated verification gate, so a regression
breaks the build.

3. PROVENANCE DECLARED ON EVERY IMAGE

Every historical or reconstructed image carries a mandatory evidence tier:
historical photograph, survey drawing, conditioned reconstruction, or artistic
impression. The tier is rendered in the interface. A viewer can always tell a
real 1899 photograph from an AI-assisted reconstruction, and a reconstruction
must name the source it was conditioned on or it does not ship.

4. ON-DEVICE AI THAT SUGGESTS BUT NEVER DECIDES

A YOLOv8 crack detector runs locally on the phone, offline, with a published
accuracy of mAP50 0.8167 shown inside the app and never rounded up. Its findings
are drawn as dashed boxes to signal candidacy rather than verdict. The AI fills
in what it found; a human always sets how serious it is. Any report produced
with AI assistance is permanently flagged as such.

5. A CLOSED INSTITUTIONAL LOOP, LIVE AND AUTHENTICATED

Reports do not accumulate in a database nobody reads. A custodian dashboard —
web for a heritage office, in-app for a caretaker in the field — shows coverage,
median time to acknowledgement, and every open report by site and status, and
lets a custodian acknowledge, mark in progress, or resolve a report with a note.
Access is invite-only and scoped per site through the database's own row-level
security, not a front-end convention. Data exports as CSV and GeoJSON with real
per-report coordinates, opening directly in QGIS as a working layer rather than
as a screenshot of one.

6. OFFLINE-FIRST BY CONSTRUCTION

A phone in the Lumbini sacred garden may have no signal for hours. Every record
is written to on-device SQLite first; the cloud is a copy, never the source of
truth. Retrieval, the damage detector, the map fallback and the site content all
function with no network at all.

7. HONESTY ENFORCED BY AUTOMATION, NOT INTENTION

A single command runs a type check, 185 automated tests across the mobile app
and the web dashboard, a content-integrity validator, a vocabulary linter, and
both citation benchmarks. The vocabulary linter mechanically rejects
gamification language ("points", "streak", "leaderboard", "rewards") from
visitor-facing copy, because the project refuses to gamify a sacred site.
These properties are structural, and a contributor cannot quietly erode them.

8. NEPALI-FIRST, LIVE IN TWO LANGUAGES, WITH A PUBLISHED ETHICS AND PRIVACY POLICY

The app itself is bilingual Nepali and English throughout, with source text and
citations never machine-translated. That discipline now extends to the public
website too: every public page — the product explainer, the custodian
information page, the ethics policy, and the privacy policy — is published in
both languages at route-based `/en` and `/ne` addresses, not behind a client
toggle that would leave Nepali without its own URL. The privacy policy states
plainly what is collected (principally the observer's own GPS position at the
moment of capture, and any photograph filed), why, and how a person can export
or delete their own device's records — a real control, not a promise, built
into Settings. The project also publishes a policy refusing money from any
commercial entity operating inside a site it monitors, and refusing sponsored
recommendations of any kind.

HOW THIS DIFFERS FROM WHAT EXISTS

Citizen-science photo-upload platforms collect unregistered images; the
alignment gate is the difference between a photograph and a measurement.
Institutional heritage inventory systems are back-office databases with no
consumer front door; Sākṣī is designed to feed such systems rather than replace
them. Tourism and AR applications optimise for engagement; Sākṣī deliberately
directs visitors toward whichever vantage has gone longest without a resurvey,
because a visitor's discovery and the record's resurvey are the same action.
```

---

## Importance of Your Project / Innovation to Society or Industry

```
FOR NEPAL'S HERITAGE

Nepal holds four UNESCO World Heritage properties and hundreds of nationally
protected monuments, and the risks to them are neither hypothetical nor
historical. The Kathmandu Valley property spent four years, from 2003 to 2007,
on the List of World Heritage in Danger. The 2015 earthquakes destroyed or
severely damaged monuments across all seven Valley monument zones, and
reconstruction ran for five to eight years per site. Urban pressure, water-table
change and ordinary weathering continue.

Against that, formal monitoring is episodic by nature. Sākṣī does not propose to
replace expert assessment; it proposes to fill the years between assessments
with a continuous, dated, position-registered record produced at almost no
marginal cost by people who are already standing there.

The clearest case is the dhunge dhara. These carved stone spouts, fed by
underground infiltration chambers, are Licchavi-period infrastructure still in
daily use — Manga Hiti in Patan, built in 570 CE, is considered the oldest
working example on record. A 2019 survey found 94 of 573 already lost outright,
and less than half of the survivors still producing water. Whether any given
spout is flowing this month is, in most cases, written down nowhere. That is a
gap an app in a visitor's pocket can genuinely close.

FOR THE PEOPLE WHO CARE FOR THESE PLACES

The immediate beneficiary is the custodian: the Department of Archaeology
officer, the municipal heritage section, the temple caretaker. Today a caretaker
who notices deterioration has no structured channel to record it and no evidence
to attach. Sākṣī gives them an inbox of dated, located, photographed reports and
a way to act on each one visibly, now reachable from a real web address rather
than only a local demo. For a resource-constrained institution, an evidence
stream that costs nothing to collect changes what is possible.

FOR NEPAL'S ICT SECTOR

Two contributions beyond the heritage domain.

First, trust engineering. The dominant unsolved problem in applied AI is that
systems fabricate confidently. Sākṣī demonstrates, in shipped code with two
published benchmarks, that an AI feature can be built to refuse rather than
invent, and that this property can be enforced by automated tests rather than
promised in a policy document — down to checking that individual sentences of
an answer are actually supported by the source, not only that a citation looks
real. That pattern transfers directly to health, legal, agricultural and
government applications where a plausible fabrication causes real harm. A
Nepali student team demonstrating this is a signal about where the country's
engineering capability actually sits.

Second, digital sovereignty over cultural data. The record of Nepal's heritage
is created in Nepal, held in a system Nepali institutions can license and
control, and exported in open formats (CSV, GeoJSON) that any GIS can read. It
is not locked inside a foreign platform's terms of service.

FOR CULTURAL INTEGRITY

The project refuses several things it could profitably have done. It will not
gamify a sacred site: merit recorded in the app cannot be spent, traded, or
converted, and the vocabulary linter mechanically blocks game language from
reaching a visitor. It will not accept money from a commercial operator inside a
site it monitors. It will not dress a reconstruction as a photograph. It states
plainly, in a public privacy policy, what personal data it collects and gives
the person who generated it a real way to remove it. These refusals cost money
and engineering time by design, and they are the reason a government body could
plausibly trust the resulting record.
```

---

## Effectiveness in Implementation or Value Delivery

```
IT IS BUILT AND DEPLOYED, NOT PROPOSED

The clearest evidence of effective implementation is that the system works
end-to-end today, is reachable at a live public address, and its claims are
measurable:

- 74/74 on the citation benchmark, with zero fabricated citations and zero
  unsupported answer spans on the stricter span-level check, run automatically
  on every change.
- mAP50 0.8167 for the on-device damage detector, displayed in the app itself
  and never rounded up.
- 185 automated tests passing across the mobile app and the web dashboard,
  alongside a type check, a seed-data integrity validator and a vocabulary
  linter, in one command.
- 15 sites across 2 regions, 12 surveyed vantages, 18 Patan monument records and
  40 Kathmandu Valley landmark records.
- A public, bilingual website live today, including a privacy policy, a public
  transparency page, and the authenticated custodian dashboard itself — not a
  staging-only demo.
- Installable Android builds shipping through EAS, with a production profile
  ready and a Play Store submission in progress through a partner account.

THE FULL LOOP HAS BEEN DEMONSTRATED, AGAINST THE REAL DEPLOYMENT

The chain that matters is: a visitor aligns and captures, the on-device detector
proposes candidate damage, the visitor confirms severity and files a report, the
report appears on a custodian's dashboard, and the custodian acknowledges it
with a note. That entire loop has been exercised end to end against the live,
production Supabase-backed deployment, with invite-only, per-site access
control enforced by the database itself and the resulting state change
verified — not storyboarded, and not only against a local mock.

ARCHITECTURE CHOSEN FOR THE ACTUAL CONDITIONS

Design decisions were made against the real deployment environment rather than a
demo environment. A phone at a monument may have no signal, so records write to
on-device SQLite first and treat the network as a bonus. Heavy inference runs on
the device, so a monitoring session costs no bandwidth and no per-query cloud
fee. When an optional cloud model is unreachable, a fast-fail circuit breaker
degrades to the on-device engine after a single short probe rather than stalling
the interface, and when the cloud model itself is rate-limited rather than down,
a second configured key is tried automatically before that fallback — a
capacity problem is handled as a capacity problem, not treated the same as an
outage. Map tiles come from an open global source; the retrieval index is
static and ships with the app.

The practical consequence is that per-user marginal cost is close to zero, and
adding a new heritage site is a content task — a data entry plus surveyed
vantages — rather than an infrastructure task. That was proved rather than
assumed: three Kathmandu Valley sites, roughly 200 km from the original pilot
area, were added on the existing architecture without a rewrite, and the entire
public website was made bilingual on route-based URLs without a rewrite either.

VALUE DELIVERED TO EACH SIDE

To the custodian: an evidence stream they did not fund, in formats their
existing tools already read, reachable at a real web address they can bookmark.
The GeoJSON and CSV exports carry real per-report coordinates and open as a
working QGIS layer.

To the visitor: a guided reason to look closely at a place, bilingual history
grounded in cited sources, and a contribution that is recorded and acknowledged
rather than absorbed — plus a plain, published statement of what data that
contribution involves and how to remove it.

To the institution as a whole: a median-time-to-acknowledgement metric, which
turns responsiveness itself into something measurable.

WHAT IS NOT YET DONE, STATED PLAINLY

No institutional agreement has been signed; outreach is under way. Play Store
publication is prepared but not yet live — the release pipeline, listing
content and a partner publisher's account are in place, and submission is in
progress. Some site coordinates remain documentary approximations rather than
survey-grade, and are labelled as such in the interface. The damage detector
covers cracks only. iOS has never been built; there is no Apple Developer
account behind this yet. These limits are published in the project's own
documentation, because a monitoring system that overstates its own reliability
is worse than one that is honestly incomplete.
```

---

## AI and/or Emerging Technologies Integrated

```
1. ON-DEVICE COMPUTER VISION (edge inference)

A YOLOv8n object-detection model — a single `crack` class, trained on a public
crack segmentation dataset for 80 epochs — exported to ONNX and executed locally
on the phone through onnxruntime-react-native. Inference is accelerated with the XNNPACK execution
provider, graph optimisation and a warm-up pass to remove first-inference
latency. The full inference pipeline around the model — letterbox
preprocessing to the model's input geometry, channel-major output decoding,
confidence thresholding, intersection-over-union computation and non-maximum
suppression — is implemented in pure, unit-tested TypeScript rather than being
delegated to an opaque library. Measured accuracy is mAP50 0.8167, published in
the interface. No image leaves the device for detection.

2. RETRIEVAL-AUGMENTED GENERATION WITH TWO LAYERS OF CITATION VALIDATION

The question-answering engine uses hybrid retrieval: lexical BM25 scoring
combined with vector similarity, fused using Reciprocal Rank Fusion, preceded by
a domain-vocabulary gate that rejects out-of-domain questions before retrieval
and an intent-routing table that boosts specific passages on trigger phrases.

The distinguishing component is post-generation citation validation, now in two
layers. First, the engine parses every bracketed citation out of its own answer
and discards the entire answer if any citation does not resolve to a passage
that was actually retrieved. Second, and stricter, a span-level check strips
those citation markers, splits the answer into spans, and confirms each span's
own content is covered by the source text of the passage it cites — closing the
gap where a citation ID could technically resolve while the sentence attached to
it claims something the cited passage does not actually say. Grounding is
therefore verified twice, not merely encouraged by a prompt. The corpus
combines the Pali canon (from the open bilara-data corpus) with a hand-verified
heritage corpus: verbatim articles from the ICOMOS Venice Charter (1964) and
Burra Charter (2013), UNESCO World Heritage inscription records for Lumbini and
the Kathmandu Valley, named Kathmandu Valley archaeology, and — added since the
hackathon — Hindu and Newar heritage sources covering the Vaishnava iconography
at Changu Narayan and Newar Malla-era temple tradition.

3. ON-DEVICE LARGE LANGUAGE MODEL (optional, offline)

An optional small quantised GGUF model can be downloaded to the device and run
locally through llama.rn, allowing synthesised natural-language answers with no
network. Even here the model is constrained to rephrasing retrieved passages; it
is never permitted to introduce a fact the corpus does not contain.

4. CLOUD LLM SYNTHESIS, WITH RATE-LIMIT RESILIENCE (optional, server-mediated)

For richer prose the system can call a hosted model (Ollama Cloud). A fast-fail
circuit breaker probes reachability and falls back to the deterministic
on-device engine after a single short timeout, so an unreachable endpoint
degrades the answer's style without ever degrading its correctness or
availability. The system also accepts more than one configured key: if the
first is rate-limited specifically (not merely unreachable), the next
configured key is tried before falling back, so demand exceeding one free-tier
key's quota is a configuration change, not a code change or an outage.

5. MULTI-SENSOR FUSION FOR SPATIAL ALIGNMENT

GPS, magnetometer and accelerometer readings are fused into a single weighted
alignment score, evaluated against per-vantage position, bearing and pitch
tolerances, and used to gate the camera shutter in real time. Missing signals
propagate as null rather than as zero, so the absence of a measurement is never
recorded as a perfect measurement.

6. GEOSPATIAL AND LOCATION TECHNOLOGY

MapLibre GL for vector map rendering (both a native path and a WebView path with
a three.js custom layer for the guide character), GeoJSON as the internal
geometry format, operating-system region monitoring for battery-efficient
background geofencing at monument precincts, haversine distance computation, and
CSV/GeoJSON export targeted at QGIS compatibility.

7. OFFLINE-FIRST DATA ARCHITECTURE

On-device SQLite in write-ahead-logging mode with a versioned migration system
as the source of truth, with cloud synchronisation (Supabase, PostgreSQL with
row-level security) treated strictly as a copy. The security posture ties every
write to an authenticated session rather than trusting a client-asserted
identity: a leaked publishable key buys, at most, a fresh account that owns no
rows, not access to anyone else's record.

8. CROSS-PLATFORM AND TOOLING

React Native 0.86 on Expo SDK 57, TypeScript 6 in strict mode, Next.js 16 for
the bilingual public website and custodian web dashboard, Supabase Auth for
invite-only custodian sign-in, and EAS for cloud builds.
```

---

## Long-Term Vision, Scalability and Growth

```
THE VISION IN ONE SENTENCE

Every monitored place on earth should have a continuous, dated,
position-registered visual record, produced by the people who already visit it,
owned by the institution responsible for it.

WHY THE ARCHITECTURE SCALES

Sākṣī's growth is limited by content, not infrastructure, and that is a
deliberate design outcome. Adding a heritage site is a data-entry task: a site
record with sourced facts, and vantage points with measured tolerances. Adding a
user costs effectively nothing, because inference runs on that user's device,
records are stored locally, and the retrieval index ships with the application.
There is no per-query cloud bill to grow with adoption.

This was tested rather than asserted, twice. After the hackathon, three
Kathmandu Valley monument-zone sites roughly 200 km from the original pilot
area were added on the same codebase, with a region concept introduced in a
single change and no rewrite of the map, geofencing, capture or dashboard
systems. Separately, the entire public website was made bilingual on
route-based URLs, and the AI corpus was widened to a second cultural tradition,
on the same retrieval and validation engine, with no architectural rewrite
either time.

PHASE ONE (0–12 MONTHS) — PROVE THE INSTITUTIONAL LOOP IN NEPAL

Secure a pilot with a Nepali heritage authority — the Department of Archaeology,
the Lumbini Development Trust, or a Valley municipality's heritage section — and
run one full monitoring cycle with real custodian usage against the now-live
dashboard. Extend vantage coverage across all seven Kathmandu Valley monument
zones. Establish the dhunge dhara network as the flagship monitored class,
because it is numerous, measurably declining, largely undocumented, and its
condition (flowing or dry) is legible in a single photograph. The success
metric is not downloads; it is the number of vantages with more than one dated
observation, and the median time an institution takes to acknowledge a report.

PHASE TWO (1–3 YEARS) — A PLATFORM FOR MONITORED PLACES IN NEPAL

Generalise beyond World Heritage properties to Nepal's several hundred
nationally protected monuments, and toward interoperability with the
heritage-inventory systems institutions already use, so Sākṣī feeds existing
records rather than competing with them. Extend the damage model beyond cracks
to the other common masonry pathologies. Bring the mobile app itself to the
Play Store as a public, installable release, building on the production
pipeline already in place.

PHASE THREE (3–5+ YEARS) — THE SAME GAP, EVERYWHERE

There are over 1,200 UNESCO World Heritage properties worldwide, and every one
faces the identical structural problem: episodic expert assessment, continuous
change, and a visiting public whose observation is currently wasted. Nothing in
the mechanism is specific to Nepal or to Buddhist heritage — the citation
engine already answers on international conservation doctrine and a second
cultural tradition, and the site model is region-parameterised. Growth here is
partnership-led rather than consumer-led: one heritage authority at a time,
each bringing its own visitor flow.

SUSTAINABILITY

The visitor application stays free permanently. Revenue comes from licensing the
custodian dashboard to heritage authorities and from conservation and cultural
heritage grants. Running costs are structurally low — on-device inference,
static retrieval, open map tiles — which means the project does not require
scale to survive, and can therefore afford to be patient and selective.

That selectivity is formalised. The published ethics policy refuses funding from
any commercial entity operating inside a monitored site, and refuses sponsored
placement entirely. A conservation record has to be trusted by the institution
reading it, and that trust does not survive a sponsor with a stake in what the
record says. Declining that revenue is what makes the rest of the model
credible to a government buyer.

RISKS WE ACKNOWLEDGE

Institutional adoption is the genuine bottleneck, not engineering; a monitoring
system with no institution reading it is an archive nobody asked for. Vantage
establishment currently requires deliberate on-site survey work, which limits how
quickly coverage can grow. Sustained visitor participation across seasons is
unproven at scale. We would rather name these now than discover them in front of
a partner.
```

---

# SECTION 3 — Recognition & Justification

## Why Do You Think You Deserve the Rising Star Innovation ICT Award 2026?

```
Because we built something genuinely new, we can prove it works with numbers
rather than adjectives, and we chose the harder version of every decision that
mattered.

WE SOLVED A PROBLEM THAT WAS BEING IGNORED, NOT A PROBLEM THAT WAS TRENDING

It would have been easier to build another tourism guide or another chatbot.
Instead we looked at a structural gap in how Nepal's heritage is monitored —
expert assessment every few years, continuous deterioration in between, and
millions of visitors whose observation is thrown away — and built the thing that
closes it. The mechanism, fixed-point rephotography delivered as a consumer
interaction, does not exist in any comparable application we are aware of.

WE ENGINEERED FOR TRUST, WHICH IS THE HARD PART OF APPLIED AI RIGHT NOW

Anyone can add an AI feature. The difficulty is making one an institution can
rely on. Our question-answering engine validates its own citations twice —
first that a citation resolves to a real retrieved passage, then that the
sentence carrying it is actually supported by that passage's own text — and
discards any answer that fails either check. It scores 74/74 on an adversarial
benchmark including impersonation and prompt-injection attempts, with both
fabricated citations and unsupported spans held at zero. Our damage detector
publishes its real accuracy, 0.8167, inside the app, and marks its findings as
candidates for a human to confirm rather than verdicts. When the app cannot
measure something, it records "unknown" rather than a convenient zero.

Most importantly, these properties are enforced by automated tests that fail the
build, not by good intentions. That is an engineering culture, and we think it is
the most transferable thing we have built.

WE HAVE INDEPENDENT VALIDATION, AND WE DID NOT STOP THERE

Sākṣī won first place at the LumbiniX 2026 national hackathon, judged on exactly
these criteria. What we did afterwards matters more: rather than polishing the
winning demo, we widened it into a live, public platform — extending the AI
corpus to international conservation doctrine and a second cultural tradition,
adding three Kathmandu Valley UNESCO sites roughly 200 km outside the original
area, publishing a bilingual public website with its own privacy policy, and
deploying the custodian dashboard that turns collected evidence into
institutional action as a real, authenticated web address rather than a local
demo. The system today is materially more capable, and materially more real,
than the one that won.

WE REFUSED THE PROFITABLE SHORTCUTS

We will not gamify a sacred site: merit in our app cannot be spent, traded or
ranked, and a vocabulary linter mechanically blocks game language from reaching
a visitor. We publish an ethics policy refusing money from any commercial
operator inside a site we monitor, and refusing sponsored recommendations
entirely. We publish a privacy policy that states plainly what personal data
the app collects and gives a person a real way to remove their own records. We
label every reconstruction so it can never be mistaken for a photograph. Each
of these decisions costs us something, and together they are the reason a
government institution could plausibly trust the record we produce.

WE STATE OUR LIMITATIONS IN PUBLIC

Our own documentation lists what is unfinished: no signed institutional
agreement yet, Play Store publication prepared but not yet live, some
coordinates still documentary rather than survey-grade, a detector that covers
cracks only, and no iOS build. We believe a team willing to publish its own
gaps is exactly the kind of team this award should be encouraging, and it is
the same discipline that makes the underlying evidence worth having.

WE ARE STUDENTS, AND THIS IS UNFUNDED

There is no company behind this, no sponsor, and no external investment. It was
built by students, in Nepal, about Nepal's heritage, in Nepali and English,
because the problem was in front of us and nobody else was solving it.
```

---

## Any Awards, Recognitions, or Competitions Participated In

```
LumbiniX 2026 National Hackathon — FIRST PLACE / WINNER

Sākṣī won first place at LumbiniX 2026, a national-level hackathon held on the
theme "What if Buddha were born in 2026?". The project was judged on innovation,
technical execution, social relevance and presentation by an independent expert
panel, competing against teams from across Nepal.

The three elements the judges responded to were the ones we have continued to
build on: guided fixed-point rephotography as a consumer mechanic, an AI that
refuses rather than fabricates, and a closed loop delivering evidence to the
institution responsible for a site.

[FILL IN — add the exact event date, organiser name, venue, and the official
prize title as printed on your certificate. If you have a certificate, photo of
the prize-giving, or press or social-media coverage of the result, list it here
and attach it under Supporting Documents; verifiable third-party evidence of the
win is worth more in this field than any description.]

[FILL IN — list any other competitions, science fairs, exhibitions,
scholarships, or recognitions any team member has received, with dates. Include
participation, not only wins.]
```

---

# SECTION 4 — Supporting Documents

| # | Requirement | Status | Action |
|---|---|---|---|
| 1 | Valid Student ID / Identification **(required)** | **[YOU]** | Scan the student ID of Aaditya as representative. If the form allows multiple, include all members. |
| 2 | Presentation (PDF or PPT) | **Ready to build** | Build from `slides.md` in `docsv2/` — a complete slide plan with talking points and a screenshot checklist. Export to PDF. |
| 3 | Other supporting documents | **Ready** | Strong options: this repository's `docs/` folder (engineering status, `PRODUCTION-PILOT.md`, limitations stated plainly), the Dhamma benchmark output (74/74, zero fabricated citations, zero unsupported spans), and the hackathon certificate. |
| 4 | Video (up to 3 minutes) | **Not recorded** | Script is ready in `video-demo.md` in `docsv2/`. See the note below — this is your highest-value remaining task. |
| 5 | Project logo, high-res PNG/SVG **(required)** | **Ready** | Use `assets/icon.png` (731 KB, high resolution). Confirm it reads well on a white background; if not, `assets/android-icon-foreground.png` is an alternative. |
| 6 | Demo access / credentials | **Ready** | See suggested text below. |
| 7 | Relevant web links **(required)** | **Ready** | See below. |

### Suggested text — Demo Access or Credentials
```
The visitor-facing mobile app requires no login or credentials. Sākṣī is an
offline-first mobile application with no account system for visitors by
design: every record is written to the device first, and the app is fully
usable with no sign-in and no network.

Three ways to evaluate it:

1. The public website — https://project-saksi.vercel.app, in English and
   Nepali. No credentials needed for anything except the custodian dashboard
   itself; those credentials are institutional and available on request from
   the team, since they gate real (if seeded/demo) heritage-site data behind
   invite-only, per-site access.

2. Android APK — an installable build can be provided on request, or produced
   from source with `npx eas build --profile preview --platform android`.

3. From source — the repository runs with:
   git clone https://github.com/LumbiniX-Committee/Everest
   npm install
   npm run api        (starts the local API in one terminal)
   npx expo start     (scan the QR code with the Expo Go app)

   Verification of every claim in this submission:
   npm run verify     (type check, 155 mobile-app tests, content validation,
                       vocabulary lint, and the 74/74 citation benchmark)

   The web dashboard's own test suite (30 tests) runs the same way inside
   landing/: npm run verify.

The custodian dashboard is live at https://project-saksi.vercel.app/custodian,
and also runs locally with `npm run dev` inside the landing/ directory.
```

### Suggested text — List of Relevant Web Links
```
Live website (English and Nepali), including the custodian dashboard:
https://project-saksi.vercel.app

GitHub repository (full source, public):
https://github.com/LumbiniX-Committee/Everest

[FILL IN — add any of the following that exist:]
- APK download link
- Demo video link (YouTube or Drive, unlisted is fine)
- LumbiniX 2026 result announcement, organiser page, or press coverage
- Team or project social media (LinkedIn, Facebook page, Instagram)
- Personal LinkedIn profiles of team members
```

> **On the video.** It is optional on this form and it is the single strongest
> asset you are missing. `video-demo.md` in `docsv2/` gives you a shot-by-shot
> script with timings, including a beat that now cuts to the *live* dashboard
> rather than a local one. If you record only one thing, record the closed
> loop: file a condition report on the phone, then cut to the live custodian
> dashboard and acknowledge it. That sequence is what separates this from a
> concept.

---

# SECTION 5 — Pre-submission checklist

**Blocking — the form will not submit without these**
- [ ] Team member full names and dates of birth (YYYY-MM-DD)
- [ ] Address: Province, District, Local Government Body, Street
- [ ] Educational institution(s)
- [ ] Innovation category selected
- [ ] Student ID scan uploaded
- [ ] Logo uploaded (`assets/icon.png`)
- [ ] Web links field completed
- [ ] Terms & Conditions accepted

**High value if time permits, in priority order**
1. Record the 3-minute video (`docsv2/video-demo.md`)
2. Export `docsv2/slides.md` to a PDF presentation
3. Attach hackathon certificate or third-party proof of the first-place result
4. If Play Store publication completes before the deadline, add the store
   listing URL to Section 4's web links — a live store page is stronger
   evidence than a prepared pipeline

*(The landing page deployment that used to be listed here is done — see
Section 1's Official Website field.)*

**Verify before you submit**
- [ ] The exact official name and date of the LumbiniX award, as printed on the
      certificate, matches what you have written
- [ ] Every team member is within the award's age limit and the team is within
      its size limit
- [ ] Contact email and phone are ones you will actually monitor during judging
- [ ] Numbers quoted here still match a fresh `npm run verify` run on the day
      (root repo and `landing/`, both have their own `verify` script)

---

## Fact-check appendix

Every figure used above, and where it comes from:

| Claim | Source | How to re-verify |
|---|---|---|
| 74/74 citation benchmark, 0 fabricated citations, 0 unsupported spans | `core/dhamma/eval.ts`, `tools/dhamma-eval.mjs` | `npm run eval:dhamma` |
| 185 automated tests (132 core + 23 native app + 30 web dashboard) | `tools/run-tests.mjs`, `jest.config.js`, `landing/vitest` | `npm run test && npm run test:react` (root), `npm run test` (in `landing/`) |
| mAP50 0.8167 | damage model card | `docs/DAMAGE-MODEL.md` |
| 15 sites, 12 vantages | `seed/sites.json`, `seed/vantages.json` | `npm run validate` |
| 18 Patan / 40 Kathmandu monuments | `seed/patan-monuments.json`, `seed/kathmandu-monuments.json` | `npm run validate` |
| Live bilingual website | Vercel deployment | visit `https://project-saksi.vercel.app` and `/ne` |
| Published privacy policy | `landing/app/[locale]/(site)/privacy/page.tsx` | visit `/privacy` and `/ne/privacy` |
| Custodian dashboard, invite-only per-site access | `landing/lib/auth.ts`, `supabase/migrations/0009_production_pilot.sql` | visit `/custodian`, or read the RLS policies |
| 573 dhunge dhara; 94 lost; 224 of 479 flowing | 2019 Valley survey, cited in `core/dhamma/heritage.ts` | Source card in app |
| Kathmandu Valley in Danger 2003–2007 | UNESCO, cited in `core/dhamma/heritage.ts` | whc.unesco.org/en/list/121 |
| Manga Hiti built 570 CE, oldest working | Slusser 1982, cited in `core/dhamma/heritage.ts` | Source card in app |
| Patan restored 2023; Changu ~5 years | Dept. of Archaeology, cited in `core/dhamma/heritage.ts` | Source card in app |
| Expo SDK 57, RN 0.86, TS 6 | `package.json` | `cat package.json` |

*Nothing in this submission is claimed that the repository cannot support. If a
judge asks for evidence of any number above, the command that produces it is in
the right-hand column.*

# Sākṣī — Post-Pivot Status

*What changed after `15-POST-HACKATHON-STRATEGY (1).md`, written 2026-08-27,
covering commits `e57b795` through `0ebfc9d`. This is a status report, not a
product doc — for the product itself, see `README.md`; for the pre-pivot
technical deep-dive, see `handbook.md`, `documentation.md`, and
`explanation.md` (intentionally left un-updated by this pass — see
"What was deliberately not touched" below).*

---

## 1. Why this exists

The hackathon build (everything before commit `e57b795`) was a strong,
working Lumbini-only, Buddhist-canon-only app: three surfaces (Tīrtha, Sākṣī,
Dhamma), a citation-locked AI, fixed-point rephotography, an honest crack
detector. `15-POST-HACKATHON-STRATEGY (1).md` argued that the natural next
move — turning it into a general tourism app — would destroy the three things
that actually won: the conservation moat, the citation discipline, and the
institutional angle. Its recommendation, and the one implemented here:

> Keep the moat. Widen the subject matter. You are not a tourism app that
> also does conservation. You are a conservation-evidence network that uses
> tourism as its distribution channel.

The work was ordered **Dhamma engine → Sākṣī engine → Tīrtha engine**, per
direct instruction, against a real four-day clock (27–31 Aug).

---

## 2. What changed, in one paragraph

The Dhamma engine's citation-locked refusal mechanism, previously scoped to
the Pali canon only, now also answers heritage-conservation questions (UNESCO
records, the ICOMOS Venice and Burra Charters, Kathmandu Valley archaeology)
with the same discipline: cite a real source or refuse — 68/68 on the grown
eval set, zero fabricated citations. The custodian dashboard — the actual
product an institution would pay for — went from *entirely unbuilt* to
*working end-to-end*, both as a web view (`landing/custodian`) and an in-app
screen, closing the loop from "a visitor files a report" to "a custodian
acknowledges it," with a fixed CSV/GeoJSON export that now opens correctly in
QGIS. The app gained a region concept and three real Kathmandu Valley sites
(Patan Durbar Square, Changu Narayan, Manga Hiti) at the same depth as the
original twelve, proving the architecture generalises past Lumbini. An ethics
policy is published. The pitch deck, demo script, and README were brought up
to date so a reader or a judge sees the platform as it now stands, not the
pre-pivot app.

---

## 3. Phase 1 — Dhamma engine (`e57b795`)

**Goal:** stop being a Buddhist chatbot; become a source-grounded
interpretation engine that happens to also cover Buddhist teaching. The
mechanism — retrieve, ground, cite, refuse when ungrounded — does not change;
only what it's allowed to talk about does.

**What was built:**
- `core/dhamma/heritage.ts` (new, ~480 lines): a hand-verified heritage
  corpus — verbatim ICOMOS Venice Charter (1964) and Burra Charter (2013)
  articles, UNESCO World Heritage records for both Lumbini and the Kathmandu
  Valley, and named Kathmandu Valley archaeology (the Mānadeva pillar
  inscription at Changu Narayan, Patan's Malla-era construction and 2015
  earthquake history, the dhunge dhara/Manga Hiti water system, the
  Department of Archaeology's role). Hand-written rather than fetched, on the
  same precedent as the canon's own `CANONICAL_CHUNKS` — there is no single
  machine-readable API for these sources the way bilara-data provides one for
  the Pali canon.
- Six new entries in `data/demo/sources.ts` so every heritage citation
  resolves to a real, checkable source card, the same way a Pali citation
  does.
- `core/dhamma/bilara.ts`'s `BilaraChunk` type widened with optional
  `corpus`/`source_id`/`source_url` fields, backward-compatible with the
  existing 500+ Pali chunks.
- `DOMAIN_VOCAB` and `INTENT_ROUTES` extended with conservation/heritage
  terms, and the out-of-scope refusal copy rewritten to name what the engine
  actually consults now, rather than still claiming "only the Pali Tipiṭaka."
- `core/dhamma/reflection.ts` reframed from a Buddhist Four-Truths scaffold
  to a neutral "reflection on place": same four-question arc (name the
  difficulty → its origin → could it ease → one small step), no doctrinal
  language. The distress override and verified Nepali helplines are
  untouched.
- `core/dhamma/eval.ts` grown from 50 to 68 questions, with a new `heritage`
  category (18 questions: 15 answerable with real citations, 1 adjacent, 2
  correctly refused as out-of-scope) — including a non-Buddhist Kathmandu
  Valley question answered with a real citation, which the strategy doc names
  as the single best line in the submission.

**A real bug found and fixed along the way:** once the corpus grew past
~500 chunks, `tokenize()` in `core/dhamma/retrieval.ts` wasn't filtering
stopwords, so common-word overlap alone produced misleadingly high BM25
scores for unrelated chunks. Fixed by adding a stopword filter (matching a
precedent already in `services/dhamma/index.ts`).

**Verified:** `node tools/dhamma-eval.mjs` → 68/68, "Citations naming an
unretrieved passage: 0". `npm run verify` green.

---

## 4. Phase 2 — Sākṣī engine (`a1a7a1b`, `c4e7726`, `f37bd6e`)

**Goal:** build the custodian dashboard — the strategy doc's own read is that
this is *the product you sell*, and it was underbuilt: the mock API already
served `/dashboard`, `/reports`, `/custodian/acknowledgements`, and
`/export`, but nothing consumed any of it.

**What was built, commit by commit:**

- **`a1a7a1b`** — fixed two real defects in `mock-api/server.mjs` that only
  show up once you try to use the export: every report in a CSV/GeoJSON
  export was placed on its *site's centroid*, so multiple reports at one site
  collapsed onto a single indistinguishable point — the file never actually
  opened as a usable layer in QGIS. Reports now resolve to their capture's
  real coordinates when one exists, with the source (`capture` vs.
  `site_centroid`) recorded per row rather than presented as a measurement.
  CSV gained the columns a conservator actually needs (lat/lon, vantage_id,
  align_score, corroborations, acknowledged_at, note) and proper quote
  escaping; GeoJSON gained a `Content-Disposition` header so it downloads
  instead of rendering as text. `seed/history.json` — already generated by
  `tools/seed-history.mjs` but never loaded by anything — is now read into
  `mock-api`'s in-memory state at boot, so the dashboard isn't empty on first
  launch.
- **`c4e7726`** — the web dashboard, `landing/app/custodian/page.tsx`: stat
  cards (coverage %, captures, open reports, median align score, median
  time-to-acknowledgement, resolved count), a report list filterable by site
  and status, acknowledge/in-progress/resolved actions with an optional note,
  CSV/GeoJSON export links. Deliberately no login — "Acting as" is a plain
  name kept in the browser, matching the strategy doc's "simple, no complex
  auth." Deliberately reads from `mock-api`, not Supabase directly: the
  production schema (`supabase/migrations/`) grants the `anon` role
  insert/update *only*, on purpose, so a leaked publishable key cannot
  harvest the archive — wiring a read-heavy dashboard to that store is a real,
  separate security decision, not one to make quietly under a deadline.
- **`f37bd6e`** — the same thing in-app: a new Settings → Custodian screen
  (`features/custodian/CustodianScreen.tsx`), reached from Settings rather
  than the tab bar since a custodian is not one of the three visitor
  surfaces. `services/custodian/index.ts` mirrors the existing
  `services/dhamma` reachability-breaker pattern. Online-only, deliberately —
  there's no local mirror of server-side report state for an offline queue to
  reconcile against, unlike the visitor-side capture flow where the
  photograph itself is irreplaceable.

**Verified:** end-to-end against a live `mock-api` via a headless browser
(both `landing/` and the Expo web target) — stat cards populate with real
numbers, the report table lists and filters, acknowledging a report updates
its status inline and is reflected on refetch, both export links resolve with
real per-report coordinates. Zero console errors in either surface.
`npm run typecheck`, `npm run test` (126/126), `npm run vocab` all green.

---

## 5. Phase 3 — Tīrtha engine (`6c05659`, `bebe348`)

**Goal:** turn "a Lumbini app" into "a platform" — per the strategy doc, the
single biggest available score change.

### 3.1 — Region concept

The app was single-region by construction in three places: `constants/geo.ts`
(`LUMBINI_CENTER`/`LUMBINI_BOUNDS`), `components/map/SitePlan.tsx` (always
projected against Lumbini's bounding box), and `tools/validate-seed.mjs`
(bbox checks scoped to Lumbini only, with **no exception at all** for
vantages — every one would have failed validation for a valley site).

Fixed with a `REGIONS` registry (`lumbini`, `kathmandu-valley`) carrying
centre and bounds each; sites and vantages carry an optional `region` field
defaulting to `'lumbini'` when absent, so the original twelve sites needed no
edit. `SitePlan` now projects against the shared region of whatever sites
it's given, falling back to the Lumbini frame only when a mixed/unspecified
set is passed (the all-sites fallback panel). `validate-seed.mjs` resolves
each site's — and each vantage's, via its parent site — region before
checking bounds.

**A discovery that shaped the rest of Phase 3:** the app has two *parallel,
disconnected* pipelines for both sites and quests. `data/generated/sites.ts`
(built from `seed/sites.json` by `tools/gen-data.mjs`) is genuinely live —
consumed everywhere via the `@/data` barrel. But `data/demo/geo.ts` (which
builds the native 3D map's GeoJSON layers) internally imports the *old*,
frozen `data/demo/sites.ts` instead — so the native `SiteMap3D` preview panel
won't show the valley sites; this is a narrow, low-risk, disclosed gap since
`LiveMapScreen` (the actual interactive map) always uses the WebView path
regardless. Worse, quests have the same split but in the *opposite*
direction: `seed/quests.json` → `data/generated/quests.ts` (`seedQuests`) is
written but **nothing reads it** — the live quest catalogue the app actually
serves is `data/demo/quests.ts`, hand-written, pre-dating the seed pipeline
for quests specifically. This was caught by browser-testing a "Quest Not
Found" error on a quest that existed only in the unused generated file, and
fixed by authoring the three new witness quests directly in
`data/demo/quests.ts`, in the shape that screen already reads.

### 3.2 — Three Kathmandu Valley sites, full depth

Patan Durbar Square, Changu Narayan, and Manga Hiti — the strategy doc's
own three, with Manga Hiti (a declining, largely unmonitored 6th-century
stone water spout) singled out as the sharpest "visibly dying and almost
undocumented" case. Each carries: bilingual (EN/NE) summary and facts, real
OSM-geocoded coordinates, two vantages, timeline entries, narration text, a
neutral reflection-on-place scaffold, and one working witness quest. Manga
Hiti also carries a funding need. New precincts (`patan-durbar-square`,
`changu-narayan`) wire the sites into both foreground arrival detection
(`services/arrival`, which — another non-obvious finding — resolves "which
site am I at" by walking `demoPrecincts`, not `demoSites` directly, so a site
outside every precinct's `siteIds` is silently unreachable) and background
OS-level geofencing.

**Deliberately not built:** a reconstruction plate for any of the three. That
needs a real bundled image file — Metro's `require()` cannot degrade
gracefully the way the rest of the app does — and no harvesting or generation
was possible this session. This matches nine of the twelve original Lumbini
sites, which already ship without one; `heroImageForSite()` already degrades
to an honest text-only card rather than a placeholder, so nothing had to
change to accommodate this.

### 3.3 — Coverage acquisition (trimmed to copy, per the plan's own triage)

The strategy doc frames Tīrtha's quest system as already doing the right
thing without saying so: quests point at under-surveyed vantages, so a
visitor's discovery is always also a resurvey. Rather than build a new
ranking engine under time pressure — the plan explicitly names this
trimmable to copy — the three new quests were *written* with this framing
("nothing has watched the square since," "adds to a record that barely
exists"), and a landing-page section now says it plainly for a reader who
hasn't played the app.

### 3.4 — Ethics policy

Published at `landing/app/ethics/page.tsx`, linked from the home page
footer: no money from a commercial entity operating inside a monitored site,
no sponsored recommendations, witness data stays evidence rather than
becoming inventory, every stated fact resolves to a named source.

**Verified:** `npm run verify` green throughout (typecheck, 126/126 tests,
seed validation, vocab lint, 68/68 eval). Both `landing/` (via `next build`)
and the Expo web target were driven with Playwright — all three new site
detail pages, all three new quests, the reflection screen, and the Tīrtha
index (correctly showing "8 precincts · 15 sites") render with zero console
errors.

---

## 6. Documentation pass (`0ebfc9d`)

`README.md`, `slides.md`, and `video-demo.md` were still describing the
pre-pivot app verbatim — no custodian dashboard, no widened corpus, no
Kathmandu Valley sites, no ethics policy, and the deck's own eval number was
still 50, not 68.

- **README.md** — rewrote the opening framing, the three-parts table, and
  the Dhamma section; added a dedicated section on the custodian dashboard;
  the Status section now names the missing plate imagery plainly.
- **slides.md** — added a custodian-dashboard slide and a Kathmandu Valley
  generalisation slide, updated the Dhamma slide's numbers and scope, tied
  the business-model slide to the published ethics policy, extended the
  limitations slide. Slide count grew from 16 to 18; target runtime guidance
  updated from "12–15 slides, 6–8 min" to "15–18 slides, 8–10 min."
- **video-demo.md** — added a "closing the loop" beat (cut from filing a
  report on the phone to acknowledging it on the dashboard — the strategy
  doc's own read of the single best demo moment), added a heritage-corpus
  Dhamma question alongside the canon ones, closed on a Kathmandu Valley cut.
  Runtime target moved from 3–4 to 4–4.5 minutes; the 2-minute cut and the
  "what each section proves" table were updated to match.

### What was deliberately not touched

`handbook.md` (3,079 lines), `documentation.md` (1,193 lines),
`explanation.md` (635 lines), and `SAKSHI-COMPLETE.md` (6,899 lines) are all
pre-pivot (dated ~8–10 Aug) and are now stale in places — no mention of any
Phase 1–3 work. **By explicit instruction**, only the two documents that
actually get used live (the pitch deck and the demo script) were brought
current; these four were left as historical record of the pre-pivot build,
to revisit later if there's time.

`LICENCES.md` was checked and needed no change — it's machine-generated from
`harvest/manifest.jsonl` and covers harvested *image* assets only; no new
images were harvested this session (see the plate-imagery limitation above),
so its content is still accurate as-is.

---

## 7. Current verification status

```
npm run verify
  → typecheck: clean
  → test: 126/126
  → validate: OK (5 pre-existing coordinate-provenance warnings, no errors)
  → vocab: clean (no banned gamification terms, no em dash in visitor-facing text)
  → eval:dhamma: 68/68, 0 fabricated citations
```

`landing/` builds clean (`next build`, Next.js 16.3.0) with all three routes
(`/`, `/custodian`, `/ethics`) generated as static content.

---

## 8. Limitations, stated plainly

- **No reconstruction plate for any of the three new sites.** Needs a real
  harvested or generated image; the pipeline for that (`harvest/`) needs API
  tokens not available this session. Matches 9 of the 12 original sites.
- **No institutional partner has signed on yet.** The strategy doc's Phase 0
  (outreach emails to the Department of Archaeology, Lumbini Development
  Trust, Patan Municipality, Nepal Flying Labs, DANAM, etc.) is a same-day
  background task that only the team can actually send and follow up on —
  not something executable from this session.
- **The native 3D map preview** (`SiteMap3D`, shown only when the MapLibre
  native module is present and only as a small inline panel on the Tīrtha
  home screen) doesn't show the valley sites, because its GeoJSON layers are
  built from the old, disconnected `data/demo/sites.ts` rather than the live
  generated data. Low-impact and disclosed above (§3.1) rather than silently
  left; the actual interactive map (`LiveMapScreen`) is unaffected.
- **`seed/quests.json` → `data/generated/quests.ts`** now contains entries
  for the three new sites that nothing in the app reads — kept for
  forward-compatibility with the seed pipeline (matching the precedent
  already set for sites), documented in the `6c05659` commit message and
  here, not silently inconsistent.
- **Four large pre-pivot reference docs are stale**, per the instruction
  above — see "What was deliberately not touched."
- **No demo video has been recorded**, and **team eligibility has not been
  confirmed** (all members under 27, group of four maximum, no company
  affiliation) — both require the team, not this session.

---

## 9. What still needs to be done

In roughly the order the original plan prioritises it:

1. **Record the demo video**, following the updated `video-demo.md` — the
   custodian "closing the loop" beat is the one thing that must not be cut.
2. **Confirm team eligibility** before the 31 Aug nomination.
3. **Send the Phase 0 institutional outreach emails**, if not already done —
   even one supportive reply becomes a slide.
4. **Decide whether to update the four large reference docs** (`handbook.md`,
   `documentation.md`, `explanation.md`, `SAKSHI-COMPLETE.md`) before
   submission, or leave them as pre-pivot historical record — deferred by
   request this session, not forgotten.
5. **If time allows:** harvest or generate the three missing reconstruction
   plates, following the existing `seed/PLATES.md` production guide and its
   evidence-tier rules.
6. **Final eligibility/submission checklist** from the strategy doc's §9:
   architecture diagram, clean README (done), complete `LICENCES.md` (done,
   needs no change), limitations stated plainly (done, here and in the deck).

---

## 10. Commit log for this pass

```
e57b795  feat(dhamma): widen the engine to a heritage/conservation corpus
a1a7a1b  fix(mock-api): export real coordinates, and load seeded history at boot
c4e7726  feat(landing): add the custodian dashboard
f37bd6e  feat(custodian): let a caretaker acknowledge a report from their phone
6c05659  b: introduce a region concept, then seed Patan Durbar Square, Changu Narayan and Manga Hiti
bebe348  b: publish the ethics policy and name the coverage-acquisition mechanic
0ebfc9d  b: bring the README, pitch deck, and demo script up to the platform pivot
```

No commit in this pass carries a Co-Authored-By trailer, and each was made
after a full `npm run verify` pass (and, for `landing/`, `next build`) was
green.

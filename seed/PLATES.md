# Reconstruction plates — production guide

`seed/plates.json` is the manifest of the eight plates the app shows in its
then/now and site-detail surfaces. This file is how they get **made** — and the
rules are not optional, because a mislabelled or hallucinated plate is the exact
failure mode the whole project argues against (TEAM-CHARTER #6, 02-ASSETS §6.1).

## The one rule

**Every plate carries an `evidence_tier`, always, with no exceptions.** The four
tiers, strongest to weakest:

| Tier | Means | May be generated? |
|---|---|---|
| `historical_photograph` | A real historical photo. Nothing generated. | **No.** |
| `survey_drawing` | A measured plan/section/facsimile from a published survey. | **No.** |
| `conditioned_reconstruction` | Image-to-image, structure conditioned on a **cited** historical source. | Yes — surface only. |
| `artistic_impression` | Informed by evidence but not conditioned on an image. | Yes — use sparingly. |

The tier is shown in the UI. A visitor must always be able to tell a photograph
from a reconstruction. That transparency *is* the product.

## How each is produced

- **`historical_photograph` / `survey_drawing`** — extracted, not generated.
  Run `harvest/00_fetch_mukherji.py`, then `pdfimages -all` on the two Internet
  Archive scans (`bub_gb_5iYXAAAAYAAJ`, `in.ernet.dli.2015.115950`). Deskew,
  crop from the page, denoise gently. **No generative restoration** — an
  AI-hallucinated 1899 photograph is precisely what we argue against.
- **`conditioned_reconstruction`** — **image-to-image only, never text-to-image
  from scratch.** Structure comes from the cited `conditioned_on` source;
  generation only fills surface. If you cannot name what it was conditioned on,
  it does not ship.

## Priority (Phase 5.3) and why

1. **`ashokan-pillar.1899-south`** — the hero asset. A real 1899 photograph
   dissolving into a live camera view of the same place, 127 years later. No
   generated image competes with it.
2. **`ashokan-pillar.horse-capital`** — the capital is recorded as a **horse**
   and is **lost**. Never a lion (that is Sarnath, India's emblem). This plate
   makes the loss legible.
3. **`ashokan-pillar.pre1896-jungle`** — Lumbini was overgrown and forgotten for
   roughly five centuries. A dissolve from the manicured garden to jungle is
   *anicca* in one gesture, and shows that being forgotten is a real historical
   outcome, not a hypothetical. The most underrated plate.
4. **`vihara-remains.votive-stupas-1957`** — the sixteen votive stupas Debala
   Mitra recorded in 1957, gone by a later visit. The most on-thesis fact in the
   corpus, and the closing line of the pitch.

## The expert-review step (twenty minutes, no other team will do it)

You will be at a Lumbini hackathon with monastics and heritage-literate faculty
in the building. Show two or three plates to one of them before finalising.
*"We showed our reconstructions to a monk at the monastic zone and changed two
of them"* is a credibility move nobody else has.

## Status (what is already produced)

Five plates are extracted and live in `app/assets/plates/`, all Public Domain
from Mukherji 1901 (full-res from the Internet Archive JP2 scans, catalogued in
`harvest/MUKHERJI-PLATES.md`):

- `ashokan-pillar.1899-south` — **the hero**, Plate XX Fig. 2
- `maya-devi-temple.mukherji-1899-plan` — Plate XX Fig. 1
- `ashokan-pillar.rummindei-inscription` — Plate XX Fig. 4 (Brahmi facsimile)
- `lumbini.mukherji-1899-general-plan` — Plate XVIII Fig. 1 (bonus)
- `ashokan-pillar.pre1896-jungle.source` — Plate XX Fig. 1, the conditioning
  source for the jungle reconstruction (not the reconstruction itself)

`plates.json` carries a `produced` flag per entry. Two
`conditioned_reconstruction` plates are now **produced**, generated
image-to-image in Nano Banana Pro / Gemini and clearly tier-labelled:

- `ashokan-pillar.pre1896-jungle` — the overgrown jungle mound, conditioned on
  Mukherji's own 1899 west-view photograph
- `puskarini.earthen-pond-pre1930s` — the natural earthen oval pond before the
  1930s brick remodel, conditioned on the modern CC BY-SA photograph (pairs with
  `now.puskarini.webp`)

Two `conditioned_reconstruction` plates remain **not** produced
(`horse-capital`, `votive-stupas-1957`) — optional extras, conditioning sources
cited. Two `historical_photograph` entries (`nativity-sculpture`,
`puskarini.1899-view`) are not in Mukherji and await a harvest match.

## Output

- Format: `.webp`, long edge ~2048px, into `app/assets/plates/` at the `image`
  path named in the manifest.
- Licences: Mukherji/Hultzsch plates are Public Domain (pre-1928). Reconstructed
  plates ship **CC BY-SA 4.0, clearly labelled as reconstructions**. Harvested
  photographs (e.g. the nativity sculpture) inherit their licence from
  `LICENCES.md`, which is generated from the harvest manifest — never
  hand-written.
- Nepali captions in the manifest are drafted and await a native-speaker pass,
  like every other `ne` string in the seed.

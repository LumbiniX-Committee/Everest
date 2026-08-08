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

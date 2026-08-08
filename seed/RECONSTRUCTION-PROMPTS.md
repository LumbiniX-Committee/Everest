# Reconstruction plates — Nano Banana Pro prompts

Three `conditioned_reconstruction` plates in `plates.json` need generated images.
This is the one plate step that must be done in an image model. Generate them in
**Nano Banana Pro**, then hand the files back for cropping and wiring.

**The rule that cannot bend (PLATES.md, Charter #6):** every plate stays
tier-labelled, and a `conditioned_reconstruction` must be conditioned on a
*cited image*. Where we don't have an image to condition on, the honest tier is
`artistic_impression` — say so on the card. A mislabelled plate is the exact
failure the whole project argues against.

## How to run each one

1. In Nano Banana Pro, **attach the reference image(s)** named below (image-to-
   image, not text-to-image from scratch — that's what keeps the tier honest).
2. Paste the prompt.
3. Set the **aspect ratio** given (it must match its then/now partner so the
   dissolve lines up).
4. Generate 3–4 variants, pick the most restrained one (least invented detail).
5. Export at the **highest resolution** offered, PNG. Send me the files; I convert
   to `.webp`, crop, drop into `app/assets/plates/`, and flip `produced: true`.

---

## 1. `ashokan-pillar.pre1896-jungle`  — tier stays `conditioned_reconstruction`

**Attach:** `app/assets/plates/ashokan-pillar.pre1896-jungle.source.webp`
(Mukherji's real 1899 photograph of the still-overgrown mound, from the west).
**Aspect ratio:** match the source — **3:2 landscape**.

> Using the attached 1899 photograph as the exact structural base, render the
> same mound, tree line, and horizon as they would have looked *before*
> rediscovery, in the early 1890s. Remove every trace of excavation — no cut
> earth, no trenches, no exposed brickwork — and remove all people. Bury the mound
> under dense sal-forest undergrowth, tall grass, creepers and scrub, so the ruins
> and any pillar are almost entirely hidden and the place reads as forgotten
> jungle. Keep the tree positions, mound silhouette and horizon line from the
> source. Overcast diffuse daylight, muted natural colours, photographic realism
> consistent with a late-19th-century landscape photograph. No text, no
> watermark, no modern elements.

---

## 2. `ashokan-pillar.horse-capital`  — tier stays `conditioned_reconstruction` **only if** you attach a real Mauryan capital

**Attach (important):** a photo of a surviving Mauryan pillar capital for the
form and surface — the **Rampurva bull capital** or the **Sarnath lion capital**
(both widely available, public domain). Without a reference image, downgrade the
label to `artistic_impression` before it ships.
**Aspect ratio:** **3:4 portrait** (it's a single object).

> Using the attached Mauryan pillar capital as the reference for form, proportion
> and surface, render a 3rd-century-BCE Ashokan pillar capital of polished Chunar
> sandstone: a bell-shaped inverted-lotus base, a circular abacus with a low-
> relief frieze, surmounted by a single free-standing statue of a **horse**
> standing calmly in profile facing left — a horse, not a lion and not a bull.
> Highly polished "Mauryan lustre" stone surface. Neutral museum-catalogue grey
> background, soft even studio lighting, sharp focus, archaeological
> documentation style. No text, no watermark.

Why a horse: the Rummindei inscription and later accounts record the Lumbini
capital as a horse; the object itself is lost. Never a lion — that is Sarnath,
India's national emblem.

---

## 3. `vihara-remains.votive-stupas-1957`  — **change tier to `artistic_impression`** unless you attach a photo

We only have Debala Mitra's *written* 1957 record of the sixteen votive stupas —
no photograph. Conditioning on text alone is not a `conditioned_reconstruction`.
Two honest options:

- **Preferred:** attach a real photograph of comparable small brick votive stupas
  (e.g. surviving votive stupas elsewhere at Lumbini or another Tarai site) as the
  reference → the plate can stay `conditioned_reconstruction`.
- **Otherwise:** generate from the prompt and set `evidence_tier` to
  `artistic_impression` in `plates.json`. Tell me which, and I'll set the label.

**Aspect ratio:** **3:2 landscape** (to dissolve against a present-day view of the
bare foundations).

> A 1950s black-and-white archaeological documentation photograph of a cluster of
> about sixteen small brick votive stupas of varying heights, roughly half a metre
> to two metres, standing on excavated ground in the Lumbini sacred garden. Worn,
> weathered brick; some stupas partly ruined. Low grass and a few scattered trees
> behind. Flat documentary daylight, grainy mid-20th-century film look, no people,
> no text, no watermark.

---

## When you send the images back

Tell me, per file, which plate id it's for and (for #3) which tier you chose. I'll
crop out any borders, resize to ~2048px long edge, save as the `image` name in
`plates.json`, set `produced: true`, and re-run `node tools/validate-seed.mjs`.

# Dhamma surface content — production guide

Three content files feed the Dhamma surface described in `SAKSHI-COMPLETE.md`
file 13 (THE DHAMMA SURFACE). They are pure seed content in Lane D's `seed/`; the
app wiring lives in Lane B/A's `features/dhamma/` and is not touched here.

| File | What it holds | Wired into |
|---|---|---|
| `prompts.json` | Curated place-tied prompts, 3 per site (§13.4) | The prompt chips shown after darśana / capture — **kills the blank chat box** |
| `dhamma-modes.json` | The four AN 4.42 answer modes + plain-language glosses (§13.1) | The Pali mode label on the answer card |
| `reflections.json` | Site-specific four-truths reflection scaffolds (§13.6) | The stillness-gated reflection flow |

## prompts.json

`§13.4` is explicit: **asking is always entered from somewhere — tap, don't
type.** Each site carries three `darsana` prompts (shown after arrival) and,
where the site has a vantage, one `capture` prompt (shown after a photo). That is
the "3 curated prompts × 12 sites = 36 prompts" D deliverable. Free text is kept
but demoted to a small *"Ask something else"* — it is what makes the `ṭhapanīya`
refusal demo land, so do not remove it.

Prompts are questions the retrieval can actually answer from the corpus. Keep
them tied to that site's real facts in `sites.json` — a prompt that has no
grounded answer produces a refusal card, which reads as broken rather than
principled.

## dhamma-modes.json

The mode is **displayed on every answer card**, with `AN 4.42` cited for the
taxonomy itself (§13.1). `ṭhapanīya` is a legitimate answer, not an error — the
card for it cites `MN 63`, where the Buddha declines the ten undeclared
questions. Use `gloss` for the small label and `explain` for the one-line tooltip.

## reflections.json

Unlocked by completing the stillness quest, never by opening a tab (§13.6). The
scaffold **asks, never advises** — every stage is a question. Covers the five
tier-1 sites plus Tilaurakot, whose *"what are you holding on to?"* is the
canonical example in the spec.

> **Safety, non-negotiable (§13.6):** distress detection halts the reflection
> flow entirely — no verse, no reframe — and surfaces verified Nepali helplines.
> This must be tested and live **before** the reflection mode is shown to anyone.
> If it isn't finished, cut the whole reflection mode; `paṭipucchā` inside Dhamma
> still gives the Socratic behaviour without the risk surface.

## Nepali

Every `ne` string here is drafted and awaits a native-speaker pass, exactly like
`narration.json` and the seed captions. It is covered by the full vocabulary
sweep (`node tools/lint-vocab.mjs`). The credibility claim ("proper Nepali, not
machine translation") is only true after a human reads each line aloud.

## Audio (§13.5) — a separate, tool-dependent step

The palm-leaf card has a play button; `§13.5` wants pre-generated TTS for the top
~50 passages as bundled assets. That is the same pipeline as `NARRATION.md`
(pre-generate, never live TTS; Opus; into `app/assets/audio/`). The passage list
comes from Lane C's corpus, so it is produced once C's retrieval set is frozen.

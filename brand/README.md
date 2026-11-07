# Sākṣī brand assets

*Sākṣī* means **witness**. The mark says the same thing twice: it is an eye, and
its iris is the alignment reticle you see through the camera when you line your
phone up with a fixed viewpoint. The four ticks are the reticle's registration
marks — look at the place, line the frame up, take the photo.

The app-icon tile adds the stepped plinth every Newar temple stands on: the
thing being witnessed, under the eye that witnesses it.

## Files

| File | Use |
| --- | --- |
| `sakshi-mark.svg` | The mark alone, light backgrounds |
| `sakshi-mark-dark.svg` | The mark alone, navy / dark backgrounds |
| `sakshi-mark-mono.svg` | Single colour via `currentColor` — notification icon, stamps, print |
| `sakshi-icon-tile.svg` · `sakshi-icon-1024.png` · `sakshi-icon-512.png` | App icon, with plinth and rounded tile |
| `sakshi-lockup.svg` · `-dark.svg` · `@2x.png` | Horizontal mark + name — headers, nav bars, slide footers |
| `sakshi-stacked.svg` · `@2x.png` | Mark over name — square placements, avatars, stickers |
| `sakshi-bilingual.svg` · `@2x.png` | Mark, `Sākṣī`, `साक्षी` — title slides, posters, signage |
| `sakshi-wordmark.svg` | Name alone, Latin |
| `sakshi-wordmark-devanagari.svg` | Name alone, Devanagari |
| `sakshi-mark-512.png` | Raster mark on transparency |

## Colour

Straight from `theme/colors.ts`, so the logo and the UI cannot drift apart.

| Role | Token | Hex |
| --- | --- | --- |
| Mark, deep | `whiteColors.sandstoneDeep` | `#8E7657` |
| Mark, light / iris | `whiteColors.sandstone` | `#B79B72` |
| Wordmark on light | `whiteColors.textPrimary` | `#252A27` |
| Wordmark on dark | `navyColors.white` | `#F4F7FA` / `#F5F3EE` |
| Icon tile ground | `android.adaptiveIcon.backgroundColor` | `#F3E4CB` |
| Plinth silhouette | — | `#DFCCA8` |

## Rules

- **Clear space** on every side is the width of one reticle tick (`22` units at
  the mark's own `256` scale, i.e. 8.6% of the mark's width).
- **Minimum size**: the full mark holds down to 32 px; below that drop the ticks
  and use the eye alone, or `sakshi-mark-mono.svg` at 24 px.
- Don't recolour outside the table above, rotate the mark, or set the name in
  anything but Anek Devanagari SemiBold.
- The macron and dot-below in *Sākṣī* are part of the name. Never spell it
  `Sakshi` in a logo position.

## Regenerating

The wordmarks are real outlines pulled from the bundled font, not live text, so
they render identically without Anek installed. `साक्षी` is shaped through
HarfBuzz so the `क्ष` conjunct is the true ligature.

```sh
python3 -m venv .venv && .venv/bin/pip install fonttools uharfbuzz
cd tools/brand && ../../.venv/bin/python brand.py     # ImageMagick needed for the PNGs
```

Source font: Anek Devanagari SemiBold (SIL OFL 1.1), already a dependency via
`@expo-google-fonts/anek-devanagari`.

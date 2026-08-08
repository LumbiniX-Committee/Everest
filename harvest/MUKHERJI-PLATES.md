# Mukherji 1901 — plate catalogue

Source: P. C. Mukherji, *A Report on a Tour of Exploration of the Antiquities in
the Tarai, Nepal, the Region of Kapilavastu; During February and March 1899.*
ASI Imperial Series No. XXVI, Part I. Calcutta, 1901. All plates **Public Domain**.

Two scans were fetched by `00_fetch_mukherji.py`:

| Scan | IA identifier | Full-res page images |
|---|---|---|
| Google Books | `bub_gb_5iYXAAAAYAAJ` | `bub_gb_5iYXAAAAYAAJ_jp2.zip` — leaves 1852×2500 px |
| DLI | `in.ernet.dli.2015.115950` | `..._jp2.zip` (94 MB, also full-res) |

**Page↔leaf offset (bub):** PDF page *N* = JP2 leaf *N−1*. The PDF's own embedded
images are downsampled (~771 px); always extract from the `_jp2.zip` for print
resolution, not from the PDF.

## Extracted so far (into `app/assets/plates/`)

| Plate id | Tier | Source | Leaf |
|---|---|---|---|
| `ashokan-pillar.1899-south` | historical_photograph | Plate XX, Fig. 2 — "Rummin-dei view of the ruins from the south" | 0126 |
| `ashokan-pillar.pre1896-jungle.source` | historical_photograph (conditioning source) | Plate XX, Fig. 1 — "Rummin-dei view of the ruins from the west" | 0126 |
| `maya-devi-temple.mukherji-1899-plan` | survey_drawing | Plate XX, Fig. 1 — "Plan of Maya-Devi Temple" | 0128 |
| `ashokan-pillar.rummindei-inscription` | survey_drawing | Plate XX, Fig. 4 — "Detail of the inscription" | 0128 |
| `lumbini.mukherji-1899-general-plan` | survey_drawing | Plate XVIII, Fig. 1 — "General plan of the ruins at Rummin-dei" | 0072 |

Note: leaf 0073's text body independently confirms the **horse** capital and the
"*Here Buddha-Sakyamuni was born*" reading — useful corroboration for D7.

## Still to catalogue / extract

Other plates carry Sagarhawa (e.g. leaf 0111, "Sagarhwa — general plan of the
excavated ruins, from west"), Tilaurakot and Greater-Lumbini coverage, plus small
finds. To regenerate the working previews and pick more:

```bash
# render triage contact sheets (80 dpi) — already done into harvest/_pages/
pdftoppm -png -r 80 _raw/bub_gb_5iYXAAAAYAAJ__bub_gb_5iYXAAAAYAAJ.pdf _pages/bub
# then extract a chosen leaf at full res from the jp2 zip:
unzip -o -j _raw/bub_jp2.zip 'bub_gb_5iYXAAAAYAAJ_jp2/bub_gb_5iYXAAAAYAAJ_0111.jp2' -d _jp2
```

**No generative restoration on any of these** — deskew, crop, gentle denoise
only. An AI-hallucinated 1899 photograph is the exact failure mode this project
argues against (Charter #6, 03 §1).

# harvest

Build the whole asset base from the internet, with zero fieldwork
(03-WEB-HARVEST-PLAN). Every fetched file lands one line in `manifest.jsonl`;
`LICENCES.md` is generated from that, never hand-written (TEAM-CHARTER #7).

## The pipeline

| Script | What | Runs today? |
|---|---|---|
| `00_fetch_mukherji.py` | IA metadata for both 1901 scans; the 32 public-domain plates | Yes (metadata). Plate extraction needs `pdfimages` locally. |
| `01_fetch_wikimedia.py` | geosearch + category crawl at Lumbini | **Yes — keyless** |
| `02_fetch_mapillary.py` | bbox query with `compass_angle` (position + heading = a vantage) | Needs `MAPILLARY_TOKEN` |
| `03_dedupe_quality.py` | perceptual-hash dedupe, Laplacian-blur / resolution gate | After `pip install` |
| `04_classify.py` | CLIP zero-shot → which of the 12 sites, or "not a monument" | After `pip install` |
| `05_build_vantages.py` | cluster by geohash + 15° heading bin → `seed/vantages.candidates.json` | Yes |
| `06_export_licences.py` | `LICENCES.md` from the manifest | Yes |

`00`, `01`, `02`, `05`, `06` use the **standard library only**. `03` and `04`
need the packages in `requirements.txt`.

## Run

```bash
python harvest/01_fetch_wikimedia.py --dry-run     # see what's out there, no writes
python harvest/01_fetch_wikimedia.py --download     # fetch + record + pull bytes

MAPILLARY_TOKEN=... python harvest/02_fetch_mapillary.py --coverage   # check first!

pip install -r harvest/requirements.txt
python harvest/03_dedupe_quality.py
python harvest/04_classify.py
python harvest/05_build_vantages.py --min-cluster 2
python harvest/06_export_licences.py
```

## Two rules that matter

- **No generative restoration of the 1899 plates.** Deskew, crop, gentle denoise
  only. An AI-hallucinated archival photograph is the exact failure mode this
  whole project argues against (03 §1, Charter #6).
- **Check Mapillary coverage before relying on it.** If Lumbini is thin, that is
  itself a finding — it becomes the "contribute imagery back" line on stage
  (task 3.1), not a silent gap.

## Manifest fields

`id, source, url, licence, author, title, file, date_retrieved, lat, lon,
heading_deg, captured_at, site_id, extra{}`. `05` and `06` read `extra.keep`
(set by `03`/`04`) so rejected images never reach a vantage or a credit line.

Output dirs `_raw/` (PDFs) and `_images/` (downloaded bytes) are git-ignored.

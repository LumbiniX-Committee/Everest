# Damage detection — training, export, and drop-in

Sākṣī's damage detector runs a real, on-device YOLO model against a recorded
photograph and offers **candidates** the surveyor confirms. It never fabricates a
finding and never files a report on its own.

**Status: shipped.** A YOLOv8n crack detector (single class `crack`, **mAP50
0.8167**), trained on the public crack-seg set for 80 epochs and exported to
**ONNX**, lives at `assets/models/crack-seg.onnx` and is fully wired in. The scan
appears in the UI as soon as a dev build includes the native runtime (see Step 3).

This document is the recipe for reproducing the model and the runtime.

---

## What exists in the app (done)

- **`core/vision/letterbox.ts`** — pure aspect-preserving resize/pad geometry, the CHW input-tensor packing, and the inverse box mapping. Unit-tested.
- **`core/vision/yolo.ts`** — pure YOLOv8 output decode (both tensor layouts) + IoU + non-maximum suppression. Unit-tested.
- **`core/vision/detect.ts`** — pure bbox-normalisation + score-filtering. Unit-tested.
- **`services/ai/onnx.ts`** — the single guarded seam to `onnxruntime-react-native`, `expo-image-manipulator`, `jpeg-js` and `expo-asset`. Absent runtime → the detector reports `unsupported`, never a crash. Contains the full preprocess → run → postprocess pipeline built on the pure core above.
- **`services/ai/yoloEngine.ts`** — honest types (`YoloDetection`, `YoloScanResult`, `ModelInfo`), the class → condition-category maps, `useDamageDetector()`, and the `DAMAGE_MODEL` config.
- **`components/observation/`** — `YoloVisionOverlay` (dashed *candidate* boxes) and `PathologySummaryCard` (real model name, real inference time, honest mAP, empty-state honesty).
- **`ObservationScreen`** — opt-in "Scan photo for damage" → candidates → editable pre-fill.
- **Provenance** — `condition_reports.ai_assisted` (migration index 10) records a confirmed-from-AI report.
- **`metro.config.js`** — `.onnx` (and `.pte`) registered as bundled asset extensions.

---

## Why ONNX (not ExecuTorch)

The app was first scaffolded around `react-native-executorch`'s object-detection
hook, which decodes YOLO output for you. The ExecuTorch `.pte` export is finicky,
so training produced a rock-solid **ONNX** file instead. `onnxruntime-react-native`
returns a *raw tensor*, so the decode the hook would have hidden is done
explicitly in `core/vision/yolo.ts` and `services/ai/onnx.ts`. This is ~all of the
value with a reliable export. If you later get a working `.pte`, the only file
that changes is `services/ai/onnx.ts` (swap the runtime); the pure decode/geometry
in `core/vision` and the whole UI stay put.

---

## Step 1 — Train (Colab free T4, ~1.5–3 h)

Run [`docs/train-crack-seg.ipynb`](train-crack-seg.ipynb). You do **not** need to
collect a dataset — Ultralytics auto-downloads the public 4,029-image crack set.
The notebook trains `yolov8n` (detection, boxes — what the overlay draws), prints
the honest **`mAP50`**, exports ONNX first (reliably), and zips it for download.

> Scope honestly: most public data is **crack-only (single class)**. Ship a good
> crack detector rather than a bad five-class one, and report mAP honestly. Do not
> claim conservator-grade assessment.

## Step 2 — Export (handled by the notebook)

The notebook's Step 5 produces `crack-seg.onnx`. (Step 5b optionally attempts a
`.pte`; ignore it unless you specifically want the ExecuTorch runtime.) Keep the
`mAP50` it printed — you paste it in below, unrounded.

## Step 3 — Drop it in

1. Put the file at **`assets/models/crack-seg.onnx`** (overwrites the shipped one).
2. In **`services/ai/yoloEngine.ts`**, update `DAMAGE_MODEL.info.mAP50` to the
   number your training run reported, and `classes` if you trained more than
   `crack` (also extend `LABEL_TO_PATHOLOGY` in the same file so each class string
   maps to a condition category). `source` already points at the `.onnx`.
3. Install the runtime and rebuild the dev client (native module — **not** Expo
   Go; you already need a dev build for MapLibre):
   ```bash
   npx expo install onnxruntime-react-native expo-image-manipulator expo-asset
   npm i jpeg-js
   npx expo prebuild
   eas build --profile development --platform android   # or ios
   ```

## Step 4 — Verify on device

- Requirements: **New Architecture** (you're on RN 0.86 ✓). A dev build that
  installed the packages above.
- Open an observation → **Scan photo for damage** → dashed candidate boxes appear
  over the photo; the summary shows the real model + mAP + measured inference time.
- **Three untested-until-device seams** (all isolated in `services/ai/onnx.ts`):
  1. **Model loading** — the session is created from the model *bytes*
     (`InferenceSession.create(Uint8Array)`). If your onnxruntime version rejects
     bytes, switch to a file path (resolve `Asset.localUri`).
  2. **ImageManipulator API** — uses the SDK 54+ context API
     (`ImageManipulator.manipulate(uri).resize(...).renderAsync()` →
     `saveAsync({ base64, format })`). Adjust if your installed version differs.
  3. **Box coordinate space** — the decode assumes YOLOv8's standard
     `[1, 4+nc, 8400]` output in input-pixel space, letterboxed centre. If boxes
     look shifted/scaled, the fix is in `runOnnxDetection` / `undoLetterbox`.

---

## The honesty rules (do not regress these)

- **Candidate, not verdict.** Boxes are dashed; the card says "Candidates for you
  to verify — not a conservator's assessment."
- **The model fills *what*, the human decides *how urgent*.** Pre-fill supplies
  category + kind; severity is always chosen by the person (the sheet opens at
  the severity step).
- **No invented numbers.** Confidence, inference time and mAP are real or absent.
  An empty scan says "No candidate damage found" — never a fake integrity score.
- **Provenance is recorded.** A confirmed-from-AI report is stored with
  `ai_assisted = 1`.
- **The manual path always works.** The detector is an assistant the core report
  flow never depends on.

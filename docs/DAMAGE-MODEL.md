# Damage detection — training, export, and drop-in

Sākṣī's damage detector runs a real, on-device YOLO model against a recorded
photograph and offers **candidates** the surveyor confirms. It never fabricates a
finding and never files a report on its own.

This document is the recipe for producing the model and switching it on. Until a
model is dropped in, `DAMAGE_MODEL.source` is `null` and the feature is simply
absent from the UI — the app is honest by omission, and the manual condition
report works exactly as before.

---

## What already exists in the app (done)

- **`core/vision/detect.ts`** — pure bbox-normalisation + score-filtering, unit-tested.
- **`services/ai/executorch.ts`** — the single guarded seam to `react-native-executorch`. Absent runtime → the detector reports `unsupported`, never a crash.
- **`services/ai/yoloEngine.ts`** — honest types (`YoloDetection`, `YoloScanResult`, `ModelInfo`), the class → condition-category maps, `useDamageDetector()`, and the `DAMAGE_MODEL` config seam.
- **`components/observation/`** — `YoloVisionOverlay` (dashed *candidate* boxes) and `PathologySummaryCard` (real model name, real inference time, honest mAP, empty-state honesty).
- **`ObservationScreen`** — opt-in "Scan photo for damage" → candidates → editable pre-fill.
- **Provenance** — `condition_reports.ai_assisted` (migration index 10) records a confirmed-from-AI report.

You supply: **the trained `.pte` model file**, and flip three switches below.

---

## Step 1 — Train (Colab free T4, ~1.5–3 h)

You do **not** need to collect a dataset. Use a public one.

```python
!pip install ultralytics
# 4,029-image crack instance-segmentation set, auto-downloaded by Ultralytics:
!yolo segment train model=yolov8n-seg.pt data=crack-seg.yaml epochs=80 imgsz=640
# For plain boxes (matches the current overlay, simplest): use detect instead:
# !yolo detect train model=yolov8n.pt data=crack-seg.yaml epochs=80 imgsz=640
```

Watch **`mAP50`** in the output — that is the honest accuracy number you will put
in the UI. Do not round it up.

> Scope honestly: most public data is **crack-only (single class)**. Ship a good
> crack detector rather than a bad five-class one. `docs`/`SAKSHI-COMPLETE.md`
> §5.2 B15 and the spec's own words: *"five classes done well beats eight done
> badly… report mAP honestly. Do not claim conservator-grade assessment."*

## Step 2 — Export to ExecuTorch

```python
!yolo export model=runs/segment/train/weights/best.pt format=executorch
#   → best.pte (+ metadata.yaml)
```

**Fallback** if the `.pte` export fights you (it can): export ONNX and switch the
runtime in `services/ai/executorch.ts` to onnxruntime-react-native — ~90% of the
value, rock-solid export:

```python
!yolo export model=runs/segment/train/weights/best.pt format=onnx
```

## Step 3 — Drop it in

1. Put the file at **`assets/models/crack-seg.pte`**.
2. In **`services/ai/yoloEngine.ts`**, set the config:
   ```ts
   export const DAMAGE_MODEL = {
     source: require('../../assets/models/crack-seg.pte'), // was null
     info: {
       name: 'YOLOv8n crack detector',
       version: '0.1.0',
       classes: ['crack'],
       mAP50: 0.__,          // ← the real mAP50 from Step 1
       runtime: 'executorch',
     },
   };
   ```
   If you trained more than crack, extend `classes` and the `LABEL_TO_PATHOLOGY`
   map in the same file so the model's class strings map to condition categories.
3. Install the runtime and rebuild the dev client (it is a native module — **not**
   Expo Go; you already need a dev build for MapLibre):
   ```bash
   npm i react-native-executorch
   npx expo prebuild
   eas build --profile development --platform android   # or ios
   ```

## Step 4 — Verify on device

- Requirements: **New Architecture** (you're on RN 0.86 ✓), **iOS 17+ / Android 13+**.
- Open an observation → **Scan photo for damage** → boxes appear over the photo,
  the summary shows the real model + mAP + inference time.
- **Check the box coordinate space.** The one untested assumption is that the
  runtime returns boxes in *original-image* pixel space. If boxes look shifted or
  scaled, adjust the single marked line in `useExecutorchDamageDetector`
  (`services/ai/yoloEngine.ts`) that calls `imageSize()` / `normalizeBbox()`.

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

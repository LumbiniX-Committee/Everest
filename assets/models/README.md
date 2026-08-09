# Models

The on-device damage-detection model lives here.

**Shipped: `crack-seg.onnx`** — a YOLOv8n crack detector (single class `crack`,
mAP50 0.82), trained on the public crack-seg set and exported to ONNX. It is
wired up in [`services/ai/yoloEngine.ts`](../../services/ai/yoloEngine.ts) via
`DAMAGE_MODEL.source` and decoded by [`services/ai/onnx.ts`](../../services/ai/onnx.ts).

To retrain or replace it, follow [`docs/DAMAGE-MODEL.md`](../../docs/DAMAGE-MODEL.md):
run `docs/train-crack-seg.ipynb` on Colab, drop the new `crack-seg.onnx` here,
update the real `mAP50` in `yoloEngine.ts`, and rebuild the dev client.

The damage-scan UI appears only when both the model **and** the native runtime
(`onnxruntime-react-native`) are present in the build; in Expo Go, or before the
runtime is installed and the dev client rebuilt, the detector reports
`unsupported` and the app runs exactly as before. Unlike `.opus` audio and other
build artifacts, this model **is committed** — it is the feature.

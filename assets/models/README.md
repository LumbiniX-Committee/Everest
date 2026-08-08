# Models

The on-device damage-detection model lives here.

Drop the exported file in as **`crack-seg.pte`** (or `.onnx`), then wire it up per
[`docs/DAMAGE-MODEL.md`](../../docs/DAMAGE-MODEL.md) — set `DAMAGE_MODEL.source`
in `services/ai/yoloEngine.ts`, fill in the real `mAP50`, install
`react-native-executorch`, and rebuild the dev client.

Until a model is present, `DAMAGE_MODEL.source` stays `null` and the damage-scan
UI does not appear. The model file itself is **not committed** (it is a build
artifact); this README keeps the directory in git.

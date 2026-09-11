# Dependencies

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)
**Machine-readable companion:** [DEPENDENCY_INVENTORY.json](DEPENDENCY_INVENTORY.json) — full importer lists and all 815 resolved transitive packages.

---

## 1. Facts

| | |
|---|---|
| Package manager | **npm** |
| Lockfile | `package-lock.json`, **lockfileVersion 3** |
| Lock entries | 980 (815 unique transitive) |
| Direct production | **44** |
| Direct development | **7** |
| Installation verified | ✅ `npm install` succeeded during this audit |
| Node requirement | **≥ 22** (undeclared; required by `--experimental-strip-types` and `--env-file-if-exists`). Audited on 24.18.1 |
| Vulnerabilities | 22 (13 moderate, 9 high) — unassessed |

**Runtime:** React 19.2.3 · React DOM 19.2.3 · React Native 0.86.2 · Expo SDK 57 (`~57.0.11`) · TypeScript ~6.0.3

---

## 2. Rules

1. **Use `npx expo install <pkg>`**, not `npm install`, for anything Expo-adjacent — it selects the SDK-compatible version.
2. **Never remove `patch-package` or `postinstall-postinstall`.** The `postinstall` hook applies `patches/onnxruntime-react-native+1.24.3.patch`, without which the damage detector fails at runtime.
3. **Adding a native module requires a new development build.** Expo Go will not pick it up.
4. **Do not run `npm audit fix --force`** — it can break Expo SDK version alignment.

---

## 3. Production dependencies (44)

### Core framework

| Package | Declared | Resolved | Notes |
|---|---|---|---|
| `expo` | ~57.0.11 | 57.0.11 | **Update available: ~57.0.16** |
| `react` | 19.2.3 | 19.2.3 | Pinned |
| `react-dom` | 19.2.3 | 19.2.3 | Web only; no direct import |
| `react-native` | 0.86.2 | 0.86.2 | Pinned |
| `react-native-web` | ^0.21.2 | 0.21.2 | Web; no direct import |
| `expo-router` | ~57.0.11 | 57.0.11 | **Most-imported package — 48 files** |
| `@expo/metro-runtime` | ~57.0.8 | 57.0.8 | Web runtime; no direct import |

### Navigation & UI foundation

| Package | Used in |
|---|---|
| `react-native-safe-area-context` ~5.7.0 | Root layout, `Screen`, `BottomSheet`, `SurfaceTabBar`, 3 screens |
| `react-native-screens` ~4.26.0 | No direct import — required by expo-router |
| `react-native-gesture-handler` ~2.32.0 | Root layout, `AlignmentRehearsal` |
| `react-native-reanimated` 4.5.1 | `Reticle`, `OnboardingFrame`, `AlignmentRehearsal` |
| `react-native-worklets` 0.10.1 | Reanimated 4 peer |
| `@expo/vector-icons` ^15.0.2 | `components/ui/Icon.tsx`, `DhammaScreen` |

### Device capabilities

| Package | Purpose | Key importers |
|---|---|---|
| `expo-camera` | Capture | `CaptureScreen`, `services/permissions` |
| `expo-location` | GPS, geofencing | `services/location`, `geofencing`, `sensors`, `permissions` |
| `expo-sensors` | Compass/motion | `services/sensors`, `permissions` |
| `expo-file-system` | Photo storage | `CaptureScreen`, `services/ai/onnx`, `offlineModel`, `questReview`, `supabase/sync` |
| `expo-image-manipulator` | Pre-inference resize | `services/ai/onnx` |
| `expo-image-picker` | Quest evidence | `TaskEvidenceSheet` |
| `expo-audio` | Narration | `hooks/useNarration`, `services/audio` |
| `expo-speech` | TTS | `services/voice` |
| `expo-haptics` | Feedback | `useHaptics`, `AlignmentRehearsal` |
| `expo-notifications` | Arrivals | `services/notifications` |
| `expo-task-manager` | Background geofence | `services/geofencing` |

### Data & backend

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` ^2.109.0 | Backend client — `services/supabase/{index,auth}.ts` |
| `@react-native-async-storage/async-storage` 2.2.0 | KV store + Supabase session storage |
| `expo-sqlite` ~57.0.1 | Local DB — `services/database` |
| `base64-arraybuffer` ^1.0.2 | Binary encoding — `services/ai/onnx`, `supabase/sync` |

### AI / vision

| Package | Purpose | Native |
|---|---|---|
| `onnxruntime-react-native` ^1.24.3 | Damage detector — **patched + custom plugin** | ✅ |
| `llama.rn` ^0.12.6 | On-device LLM — `services/offlineModel` | ✅ |
| `jpeg-js` ^0.4.4 | JPEG decode for inference | — |

### Maps

| Package | Purpose | Native |
|---|---|---|
| `@maplibre/maplibre-react-native` ^11.3.6 | Map — `SiteMap3D` | ✅ |
| `react-native-webview` 13.16.1 | Webview map — `MapWebView` | ✅ |

### Fonts & assets

`@expo-google-fonts/anek-devanagari`, `@expo-google-fonts/ibm-plex-sans`, `@expo-google-fonts/ibm-plex-mono` — all imported by [theme/fonts.ts](../../theme/fonts.ts).
`expo-font`, `expo-asset`, `expo-splash-screen`, `expo-status-bar`, `expo-constants`.

### App infrastructure

`expo-updates` (OTA), `expo-dev-client` (dev build), `expo-linking` (deep links) — **none has a direct source import**; all are wired through config/native.

---

## 4. Development dependencies (7)

| Package | Declared | Resolved | Purpose |
|---|---|---|---|
| `typescript` | ~6.0.3 | 6.0.3 | Type checking |
| `eslint` | ^9.0.0 | 9.39.5 | Linting |
| `eslint-config-expo` | ~57.0.1 | 57.0.1 | Expo lint rules |
| `@types/react` | ~19.2.2 | 19.2.18 | React types |
| `patch-package` | ^8.0.1 | 8.0.1 | **Applies the ONNX patch — do not remove** |
| `postinstall-postinstall` | ^2.1.0 | 2.1.0 | Makes `postinstall` fire reliably |
| `@expo/ngrok` | ^4.1.3 | 4.1.3 | Tunnelling for device testing |

---

## 5. Declared but never directly imported (12)

**None of these is safe to remove on that basis alone.** Each is required by the platform, bundler, or config.

| Package | Why it stays |
|---|---|
| `@expo/metro-runtime` | Web bundler runtime |
| `expo-dev-client` | Development build |
| `expo-linking` | Deep-link handling behind expo-router |
| `expo-updates` | OTA; configured in `app.json` |
| `react-dom` | Web renderer |
| `react-native-screens` | expo-router peer |
| `react-native-web` | Web platform |
| `react-native-worklets` | Reanimated 4 peer |
| `@expo/ngrok` | Tunnel CLI |
| `@types/react` | Types |
| `patch-package` | **Critical** — postinstall |
| `postinstall-postinstall` | **Critical** — postinstall reliability |

---

## 6. Patches and native workarounds

### `patches/onnxruntime-react-native+1.24.3.patch`

Deletes the package's `unimodule.json`. Without it, Expo's autolinking "claims" the package as an Expo module but registers zero native modules, **and** excludes it from React Native's own autolinking — so `NativeModules.Onnxruntime` is `null` at runtime.

### `plugins/withOnnxAutolink.js`

Does the same deletion again during `prebuild`. **This is not redundancy:** the patch covers clean installs; the plugin covers EAS restoring a cached `node_modules` where the deletion did not take. Full explanation in [NATIVE_AND_PERMISSIONS.md](NATIVE_AND_PERMISSIONS.md) §8.

> ⚠️ **Removing either can produce a build that compiles and then fails at runtime — on EAS but not locally.**

---

## 7. Native modules requiring a development build

`onnxruntime-react-native`, `llama.rn`, `@maplibre/maplibre-react-native`, `react-native-webview`, plus the `expo-*` device modules.

**Expo Go cannot run the map or the damage detector.**

---

## 8. Dependencies requiring configuration

| Package | Needs |
|---|---|
| `@supabase/supabase-js` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` |
| `llama.rn` | A model file (**not bundled** — acquisition path unverified) |
| `onnxruntime-react-native` | `assets/models/crack-seg.onnx` (bundled) |
| `expo-updates` | EAS project id (in `app.json`) |
| `expo-notifications` | Icon + colour (in `app.json`) |

---

## 9. Overlapping libraries — intentional

| Overlap | Why both |
|---|---|
| `@maplibre/maplibre-react-native` + `react-native-webview` | Native 3D map vs webview map; platform-split `.web.tsx` |
| `react-native-reanimated` + RN `Animated` | Reanimated is current; `Animated` survives in `SpeechCloud` (and is the source of all 16 lint errors) |
| `onnxruntime-react-native` + `llama.rn` | Vision vs language — different jobs |
| `expo-audio` + `expo-speech` | Recorded narration vs synthesised speech |

---

## 10. Version alignment warning

The Expo dev server reports:

```
An update for expo is available: 57.0.11 → ~57.0.16
16 other packages may need updating. Run npx expo install --check for details.
```

Being behind within an SDK minor is low-risk but touches native modules. After updating: **rebuild and retest the map and detector specifically.**

---

## 11. Adding a dependency — checklist

- [ ] `npx expo install <pkg>` (not `npm install`) if Expo-adjacent
- [ ] Native? → new development build required; note it in the PR
- [ ] Config plugin needed? → add to `app.json` `plugins`
- [ ] New permission? → `app.json` **and** [services/permissions/index.ts](../../services/permissions/index.ts)
- [ ] New binary asset type? → `assetExts` in [metro.config.js](../../metro.config.js)
- [ ] Needs a patch? → `patches/` (already wired)
- [ ] `npm run typecheck && npm run lint`
- [ ] Update this file and [DEPENDENCY_INVENTORY.json](DEPENDENCY_INVENTORY.json)

---

## 12. Transitive dependencies

815 unique packages, fully listed in [DEPENDENCY_INVENTORY.json](DEPENDENCY_INVENTORY.json) → `transitiveResolved`.

Notable ones that appear but are **not** configured project tooling:
- `@testing-library/*`, `react-test-renderer` — present transitively; **there is no component test setup**. Do not mistake their presence for one.
- `@turf/*` — geospatial helpers, pulled in by MapLibre.
- `vitest` is **not** in the root lockfile as a direct dep — the harness in [tools/test/](../../tools/test/) has its own manifest.

**npm reported** that 3 packages have install scripts not covered by `allowScripts`: `llama.rn`, `postinstall-postinstall`, `unrs-resolver`.

---

## Needs verification

1. The 22 vulnerabilities — severity and exploitability (`npm audit`).
2. Whether the ONNX patch is still needed above v1.24.3.
3. Whether `@expo/ngrok` is still used by anyone's workflow.
4. Where the llama.rn model comes from.

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*

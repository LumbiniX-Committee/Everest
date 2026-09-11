# Native Configuration and Permissions

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)
**Workflow:** Expo SDK 57 managed — **no `android/` or `ios/` directories in the repo.**

---

## 1. How native configuration works here

There are no native project folders. All native configuration comes from:

1. [app.json](../../app.json) — the Expo config, including the `plugins` array
2. [plugins/withOnnxAutolink.js](../../plugins/withOnnxAutolink.js) — one custom config plugin
3. [patches/onnxruntime-react-native+1.24.3.patch](../../patches/onnxruntime-react-native+1.24.3.patch) — applied by `patch-package` on `postinstall`

Native projects are generated at build time (`expo prebuild` / EAS Build). **Never hand-edit generated native files** — they do not exist in the repo and would be overwritten.

---

## 2. App identity

| Setting | Value |
|---|---|
| Display name | `Sākṣī` |
| Slug | `sakshi` |
| Owner | `siddantasodari` |
| Scheme (deep links) | `sakshi` |
| Version / runtimeVersion | `0.1.0` / `0.1.0` |
| iOS bundle identifier | `org.lumbinix.sakshi` |
| Android package | `org.lumbinix.sakshi` |
| Orientation | `portrait` |
| UI style | `automatic` — selected from the persisted navy/white theme at boot |
| EAS project id | `e8454679-10b7-42cc-8961-95a421426705` |
| Updates URL | `https://u.expo.dev/e8454679-10b7-42cc-8961-95a421426705` |

Android-specific: `predictiveBackGestureEnabled: false`. iOS: `supportsTablet: true`.

`index.tsx` calls `Appearance.setColorScheme()` after reading `colorTheme`, so
native controls follow the selected palette. Because `userInterfaceStyle`
changed in `app.json`, an installed native build needs rebuilding to receive
that configuration change; Expo web/development bundles pick it up directly.

`assetBundlePatterns: ["assets/**/*"]` — **everything** in `assets/` ships with the binary, which is what makes narration audio and the ONNX model available offline.

---

## 3. Declared Android permissions

From `app.json` → `expo.android.permissions` — **only three**:

```json
"android.permission.ACCESS_COARSE_LOCATION",
"android.permission.ACCESS_FINE_LOCATION",
"android.permission.CAMERA"
```

> Config plugins add further permissions to the generated manifest (e.g. `expo-notifications`, `expo-audio`). The final merged manifest is only visible after `expo prebuild`. **Needs verification** against a generated build if the exact manifest matters.

**Notably absent:** no background-location permission (`ACCESS_BACKGROUND_LOCATION`). Geofencing via `expo-task-manager` + `expo-location` is therefore foreground-scoped. Whether the arrival feature needs background location to work as intended is **Needs verification**.

---

## 4. Permission usage descriptions

These come from **plugin config in `app.json`**, not from an `ios.infoPlist` block. This is the single source for both platforms' permission strings.

| Permission | Description string |
|---|---|
| Location | "Sākṣī uses your location to find nearby heritage sites, guide you to fixed viewpoints, and tell you what a place holds when you reach it." |
| Camera | "Sākṣī uses the camera so you can compare today's view with historical imagery and record an observation." |
| Motion | "Sākṣī uses motion sensors to help align your device with a fixed viewpoint." |

`expo-camera` is configured with `recordAudioAndroid: false` — the app never records audio, so no microphone permission is requested.

**To change a permission string, edit the plugin config array in [app.json](../../app.json)**, then rebuild.

---

## 5. Runtime permission handling

Centralised in [services/permissions/index.ts](../../services/permissions/index.ts) and surfaced through [store/permissions.tsx](../../store/permissions.tsx). **Three kinds:** `location`, `camera`, `motion`.

### The governing rule

The service's header states it directly:

> "**Nothing is requested at launch.** A permission is asked for at the moment [it is needed]."

Permissions are requested at point of use, not up front.

### Per-kind implementation

| Kind | Check | Request | Module |
|---|---|---|---|
| `location` | `Location.getForegroundPermissionsAsync()` | `Location.requestForegroundPermissionsAsync()` | `expo-location` |
| `camera` | `Camera.getCameraPermissionsAsync()` | `Camera.requestCameraPermissionsAsync()` | `expo-camera` |
| `motion` | `DeviceMotion.getPermissionsAsync()` | `DeviceMotion.requestPermissionsAsync()` | `expo-sensors` |

Each is wrapped in a `try/catch` returning a `PermissionState` rather than throwing — a permission failure degrades a feature, it does not crash the app.

### Public API

| Export | Purpose |
|---|---|
| `check(kind)` | Read current status without prompting |
| `request(kind)` | Prompt |
| `checkAll()` | Read all three → `PermissionMap` |
| `openSettings()` | `Linking.openSettings()` — for permanently denied |

### Permission state shape

```ts
{ status: 'undetermined' | ..., canAskAgain: boolean }
```

Initial value per kind: `{ status: 'undetermined', canAskAgain: true }`.

**`canAskAgain: false` is the permanently-denied signal.** When it is false, prompting again does nothing — the UI must route the user to `openSettings()` instead. That path exists and is implemented.

### Where permissions surface in the UI

| Screen | Role |
|---|---|
| [features/onboarding/PermissionsScreen.tsx](../../features/onboarding/PermissionsScreen.tsx) | Onboarding step 5 — primes and requests |
| [features/settings/PermissionsScreen.tsx](../../features/settings/PermissionsScreen.tsx) | Ongoing status + re-request / open settings |

> **Two components share the name `PermissionsScreen`.** They are different files reached through different barrels. Check which you are editing.

`StorageKeys.permissionPrimerSeen` (`sakshi.v1.permissions.primerSeen`) records whether the priming explanation has been shown.

---

## 6. Feature → permission map

| Feature | Permission | Consequence if denied |
|---|---|---|
| Photo capture ([features/sakshi/CaptureScreen.tsx](../../features/sakshi/CaptureScreen.tsx)) | Camera | Cannot capture — the core loop is blocked |
| Position / vantage proximity | Location (foreground) | No distance readouts, no visit credit |
| Alignment gate ([hooks/useAlignment.ts](../../hooks/useAlignment.ts), [useHeading.ts](../../hooks/useHeading.ts)) | Motion | No compass alignment → `manual` gate mode only |
| Nearby sites ([hooks/useNearbySites.ts](../../hooks/useNearbySites.ts)) | Location | No nearby list |
| Arrival notifications ([store/arrival.tsx](../../store/arrival.tsx)) | Location (+ notifications) | Arrivals unavailable; `ArrivalStatus` carries a `problem` string |
| Quest proximity ([features/quests/components/TaskProximity.tsx](../../features/quests/components/TaskProximity.tsx)) | Location | Proximity tasks cannot verify |
| Map ([features/tirtha/LiveMapScreen.tsx](../../features/tirtha/LiveMapScreen.tsx)) | Location | Map renders without a user position |

**Denial degrades a feature; it never crashes the app.** `ArrivalProvider` exposing a `problem?: string` field is the clearest example of this being designed for, not patched around.

Notification permission is handled by `expo-notifications` inside [services/notifications/index.ts](../../services/notifications/index.ts), **not** through the three-kind permissions store. **Needs verification** for its exact request timing.

---

## 7. Config plugins

From `app.json` → `expo.plugins`, in order:

| Plugin | Native effect |
|---|---|
| `expo-router` | File-based routing, deep-link wiring |
| `expo-font` | Font loading |
| `expo-sqlite` | SQLite native module |
| `expo-splash-screen` | Splash: `./assets/splash-icon.png`, width 180, `contain`, bg `#F5F3EE` |
| `expo-location` | Location modules + usage description |
| `expo-notifications` | Notification icon `./assets/android-icon-monochrome.png`, colour `#8E7657` |
| `expo-camera` | Camera + usage description, `recordAudioAndroid: false` |
| `expo-sensors` | Motion sensors + usage description |
| `@maplibre/maplibre-react-native` | MapLibre native SDK |
| `expo-audio` | Audio playback |
| `onnxruntime-react-native` | ONNX runtime AAR |
| **`./plugins/withOnnxAutolink`** | **Custom — see below** |
| `expo-asset` | Asset bundling |
| `llama.rn` | On-device LLM native module |

Adaptive icon: background `#F3E4CB`, foreground/background/monochrome PNGs in `assets/`.

---

## 8. The custom ONNX autolink plugin — read this before touching ONNX

[plugins/withOnnxAutolink.js](../../plugins/withOnnxAutolink.js) uses `withDangerousMod` and exists to fix a genuinely subtle native-registration bug. Its own explanation, condensed:

**The problem:** `onnxruntime-react-native` ships a `unimodule.json`. Expo's autolinking reads it and *claims* the package as an Expo module — but it is a plain React Native `ReactPackage`, so its config carries no `android.modules` list and **Expo registers zero native modules from it**. Worse, once Expo has claimed a package it is excluded from React Native's own autolinking, so `OnnxruntimePackage` never reaches `PackageList.java` either.

**The symptom:** "The AAR compiles into the APK, nothing instantiates the package, and both `NativeModules.Onnxruntime` and `TurboModuleRegistry.get('Onnxruntime')` come back null at runtime — *'the Onnxruntime native module is not registered'*."

**The fix:** delete `unimodule.json`. With it gone, Expo stops claiming the package and React Native autolinking picks it up normally.

**Why both a patch and a plugin:**

> "`patches/onnxruntime-react-native+1.24.3.patch` already deletes this file, and that is enough when `postinstall` runs against a clean install. But **EAS can restore a cached `node_modules`**, and a cache key that has not changed may hand back a tree where the deletion did not take. This plugin removes the file again during `prebuild`, which runs *after* any dependency restore and *before* Gradle asks autolinking what to register — the one moment that is guaranteed to be in the right order. Belt and suspenders on the single native module the damage detector depends on."

Verified by the author with `npx expo-modules-autolinking react-native-config -p android`, which then emits `new OnnxruntimePackage()`.

> ⚠️ **Do not remove either the patch or the plugin.** They are not redundant — they cover different moments in the build. Removing either can produce a build that compiles and then fails at runtime with a null native module, on EAS but not locally.

---

## 9. Native modules requiring a development build

These cannot run in Expo Go:

| Module | Used for |
|---|---|
| `@maplibre/maplibre-react-native` | The map |
| `onnxruntime-react-native` | Damage detector |
| `llama.rn` | On-device LLM |
| `expo-sqlite` | Local database *(works in Expo Go; listed for completeness)* |

Per [README.md](../../README.md): "The map and the damage detector need a full build (`eas build --profile development`), not Expo Go."

---

## 10. Native asset requirements

| Asset | Purpose | Configured in |
|---|---|---|
| `assets/icon.png` | App icon | `app.json` → `icon` |
| `assets/android-icon-foreground.png` | Adaptive foreground | `android.adaptiveIcon` |
| `assets/android-icon-background.png` | Adaptive background | `android.adaptiveIcon` |
| `assets/android-icon-monochrome.png` | Themed icon **and** notification icon | `adaptiveIcon` + `expo-notifications` |
| `assets/splash-icon.png` | Splash | `expo-splash-screen` plugin |
| `assets/favicon.png` | Web favicon | `web.favicon` |
| `assets/models/crack-seg.onnx` | Damage detector model | Bundled via `assetBundlePatterns` |

> `android-icon-monochrome.png` serves **two** roles. Replacing it changes both the themed launcher icon and the notification icon.

---

## 11. Metro must know about native asset types

[metro.config.js](../../metro.config.js) registers `wasm`, `opus`, `onnx`, `pte` as asset extensions. Without this, Metro tries to parse the ONNX model and the `.opus` narration files as JavaScript. See [BUILD_RUN_AND_DEPLOYMENT.md](BUILD_RUN_AND_DEPLOYMENT.md) §6.

---

## 12. JS ↔ native declaration cross-check

| Declared in `app.json` | Requested in JS | Match |
|---|---|---|
| `ACCESS_FINE_LOCATION` | `Location.requestForegroundPermissionsAsync()` | ✅ |
| `ACCESS_COARSE_LOCATION` | *(same call)* | ✅ |
| `CAMERA` | `Camera.requestCameraPermissionsAsync()` | ✅ |
| *(not declared)* | `DeviceMotion.requestPermissionsAsync()` | ⚠️ Motion needs no Android manifest permission; on iOS the plugin supplies `NSMotionUsageDescription`. Consistent, but **verify on a generated build** |
| *(plugin-supplied)* | `expo-notifications` | ⚠️ **Needs verification** — request timing not traced |
| *(none)* | Background location | ⚠️ Not declared. Geofencing is foreground-only. **Needs verification** whether arrivals require background |

---

## Needs verification

1. Final merged `AndroidManifest.xml` / `Info.plist` after `expo prebuild`.
2. Whether arrival geofencing needs `ACCESS_BACKGROUND_LOCATION`.
3. Notification permission request timing in [services/notifications/index.ts](../../services/notifications/index.ts).
4. Whether the patch and plugin are still needed at `onnxruntime-react-native` versions above 1.24.3.
5. Whether an iOS build has ever been produced.
6. minSdk / targetSdk / compileSdk — Expo SDK 57 defaults; not overridden anywhere in the repo.

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Make onnxruntime-react-native reachable to React Native autolinking.
 *
 * ── The problem ─────────────────────────────────────────────────────────────
 *
 * onnxruntime-react-native ships a `unimodule.json`. Expo's autolinking reads
 * that file and "claims" the package as an Expo module — but the package is a
 * plain React Native `ReactPackage`, not an Expo module, so its config carries
 * no `android.modules` list and Expo registers ZERO native modules from it.
 * Worse, once Expo has claimed a package it is excluded from React Native's own
 * autolinking, so `OnnxruntimePackage` never reaches `PackageList.java` either.
 * The AAR compiles into the APK, nothing instantiates the package, and both
 * `NativeModules.Onnxruntime` and `TurboModuleRegistry.get('Onnxruntime')` come
 * back null at runtime — "the Onnxruntime native module is not registered".
 *
 * ── Why a config plugin as well as a patch ──────────────────────────────────
 *
 * `patches/onnxruntime-react-native+1.24.3.patch` already deletes this file, and
 * that is enough when `postinstall` runs against a clean install. But EAS can
 * restore a cached `node_modules`, and a cache key that has not changed may hand
 * back a tree where the deletion did not take. This plugin removes the file
 * again during `prebuild`, which runs *after* any dependency restore and
 * *before* Gradle asks autolinking what to register — the one moment that is
 * guaranteed to be in the right order. Belt and suspenders on the single native
 * module the damage detector depends on.
 *
 * With `unimodule.json` gone, Expo stops claiming the package, React Native
 * autolinking picks it up normally (verified with
 * `npx expo-modules-autolinking react-native-config -p android`, which then
 * emits `new OnnxruntimePackage()`), and the module registers.
 */
const withOnnxAutolink = (config) =>
  withDangerousMod(config, [
    'android',
    (config) => {
      const unimodule = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        'onnxruntime-react-native',
        'unimodule.json',
      );
      try {
        if (fs.existsSync(unimodule)) {
          fs.rmSync(unimodule);
          console.log('[withOnnxAutolink] removed onnxruntime-react-native/unimodule.json so RN autolinking registers OnnxruntimePackage');
        }
      } catch (error) {
        // Never fail the build over this; the patch is the primary mechanism and
        // this is the fallback. Surface it so a broken assumption is visible.
        console.warn('[withOnnxAutolink] could not remove unimodule.json:', error && error.message);
      }
      return config;
    },
  ]);

module.exports = withOnnxAutolink;

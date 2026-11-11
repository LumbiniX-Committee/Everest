import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json is the configuration. This only adjusts it for development builds.
 *
 * Release builds ship ARM code only, because x86 is for emulators and was a third
 * of the old APK. Development builds put x86_64 back so they run on an emulator
 * and in the Maestro flows under .maestro/.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  if (process.env.EAS_BUILD_PROFILE !== 'development') return config as ExpoConfig;
  return {
    ...config,
    plugins: (config.plugins ?? []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
        ? ['expo-build-properties', { android: { ...plugin[1]?.android, buildArchs: ['arm64-v8a', 'armeabi-v7a', 'x86_64'] } }]
        : plugin,
    ),
  } as ExpoConfig;
};

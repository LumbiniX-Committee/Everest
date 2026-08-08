import { useEffect } from 'react';
import { useFonts } from 'expo-font';

import { setFontsAvailable } from './typography';

/**
 * Font registration.
 *
 * The real files are not vendored yet — deliberately. Fonts are licensed
 * artefacts and get committed on purpose, not downloaded by a tool.
 *
 * To enable them:
 *   1. Place the files in `assets/fonts/` using the names below.
 *   2. Uncomment `fontAssets`.
 *   3. Nothing else. `theme/typography.ts` already resolves through these keys.
 *
 * Anek:          https://fonts.google.com/specimen/Anek+Devanagari  (OFL)
 * IBM Plex Sans: https://fonts.google.com/specimen/IBM+Plex+Sans    (OFL)
 * IBM Plex Mono: https://fonts.google.com/specimen/IBM+Plex+Mono    (OFL)
 */
const fontAssets: Record<string, number> = {
  // 'Anek-Regular': require('@/assets/fonts/AnekDevanagari-Regular.ttf'),
  // 'Anek-Medium': require('@/assets/fonts/AnekDevanagari-Medium.ttf'),
  // 'Anek-SemiBold': require('@/assets/fonts/AnekDevanagari-SemiBold.ttf'),
  // 'IBMPlexSans-Regular': require('@/assets/fonts/IBMPlexSans-Regular.ttf'),
  // 'IBMPlexSans-Medium': require('@/assets/fonts/IBMPlexSans-Medium.ttf'),
  // 'IBMPlexSans-SemiBold': require('@/assets/fonts/IBMPlexSans-SemiBold.ttf'),
  // 'IBMPlexMono-Regular': require('@/assets/fonts/IBMPlexMono-Regular.ttf'),
  // 'IBMPlexMono-Medium': require('@/assets/fonts/IBMPlexMono-Medium.ttf'),
  // 'IBMPlexMono-SemiBold': require('@/assets/fonts/IBMPlexMono-SemiBold.ttf'),
};

const hasFontFiles = Object.keys(fontAssets).length > 0;

/**
 * Returns true once type is ready to render — either the real families loaded,
 * or there are none to load and the platform fallback stands in.
 *
 * A font failure must never block the app. If loading errors, we proceed with
 * the fallback and report the error to the caller.
 */
export function useAppFonts(): { ready: boolean; error: Error | null } {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (hasFontFiles && loaded && !error) {
      setFontsAvailable(true);
    }
  }, [loaded, error]);

  if (!hasFontFiles) return { ready: true, error: null };
  return { ready: loaded || error != null, error: error ?? null };
}

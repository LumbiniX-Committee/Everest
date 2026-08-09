import { useEffect } from 'react';
import { useFonts } from 'expo-font';

import { AnekDevanagari_400Regular } from '@expo-google-fonts/anek-devanagari/400Regular';
import { AnekDevanagari_500Medium } from '@expo-google-fonts/anek-devanagari/500Medium';
import { AnekDevanagari_600SemiBold } from '@expo-google-fonts/anek-devanagari/600SemiBold';
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular';
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';

import { setFontsAvailable } from './typography';

/**
 * Font registration.
 *
 * The three families arrive as static TTF instances from the `@expo-google-fonts`
 * packages — bundled into the binary, not fetched at runtime, so type is identical
 * offline and on every device. All three are OFL; the licence files travel with
 * the packages.
 *
 * Static instances matter: the variable-axis builds Google serves from its web
 * endpoint cannot be interpolated by React Native, which would render one weight
 * for all three.
 *
 * Keys below are the family names `theme/typography.ts` resolves through. Change
 * a key here and you must change it there.
 *
 * Anek Devanagari — display. Headings, site names, Devanagari.
 * IBM Plex Sans   — body. UI, navigation, prose.
 * IBM Plex Mono   — measurements. Coordinates, bearings, timestamps.
 */
const fontAssets: Record<string, number> = {
  'Anek-Regular': AnekDevanagari_400Regular,
  'Anek-Medium': AnekDevanagari_500Medium,
  'Anek-SemiBold': AnekDevanagari_600SemiBold,
  'IBMPlexSans-Regular': IBMPlexSans_400Regular,
  'IBMPlexSans-Medium': IBMPlexSans_500Medium,
  'IBMPlexSans-SemiBold': IBMPlexSans_600SemiBold,
  'IBMPlexMono-Regular': IBMPlexMono_400Regular,
  'IBMPlexMono-Medium': IBMPlexMono_500Medium,
  'IBMPlexMono-SemiBold': IBMPlexMono_600SemiBold,
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

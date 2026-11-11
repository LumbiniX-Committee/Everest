import { useEffect } from 'react';
import { useFonts } from 'expo-font';

import { Baloo2_400Regular } from '@expo-google-fonts/baloo-2/400Regular';
import { Baloo2_500Medium } from '@expo-google-fonts/baloo-2/500Medium';
import { Baloo2_600SemiBold } from '@expo-google-fonts/baloo-2/600SemiBold';
import { Mukta_400Regular } from '@expo-google-fonts/mukta/400Regular';
import { Mukta_500Medium } from '@expo-google-fonts/mukta/500Medium';
import { Mukta_600SemiBold } from '@expo-google-fonts/mukta/600SemiBold';
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
 * Baloo 2       — display. Headings and site names, warm and rounded.
 * Mukta         — body. UI, navigation, prose.
 * IBM Plex Mono — measurements. Coordinates, bearings, timestamps.
 *
 * Baloo 2 and Mukta were chosen because each holds Latin, Devanagari and the
 * IAST diacritics in one file, so Sākṣī and साक्षी never fall back mid-word.
 */
const fontAssets: Record<string, number> = {
  'Baloo-Regular': Baloo2_400Regular,
  'Baloo-Medium': Baloo2_500Medium,
  'Baloo-SemiBold': Baloo2_600SemiBold,
  'Mukta-Regular': Mukta_400Regular,
  'Mukta-Medium': Mukta_500Medium,
  'Mukta-SemiBold': Mukta_600SemiBold,
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

import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

import { usePreferences } from '@/store';

export function useHaptics() {
  const { preferences } = usePreferences();

  const pulse = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
      if (!preferences.hapticsEnabled) return;
      void Haptics.impactAsync(style).catch(() => undefined);
    },
    [preferences.hapticsEnabled],
  );

  return { pulse };
}

import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { usePreferences } from '@/store';

export function useHaptics() {
  let hapticsEnabled = true;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const prefs = usePreferences();
    hapticsEnabled = prefs.preferences.hapticsEnabled;
  } catch {
    hapticsEnabled = true;
  }

  const pulse = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (Platform.OS === 'web') return;
      if (!hapticsEnabled) return;
      void Haptics.impactAsync(style).catch(() => undefined);
    },
    [hapticsEnabled],
  );

  const selection = useCallback(() => {
    if (Platform.OS === 'web') return;
    if (!hapticsEnabled) return;
    void Haptics.selectionAsync().catch(() => undefined);
  }, [hapticsEnabled]);

  const notification = useCallback(
    (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
      if (Platform.OS === 'web') return;
      if (!hapticsEnabled) return;
      void Haptics.notificationAsync(type).catch(() => undefined);
    },
    [hapticsEnabled],
  );

  return { pulse, selection, notification };
}


import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Keeps this surface's home beneath any screen opened from elsewhere.
export const unstable_settings = { anchor: 'index' };

/**
 * Settings is a stack, not a fourth surface.
 *
 * §51 keeps the navigation model at three surfaces — Tīrtha, Sākṣī, Dhamma.
 * This is reached from a header control on each of them and pushes over the
 * top, so the tab bar never grows a Settings entry.
 */
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
      }}
    />
  );
}


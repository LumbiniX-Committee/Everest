import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Keeps this surface's home beneath any screen opened from elsewhere.
export const unstable_settings = { anchor: 'index' };

/** Detail routes push inside the surface, so the navigator never disappears. */
export default function DhammaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="question" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="reflect" options={{ animation: 'fade_from_bottom', animationDuration: 280 }} />
    </Stack>
  );
}


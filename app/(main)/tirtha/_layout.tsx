import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Keeps this surface's home beneath any screen opened from elsewhere.
export const unstable_settings = { anchor: 'index' };

/** Detail routes push inside the surface, so the navigator never disappears. */
export default function TirthaLayout() {
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
      <Stack.Screen name="map" options={{ animation: 'fade_from_bottom', animationDuration: 280 }} />
      <Stack.Screen name="model/[modelId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="place/[placeId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="site/[siteId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="quests/index" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="quests/[questId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="quests/completed/[questId]" options={{ animation: 'fade_from_bottom', animationDuration: 300 }} />
      <Stack.Screen name="then-now/[siteId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="memories" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="quest-camera" options={{ animation: 'fade_from_bottom', animationDuration: 280 }} />
    </Stack>
  );
}


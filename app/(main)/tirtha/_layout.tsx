import { Stack } from 'expo-router';

import { colors } from '@/theme';

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
      <Stack.Screen name="site/[siteId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="quests/index" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="quests/[questId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="quests/completed/[questId]" options={{ animation: 'fade_from_bottom', animationDuration: 300 }} />
      <Stack.Screen name="then-now/[siteId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
    </Stack>
  );
}


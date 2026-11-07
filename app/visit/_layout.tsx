import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * One visit, from viewpoint to saved record, above the tabs.
 *
 * It sits at the root so it can be opened from any surface without leaving a
 * partial stack behind in the Sākṣī tab. Leaving returns to the exact screen it
 * was opened from, and the tab bar stays out of the way of the camera.
 */
export default function VisitLayout() {
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
      <Stack.Screen name="vantage" />
      <Stack.Screen name="practice" />
      <Stack.Screen name="capture" options={{ animation: 'fade_from_bottom', animationDuration: 260 }} />
      <Stack.Screen name="observation" />
      <Stack.Screen name="then-now/[siteId]" />
      <Stack.Screen name="record/[siteId]" />
    </Stack>
  );
}

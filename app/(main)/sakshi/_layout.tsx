import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Detail routes push inside the surface, so the navigator never disappears. */
export default function SakshiLayout() {
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
      <Stack.Screen name="vantage" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="capture" options={{ animation: 'fade_from_bottom', animationDuration: 260 }} />
      <Stack.Screen name="observation" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="guardians" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="register/index" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="register/[siteId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="then-now/[siteId]" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
    </Stack>
  );
}


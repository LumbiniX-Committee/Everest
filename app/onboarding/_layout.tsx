import { Stack } from 'expo-router';

import { colors } from '@/theme';

/**
 * Onboarding is a stack rather than a pager: back should undo one step, and the
 * gesture should feel like turning back a page, not scrubbing a carousel.
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}

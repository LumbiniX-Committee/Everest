import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Detail routes push inside the surface, so the navigator never disappears. */
export default function SakshiLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

import { Tabs } from 'expo-router/js-tabs';

import { SurfaceTabBar } from '@/components/navigation';
import { SURFACE_LABELS } from '@/constants';
import { colors } from '@/theme';

/**
 * The three surfaces.
 *
 * Tīrtha, Sākṣī and Dhamma — no Home, no Profile, no Settings. Each tab is a
 * stack in its own right so detail routes (a site, a vantage, a question) push
 * within their surface and keep the navigator visible.
 */
export default function MainLayout() {
  return (
    <Tabs
      tabBar={(props) => <SurfaceTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="tirtha" options={{ title: SURFACE_LABELS.tirtha }} />
      <Tabs.Screen name="sakshi" options={{ title: SURFACE_LABELS.sakshi }} />
      <Tabs.Screen name="dhamma" options={{ title: SURFACE_LABELS.dhamma }} />
      <Tabs.Screen name="profile" options={{ title: SURFACE_LABELS.profile }} />
      {/* Registered so its routes resolve, hidden so the model stays at three
          surfaces. Reached from the header control on each of them. */}
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

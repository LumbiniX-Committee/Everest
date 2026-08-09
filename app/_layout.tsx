import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { notifications } from '@/services';
import { syncPendingObservations } from '@/services/sync';
import { AppProviders, useAppState } from '@/store';
import { colors, useAppFonts } from '@/theme';

// Held until we know both the fonts and the first-launch answer. Without this
// the app would flash onboarding at returning users for a frame.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AppProviders>
          <RootNavigator />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { ready: fontsReady } = useAppFonts();
  const { hydrated } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (fontsReady && hydrated) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady, hydrated]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void syncPendingObservations().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, []);

  /**
   * Tapping an arrival banner opens what it was announcing.
   *
   * Wired here rather than in the arrival store, because this is the shallowest
   * component with a router. Until now the banner said a place had something to
   * read and then dropped you wherever the app happened to be — which is the
   * same as saying nothing. A site opens its page; a precinct, which names no
   * single monument, opens the map you would use to find one.
   */
  useEffect(
    () =>
      notifications.subscribeToArrivalTaps((target) => {
        if (target.kind === 'site') router.push(`/(main)/tirtha/site/${target.id}`);
        else router.push('/(main)/tirtha/map');
      }),
    [router],
  );

  // Rendering nothing here keeps the splash in place rather than showing a
  // half-styled frame; the effect above lifts it once both are settled.
  if (!fontsReady || !hydrated) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(main)" />
      </Stack>
    </>
  );
}

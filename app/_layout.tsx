import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

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

  useEffect(() => {
    if (fontsReady && hydrated) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady, hydrated]);

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

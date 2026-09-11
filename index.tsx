// Expo requires its web runtime before any other entry-side imports.
import '@expo/metro-runtime';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRootComponent } from 'expo';
import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, Appearance, StyleSheet, Text, View } from 'react-native';

import { StorageKeys } from '@/constants';
import { colors, setInitialColorTheme } from '@/theme/colors';
import type { ColorTheme } from '@/types';

/**
 * Register immediately, then restore the palette before importing any route.
 *
 * Route modules create static StyleSheets as they load. Keeping their import
 * behind this mounted bootstrap means every route sees the same palette while
 * Expo still gets a root component synchronously.
 */
function ThemeBootstrap() {
  const [RouterApp, setRouterApp] = useState<ComponentType | null>(null);
  const [bootstrapError, setBootstrapError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(StorageKeys.prefColorTheme).catch(() => null);
        const colorTheme: ColorTheme = stored === 'white' ? 'white' : 'navy';

        setInitialColorTheme(colorTheme);
        // React Native exposes this on native, but the web implementation in
        // the installed version does not. The app palette still applies on web.
        Appearance.setColorScheme?.(colorTheme === 'navy' ? 'dark' : 'light');

        const { App } = await import('expo-router/build/qualified-entry');
        if (active) setRouterApp(() => App);
      } catch (error) {
        if (active) setBootstrapError(error);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (bootstrapError) throw bootstrapError;

  if (!RouterApp) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>Loading Saksi</Text>
      </View>
    );
  }

  return (
    <View style={[styles.app, { backgroundColor: colors.background }]}>
      <RouterApp />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontSize: 14,
  },
});

registerRootComponent(ThemeBootstrap);

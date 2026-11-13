import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import { newerRuntime } from '@/utils/version';

/** How often, at most, to ask for a newer version when the app comes back. */
const CHECK_EVERY_MS = 20 * 60 * 1000;

/** Where the website publishes the newest Android build (landing/public/app/android.json). */
const RELEASE_URL = `${(process.env.EXPO_PUBLIC_PORTAL_URL ?? '').trim().replace(/\/$/, '') || 'https://saksi-beta.vercel.app'}/app/android.json`;

type Release = { runtimeVersion: string; version: string; apkUrl: string };

/**
 * Keeps the installed app current without anyone having to restart it twice.
 *
 * Two kinds of update:
 *  - Most changes ship over the air. expo-updates already fetches them in the
 *    background, but only applies them on a later launch, so a phone could run
 *    yesterday's app for days. This checks on launch and whenever the app
 *    returns to the front, downloads what is new, and offers a one-tap restart.
 *  - A change to native code needs a new APK, and comes with a new runtime
 *    version that over-the-air updates cannot reach. The website publishes the
 *    newest build; when its runtime is newer than this one, this offers the
 *    download. Android then asks the person to confirm the install, which no
 *    app may skip.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<{ kind: 'ota' } | { kind: 'apk'; release: Release } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const lastCheck = useRef(0);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    let cancelled = false;
    const check = async () => {
      if (Date.now() - lastCheck.current < CHECK_EVERY_MS) return;
      lastCheck.current = Date.now();
      try {
        const response = await fetch(RELEASE_URL, { headers: { Accept: 'application/json' } });
        const release = response.ok ? ((await response.json()) as Release) : null;
        if (release?.apkUrl && Updates.runtimeVersion && newerRuntime(release.runtimeVersion, Updates.runtimeVersion)) {
          if (!cancelled) setState({ kind: 'apk', release });
          return;
        }
      } catch {
        // Offline, or the website is down: the over-the-air check still runs.
      }
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) return;
        const fetched = await Updates.fetchUpdateAsync();
        if (fetched.isNew && !cancelled) {
          setDismissed(false);
          setState({ kind: 'ota' });
        }
      } catch {
        // No connection or no update server: try again next time.
      }
    };
    void check();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void check();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  if (!state || dismissed) return null;
  const apk = state.kind === 'apk';
  return (
    <View style={[styles.wrap, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
      <View style={styles.bar} accessibilityLiveRegion="polite">
        <Icon name={apk ? 'download' : 'update'} size={20} color={colors.primary} />
        <Text variant="caption" style={styles.copy} numberOfLines={2}>
          {apk ? 'A new version is ready to download' : 'An update is ready'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={apk ? 'Download the new version' : 'Restart to update'}
          onPress={() => {
            if (apk) void Linking.openURL(state.release.apkUrl);
            else void Updates.reloadAsync();
          }}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text variant="bodyStrong" tone="inverse">{apk ? 'Download' : 'Restart'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Later" hitSlop={10} onPress={() => setDismissed(true)} style={styles.close}>
          <Icon name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.content, right: spacing.content, zIndex: 100, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 520,
    width: '100%',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  copy: { flex: 1 },
  action: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.full, backgroundColor: colors.primary },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75 },
});

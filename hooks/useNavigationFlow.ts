import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRouter, useSegments, type Href } from 'expo-router';

import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';

/** Where a screen opened cold, from a deep link or notification, goes back to. */
const DEFAULT_BACK: Href = '/(main)/tirtha';

/**
 * Back that always lands somewhere.
 *
 * A screen opened from a deep link has nothing beneath it, and a plain
 * `router.back()` would then do nothing at all, leaving the visitor stuck.
 */
export function useSafeBack(fallback: Href = DEFAULT_BACK): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}

/** Leaves the Visit flow and returns to the screen it was opened from. */
export function useExitVisit(): () => void {
  const navigation = useNavigation();
  const router = useRouter();
  return useCallback(() => {
    const root = navigation.getParent();
    if (root?.canGoBack()) root.goBack();
    else router.replace('/(main)/tirtha');
  }, [navigation, router]);
}

/**
 * Opens a route in the tabs from anywhere, keeping that tab's home beneath it.
 *
 * Without the anchor, the first visit to a tab builds a stack holding only the
 * target screen, and that tab's home cannot be reached until the app restarts.
 */
export function useOpenInTabs(): (href: Href) => void {
  const router = useRouter();
  const segments = useSegments();
  const exitVisit = useExitVisit();
  const inVisit = segments[0] === 'visit';
  return useCallback(
    (href: Href) => {
      if (inVisit) exitVisit();
      router.push(href, { withAnchor: true });
    },
    [exitVisit, inVisit, router],
  );
}

/**
 * Asks before a back gesture throws away something the visitor made.
 *
 * Covers on-screen back, hardware back and swipe, all of which remove the
 * screen. Saving moves on with `router.replace`, so pass `when: false` first.
 */
export function useConfirmLeave(when: boolean): void {
  const navigation = useNavigation();
  const ui = useVisitorLiteralCopy();

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !when });
    if (!when) return;
    return navigation.addListener('beforeRemove', (event) => {
      event.preventDefault();
      Alert.alert(ui('Discard this?'), ui('What you have not saved will be lost.'), [
        { text: ui('Stay'), style: 'cancel' },
        {
          text: ui('Discard'),
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });
  }, [navigation, when, ui]);
}

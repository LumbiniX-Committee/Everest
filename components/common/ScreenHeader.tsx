import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radii, spacing } from '@/theme';

/**
 * Screen title block. The eyebrow carries the surface name so a screen deep in
 * a stack still says which of the three you are inside.
 *
 * Every stacked screen gets a back control from here rather than adding one
 * per screen. The stacks run with `headerShown: false`, so before this there
 * was no way back on iOS but the edge-swipe gesture — undiscoverable, and
 * absent entirely for anyone using the app one-handed from the far edge.
 */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  rightAction,
  canGoBack = true,
  onBack,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /**
   * Sits beside the title, top-aligned. The three surfaces put their Settings
   * entry here; it is not a general action bar, and a second control belongs on
   * the screen body rather than crowded in next to the first.
   */
  rightAction?: ReactNode;
  /**
   * Offer a back control when there is somewhere to go back to.
   *
   * Defaults to true and is then checked against the navigator, so a surface
   * root — Tīrtha, Sākṣī, Dhamma — shows nothing while a pushed screen does.
   * Passing false suppresses it outright, for a screen that must not be left
   * by going backwards.
   */
  canGoBack?: boolean;
  /** Overrides the default pop, for a screen that must leave somewhere else. */
  onBack?: () => void;
}) {
  const router = useRouter();
  const showBack = canGoBack && (onBack != null || router.canGoBack());

  return (
    <View style={styles.wrap}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (onBack ? onBack() : router.back())}
          // 44dp, and hit-slopped wider: this is the control people reach for
          // most and it sits at the top of the screen, away from the thumb.
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Text variant="body" tone="secondary">
            ‹ Back
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.titleRow}>
        <View style={styles.titleColumn}>
          {eyebrow ? (
            <Text variant="label" tone="muted" uppercase>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="title">{title}</Text>
        </View>
        {rightAction ? <View style={styles.action}>{rightAction}</View> : null}
      </View>
      {subtitle ? (
        <Text variant="body" tone="secondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radii.md,
  },
  backPressed: { opacity: 0.6 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleColumn: { flex: 1, gap: spacing.sm },
  action: { paddingTop: spacing.xs },
});

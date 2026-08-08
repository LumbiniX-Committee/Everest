import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing } from '@/theme';

/**
 * Screen title block. The eyebrow carries the surface name so a screen deep in
 * a stack still says which of the three you are inside.
 */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  rightAction,
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
}) {
  return (
    <View style={styles.wrap}>
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleColumn: { flex: 1, gap: spacing.sm },
  action: { paddingTop: spacing.xs },
});

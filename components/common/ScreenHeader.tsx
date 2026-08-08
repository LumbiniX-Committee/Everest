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
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? (
        <Text variant="label" tone="muted" uppercase>
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="title">{title}</Text>
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
});

import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { QuestCategory } from '@/types';

const CATEGORY_CONFIG: Record<QuestCategory, { label: string; color: string }> = {
  survey: { label: 'Survey', color: colors.sandstoneDeep },
  epigraphy: { label: 'Epigraphy', color: colors.alignmentSeeking },
  ecology: { label: 'Ecology', color: colors.resolved },
  monastic: { label: 'Monastic', color: colors.openCondition },
};

export function QuestCategoryBadge({ category }: { category: QuestCategory }) {
  const config = CATEGORY_CONFIG[category] ?? { label: category, color: colors.sandstone };
  return (
    <View style={[styles.badge, { borderColor: config.color }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text variant="label" uppercase style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
});

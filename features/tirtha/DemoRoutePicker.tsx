import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet, Text } from '@/components/ui';
import { demoPrecincts } from '@/data';
import { location as locationService } from '@/services';
import { colors, radii, spacing } from '@/theme';

export type DemoRoutePickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (walkId: string) => void;
};

/** Selects a complete moving itinerary, not a one-point location spoof. */
export function DemoRoutePicker({ visible, onClose, onSelect }: DemoRoutePickerProps) {
  const walks = locationService.demo.availableWalks();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Choose a demo walk"
      subtitle="Synthetic walking, pauses and arrivals through the real location pipeline"
      scroll
    >
      <View style={styles.list}>
        {walks.map((walk) => {
          const precinct = demoPrecincts.find((item) => item.id === walk.precinctId);
          return (
            <Pressable
              key={walk.id}
              accessibilityRole="button"
              accessibilityLabel={walk.name}
              accessibilityHint="Starts this complete simulated heritage walk"
              onPress={() => onSelect(walk.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.text}>
                <Text variant="heading">{walk.name}</Text>
                <Text variant="caption" tone="muted">
                  {precinct?.summary ?? 'A moving heritage-site simulation'}
                </Text>
              </View>
              <Text variant="caption" tone="sandstone">
                {precinct?.siteIds.length ?? 0} {precinct?.siteIds.length === 1 ? 'site' : 'sites'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.base },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  text: { flex: 1, gap: spacing.xxs },
  pressed: { opacity: 0.7, borderColor: colors.sandstone },
});

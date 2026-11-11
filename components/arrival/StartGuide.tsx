import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Icon, Text, type IconName } from '@/components/ui';
import { StorageKeys } from '@/constants';
import { useOpenInTabs } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { storage } from '@/services';
import { colors, radii, spacing } from '@/theme';

/**
 * Three first things to do, shown on Home until dismissed.
 *
 * This is a set of real actions instead of a tutorial overlay: each one takes the
 * visitor to the feature itself, so they learn by arriving somewhere useful.
 */
export function StartGuide() {
  const router = useRouter();
  const openInTabs = useOpenInTabs();
  const ui = useVisitorLiteralCopy();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    void storage.getBoolean(StorageKeys.homeGuideDismissed).then((dismissed) => {
      if (active) setVisible(!dismissed);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    void storage.setBoolean(StorageKeys.homeGuideDismissed, true);
  };

  const steps: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'map-outline', label: 'Open the map and find a place', onPress: () => router.push('/(main)/tirtha/map') },
    { icon: 'compass-outline', label: 'Try a quest near you', onPress: () => router.push('/(main)/tirtha/quests') },
    { icon: 'flower-outline', label: 'Ask a question about what you see', onPress: () => openInTabs('/(main)/dhamma') },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text variant="heading">Start here</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={ui('Hide this guide')} hitSlop={12} onPress={dismiss}>
          <Icon name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      {steps.map((step) => (
        <Pressable
          key={step.label}
          accessibilityRole="button"
          onPress={step.onPress}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Icon name={step.icon} size={22} color={colors.primary} />
          <Text variant="body" style={styles.label}>
            {step.label}
          </Text>
          <Icon name="chevron-right" size={22} color={colors.textMuted} />
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48, borderRadius: radii.md },
  pressed: { opacity: 0.65 },
  label: { flex: 1 },
});

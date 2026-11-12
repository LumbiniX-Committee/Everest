import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/common';
import { ScanCards } from '@/components/models';
import { Icon, Screen, Text } from '@/components/ui';
import { MODELS, SCANS } from '@/data';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { colors, radii, spacing } from '@/theme';

/**
 * Every 3D thing in the app, in one place: real scans of the places, made by
 * photographers and drone surveyors, and our own schematic models, which can
 * be placed in the room through the camera on Android.
 */
export function NepalIn3DScreen() {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  return (
    <Screen scroll>
      <ScreenHeader eyebrow="Explore" title="Nepal in 3D" subtitle="Real scans of the places, and models you can turn, study and stand in your room." />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Icon name="rotate-3d-variant" size={20} color={colors.primary} />
          <Text variant="caption" tone="secondary" style={styles.flex}>
            Scans are real captures, shown in Sketchfab’s player with VR where your phone supports it.
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Icon name="cube-scan" size={20} color={colors.primary} />
          <Text variant="caption" tone="secondary" style={styles.flex}>
            {Platform.OS === 'android'
              ? ui('Our models are schematic: drawn from photographs and published sizes. Each can be placed in your room with “View in your space”.')
              : ui('Our models are schematic: drawn from photographs and published sizes. On iPhone, place them in your room from the website’s 3D page.')}
          </Text>
        </View>
      </View>

      <ScanCards scans={SCANS} title="Real scans" />

      <View style={styles.section}>
        <Text variant="title">Our models</Text>
        <View style={styles.grid}>
          {MODELS.map((model) => (
            <Pressable
              key={model.id}
              accessibilityRole="button"
              onPress={() => router.push(`/(main)/tirtha/model/${model.id}`)}
              style={({ pressed }) => [styles.model, pressed && styles.pressed]}
            >
              <View style={styles.modelIcon}>
                <Icon name="cube-outline" size={22} color={colors.onPrimary} />
              </View>
              <Text variant="bodyStrong" translate={false} numberOfLines={2}>
                {model.title}
              </Text>
              <Text variant="caption" tone="secondary">
                {`${model.hotspots.length} ${ui('features to find')}${model.free ? ` · ${ui('Free')}` : ''}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: { gap: spacing.sm, marginBottom: spacing.lg, padding: spacing.base, borderRadius: radii.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  legendItem: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  flex: { flex: 1 },
  section: { gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  model: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modelIcon: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  pressed: { opacity: 0.85 },
});

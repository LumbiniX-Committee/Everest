import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon, Text } from '@/components/ui';
import type { Scan } from '@/data';
import { colors, radii, spacing } from '@/theme';

/**
 * Real scans of a place, as a row of thumbnails. The thumbnail is a small
 * image from Sketchfab; the scan itself loads only on the next screen, when
 * the visitor chooses it.
 */
export function ScanCards({ scans, title = 'Scanned in 3D', bleed = 0 }: { scans: Scan[]; title?: string; bleed?: number }) {
  const router = useRouter();
  if (!scans.length) return null;
  return (
    <View style={styles.wrap}>
      <Text variant="title" style={{ paddingHorizontal: bleed }}>
        {title}
      </Text>
      <Text variant="caption" tone="secondary" style={{ paddingHorizontal: bleed }}>
        Real captures by photographers and drone surveyors, shown in Sketchfab’s player with their credit.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={bleed ? { marginHorizontal: -bleed } : undefined}
        contentContainerStyle={[styles.row, { paddingHorizontal: bleed }]}
      >
        {scans.map((scan) => (
          <Pressable
            key={scan.id}
            accessibilityRole="button"
            accessibilityLabel={`${scan.label}, ${scan.kind}, by ${scan.creator}`}
            onPress={() => router.push({ pathname: '/(main)/tirtha/scan/[scanId]', params: { scanId: scan.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Image source={{ uri: scan.thumbnail }} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
            <View style={styles.badge}>
              <Icon name="rotate-3d-variant" size={14} color={colors.onScrim} />
              <Text variant="caption" tone="onScrim">
                {scan.kind}
              </Text>
            </View>
            <View style={styles.text}>
              <Text variant="bodyStrong" translate={false} numberOfLines={2}>
                {scan.label}
              </Text>
              <Text variant="caption" tone="secondary" translate={false} numberOfLines={1}>
                {scan.creator}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { gap: spacing.md, paddingVertical: spacing.sm },
  card: { width: 220, overflow: 'hidden', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  thumb: { width: '100%', height: 130, backgroundColor: colors.surfaceSecondary },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.scrim,
  },
  text: { padding: spacing.md, gap: spacing.xxs },
  pressed: { opacity: 0.85 },
});

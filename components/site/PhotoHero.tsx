import { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

/**
 * A remote photograph with its credit laid over it. On any load failure
 * (offline, a moved file) it renders nothing, so no credit is ever shown
 * under a missing picture.
 */
export function PhotoHero({
  uri,
  credit,
  height = 220,
  radius = radii.xl,
  style,
  children,
}: {
  uri: string;
  credit: string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <View style={[styles.frame, { height, borderRadius: radius }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors onError={() => setFailed(true)} />
      {children}
      <View style={styles.credit}>
        <Text variant="caption" tone="onScrim" style={styles.creditText} translate={false} numberOfLines={2}>
          {credit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.surfaceSecondary },
  credit: {
    position: 'absolute',
    right: spacing.xs,
    bottom: spacing.xs,
    maxWidth: '82%',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.overlay,
  },
  creditText: { fontSize: 10 },
});

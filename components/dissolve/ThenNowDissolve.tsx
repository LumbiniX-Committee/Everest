import React, { useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import GestureHandler, { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type ThenNowDissolveProps = {
  /** Reference/historical image (e.g., Mukherji 1899 plate or reconstruction) */
  historicalImageUri: string | ImageSourcePropType;
  /** Label for historical source (e.g., "Photograph, 1899, P.C. Mukherji / ASI") */
  historicalLabel?: string;
  /** Current/live image or overlay view */
  currentOverlay?: React.ReactNode;
  /** Initial opacity for dissolve (0 = 100% current/live, 1 = 100% historical) */
  initialOpacity?: number;
  /** On opacity change callback */
  onOpacityChange?: (opacity: number) => void;
};

/**
 * Then/Now Dissolve Component (Phase 1 guaranteed demo).
 *
 * Provides a smooth opacity slider dissolving between the present (live camera or current view)
 * and the past (P.C. Mukherji 1899 photograph or historical reconstruction plate).
 */
export function ThenNowDissolve({
  historicalImageUri,
  historicalLabel = 'Photograph, 1899, P.C. Mukherji / ASI',
  currentOverlay,
  initialOpacity = 0.35,
  onOpacityChange,
}: ThenNowDissolveProps) {
  const [opacity, setOpacity] = useState(initialOpacity);

  const handleSliderMove = (event: PanGestureHandlerGestureEvent) => {
    const { x } = event.nativeEvent;
    // Assuming slider container width ~ 300px
    const newOpacity = Math.max(0, Math.min(1, x / 300));
    setOpacity(newOpacity);
    onOpacityChange?.(newOpacity);
  };

  const imageSource = typeof historicalImageUri === 'string' ? { uri: historicalImageUri } : historicalImageUri;

  return (
    <View style={styles.container}>
      {/* Background: Live Camera or Current Overlay */}
      <View style={StyleSheet.absoluteFill}>{currentOverlay}</View>

      {/* Foreground: Historical Image with Variable Opacity */}
      <Image
        source={imageSource}
        style={[StyleSheet.absoluteFill, { opacity }]}
        resizeMode="cover"
      />

      {/* Dissolve Slider Control Overlay */}
      <View style={styles.controlContainer}>
        <View style={styles.labelRow}>
          <Text variant="caption" tone="secondary">
            PRESENT (NOW)
          </Text>
          <Text variant="caption" tone="primary">
            {Math.round(opacity * 100)}% DISSOLVE
          </Text>
          <Text variant="caption" tone="secondary">
            PAST (1899)
          </Text>
        </View>

        {/* Interactive Slider Track */}
        <PanGestureHandler onGestureEvent={handleSliderMove}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${opacity * 100}%` }]} />
            <View style={[styles.thumb, { left: `${opacity * 90}%` }]} />
          </View>
        </PanGestureHandler>

        {historicalLabel ? (
          <Text variant="caption" tone="muted" center style={styles.metaLabel}>
            {historicalLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controlContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.gutter,
    right: spacing.gutter,
    backgroundColor: 'rgba(14, 21, 18, 0.85)',
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 36,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.sm,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    marginVertical: spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primarySandFaint,
    borderRadius: radii.sm,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 36,
    backgroundColor: colors.primarySand,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  metaLabel: {
    marginTop: spacing.xs,
  },
});

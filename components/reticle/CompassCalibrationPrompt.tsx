import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type CompassCalibrationPromptProps = {
  visible: boolean;
  onDismiss: () => void;
};

/**
 * Compass Calibration Prompt (Phase 2 Task 2.8).
 *
 * Displays a figure-eight calibration motion prompt when magnetometer accuracy
 * reports low due to metal railings or local magnetic drift.
 */
export function CompassCalibrationPrompt({ visible, onDismiss }: CompassCalibrationPromptProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text variant="label" tone="seeking" uppercase>
          COMPASS CALIBRATION NEEDED
        </Text>

        <View style={styles.figureEightSymbol}>
          <Text style={styles.symbolText}>∞</Text>
        </View>

        <Text variant="title" center>
          Wave your phone in a figure-8 motion
        </Text>

        <Text variant="body" tone="secondary" center>
          Magnetic interference detected near structural railings or phone cases. Wave your device gently in a figure-eight pattern to recalibrate the magnetometer.
        </Text>

        <Button label="Done / Calibrated" onPress={onDismiss} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 21, 18, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.gutter,
    zIndex: 99,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.base,
    alignItems: 'center',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
  },
  figureEightSymbol: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolText: {
    fontSize: 48,
    color: colors.sandstone,
  },
});

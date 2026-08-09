import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import { formatDistance } from '@/utils';

export type HeritageSiteBannerProps = {
  siteName: string;
  distanceM?: number | null;
  vantageLabel?: string;
  onCapture: () => void;
  onReconstruct: () => void;
  onCompare: () => void;
};

/**
 * Modern site-centric header banner for Sākṣī.
 *
 * Displays current heritage site context anchor at the top of the surface with
 * direct access to core actions: Capture, Digital Reconstruction, and Timeline Compare.
 */
export function HeritageSiteBanner({
  siteName,
  distanceM,
  vantageLabel,
  onCapture,
  onReconstruct,
  onCompare,
}: HeritageSiteBannerProps) {
  return (
    <View style={styles.card}>
      {/* Top Location Anchor Header */}
      <View style={styles.header}>
        <View style={styles.locationBadge}>
          <Text style={styles.pinIcon}>📍</Text>
          <Text variant="label" tone="sandstone" uppercase style={styles.locationText}>
            CURRENT HERITAGE LOCATION
          </Text>
        </View>
        {distanceM != null ? (
          <Chip label={formatDistance(distanceM)} selected />
        ) : null}
      </View>

      {/* Heritage Title & Viewpoint */}
      <View style={styles.titleBlock}>
        <Text variant="title" style={styles.siteTitle}>
          {siteName}
        </Text>
        {vantageLabel ? (
          <Text variant="caption" tone="secondary">
            Viewpoint: {vantageLabel}
          </Text>
        ) : null}
      </View>

      {/* Feature Quick Action Bar */}
      <View style={styles.actionsBar}>
        <Button
          label="📸 Witness & Capture"
          onPress={onCapture}
          style={styles.primaryBtn}
        />

        <View style={styles.secondaryRow}>
          <Pressable style={styles.featurePill} onPress={onReconstruct}>
            <Text style={styles.featureIcon}>🏛️</Text>
            <Text variant="label" style={styles.featureText}>
              Reconstruction
            </Text>
          </Pressable>

          <Pressable style={styles.featurePill} onPress={onCompare}>
            <Text style={styles.featureIcon}>⏳</Text>
            <Text variant="label" style={styles.featureText}>
              Time Compare
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.lg,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.sandstone,
    gap: spacing.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pinIcon: {
    fontSize: 14,
  },
  locationText: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  titleBlock: {
    gap: spacing.xxs,
  },
  siteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.sandstone,
  },
  actionsBar: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  featurePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 14,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.sandstone,
  },
});

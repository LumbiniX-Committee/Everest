import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { MetaRow, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import { formatDistance, formatTimestamp } from '@/utils';
import type { Observation } from '@/types';

export type TimeSeriesScrubberProps = {
  observations: Observation[];
  vantageLabel?: string;
  onSelectObservation?: (observation: Observation) => void;
};

/**
 * Vantage Time Series Scrubber Component (Phase 3 Task 3.6).
 *
 * Allows scrubbing through all aligned observations for a specific vantage
 * from oldest to newest to visualize structural and environmental change over time.
 */
export function TimeSeriesScrubber({
  observations,
  vantageLabel = 'Vantage Time Series',
  onSelectObservation,
}: TimeSeriesScrubberProps) {
  // Sort oldest to newest
  const sorted = [...observations].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );

  const [selectedIndex, setSelectedIndex] = useState(
    sorted.length > 0 ? sorted.length - 1 : 0,
  );

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="caption" tone="muted" center>
          No observations recorded in this series yet.
        </Text>
      </View>
    );
  }

  const activeObs = sorted[selectedIndex];

  return (
    <View style={styles.container}>
      <Text variant="label" tone="muted" uppercase>
        {vantageLabel} ({sorted.length} observations)
      </Text>

      {/* Main Image Display */}
      {activeObs ? (
        <View style={styles.imageFrame}>
          <Image
            source={{ uri: activeObs.photoUri }}
            style={styles.photo}
            resizeMode="cover"
          />

          <View style={styles.badgeRow}>
            <Text variant="mono" tone="primary" style={styles.badge}>
              {selectedIndex + 1} / {sorted.length}
            </Text>
            <Text variant="mono" tone="secondary" style={styles.badge}>
              {formatTimestamp(activeObs.capturedAt)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Scrubbing Track / Timeline Pills */}
      <View style={styles.scrubberTrack}>
        {sorted.map((obs, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <Pressable
              key={obs.id}
              onPress={() => {
                setSelectedIndex(idx);
                onSelectObservation?.(obs);
              }}
              style={[styles.stepPill, isSelected && styles.stepPillActive]}
            >
              <View style={[styles.dot, isSelected && styles.dotActive]} />
            </Pressable>
          );
        })}
      </View>

      {/* Active Observation Metadata */}
      {activeObs ? (
        <View style={styles.metaBlock}>
          <MetaRow label="Recorded" value={formatTimestamp(activeObs.capturedAt)} />
          <MetaRow
            label="Position error"
            value={activeObs.positionErrorM != null ? formatDistance(activeObs.positionErrorM) : 'by eye'}
          />
          <MetaRow
            label="Bearing error"
            value={activeObs.bearingErrorDeg != null ? `${activeObs.bearingErrorDeg.toFixed(1)}°` : 'by eye'}
          />
          {activeObs.note ? (
            <Text variant="caption" tone="secondary" style={styles.noteText}>
              Note: {activeObs.note}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingVertical: spacing.md },
  emptyContainer: { padding: spacing.lg, alignItems: 'center' },
  imageFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  badgeRow: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: 'rgba(14, 21, 18, 0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  scrubberTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  stepPill: {
    padding: spacing.xs,
    borderRadius: radii.full,
  },
  stepPillActive: {
    backgroundColor: colors.surfaceSecondary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.sandstone,
    width: 14,
    height: 14,
  },
  metaBlock: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  noteText: {
    marginTop: spacing.xs,
  },
});

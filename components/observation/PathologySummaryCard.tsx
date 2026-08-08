import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import type { YoloScanResult } from '@/services/ai/yoloEngine';
import { colors, radii, spacing } from '@/theme';

export type PathologySummaryCardProps = {
  result: YoloScanResult;
  onApplyAiSuggestion?: (result: YoloScanResult) => void;
};

/**
 * Pathology summary card.
 *
 * Shown below the camera viewfinder or on the observation detail screen.
 * Displays defect count, surface health score, inference time, and a
 * colour-coded legend for each detected pathology class.
 */
export function PathologySummaryCard({ result, onApplyAiSuggestion }: PathologySummaryCardProps) {
  const { detections, surfaceHealth, inferenceMs } = result;

  if (detections.length === 0) return null;

  // De-duplicate pathology classes for the legend
  const seen = new Set<string>();
  const legend = detections.filter((d) => {
    if (seen.has(d.pathology)) return false;
    seen.add(d.pathology);
    return true;
  });

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text variant="label" tone="sandstone" uppercase>
          YOLOv8n-seg INT8 Scan
        </Text>
        <Text variant="mono" tone="secondary" style={styles.timing}>
          {inferenceMs}ms · NPU
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text variant="title" style={styles.statNum}>{detections.length}</Text>
          <Text variant="caption" tone="secondary">Defects</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="title" style={[styles.statNum, surfaceHealth < 70 && styles.warn]}>
            {surfaceHealth}%
          </Text>
          <Text variant="caption" tone="secondary">Surface Integrity</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {legend.map((det) => (
          <View key={det.pathology} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: det.color }]} />
            <Text variant="caption">
              {det.label} ({(det.confidence * 100).toFixed(0)}%)
            </Text>
          </View>
        ))}
      </View>

      {onApplyAiSuggestion ? (
        <View style={styles.btnWrap}>
          <Button
            label="✨ Pre-fill Condition Report"
            onPress={() => onApplyAiSuggestion(result)}
            block
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timing: { fontSize: 11 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800' },
  warn: { color: '#EF4444' },
  legend: { gap: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  btnWrap: { paddingTop: spacing.xs },
});

import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { formatVisitorCopy, visitorCopy, type VisitorCopyKey } from '@/i18n/visitor';
import type { YoloScanResult } from '@/services/ai/yoloEngine';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';

export type PathologySummaryCardProps = {
  result: YoloScanResult;
  onApplyAiSuggestion?: (result: YoloScanResult) => void;
};

/**
 * What the model found, stated honestly.
 *
 * Everything the old version invented is gone: no "surface integrity %", no fake
 * "INT8 · NPU" timing, no confidence numbers pulled from a hash. This shows the
 * real model, its real reported accuracy, the actual inference time, and the
 * candidates it produced — framed as candidates the surveyor confirms, not a
 * verdict. Pre-fill hands those candidates to an editable report; it never files
 * one.
 */
export function PathologySummaryCard({ result, onApplyAiSuggestion }: PathologySummaryCardProps) {
  const { detections, inferenceMs, model, status } = result;
  const { preferences } = usePreferences();
  const language = preferences.interfaceLanguage;
  const t = (key: VisitorCopyKey) => visitorCopy(language, key);

  if (status === 'error') {
    return (
      <View style={styles.card}>
        <Text variant="label" tone="sandstone" uppercase>
          {t('pathology.scan')}
        </Text>
        <Text variant="body" tone="secondary">
          {language === 'en' && result.error ? result.error : t('pathology.scanFailed')}
        </Text>
      </View>
    );
  }

  // De-duplicate pathology classes for the legend.
  const seen = new Set<string>();
  const legend = detections.filter((d) => {
    if (seen.has(d.pathology)) return false;
    seen.add(d.pathology);
    return true;
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text variant="label" tone="sandstone" uppercase>
          {model?.name ?? t('pathology.scan')}
        </Text>
        {inferenceMs != null ? (
          <Text variant="mono" tone="secondary" style={styles.timing}>
            {inferenceMs} ms · {t('pathology.onDevice')}
          </Text>
        ) : null}
      </View>

      {detections.length === 0 ? (
        <Text variant="body" tone="secondary">
          {t('pathology.nothingFound')}
        </Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text variant="title" style={styles.statNum}>
                {detections.length}
              </Text>
              <Text variant="caption" tone="secondary">
                {detections.length === 1 ? t('pathology.candidate') : t('pathology.candidates')}
              </Text>
            </View>
          </View>

          <View style={styles.legend}>
            {legend.map((det) => (
              <View key={det.pathology} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: det.color }]} />
                <Text variant="caption">
                  {det.label} ({Math.round(det.confidence * 100)}%)
                </Text>
              </View>
            ))}
          </View>

          <Text variant="caption" tone="muted">
            {t('pathology.disclosure')}{' '}
            {model?.mAP50 != null
              ? formatVisitorCopy(language, 'pathology.accuracy', {
                  score: model.mAP50.toFixed(2),
                })
              : t('pathology.noAccuracy')}
          </Text>

          {onApplyAiSuggestion ? (
            <View style={styles.btnWrap}>
              <Button
                label={t('pathology.fileReport')}
                onPress={() => onApplyAiSuggestion(result)}
                block
              />
            </View>
          ) : null}
        </>
      )}
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
  legend: { gap: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  btnWrap: { paddingTop: spacing.xs },
});

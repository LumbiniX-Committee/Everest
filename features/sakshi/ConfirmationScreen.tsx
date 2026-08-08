import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Screen, Text } from '@/components/ui';
import { EmptyState, LoadingState } from '@/components/common';
import { findSite, findVantage } from '@/data';
import { database } from '@/services';
import { colors, radii, spacing } from '@/theme';
import { formatTimestamp } from '@/utils';
import type { Observation } from '@/types';

export function ConfirmationScreen({ observationId }: { observationId: string }) {
  const router = useRouter();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    database.getObservation(observationId).then((value) => { setObservation(value); setMissing(!value); }).catch(() => setMissing(true));
  }, [observationId]);

  const referenceId = useMemo(() => {
    if (!observation) return '';
    const stamp = observation.capturedAt.replace(/\D/g, '').slice(2, 14);
    return `OBS-${stamp}-${observation.id.slice(-4).toUpperCase()}`;
  }, [observation]);

  if (!observation && !missing) return <Screen><LoadingState label="Saving your observation" /></Screen>;
  if (!observation) return <Screen><EmptyState title="Observation unavailable" body="Your local record could not be opened." actionLabel="Back to witness" onAction={() => router.replace('/(main)/sakshi')} /></Screen>;

  const site = findSite(observation.siteId);
  const vantage = findVantage(observation.vantageId);
  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.check}><Text variant="title" tone="inverse">✓</Text></View>
        <Text variant="title" center>Observation recorded.</Text>
        <Text variant="body" tone="secondary" center>Thank you for helping preserve Lumbini&apos;s heritage.</Text>
      </View>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Image source={{ uri: observation.photoUri }} style={styles.thumb} />
          <View style={styles.copy}>
            <Text variant="heading">{site?.name ?? observation.siteId}</Text>
            <Text variant="caption" tone="secondary">{vantage?.label ?? 'Fixed viewpoint'}</Text>
            <Text variant="mono" tone="muted">{formatTimestamp(observation.capturedAt)}</Text>
          </View>
        </View>
        <View style={styles.rule} />
        <Text variant="label" tone="muted" uppercase>Reference ID</Text>
        <Text variant="mono">{referenceId}</Text>
        <View style={styles.status}><Text variant="caption" tone="seeking">Pending review</Text></View>
      </Card>
      <View style={styles.actions}>
        <Button label="View my observations" block onPress={() => router.replace('/(main)/profile')} />
        <Button label="Back to map" variant="secondary" block onPress={() => router.replace('/(main)/tirtha/map')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.md },
  check: { width: 64, height: 64, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.resolved },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: colors.surfaceSecondary },
  copy: { flex: 1, gap: spacing.xs },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  status: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.sm, backgroundColor: colors.surfaceSecondary },
  actions: { gap: spacing.md, paddingVertical: spacing.lg },
});

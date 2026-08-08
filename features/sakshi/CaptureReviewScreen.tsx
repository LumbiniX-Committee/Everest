import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Screen, Text } from '@/components/ui';
import { EmptyState, LoadingState } from '@/components/common';
import { findSite, findVantage } from '@/data';
import { database } from '@/services';
import { colors, radii, spacing } from '@/theme';
import { formatTimestamp } from '@/utils';
import type { Observation } from '@/types';

/** Review is deliberately separate from reporting: first confirm the frame, then describe it. */
export function CaptureReviewScreen({ observationId }: { observationId: string }) {
  const router = useRouter();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    database.getObservation(observationId).then((value) => {
      setObservation(value);
      setMissing(!value);
    }).catch(() => setMissing(true));
  }, [observationId]);

  if (!observation && !missing) return <Screen><LoadingState label="Preparing your capture" /></Screen>;
  if (!observation) {
    return <Screen><EmptyState title="Capture unavailable" body="The photograph could not be opened from this device." actionLabel="Back" onAction={() => router.back()} /></Screen>;
  }

  const site = findSite(observation.siteId);
  const vantage = findVantage(observation.vantageId);

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>Capture review</Text>
        <Text variant="title">Does this frame look right?</Text>
        <Text variant="body" tone="secondary">Review it before adding what you noticed.</Text>
      </View>
      <Image source={{ uri: observation.photoUri }} style={styles.photo} resizeMode="cover" accessibilityLabel="Captured observation preview" />
      <Card style={styles.summary}>
        <Text variant="heading">{site?.name ?? observation.siteId}</Text>
        <Text variant="caption" tone="secondary">{vantage?.label ?? 'Fixed viewpoint'}</Text>
        <Text variant="mono" tone="muted">{formatTimestamp(observation.capturedAt)}</Text>
      </Card>
      <View style={styles.actions}>
        <Button label="Use this photo" block onPress={() => router.replace({ pathname: '/(main)/sakshi/observation', params: { observationId: observation.id } })} />
        <Button label="Retake" variant="secondary" block onPress={() => router.replace({ pathname: '/(main)/sakshi/capture', params: { vantageId: observation.vantageId } })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radii.lg, backgroundColor: colors.surfaceSecondary },
  summary: { marginTop: spacing.lg, gap: spacing.xs },
  actions: { gap: spacing.md, paddingVertical: spacing.lg },
});

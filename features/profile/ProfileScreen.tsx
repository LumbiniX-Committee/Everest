import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { EmptyState, ErrorState, LoadingState, ScreenHeader, SettingsButton } from '@/components/common';
import { demoVantages, findSite, findVantage } from '@/data';
import { database } from '@/services';
import { colors, spacing } from '@/theme';
import { formatTimestamp } from '@/utils';
import type { Observation, ObservationAssessment } from '@/types';

type Filter = 'all' | ObservationAssessment;

const filters: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unreviewed', label: 'Submitted' },
  { key: 'no-change', label: 'Acknowledged' },
  { key: 'reported', label: 'Resolved' },
];

/** A quiet record of the evidence the observer has contributed. */
export function ProfileScreen() {
  const router = useRouter();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setObservations(await database.listObservations());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const visible = filter === 'all' ? observations : observations.filter((item) => item.assessment === filter);

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Your record"
        title="My observations"
        subtitle="Photographs and notes you have contributed to Lumbini's living record."
        rightAction={<SettingsButton />}
      />

      <View style={styles.summary}>
        <Text variant="monoLarge">{observations.length}</Text>
        <Text variant="caption" tone="secondary">observations recorded on this device</Text>
      </View>

      <View style={styles.filters} accessibilityRole="tablist">
        {filters.map((item) => (
          <Text
            key={item.key}
            variant="label"
            uppercase
            tone={filter === item.key ? 'sandstone' : 'muted'}
            onPress={() => setFilter(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === item.key }}
            style={[styles.filter, filter === item.key && styles.filterActive]}
          >
            {item.label}
          </Text>
        ))}
      </View>

      {loading ? <LoadingState label="Reading your observations" /> : null}
      {!loading && failed ? (
        <ErrorState title="Your record is safe" body="We could not read the local record. Try again." onRetry={refresh} />
      ) : null}
      {!loading && !failed && visible.length === 0 ? (
        <EmptyState
          title={observations.length === 0 ? 'No observations yet' : 'Nothing in this filter'}
          body={observations.length === 0 ? 'Your first witness photograph will appear here.' : 'Try another status to see more of your record.'}
          actionLabel={observations.length === 0 ? 'Open witness' : undefined}
          onAction={observations.length === 0 ? () => router.navigate('/(main)/sakshi') : undefined}
        />
      ) : null}
      <View style={styles.list}>
        {!loading && !failed ? visible.map((observation) => (
          <ObservationCard key={observation.id} observation={observation} onPress={() => router.push({ pathname: '/(main)/sakshi/observation', params: { observationId: observation.id } })} />
        )) : null}
      </View>
    </Screen>
  );
}

function ObservationCard({ observation, onPress }: { observation: Observation; onPress: () => void }) {
  const site = findSite(observation.siteId);
  const vantage = findVantage(observation.vantageId) ?? demoVantages.find((item) => item.id === observation.vantageId);
  return (
    <Card onPress={onPress} accessibilityLabel={`Observation at ${site?.name ?? 'heritage site'}`}>
      <View style={styles.cardTop}>
        {observation.photoUri ? (
          <Image source={{ uri: observation.photoUri }} style={styles.thumbnail} accessibilityLabel="Captured observation" />
        ) : null}
        <View style={styles.cardCopy}>
          <Text variant="heading">{site?.name ?? observation.siteId}</Text>
          <Text variant="caption" tone="secondary">{vantage?.label ?? 'Fixed viewpoint'}</Text>
          <Text variant="mono" tone="muted">{formatTimestamp(observation.capturedAt)}</Text>
        </View>
        <Text variant="label" uppercase tone={assessmentTone[observation.assessment]}>{assessmentLabel[observation.assessment]}</Text>
      </View>
    </Card>
  );
}

const assessmentLabel: Record<ObservationAssessment, string> = { unreviewed: 'Submitted', 'no-change': 'Acknowledged', reported: 'Resolved' };
const assessmentTone: Record<ObservationAssessment, 'seeking' | 'resolved' | 'open'> = { unreviewed: 'seeking', 'no-change': 'resolved', reported: 'open' };

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md, paddingBottom: spacing.lg },
  filters: { flexDirection: 'row', gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, marginBottom: spacing.lg },
  filter: { paddingBottom: spacing.md },
  filterActive: { borderBottomWidth: 2, borderBottomColor: colors.sandstoneDeep },
  list: { gap: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  thumbnail: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.surfaceSecondary },
  cardCopy: { flex: 1, gap: spacing.xs },
});

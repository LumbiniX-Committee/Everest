import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, ProgressIndicator, Screen, Text } from '@/components/ui';
import { LoadingState, ScreenHeader } from '@/components/common';
import { demoSites } from '@/data';
import { database } from '@/services';
import { colors, spacing } from '@/theme';
import { formatTimestamp } from '@/utils';

import {
  buildRegister,
  summariseRegister,
  REGISTER_LABELS,
  type RegisterEntry,
  type RegisterState,
} from './register';

/**
 * Chaityāvalī — the personal heritage register.
 *
 * A field notebook, not an achievement dashboard. Every site in the catalogue
 * is listed, including the ones never visited, because a register's value is
 * that it is complete: the blanks are as informative as the entries.
 *
 * There is no percentage, no completion prompt and nothing that treats the
 * unvisited rows as a to-do list. Somebody who witnesses two sites carefully
 * over a week has used this app better than somebody who ticks off nine.
 */
export function ChaityavaliScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<RegisterEntry[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([database.listObservations(), database.listSiteVisits()])
        .then(([observations, visits]) => {
          if (active) setEntries(buildRegister(demoSites, observations, visits));
        })
        .catch(() => {
          // Leave whatever is on screen. A register that blanks itself on a
          // transient read failure looks like lost work.
          if (active && entries == null) setEntries([]);
        });
      return () => {
        active = false;
      };
      // `entries` is read only inside the failure path as a first-load guard;
      // depending on it would re-run this on every successful load.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (entries == null) {
    return (
      <Screen>
        <LoadingState label="Reading your register" />
      </Screen>
    );
  }

  const summary = summariseRegister(entries);

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Chaityāvalī"
        title="Your register"
        subtitle="Every site in the catalogue, and what you have recorded at each."
      />

      <View style={styles.summary}>
        <ProgressIndicator
          value={summary.recorded}
          total={summary.total}
          label="Sites recorded"
          color={colors.sandstoneDeep}
        />
      </View>

      <View style={styles.list}>
        {entries.map((entry) => (
          <Card
            key={entry.site.id}
            onPress={() =>
              router.push({
                pathname: '/(main)/sakshi/register/[siteId]',
                params: { siteId: entry.site.id },
              })
            }
            accessibilityLabel={`${entry.site.name}. ${REGISTER_LABELS[entry.state]}.`}
          >
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text variant="heading">{entry.site.name}</Text>
                {entry.lastRecordedAt ? (
                  <Text variant="mono" tone="secondary">
                    {formatTimestamp(entry.lastRecordedAt)}
                  </Text>
                ) : (
                  <Text variant="caption" tone="muted">
                    {entry.site.summary}
                  </Text>
                )}
              </View>
              <StateMark state={entry.state} count={entry.observations.length} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

/**
 * The register mark.
 *
 * Colour is carried by a small square and the label, in the annotation register
 * the rest of the app uses for status. Unvisited is deliberately the quietest
 * thing on the row — an absence, not a prompt.
 */
function StateMark({ state, count }: { state: RegisterState; count: number }) {
  return (
    <View style={styles.mark}>
      <View style={styles.markRow}>
        <View style={[styles.swatch, { backgroundColor: stateColor[state] }]} />
        <Text variant="label" uppercase style={{ color: stateColor[state] }}>
          {REGISTER_LABELS[state]}
        </Text>
      </View>
      {count > 0 ? (
        <Text variant="mono" tone="muted">
          {count} {count === 1 ? 'frame' : 'frames'}
        </Text>
      ) : null}
    </View>
  );
}

const stateColor: Record<RegisterState, string> = {
  unvisited: colors.textMuted,
  visited: colors.sandstone,
  witnessed: colors.alignmentLocked,
  resurveyed: colors.resolved,
};

const styles = StyleSheet.create({
  summary: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingTop: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowText: { flexShrink: 1, gap: spacing.xxs },
  mark: { alignItems: 'flex-end', gap: spacing.xxs },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 8, height: 8, borderRadius: 2 },
});

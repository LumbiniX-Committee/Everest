import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Citation, SourceDetailSheet } from '@/components/source';
import { Card, Divider, Text } from '@/components/ui';
import { dhammaForSite, findSource } from '@/data';
import { arrival } from '@/services';
import { colors, spacing } from '@/theme';
import type { Coordinate, Source } from '@/types';

export type ArrivalWisdomProps = {
  /** The current fix, or null while it is being acquired. */
  coordinate: Coordinate | null;
};

/**
 * The passage tied to the ground you are standing on.
 *
 * Renders nothing at all in three cases: no fix yet, not close enough to any
 * one monument to name it honestly, or nothing in the corpus about it. That
 * last one is the important one — the alternative is handing someone a passage
 * about the Buddha's last words because they walked past a pond, and this
 * surface refuses a weak match for the same reason the Dhamma search does
 * (§25).
 */
export function ArrivalWisdom({ coordinate }: ArrivalWisdomProps) {
  const [openSource, setOpenSource] = useState<Source | null>(null);

  const proximity = arrival.nearestSite(coordinate);
  if (!proximity || !proximity.withinReach) return null;

  const entries = dhammaForSite(proximity.site.id);
  if (entries.length === 0) return null;

  const entry = entries[0];

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="label" tone="sandstone" uppercase>
            You are here · {Math.round(proximity.distanceM)} m
          </Text>
          <Text variant="heading">{proximity.site.name}</Text>
        </View>

        {entry.original ? (
          <Text variant="body" tone="sandstone" style={styles.original}>
            {entry.original}
          </Text>
        ) : null}

        <Text variant="body">{entry.answer}</Text>

        <Divider />

        <View style={styles.sources}>
          <Text variant="label" tone="muted" uppercase>
            {entry.citations.length === 1 ? 'Source' : 'Sources'}
          </Text>
          {entry.citations.map((citation, index) => {
            const source = findSource(citation.sourceId);
            if (!source) return null;
            return (
              <Citation
                key={citation.sourceId}
                source={source}
                citation={citation}
                index={index + 1}
                onPress={() => setOpenSource(source)}
              />
            );
          })}
        </View>

        {entries.length > 1 ? (
          <Text variant="caption" tone="muted">
            {entries.length - 1} more passage{entries.length > 2 ? 's' : ''} concerns this place.
          </Text>
        ) : null}
      </Card>

      <SourceDetailSheet source={openSource} onClose={() => setOpenSource(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, borderColor: colors.sandstone },
  header: { gap: spacing.xxs },
  original: { fontStyle: 'italic' },
  sources: { gap: spacing.sm },
});

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Citation, SourceDetailSheet } from '@/components/source';
import { Card, Divider, Text } from '@/components/ui';
import { findSource } from '@/data';
import { useSiteArrival } from '@/hooks';
import { arrival } from '@/services';
import { colors, spacing } from '@/theme';
import type { Coordinate, Source } from '@/types';

export type ArrivalWisdomProps = {
  /** The current fix, or null while it is being acquired. */
  coordinate: Coordinate | null;
  /** Raise a notification on arrival. Off where a screen is already showing it. */
  notify?: boolean;
};

/**
 * What the ground you are standing on holds.
 *
 * Leads with the place itself, not with scripture. Every one of the twelve
 * sites carries a written second-person account in the seed — "You are standing
 * at the birthplace of the Buddha" — plus its own facts, while exactly one site
 * has a Dhamma passage tied to it. Surfacing only Dhamma meant eleven sites had
 * nothing to say, and the feature looked broken when it was merely looking in
 * the wrong place.
 *
 * Renders nothing when there is no fix, when you are not close enough to name a
 * monument honestly, or when the seed knows nothing about it. That last case is
 * deliberate: handing someone an unrelated passage because they walked past a
 * pond is the failure §25 refuses.
 */
export function ArrivalWisdom({ coordinate, notify = true }: ArrivalWisdomProps) {
  const [openSource, setOpenSource] = useState<Source | null>(null);
  const { atSiteId, nearest } = useSiteArrival(coordinate, { notify });

  if (!atSiteId || !nearest) return null;

  const significance = arrival.significanceOf(atSiteId);
  if (!significance) return null;

  const { site, narration, facts, dhamma } = significance;
  const entry = dhamma[0];

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="label" tone="sandstone" uppercase>
            You are here · {Math.round(nearest.distanceM)} m
          </Text>
          <Text variant="heading">{site.name}</Text>
          {site.namePali || site.nameNepali ? (
            <Text variant="caption" tone="muted">
              {site.namePali ?? site.nameNepali}
            </Text>
          ) : null}
        </View>

        {narration ? <Text variant="body">{narration}</Text> : null}

        {facts.length > 0 ? (
          <View style={styles.facts}>
            {facts.slice(0, 4).map((fact) => (
              <View key={fact.label} style={styles.fact}>
                <Text variant="caption" tone="muted" uppercase>
                  {fact.label}
                </Text>
                <Text variant="body">{fact.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {entry ? (
          <>
            <Divider />
            <View style={styles.dhamma}>
              <Text variant="label" tone="muted" uppercase>
                From the canon
              </Text>
              {entry.original ? (
                <Text variant="body" tone="sandstone" style={styles.original}>
                  {entry.original}
                </Text>
              ) : null}
              <Text variant="body">{entry.answer}</Text>
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
          </>
        ) : null}
      </Card>

      <SourceDetailSheet source={openSource} onClose={() => setOpenSource(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, borderColor: colors.sandstone },
  header: { gap: spacing.xxs },
  facts: { gap: spacing.sm },
  fact: { gap: spacing.xxs },
  dhamma: { gap: spacing.sm },
  original: { fontStyle: 'italic' },
});

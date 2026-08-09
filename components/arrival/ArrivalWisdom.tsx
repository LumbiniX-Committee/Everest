import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MeritRewardModal } from '@/components/practice/MeritAcknowledgement';
import { Citation, SourceDetailSheet } from '@/components/source';
import { Button, Card, Divider, Text } from '@/components/ui';
import { findSource } from '@/data';
import { useSiteArrival } from '@/hooks';
import { arrival } from '@/services';
import { usePractice } from '@/store/practice';
import { colors, spacing } from '@/theme';
import { MERIT_LABELS, MERIT_WEIGHTS, type Coordinate, type MeritEvent, type Source } from '@/types';

export type ArrivalWisdomProps = {
  /** The current fix, or null while it is being acquired. */
  coordinate: Coordinate | null;
  /** Raise a notification on arrival. Off where a screen is already showing it. */
  notify?: boolean;
  /** Optional site ID to display wisdom for directly. */
  siteId?: string;
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
export function ArrivalWisdom({ coordinate, notify = true, siteId }: ArrivalWisdomProps) {
  const [openSource, setOpenSource] = useState<Source | null>(null);
  const [rewardEvent, setRewardEvent] = useState<MeritEvent | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const { recognise, events } = usePractice();
  const { atSiteId, nearest } = useSiteArrival(coordinate, { notify });

  const effectiveSiteId = siteId ?? atSiteId ?? nearest?.site.id;

  if (!effectiveSiteId) return null;

  const significance = arrival.significanceOf(effectiveSiteId);
  if (!significance) return null;

  const { site, narration, facts, dhamma } = significance;
  const entry = dhamma[0];

  // Read from the ledger rather than from local state. A component-local
  // `claimed` map forgot every claim the moment the sheet closed, so the same
  // site could be claimed again on the next open — and the ledger is already
  // the durable record of what was recognised.
  const isClaimed = events.some((e) => e.siteId === effectiveSiteId && e.kind === 'wisdom');

  const isAtSite = atSiteId === effectiveSiteId;
  const distanceM = nearest && nearest.site.id === effectiveSiteId ? nearest.distanceM : null;

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="label" tone="sandstone" uppercase>
            {isAtSite
              ? `You are here${distanceM !== null ? ` · ${Math.round(distanceM)} m` : ''}`
              : distanceM !== null
                ? `Nearby site · ${Math.round(distanceM)} m`
                : 'Heritage Site Wisdom'}
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

        <Divider />

        <View style={styles.claimSection}>
          <Button
            label={
              isClaimed
                ? `Received · ${MERIT_LABELS.wisdom}`
                : `Receive this place · +${MERIT_WEIGHTS.wisdom} puṇya`
            }
            variant="primary"
            disabled={isClaimed}
            onPress={async () => {
              // Null means the day's cap was already reached, or this site was
              // already recognised. The modal says which — it never invents an
              // award the ledger did not make.
              setRewardEvent(await recognise({ kind: 'wisdom', siteId: effectiveSiteId }));
              setShowRewardModal(true);
            }}
          />
        </View>
      </Card>

      <SourceDetailSheet source={openSource} onClose={() => setOpenSource(null)} />

      <MeritRewardModal
        visible={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        event={rewardEvent}
      />
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
  claimSection: { paddingTop: spacing.xs },
});

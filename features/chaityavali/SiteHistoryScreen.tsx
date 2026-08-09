import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Divider, Screen, Text } from '@/components/ui';
import { EmptyState, LoadingState } from '@/components/common';
import { Timeline, type TimelineEntry } from '@/components/timeline';
import { demoSites, findSite, findSource, historicalImagesForSite, vantagesForSite } from '@/data';
import { database } from '@/services';
import { colors, spacing } from '@/theme';
import { formatTimestamp } from '@/utils';
import {
  CONDITION_CATEGORY_LABELS,
  SEVERITY_LABELS,
  type ConditionReport,
  type Observation,
} from '@/types';

import { buildRegister, REGISTER_LABELS, REGISTER_MEANINGS, type RegisterEntry } from './register';

/**
 * One site's history: the documented record and your own, on one rail.
 *
 * The two are interleaved rather than kept in separate lists, and that is the
 * argument the screen exists to make. An 1896 survey photograph and a frame you
 * recorded last Tuesday are the same kind of thing — dated evidence of how this
 * place looked — and putting them in one sequence is what turns a personal log
 * into a contribution to a record.
 *
 * Your own entries are drawn filled and the documented ones hollow, so the
 * distinction stays visible without being separated.
 */
export function SiteHistoryScreen({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [entry, setEntry] = useState<RegisterEntry | null>(null);
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        database.listObservations(),
        database.listSiteVisits(),
        database.listConditionReports(),
      ])
        .then(([observations, visits, allReports]) => {
          if (!active) return;
          const register = buildRegister(demoSites, observations, visits);
          setEntry(register.find((candidate) => candidate.site.id === siteId) ?? null);
          setReports(allReports.filter((report) => report.siteId === siteId));
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [siteId]),
  );

  const site = findSite(siteId);

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Reading the record" />
      </Screen>
    );
  }

  if (!site || !entry) {
    return (
      <Screen>
        <EmptyState
          title="No such site"
          body="This site is not in the catalogue."
          actionLabel="Back to the register"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const reportsByObservation = new Map(reports.map((report) => [report.observationId, report]));
  const entries = timelineFor(site.id, entry.observations, reportsByObservation);

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          Chaityāvalī
        </Text>
        <Text variant="title">{site.name}</Text>
        <Text variant="body" tone="secondary">
          {REGISTER_LABELS[entry.state]} · {REGISTER_MEANINGS[entry.state]}
        </Text>
      </View>

      <Divider />

      <View style={styles.block}>
        <Text variant="heading">Record</Text>
        {entries.length === 0 ? (
          <EmptyState
            title="Nothing dated yet"
            body="No historical image has been matched to this site, and you have not recorded a frame here."
          />
        ) : (
          <Timeline entries={entries} />
        )}
      </View>

      {entry.seriesByVantage.size > 0 ? (
        <>
          <Divider />
          <View style={styles.block}>
            <Text variant="heading">Your series</Text>
            <Text variant="body" tone="secondary">
              A series is one viewpoint over time. Two frames from the same vantage can be compared;
              two from different vantages cannot.
            </Text>
            {[...entry.seriesByVantage.entries()].map(([vantageId, observations]) => {
              const vantage = vantagesForSite(site.id).find((v) => v.id === vantageId);
              return (
                <View key={vantageId} style={styles.series}>
                  <Text variant="body">{vantage?.label ?? vantageId}</Text>
                  <Text variant="mono" tone="muted">
                    {observations.length} {observations.length === 1 ? 'frame' : 'frames'}
                    {observations.length === 1 ? ' · a series of one' : ''}
                  </Text>
                  {observations.length === 1 ? (
                    <Text variant="caption" tone="secondary">
                      Return to this viewpoint to make the first comparison possible.
                    </Text>
                  ) : null}
                  <Button
                    label={observations.length > 1 ? 'Open series' : 'Open frame'}
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/(main)/sakshi/observation',
                        params: { observationId: observations[0].id },
                      })
                    }
                  />
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      <Divider />

      <View style={styles.block}>
        <Button
          label="Open site in Tīrtha"
          variant="quiet"
          onPress={() =>
            router.push({
              pathname: '/(main)/tirtha/site/[siteId]',
              params: { siteId: site.id },
            })
          }
        />
      </View>
    </Screen>
  );
}

/**
 * Merges the documented record with the observer's own frames into one dated
 * sequence.
 *
 * Historical images sort by their ISO date where one is known. Where it is not
 * — "c. 1899" resolves to no instant — the entry keeps its place in catalogue
 * order rather than being guessed into the sequence. Inventing a sort key for
 * an approximate date would put a claim in the timeline that the source does
 * not support.
 */
type Sortable = TimelineEntry & { sortKey: number };

function timelineFor(
  siteId: string,
  observations: Observation[],
  reports: Map<string, ConditionReport>,
): TimelineEntry[] {
  const historical: Sortable[] = historicalImagesForSite(siteId).map((image) => {
    const source = findSource(image.sourceId);
    return {
      id: image.id,
      date: image.date,
      title: image.caption,
      attribution: source ? `${source.title} · ${source.attribution}` : undefined,
      detail: image.viewpointConfirmed ? undefined : 'Approximate viewpoint.',
      own: false,
      sortKey: image.capturedAt ? Date.parse(image.capturedAt) : Number.NaN,
    };
  });

  const mine: Sortable[] = observations.map((observation) => {
    const report = reports.get(observation.id);
    return {
      id: observation.id,
      date: formatTimestamp(observation.capturedAt),
      title:
        observation.assessment === 'reported' && report
          ? `${CONDITION_CATEGORY_LABELS[report.category]}: ${report.subtype}`
          : observation.assessment === 'no-change'
            ? 'Nothing had changed'
            : 'Recorded, not yet reviewed',
      detail:
        report && observation.assessment === 'reported'
          ? `${SEVERITY_LABELS[report.severity]}${report.note ? ` · “${report.note}”` : ''}`
          : undefined,
      attribution: 'Your observation',
      own: true,
      sortKey: Date.parse(observation.capturedAt),
    };
  });

  const dated = [...historical, ...mine].filter((e) => !Number.isNaN(e.sortKey));
  const undated = [...historical, ...mine].filter((e) => Number.isNaN(e.sortKey));

  dated.sort((a, b) => a.sortKey - b.sortKey);
  // Undated entries lead: everything approximate in this dataset is older than
  // anything the observer has recorded.
  return [...undated, ...dated].map(({ sortKey: _sortKey, ...entry }) => entry);
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xs },
  block: { paddingVertical: spacing.lg, gap: spacing.md },
  series: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { demoPrecincts, findSite } from '@/data';
import { arrival } from '@/services';
import type { DemoStep } from '@/services/location/demoWalk';
import { usePractice, usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import type { Coordinate } from '@/types';
import { distanceMeters, formatDistance } from '@/utils';

/**
 * What the walk is doing, and what the app is doing about it.
 *
 * The demo's whole claim is that the parts are connected: a position produces a
 * precinct, a precinct produces an arrival, an arrival unlocks what a place has
 * to say, and reading it is what merit is recognised for. A moving dot does not
 * demonstrate that. This panel does, by reading each stage from the same state
 * the screens read — `atSiteId` from the arrival hook, `hasSomethingToSay` from
 * the arrival service, the merit events from the practice store.
 *
 * Nothing here is scripted alongside the walk. If a stage does not light up, it
 * is because that stage did not happen, and that is the report we want.
 */

export type DemoWalkPanelProps = {
  step: DemoStep | null;
  coordinate: Coordinate | null;
  /** The site within reach, from `useSiteArrival` — the same value the map uses. */
  atSiteId: string | null;
  onRestart: () => void;
  onExit: () => void;
};

type Stage = {
  key: string;
  label: string;
  /** What this stage currently holds, shown under the label when lit. */
  detail: string | null;
  lit: boolean;
};

/** The precinct whose ring contains this point, if any. */
function precinctAt(coordinate: Coordinate | null) {
  if (!coordinate) return null;
  return (
    demoPrecincts.find((p) => distanceMeters(coordinate, p.centre) <= p.radiusMetres) ?? null
  );
}

function activityLine(step: DemoStep | null): string {
  if (!step) return 'Starting at the south gate…';
  const { activity } = step;

  if (activity.kind === 'pausing') {
    return `Standing at ${findSite(activity.atSiteId)?.name ?? activity.atSiteId}`;
  }
  if (activity.kind === 'circling') {
    return `Walking clockwise around ${
      findSite(activity.aroundSiteId)?.name ?? activity.aroundSiteId
    } · ${activity.degrees}°`;
  }
  return `Walking to ${findSite(activity.towardsSiteId)?.name ?? activity.towardsSiteId}`;
}

export function DemoWalkPanel({
  step,
  coordinate,
  atSiteId,
  onRestart,
  onExit,
}: DemoWalkPanelProps) {
  const { preferences } = usePreferences();
  const { events, summary } = usePractice();
  const [log, setLog] = useState<string[]>([]);
  /**
   * Collapsed by default.
   *
   * Expanded it is five log lines, a scrolling chain of five stages, a progress
   * bar and a footnote — on a phone that is a third of the screen, and it was
   * taking that third from the map, which is the thing the demo exists to show.
   * The header alone says what is happening; everything else is available in
   * one tap for whoever wants to watch the pipeline.
   */
  const [expanded, setExpanded] = useState(false);

  const precinct = precinctAt(coordinate);
  const site = atSiteId ? findSite(atSiteId) : null;
  const speaks = atSiteId ? arrival.hasSomethingToSay(atSiteId, preferences.wisdomTier) : false;
  const meritHere = atSiteId ? events.find((e) => e.siteId === atSiteId) : undefined;

  // Transitions, not values. The log is a record of what changed, so holding
  // the previous value in a ref is what makes an entry mean "this just
  // happened" rather than "this is still true", which would fill the panel with
  // the same line once a tick.
  const seen = useRef({ precinctId: '', siteId: '', spoke: '', meritCount: 0, circuit: false });

  useEffect(() => {
    const add = (line: string) =>
      // Newest first, and three deep. This is a margin note on a map, not a
      // console — the older lines cost map, which is the expensive thing here.
      setLog((prev) => [line, ...prev].slice(0, 3));

    const precinctId = precinct?.id ?? '';
    if (precinctId !== seen.current.precinctId) {
      if (precinctId) add(`Entered ${precinct?.name}: geofence armed`);
      else if (seen.current.precinctId) add('Left the precinct: arrival re-arms');
      seen.current.precinctId = precinctId;
    }

    const siteId = atSiteId ?? '';
    if (siteId !== seen.current.siteId) {
      if (siteId) add(`Within reach of ${site?.name}: arrival announced`);
      seen.current.siteId = siteId;
    }

    if (speaks && atSiteId && seen.current.spoke !== atSiteId) {
      add(`${site?.name} has something to say: wisdom unlocked`);
      seen.current.spoke = atSiteId;
    }

    if (events.length !== seen.current.meritCount) {
      const latest = events[0];
      if (latest && events.length > seen.current.meritCount) {
        add(
          latest.amount > 0
            ? `+${latest.amount} puṇya recorded: balance ${summary.balance}`
            : 'Recorded, no merit: the day is already complete',
        );
      }
      seen.current.meritCount = events.length;
    }

    const circling = step?.activity.kind === 'circling';
    if (circling !== seen.current.circuit) {
      if (circling) add('Circumambulation begun: clockwise, as pradakṣiṇā requires');
      else if (seen.current.circuit) add('Circuit closed: 360° clockwise');
      seen.current.circuit = circling;
    }
  }, [precinct, atSiteId, site, speaks, events, summary.balance, step]);

  const stages: Stage[] = [
    {
      key: 'fix',
      label: 'Fix',
      detail: step ? `${step.speedMps.toFixed(1)} m/s` : null,
      lit: coordinate !== null,
    },
    {
      key: 'precinct',
      label: 'Precinct',
      detail: precinct?.name ?? null,
      lit: precinct !== null,
    },
    { key: 'site', label: 'Site', detail: site?.name ?? null, lit: site !== null },
    { key: 'wisdom', label: 'Wisdom', detail: speaks ? 'ready to read' : null, lit: speaks },
    {
      key: 'merit',
      label: 'Puṇya',
      detail: meritHere ? `+${meritHere.amount}` : null,
      lit: meritHere !== undefined,
    },
  ];

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={expanded ? 'Collapse the demo detail' : 'Expand the demo detail'}
          onPress={() => setExpanded((open) => !open)}
          style={styles.headerText}
        >
          <Text variant="label" tone="sandstone" uppercase>
            Demo walk {expanded ? '▾' : '▸'}
          </Text>
          <Text variant="body" numberOfLines={expanded ? undefined : 1}>
            {activityLine(step)}
          </Text>
        </Pressable>
        {expanded ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restart the demo walk"
              onPress={onRestart}
              style={styles.action}
            >
              <Text variant="caption" tone="secondary">
                Restart
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leave demo mode"
              onPress={onExit}
              style={styles.action}
            >
              <Text variant="caption" tone="secondary">
                Exit
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>

      {/* Collapsed keeps the progress bar: it is one line tall and it is the
          only part that answers "how much of this is left". */}
      {!expanded && step ? (
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${((step.index + 1) / step.total) * 100}%` }]}
          />
        </View>
      ) : null}

      {/*
        The chain, left to right, in the order the app actually resolves it. Each
        cell is lit from live state rather than from the walk's own script, so a
        dark cell is a claim that the stage has not fired.
      */}
      {expanded ? (
        <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chain}>
        {stages.map((stage, index) => (
          <View key={stage.key} style={styles.chainItem}>
            {index > 0 ? (
              <Text
                variant="caption"
                tone={stages[index - 1].lit && stage.lit ? 'sandstone' : 'muted'}
                style={styles.arrow}
              >
                ›
              </Text>
            ) : null}
            <View style={[styles.stage, stage.lit && styles.stageLit]}>
              <Text variant="caption" tone={stage.lit ? 'sandstone' : 'muted'} uppercase>
                {stage.label}
              </Text>
              <Text
                variant="caption"
                tone={stage.lit ? 'secondary' : 'muted'}
                numberOfLines={1}
                style={styles.stageDetail}
              >
                {stage.detail ?? '—'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {log.length > 0 ? (
        <View style={styles.log}>
          {log.map((line, index) => (
            <Text
              key={`${line}-${index}`}
              variant="caption"
              tone={index === 0 ? 'secondary' : 'muted'}
              numberOfLines={1}
            >
              {index === 0 ? '· ' : '  '}
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {step ? (
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${((step.index + 1) / step.total) * 100}%` }]}
          />
        </View>
      ) : null}

      {/*
        Said plainly. Someone showing this to a colleague should not have to add
        the caveat themselves, and someone who forgot it is on should be able to
        find out from the screen rather than from a distance that makes no sense.
      */}
      <Text variant="caption" tone="muted">
        Synthetic positions on the real pipeline
        {precinct && coordinate
          ? ` · ${formatDistance(distanceMeters(coordinate, precinct.centre))} from the precinct centre`
          : ''}
      </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.sandstone,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  action: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chain: { alignItems: 'center', gap: spacing.xxs, paddingRight: spacing.base },
  chainItem: { flexDirection: 'row', alignItems: 'center' },
  arrow: { paddingHorizontal: spacing.xxs },
  stage: {
    minWidth: 84,
    gap: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  stageLit: { borderColor: colors.sandstone, backgroundColor: colors.background },
  stageDetail: { fontSize: 11 },
  log: { gap: 1 },
  progressTrack: {
    height: 3,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.sandstone },
});

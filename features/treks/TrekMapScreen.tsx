import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common';
import { MapWebView } from '@/components/map';
import { Button, Chip, Icon, Screen, Text } from '@/components/ui';
import { locateOnTrek, OFF_TRAIL_M, trailProgress } from '@/core';
import { dayDrawLine, dayStops, findTrek, trekDrawLine, trekStop } from '@/data';
import { useCurrentPosition, useSafeBack } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { formatDistance } from '@/utils';

import { ElevationProfile } from './ElevationProfile';
import { formatAltitude, formatHours } from './format';

/**
 * The trail, full screen, with you on it.
 *
 * Pick a day and the card tells you how far along it you are, measured along
 * the trail, and how far, how high and roughly how long the next stop is. Off
 * the trail it says so plainly instead of snapping you onto it, and if you are
 * on another day's trail it offers that day. Lines are drawn simplified; every
 * number is measured on the full line.
 */
export function TrekMapScreen({ trekId, day }: { trekId: string; day?: string }) {
  const goBack = useSafeBack();
  const ui = useVisitorLiteralCopy();
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const unit = preferences.distanceUnit;
  const trek = findTrek(trekId);
  const walkingDays = useMemo(
    () => (trek ? trek.days.map((d, index) => ({ d, index })).filter(({ d }) => !d.rest) : []),
    [trek],
  );
  const requested = Number(day);
  const [dayIndex, setDayIndex] = useState(
    Number.isInteger(requested) && trek?.days[requested] && !trek.days[requested].rest ? requested : (walkingDays[0]?.index ?? 0),
  );
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const { coordinate, accuracyM, demoMode } = useCurrentPosition({ watch: true, highAccuracy: true, smooth: true });
  // Where on the day's line you were last time, so the way back is not read as the way out.
  const [lastIndex, setLastIndex] = useState(0);

  const whole = useMemo(() => (trek ? trekDrawLine(trek) : []), [trek]);
  const drawnDay = useMemo(() => (trek ? dayDrawLine(trek, dayIndex) : []), [trek, dayIndex]);
  const waypoints = useMemo(
    () => (trek ? trek.stops.map((stop) => ({ id: stop.id, name: stop.name, ...stop.coordinate })) : []),
    [trek],
  );

  const current = trek?.days[dayIndex];
  const stops = useMemo(() => (trek ? dayStops(trek, dayIndex) : []), [trek, dayIndex]);
  const progress = useMemo(
    () =>
      coordinate && !demoMode && current
        ? trailProgress(current.line, current.profile, stops.map((stop) => ({ id: stop.id, ...stop.coordinate })), coordinate, accuracyM, lastIndex)
        : null,
    [coordinate, demoMode, current, stops, accuracyM, lastIndex],
  );
  // Off this day's trail: perhaps on another day's.
  const otherDay = useMemo(() => {
    if (!trek || !coordinate || demoMode || !progress || progress.onTrail) return null;
    const found = locateOnTrek(trek.days, coordinate, OFF_TRAIL_M + Math.min(accuracyM ?? 0, 100));
    return found && found.dayIndex !== dayIndex ? found.dayIndex : null;
  }, [trek, coordinate, demoMode, progress, accuracyM, dayIndex]);
  const nextWalkingDay = walkingDays.find(({ index }) => index > dayIndex)?.index ?? null;
  const progressIndex = progress?.onTrail ? progress.index : null;
  // Adjusting state while rendering, as React recommends for values derived from
  // a previous render: the next render reads the newer index, then settles.
  if (progressIndex != null && progressIndex !== lastIndex) setLastIndex(progressIndex);

  if (!trek) {
    return (
      <Screen>
        <EmptyState title="No such trek" body="This route is not in the app." actionLabel="Back" onAction={goBack} />
      </Screen>
    );
  }

  const next = progress?.onTrail && progress.next ? trekStop(trek, progress.next.id) : null;
  function showDay(index: number) {
    setDayIndex(index);
    setLastIndex(0);
    setSelectedStop(null);
  }
  const stop = trekStop(trek, selectedStop);

  return (
    <View style={styles.root}>
      <MapWebView
        fill
        route={drawnDay.length ? drawnDay : whole}
        waypoints={waypoints}
        solidRoute
        fitRoute
        routeColor={colors.navigationRoute}
        coordinate={demoMode ? null : coordinate}
        accuracyM={demoMode ? null : accuracyM}
        follow={false}
        mode="terrain"
        topInset={insets.top}
        initialCenter={whole[0]}
        onSelectWaypoint={setSelectedStop}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ui('Back')}
          onPress={goBack}
          style={({ pressed }) => [styles.round, pressed && styles.pressed]}
        >
          <Icon name="chevron-left" size={30} color={colors.primary} />
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
          {walkingDays.map(({ d, index }) => (
            <Chip
              key={d.day}
              label={`${ui('Day')} ${d.day}`}
              selected={index === dayIndex}
              onPress={() => showDay(index)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.base }]}>
        {stop ? (
          <Pressable onPress={() => setSelectedStop(null)} accessibilityRole="button" accessibilityHint={ui('Close')}>
            <Text variant="bodyStrong" translate={false}>
              {`${stop.name} · ${formatAltitude(stop.elevationM, unit)}`}
            </Text>
            <Text variant="caption" tone="secondary" translate={false}>
              {stop.note}
            </Text>
            {!stop.mapped ? (
              <Text variant="caption" tone="muted">
                Placed approximately: not yet in OpenStreetMap.
              </Text>
            ) : null}
          </Pressable>
        ) : (
          <>
            <Text variant="bodyStrong" translate={false}>
              {`${ui('Day')} ${current?.day ?? ''}: ${stops[0]?.name ?? ''} → ${stops[stops.length - 1]?.name ?? ''}`}
            </Text>
            {progress == null ? (
              <Text variant="caption" tone="secondary">
                {demoMode ? 'Your position is a demo, so progress is not shown.' : 'Waiting for your position.'}
              </Text>
            ) : !progress.onTrail ? (
              <>
                <Text variant="caption" tone="warning" translate={false}>
                  {`${ui('You are about')} ${formatDistance(progress.distanceFromTrailM, unit)} ${ui('from this day’s trail.')}`}
                </Text>
                {otherDay != null && trek.days[otherDay] ? (
                  <Button
                    label={`${ui('You are on the trail of day')} ${trek.days[otherDay].day}: ${ui('show it')}`}
                    variant="secondary"
                    onPress={() => showDay(otherDay)}
                  />
                ) : null}
              </>
            ) : (
              <>
                <Text variant="body" translate={false}>
                  {next && progress.next
                    ? `${ui('Next')}: ${next.name} · ${formatDistance(progress.next.alongM, unit)} ${ui('along the trail')}${
                        progress.next.climbM ? `, ${formatAltitude(progress.next.climbM, unit)} ${ui('up')}` : ''
                      }`
                    : ui('You have reached the end of this day’s trail.')}
                </Text>
                {progress.next?.estimatedHours != null ? (
                  <Text variant="caption" tone="secondary" translate={false}>
                    {`${ui('Estimated')} ${formatHours(progress.next.estimatedHours)} ${ui('to the next stop, without breaks')}`}
                  </Text>
                ) : null}
                <Text variant="caption" tone="secondary" translate={false}>
                  {`${formatDistance(progress.walkedM, unit)} ${ui('done')} · ${formatDistance(progress.remainingM, unit)} ${ui('to go')}${
                    progress.remainingEstimatedHours != null ? ` (${ui('about')} ${formatHours(progress.remainingEstimatedHours)})` : ''
                  } · ${ui('about')} ${formatAltitude(progress.altitudeM, unit)}`}
                </Text>
                {!progress.next && nextWalkingDay != null && trek.days[nextWalkingDay] ? (
                  <Button
                    label={`${ui('Next stage')}: ${ui('Day')} ${trek.days[nextWalkingDay].day}`}
                    variant="secondary"
                    onPress={() => showDay(nextWalkingDay)}
                  />
                ) : null}
              </>
            )}
            {current ? <ElevationProfile profile={current.profile} marker={progress?.onTrail ? progress.fraction : null} height={56} /> : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.content,
    zIndex: 10,
  },
  round: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceSecondary },
  days: { gap: spacing.xs, paddingRight: spacing.content },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.xs,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.content,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
  },
});

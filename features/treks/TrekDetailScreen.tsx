import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BackBar, EmptyState } from '@/components/common';
import { MapWebView } from '@/components/map';
import { boundsOfLine, cumulativeAlong, splitStages } from '@/core';
import { Button, Card, Divider, Screen, Text } from '@/components/ui';
import { dayStops, essentialsFor, findTrek, trekDrawLine, trekPhoto, trekProfile, trekStop } from '@/data';
import { PhotoHero } from '@/components/site';
import { useSafeBack } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { application } from '@/services';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import type { Trek, TrekDay } from '@/types';
import { formatDistance } from '@/utils';

import { ElevationProfile } from './ElevationProfile';
import { SaveOfflineMap } from './SaveOfflineMap';
import { formatAltitude, formatHours } from './format';
import { DIFFICULTY_LABEL, Stat } from './TrekListScreen';

/** A trek in depth: the shape of it, each day, permits, seasons and safety. */
export function TrekDetailScreen({ trekId }: { trekId: string }) {
  const router = useRouter();
  const goBack = useSafeBack();
  const ui = useVisitorLiteralCopy();
  const { preferences } = usePreferences();
  const trek = findTrek(trekId);

  if (!trek) {
    return (
      <Screen>
        <EmptyState title="No such trek" body="This route is not in the app." actionLabel="Back" onAction={goBack} />
      </Screen>
    );
  }

  const unit = preferences.distanceUnit;
  // Simplified for drawing only (Douglas–Peucker, 15 m); the numbers come from the full line.
  const line = trekDrawLine(trek);
  const waypoints = trek.stops.map((stop) => ({ id: stop.id, name: stop.name, ...stop.coordinate }));
  const whole = trekProfile(trek);
  const approximate = trek.stops.filter((stop) => !stop.mapped);
  const openMap = (day?: number) =>
    router.push({ pathname: '/(main)/tirtha/treks/map/[trekId]', params: { trekId: trek.id, day: String(day ?? 0) } });

  return (
    <Screen scroll>
      <BackBar />
      {trekPhoto(trek.id) ? <PhotoHero uri={trekPhoto(trek.id)!.uri} credit={trekPhoto(trek.id)!.credit} height={240} style={styles.photo} /> : null}
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          {ui(DIFFICULTY_LABEL[trek.difficulty])}
        </Text>
        <Text variant="title" translate={false}>
          {trek.name}
        </Text>
        <Text variant="body" tone="secondary" translate={false}>
          {preferences.interfaceLanguage === 'ne' ? trek.nameNepali : trek.region}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ui('Open the trail map')}
        accessibilityHint={ui('Shows the route full screen with your position on it')}
        onPress={() => openMap()}
      >
        <MapWebView height={240} route={line} waypoints={waypoints} fitRoute solidRoute initialCenter={line[0]} />
      </Pressable>
      <Button label="Open the trail map" icon="map-marker-path" variant="secondary" onPress={() => openMap()} />
      <SaveOfflineMap id={`trek-${trek.id}`} label={trek.name} bounds={boundsOfLine(line)} />

      <View style={styles.stats}>
        <Stat label={ui('Days')} value={String(trek.totals.days)} />
        <Stat label={ui('Distance')} value={formatDistance(trek.totals.distanceM, unit)} />
        <Stat label={ui('Climb')} value={formatAltitude(trek.totals.ascentM, unit)} />
        <Stat label={ui('Highest')} value={formatAltitude(trek.totals.highest?.elevationM, unit)} />
        <Stat label={ui('Walking, estimated')} value={formatHours(trek.totals.walkingHours)} />
      </View>

      <Text variant="body" translate={false}>
        {trek.summary}
      </Text>

      <ElevationProfile profile={whole.profile} ticks={whole.dayStarts} distanceM={trek.totals.distanceM} />

      <Section title="Day by day">
        {trek.days.map((day, index) => (
          <DayCard key={day.day} trek={trek} day={day} onOpen={() => openMap(index)} />
        ))}
      </Section>

      <Section title="When to go">
        <Fact label={ui('Best')} value={trek.seasons.best} />
        <Fact label={ui('Avoid')} value={trek.seasons.avoid} />
      </Section>

      <Section title="Getting there">
        <Fact label={ui('Start')} value={trek.access.start} />
        <Fact label={ui('Finish')} value={trek.access.finish} />
      </Section>

      <Section title="Permits">
        {trek.permits.map((permit) => (
          <Card key={permit.name}>
            <Text variant="bodyStrong" translate={false}>
              {permit.name}
            </Text>
            <Text variant="body" translate={false}>
              {permit.feeNpr?.foreign != null
                ? `NPR ${permit.feeNpr.foreign.toLocaleString('en-US')} · ${ui('foreign visitors')}`
                : ui('Fee not confirmed')}
            </Text>
            <Text variant="caption" tone="secondary" translate={false}>
              {permit.where}
            </Text>
            <Text variant="caption" tone="muted" translate={false}>
              {permit.note}
            </Text>
          </Card>
        ))}
        <Text variant="caption" tone="warning">
          Since 2023, foreign trekkers in national parks and conservation areas are generally required to go with a licensed guide through a registered agency. Rules and fees change: confirm both before you travel.
        </Text>
        <Text variant="caption" tone="muted" translate={false}>
          {`${ui('Fees as published by trekking agencies, not an official notice. Last checked')} ${trek.checked}.`}
        </Text>
      </Section>

      <Section title="Safety">
        {trek.safety.map((line) => (
          <View key={line} style={styles.bullet}>
            <Text variant="body" tone="secondary">
              •
            </Text>
            <Text variant="body" style={styles.flex} translate={false}>
              {line}
            </Text>
          </View>
        ))}
      </Section>

      <Divider />
      <Text variant="caption" tone="muted">
        Distances are measured along mapped trails. Altitudes come from a 90 m elevation model and can be out by tens of metres. Walking times are estimates from distance and climb, without breaks; allow more.
      </Text>
      <Text variant="caption" tone="muted">
        Times use Naismith’s rule at a trekking pace: 3 km an hour, plus an hour for every 400 m up and 2,000 m down, and a tenth slower for each 1,000 m above 3,500 m. They assume you are acclimatised; until you are, go slower than this.
      </Text>
      {approximate.length ? (
        <Text variant="caption" tone="muted" translate={false}>
          {`${ui('Not yet mapped in OpenStreetMap, so placed approximately')}: ${approximate.map((stop) => stop.name).join(', ')}`}
        </Text>
      ) : null}
      <View style={styles.sources}>
        {trek.sources.map((source) => (
          <Button
            key={source.url}
            label={source.label}
            variant="quiet"
            onPress={() => void application.openExternal(source.url)}
          />
        ))}
      </View>
    </Screen>
  );
}

function DayCard({ trek, day, onOpen }: { trek: Trek; day: TrekDay; onOpen: () => void }) {
  const ui = useVisitorLiteralCopy();
  const router = useRouter();
  const { preferences } = usePreferences();
  const unit = preferences.distanceUnit;
  const from = trekStop(trek, day.from);
  const to = trekStop(trek, day.to);
  const sleep = trekStop(trek, day.sleep);
  const dayIndex = trek.days.indexOf(day);
  // Stop to stop within the day, each with its own estimate. Only worth showing
  // when the day passes stops between where it starts and ends.
  const { stages, stopNames, ticks } = useMemo(() => {
    const stops = dayStops(trek, dayIndex);
    const split = splitStages(day.line, day.profile, stops.map((stop) => stop.coordinate));
    const along = cumulativeAlong(day.line);
    const total = along[along.length - 1] ?? 0;
    return {
      stages: split,
      stopNames: stops.map((stop) => stop.name),
      ticks: total > 0 ? split.slice(1).map((stage) => along[stage.fromIndex] / total) : [],
    };
  }, [trek, day, dayIndex]);
  const title = day.rest
    ? `${ui('Rest day')}: ${from?.name ?? ''}`
    : from?.id === to?.id
      ? `${from?.name} · ${day.via.map((id) => trekStop(trek, id)?.name).join(', ')}`
      : `${from?.name} → ${to?.name}`;

  return (
    <Card onPress={day.rest ? undefined : onOpen} accessibilityLabel={`${ui('Day')} ${day.day}`}>
      <Text variant="label" tone="muted" uppercase translate={false}>
        {`${ui('Day')} ${day.day}`}
      </Text>
      <Text variant="bodyStrong" translate={false}>
        {title}
      </Text>
      {!day.rest ? (
        <View style={styles.dayStats}>
          <Stat label={ui('Distance')} value={formatDistance(day.distanceM, unit)} />
          <Stat label={ui('Up')} value={formatAltitude(day.ascentM, unit)} />
          <Stat label={ui('Down')} value={formatAltitude(day.descentM, unit)} />
          <Stat label={ui('Walking, estimated')} value={formatHours(day.hours)} />
        </View>
      ) : null}
      {day.profile.length > 1 ? <ElevationProfile profile={day.profile} ticks={ticks} distanceM={day.distanceM} height={48} /> : null}
      {stages.length > 1 && day.distanceM != null ? (
        <View style={styles.stages}>
          {stages.map((stage) => (
            <Text key={stage.fromIndex} variant="caption" tone="secondary" translate={false}>
              {[
                `${stopNames[stage.fromStop] ?? ''} → ${stopNames[stage.toStop] ?? ''}`,
                formatDistance(stage.distanceM, unit),
                stage.ascentM != null ? `↑ ${formatAltitude(stage.ascentM, unit)}` : null,
                stage.descentM != null ? `↓ ${formatAltitude(stage.descentM, unit)}` : null,
                stage.estimatedHours != null ? `${ui('about')} ${formatHours(stage.estimatedHours)}` : null,
              ].filter(Boolean).join(' · ')}
            </Text>
          ))}
        </View>
      ) : null}
      {!day.rest && day.highestM != null && day.highestM >= 3000 ? (
        <Text variant="caption" tone="muted">
          Above 3,000 m, allow more time than the estimate until you are acclimatised.
        </Text>
      ) : null}
      <Text variant="body" tone="secondary" translate={false}>
        {day.note}
      </Text>
      {sleep ? (
        <Text variant="caption" tone="secondary" translate={false}>
          {`${ui('Sleep')}: ${sleep.name}, ${formatAltitude(sleep.elevationM, unit)}`}
        </Text>
      ) : null}
      {sleep && essentialsFor(trek.id, 'stay', sleep.id).length ? (
        <Button
          label={`${ui('Places to stay at')} ${sleep.name} (${essentialsFor(trek.id, 'stay', sleep.id).length})`}
          icon="bed-outline"
          variant="quiet"
          onPress={() => router.push({ pathname: '/(main)/tirtha/essentials', params: { area: trek.id, near: sleep.id, kind: 'stay' } })}
        />
      ) : null}
      {day.fastGain && day.sleepGainM != null ? (
        <View style={styles.warning}>
          <Text variant="caption" tone="warning" translate={false}>
            {`${ui('You sleep')} ${formatAltitude(day.sleepGainM, unit)} ${ui('higher than last night, above the usual 500 m a night guide. Go slowly and watch for altitude sickness.')}`}
          </Text>
        </View>
      ) : null}
      {[from, ...day.via.map((id) => trekStop(trek, id)), to]
        .filter((stop, i, list) => stop && list.findIndex((other) => other?.id === stop.id) === i)
        .map((stop) => (
          <View key={stop!.id} style={styles.stop}>
            <Text variant="caption" tone="sandstone" translate={false}>
              {`${stop!.name} · ${formatAltitude(stop!.elevationM, unit)}`}
            </Text>
            <Text variant="caption" tone="secondary" translate={false}>
              {stop!.note}
            </Text>
          </View>
        ))}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="heading">{title}</Text>
      {children}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text variant="caption" tone="muted" uppercase translate={false}>
        {label}
      </Text>
      <Text variant="body" translate={false}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xs, marginBottom: spacing.md },
  photo: { marginBottom: spacing.md },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginVertical: spacing.md },
  dayStats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base, marginVertical: spacing.xs },
  section: { gap: spacing.sm, marginTop: spacing.lg },
  fact: { gap: spacing.xxs },
  bullet: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  warning: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  stop: { gap: spacing.xxs, marginTop: spacing.xs },
  stages: { gap: spacing.xxs, marginTop: spacing.xs },
  sources: { alignItems: 'flex-start', marginBottom: spacing.xl },
});

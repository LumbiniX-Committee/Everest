import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LoadingState, ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { HUB_BOUNDS } from '@/data';
import { SaveOfflineMap, formatMegabytes } from '@/features/treks';
import { useOfflinePacks } from '@/hooks';
import { database } from '@/services';
import { useQuests } from '@/store';
import { spacing } from '@/theme';

import { SettingsSection } from './components';

type Counts = {
  observations: number;
  conditionReports: number;
  meritEvents: number;
  sitesWitnessed: number;
};

/**
 * What this device is holding, and the one destructive action offered.
 *
 * Observations and condition reports are not clearable from here. They are the
 * record — the thing the app exists to accumulate — and a settings screen is
 * the wrong place to lose one to a mis-tap. Quest progress is different: it is
 * derived, re-seedable, and genuinely useful to reset while demonstrating.
 */
export function StorageScreen() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { refresh: refreshQuests } = useQuests();

  const load = useCallback(async () => {
    const [observations, reports, meritEvents, sitesWitnessed] = await Promise.all([
      database.countObservations(),
      database.listConditionReports(),
      database.countMeritEvents(),
      database.countSitesWitnessed(),
    ]);
    setCounts({
      observations,
      conditionReports: reports.length,
      meritEvents,
      sitesWitnessed,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetQuests = useCallback(async () => {
    setResetting(true);
    await database.resetQuestProgress();
    await refreshQuests();
    await load();
    setResetting(false);
    setConfirming(false);
  }, [refreshQuests, load]);

  if (!counts) {
    return <LoadingState label="Reading the local record" />;
  }

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Settings"
        title="Storage"
        subtitle="Everything here lives on this device, and works with no connection."
      />

      <SettingsSection
        title="On this device"
        footnote="Observations and condition reports cannot be cleared here. They are the record, and a settings screen is the wrong place to lose one by mis-tap."
      >
        <Row label="Observations" value={counts.observations} />
        <Row label="Condition reports" value={counts.conditionReports} />
        <Row label="Recognised acts" value={counts.meritEvents} />
        <Row label="Sites witnessed" value={counts.sitesWitnessed} />
      </SettingsSection>

      <OfflineMapsSection />

      <SettingsSection
        title="Quest progress"
        footnote="Clears which tasks are ticked and re-seeds the demo quests. Observations you made while completing them are untouched."
      >
        {confirming ? (
          <>
            <Text variant="body" tone="secondary" style={styles.body}>
              Reset progress on every quest? This cannot be undone.
            </Text>
            <Button
              label="Reset quest progress"
              variant="primary"
              block
              loading={resetting}
              disabled={resetting}
              onPress={() => void resetQuests()}
            />
            <Button label="Cancel" variant="quiet" block onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button label="Reset quest progress" variant="quiet" block onPress={() => setConfirming(true)} />
        )}
      </SettingsSection>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text variant="body">{label}</Text>
      <Text variant="body" tone="secondary">
        {value}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  body: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
});

const HUB_LABELS = { lumbini: 'Lumbini', kathmandu: 'Kathmandu Valley', pokhara: 'Pokhara', chitwan: 'Chitwan' } as const;

/**
 * Saved map areas. Clearing them is offered because they are a cache of public
 * map data, not the visitor's record: anything removed can be saved again.
 */
function OfflineMapsSection() {
  const { packs, removeAll } = useOfflinePacks();
  const [confirming, setConfirming] = useState(false);
  const total = packs.reduce((sum, pack) => sum + pack.bytes, 0);

  return (
    <SettingsSection
      title="Offline maps"
      footnote="Treks can be saved from their own page. Satellite imagery is never saved."
    >
      {(Object.keys(HUB_BOUNDS) as (keyof typeof HUB_BOUNDS)[]).map((hub) => (
        <View key={hub} style={styles.body}>
          <Text variant="bodyStrong" translate={false}>
            {HUB_LABELS[hub]}
          </Text>
          <SaveOfflineMap id={`hub-${hub}`} label={HUB_LABELS[hub]} bounds={HUB_BOUNDS[hub]} />
        </View>
      ))}
      {packs.length ? (
        confirming ? (
          <>
            <Text variant="body" tone="secondary" style={styles.body}>
              Remove every saved map from this phone? Your records are not affected.
            </Text>
            <Button
              label="Remove saved maps"
              variant="primary"
              block
              onPress={() => {
                setConfirming(false);
                void removeAll();
              }}
            />
            <Button label="Cancel" variant="quiet" block onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button
            label={`${packs.length} saved · ${formatMegabytes(total)} · Remove`}
            variant="quiet"
            block
            onPress={() => setConfirming(true)}
          />
        )
      ) : null}
    </SettingsSection>
  );
}

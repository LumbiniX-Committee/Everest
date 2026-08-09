import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LoadingState, ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { dhammaForSite, findSite } from '@/data';
import { arrival as arrivalService } from '@/services';
import { useArrival } from '@/store';
import { spacing } from '@/theme';

import { SettingsRow, SettingsSection } from './components';

const STATUS_TEXT = {
  idle: 'Not watching. Arrivals will not be announced.',
  monitoring: 'Watching. You will be told once when you reach a precinct.',
  'needs-permission': 'Needs notification and location permission.',
  unsupported: 'Location services are unavailable on this device.',
  invalid: 'A precinct is misconfigured and was not registered.',
} as const;

export function ArrivalsScreen() {
  const { hydrated, status, problem, precincts, enable, disable, simulateArrival } = useArrival();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (!hydrated) return <LoadingState label="Checking arrival monitoring" />;

  const run = async (precinctId: string, name: string) => {
    setBusy(precinctId);
    const announced = await simulateArrival(precinctId);
    setBusy(null);
    setNote(
      announced
        ? `Announced ${name}.`
        : `${name} was announced recently, so it stayed quiet. Reset the history to announce it again.`,
    );
  };

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Settings"
        title="Arrivals"
        subtitle="Being told what a place holds, once you are standing on it."
      />

      <SettingsSection
        title="Status"
        footnote="Detection is handled by the operating system, which watches for the crossing using cell and wifi rather than GPS. That is why it costs almost no battery, and why it can take a minute or two to notice."
      >
        <Text variant="body" style={styles.body}>
          {STATUS_TEXT[status]}
        </Text>
        {problem ? (
          <Text variant="body" tone="open" style={styles.body}>
            {problem}
          </Text>
        ) : null}
        <Button
          label={status === 'monitoring' ? 'Stop watching' : 'Watch for arrivals'}
          variant="secondary"
          block
          onPress={() => void (status === 'monitoring' ? disable() : enable())}
        />
      </SettingsSection>

      <SettingsSection
        title="Precincts"
        footnote="One geofence each, rather than one per monument. The four Sacred Garden monuments sit within 92 m of each other and the closest pair is 39 m apart, closer than a geofence can reliably resolve. Which monument you are at is decided from a live fix once the app is open."
      >
        {precincts.map((p) => {
          const speakable = p.siteIds.filter((id) => dhammaForSite(id).length > 0);
          return (
            <View key={p.id}>
              <SettingsRow
                label={p.name}
                value={`${p.radiusMetres} m`}
                hint={
                  speakable.length > 0
                    ? `${p.siteIds.length} sites · ${speakable.length} with a passage`
                    : `${p.siteIds.length} sites · no passage yet`
                }
                onPress={() => void run(p.id, p.name)}
              />
              {busy === p.id ? (
                <Text variant="caption" tone="muted" style={styles.body}>
                  Announcing…
                </Text>
              ) : null}
            </View>
          );
        })}
      </SettingsSection>

      {note ? (
        <Text variant="body" tone="secondary" style={styles.note}>
          {note}
        </Text>
      ) : null}

      <SettingsSection
        title="Coverage"
        footnote="A precinct with no passage still announces that you have arrived: it just has nothing to quote. Passages are never matched loosely to fill the gap."
      >
        {precincts
          .flatMap((p) => p.siteIds)
          .map((siteId) => {
            const site = findSite(siteId);
            const count = dhammaForSite(siteId).length;
            return site ? (
              <View key={siteId} style={styles.row}>
                <Text variant="body">{site.name}</Text>
                <Text variant="body" tone={count > 0 ? 'resolved' : 'muted'}>
                  {count > 0 ? `${count} passage${count > 1 ? 's' : ''}` : 'none'}
                </Text>
              </View>
            ) : null;
          })}
      </SettingsSection>

      <Button
        label="Reset arrival history"
        variant="quiet"
        block
        onPress={() => {
          void arrivalService.resetArrivalHistory();
          setNote('Cleared. Every precinct will announce itself again.');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  note: { paddingHorizontal: spacing.xs, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
});

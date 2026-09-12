import { useCallback, useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { LoadingState, ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { privacy } from '@/services';
import { spacing } from '@/theme';

import { SettingsSection } from './components';

/**
 * Export and deletion for this device's own records.
 *
 * "Delete" here means what services/privacy says it means: it cannot and
 * does not remove an observation already synced into the shared conservation
 * record — that record is append-only by design, the same reason
 * StorageScreen will not let you clear it either. What it does is wipe this
 * device's own copy, remove its photographs, and start the device fresh
 * under a new, unlinked identity, so nothing from here on can be tied back
 * to what came before. Said plainly rather than left implied, because a
 * privacy control that overstates what it did is worse than none.
 */
export function PrivacyScreen() {
  const [count, setCount] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const load = useCallback(async () => {
    setCount(await privacy.countMyRecords());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const exportRecords = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      const bundle = await privacy.exportMyRecords();
      await Share.share({
        title: 'Sākṣī: my records',
        message: JSON.stringify(bundle, null, 2),
      });
    } catch {
      setExportError('Could not prepare the export. Nothing was changed; try again.');
    } finally {
      setExporting(false);
    }
  }, []);

  const deleteRecords = useCallback(async () => {
    setDeleting(true);
    await privacy.deleteMyRecords();
    await load();
    setDeleting(false);
    setConfirming(false);
    setDeleted(true);
  }, [load]);

  if (count === null) {
    return <LoadingState label="Reading the local record" />;
  }

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Settings"
        title="Privacy"
        subtitle="Get a copy of what this device holds, or remove this device from the record."
      />

      <SettingsSection
        title="Export"
        footnote="A JSON file with every observation, condition report, quest submission and recognised act this device has recorded, whether or not it has synced yet."
      >
        <Row label="Observations" value={count} />
        {exportError ? (
          <Text variant="body" tone="secondary" style={styles.body}>
            {exportError}
          </Text>
        ) : null}
        <Button
          label="Export my records"
          variant="secondary"
          block
          loading={exporting}
          disabled={exporting}
          onPress={() => void exportRecords()}
        />
      </SettingsSection>

      <SettingsSection
        title="Delete"
        footnote="This clears this device's own copy of your observations, condition reports and quest evidence, deletes their photographs, and gives the device a new, unlinked identity. It cannot remove anything already shared into a site's conservation record, since that record does not erase evidence, the same reason a settings screen cannot clear it either. What it does guarantee is that nothing recorded after this point can be tied back to what came before."
      >
        {deleted ? (
          <Text variant="body" tone="secondary" style={styles.body}>
            Done. This device now holds nothing, and its next observation starts a fresh, unlinked record.
          </Text>
        ) : confirming ? (
          <>
            <Text variant="body" tone="secondary" style={styles.body}>
              Delete every record on this device? This cannot be undone.
            </Text>
            <Button
              label="Delete my records"
              variant="primary"
              block
              loading={deleting}
              disabled={deleting}
              onPress={() => void deleteRecords()}
            />
            <Button label="Cancel" variant="quiet" block onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button
            label="Delete my records"
            variant="quiet"
            block
            disabled={count === 0}
            onPress={() => setConfirming(true)}
          />
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

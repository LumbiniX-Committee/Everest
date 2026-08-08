import { ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { useSync } from '@/hooks';
import { usePreferences } from '@/store';
import { OFFLINE_SYNC_OPTIONS } from '@/types';

import { SettingsChoice, SettingsSection } from './components';

const SYNC_TEXT = {
  synced: 'Everything on this device has been uploaded.',
  syncing: 'Uploading…',
  offline: 'Waiting for a connection.',
  failed: 'The last attempt did not finish. Nothing was lost.',
} as const;

export function SyncScreen() {
  const { syncState, pendingCount, triggerSync } = useSync();
  const { preferences, update } = usePreferences();

  const nothingPending = pendingCount === 0;

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Settings"
        title="Sync"
        subtitle="Observations are written to this device first and uploaded afterwards."
      />

      <SettingsSection
        title="Status"
        footnote="Nothing is deleted locally once uploaded. A failed sync costs a retry, never a record."
      >
        <Text variant="body" style={styles.body}>
          {SYNC_TEXT[syncState] ?? 'Unknown.'}
        </Text>
        <Text variant="body" tone={nothingPending ? 'secondary' : 'sandstone'} style={styles.body}>
          {nothingPending
            ? 'Nothing waiting.'
            : `${pendingCount} ${pendingCount === 1 ? 'record' : 'records'} waiting to upload.`}
        </Text>

        <Button
          label={syncState === 'syncing' ? 'Uploading…' : 'Upload now'}
          variant="secondary"
          block
          disabled={nothingPending || syncState === 'syncing'}
          loading={syncState === 'syncing'}
          onPress={() => void triggerSync()}
          accessibilityHint={
            nothingPending ? 'Nothing is waiting to upload.' : 'Uploads regardless of the setting below.'
          }
        />
      </SettingsSection>

      <SettingsSection
        title="When to upload"
        footnote="Mobile data around Lumbini can be expensive, and a day's survey is a lot of photographs. Wi-Fi only is the default for that reason."
      >
        <SettingsChoice
          legend="Offline sync"
          options={OFFLINE_SYNC_OPTIONS}
          selected={preferences.offlineSyncMode}
          onSelect={(value) => void update('offlineSyncMode', value)}
        />
      </SettingsSection>
    </Screen>
  );
}

const styles = { body: { paddingHorizontal: 16, paddingVertical: 12 } } as const;

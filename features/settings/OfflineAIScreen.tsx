import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import {
  deleteOfflineModel,
  downloadOfflineModel,
  offlineModelStatus,
  OFFLINE_MODEL,
  type OfflineModelStatus,
} from '@/services/offlineModel';
import { spacing } from '@/theme';

import { SettingsSection } from './components';

export function OfflineAIScreen() {
  const [status, setStatus] = useState<OfflineModelStatus>({ state: 'missing' });
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await offlineModelStatus());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const download = async () => {
    setError(null);
    setStatus({ state: 'downloading', progress: 0 });
    try {
      await downloadOfflineModel((progress) => setStatus({ state: 'downloading', progress }));
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The offline model could not be installed.');
      await refresh();
    }
  };

  const remove = async () => {
    setError(null);
    await deleteOfflineModel();
    await refresh();
  };

  const isDownloading = status.state === 'downloading';
  const progress = isDownloading ? Math.round(status.progress * 100) : 0;

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Settings"
        title="Offline AI"
        subtitle="Download a small local model for grounded Dhamma answers without the API."
      />

      <SettingsSection
        title={OFFLINE_MODEL.name}
        footnote="This is optional and uses about 484 MB. It is downloaded into private app storage, not included in the base install, and can be deleted at any time."
      >
        <Text variant="body" style={styles.body}>
          {status.state === 'ready'
            ? 'Ready. Dhamma will use this model only after local evidence has been retrieved.'
            : status.state === 'unsupported'
              ? 'This build does not contain the native llama.cpp runtime. Install a Sakshi development build; Expo Go cannot run offline generation.'
              : status.state === 'downloading'
                ? `Downloading… ${progress}%`
                : status.state === 'error'
                  ? status.message
                  : 'Not downloaded. The deterministic local corpus remains available.'}
        </Text>
        {error ? <Text tone="primary" variant="caption" style={styles.body}>{error}</Text> : null}
        {status.state === 'ready' ? (
          <Button label="Delete offline model" variant="quiet" block onPress={() => void remove()} />
        ) : (
          <Button
            label={isDownloading ? `Downloading… ${progress}%` : 'Download offline model'}
            variant="primary"
            block
            loading={isDownloading}
            disabled={isDownloading || status.state === 'unsupported'}
            onPress={() => void download()}
          />
        )}
      </SettingsSection>

      <View style={styles.note}>
        <Text variant="caption" tone="secondary">
          Offline generation is a short rewrite of retrieved canonical passages. It is not allowed to create new citations or replace the corpus fallback.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  note: { paddingHorizontal: spacing.base, paddingTop: spacing.lg },
});

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import type { NarrationEntry } from '@/data';
import { spacing } from '@/theme';

export function NarrationPlayer({
  audioSource,
  narration,
}: {
  audioSource?: number;
  narration?: NarrationEntry;
}) {
  const player = useAudioPlayer(audioSource ?? null);
  const status = useAudioPlayerStatus(player);

  if (!narration && !audioSource) return null;

  const isPlaying = status?.playing ?? false;
  const currentTime = Math.floor(status?.currentTime ?? 0);
  const totalTime = Math.floor(status?.duration || narration?.approx_seconds || 0);

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={styles.card}>
      <Text variant="heading">Audio Narration</Text>
      {narration ? (
        <Text variant="body" tone="secondary" style={styles.narrationText}>
          {narration.en}
        </Text>
      ) : null}
      {audioSource ? (
        <View style={styles.controls}>
          <Button
            label={isPlaying ? 'Pause Narration' : 'Listen to Narration'}
            variant="secondary"
            onPress={togglePlayback}
          />
          <Text variant="caption" tone="muted">
            {currentTime > 0 || isPlaying
              ? `${currentTime}s / ${totalTime}s`
              : `~${totalTime}s`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  narrationText: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});

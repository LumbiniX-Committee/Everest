import { useVideoPlayer, VideoView } from 'expo-video';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

const source = require('../../assets/heritage-intro.webm');

/** A quiet, muted visual interlude used on the welcome and explore surfaces. */
export function HeritageVideo({ compact = false }: { compact?: boolean }) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Heritage video. Tap to pause or resume."
      onPress={() => (player.playing ? player.pause() : player.play())}
      style={[styles.frame, compact ? styles.compact : styles.welcome]}
    >
      <VideoView
        player={player}
        style={styles.video}
        // Preserve the source framing. `cover` was cropping the supplied
        // footage on shorter phones, making only part of the scene visible.
        contentFit="contain"
        nativeControls={false}
      />
      <View pointerEvents="none" style={styles.caption}>
        <Text variant={compact ? 'label' : 'label'} tone="inverse" uppercase>
          {compact ? 'Lumbini in motion' : 'A living record'}
        </Text>
        <Text variant="caption" tone="inverse">
          Tap to pause
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.textPrimary },
  welcome: { width: '100%', maxWidth: 320, aspectRatio: 16 / 9, borderRadius: radii.xl },
  compact: { width: '100%', aspectRatio: 16 / 9, borderRadius: radii.lg, marginTop: spacing.lg },
  video: { width: '100%', height: '100%' },
  caption: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, gap: spacing.xs },
});

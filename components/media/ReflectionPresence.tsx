import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

const source = require('../../assets/heritage-intro.webm');

/**
 * Transparent alpha-video presence for the reflection surface. It has no
 * controls or card chrome: the answer and its citation remain the content.
 */
export function ReflectionPresence() {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  return (
    <View pointerEvents="none" style={styles.frame} accessibilityLabel="A quiet visual presence">
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        surfaceType="textureView"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    height: 132,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  video: { width: '100%', height: '100%', backgroundColor: colors.ground },
});

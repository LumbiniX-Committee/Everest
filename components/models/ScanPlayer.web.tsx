import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { scanEmbedUrl } from '@/data';
import { colors, radii } from '@/theme';

/** On the web build the scan plays in Sketchfab's embed frame directly. */
export function ScanPlayer({ id, height = 420 }: { id: string; height?: number }) {
  return (
    <View style={[styles.frame, { height }]}>
      {createElement('iframe', {
        src: scanEmbedUrl(id),
        title: 'Sketchfab 3D viewer',
        allow: 'autoplay; fullscreen; xr-spatial-tracking',
        allowFullScreen: true,
        style: { border: 0, width: '100%', height: '100%' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.backgroundDeep },
});

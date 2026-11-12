import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/**
 * A soft dark ramp over a photograph, so white text holds contrast on any
 * picture. Built from thin translucent layers, each shorter than the last,
 * rather than a gradient module: that would need a new native build, and this
 * ships over the air.
 */
export function PhotoVeil({ height, edge = 'bottom', steps = 28, strength = 0.085 }: { height: number; edge?: 'top' | 'bottom'; steps?: number; strength?: number }) {
  return (
    <>
      {Array.from({ length: steps }, (_, i) => Math.round(height * ((i + 1) / steps))).map((layer) => (
        <View
          key={layer}
          pointerEvents="none"
          style={[styles.layer, edge === 'bottom' ? styles.bottom : styles.top, { height: layer, opacity: strength }]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.overlay },
  bottom: { bottom: 0 },
  top: { top: 0 },
});

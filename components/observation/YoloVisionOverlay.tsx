import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { YoloDetection } from '@/services/ai/yoloEngine';
import { radii, spacing } from '@/theme';

export type YoloVisionOverlayProps = {
  detections: YoloDetection[];
  visible?: boolean;
};

/**
 * YOLO AI Damage Detection overlay.
 *
 * Renders coloured bounding boxes with confidence tags and corner brackets
 * over a camera preview or an observation photograph. All coordinates are
 * normalised 0–1, so the overlay scales to any container size.
 */
export function YoloVisionOverlay({ detections, visible = true }: YoloVisionOverlayProps) {
  if (!visible || detections.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {detections.map((det) => (
        <View
          key={det.id}
          style={[
            styles.box,
            {
              left: `${det.bbox.x * 100}%` as any,
              top: `${det.bbox.y * 100}%` as any,
              width: `${det.bbox.w * 100}%` as any,
              height: `${det.bbox.h * 100}%` as any,
              borderColor: det.color,
            },
          ]}
        >
          {/* Confidence tag above the box */}
          <View style={[styles.tag, { backgroundColor: det.color }]}>
            <Text variant="caption" style={styles.tagText}>
              {det.label} {(det.confidence * 100).toFixed(0)}%
            </Text>
          </View>

          {/* Corner reticle brackets */}
          <View style={[styles.corner, styles.tl, { borderColor: det.color }]} />
          <View style={[styles.corner, styles.tr, { borderColor: det.color }]} />
          <View style={[styles.corner, styles.bl, { borderColor: det.color }]} />
          <View style={[styles.corner, styles.br, { borderColor: det.color }]} />
        </View>
      ))}
    </View>
  );
}

const CORNER = 10;

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0,0,0,0.12)',
    zIndex: 40,
  },
  tag: {
    position: 'absolute',
    top: -22,
    left: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  tagText: { color: '#fff', fontWeight: '700', fontSize: 10 },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  tl: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 },
});

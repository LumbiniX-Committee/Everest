import { useMemo, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type ThenNowPanel = {
  /** Bundled asset or URI. Absent renders the labelled placeholder. */
  image?: number | string;
  /** "c. 1899", "Today". Shown in the corner tag. */
  date: string;
  /** Stands in for a missing image. Describes what would be shown. */
  placeholderNote?: string;
};

export type ThenNowCompareProps = {
  then: ThenNowPanel;
  now: ThenNowPanel;
  /** 4:3 suits most archive material; capture is 3:4. */
  aspectRatio?: number;
};

/**
 * The Then / Now comparison.
 *
 * A single frame with a draggable divider rather than two images side by side.
 * Side-by-side invites the eye to compare compositions; one frame with a wipe
 * forces the same pixels to occupy the same place, which is what makes a change
 * legible rather than merely visible. That is §22's "this is the same place,
 * seen across time".
 *
 * The divider is driven by an Animated.Value through a PanResponder, so
 * dragging does not re-render the images. The clipped panel wraps its content
 * in a fixed-width child: without it the image would squash as the clip narrows
 * instead of being revealed.
 */
export function ThenNowCompare({ then: thenPanel, now: nowPanel, aspectRatio = 4 / 3 }: ThenNowCompareProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  /**
   * Where the divider rests between gestures. State rather than a ref: the
   * responder needs to read it, and a ref read during render is both a lint
   * error and a real hazard under concurrent rendering.
   */
  const [base, setBase] = useState(0);
  const divider = useMemo(() => new Animated.Value(0), []);

  // Rebuilt when the rest position or the frame width changes — neither of
  // which happens mid-gesture, so a drag is never interrupted by it.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_event, gesture) => {
          divider.setValue(clamp(base + gesture.dx, 0, size.width));
        },
        onPanResponderRelease: (_event, gesture) => {
          const next = clamp(base + gesture.dx, 0, size.width);
          divider.setValue(next);
          setBase(next);
        },
      }),
    [divider, base, size.width],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width === size.width) return;
    // Open at the midpoint: both halves visible, neither favoured.
    divider.setValue(width / 2);
    setBase(width / 2);
    setSize({ width, height: width / aspectRatio });
  };

  return (
    <View
      style={[styles.frame, size.height ? { height: size.height } : { aspectRatio }]}
      onLayout={onLayout}
      accessibilityLabel={`Comparison between ${thenPanel.date} and ${nowPanel.date}. Drag the divider to wipe between them.`}
    >
      <Panel panel={nowPanel} width={size.width} height={size.height} align="right" />

      <Animated.View style={[styles.clip, { width: divider }]}>
        <View style={{ width: size.width, height: size.height }}>
          <Panel panel={thenPanel} width={size.width} height={size.height} align="left" />
        </View>
      </Animated.View>

      {size.width > 0 ? (
        <Animated.View
          style={[styles.handleTrack, { transform: [{ translateX: divider }] }]}
          {...responder.panHandlers}
        >
          <View style={styles.handleLine} />
          <View style={styles.handleGrip}>
            <View style={styles.gripBar} />
            <View style={styles.gripBar} />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Panel({
  panel,
  width,
  height,
  align,
}: {
  panel: ThenNowPanel;
  width: number;
  height: number;
  align: 'left' | 'right';
}) {
  const tagStyle = align === 'left' ? styles.tagLeft : styles.tagRight;

  return (
    <View style={[styles.panel, width ? { width, height } : null]}>
      {panel.image != null ? (
        <Image
          source={typeof panel.image === 'string' ? { uri: panel.image } : panel.image}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text variant="label" tone="muted" uppercase center>
            Image pending
          </Text>
          {panel.placeholderNote ? (
            <Text variant="caption" tone="muted" center style={styles.placeholderNote}>
              {panel.placeholderNote}
            </Text>
          ) : null}
        </View>
      )}

      <View style={[styles.tag, tagStyle]}>
        <Text variant="mono" tone="inverse">
          {panel.date}
        </Text>
      </View>
    </View>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const HANDLE = 44;

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceSecondary,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  placeholderNote: { maxWidth: 260 },
  clip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  tag: {
    position: 'absolute',
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(37, 42, 39, 0.72)',
  },
  tagLeft: { left: spacing.sm },
  tagRight: { right: spacing.sm },
  handleTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -HANDLE / 2,
    width: HANDLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.surface },
  handleGrip: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  gripBar: { width: 2, height: 12, borderRadius: radii.full, backgroundColor: colors.textMuted },
});

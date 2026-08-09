import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii } from '@/theme';

import { Text } from './Text';

/**
 * Progress drawn as a ring rather than a bar.
 *
 * 07-DESIGN-SYSTEM §1 takes the risk that the whole visual language derives
 * from one object — the alignment reticle — expressed at three scales. A quest
 * closing is the same idea as a reticle closing on a vantage, so it gets the
 * same form. A hairline bar said the same thing in the vocabulary of a download.
 *
 * ── Why it is built from borders ────────────────────────────────────────────
 *
 * There is no SVG in this project and no icon library, and adding either means
 * a native dependency that cannot reach the shipped APK over the air. The
 * Reticle solves this by composing from Views, borders and radii; so does this.
 * Nothing here needs a package.
 *
 * The arc is four quadrant borders revealed in order, which gives four honest
 * steps rather than a continuous sweep. That is a fair match for quests, which
 * have three to four tasks — a smooth 63% arc would imply a precision the
 * underlying count does not have. Where a quest has more tasks than quadrants
 * the ring rounds down, so it never shows a quadrant that has not been earned.
 */
export type ProgressRingProps = {
  completed: number;
  total: number;
  /** Outer diameter in points. */
  size?: number;
  thickness?: number;
  /** Rendered in the middle. Defaults to `completed/total`. */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function ProgressRing({
  completed,
  total,
  size = 52,
  thickness = 3,
  label,
  style,
}: ProgressRingProps) {
  const safeTotal = Math.max(1, total);
  const done = Math.min(completed, safeTotal);
  const complete = done >= safeTotal;

  // Rounded down: a quadrant lit is a quadrant earned.
  const quadrants = Math.floor((done / safeTotal) * 4);

  // Top, right, bottom, left — clockwise from the top, the direction a dial is
  // read. Each border is either the accent or the track; there is no partial
  // colour, because a partial border cannot be drawn without SVG.
  const lit = (index: number) => (complete || index < quadrants ? colors.sandstone : colors.border);

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderTopWidth: thickness,
            borderRightWidth: thickness,
            borderBottomWidth: thickness,
            borderLeftWidth: thickness,
            borderTopColor: lit(0),
            borderRightColor: lit(1),
            borderBottomColor: lit(2),
            borderLeftColor: lit(3),
          },
        ]}
      />
      <Text variant="caption" tone={complete ? 'secondary' : 'muted'} style={styles.label}>
        {label ?? `${done}/${safeTotal}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: radii.full },
  label: { fontVariant: ['tabular-nums'] },
});

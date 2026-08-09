import { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * The greeting figure, animated by swapping frames.
 *
 * Not 3D. `components/3d/Character3D` reaches for @react-three/fiber, which on
 * React Native needs expo-gl — a native module absent from the shipped build,
 * and one no over-the-air update can add. Until EAS builds are available again
 * a 3D figure cannot reach a single existing install, whereas eleven images and
 * a timer reach all of them. This is the version that ships.
 *
 * Frames come from tools/extract-monk-frames.py, which derives them from the
 * same keyed WebP the landing page uses so the two cannot show differently-cut
 * versions of the same figure.
 */

// Written out rather than generated. Metro resolves require() at bundle time
// and needs a literal path; a loop over an index would resolve nothing.
const FRAMES = [
  require('@/assets/monk/monk-00.webp'),
  require('@/assets/monk/monk-01.webp'),
  require('@/assets/monk/monk-02.webp'),
  require('@/assets/monk/monk-03.webp'),
  require('@/assets/monk/monk-04.webp'),
  require('@/assets/monk/monk-05.webp'),
  require('@/assets/monk/monk-06.webp'),
  require('@/assets/monk/monk-07.webp'),
  require('@/assets/monk/monk-08.webp'),
  require('@/assets/monk/monk-09.webp'),
  require('@/assets/monk/monk-10.webp'),
];

/**
 * Out along the frames and back down again, with the two turning frames not
 * repeated so the reversal does not hold for two beats and read as a stutter.
 *
 * This is why only eleven files ship for a twenty-frame loop: the return leg is
 * the same pixels in the other order, and an index is cheaper than nine images.
 */
const SEQUENCE = [...FRAMES.keys(), ...[...FRAMES.keys()].slice(1, -1).reverse()];

/** 10fps — the rate the frames were sampled at. Faster would judder the sway. */
const FRAME_MS = 100;

/**
 * The pose held when motion is off: hands together, head level. Frame 0 is the
 * rest position the sway departs from, so it is the one that looks deliberate
 * rather than caught mid-movement.
 */
const STILL_FRAME = 0;

/** The source is 316×560; height drives the layout and width follows it. */
const ASPECT = 316 / 560;

/**
 * One frame, for callers that want the figure without the sway.
 *
 * The map uses it as the "you are here" marker. Mounting the full animator
 * there would put eleven decoded images and a 10fps timer behind a 32-point
 * dot, on the screen least able to spare either.
 */
export const MONK_STILL = FRAMES[STILL_FRAME];

export type GreetingMonkProps = {
  /** Rendered height in points. Width is derived from the frame aspect. */
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function GreetingMonk({ height = 260, style }: GreetingMonkProps) {
  const [animate, setAnimate] = useState(false);
  const [tick, setTick] = useState(0);

  // Someone who has asked their system to reduce motion has asked for this too.
  // Checked before starting rather than after, so the sway never plays a frame
  // for the people who turned it off.
  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (active) setAnimate(!reduced);
      })
      .catch(() => {
        // Unavailable on this platform. Motion is the documented default.
        if (active) setAnimate(true);
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (reduced) => setAnimate(!reduced),
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!animate) return;
    const timer = setInterval(() => setTick((value) => value + 1), FRAME_MS);
    return () => clearInterval(timer);
  }, [animate]);

  // Derived, not stored. Holding the frame in state meant writing it from an
  // effect the moment motion was found to be off — a render of the wrong frame
  // followed by a correction, for the one person who asked not to see movement.
  const frame = animate ? SEQUENCE[tick % SEQUENCE.length] : STILL_FRAME;

  const width = height * ASPECT;

  return (
    <View style={[{ width, height }, style]} accessibilityRole="image" accessibilityLabel="A monk greeting you">
      {/* Every frame is mounted and switched by opacity rather than by swapping
          one image's source. A source swap decodes on the fly, and the first
          pass through the loop shows a blank beat at each new frame; mounting
          them costs the decode once, up front, where nobody is watching. */}
      {FRAMES.map((source, index) => (
        <Image
          key={index}
          source={source}
          style={[styles.frame, { opacity: index === frame ? 1 : 0 }]}
          resizeMode="contain"
          // Decorative individually — the container carries the label.
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
});

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text, type TextProps } from '@/components/ui';
import { colors } from '@/theme';

export type TypewriterTextProps = TextProps & {
  text: string;
  speed?: number; // ms per tick
  charsPerTick?: number; // chars per tick
  cursor?: boolean;
  onComplete?: () => void;
  skipOnPress?: boolean;
  animated?: boolean;
};

/**
 * Renders text with a smooth typewriter animation, character-by-character.
 *
 * Supports multi-byte unicode and Devanagari scripts cleanly, includes a pulsing
 * caret cursor while typing, and provides tap-to-complete capability.
 */
export function TypewriterText({
  text,
  speed = 18,
  charsPerTick = 1,
  cursor = true,
  onComplete,
  skipOnPress = true,
  animated = true,
  variant = 'body',
  tone,
  style,
  ...rest
}: TypewriterTextProps) {
  const chars = useMemo(() => Array.from(text || ''), [text]);
  const [progress, setProgress] = useState({ text, length: animated ? 0 : chars.length });
  const completedRef = useRef(!animated);
  const onCompleteRef = useRef(onComplete);

  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;

    if (!animated || chars.length === 0) {
      completedRef.current = true;
      queueMicrotask(() => onCompleteRef.current?.());
      return;
    }

    let currentLen = 0;

    // Adjust speed and charsPerTick for longer texts so typing remains engaging without feeling sluggish
    const effectiveCharsPerTick = chars.length > 250 ? Math.max(charsPerTick, 2) : charsPerTick;
    const effectiveSpeed = chars.length > 400 ? Math.max(12, speed - 6) : speed;

    const interval = setInterval(() => {
      if (completedRef.current) {
        clearInterval(interval);
        return;
      }
      currentLen = Math.min(chars.length, currentLen + effectiveCharsPerTick);
      setProgress({ text, length: currentLen });

      if (currentLen >= chars.length) {
        clearInterval(interval);
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }, effectiveSpeed);

    return () => clearInterval(interval);
  }, [text, speed, charsPerTick, animated, chars]);

  const displayedLength = animated
    ? progress.text === text ? progress.length : 0
    : chars.length;

  const isTyping = animated && displayedLength < chars.length;

  useEffect(() => {
    if (!isTyping) {
      cursorOpacity.set(0);
    } else {
      cursorOpacity.set(withRepeat(
        withSequence(
          withTiming(0.15, { duration: 320 }),
          withTiming(1, { duration: 320 }),
        ),
        -1,
        true,
      ));
    }
  }, [isTyping, cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const handleSkip = () => {
    if (skipOnPress && isTyping) {
      setProgress({ text, length: chars.length });
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  };

  const visibleText = chars.slice(0, displayedLength).join('');

  return (
    <Pressable onPress={handleSkip} disabled={!skipOnPress || !isTyping}>
      <Text variant={variant} tone={tone} style={style} {...rest}>
        {visibleText}
        {cursor && isTyping ? (
          <Animated.Text style={[styles.cursor, cursorStyle]}>▎</Animated.Text>
        ) : null}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cursor: {
    color: colors.primary,
    fontWeight: '700',
  },
});

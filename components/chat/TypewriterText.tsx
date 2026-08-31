import { useEffect, useRef, useState } from 'react';
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
  const chars = Array.from(text || '');
  const [displayedLength, setDisplayedLength] = useState(animated ? 0 : chars.length);
  const textArrayRef = useRef<string[]>(chars);
  const completedRef = useRef(!animated);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    const currentChars = Array.from(text || '');
    textArrayRef.current = currentChars;

    if (!animated || currentChars.length === 0) {
      setDisplayedLength(currentChars.length);
      completedRef.current = true;
      onCompleteRef.current?.();
      return;
    }

    setDisplayedLength(0);
    completedRef.current = false;
    let currentLen = 0;

    // Adjust speed and charsPerTick for longer texts so typing remains engaging without feeling sluggish
    const effectiveCharsPerTick = currentChars.length > 250 ? Math.max(charsPerTick, 2) : charsPerTick;
    const effectiveSpeed = currentChars.length > 400 ? Math.max(12, speed - 6) : speed;

    const interval = setInterval(() => {
      currentLen = Math.min(currentChars.length, currentLen + effectiveCharsPerTick);
      setDisplayedLength(currentLen);

      if (currentLen >= currentChars.length) {
        clearInterval(interval);
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }, effectiveSpeed);

    return () => clearInterval(interval);
  }, [text, speed, charsPerTick, animated]);

  const isTyping = animated && displayedLength < textArrayRef.current.length;

  useEffect(() => {
    if (!isTyping) {
      cursorOpacity.value = 0;
    } else {
      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: 320 }),
          withTiming(1, { duration: 320 }),
        ),
        -1,
        true,
      );
    }
  }, [isTyping, cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const handleSkip = () => {
    if (skipOnPress && isTyping) {
      setDisplayedLength(textArrayRef.current.length);
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  };

  const visibleText = textArrayRef.current.slice(0, displayedLength).join('');

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

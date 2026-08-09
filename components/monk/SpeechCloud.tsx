import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/theme';

import { GreetingMonk } from './GreetingMonk';

/**
 * The monk, and a cloud he speaks from.
 *
 * This was the story sequence's private layout. It is here because the guide in
 * Tīrtha now uses the same one: the same monk from the left, the same warm
 * cloud with a tail pointing at him, the same eyebrow pill and the same reveal.
 * Two screens drawing one cloud, rather than one screen copying the other and
 * drifting.
 *
 * It stays an absolute overlay rather than a `Modal`. The map underneath is the
 * place being talked about, so the guide belongs in the world rather than on a
 * page laid over it.
 */

/** Reveals text a character at a time, and stops pretending when asked. */
export function useTypingText(
  text: string,
  speed = 22,
  charsPerTick = 1,
): { displayed: string; done: boolean; skip: () => void } {
  const [displayed, setDisplayed] = useState('');
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(textRef.current.length, i + charsPerTick);
      setDisplayed(textRef.current.slice(0, i));
      if (i >= textRef.current.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, charsPerTick]);

  return {
    displayed,
    done: displayed.length >= text.length,
    skip: () => setDisplayed(textRef.current),
  };
}

export type SpeechCloudProps = {
  /** Small pill above the text. Rendered as given, so pass it uppercase. */
  eyebrow?: string;
  /** Sits beside the eyebrow. The story puts its voice control here. */
  eyebrowAccessory?: ReactNode;
  /** The cloud's body. */
  children: ReactNode;
  /** Under the body: pips, back, next, or a composer. */
  footer?: ReactNode;
  onClose: () => void;
  /** Tapping the dim area behind. The story advances; the guide does nothing. */
  onBackdropPress?: () => void;
  /** Re-runs the float-up whenever this changes. One value per beat or reply. */
  animationKey?: string | number;
  /** Extra space under the cloud, for a keyboard. */
  bottomInset?: number;
  monkHeight?: number;
  /** Above the cloud, outside it. The guide puts the visitor's question here. */
  aboveCloud?: ReactNode;
};

export function SpeechCloud({
  eyebrow,
  eyebrowAccessory,
  children,
  footer,
  onClose,
  onBackdropPress,
  animationKey,
  bottomInset = 0,
  monkHeight = 250,
  aboveCloud,
}: SpeechCloudProps) {
  const insets = useSafeAreaInsets();

  // The monk slides in once, from the left.
  const avatarSlide = useRef(new Animated.Value(0)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    avatarSlide.setValue(0);
    avatarOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(avatarSlide, {
        toValue: 1,
        duration: 540,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [avatarSlide, avatarOpacity]);

  // The cloud floats up again on every new thing said.
  const cloudAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cloudAnim.setValue(0);
    Animated.timing(cloudAnim, {
      toValue: 1,
      duration: 320,
      delay: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animationKey, cloudAnim]);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={onBackdropPress ?? onClose}
        accessibilityRole="button"
        accessibilityLabel={onBackdropPress ? 'Continue' : 'Close'}
      />

      <Animated.View
        style={[
          styles.avatarWrap,
          { bottom: insets.bottom + 72 + bottomInset },
          {
            opacity: avatarOpacity,
            transform: [
              { translateX: avatarSlide.interpolate({ inputRange: [0, 1], outputRange: [-200, 0] }) },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <GreetingMonk height={monkHeight} />
      </Animated.View>

      <Animated.View
        style={[
          styles.speechArea,
          { paddingBottom: insets.bottom + spacing.lg + bottomInset },
          {
            opacity: cloudAnim,
            transform: [
              { translateY: cloudAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        {aboveCloud}

        <View style={styles.bubble}>
          <View style={styles.bubbleTail} />

          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLeft}>
              {eyebrow ? (
                <View style={styles.eyebrowPill}>
                  <RNText style={styles.eyebrowTxt} numberOfLines={1}>
                    {eyebrow}
                  </RNText>
                </View>
              ) : null}
              {eyebrowAccessory}
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeBubble}
            >
              <RNText style={styles.closeBubbleTxt}>✕</RNText>
            </Pressable>
          </View>

          {children}

          {footer}
        </View>
      </Animated.View>
    </View>
  );
}

export const speechCloudStyles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 24, color: colors.textPrimary },
  original: { fontStyle: 'italic', fontSize: 13, color: colors.sandstoneDeep, lineHeight: 19 },
  content: { gap: spacing.xs, minHeight: 68 },
});

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // The map stays legible. A guide in the world, not a page over it.
    backgroundColor: 'rgba(20, 25, 22, 0.42)',
  },

  avatarWrap: { position: 'absolute', left: -16 },

  speechArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    // Room for the monk, who is about 145pt wide.
    paddingLeft: 142,
    gap: spacing.xs,
  },

  bubble: {
    backgroundColor: 'rgba(255, 252, 246, 0.96)',
    borderRadius: 20,
    padding: spacing.base,
    gap: spacing.sm + 2,
    overflow: 'visible',
    shadowColor: '#A07A50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(183, 155, 114, 0.38)',
  },

  bubbleTail: {
    position: 'absolute',
    left: -11,
    top: 28,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(255, 252, 246, 0.96)',
  },

  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },

  eyebrowPill: {
    flexShrink: 1,
    backgroundColor: colors.sandstone,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },

  eyebrowTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, color: '#FFFFFF' },

  closeBubble: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  closeBubbleTxt: { fontSize: 15, color: colors.textMuted },
});

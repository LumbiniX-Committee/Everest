import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GreetingMonk } from '@/components/monk';
import { buildStory, type StoryBeat } from '@/core';
import { findSite } from '@/data';
import { arrival } from '@/services';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';

// ─── Confetti particle ────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#F4B942', '#E8573F', '#4DAA57', '#4A90D9', '#9B59B6', '#E67E22', '#F39C12'];

type ParticleRef = {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
};

function useConfetti(trigger: boolean) {
  const particles = useRef<ParticleRef[]>(
    Array.from({ length: 30 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + (i % 4) * 3,
    })),
  ).current;

  useEffect(() => {
    if (!trigger) return;
    particles.forEach((p, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const spread = 100 + Math.random() * 90;
      const tx = Math.cos(angle) * spread;
      const ty = -Math.abs(Math.sin(angle)) * spread - 60;
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(1);
      p.rotate.setValue(0);
      Animated.parallel([
        Animated.timing(p.x, { toValue: tx, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p.y, { toValue: ty + 220, duration: 1000, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.rotate, { toValue: 720, duration: 1000, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(580),
          Animated.timing(p.opacity, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [trigger, particles]);

  return particles;
}

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypingText(text: string, speed = 22): string {
  const [displayed, setDisplayed] = useState('');
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(textRef.current.slice(0, i));
      if (i >= textRef.current.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── Unlock popup ─────────────────────────────────────────────────────────────

type UnlockPopupProps = {
  visible: boolean;
  siteName: string;
  onClose: () => void;
  onQuests?: () => void;
  confettiOn: boolean;
};

function UnlockPopup({ visible, siteName, onClose, onQuests, confettiOn }: UnlockPopupProps) {
  const particles = useConfetti(confettiOn);
  const scale = useRef(new Animated.Value(0.65)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.65);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 13, stiffness: 170 }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.65);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={popup.overlay}>
        {/* Confetti burst, centred on the card */}
        <View style={popup.confettiRoot} pointerEvents="none">
          {particles.map((p, i) => (
            <Animated.View
              key={i}
              style={[
                popup.particle,
                {
                  backgroundColor: p.color,
                  width: p.size,
                  height: p.size,
                  opacity: p.opacity,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { rotate: p.rotate.interpolate({ inputRange: [0, 720], outputRange: ['0deg', '720deg'] }) },
                  ],
                },
              ]}
            />
          ))}
        </View>

        <Animated.View style={[popup.card, { opacity, transform: [{ scale }] }]}>
          {/* X close */}
          <Pressable style={popup.closeBtn} onPress={onClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close">
            <RNText style={popup.closeTxt}>✕</RNText>
          </Pressable>

          <RNText style={popup.star}>✦</RNText>
          <RNText style={popup.label}>SPIRITUALITY UNLOCKED</RNText>
          <RNText style={popup.level}>Level 1 Explorer</RNText>

          <View style={popup.divider} />

          <RNText style={popup.siteName}>{siteName}</RNText>
          <RNText style={popup.caption}>
            You stood here, you listened, you understood.
          </RNText>

          {onQuests ? (
            <Pressable style={popup.questBtn} onPress={onQuests} accessibilityRole="button">
              <RNText style={popup.questBtnTxt}>⚑  View Quests</RNText>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Beat body ────────────────────────────────────────────────────────────────

function BeatBody({ beat }: { beat: StoryBeat }) {
  const typed = useTypingText(beat.body, 22);
  return (
    <View style={styles.beatContent}>
      {beat.original ? (
        <RNText style={styles.originalTxt}>{beat.original}</RNText>
      ) : null}
      <RNText style={styles.bodyTxt}>{typed}</RNText>
    </View>
  );
}

function DiscoveryBeat({ siteName }: { siteName: string }) {
  const typed = useTypingText(
    `You have truly arrived at ${siteName}. The wisdom of this sacred place now walks with you on your journey.`,
    20,
  );
  return (
    <View style={styles.beatContent}>
      <RNText style={styles.bodyTxt}>{typed}</RNText>
    </View>
  );
}

// ─── Progress pips ────────────────────────────────────────────────────────────

function Pips({ count, at }: { count: number; at: number }) {
  return (
    <View style={styles.pips} accessibilityLabel={`Step ${at + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.pip, i <= at && styles.pipOn]} />
      ))}
    </View>
  );
}

// ─── StorySequence ────────────────────────────────────────────────────────────

export type StorySequenceProps = {
  siteId: string;
  visible: boolean;
  /** Called once, when the last beat is passed. Never on dismissal. */
  onComplete: (siteId: string) => void;
  onDismiss: () => void;
  /** Called when the user taps Quest button in the unlock popup. */
  onOpenQuests?: () => void;
};

export function StorySequence({ siteId, visible, onComplete, onDismiss, onOpenQuests }: StorySequenceProps) {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [index, setIndex] = useState(0);
  const [showUnlock, setShowUnlock] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const beats = useMemo(() => {
    const significance = arrival.significanceOf(siteId, preferences.wisdomTier);
    if (!significance) return [];
    return buildStory({
      siteName: significance.site.name,
      siteSummary: significance.site.summary,
      narration: significance.narration,
      facts: significance.facts,
      dhamma: significance.dhamma,
    });
  }, [siteId, preferences.wisdomTier]);

  const site = useMemo(() => findSite(siteId), [siteId]);

  // Reset state for each new site
  useEffect(() => {
    setIndex(0);
    setShowUnlock(false);
    setConfetti(false);
  }, [siteId]);

  // ── Avatar: slides in from the left once per site ──────────────────────────
  const avatarSlide = useRef(new Animated.Value(0)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      avatarSlide.setValue(0);
      avatarOpacity.setValue(0);
      return;
    }
    avatarSlide.setValue(0);
    avatarOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(avatarSlide, {
        toValue: 1,
        duration: 540,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, siteId, avatarSlide, avatarOpacity]);

  // ── Bubble: floats up on each beat change ─────────────────────────────────
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    bubbleAnim.setValue(0);
    Animated.timing(bubbleAnim, {
      toValue: 1,
      duration: 320,
      delay: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, index, bubbleAnim]);

  if (!visible || beats.length === 0) return null;

  const beat = beats[Math.min(index, beats.length - 1)];
  const isLast = index >= beats.length - 1;
  const isDiscovery = beat.kind === 'discovery';

  const next = () => {
    if (isLast) {
      setShowUnlock(true);
      setTimeout(() => setConfetti(true), 80);
      return;
    }
    setIndex((i) => i + 1);
  };

  const back = () => setIndex((i) => Math.max(0, i - 1));

  const handleUnlockClose = () => {
    setShowUnlock(false);
    onComplete(siteId);
  };

  const handleQuestsFromUnlock = () => {
    setShowUnlock(false);
    onComplete(siteId);
    onOpenQuests?.();
  };

  return (
    <>
      <View style={styles.root} pointerEvents="box-none">
        {/* Dim overlay (tap to advance) */}
        <Pressable style={styles.backdrop} onPress={next} accessibilityRole="button" accessibilityLabel="Next" />

        {/* Buddha avatar — large, from left, no circular frame */}
        <Animated.View
          style={[
            styles.avatarWrap,
            { bottom: insets.bottom + 72 },
            {
              opacity: avatarOpacity,
              transform: [
                {
                  translateX: avatarSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-200, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <GreetingMonk height={250} />
        </Animated.View>

        {/* Floating speech bubble panel */}
        <Animated.View
          style={[
            styles.speechArea,
            { paddingBottom: insets.bottom + spacing.lg },
            {
              opacity: bubbleAnim,
              transform: [
                {
                  translateY: bubbleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [28, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.bubble}>
            {/* Tail pointing left toward avatar */}
            <View style={styles.bubbleTail} />

            {/* Top row: chapter eyebrow + dismiss */}
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowPill}>
                <RNText style={styles.eyebrowTxt}>
                  {isDiscovery ? '✦  Wisdom Unlocked' : beat.eyebrow.toUpperCase()}
                </RNText>
              </View>
              <Pressable
                onPress={onDismiss}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close story"
                style={styles.closeBubble}
              >
                <RNText style={styles.closeBubbleTxt}>✕</RNText>
              </Pressable>
            </View>

            {/* Beat content with typewriter animation */}
            {isDiscovery
              ? <DiscoveryBeat siteName={site?.name ?? ''} />
              : <BeatBody beat={beat} />}

            {/* Footer: back + dots + next */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <Pressable
                  onPress={back}
                  disabled={index === 0}
                  hitSlop={10}
                  style={[styles.navBtn, index === 0 && styles.navBtnOff]}
                  accessibilityRole="button"
                  accessibilityLabel="Previous"
                >
                  <RNText style={[styles.navBtnTxt, index === 0 && styles.navBtnTxtMuted]}>‹</RNText>
                </Pressable>
                <Pips count={beats.length} at={index} />
              </View>

              <Pressable
                style={[styles.nextBtn, isLast && styles.nextBtnClaim]}
                onPress={next}
                accessibilityRole="button"
                accessibilityLabel={isLast ? 'Claim wisdom' : 'Next'}
              >
                <RNText style={styles.nextBtnTxt}>
                  {isLast ? '✦  Claim' : 'Next  →'}
                </RNText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Unlock celebration popup */}
      <UnlockPopup
        visible={showUnlock}
        siteName={site?.name ?? ''}
        onClose={handleUnlockClose}
        onQuests={onOpenQuests ? handleQuestsFromUnlock : undefined}
        confettiOn={confetti}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },

  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    // Map stays legible — guide in the world, not a page over it.
    backgroundColor: 'rgba(20, 25, 22, 0.42)',
  },

  // Large avatar from left, no circular background at all.
  avatarWrap: {
    position: 'absolute',
    left: -16,
  },

  // Bubble sits to the right of the avatar, at the bottom.
  speechArea: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.base,
    // Shift content right to leave room for avatar (~145pt wide).
    paddingLeft: 142,
  },

  bubble: {
    backgroundColor: 'rgba(255, 252, 246, 0.96)',
    borderRadius: 20,
    padding: spacing.base,
    gap: spacing.sm + 2,
    overflow: 'visible',
    // Warm golden shadow
    shadowColor: '#A07A50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(183, 155, 114, 0.38)',
  },

  // Pointer triangle toward the avatar on the left.
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

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrowPill: {
    backgroundColor: colors.sandstone,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },

  eyebrowTxt: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: '#FFFFFF',
  },

  closeBubble: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeBubbleTxt: {
    fontSize: 15,
    color: colors.textMuted,
  },

  beatContent: {
    gap: spacing.xs,
    minHeight: 68,
  },

  originalTxt: {
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.sandstoneDeep,
    lineHeight: 19,
  },

  bodyTxt: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  navBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  navBtnOff: { opacity: 0.28 },

  navBtnTxt: {
    fontSize: 18,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  navBtnTxtMuted: { color: colors.textMuted },

  pips: { flexDirection: 'row', gap: 5 },

  pip: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },

  pipOn: {
    backgroundColor: colors.sandstone,
    width: 16,
  },

  nextBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.sandstone,
  },

  nextBtnClaim: {
    backgroundColor: '#B4472A',
  },

  nextBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});

// ─── Popup styles ─────────────────────────────────────────────────────────────

const popup = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 25, 22, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confettiRoot: {
    position: 'absolute',
    top: '48%',
    left: '50%',
    width: 0,
    height: 0,
  },

  particle: {
    position: 'absolute',
    borderRadius: 2,
  },

  card: {
    width: '82%',
    backgroundColor: '#FFFCF6',
    borderRadius: 26,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl + 4,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(183, 155, 114, 0.42)',
  },

  closeBtn: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.full,
  },

  closeTxt: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },

  star: {
    fontSize: 56,
    marginBottom: -spacing.sm,
  },

  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: colors.sandstoneDeep,
    textTransform: 'uppercase',
  },

  level: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  divider: {
    width: '58%',
    height: 1.5,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  siteName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.sandstoneDeep,
    textAlign: 'center',
  },

  caption: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    fontStyle: 'italic',
  },

  questBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.sandstone,
    borderRadius: radii.full,
    paddingHorizontal: spacing.xl + 4,
    paddingVertical: spacing.md,
    shadowColor: colors.sandstone,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 6,
  },

  questBtnTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});


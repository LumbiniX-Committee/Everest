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

import { SpeechCloud, speechCloudStyles, useTypingText } from '@/components/monk';
import { buildStory, standingFor, WISDOM_LEVELS, type StoryBeat } from '@/core';
import { findSite } from '@/data';
import { arrival, voice } from '@/services';
import { usePractice, usePreferences } from '@/store';
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
  const { summary } = usePractice();

  // Compute actual user spiritual level and progress from wisdom balance
  const standing = standingFor(summary.balance);

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
          <RNText style={popup.label}>STORY READ</RNText>

          {/* The standing this person now holds, named rather than numbered. */}
          <RNText style={popup.level}>{standing.title}</RNText>

          {/*
            A fixed "+200 earned" badge stood here, and it was not a reading of
            anything: it was a constant, shown whatever the ledger granted —
            including zero, once the daily cap is reached. `recognise()` returns
            the real amount and this component is not given it, so rather than
            print a number it cannot know, it prints none. The awarded amount is
            announced by the surface that actually performed the award.
          */}
          <View style={popup.divider} />

          <RNText style={popup.siteName}>{siteName}</RNText>
          <RNText style={popup.caption}>
            You stood here, listened, and unlocked sacred knowledge.
          </RNText>

          {/* Level Progress Indicator */}
          <View style={popup.progressBox}>
            <View style={popup.progressHead}>
              <RNText style={popup.progressLabel}>Standing</RNText>
              <RNText style={popup.progressPts}>{standing.wisdom} puṇya</RNText>
            </View>
            <View style={popup.track}>
              <View style={[popup.fill, { width: `${Math.round(standing.progress * 100)}%` }]} />
            </View>
            <RNText style={popup.toNext}>
              {/* Named, not numbered: "until Seeker" says something about a
                  pilgrimage in a way "for Level 3" never will. */}
              {standing.toNextLevel > 0
                ? `${standing.toNextLevel} puṇya until ${nextTitleAfter(standing.title)}`
                : 'The furthest standing this record keeps'}
            </RNText>
          </View>

          {onQuests ? (
            <Pressable style={popup.questBtn} onPress={onQuests} accessibilityRole="button">
              <RNText style={popup.questBtnTxt}>⚑  View Location Quests</RNText>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Beat body ────────────────────────────────────────────────────────────────

/**
 * The title that follows this one, or the current one at the top.
 *
 * Read from `WISDOM_LEVELS` rather than restated here, so inserting a standing
 * cannot leave this copy naming one that no longer follows.
 */
function nextTitleAfter(title: string): string {
  const index = WISDOM_LEVELS.findIndex((entry) => entry.title === title);
  return WISDOM_LEVELS[index + 1]?.title ?? title;
}

function BeatBody({ beat }: { beat: StoryBeat }) {
  const { displayed } = useTypingText(beat.body, 22);
  return (
    <View style={speechCloudStyles.content}>
      {beat.original ? (
        <RNText style={speechCloudStyles.original}>{beat.original}</RNText>
      ) : null}
      <RNText style={speechCloudStyles.body}>{displayed}</RNText>
    </View>
  );
}

function DiscoveryBeat({ siteName }: { siteName: string }) {
  const { displayed } = useTypingText(
    `You have truly arrived at ${siteName}. The wisdom of this sacred place now walks with you on your journey.`,
    20,
  );
  return (
    <View style={speechCloudStyles.content}>
      <RNText style={speechCloudStyles.body}>{displayed}</RNText>
    </View>
  );
}

// ─── Progress pips ────────────────────────────────────────────────────────────

function Pips({ count, at }: { count: number; at: number }) {
  return (
    <View style={styles.pips} accessibilityLabel={`Step ${at + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.pip,
            i < at && styles.pipDone,
            i === at && styles.pipCurrent,
          ]}
        />
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
  const { preferences } = usePreferences();
  const [index, setIndex] = useState(0);
  const [showUnlock, setShowUnlock] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const beats = useMemo(() => {
    const significance = arrival.significanceOf(siteId, preferences.wisdomTier);
    if (!significance) return [];
    return buildStory({
      siteName: significance.site.name,
      siteSummary: significance.site.summary,
      narration: significance.narration,
      facts: significance.facts,
      story: significance.story,
      dhamma: significance.dhamma,
    });
  }, [siteId, preferences.wisdomTier]);

  const site = useMemo(() => findSite(siteId), [siteId]);

  // Reset state for each new site
  useEffect(() => {
    setIndex(0);
    setShowUnlock(false);
    setConfetti(false);
    setVoiceMuted(false);
  }, [siteId]);

  // ── Synchronized Beat-by-Beat Voice Playback ───────────────────────────────
  // Speaks ONLY the beat currently displayed on screen.
  // Stops previous beat's speech immediately when index changes (Next/Back).
  // Never speaks ahead to future beats until the user actually taps Next!
  useEffect(() => {
    if (!visible || voiceMuted || !preferences.autoNarration || beats.length === 0) {
      voice.stopSpeaking();
      setSpeaking(false);
      return;
    }

    const currentBeat = beats[Math.min(index, beats.length - 1)];
    if (!currentBeat) return;

    // Compose spoken line matching the beat text showing on screen
    const spokenText = `${currentBeat.eyebrow}. ${currentBeat.body}`;

    setSpeaking(true);
    voice.speakText(
      spokenText,
      'en',
      () => setSpeaking(false),
      () => setSpeaking(false),
    );

    return () => {
      voice.stopSpeaking();
      setSpeaking(false);
    };
  }, [visible, index, beats, voiceMuted, preferences.autoNarration]);

  // The monk's entrance and the cloud's float-up now live in `SpeechCloud`,
  // shared with the guide in `BuddhaChat` so the two cannot drift apart.

  if (!visible || beats.length === 0) return null;

  const beat = beats[Math.min(index, beats.length - 1)];
  const isLast = index >= beats.length - 1;
  const isDiscovery = beat.kind === 'discovery';

  const next = () => {
    if (isLast) {
      voice.stopSpeaking();
      setShowUnlock(true);
      setTimeout(() => setConfetti(true), 80);
      return;
    }
    setIndex((i) => i + 1);
  };

  const back = () => setIndex((i) => Math.max(0, i - 1));

  const handleUnlockClose = () => {
    voice.stopSpeaking();
    setShowUnlock(false);
    onComplete(siteId);
  };

  const handleQuestsFromUnlock = () => {
    voice.stopSpeaking();
    setShowUnlock(false);
    onComplete(siteId);
    onOpenQuests?.();
  };

  const handleDismiss = () => {
    voice.stopSpeaking();
    onDismiss();
  };

  const toggleVoice = () => {
    if (speaking) {
      voice.stopSpeaking();
      setVoiceMuted(true);
      setSpeaking(false);
    } else {
      setVoiceMuted(false);
    }
  };

  return (
    <>
      <SpeechCloud
        eyebrow={isDiscovery ? '✦  WISDOM UNLOCKED' : beat.eyebrow.toUpperCase()}
        eyebrowAccessory={
          <Pressable
            onPress={toggleVoice}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={speaking ? 'Pause voice' : 'Play voice'}
            style={[styles.voicePill, speaking && styles.voicePillPlaying]}
          >
            <RNText style={[styles.voiceTxt, speaking && styles.voiceTxtPlaying]}>
              {speaking ? '🔊 Voice' : '🔈 Voice'}
            </RNText>
          </Pressable>
        }
        onClose={handleDismiss}
        onBackdropPress={next}
        animationKey={index}
        footer={
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
              <RNText style={styles.nextBtnTxt}>{isLast ? '✦  Claim' : 'Next  →'}</RNText>
            </Pressable>
          </View>
        }
      >
        {isDiscovery ? (
          <DiscoveryBeat siteName={site?.name ?? ''} />
        ) : (
          <BeatBody beat={beat} />
        )}
      </SpeechCloud>

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
  voicePill: {
    backgroundColor: 'rgba(180, 71, 42, 0.08)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: 'rgba(180, 71, 42, 0.25)',
  },

  voicePillPlaying: {
    backgroundColor: '#B4472A',
    borderColor: '#B4472A',
  },

  voiceTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B4472A',
    letterSpacing: 0.4,
  },

  voiceTxtPlaying: {
    color: '#FFFFFF',
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
    flexShrink: 1,
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

  pipDone: {
    backgroundColor: colors.sandstone,
  },

  pipCurrent: {
    backgroundColor: colors.sandstone,
    width: 16,
  },

  nextBtn: {
    flexShrink: 0,
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  progressBox: {
    width: '100%',
    backgroundColor: 'rgba(183, 155, 114, 0.08)',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginVertical: spacing.xxs,
  },

  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.sandstoneDeep,
  },

  progressPts: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  track: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: radii.full,
    overflow: 'hidden',
  },

  fill: {
    height: '100%',
    backgroundColor: colors.sandstone,
    borderRadius: radii.full,
  },

  toNext: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
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


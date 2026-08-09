import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GreetingMonk } from '@/components/monk';
import { SiteVisual } from '@/components/site';
import { Citation } from '@/components/source';
import { Button, Text } from '@/components/ui';
import { buildStory, type StoryBeat } from '@/core';
import { findSource } from '@/data';
import { arrival } from '@/services';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';

/**
 * A place, told rather than displayed.
 *
 * Deliberately not a sheet and not a route. It sits over the world with the map
 * still visible behind and below it, because the thing being described is the
 * ground the player is standing on — covering that with a page would put a
 * document between them and the place, which is the reading experience this
 * screen exists to replace.
 *
 * Every line comes from `core/story`, which arranges material the app already
 * holds and can cite. The guide has no voice of its own: no beat here is
 * written about any particular monument, and a site with thin material gets a
 * short sequence rather than an invented one.
 */

export type StorySequenceProps = {
  siteId: string;
  visible: boolean;
  /** Called once, when the last beat is passed. Never on dismissal. */
  onComplete: (siteId: string) => void;
  onDismiss: () => void;
};

export function StorySequence({ siteId, visible, onComplete, onDismiss }: StorySequenceProps) {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [index, setIndex] = useState(0);

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

  // A new place starts at its beginning. Without this, walking from one
  // monument to the next opened the second one on the first one's last beat.
  useEffect(() => setIndex(0), [siteId]);

  /**
   * The guide enters from the right, once per sequence.
   *
   * Driven by a ref rather than state so the slide does not re-run on every
   * beat — the guide arrives with the story and stays for it, which is what
   * makes the NEXT taps feel like one conversation rather than five popups.
   */
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) {
      slide.setValue(0);
      return;
    }
    Animated.timing(slide, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide, siteId]);

  if (!visible || beats.length === 0) return null;

  const beat = beats[Math.min(index, beats.length - 1)];
  const isLast = index >= beats.length - 1;

  const next = () => {
    if (isLast) {
      onComplete(siteId);
      return;
    }
    setIndex((i) => i + 1);
  };

  /**
   * Back a beat.
   *
   * A sequence you can only go forward through is a sequence you cannot reread,
   * and these beats are short by design — missing one is a tap, not an act of
   * carelessness. It stops at the first rather than closing, because the close
   * control is already in the corner and a Back that sometimes exits is a Back
   * nobody trusts.
   */
  const back = () => setIndex((i) => Math.max(0, i - 1));
  const canGoBack = index > 0;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing.base }]} pointerEvents="box-none">
      {/* Tapping the world behind steps the story on too. A NEXT button people
          must hit precisely is a worse guide than one that takes any tap. */}
      <Pressable style={styles.backdrop} onPress={next} accessibilityRole="button" accessibilityLabel="Next" />

      <Animated.View
        style={[
          styles.guide,
          {
            opacity: slide,
            transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }],
          },
        ]}
        pointerEvents="none"
      >
        <GreetingMonk height={168} />
      </Animated.View>

      <View style={styles.panel}>
        <View style={styles.beatHead}>
          <Text variant="label" tone="sandstone" uppercase>
            {beat.eyebrow}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close the story"
            onPress={onDismiss}
            hitSlop={12}
          >
            <Text variant="body" tone="muted">
              ✕
            </Text>
          </Pressable>
        </View>

        <StoryBeatBody beat={beat} siteId={siteId} />

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous"
              accessibilityState={{ disabled: !canGoBack }}
              disabled={!canGoBack}
              onPress={back}
              hitSlop={10}
              style={[styles.backStep, !canGoBack && styles.backStepOff]}
            >
              <Text variant="body" tone={canGoBack ? 'secondary' : 'muted'}>
                ‹
              </Text>
            </Pressable>
            <Pips count={beats.length} at={index} />
          </View>
          <Button
            label={isLast ? 'Claim' : 'Next  →'}
            onPress={next}
            accessibilityHint={
              isLast ? 'Records what you learned here' : 'Shows the next part of the story'
            }
          />
        </View>
      </View>
    </View>
  );
}

function StoryBeatBody({ beat, siteId }: { beat: StoryBeat; siteId: string }) {
  const source = beat.sourceId ? findSource(beat.sourceId) : undefined;

  if (beat.kind === 'discovery') {
    return (
      <View style={styles.discovery}>
        {/* The place itself, as the thing that was unlocked. A discovery card
            with only a name on it is a receipt; with the place on it, it is
            somewhere you have just been told about. */}
        <SiteVisual siteId={siteId} height={140} radius={radii.lg} style={styles.discoveryImage} />
        <Text variant="heading" center>
          {beat.body}
        </Text>
        <Text variant="caption" tone="muted" center>
          History discovered · wisdom gained
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.beatBody}>
      {/* The opening beat shows the place. The rest do not: an image repeated
          behind every line stops being information and becomes wallpaper. */}
      {beat.kind === 'arrival' ? <SiteVisual siteId={siteId} height={132} /> : null}
      {/* The passage in its own language stands above the gloss, as it does
          everywhere else in the app — a translation presented alone is a claim
          about a text rather than the text. */}
      {beat.original ? (
        <Text variant="body" tone="sandstone" style={styles.original}>
          {beat.original}
        </Text>
      ) : null}

      <Text variant="body">{beat.body}</Text>

      {source ? (
        <Citation source={source} index={1} onPress={() => undefined} />
      ) : null}
    </View>
  );
}

/** Where you are in the sequence, without a number. */
function Pips({ count, at }: { count: number; at: number }) {
  return (
    <View style={styles.pips} accessibilityLabel={`Step ${at + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.pip, i <= at && styles.pipOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Barely there. The world stays legible behind the story, which is the
    // difference between a guide standing in a place and a page about it.
    backgroundColor: 'rgba(37, 42, 39, 0.28)',
  },
  guide: {
    alignSelf: 'flex-end',
    marginRight: -spacing.sm,
    marginBottom: -spacing.sm,
  },
  panel: {
    marginHorizontal: spacing.base,
    padding: spacing.base,
    gap: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.sandstone,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  beatHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  beatBody: { gap: spacing.sm },
  original: { fontStyle: 'italic' },
  discovery: { gap: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  discoveryMark: { fontSize: 34 },
  discoveryImage: { width: '100%' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backStep: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backStepOff: { opacity: 0.35 },
  pips: { flexDirection: 'row', gap: 6 },
  pip: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  pipOn: { backgroundColor: colors.sandstone },
});

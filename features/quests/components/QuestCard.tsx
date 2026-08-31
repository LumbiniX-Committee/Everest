import { useCallback } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ProgressRing, Text } from '@/components/ui';
import { findSite, nowImageForSite } from '@/data';
import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';
import type { QuestWithProgress } from '@/types';

import { QuestCategoryBadge } from './QuestCategoryBadge';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type QuestCardProps = {
  quest: QuestWithProgress;
  onPress: () => void;
};

/**
 * A quest, led by the place it happens in.
 *
 * This card used to be six runs of text and a hairline bar — a title, a
 * subtitle, a category, a duration, a task count, a percentage. Every quest
 * looked like every other quest, and a survey of the Maya Devi Temple was
 * indistinguishable at a glance from a walk through the monastic zone.
 *
 * Three of the four quests target a site the app already carries a photograph
 * of, bundled and unused. Showing it is the difference between reading about
 * somewhere and recognising it, and recognition is what gets someone to stand
 * up and go.
 *
 * Where no photograph exists the card falls back to type on the plain surface
 * rather than to a grey rectangle. A placeholder that says "no image" is worse
 * than a card that never promised one.
 */
export function QuestCard({ quest, onPress }: QuestCardProps) {
  const { progress, tasks, category, title, subtitle, estimatedMinutes } = quest;
  const { pulse } = useHaptics();
  const scale = useSharedValue(1);

  const completedCount = progress.completedTasks.length;
  const isCompleted = progress.status === 'completed';
  const isInProgress = progress.status === 'in_progress';
  const arrivalTask = tasks.find((task) => task.autoComplete === 'arrival');
  const reached = arrivalTask ? progress.completedTasks.includes(arrivalTask.id) : false;

  // The first site any task names. Quests are built around a place, and the
  // first task is the one that takes you there.
  const siteId = tasks.map((task) => task.targetId).find(Boolean);
  const canonicalId = siteId ? findSite(siteId)?.id ?? siteId : undefined;
  const image = canonicalId ? nowImageForSite(canonicalId) : undefined;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 350, mass: 0.8 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 280, mass: 0.8 });
  }, [scale]);

  const handlePress = useCallback(() => {
    pulse(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress, pulse]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Quest: ${title}`}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      {image ? (
        <View style={styles.hero}>
          <Image source={image} style={styles.heroImage} resizeMode="cover" />
          {/*
            A scrim, not a tint, and its opacity is measured rather than
            judged. White type over the scrim has to stay legible in the worst
            case — a blown-out sky directly underneath it — so the figure is
            computed against a pure white backing:

              0.62 -> 4.28:1   fails AA for body text
              0.72 -> 5.85:1   passes with margin

            0.62 looked right and was not. This is the one place in the app
            where type sits on a photograph, so it is the one place that has to
            be checked rather than eyeballed.
          */}
          <View style={styles.scrim} />
          <View style={styles.heroText}>
            <Text variant="heading" style={styles.heroTitle} numberOfLines={2}>
              {title}
            </Text>
          </View>

          {isCompleted || isInProgress ? (
            <View style={styles.heroRing}>
              <ProgressRing completed={completedCount} total={tasks.length} size={44} />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.headRow}>
          <QuestCategoryBadge category={category} />
          {isCompleted ? (
            <Text variant="label" uppercase style={styles.completedTag}>
              Completed
            </Text>
          ) : arrivalTask ? (
            <Text variant="label" uppercase style={reached ? styles.reachedTag : styles.visitTag}>
              {reached ? 'Reached' : 'Visit to begin'}
            </Text>
          ) : null}
        </View>

        {/* Without a hero the title has nowhere else to be. */}
        {image ? null : (
          <Text variant="heading" style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        )}

        <Text variant="body" tone="secondary" numberOfLines={2}>
          {subtitle}
        </Text>

        <View style={styles.footRow}>
          <View style={styles.meta}>
            <Text variant="caption" tone="muted">
              {tasks.length === 1 ? '1 task' : `${tasks.length} tasks`} · about {estimatedMinutes} minutes
            </Text>
          </View>

          {/* Without a hero the ring has nowhere else to be either. */}
          {!image && (isCompleted || isInProgress) ? (
            <ProgressRing completed={completedCount} total={tasks.length} size={40} />
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },

  hero: { height: 148, backgroundColor: colors.surfaceSecondary },
  heroImage: { width: '100%', height: '100%' },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    backgroundColor: 'rgba(37, 42, 39, 0.72)',
  },
  heroText: { position: 'absolute', left: spacing.base, right: 76, bottom: spacing.md },
  heroTitle: { color: '#FFFFFF' },
  heroRing: { position: 'absolute', right: spacing.base, bottom: spacing.md },

  body: { padding: spacing.base, gap: spacing.sm },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completedTag: { color: colors.resolved },
  reachedTag: { color: colors.alignmentLocked },
  visitTag: { color: colors.textMuted },
  title: {},
  footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { flex: 1 },
});

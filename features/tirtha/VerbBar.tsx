import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Mascot } from '@/components/mascot';
import { Icon, Text } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { WISDOM_TIER_OPTIONS, type WisdomTier } from '@/types';

const DEPTHS = WISDOM_TIER_OPTIONS.filter((option) => option.value !== 'custom');

const DOORS = [
  { key: 'ask', label: 'Ask', hint: 'Answers with sources', icon: 'comment-question-outline', href: '/(main)/dhamma' },
  { key: 'report', label: 'Report', hint: 'Flag it, follow it', icon: 'flag-outline', href: '/(main)/sakshi' },
] as const;

/**
 * The first thing on Explore: the promise, the depth you hear things at, and
 * the three doors into the app.
 *
 * Guide is the dark anchor card, as on the website; Ask and Report sit beside
 * each other underneath. The depth pills set the same remembered preference as
 * every place page, so a visitor can choose how much to hear before arriving.
 * Entrances fade up once and stop under the system's reduced-motion setting.
 */
export function VerbBar() {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  const { selection } = useHaptics();
  const { preferences, update } = usePreferences();
  const current: WisdomTier = preferences.wisdomTier === 'custom' ? 'medium' : preferences.wisdomTier;

  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
        <View pointerEvents="none" style={styles.glow} />
        <Mascot name="guide" height={128} style={styles.guide} />
        <Text variant="label" tone="accent" uppercase>
          Guide
        </Text>
        <Text variant="title" tone="onScrim" style={styles.heroTitle}>
          Know where you are,
        </Text>
        <Text variant="title" tone="accent" style={styles.heroTitleAccent}>
          as deeply as you want.
        </Text>

        <View accessibilityRole="radiogroup" accessibilityLabel={ui('How much to tell')} style={styles.depths}>
          {DEPTHS.map((option) => {
            const selected = option.value === current;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  selection();
                  void update('wisdomTier', option.value);
                }}
                style={[styles.depth, selected && styles.depthSelected]}
              >
                <Text variant={selected ? 'bodyStrong' : 'body'} style={selected ? styles.depthTextSelected : styles.depthText}>
                  {ui(option.label)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ui('Open the guide map')}
          onPress={() => {
            selection();
            router.push('/(main)/tirtha/map');
          }}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Icon name="compass-outline" size={20} color={colors.onAccent} />
          <Text variant="bodyStrong" style={styles.ctaText}>
            Open the guide map
          </Text>
        </Pressable>
      </Animated.View>

      <View style={styles.row}>
        {DOORS.map((door, index) => (
          <Animated.View key={door.key} entering={FadeInDown.duration(420).delay(90 * (index + 1))} style={styles.half}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${ui(door.label)}: ${ui(door.hint)}`}
              onPress={() => {
                selection();
                router.push(door.href);
              }}
              style={({ pressed }) => [styles.door, pressed && styles.doorPressed]}
            >
              <View style={styles.doorIcon}>
                <Icon name={door.icon} size={22} color={colors.primary} />
              </View>
              <Text variant="bodyStrong">{ui(door.label)}</Text>
              <Text variant="caption" tone="secondary">
                {ui(door.hint)}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const GLOW = 220;
const styles = StyleSheet.create({
  wrap: { gap: spacing.md, marginBottom: spacing.lg },
  hero: {
    overflow: 'hidden',
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundDeep,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  glow: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    right: -GLOW / 3,
    top: -GLOW / 3,
    backgroundColor: colors.accentSoft,
  },
  heroTitle: { marginTop: spacing.sm, marginRight: 96 },
  // The guide stands at the card's top-right edge, beside the promise, not over it.
  guide: { position: 'absolute', right: spacing.sm, top: spacing.md },
  heroTitleAccent: { marginTop: -spacing.xs },
  depths: {
    flexDirection: 'row',
    gap: spacing.xxs,
    padding: spacing.xxs,
    marginTop: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.scrimSoft,
    borderWidth: 1,
    borderColor: colors.onScrimBorder,
  },
  depth: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  depthSelected: { backgroundColor: colors.onScrim },
  depthText: { color: colors.onScrim, opacity: 0.8 },
  depthTextSelected: { color: colors.backgroundDeep },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    marginTop: spacing.base,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: colors.onAccent },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  door: {
    flex: 1,
    gap: spacing.xxs,
    padding: spacing.base,
    minHeight: 132,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  doorPressed: { backgroundColor: colors.surfaceSelected },
  doorIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.sm,
  },
});

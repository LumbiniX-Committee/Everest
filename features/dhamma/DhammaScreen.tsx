import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Screen, Text, type IconName } from '@/components/ui';
import { SettingsButton } from '@/components/common';
import { demoDhammaEntries, findSource, type DhammaEntry } from '@/data';
import { useHaptics } from '@/hooks';
import { colors, font, radii, spacing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The face each collection entry wears.
 * Keyed by entry id and matched to what the entry actually rests on — a pillar
 * for the Rummindei inscription, a book for the Pali discourse, a dictionary
 * entry seated in meditation, a leaf for the invitation to test rather than
 * believe. An unmapped entry falls back to the wheel rather than to nothing, so
 * adding a fifth question never leaves a hole in the row.
 */
const ENTRY_ICONS: Record<string, IconName> = {
  'why-lumbini': 'pillar',
  appamada: 'book-open-page-variant-outline',
  'what-is-sakshi': 'meditation',
  ehipassiko: 'leaf',
};
const FALLBACK_ICON: IconName = 'dharmachakra';

function DhammaEntryCard({
  entry,
  source,
  onPress,
}: {
  entry: DhammaEntry;
  source: ReturnType<typeof findSource>;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => (scale.value = withSpring(0.98))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={onPress}
      style={[styles.entryCard, animatedStyle]}
    >
      <View style={styles.iconCircle}>
        <Icon
          name={ENTRY_ICONS[entry.id] ?? FALLBACK_ICON}
          size={24}
          color={colors.heritageGold}
        />
      </View>
      <View style={styles.entryText}>
        <Text variant="heading">{entry.question}</Text>
        {source ? (
          <Text variant="caption" tone="secondary">
            {source.title} · {source.attribution}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-right" size={24} color={colors.primary} />
    </AnimatedPressable>
  );
}

export function DhammaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selection } = useHaptics();
  const [question, setQuestion] = useState('');

  const askTyped = () => {
    const text = question.trim();
    if (!text) return;
    selection();
    router.push({ pathname: '/(main)/dhamma/question', params: { q: text } });
    setQuestion('');
  };

  const canAsk = question.trim().length > 0;

  return (
    // No top safe-area edge: the horizon runs to the very top of the display
    // and the controls are inset manually over it.
    <Screen scroll bleed edges={[]}>
      <View style={styles.hero}>
        <Image source={require('../../assets/dhamma/hero.png')} style={styles.heroImage} />
        <View style={styles.heroShade} pointerEvents="none" />
        {/* Fades the illustration into the page so the band has no hard lower
            edge — the horizon should end, not stop. */}
        <View style={styles.heroFade} pointerEvents="none" />

        <View style={[styles.heroContent, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.heroTopRow}>
            <Text variant="label" tone="sandstone" uppercase style={styles.eyebrow}>
              Dhamma
            </Text>
            <SettingsButton />
          </View>
          <Text variant="display" style={styles.title}>
            Questions
          </Text>
          <Text variant="body" tone="secondary" style={styles.subtitle}>
            Everything here carries a citation you can go and check.
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        {/*
          A composer, not a search box. The magnifier that used to sit here said
          the reply would be a list of results; what actually happens is a
          conversation that keeps going, so the field carries the send mark it
          will carry on the next screen instead.
        */}
        <View style={styles.searchField}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            style={[styles.searchInput, font('body')]}
            placeholder="Ask something about Lumbini or the early record"
            placeholderTextColor={colors.textMuted}
            multiline
            returnKeyType="send"
            onSubmitEditing={askTyped}
            accessibilityLabel="Your question"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask"
            accessibilityState={{ disabled: !canAsk }}
            disabled={!canAsk}
            onPress={askTyped}
            style={({ pressed }) => [
              styles.sendRound,
              !canAsk && styles.sendDisabled,
              pressed && canAsk && styles.pressed,
            ]}
          >
            <Icon name="send" size={21} color={colors.backgroundDeep} />
          </Pressable>
        </View>

        {/*
          Said before asking, not after refusing. Someone who knows the corpus
          is four narrow collections reads a refusal as a fact about the
          collection rather than as the app being evasive.
        */}
        <View style={styles.note}>
          <Icon
            name="information-outline"
            size={18}
            color={colors.textMuted}
          />
          <Text variant="caption" tone="secondary" style={styles.noteText}>
            A small, narrow collection. It will say so when it cannot answer.
          </Text>
        </View>

        <View style={styles.reflectionCard}>
          <View style={styles.reflectionRow}>
            <View style={styles.iconCircleLarge}>
              <Icon
                name="flower-outline"
                size={30}
                color={colors.heritageGold}
              />
            </View>
            <View style={styles.reflectionText}>
              <Text variant="title" style={styles.cardHeading}>
                Reflection companion
              </Text>
              <Text variant="body" tone="secondary">
                Say what is on your mind. It turns that into a few questions, asked one at a
                time in your own words, and ends with a short reflection you can check against
                the canon.
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Begin a reflection"
            onPress={() => {
              selection();
              router.push('/(main)/dhamma/reflect' as never);
            }}
            style={({ pressed }) => [styles.reflectButton, pressed && styles.pressed]}
          >
            <Icon
              name="star-four-points"
              size={18}
              color={colors.sandstoneDeep}
            />
            <Text variant="button" tone="sandstone">
              Begin a reflection
            </Text>
          </Pressable>
        </View>

        <Text variant="title" style={styles.sectionTitle}>
          What it can answer
        </Text>

        <View style={styles.list}>
          {demoDhammaEntries.map((entry) => {
            const source = findSource(entry.citations[0]?.sourceId);
            return (
              <DhammaEntryCard
                key={entry.id}
                entry={entry}
                source={source}
                onPress={() => {
                  selection();
                  router.push({
                    pathname: '/(main)/dhamma/question',
                    params: { questionId: entry.id },
                  });
                }}
              />
            );
          })}
        </View>

        <View style={styles.trust}>
          <Icon name="shield-check" size={26} color={colors.heritageGold} />
          <Text variant="body" tone="secondary" style={styles.trustText}>
            All answers are cited. You can verify every source.
          </Text>
          {/* Watermark. Sits behind the text and never competes with it. */}
          <Icon
            name="flower-outline"
            size={64}
            color={colors.heritageGold}
            style={styles.trustWatermark}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'relative' },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    opacity: 0.48,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: spacing.xxl,
    backgroundColor: colors.background,
    opacity: 0.72,
  },
  heroContent: {
    paddingHorizontal: spacing.gutter,
    // Deep enough that the search field, pulled up by the same amount below,
    // lands over the illustration's lower edge rather than under it.
    paddingBottom: spacing.xxl + spacing.lg,
    gap: spacing.xs,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  eyebrow: { letterSpacing: 2 },
  /*
    Size only. The family comes from the `display` variant, resolved at render —
    a hardcoded `fontFamily` here would be frozen at module scope and would miss
    the real families the moment they finish loading.
  */
  title: { fontSize: 40, lineHeight: 48, letterSpacing: 0 },
  // Held short of the illustration's subject so the two never collide on a
  // narrow display.
  subtitle: { maxWidth: '72%' },

  body: {
    paddingHorizontal: spacing.gutter,
    gap: spacing.base,
    // Lifts the search field over the illustration, as in the reference. Paired
    // with the hero's bottom padding above — change one and change the other.
    marginTop: -(spacing.xxl + spacing.xs),
  },

  searchField: {
    flexDirection: 'row',
    // Bottom, so the send mark stays level with the last line as the field grows.
    alignItems: 'flex-end',
    gap: spacing.sm,
    minHeight: 60,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    // Lifts the field off the illustration it overlaps.
    shadowColor: colors.shadow,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: spacing.xs,
    textAlignVertical: 'center',
  },

  sendRound: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendDisabled: { opacity: 0.35 },

  // `pressed` is shared by the send mark, the reflection button and every entry
  // card. The voice button that used to live beside them is gone: speech
  // recognition needed a development build, so in Expo Go it only ever printed
  // an error under the field, and the field itself was never the slow part.
  pressed: { opacity: 0.7 },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noteText: { flex: 1 },

  reflectionCard: {
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.base,
  },
  reflectionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.base },
  reflectionText: { flex: 1, gap: spacing.xs },
  cardHeading: { fontSize: 20, lineHeight: 26 },
  iconCircleLarge: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reflectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSelected,
  },

  sectionTitle: { fontSize: 24, lineHeight: 30, marginTop: spacing.sm },

  list: { gap: spacing.sm },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryText: { flex: 1, minWidth: 0, gap: spacing.xxs },

  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  trustText: { flex: 1 },
  trustWatermark: {
    position: 'absolute',
    right: -8,
    bottom: -14,
    opacity: 0.28,
  },
});

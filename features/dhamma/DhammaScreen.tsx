import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen, Text } from '@/components/ui';
import { SettingsButton } from '@/components/common';
import { demoDhammaEntries, findSource } from '@/data';
import { colors, radii, spacing } from '@/theme';
import { useVoiceInput } from '@/hooks/useVoiceInput';

/**
 * Dhamma — grounded knowledge.
 *
 * Ask, or browse. Both routes end in the same place, and the browse list is not
 * a fallback: showing what the collection can answer sets an honest expectation
 * of its size before someone types into it.
 *
 * The rule this surface is built on: nothing is asserted without a source, and
 * the source is visible before you tap in. Every visual decision below is in
 * service of that. The source line sits *inside* each card rather than being
 * revealed on tap; the footer states the guarantee in the same breath as the
 * list; and the collection's smallness is admitted above the fold rather than
 * discovered on a refusal.
 *
 * ── On the illustration ─────────────────────────────────────────────────────
 *
 * The header image is decorative and drawn, not photographic, and it depicts no
 * identifiable monument as it stands today. That distinction matters on this
 * app more than most: everywhere else an image of a place is *evidence*, ranked
 * by an evidence tier. Here it is a horizon. It carries no caption and no tier
 * badge precisely because it makes no claim — and it stays abstract so it can
 * never be mistaken for the archive plates in Sākṣī, which do.
 */

/** Serif, for the two display headings only. */
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

/**
 * The face each collection entry wears.
 *
 * Keyed by entry id and matched to what the entry actually rests on — a pillar
 * for the Rummindei inscription, a book for the Pali discourse, a dictionary
 * entry seated in meditation, a leaf for the invitation to test rather than
 * believe. An unmapped entry falls back to the wheel rather than to nothing, so
 * adding a fifth question never leaves a hole in the row.
 */
const ENTRY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'why-lumbini': 'pillar',
  appamada: 'book-open-page-variant-outline',
  'what-is-sakshi': 'meditation',
  ehipassiko: 'leaf',
};
const FALLBACK_ICON: keyof typeof MaterialCommunityIcons.glyphMap = 'dharmachakra';

export function DhammaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState('');
  const voice = useVoiceInput();

  useEffect(() => {
    if (voice.transcript) setQuestion(voice.transcript);
  }, [voice.transcript]);

  const askTyped = () => {
    const text = question.trim();
    if (!text) return;
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
          <Text style={styles.title}>Questions</Text>
          <Text variant="body" tone="secondary" style={styles.subtitle}>
            Everything here carries a citation you can go and check.
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.searchField}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.sandstoneDeep} />
          <TextInput
            value={question}
            onChangeText={setQuestion}
            style={styles.searchInput}
            placeholder="Ask something about Lumbini or the early record"
            placeholderTextColor={colors.textMuted}
            multiline
            returnKeyType="search"
            onSubmitEditing={askTyped}
            accessibilityLabel="Your question"
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask"
            accessibilityState={{ disabled: !canAsk }}
            disabled={!canAsk}
            onPress={askTyped}
            style={({ pressed }) => [
              styles.askButton,
              !canAsk && styles.askButtonDisabled,
              pressed && canAsk && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="chat-outline" size={20} color={colors.surface} />
            <Text variant="button" tone="inverse">
              Ask
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voice.isListening ? 'Stop voice' : 'Voice'}
            accessibilityHint="Speak a Nepali question into the microphone"
            onPress={() => (voice.isListening ? voice.stop() : void voice.start('ne'))}
            style={({ pressed }) => [
              styles.voiceButton,
              voice.isListening && styles.voiceButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name={voice.isListening ? 'stop-circle-outline' : 'waveform'}
              size={20}
              color={colors.sandstoneDeep}
            />
            <Text variant="button" tone="sandstone">
              {voice.isListening ? 'Stop' : 'Voice'}
            </Text>
          </Pressable>
        </View>

        {voice.error ? (
          <Text variant="caption" tone="open">
            {voice.error}
          </Text>
        ) : null}

        {/*
          Said before asking, not after refusing. Someone who knows the corpus
          is four narrow collections reads a refusal as a fact about the
          collection rather than as the app being evasive.
        */}
        <View style={styles.note}>
          <MaterialCommunityIcons
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
              <MaterialCommunityIcons
                name="flower-outline"
                size={30}
                color={colors.sandstoneDeep}
              />
            </View>
            <View style={styles.reflectionText}>
              <Text style={styles.cardHeading}>Reflection companion</Text>
              <Text variant="body" tone="secondary">
                Say what is on your mind. It turns that into a few questions — one at a time, in
                your own words — and ends with a short reflection you can check against the canon.
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Begin a reflection"
            onPress={() => router.push('/(main)/dhamma/reflect' as never)}
            style={({ pressed }) => [styles.reflectButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons
              name="star-four-points"
              size={18}
              color={colors.sandstoneDeep}
            />
            <Text variant="button" tone="sandstone">
              Begin a reflection
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>What it can answer</Text>

        <View style={styles.list}>
          {demoDhammaEntries.map((entry) => {
            const source = findSource(entry.citations[0]?.sourceId);
            return (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                accessibilityLabel={entry.question}
                onPress={() =>
                  router.push({
                    pathname: '/(main)/dhamma/question',
                    params: { questionId: entry.id },
                  })
                }
                style={({ pressed }) => [styles.entryCard, pressed && styles.pressed]}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name={ENTRY_ICONS[entry.id] ?? FALLBACK_ICON}
                    size={24}
                    color={colors.sandstoneDeep}
                  />
                </View>
                <View style={styles.entryText}>
                  <Text variant="heading">{entry.question}</Text>
                  {/*
                    The provenance, before the tap rather than after it. A reader
                    deciding whether a question is worth opening is really asking
                    what stands behind the answer, and making them open it to
                    find out is the small evasion this surface exists to avoid.
                  */}
                  {source ? (
                    <Text variant="caption" tone="secondary">
                      {source.title} · {source.attribution}
                    </Text>
                  ) : null}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.sandstoneDeep}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.trust}>
          <MaterialCommunityIcons name="shield-check" size={26} color={colors.sandstoneDeep} />
          <Text variant="body" tone="sandstone" style={styles.trustText}>
            All answers are cited. You can verify every source.
          </Text>
          {/* Watermark. Sits behind the text and never competes with it. */}
          <MaterialCommunityIcons
            name="flower-outline"
            size={64}
            color={colors.sandstone}
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
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: spacing.xl,
    backgroundColor: colors.background,
    opacity: 0.55,
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
  title: {
    fontFamily: SERIF,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    color: colors.textPrimary,
  },
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
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    // Lifts the field off the illustration it overlaps.
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    textAlignVertical: 'center',
  },

  actions: { flexDirection: 'row', gap: spacing.md },
  askButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.sandstoneDeep,
  },
  askButtonDisabled: { opacity: 0.45 },
  voiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.sandstone,
    backgroundColor: colors.surface,
  },
  voiceButtonActive: { backgroundColor: colors.surfaceSecondary },
  pressed: { opacity: 0.7 },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noteText: { flex: 1 },

  reflectionCard: {
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.base,
  },
  reflectionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.base },
  reflectionText: { flex: 1, gap: spacing.xs },
  cardHeading: {
    fontFamily: SERIF,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  iconCircleLarge: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
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
    borderColor: colors.sandstone,
  },

  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  list: { gap: spacing.md },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  entryText: { flex: 1, gap: spacing.xxs },

  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
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

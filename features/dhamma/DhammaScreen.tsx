import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen, Text } from '@/components/ui';
import { SettingsButton } from '@/components/common';
import { demoDhammaEntries, findSource } from '@/data';
import { colors, radii, spacing } from '@/theme';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export function DhammaScreen() {
  const router = useRouter();
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

  return (
    <Screen scroll>

      {/* ── Full-width header banner with illustration ────────────── */}
      <ImageBackground
        source={require('@/assets/dhamma/dhamma-hero.png')}
        resizeMode="stretch"
        imageStyle={styles.bannerImage}
        style={styles.banner}
      >
        <View style={styles.textScrim} />

        {/* Settings icon — top right */}
        <View style={styles.settingsWrap}>
          <SettingsButton />
        </View>

        {/* Text on the left */}
        <View style={styles.headerText}>
          <Text variant="label" tone="sandstone" uppercase style={styles.eyebrow}>
            Dhamma
          </Text>
          <Text variant="title" style={styles.titleText}>Questions</Text>
          <Text variant="body" tone="secondary" style={styles.subtitle}>
            Everything here carries a citation you can go and check.
          </Text>
        </View>

        {/* Illustration on the right */}
        <View style={styles.scene}>
          {/* Sun */}
          <View style={styles.sun} />
          {/* Birds */}
          <View style={[styles.bird, { top: 14, right: 50 }]} />
          <View style={[styles.bird, { top: 8, right: 32 }]} />
          <View style={[styles.bird, { top: 18, right: 16 }]} />
          {/* Temple / stupa */}
          <View style={styles.templeGroup}>
            <View style={styles.templeSpire} />
            <View style={styles.templeRoof} />
            <View style={styles.templeBody} />
          </View>
        </View>
      </ImageBackground>

      {/* ── Search input card ──────────────────────────────────────── */}
      <View style={styles.inputCard}>
        <View style={styles.searchIcon}>
          <View style={styles.searchCircle} />
          <View style={styles.searchHandle} />
        </View>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          style={styles.input}
          placeholder="Ask something about Lumbini or the early record"
          placeholderTextColor={colors.textMuted}
          multiline
          returnKeyType="search"
          onSubmitEditing={askTyped}
          accessibilityLabel="Your question"
        />
      </View>

      {/* ── Ask + Voice buttons ────────────────────────────────────── */}
      {voice.error ? (
        <Text variant="caption" tone="muted" style={styles.voiceError}>
          {voice.error}
        </Text>
      ) : null}
      <View style={styles.btnRow}>
        <Pressable
          onPress={askTyped}
          disabled={!question.trim()}
          style={({ pressed }) => [
            styles.askBtn,
            !question.trim() && styles.btnDisabled,
            pressed && question.trim() && styles.askBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ask"
        >
          {/* Chat bubble icon */}
          <View style={styles.chatIcon}>
            <View style={styles.chatBubble} />
            <View style={styles.chatTail} />
          </View>
          <Text variant="button" style={styles.askLabel}>Ask</Text>
        </Pressable>

        <Pressable
          onPress={() => (voice.isListening ? voice.stop() : void voice.start('ne'))}
          style={({ pressed }) => [styles.voiceBtn, pressed && styles.voiceBtnPressed]}
          accessibilityRole="button"
          accessibilityHint="Speak a Nepali question into the microphone"
        >
          {/* Sound wave icon */}
          <View style={styles.waveIcon}>
            <View style={[styles.wavebar, { height: 4 }]} />
            <View style={[styles.wavebar, { height: 10 }]} />
            <View style={[styles.wavebar, { height: 14 }]} />
            <View style={[styles.wavebar, { height: 10 }]} />
            <View style={[styles.wavebar, { height: 4 }]} />
          </View>
          <Text variant="button" style={styles.voiceLabel}>
            {voice.isListening ? 'Stop' : 'Voice'}
          </Text>
        </Pressable>
      </View>

      {/* ── Collection notice ──────────────────────────────────────── */}
      <View style={styles.notice}>
        <View style={styles.infoIcon}>
          <Text variant="caption" style={styles.infoText}>i</Text>
        </View>
        <Text variant="caption" tone="muted" style={styles.noticeLabel}>
          A small, narrow collection. It will say so when it cannot answer.
        </Text>
      </View>

      {/* ── Reflection companion ───────────────────────────────────── */}
      <View style={styles.reflectionCard}>
        {/* Lotus icon on the left */}
        <View style={styles.lotusIcon}>
          <View style={[styles.lotusPetal, { transform: [{ rotate: '-25deg' }] }]} />
          <View style={[styles.lotusPetal, { transform: [{ rotate: '0deg' }] }]} />
          <View style={[styles.lotusPetal, { transform: [{ rotate: '25deg' }] }]} />
          <View style={styles.lotusDot} />
        </View>
        <View style={styles.reflectionBody}>
          <Text variant="heading">Reflection companion</Text>
          <Text variant="body" tone="secondary" style={styles.reflectionDesc}>
            Say what is on your mind. It turns that into a few questions — one at a time, in your own
            words — and ends with a short reflection you can check against the canon.
          </Text>
          <Pressable
            onPress={() => router.push('/(main)/dhamma/reflect' as never)}
            style={({ pressed }) => [styles.reflectBtn, pressed && styles.reflectBtnPressed]}
            accessibilityRole="button"
          >
            <Text variant="caption" style={styles.reflectStar}>✦</Text>
            <Text variant="button" style={styles.reflectLabel}>Begin a reflection</Text>
          </Pressable>
        </View>
      </View>

      {/* ── What it can answer ─────────────────────────────────────── */}
      <Text variant="heading" style={styles.sectionTitle}>What it can answer</Text>

      {demoDhammaEntries.map((entry, index) => {
        const source = findSource(entry.citations[0]?.sourceId);
        return (
          <Pressable
            key={entry.id}
            onPress={() =>
              router.push({
                pathname: '/(main)/dhamma/question',
                params: { questionId: entry.id },
              })
            }
            style={({ pressed }) => [styles.qCard, pressed && styles.qCardPressed]}
            accessibilityRole="button"
            accessibilityLabel={entry.question}
          >
            <View style={styles.qIcon}>
              <QuestionIcon index={index} />
            </View>
            <View style={styles.qBody}>
              <Text variant="heading" style={styles.qTitle}>{entry.question}</Text>
              {source ? (
                <Text variant="caption" tone="muted">
                  {source.title} · {source.attribution}
                </Text>
              ) : null}
            </View>
            <Text variant="body" tone="muted" style={styles.qChevron}>›</Text>
          </Pressable>
        );
      })}

      {/* ── Verification footer ────────────────────────────────────── */}
      <View style={styles.verifyCard}>
        <View style={styles.checkIcon}>
          <View style={styles.checkOuter} />
          <View style={styles.checkMark} />
        </View>
        <Text variant="body" style={styles.verifyText}>
          All answers are cited. You can verify every source.
        </Text>
        {/* Decorative lotus on right */}
        <View style={styles.verifyLotus}>
          <View style={[styles.vLotusPetal, { transform: [{ rotate: '-20deg' }] }]} />
          <View style={[styles.vLotusPetal, { transform: [{ rotate: '0deg' }] }]} />
          <View style={[styles.vLotusPetal, { transform: [{ rotate: '20deg' }] }]} />
        </View>
      </View>

    </Screen>
  );
}

/** Themed icons for each question card. */
function QuestionIcon({ index }: { index: number }) {
  switch (index) {
    case 0:
      // Stupa
      return (
        <>
          <View style={qi.stupaSpire} />
          <View style={qi.stupaRoof} />
          <View style={qi.stupaBase} />
        </>
      );
    case 1:
      // Book
      return (
        <>
          <View style={qi.bookLeft} />
          <View style={qi.bookRight} />
          <View style={qi.bookSpine} />
        </>
      );
    case 2:
      // Seated figure
      return (
        <>
          <View style={qi.figureHead} />
          <View style={qi.figureBody} />
        </>
      );
    default:
      // Leaf
      return (
        <>
          <View style={qi.leaf} />
          <View style={qi.leafStem} />
        </>
      );
  }
}

const qi = StyleSheet.create({
  stupaSpire: { width: 2, height: 10, backgroundColor: colors.sandstone, borderRadius: 1 },
  stupaRoof: { width: 16, height: 10, backgroundColor: colors.sandstone, borderTopLeftRadius: 8, borderTopRightRadius: 8, opacity: 0.8 },
  stupaBase: { width: 20, height: 4, backgroundColor: colors.sandstoneDeep, borderRadius: 1 },
  bookLeft: { position: 'absolute', left: 4, width: 10, height: 14, borderRadius: 2, borderWidth: 1.5, borderColor: colors.sandstone, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  bookRight: { position: 'absolute', right: 4, width: 10, height: 14, borderRadius: 2, borderWidth: 1.5, borderColor: colors.sandstone, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  bookSpine: { width: 2, height: 14, backgroundColor: colors.sandstoneDeep },
  figureHead: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sandstone },
  figureBody: { width: 14, height: 10, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: colors.sandstone, opacity: 0.8, marginTop: 1 },
  leaf: { width: 12, height: 16, borderTopLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1.5, borderColor: colors.sandstone, transform: [{ rotate: '-15deg' }] },
  leafStem: { position: 'absolute', bottom: 2, width: 1.5, height: 10, backgroundColor: colors.sandstoneDeep, transform: [{ rotate: '15deg' }] },
});

const styles = StyleSheet.create({

  // ── Banner ──────────────────────────────────────────────────────────
  banner: {
    height: 360,
    marginHorizontal: -spacing.gutter,
    paddingHorizontal: spacing.gutter,
    position: 'relative',
    marginBottom: -spacing.xxl,
    overflow: 'hidden',
  },
  bannerImage: { opacity: 0.98 },
  textScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '52%',
    bottom: 0,
    backgroundColor: colors.surface,
    opacity: 0.28,
  },
  settingsWrap: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.gutter,
    zIndex: 10,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerText: {
    paddingTop: spacing.xl,
    gap: spacing.xs,
    maxWidth: '48%',
    zIndex: 2,
  },
  eyebrow: { letterSpacing: 1.8, fontSize: 12, marginBottom: spacing.xxs },
  titleText: { fontSize: 36, lineHeight: 42, fontWeight: '700' },
  subtitle: { lineHeight: 22, marginTop: spacing.sm, fontSize: 15 },

  // ── Scene (right side illustration) ─────────────────────────────────
  scene: {
    position: 'absolute',
    top: spacing.sm,
    right: -spacing.sm,
    bottom: 0,
    width: '58%',
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    top: 30,
    right: 52,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    opacity: 0.78,
  },
  bird: {
    position: 'absolute',
    width: 8,
    height: 3,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.sandstoneDeep,
    opacity: 0.45,
  },
  templeGroup: {
    position: 'absolute',
    left: '12%',
    bottom: 18,
    alignItems: 'center',
  },
  templeSpire: { width: 3, height: 28, backgroundColor: colors.sandstoneDeep, opacity: 0.65, borderRadius: 2 },
  templeRoof: { width: 30, height: 19, backgroundColor: colors.sandstone, borderTopLeftRadius: 15, borderTopRightRadius: 15, opacity: 0.6 },
  templeBody: { width: 38, height: 13, backgroundColor: colors.sandstoneDeep, opacity: 0.38, borderRadius: 2 },

  // ── Input card ──────────────────────────────────────────────────────
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
    zIndex: 1,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  searchIcon: {
    marginTop: spacing.xs,
    width: 22,
    height: 22,
    position: 'relative',
  },
  searchCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.sandstone,
  },
  searchHandle: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 7,
    height: 2,
    backgroundColor: colors.sandstone,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },

  // ── Buttons ─────────────────────────────────────────────────────────
  voiceError: { marginBottom: spacing.xs },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  askBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.sandstone,
    borderRadius: radii.lg,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  askBtnPressed: { backgroundColor: colors.sandstoneDeep },
  btnDisabled: { opacity: 0.45 },
  askLabel: { color: colors.surface, fontSize: 16 },
  chatIcon: { width: 18, height: 14, position: 'relative' },
  chatBubble: {
    width: 16,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
    opacity: 0.9,
  },
  chatTail: {
    position: 'absolute',
    bottom: 0,
    left: 2,
    width: 6,
    height: 6,
    backgroundColor: colors.surface,
    opacity: 0.9,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '20deg' }],
  },
  voiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  voiceBtnPressed: { backgroundColor: colors.surfaceSecondary },
  voiceLabel: { color: colors.textPrimary, fontSize: 16 },
  waveIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 16,
  },
  wavebar: {
    width: 2.5,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
  },

  // ── Notice ──────────────────────────────────────────────────────────
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  infoIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  noticeLabel: { flex: 1 },

  // ── Reflection ──────────────────────────────────────────────────────
  reflectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  lotusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0EBE1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lotusPetal: {
    position: 'absolute',
    width: 10,
    height: 16,
    borderRadius: 5,
    backgroundColor: colors.sandstone,
    opacity: 0.6,
  },
  lotusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sandstone,
    zIndex: 1,
  },
  reflectionBody: { flex: 1, gap: spacing.sm },
  reflectionDesc: { lineHeight: 22 },
  reflectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.sandstone,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reflectBtnPressed: { backgroundColor: '#F0EBE1' },
  reflectStar: { color: colors.sandstone, fontSize: 12 },
  reflectLabel: { color: colors.sandstone },

  // ── Question cards ──────────────────────────────────────────────────
  sectionTitle: { marginBottom: spacing.md },
  qCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  qCardPressed: { backgroundColor: colors.surfaceSecondary },
  qIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F0E6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  qBody: { flex: 1, gap: spacing.xxs },
  qTitle: { fontSize: 15 },
  qChevron: { fontSize: 24, color: colors.sandstone },

  // ── Verify footer ───────────────────────────────────────────────────
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EDDF',
    borderRadius: radii.xl,
    padding: spacing.base,
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sandstone,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkOuter: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sandstone,
  },
  checkMark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.surface,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  verifyText: { flex: 1, color: colors.textPrimary },
  verifyLotus: {
    position: 'absolute',
    right: 12,
    bottom: -4,
    flexDirection: 'row',
    opacity: 0.2,
  },
  vLotusPetal: {
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.sandstone,
    marginHorizontal: -3,
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, Screen, Text } from '@/components/ui';
import { LoadingState } from '@/components/common';
import { ChatBubble, ChatComposer, ChatTranscript, SourceList, type ChatTranscriptHandle } from '@/components/chat';
import { SourceDetailSheet } from '@/components/source';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { findDhammaEntry } from '@/data';
import { useKeyboardInset, useSceneBottomGap } from '@/hooks';
import { dhamma } from '@/services';
import type { DhammaLanguage } from '@/services/dhamma';
import { colors, radii, spacing } from '@/theme';
import { isGrounded, type DhammaAnswer, type Source } from '@/types';

/**
 * Ask — a conversation that keeps its evidence.
 *
 * ── Why this is now a chat, when §14 said it must not be ────────────────────
 *
 * §14 forbade chat framing on this surface for a specific reason, not out of
 * taste: the reading order question → answer → sources is what invites the
 * sceptical reading that facts deserve, and a chat log normally throws the
 * sources away — the claim scrolls on, the provenance does not.
 *
 * So the sources stay *inside the turn*. Every companion bubble carries its
 * answer, what that answer rests on, and its citations, in that order, in one
 * block that scrolls as one. You cannot reach the claim without its evidence
 * being the next thing under it. The order §14 wanted is preserved; what changes
 * is that asking a second question no longer means going back and typing into a
 * box on another screen.
 *
 * Still forbidden, and still absent: an assistant persona, a fake typing
 * animation, and any implication that the app is thinking. The wait says
 * "Searching the collections", because that is what is happening.
 *
 * A refusal is a turn like any other, and keeps the part that makes it a trust
 * feature: the sentence, the reason it could not be answered, and any citations
 * that are related without being an answer.
 *
 * What it no longer carries is the furniture. "Collections searched" listed four
 * collection names under every refusal, and "The collection can answer" offered
 * three canned questions as chips. Both were the app talking about its own index
 * rather than about what was asked, and after two refusals the screen was mostly
 * that list. The data is still in `RefusedAnswer`; it simply stops being shown.
 */

/**
 * The labels around an answer, in the language of the answer.
 *
 * A Nepali refusal under an English WHY was the app changing language halfway
 * down its own reply. The reply's language now governs its labels, the way it
 * already does in `ReflectionScreen`.
 */
const L = {
  ne: {
    surface: 'धम्म',
    restsOn: 'यो केमा आधारित छ',
    doesNotSettle: 'यसले के टुंग्याउँदैन',
    sitWith: 'मनन गर्न',
    why: 'किन',
    related: 'सम्बन्धित, तर उत्तर होइन',
    askAnother: 'अर्को प्रश्न सोध्नुहोस्',
    searching: 'संग्रह खोज्दै',
    failed: 'अहिले संग्रह खोज्न सकिएन। फेरि प्रयास गर्नुहोस्।',
  },
  en: {
    surface: 'Dhamma',
    restsOn: 'What this rests on',
    doesNotSettle: 'What this does not settle',
    sitWith: 'To sit with',
    why: 'Why',
    related: 'Related, but not an answer',
    askAnother: 'Ask another question',
    searching: 'Searching the collections',
    failed: 'The collections could not be searched just now. Try again.',
  },
} as const;

type Turn =
  | { id: string; from: 'user'; text: string }
  | { id: string; from: 'companion'; answer: DhammaAnswer; language: DhammaLanguage };

export function DhammaChatScreen({ questionId, query }: { questionId?: string; query?: string }) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSource, setOpenSource] = useState<Source | null>(null);
  const [language, setLanguage] = useState<DhammaLanguage>('ne');

  const transcriptRef = useRef<ChatTranscriptHandle>(null);
  const idRef = useRef(0);
  const nextId = () => `t${(idRef.current += 1)}`;

  /**
   * The composer pins itself above the keyboard, and the transcript gives up the
   * same height so its last turn is not behind the keys.
   *
   * Minus the gap, which is the fix for the dead band in the screenshots: this
   * screen renders inside the tab navigator, so its scene already ends above the
   * window bottom that `useKeyboardInset` measures against. Padding by the whole
   * keyboard height left a strip of exactly the tab bar's height between the
   * composer and the keys.
   */
  const keyboardInset = useKeyboardInset();
  const { ref: sceneRef, onLayout: onSceneLayout, gap: sceneGap } = useSceneBottomGap();
  const bottomPad = Math.max(0, keyboardInset - sceneGap);

  const ask = useCallback(
    async (question: string, asLanguage: DhammaLanguage) => {
      setBusy(true);
      setError(null);
      setTurns((prev) => [...prev, { id: nextId(), from: 'user', text: question }]);
      try {
        const result = await dhamma.ask(question, asLanguage);
        setTurns((prev) => [
          ...prev,
          { id: nextId(), from: 'companion', answer: result.answer, language: asLanguage },
        ]);
      } catch {
        // No fabricated answer and no silent drop. `services/dhamma` already
        // falls back to on-device retrieval, so reaching here means even that
        // failed — which is worth saying plainly.
        setError(L[asLanguage].failed);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  // The opening question arrives as a route parameter — either one the person
  // typed on the Dhamma surface, or a canned entry they tapped.
  const entry = questionId ? findDhammaEntry(questionId) : undefined;
  const openingQuestion = entry?.question ?? query ?? '';
  const askedRef = useRef(false);
  useEffect(() => {
    if (askedRef.current || !openingQuestion) return;
    askedRef.current = true;
    void ask(openingQuestion, language);
  }, [openingQuestion, ask, language]);

  useEffect(() => {
    if (keyboardInset > 0) transcriptRef.current?.scrollToEnd();
  }, [keyboardInset]);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    void ask(text, language);
  };

  /**
   * Switching language re-asks the last question rather than translating the
   * answer already given. Translating a cited answer would separate the words
   * from the passage they were checked against — the reply has to come back
   * through retrieval to still be the thing its citations support.
   */
  const switchLanguage = (next: DhammaLanguage) => {
    if (next === language || busy) return;
    setLanguage(next);
    const lastQuestion = [...turns].reverse().find((turn) => turn.from === 'user');
    if (lastQuestion && lastQuestion.from === 'user') void ask(lastQuestion.text, next);
  };

  return (
    <Screen edges={['top']} contentStyle={styles.fill}>
      <View ref={sceneRef} onLayout={onSceneLayout} style={[styles.fill, { paddingBottom: bottomPad }]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.back}
          >
            <Icon name="chevron-left" size={22} color={colors.textSecondary} />
            <Text variant="label" tone="muted" uppercase>
              {L[language].surface}
            </Text>
          </Pressable>

          {/* The language of the reply, not of the app. See `switchLanguage`. */}
          <View style={styles.languageButtons}>
            <LanguagePill
              label="नेपाली"
              selected={language === 'ne'}
              disabled={busy}
              onPress={() => switchLanguage('ne')}
            />
            <LanguagePill
              label="English"
              selected={language === 'en'}
              disabled={busy}
              onPress={() => switchLanguage('en')}
            />
          </View>
        </View>

        <ChatTranscript ref={transcriptRef}>
          {turns.map((turn) =>
            turn.from === 'user' ? (
              <ChatBubble key={turn.id} from="user">
                <Text variant="body">{turn.text}</Text>
              </ChatBubble>
            ) : (
              <AnswerTurn
                key={turn.id}
                answer={turn.answer}
                language={turn.language}
                onOpenSource={setOpenSource}
              />
            ),
          )}

          {busy ? (
            <View style={styles.thinking}>
              {/*
                The wait names the work. §14 forbids a typing animation, and
                "Searching the collections" is both true and more informative
                than a cursor pretending to compose prose.
              */}
              <LoadingState label={L[language].searching} fill={false} />
            </View>
          ) : null}

          {error ? (
            <ChatBubble from="companion" accent="muted">
              <Text variant="body" tone="secondary">
                {error}
              </Text>
            </ChatBubble>
          ) : null}
        </ChatTranscript>

        <ChatComposer
          value={input}
          onChangeText={setInput}
          onSend={send}
          busy={busy}
          placeholder={L[language].askAnother}
          onGrow={() => transcriptRef.current?.scrollToEnd()}
        />
      </View>

      <SourceDetailSheet source={openSource} onClose={() => setOpenSource(null)} />
    </Screen>
  );
}

/**
 * One reply, with everything that justifies it.
 *
 * `DhammaAnswer` is a discriminated union, so a refusal cannot be dressed as an
 * answer and an answer cannot arrive without the citations that justify it. The
 * guarantee is structural rather than a convention someone has to maintain, and
 * this component is the place it becomes visible.
 */
function AnswerTurn({
  answer,
  language,
  onOpenSource,
}: {
  answer: DhammaAnswer;
  language: DhammaLanguage;
  onOpenSource: (source: Source) => void;
}) {
  const t = L[language];

  if (isGrounded(answer)) {
    const passages = answer.evidence.filter((item) => item.passage);
    return (
      <ChatBubble from="companion" wide>
        <Text variant="bodyLarge">{answer.text}</Text>
        <SpeakButton text={answer.text} language={language} />

        {passages.length > 0 ? (
          <View style={styles.evidence}>
            <Text variant="label" tone="muted" uppercase>
              {t.restsOn}
            </Text>
            {passages.map((item, index) => (
              <Text key={`${item.citation.sourceId}-${index}`} variant="mono" tone="sandstone">
                {item.passage}
              </Text>
            ))}
          </View>
        ) : null}

        {answer.caveat ? (
          <View style={styles.caveat}>
            <Text variant="label" tone="seeking" uppercase>
              {t.doesNotSettle}
            </Text>
            <Text variant="body" tone="secondary">
              {answer.caveat}
            </Text>
          </View>
        ) : null}

        <SourceList citations={answer.citations} onOpenSource={onOpenSource} />

        {answer.reflectionPrompt ? (
          <View style={styles.prompt}>
            <Text variant="label" tone="muted" uppercase>
              {t.sitWith}
            </Text>
            {/*
              A question, left open. No text box and nothing saved — §14 ends its
              sequence at reflection, and an input would turn it into a task. The
              composer below is for the next question, which is a different act.
            */}
            <Text variant="body" tone="secondary">
              {answer.reflectionPrompt}
            </Text>
          </View>
        ) : null}
      </ChatBubble>
    );
  }

  return (
    <ChatBubble from="companion" accent="muted" wide>
      {/*
        §25. The refusal is a trust feature, not an error state: it is set in the
        same type as an answer and says why it could not be answered.
      */}
      <Text variant="bodyLarge">{answer.text}</Text>

      <View style={styles.block}>
        <Text variant="label" tone="muted" uppercase>
          {t.why}
        </Text>
        <Text variant="body" tone="secondary">
          {answer.reason}
        </Text>
      </View>

      {answer.related.length > 0 ? (
        <SourceList
          citations={answer.related}
          label={t.related}
          numbered={false}
          onOpenSource={onOpenSource}
        />
      ) : null}

    </ChatBubble>
  );
}

function LanguagePill({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`Reply in ${label}`}
      disabled={disabled || selected}
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
    >
      <Text variant="caption" tone={selected ? 'sandstone' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  languageButtons: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillSelected: { borderColor: colors.sandstone, backgroundColor: colors.surfaceSecondary },
  thinking: { alignSelf: 'flex-start' },
  evidence: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  caveat: { gap: spacing.xs },
  block: { gap: spacing.xs },
  prompt: { gap: spacing.xs },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, Screen, Text } from '@/components/ui';
import { LoadingState } from '@/components/common';
import { ChatBubble, ChatComposer, ChatTranscript, SourceList, type ChatTranscriptHandle } from '@/components/chat';
import { SourceDetailSheet } from '@/components/source';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { findDhammaEntry } from '@/data';
import { useKeyboardInset } from '@/hooks';
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
 * A refusal is a turn like any other, and keeps everything that makes it a trust
 * feature: the reason, the collections actually searched, related-but-not-an-
 * answer citations, and the questions the collection *can* answer as chips you
 * can tap — which, in a chat, simply asks the next question.
 */

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

  // The composer pins itself above the keyboard; the transcript has to give up
  // the same height or its last turn sits behind the keys.
  const keyboardInset = useKeyboardInset();

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
        setError('The collections could not be searched just now. Try again.');
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
      <View style={[styles.fill, { paddingBottom: keyboardInset }]}>
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
              Dhamma
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
                onAskSuggestion={(suggestion) => void ask(suggestion, language)}
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
              <LoadingState label="Searching the collections" fill={false} />
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
          placeholder="Ask another question"
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
  onAskSuggestion,
}: {
  answer: DhammaAnswer;
  language: DhammaLanguage;
  onOpenSource: (source: Source) => void;
  onAskSuggestion: (suggestion: string) => void;
}) {
  if (isGrounded(answer)) {
    const passages = answer.evidence.filter((item) => item.passage);
    return (
      <ChatBubble from="companion" wide>
        <Text variant="bodyLarge">{answer.text}</Text>
        <SpeakButton text={answer.text} language={language} />

        {passages.length > 0 ? (
          <View style={styles.evidence}>
            <Text variant="label" tone="muted" uppercase>
              What this rests on
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
              What this does not settle
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
              To sit with
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
        same type as an answer, carries what was searched so the reader can see
        it resulted from looking, and always offers somewhere to go next.
      */}
      <Text variant="bodyLarge">{answer.text}</Text>

      <View style={styles.block}>
        <Text variant="label" tone="muted" uppercase>
          Why
        </Text>
        <Text variant="body" tone="secondary">
          {answer.reason}
        </Text>
      </View>

      <View style={styles.block}>
        <Text variant="label" tone="muted" uppercase>
          Collections searched
        </Text>
        {answer.searched.map((collection) => (
          <Text key={collection} variant="caption" tone="secondary">
            {collection}
          </Text>
        ))}
      </View>

      {answer.related.length > 0 ? (
        <SourceList
          citations={answer.related}
          label="Related, but not an answer"
          numbered={false}
          onOpenSource={onOpenSource}
        />
      ) : null}

      {answer.suggestions.length > 0 ? (
        <View style={styles.block}>
          <Text variant="label" tone="muted" uppercase>
            The collection can answer
          </Text>
          {/*
            Chips rather than links to another screen. In a chat, tapping one is
            simply asking it — the refusal stays above as the reason the second
            question is being asked at all.
          */}
          <View style={styles.suggestions}>
            {answer.suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                accessibilityLabel={`Ask: ${suggestion}`}
                onPress={() => onAskSuggestion(suggestion)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
              >
                <Text variant="caption" tone="sandstone">
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
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
  suggestions: { gap: spacing.xs, alignItems: 'flex-start' },
  suggestion: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sandstone,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
});

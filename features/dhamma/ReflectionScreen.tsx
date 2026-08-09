import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Screen, Text } from '@/components/ui';
import { LoadingState } from '@/components/common';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { useKeyboardInset } from '@/hooks';
import { dhamma } from '@/services';
import type { CrisisHelpline, DhammaLanguage } from '@/services/dhamma';
import { colors, radii, spacing } from '@/theme';

/**
 * The reflection companion — a conversation, not a form.
 *
 * You say what is on your mind; the companion turns *that* into three or four
 * questions and asks them one at a time; then it offers a short, cited
 * reflection drawn from the canon. Answers are used for this session only and
 * are never written to the audit log.
 *
 * This is the one conversational surface in Dhamma. The Answer surface is
 * deliberately not a chat (§14: a claim above a citation invites the sceptical
 * reading facts deserve). Reflection is the person's own words, not asserted
 * fact, so a back-and-forth belongs here and only here.
 *
 * Honesty is preserved end to end: distress is caught on every message and
 * answered with verified helplines before anything else; the tailored questions
 * fall back to a fixed deterministic scaffold offline or on any provider
 * failure; and the closing reflection carries its citations and its disclaimer.
 */

type Msg =
  | { id: string; from: 'companion'; kind: 'text'; text: string }
  | { id: string; from: 'companion'; kind: 'question'; text: string; step: number; total: number }
  | {
      id: string;
      from: 'companion';
      kind: 'guidance';
      text: string;
      citations: { segment_id: string; display: string }[];
      disclaimer: string;
      /**
       * Which path produced this. Shown, not hidden: the deterministic
       * reflection is grounded and cited and is a perfectly good answer, but it
       * is not the tailored one, and a reader comparing two sessions deserves to
       * know why they differ. It is also the only way a silent fallback — an
       * unreachable backend, a changed IP — is visible at all rather than simply
       * looking like the feature quietly got worse.
       */
      tier: 'full_rag' | 'fallback';
    }
  | { id: string; from: 'user'; text: string };

type Phase = 'intro' | 'answering' | 'synthesizing' | 'done' | 'crisis';

// Omit that distributes over the union, so each variant keeps its own fields
// (a plain Omit<Msg, 'id'> collapses to only the keys common to every variant).
// Distribution requires a generic type parameter, hence the helper.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type DraftMsg = DistributiveOmit<Msg, 'id'>;

const T = {
  ne: {
    eyebrow: 'Dhamma · आत्म-चिन्तन सहयात्री',
    intro:
      'म तपाईंको ठाउँमा उत्तर दिनेछैनँ। तपाईंको मनमा आज के छ, आफ्नै शब्दमा भन्नुहोस् — त्यसैका आधारमा म केही प्रश्न सोध्नेछु।',
    sharePlaceholder: 'तपाईंको मनमा आज के छ…',
    answerPlaceholder: 'आफ्नै शब्दमा लेख्नुहोस्…',
    send: 'पठाउनुहोस्',
    thinkingQuestions: 'तपाईंले भन्नुभएको कुरामा ध्यान दिँदै',
    thinkingGuidance: 'तपाईंको प्रतिबिम्ब तयार गर्दै',
    questionOf: (n: number, total: number) => `प्रश्न ${n} / ${total}`,
    reflection: 'तपाईंको प्रतिबिम्ब',
    sources: 'जाँच्न सकिने स्रोत',
    startAgain: 'फेरि सुरु गर्नुहोस्',
    back: 'फिर्ता',
    crisisTitle: 'अहिले मानवीय सहयोग रोज्नुहोस्',
    crisisMessage:
      'यदि तपाईं गम्भीर पीडा वा आत्म-हानिको विचारमा हुनुहुन्छ भने, कृपया तुरुन्तै सहयोग सेवामा सम्पर्क गर्नुहोस्। तपाईं यो एक्लै बोक्नुपर्दैन।',
    retry: 'फेरि प्रयास गर्नुहोस्',
    error: 'सेवा अहिले उपलब्ध छैन। नेटवर्क जाँचेर फेरि प्रयास गर्नुहोस्।',
    offlineNote: 'यो प्रतिबिम्ब यहीँ यन्त्रमा, सङ्ग्रहबाट तयार भयो — तपाईंकै शब्दमा ढालिएको होइन।',
  },
  en: {
    eyebrow: 'Dhamma · Reflection companion',
    intro:
      'I will not answer in your place. Tell me what is on your mind today, in your own words — I will turn that into a few questions and ask them one at a time.',
    sharePlaceholder: 'What is on your mind today…',
    answerPlaceholder: 'Write in your own words…',
    send: 'Send',
    thinkingQuestions: 'Sitting with what you said',
    thinkingGuidance: 'Preparing your reflection',
    questionOf: (n: number, total: number) => `Question ${n} of ${total}`,
    reflection: 'Your reflection',
    sources: 'Sources to check',
    startAgain: 'Start again',
    back: 'Back',
    crisisTitle: 'Choose human support now',
    crisisMessage:
      'If you are in acute distress or having thoughts of self-harm, please reach out to support services right away. You do not have to carry this alone.',
    retry: 'Try again',
    error: 'The service is unavailable. Check the connection and try again.',
    offlineNote: 'Prepared on this device from the collection — not shaped around your own words.',
  },
} as const;

export function ReflectionScreen({ siteId }: { siteId?: string }) {
  const router = useRouter();
  const [language, setLanguage] = useState<DhammaLanguage>('ne');
  const [phase, setPhase] = useState<Phase>('intro');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [opening, setOpening] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<{ message: string; helplines: CrisisHelpline[] } | null>(null);

  // Measured rather than assumed — see hooks/useKeyboardInset. The bottom safe
  // area is applied by this screen instead of by `Screen`, because once the
  // keyboard is up it occupies that space and padding for both would leave the
  // input floating above the keys.
  const keyboardInset = useKeyboardInset();
  const insets = useSafeAreaInsets();

  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(0);
  const nextId = () => `m${(idRef.current += 1)}`;
  const t = T[language];

  const push = useCallback((msg: DraftMsg) => {
    setMessages((prev) => [...prev, { ...msg, id: `m${(idRef.current += 1)}` } as Msg]);
  }, []);

  // Seed the opening invitation, and reseed if the language is changed before
  // the conversation starts.
  useEffect(() => {
    if (phase !== 'intro') return;
    idRef.current = 0;
    setMessages([{ id: nextId(), from: 'companion', kind: 'text', text: t.intro }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, phase === 'intro']);

  const scrollToEnd = () => scrollRef.current?.scrollToEnd({ animated: true });

  // Follow the transcript up as the keyboard opens, so the newest question is
  // not left behind the keys the moment someone taps to answer it.
  useEffect(() => {
    if (keyboardInset > 0) scrollToEnd();
  }, [keyboardInset]);

  const enterCrisis = (message: string, helplines: CrisisHelpline[]) => {
    setCrisis({ message, helplines });
    setPhase('crisis');
    push({ from: 'companion', kind: 'text', text: message });
  };

  const synthesise = useCallback(
    async (allAnswers: string[]) => {
      setPhase('synthesizing');
      setLoading(true);
      setError(null);
      try {
        const result = await dhamma.reflect({
          stage: 5,
          answers: [opening, ...allAnswers].filter(Boolean),
          siteId,
          language,
        });
        if (result.distress_override) {
          enterCrisis(result.inquiry, result.helplines ?? []);
          return;
        }
        push({
          from: 'companion',
          kind: 'guidance',
          text: result.guidance ?? result.inquiry,
          citations: result.citations ?? [],
          disclaimer: result.disclaimer,
          tier: result.tier === 'full_rag' ? 'full_rag' : 'fallback',
        });
        setPhase('done');
      } catch {
        setError(t.error);
        setPhase('answering'); // allow a retry from the same answers
      } finally {
        setLoading(false);
      }
    },
    [language, opening, push, siteId, t.error],
  );

  const handleSend = async () => {
    const value = input.trim();
    if (!value || loading) return;
    setInput('');
    setError(null);
    push({ from: 'user', text: value });

    // Safety first, on every message, before any network call.
    const guard = dhamma.distressGuard(value, language);
    if (guard) {
      enterCrisis(guard.message, guard.helplines);
      return;
    }

    if (phase === 'intro') {
      setOpening(value);
      setLoading(true);
      try {
        const result = await dhamma.reflectQuestions({ userInput: value, siteId, language });
        if (result.distress_override) {
          enterCrisis(t.crisisMessage, result.helplines ?? []);
          return;
        }
        // Defended rather than assumed. Both the engine and the API are
        // *contracted* to return three or four usable questions, but this is the
        // one place a bad reply becomes a crash rather than a bad answer: an
        // empty array makes `qs[0]` undefined, which renders "Question 1 of 0"
        // and hands `undefined` to SpeakButton, which throws inside expo-speech.
        // Staying in `intro` keeps what they typed and lets them send again.
        const qs = (Array.isArray(result.questions) ? result.questions : [])
          .filter((question): question is string => typeof question === 'string' && question.trim().length > 0)
          .slice(0, 4);
        if (qs.length === 0) {
          setError(t.error);
          return;
        }
        setQuestions(qs);
        setQIndex(0);
        if (result.opening) push({ from: 'companion', kind: 'text', text: result.opening });
        push({ from: 'companion', kind: 'question', text: qs[0], step: 1, total: qs.length });
        setPhase('answering');
      } catch {
        setError(t.error);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (phase === 'answering') {
      const nextAnswers = [...answers, value];
      setAnswers(nextAnswers);
      if (qIndex + 1 < questions.length) {
        const step = qIndex + 2;
        push({
          from: 'companion',
          kind: 'question',
          text: questions[qIndex + 1],
          step,
          total: questions.length,
        });
        setQIndex(qIndex + 1);
      } else {
        await synthesise(nextAnswers);
      }
    }
  };

  const startAgain = () => {
    setPhase('intro');
    setQuestions([]);
    setQIndex(0);
    setAnswers([]);
    setOpening('');
    setInput('');
    setError(null);
    setCrisis(null);
    // The intro effect reseeds the transcript when phase returns to 'intro'.
  };

  const inputActive = phase === 'intro' || phase === 'answering';
  const placeholder = phase === 'intro' ? t.sharePlaceholder : t.answerPlaceholder;

  return (
    <Screen edges={['top']} contentStyle={styles.fill}>
      <View style={[styles.fill, { paddingBottom: keyboardInset }]}>
        <View style={styles.header}>
          <Text variant="label" tone="muted" uppercase>
            {t.eyebrow}
          </Text>
          {phase === 'intro' ? (
            <View style={styles.languageButtons}>
              <Button
                label="नेपाली"
                variant={language === 'ne' ? 'primary' : 'secondary'}
                onPress={() => language !== 'ne' && setLanguage('ne')}
              />
              <Button
                label="English"
                variant={language === 'en' ? 'primary' : 'secondary'}
                onPress={() => language !== 'en' && setLanguage('en')}
              />
            </View>
          ) : null}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.transcript}
          contentContainerStyle={styles.transcriptContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} language={language} t={t} />
          ))}

          {loading ? (
            <View style={styles.thinking}>
              <LoadingState
                label={phase === 'synthesizing' ? t.thinkingGuidance : t.thinkingQuestions}
                fill={false}
              />
            </View>
          ) : null}

          {crisis ? (
            <View style={styles.crisis}>
              <Text variant="heading">{t.crisisTitle}</Text>
              {crisis.helplines.map((helpline) => (
                <View key={helpline.number} style={styles.helpline}>
                  <Text variant="label">{helpline.name}</Text>
                  <Text variant="bodyLarge" tone="sandstone">
                    {helpline.number}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {helpline.hours}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {error ? (
            <Card style={styles.errorCard}>
              <Text variant="body" tone="secondary">
                {error}
              </Text>
              {phase === 'answering' && answers.length === questions.length && questions.length > 0 ? (
                <Button label={t.retry} variant="secondary" onPress={() => void synthesise(answers)} />
              ) : null}
            </Card>
          ) : null}
        </ScrollView>

        {inputActive ? (
          <View
            style={[
              styles.inputBar,
              // The safe area only needs paying for while the keyboard is down;
              // when it is up the keys already cover that strip.
              { paddingBottom: keyboardInset > 0 ? spacing.md : insets.bottom + spacing.md },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              multiline
              textAlignVertical="top"
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              editable={!loading}
              accessibilityLabel={placeholder}
              // Keeps the caret and the line being typed on screen for a reply
              // long enough to grow past the input's max height.
              onContentSizeChange={scrollToEnd}
            />
            <Button label={t.send} onPress={() => void handleSend()} disabled={!input.trim() || loading} />
          </View>
        ) : (
          <View
            style={[styles.footerActions, { paddingBottom: insets.bottom + spacing.md }]}
          >
            <Button label={t.startAgain} variant="secondary" onPress={startAgain} />
            <Button label={t.back} variant="quiet" onPress={() => router.back()} />
          </View>
        )}
      </View>
    </Screen>
  );
}

function MessageBubble({
  msg,
  language,
  t,
}: {
  msg: Msg;
  language: DhammaLanguage;
  t: (typeof T)['en'] | (typeof T)['ne'];
}) {
  if (msg.from === 'user') {
    return (
      <View style={[styles.bubble, styles.userBubble]}>
        <Text variant="body">{msg.text}</Text>
      </View>
    );
  }

  if (msg.kind === 'question') {
    return (
      <View style={[styles.bubble, styles.companionBubble, styles.questionBubble]}>
        <Text variant="caption" tone="muted" uppercase>
          {t.questionOf(msg.step, msg.total)}
        </Text>
        <Text variant="bodyLarge">{msg.text}</Text>
        <SpeakButton text={msg.text} language={language} />
      </View>
    );
  }

  if (msg.kind === 'guidance') {
    return (
      <View style={[styles.bubble, styles.companionBubble]}>
        <Text variant="label" tone="muted" uppercase>
          {t.reflection}
        </Text>
        <Text variant="bodyLarge">{msg.text}</Text>
        <SpeakButton text={msg.text} language={language} />
        {msg.citations.length > 0 ? (
          <View style={styles.sources}>
            <Text variant="label" tone="muted" uppercase>
              {t.sources}
            </Text>
            {/*
              Deduplicated by segment. `core/dhamma` now collapses a passage
              cited twice before it reaches here, but the render must not be
              what breaks if a duplicate ever arrives — a repeated segment id is
              a repeated React key, and listing one passage twice would imply
              two independent sources for the same reflection.
            */}
            {msg.citations
              .filter(
                (citation, index, all) =>
                  all.findIndex((other) => other.segment_id === citation.segment_id) === index,
              )
              .map((citation) => (
                <Text key={citation.segment_id} variant="mono" tone="sandstone">
                  {citation.display} · [{citation.segment_id}]
                </Text>
              ))}
          </View>
        ) : null}
        {msg.tier === 'fallback' ? (
          <Text variant="caption" tone="seeking">
            {t.offlineNote}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {msg.disclaimer}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubble, styles.companionBubble]}>
      <Text variant="body">{msg.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 0 },
  header: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  languageButtons: { flexDirection: 'row', gap: spacing.sm },
  transcript: { flex: 1 },
  transcriptContent: {
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  bubble: {
    maxWidth: '88%',
    padding: spacing.base,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  companionBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: radii.sm,
  },
  questionBubble: {
    borderLeftWidth: 3,
    borderLeftColor: colors.sandstone,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderTopRightRadius: radii.sm,
  },
  thinking: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  sources: {
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.background,
    borderRadius: radii.md,
  },
  crisis: { gap: spacing.md, paddingVertical: spacing.md },
  helpline: {
    gap: spacing.xs,
    padding: spacing.base,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
  },
  errorCard: { gap: spacing.md },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

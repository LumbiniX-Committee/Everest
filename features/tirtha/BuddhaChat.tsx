import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';

import { GreetingMonk } from '@/components/monk';
import {
  ChatBubble,
  ChatComposer,
  ChatTranscript,
  SourceList,
  type ChatTranscriptHandle,
} from '@/components/chat';
import { Icon, Text } from '@/components/ui';
import { useKeyboardInset } from '@/hooks';
import { dhamma as dhammaService, voice } from '@/services';
import { colors, radii, spacing } from '@/theme';
import { isGrounded, type DhammaAnswer } from '@/types';

/**
 * The guide you can ask, from where you are standing.
 *
 * It answers through `dhamma.ask` — the same retrieval, the same grounding
 * gates and the same refusals as the Dhamma surface. There is one corpus and one
 * way into it; this is a door, not a second engine. The site name is prepended
 * to the question the way `AskThisPlace` does, so "when was it built" means this
 * place rather than nothing in particular.
 *
 * ── The four reasons it appeared not to answer ──────────────────────────────
 *
 * 1. Text-to-speech shared the `try` with the request. `voice.speakText` throws
 *    on a device with no speech engine, and the catch then replaced a perfectly
 *    good answer with "could not reach the corpus". The answer is committed to
 *    state before anything is spoken now, and speech has its own guard: it is a
 *    nicety, and a nicety must not be able to discard the content.
 * 2. `KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' :
 *    undefined}` — a no-op on Android, inside a Modal that lacked
 *    `statusBarTranslucent` and so did not resize under edge-to-edge. The
 *    keyboard covered the field and what you typed was invisible while you
 *    typed it. `ChatComposer` measures the keyboard instead.
 * 3. The bubble had no height limit and nothing to scroll it, so a long answer
 *    grew off the top of the screen and its opening sentence could not be read.
 * 4. The typewriter ran at 14 ms a character — eleven seconds for a long answer,
 *    with no way to skip. It is faster now, and a tap finishes it.
 *
 * Citations were also being discarded: the reply rendered `answer.text` and
 * nothing else. On a surface whose whole claim is that answers are checkable,
 * that was the most expensive omission of the four.
 */

/**
 * Reveals text a character at a time, and stops pretending when asked.
 *
 * This is decoration, not a claim about thinking — the reply is already
 * complete in state before the first character appears, and `skip` shows all of
 * it immediately. §14 forbids an animation that implies composition; this one
 * is a reveal of something already written, and it can always be cut short.
 */
function useTypingText(text: string, speed = 6): { displayed: string; done: boolean; skip: () => void } {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      // Several characters a tick rather than one: at one character per 14 ms a
      // three-hundred-character answer took four seconds to become readable.
      i = Math.min(text.length, i + 3);
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return {
    displayed,
    done: displayed.length >= text.length,
    skip: () => setDisplayed(text),
  };
}

type Turn =
  | { id: string; from: 'user'; text: string }
  | { id: string; from: 'guide'; answer: DhammaAnswer }
  | { id: string; from: 'guide'; failure: string };

export type BuddhaChatProps = {
  visible: boolean;
  onClose: () => void;
  siteName?: string;
};

export function BuddhaChat({ visible, onClose, siteName }: BuddhaChatProps) {
  // The bottom safe area is `ChatComposer`'s business, not this screen's — it is
  // the thing that sits against the edge.
  const keyboardInset = useKeyboardInset();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const transcriptRef = useRef<ChatTranscriptHandle>(null);
  const idRef = useRef(0);
  const nextId = () => `b${(idRef.current += 1)}`;

  const avatarSlide = useRef(new Animated.Value(0)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      avatarSlide.setValue(0);
      avatarOpacity.setValue(0);
      setTurns([]);
      setQuestion('');
      setBusy(false);
      voice.stopSpeaking();
      setSpeaking(false);
      return;
    }
    Animated.parallel([
      Animated.timing(avatarSlide, {
        toValue: 1,
        duration: 540,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  useEffect(() => {
    if (keyboardInset > 0) transcriptRef.current?.scrollToEnd();
  }, [keyboardInset]);

  const speak = useCallback((text: string) => {
    // Outside the request's try/catch on purpose. Speech failing must not be
    // able to turn a good answer into an error — see the note at the top.
    try {
      setSpeaking(true);
      voice.speakText(
        text,
        'en',
        () => setSpeaking(false),
        () => setSpeaking(false),
      );
    } catch {
      setSpeaking(false);
    }
  }, []);

  const ask = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q || busy) return;

      voice.stopSpeaking();
      setSpeaking(false);
      setQuestion('');
      setBusy(true);
      setTurns((prev) => [...prev, { id: nextId(), from: 'user', text: q }]);

      let answer: DhammaAnswer | null = null;
      try {
        // The place is part of the question. Without it, "when was it built"
        // retrieves against nothing in particular.
        const asked = siteName ? `${siteName}: ${q}` : q;
        const result = await dhammaService.ask(asked, 'en');
        answer = result.answer;
      } catch {
        answer = null;
      }

      if (answer) {
        setTurns((prev) => [...prev, { id: nextId(), from: 'guide', answer: answer! }]);
        speak(isGrounded(answer) ? answer.text : answer.text || 'I cannot find this in the collections.');
      } else {
        setTurns((prev) => [
          ...prev,
          {
            id: nextId(),
            from: 'guide',
            failure: 'The collections could not be searched just now. Ask again in a moment.',
          },
        ]);
      }
      setBusy(false);
    },
    [busy, siteName, speak],
  );

  const handleClose = useCallback(() => {
    voice.stopSpeaking();
    setSpeaking(false);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const opening = siteName
    ? `What would you like to know about ${siteName}, or the early record?`
    : 'What would you like to know about Lumbini, or the early record?';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
      // Without this the Modal sits under the status bar on Android and does not
      // resize for the keyboard — the same reason BottomSheet sets it.
      statusBarTranslucent
    >
      <View style={s.fill}>
        <Pressable
          style={s.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleClose}
        />

        {/*
          Above the sheet rather than behind it. The monk used to be pinned to
          the bottom of the screen, which is where the conversation now is, so an
          opaque panel would have covered him entirely.
        */}
        <Animated.View
          style={[
            s.avatarWrap,
            {
              opacity: avatarOpacity,
              transform: [
                { translateX: avatarSlide.interpolate({ inputRange: [0, 1], outputRange: [-200, 0] }) },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <GreetingMonk height={190} />
        </Animated.View>

        <View style={[s.sheet, { paddingBottom: keyboardInset }]}>
          <View style={s.header}>
            <View style={s.eyebrowPill}>
              <Icon name="dharmachakra" size={14} />
              <Text variant="label" tone="sandstone" uppercase numberOfLines={1} style={s.eyebrowText}>
                {siteName ? `Ask about ${siteName}` : 'Ask about Lumbini'}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={s.closeBtn}
            >
              <Icon name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ChatTranscript ref={transcriptRef}>
            <ChatBubble from="companion">
              <Text variant="body">{opening}</Text>
              <Text variant="caption" tone="muted">
                Answered from the canonical texts. If they do not cover it, you will be told so
                rather than given a guess.
              </Text>
            </ChatBubble>

            {turns.map((turn) => {
              if (turn.from === 'user') {
                return (
                  <ChatBubble key={turn.id} from="user">
                    <Text variant="body">{turn.text}</Text>
                  </ChatBubble>
                );
              }
              if ('failure' in turn) {
                return (
                  <ChatBubble key={turn.id} from="companion" accent="muted">
                    <Text variant="body" tone="secondary">
                      {turn.failure}
                    </Text>
                  </ChatBubble>
                );
              }
              return <GuideTurn key={turn.id} answer={turn.answer} speaking={speaking} />;
            })}

            {busy ? (
              <ChatBubble from="companion">
                <Text variant="caption" tone="muted">
                  Searching the collections…
                </Text>
              </ChatBubble>
            ) : null}
          </ChatTranscript>

          <ChatComposer
            value={question}
            onChangeText={setQuestion}
            onSend={() => void ask(question)}
            busy={busy}
            placeholder="Type your question…"
            onGrow={() => transcriptRef.current?.scrollToEnd()}
          />
        </View>
      </View>
    </Modal>
  );
}

/** One reply from the guide, with the citations that stand behind it. */
function GuideTurn({ answer, speaking }: { answer: DhammaAnswer; speaking: boolean }) {
  const grounded = isGrounded(answer);
  const text = answer.text || 'I cannot find this in the collections on Lumbini.';
  const { displayed, done, skip } = useTypingText(text);

  return (
    <ChatBubble from="companion" accent={grounded ? null : 'muted'} wide>
      <Pressable
        onPress={skip}
        disabled={done}
        accessibilityRole={done ? undefined : 'button'}
        accessibilityLabel={done ? undefined : 'Show the whole answer'}
      >
        <Text variant="body">{displayed}</Text>
      </Pressable>

      {speaking ? (
        <View style={s.speakRow}>
          <Icon name="volume-high" size={14} />
          <Text variant="caption" tone="sandstone">
            Speaking
          </Text>
        </View>
      ) : null}

      {grounded && answer.caveat ? (
        <Text variant="caption" tone="muted">
          {answer.caveat}
        </Text>
      ) : null}

      {/*
        The citations. These used to be dropped entirely — the reply rendered
        `answer.text` and nothing else — on the one surface whose whole claim is
        that its answers are checkable.
      */}
      {grounded ? <SourceList citations={answer.citations} /> : null}

      {!grounded && answer.suggestions.length > 0 ? (
        <View style={s.suggestBox}>
          <Text variant="label" tone="sandstone" uppercase>
            Try asking
          </Text>
          {answer.suggestions.slice(0, 3).map((suggestion) => (
            <Text key={suggestion} variant="caption" tone="secondary">
              · {suggestion}
            </Text>
          ))}
        </View>
      ) : null}
    </ChatBubble>
  );
}

const s = StyleSheet.create({
  // Bottom-aligned: the monk stands on the sheet's top edge.
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 18, 16, 0.72)',
  },
  avatarWrap: { alignSelf: 'flex-start', marginLeft: -24, marginBottom: -8 },
  /*
    A definite height, not `flex: 1`. The transcript inside is `flex: 1` and
    needs a bounded parent to scroll within — the previous version was an
    absolutely-positioned bubble with neither a height limit nor a ScrollView,
    so a long answer simply grew off the top of the screen.
  */
  sheet: {
    height: '74%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sandstone,
    backgroundColor: colors.surfaceSecondary,
  },
  eyebrowText: { flexShrink: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  speakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  suggestBox: {
    gap: spacing.xxs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
});

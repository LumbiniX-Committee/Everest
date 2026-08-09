import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GreetingMonk } from '@/components/monk';
import { dhamma as dhammaService, voice } from '@/services';
import { colors, radii, spacing } from '@/theme';
import { isGrounded, type DhammaAnswer } from '@/types';

function useTypingText(text: string, speed = 16): string {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

type ChatPhase =
  | { kind: 'idle' }
  | { kind: 'asking' }
  | { kind: 'loading' }
  | { kind: 'answered'; answer: DhammaAnswer }
  | { kind: 'failed' };

function AnswerBody({ answer, speaking }: { answer: DhammaAnswer; speaking: boolean }) {
  const text = isGrounded(answer)
    ? answer.text
    : answer.text || 'I cannot find this in the collections on Lumbini.';
  const displayed = useTypingText(text, 14);

  return (
    <View style={s.answerBody}>
      <RNText style={s.answerText}>{displayed}</RNText>
      {isGrounded(answer) && answer.caveat ? (
        <RNText style={s.caveatText}>{answer.caveat}</RNText>
      ) : null}
      {!isGrounded(answer) && answer.suggestions.length > 0 ? (
        <View style={s.suggestBox}>
          <RNText style={s.suggestLabel}>TRY ASKING</RNText>
          {answer.suggestions.slice(0, 2).map((q: string, i: number) => (
            <RNText key={i} style={s.suggestItem}>· {q}</RNText>
          ))}
        </View>
      ) : null}
      <RNText style={[s.speakPill, speaking && s.speakPillOn]}>
        {speaking ? '🔊 Speaking…' : '🔈 Spoken'}
      </RNText>
    </View>
  );
}

export type BuddhaChatProps = {
  visible: boolean;
  onClose: () => void;
  siteName?: string;
};

export function BuddhaChat({ visible, onClose, siteName }: BuddhaChatProps) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<ChatPhase>({ kind: 'idle' });
  const [question, setQuestion] = useState('');
  const [speaking, setSpeaking] = useState(false);

  const avatarSlide = useRef(new Animated.Value(0)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      avatarSlide.setValue(0);
      avatarOpacity.setValue(0);
      bubbleAnim.setValue(0);
      setPhase({ kind: 'idle' });
      setQuestion('');
      voice.stopSpeaking();
      setSpeaking(false);
      return;
    }
    avatarSlide.setValue(0);
    avatarOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(avatarSlide, {
        toValue: 1,
        duration: 540,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
    Animated.timing(bubbleAnim, {
      toValue: 1,
      duration: 280,
      delay: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    bubbleAnim.setValue(0);
    Animated.timing(bubbleAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [phase.kind]);

  const handleAsk = useCallback(async () => {
    const q = question.trim();
    if (!q) return;
    voice.stopSpeaking();
    setSpeaking(false);
    setPhase({ kind: 'loading' });
    setQuestion('');

    try {
      const result = await dhammaService.ask(q, 'en');
      setPhase({ kind: 'answered', answer: result.answer });
      const spokenText = isGrounded(result.answer)
        ? result.answer.text
        : result.answer.text || 'I cannot find this in the collections.';
      setSpeaking(true);
      voice.speakText(spokenText, 'en', () => setSpeaking(false), () => setSpeaking(false));
    } catch {
      setPhase({ kind: 'failed' });
    }
  }, [question]);

  const handleReset = useCallback(() => {
    voice.stopSpeaking();
    setSpeaking(false);
    setPhase({ kind: 'asking' });
    setQuestion('');
  }, []);

  const handleClose = useCallback(() => {
    voice.stopSpeaking();
    setSpeaking(false);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const eyebrow =
    phase.kind === 'loading'
      ? '🔍  SEARCHING COLLECTIONS…'
      : phase.kind === 'answered'
        ? isGrounded(phase.answer)
          ? '✦  FROM THE RECORD'
          : '◌  NOT FOUND IN COLLECTION'
        : phase.kind === 'failed'
          ? '⚠  COULD NOT REACH CORPUS'
          : siteName
            ? `ASK ABOUT ${siteName.toUpperCase()}`
            : 'ASK ABOUT LUMBINI';

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.backdrop} />

        <Animated.View
          style={[
            s.avatarWrap,
            { bottom: insets.bottom + 72 },
            {
              opacity: avatarOpacity,
              transform: [
                {
                  translateX: avatarSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-200, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <GreetingMonk height={250} />
        </Animated.View>

        <Animated.View
          style={[
            s.speechArea,
            { paddingBottom: insets.bottom + spacing.lg },
            {
              opacity: bubbleAnim,
              transform: [
                {
                  translateY: bubbleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [28, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={s.bubble}>
            <View style={s.bubbleTail} />

            <View style={s.headerRow}>
              <View style={s.eyebrowPill}>
                <RNText style={s.eyebrowTxt} numberOfLines={1}>
                  {eyebrow}
                </RNText>
              </View>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close chat"
                style={s.closeBtn}
              >
                <RNText style={s.closeBtnTxt}>✕</RNText>
              </Pressable>
            </View>

            {phase.kind === 'idle' || phase.kind === 'asking' ? (
              <View style={s.inputSection}>
                <RNText style={s.promptText}>
                  {siteName
                    ? `What would you like to know about ${siteName} or the early record?`
                    : 'What would you like to know about Lumbini or the early record?'}
                </RNText>
                <View style={s.inputRow}>
                  <TextInput
                    value={question}
                    onChangeText={setQuestion}
                    placeholder="Type your question…"
                    placeholderTextColor={colors.textMuted}
                    style={s.input}
                    returnKeyType="send"
                    onSubmitEditing={() => void handleAsk()}
                    multiline={false}
                    autoFocus={phase.kind === 'asking'}
                    accessibilityLabel="Question about Lumbini"
                  />
                  <Pressable
                    onPress={() => void handleAsk()}
                    disabled={!question.trim()}
                    style={[s.sendBtn, !question.trim() && s.sendBtnOff]}
                    accessibilityRole="button"
                    accessibilityLabel="Send question"
                  >
                    <RNText style={s.sendBtnTxt}>→</RNText>
                  </Pressable>
                </View>
                {phase.kind === 'idle' ? (
                  <Pressable
                    onPress={() => setPhase({ kind: 'asking' })}
                    style={s.typeTrigger}
                    accessibilityRole="button"
                  >
                    <RNText style={s.typeTriggerTxt}>✎  Tap here to type</RNText>
                  </Pressable>
                ) : null}
              </View>
            ) : phase.kind === 'loading' ? (
              <View style={s.loadingSection}>
                <RNText style={s.dots}>· · ·</RNText>
                <RNText style={s.loadingLabel}>Searching the collections…</RNText>
              </View>
            ) : phase.kind === 'answered' ? (
              <View style={s.answeredSection}>
                <AnswerBody answer={phase.answer} speaking={speaking} />
                <Pressable
                  onPress={handleReset}
                  style={s.askAnotherBtn}
                  accessibilityRole="button"
                >
                  <RNText style={s.askAnotherTxt}>‹  Ask another question</RNText>
                </Pressable>
              </View>
            ) : (
              <View style={s.loadingSection}>
                <RNText style={s.loadingLabel}>
                  Could not reach the corpus. Please try again.
                </RNText>
                <Pressable onPress={handleReset} style={s.askAnotherBtn}>
                  <RNText style={s.askAnotherTxt}>‹  Try again</RNText>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(14, 18, 16, 0.72)',
  },
  avatarWrap: { position: 'absolute', left: -16 },
  speechArea: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.base,
    paddingLeft: 142,
  },
  bubble: {
    backgroundColor: 'rgba(255, 252, 246, 0.97)',
    borderRadius: 20,
    padding: spacing.base,
    gap: spacing.sm + 2,
    overflow: 'visible',
    shadowColor: '#A07A50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(183, 155, 114, 0.38)',
  },
  bubbleTail: {
    position: 'absolute',
    left: -11,
    top: 28,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(255, 252, 246, 0.97)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrowPill: {
    backgroundColor: 'rgba(183, 155, 114, 0.15)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: 'rgba(183, 155, 114, 0.35)',
    flexShrink: 1,
  },
  eyebrowTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: colors.sandstoneDeep },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  closeBtnTxt: { fontSize: 13, color: colors.textMuted, fontWeight: '700' },
  inputSection: { gap: spacing.sm },
  promptText: { fontSize: 14, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: {
    flex: 1,
    backgroundColor: 'rgba(183, 155, 114, 0.08)',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(183, 155, 114, 0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.sandstone,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.sandstone,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  sendBtnOff: { backgroundColor: 'rgba(183, 155, 114, 0.25)', elevation: 0, shadowOpacity: 0 },
  sendBtnTxt: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  typeTrigger: { alignSelf: 'flex-start', paddingVertical: spacing.xxs },
  typeTriggerTxt: { fontSize: 13, color: colors.sandstoneDeep, fontWeight: '600' },
  loadingSection: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  dots: { fontSize: 22, color: colors.sandstone, letterSpacing: 6 },
  loadingLabel: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' },
  answeredSection: { gap: spacing.sm },
  answerBody: { gap: spacing.xs },
  answerText: { fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  caveatText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', lineHeight: 18 },
  suggestBox: {
    backgroundColor: 'rgba(183, 155, 114, 0.08)',
    borderRadius: radii.sm,
    padding: spacing.xs,
    gap: 3,
    marginTop: spacing.xxs,
  },
  suggestLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: colors.sandstoneDeep },
  suggestItem: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  speakPill: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  speakPillOn: { color: '#B4472A' },
  askAnotherBtn: { alignSelf: 'flex-start', paddingVertical: spacing.xxs },
  askAnotherTxt: { fontSize: 13, color: colors.sandstoneDeep, fontWeight: '700' },
});
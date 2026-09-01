import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';

import { SpeechCloud, speechCloudStyles, useTypingText } from '@/components/monk';
import { Icon } from '@/components/ui';
import { useKeyboardInset } from '@/hooks';
import { guide as guideService, voice } from '@/services';
import { colors, font, radii, spacing } from '@/theme';

/**
 * The guide you can ask, from where you are standing.
 */

type Exchange = { question: string; answer: string };

export type BuddhaChatProps = {
  visible: boolean;
  onClose: () => void;
  siteId?: string;
  siteName?: string;
};

export function BuddhaChat({ visible, onClose, siteId, siteName }: BuddhaChatProps) {
  const keyboardInset = useKeyboardInset();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [at, setAt] = useState(0);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const reset = useCallback(() => {
    setExchanges([]);
    setAt(0);
    setDraft('');
    setBusy(false);
    busyRef.current = false;
  }, []);

  const ask = useCallback(async () => {
    const question = draft.trim();
    if (!question || busyRef.current) return;

    voice.stopSpeaking();
    busyRef.current = true;
    setBusy(true);
    setDraft('');

    // `askGuide` resolves whatever happens: provider, then the site's own
    // description, then a general line. There is no failure branch to render,
    // which is why there is no error state on this screen.
    const reply = await guideService.askGuide({ question, siteId, siteName, language: 'en' });

    setExchanges((prev) => {
      const next = [...prev, { question, answer: reply.text }];
      setAt(next.length - 1);
      return next;
    });
    busyRef.current = false;
    setBusy(false);

    // Outside the request on purpose. `voice.speakText` throws on a device with
    // no speech engine, and a nicety must not be able to discard the answer.
    try {
      voice.speakText(reply.text, 'en');
    } catch {
      // Spoken delivery is optional. The text is already on screen.
    }
  }, [draft, siteId, siteName]);

  const handleClose = useCallback(() => {
    voice.stopSpeaking();
    reset();
    onClose();
  }, [onClose, reset]);

  if (!visible) return null;

  const current = exchanges[at];
  const opening = guideService.opening(siteName);
  const body = busy ? 'Let me think about that.' : (current?.answer ?? opening);

  const isTypingActive = keyboardOpen || keyboardInset > 0;
  // On iOS, window does not automatically resize, so we use measured inset.
  // On Android, the Modal window already resizes/pans, so we avoid double-shifting.
  const effectiveBottomInset = Platform.OS === 'ios' ? keyboardInset : 0;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
      // Without this the Modal sits under the status bar on Android and does not
      // resize for the keyboard.
      statusBarTranslucent
    >
      <SpeechCloud
        eyebrow={siteName ? siteName.toUpperCase() : 'YOUR GUIDE'}
        onClose={handleClose}
        animationKey={busy ? 'thinking' : `${at}:${exchanges.length}`}
        bottomInset={effectiveBottomInset}
        isKeyboardOpen={isTypingActive}
        aboveCloud={
          current ? (
            <View style={s.askedRow}>
              <View style={[s.asked, isTypingActive && s.askedKeyboard]}>
                <RNText
                  style={[s.askedTxt, isTypingActive && s.askedTxtKeyboard]}
                  numberOfLines={isTypingActive ? 1 : 2}
                >
                  {current.question}
                </RNText>
              </View>
            </View>
          ) : null
        }
        footer={
          <View style={s.footer}>
            {exchanges.length > 1 ? (
              <View style={s.navRow}>
                <Pressable
                  onPress={() => setAt((i) => Math.max(0, i - 1))}
                  disabled={at === 0}
                  hitSlop={10}
                  style={[s.navBtn, at === 0 && s.navBtnOff]}
                  accessibilityRole="button"
                  accessibilityLabel="Previous answer"
                >
                  <RNText style={s.navTxt}>‹</RNText>
                </Pressable>
                <RNText style={s.navCount}>
                  {at + 1} of {exchanges.length}
                </RNText>
                <Pressable
                  onPress={() => setAt((i) => Math.min(exchanges.length - 1, i + 1))}
                  disabled={at >= exchanges.length - 1}
                  hitSlop={10}
                  style={[s.navBtn, at >= exchanges.length - 1 && s.navBtnOff]}
                  accessibilityRole="button"
                  accessibilityLabel="Next answer"
                >
                  <RNText style={s.navTxt}>›</RNText>
                </Pressable>
              </View>
            ) : null}

            <View style={s.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                multiline={!isTypingActive}
                placeholder="Ask about this place"
                placeholderTextColor={colors.textMuted}
                // `font()` resolves at call time; a StyleSheet is built once at
                // module scope, before the real families have loaded.
                style={[s.input, font('body'), isTypingActive && s.inputKeyboard]}
                editable={!busy}
                accessibilityLabel="Ask about this place"
                onSubmitEditing={() => void ask()}
              />
              <Pressable
                onPress={() => void ask()}
                disabled={busy || draft.trim().length === 0}
                accessibilityRole="button"
                accessibilityLabel="Ask"
                style={({ pressed }) => [
                  s.send,
                  isTypingActive && s.sendKeyboard,
                  (busy || draft.trim().length === 0) && s.sendOff,
                  pressed && s.pressed,
                ]}
              >
                <Icon name="send" size={isTypingActive ? 16 : 18} color={colors.backgroundDeep} />
              </Pressable>
            </View>
          </View>
        }
      >
        <CloudBody text={body} typing={!busy && current != null} isKeyboardOpen={isTypingActive} />
      </SpeechCloud>
    </Modal>
  );
}

/**
 * The spoken line.
 *
 * A typed reveal for an answer, because that is what the story does and this is
 * the same monk. Not for the opening line, which is furniture rather than a
 * reply. A tap finishes it, and it scrolls once it outgrows the cloud, which the
 * previous unbounded bubble did not: a long answer simply grew off the top of
 * the screen and its first sentence became unreadable.
 */
function CloudBody({
  text,
  typing,
  isKeyboardOpen,
}: {
  text: string;
  typing: boolean;
  isKeyboardOpen: boolean;
}) {
  const { displayed, done, skip } = useTypingText(typing ? text : '', 16, 2);
  const shown = typing ? displayed : text;

  return (
    <Pressable
      onPress={skip}
      disabled={!typing || done}
      accessibilityRole={typing && !done ? 'button' : undefined}
      accessibilityLabel={typing && !done ? 'Show the whole answer' : undefined}
    >
      <ScrollView
        style={[s.scroll, isKeyboardOpen && s.scrollKeyboard]}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <View style={speechCloudStyles.content}>
          <RNText style={speechCloudStyles.body}>
            {shown}
            {typing && !done ? <RNText style={s.cursor}> ▎</RNText> : null}
          </RNText>
        </View>
      </ScrollView>
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll: { maxHeight: 180 },
  scrollKeyboard: { maxHeight: 96 },

  askedRow: { alignItems: 'flex-end' },
  asked: {
    maxWidth: '92%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(16, 43, 61, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(77, 198, 194, 0.4)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  askedKeyboard: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.md,
  },
  askedTxt: { fontSize: 13, lineHeight: 18, color: colors.textPrimary, fontWeight: '500' },
  askedTxtKeyboard: { fontSize: 11, lineHeight: 15 },

  footer: { gap: spacing.sm },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(126, 169, 190, 0.35)',
    backgroundColor: colors.surfaceSecondary,
  },
  navBtnOff: { opacity: 0.28 },
  navTxt: { fontSize: 16, lineHeight: 20, color: colors.sandstone, fontWeight: '700' },
  navCount: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    maxHeight: 96,
    minHeight: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(126, 169, 190, 0.32)',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  inputKeyboard: {
    minHeight: 38,
    maxHeight: 56,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs + 2,
    fontSize: 14,
    lineHeight: 18,
    borderRadius: radii.md,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandstone,
    shadowColor: colors.sandstone,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  sendKeyboard: {
    width: 38,
    height: 38,
  },
  sendOff: { opacity: 0.35 },
  pressed: { opacity: 0.75 },
  cursor: { color: colors.sandstone, fontWeight: '700' },
});

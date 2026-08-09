import { useCallback, useRef, useState } from 'react';
import {
  Modal,
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
 *
 * Two changes from the version this replaces, and they are the same change seen
 * from two sides.
 *
 * **It answers as a guide.** It used to run `dhamma.ask`, which retrieves,
 * grounds, cites and refuses when the corpus does not cover the question. Asked
 * "tell me about the peace pagoda" it answered "I don't have enough reliable
 * evidence to answer this confidently" and listed three suttas. Correct, and no
 * use at all to someone looking at the building. It now runs `services/guide`,
 * which is free to speak plainly and never refuses. The two limits it keeps are
 * in the prompt: nothing about a monument's physical condition, which is Sākṣī's
 * to measure, and no claim to be quoting a source, which is Dhamma's to cite.
 *
 * **It looks like the story.** Not a chat log with bubbles and a transcript, but
 * the same monk and the same cloud the story speaks from, one exchange at a
 * time. `‹` goes back through what has been said. The shared cloud is
 * `components/monk/SpeechCloud.tsx`.
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
        bottomInset={keyboardInset}
        monkHeight={keyboardInset > 0 ? 170 : 230}
        aboveCloud={
          current ? (
            <View style={s.askedRow}>
              <View style={s.asked}>
                <RNText style={s.askedTxt} numberOfLines={2}>
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
                multiline
                placeholder="Ask about this place"
                placeholderTextColor={colors.textMuted}
                // `font()` resolves at call time; a StyleSheet is built once at
                // module scope, before the real families have loaded.
                style={[s.input, font('body')]}
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
                  (busy || draft.trim().length === 0) && s.sendOff,
                  pressed && s.pressed,
                ]}
              >
                <Icon name="send" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        }
      >
        <CloudBody text={body} typing={!busy && current != null} />
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
function CloudBody({ text, typing }: { text: string; typing: boolean }) {
  const { displayed, done, skip } = useTypingText(typing ? text : '', 16, 2);
  const shown = typing ? displayed : text;

  return (
    <Pressable
      onPress={skip}
      disabled={!typing || done}
      accessibilityRole={typing && !done ? 'button' : undefined}
      accessibilityLabel={typing && !done ? 'Show the whole answer' : undefined}
    >
      <ScrollView style={s.scroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        <View style={speechCloudStyles.content}>
          <RNText style={speechCloudStyles.body}>{shown}</RNText>
        </View>
      </ScrollView>
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll: { maxHeight: 210 },

  askedRow: { alignItems: 'flex-end' },
  asked: {
    maxWidth: '92%',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(20, 25, 22, 0.55)',
  },
  askedTxt: { fontSize: 13, lineHeight: 18, color: '#FFFFFF' },

  footer: { gap: spacing.sm },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  navBtnOff: { opacity: 0.28 },
  navTxt: { fontSize: 17, lineHeight: 21, color: colors.textSecondary },
  navCount: { fontSize: 11, color: colors.textMuted },

  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    maxHeight: 96,
    minHeight: 42,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandstoneDeep,
  },
  sendOff: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
});

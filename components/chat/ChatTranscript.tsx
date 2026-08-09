import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@/theme';

/**
 * The scrolling record of a conversation.
 *
 * Two things go wrong in a hand-rolled transcript, and both were live in this
 * app. The first: a bubble with no height limit and no scroll around it, so a
 * long answer grows off the top of the screen and its opening sentence can never
 * be read. This is a real ScrollView, so growth is scrolled rather than lost.
 *
 * The second: `keyboardShouldPersistTaps`. Without `"handled"`, the first tap
 * anywhere in the transcript is swallowed dismissing the keyboard — so tapping a
 * suggestion chip while typing does nothing, and it looks like the app ignored
 * you.
 *
 * Auto-scroll is on content size, not on a message count, so it also follows a
 * reply that is still being typed out.
 */

export type ChatTranscriptHandle = { scrollToEnd: () => void };

export type ChatTranscriptProps = {
  children: React.ReactNode;
  /** Extra bottom padding — usually the height of whatever is pinned below. */
  paddingBottom?: number;
};

export const ChatTranscript = forwardRef<ChatTranscriptHandle, ChatTranscriptProps>(
  function ChatTranscript({ children, paddingBottom = 0 }, ref) {
    const scrollRef = useRef<ScrollView>(null);
    const scrollToEnd = () => scrollRef.current?.scrollToEnd({ animated: true });

    useImperativeHandle(ref, () => ({ scrollToEnd }));

    return (
      <ScrollView
        ref={scrollRef}
        style={styles.transcript}
        contentContainerStyle={[styles.content, paddingBottom ? { paddingBottom } : null]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollToEnd}
      >
        {children}
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  transcript: { flex: 1 },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
});

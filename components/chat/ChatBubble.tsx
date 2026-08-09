import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

/**
 * One turn in a conversation.
 *
 * Three surfaces hold a conversation — Dhamma's Ask, the reflection companion,
 * and the Buddha guide in Tīrtha — and each had hand-rolled its own bubble.
 * They drifted: different radii, different maximum widths, one with no tail at
 * all. This is the single implementation; the differences that remain are the
 * ones that carry meaning.
 *
 * The asymmetric corner is the tail. A bubble from the app squares its top-left,
 * one from the person squares its top-right, which is the convention every
 * messaging app has taught already — so it needs no legend.
 *
 * `accent` marks a bubble that is doing something other than talking: a question
 * being put to you, a refusal. It draws a rule down the leading edge rather than
 * changing the fill, because the fill is what separates the two speakers and a
 * third fill would make the transcript unreadable.
 */

export type ChatBubbleProps = {
  from: 'user' | 'companion';
  /** A leading rule, for a turn that is a question or a refusal rather than prose. */
  accent?: 'sandstone' | 'muted' | null;
  /** Bubbles carrying sources and controls need the full width. */
  wide?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
};

export function ChatBubble({ from, accent = null, wide = false, style, children }: ChatBubbleProps) {
  return (
    <View
      style={[
        styles.bubble,
        wide && styles.wide,
        from === 'user' ? styles.user : styles.companion,
        accent === 'sandstone' && styles.accentSandstone,
        accent === 'muted' && styles.accentMuted,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A quiet line above a bubble's content — "Sources", "Question 2 of 4". */
export function ChatBubbleLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="label" tone="muted" uppercase>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '88%',
    padding: spacing.base,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  wide: { maxWidth: '100%' },
  companion: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: radii.sm,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderTopRightRadius: radii.sm,
  },
  accentSandstone: { borderLeftWidth: 3, borderLeftColor: colors.sandstone },
  accentMuted: { borderLeftWidth: 3, borderLeftColor: colors.textMuted },
});

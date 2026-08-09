import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { colors, font, radii, spacing } from '@/theme';

/**
 * The bar you type into, pinned above the keyboard.
 *
 * ── Why this is not a KeyboardAvoidingView ──────────────────────────────────
 *
 * `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` is the idiom every
 * example uses and it is a **no-op on Android** — undefined behaviour means the
 * component does nothing at all. Under edge-to-edge the window frequently does
 * not resize either, so the keyboard covers the field and what you type is
 * invisible while you type it. That was the exact bug reported on two screens.
 *
 * `useKeyboardInset` measures the keyboard instead of assuming a platform will
 * handle it, and subtracts any shrink the window *did* do so the space is never
 * paid for twice.
 *
 * The bottom safe area is not paid here at all. Both screens that use this bar
 * render inside the tab navigator, and `SurfaceTabBar` already clears the
 * gesture bar for the whole scene — paying it twice was half of the dead band
 * under the composer in the screenshots. The other half was the screen padding
 * by the full keyboard height; see `useSceneBottomGap`.
 */

export type ChatComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  /** Blocks sending while a reply is in flight. */
  busy?: boolean;
  /** Send-button label. Icon-only when omitted. */
  sendLabel?: string;
  /** Fired as the field grows, so the caller can keep the transcript at the end. */
  onGrow?: () => void;
};

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  placeholder,
  busy = false,
  sendLabel,
  onGrow,
}: ChatComposerProps) {
  const canSend = value.trim().length > 0 && !busy;

  return (
    <View style={styles.bar}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        /*
          The family is applied here rather than in the StyleSheet: `font()`
          resolves at call time, and a StyleSheet is built once at module scope —
          before the real families have finished loading. TextInput is not the
          app's Text component, so nothing else would give it the body face.
        */
        style={[styles.input, font('body')]}
        editable={!busy}
        accessibilityLabel={placeholder}
        onContentSizeChange={onGrow}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sendLabel ?? 'Send'}
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => [
          styles.send,
          sendLabel ? styles.sendWide : styles.sendRound,
          !canSend && styles.sendDisabled,
          pressed && canSend && styles.pressed,
        ]}
      >
        <Icon name="send" size={20} color={colors.surface} />
        {sendLabel ? (
          <Text variant="button" tone="inverse">
            {sendLabel}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
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
    minHeight: 48,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  send: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.sandstoneDeep,
  },
  sendRound: { width: 48, height: 48, borderRadius: radii.full },
  sendWide: { minHeight: 48, paddingHorizontal: spacing.base, borderRadius: radii.md },
  sendDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
});

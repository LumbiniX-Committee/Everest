import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Shown at the top of the sheet. Also the accessibility label. */
  title: string;
  /** One line under the title, when the title alone is not enough. */
  subtitle?: string;
  children: ReactNode;
  /** Wraps content in a ScrollView. Off for short, fixed content. */
  scroll?: boolean;
};

/**
 * A sheet, used instead of a route.
 *
 * §43: a step that is part of one task should not become a screen. The
 * condition flow — category, detail, severity, note — is four decisions inside
 * a single act of reporting, so it happens here rather than across four routes
 * the person has to navigate back through.
 *
 * Built on the platform Modal rather than a gesture-driven sheet library. The
 * flows that use it are short and linear, and the back button behaviour that
 * Modal gives on Android for free is worth more here than a drag handle.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  scroll = false,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/*
          The scrim dismisses. Labelled rather than silent so the gesture is
          discoverable to a screen reader, which cannot see that the sheet
          covers only part of the screen.
        */}
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.grip} />

          <View style={styles.header}>
            <Text variant="title">{title}</Text>
            {subtitle ? (
              <Text variant="body" tone="secondary">
                {subtitle}
              </Text>
            ) : null}
          </View>

          {scroll ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.content}>{children}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  // Written out rather than spread from StyleSheet.absoluteFillObject, which
  // this RN version does not expose on the type.
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.backgroundDeep,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    maxHeight: '88%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  grip: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    marginBottom: spacing.base,
  },
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  content: { gap: spacing.md },
  scrollContent: { gap: spacing.md, paddingBottom: spacing.base },
});

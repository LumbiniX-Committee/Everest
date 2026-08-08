import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Off for full-bleed screens like capture. */
  scroll?: boolean;
  /** Removes the standard gutter, for maps and camera. */
  bleed?: boolean;
  edges?: readonly Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/**
 * Standard screen frame: safe area, the pale ground, and the page gutter.
 *
 * Having exactly one of these is what keeps rhythm consistent across three
 * surfaces built at different times.
 */
export function Screen({
  children,
  scroll = false,
  bleed = false,
  edges = ['top'],
  style,
  contentStyle,
}: ScreenProps) {
  const padding = bleed ? undefined : { paddingHorizontal: spacing.gutter };

  return (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, padding, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl, flexGrow: 1 },
});

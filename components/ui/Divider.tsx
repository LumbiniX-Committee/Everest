import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

/** A hairline. Never a heavy rule — the palette does the separating. */
export function Divider({ inset = false }: { inset?: boolean }) {
  return <View style={[styles.line, inset && styles.inset]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  inset: { marginLeft: spacing.base },
});

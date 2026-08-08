import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { Citation as CitationRef, Source } from '@/types';

export type CitationProps = {
  source: Source;
  citation?: CitationRef;
  /** Ordinal shown in the marker, matching the source list below the answer. */
  index?: number;
  onPress?: () => void;
};

/**
 * An inline reference, attached to a claim.
 *
 * Numbered to match the source list, the way a footnote does. This is why the
 * Dhamma surface can avoid chat framing entirely: a numbered claim with a
 * reference beneath it is a familiar reading pattern that carries provenance
 * without any of §14's forbidden chatbot furniture.
 *
 * Always tappable through to the full source. A citation the reader cannot
 * follow is a claim of provenance rather than provenance.
 */
export function Citation({ source, citation, index, onPress }: CitationProps) {
  const locator = citation?.locator;
  const line = [source.attribution, source.date].filter(Boolean).join(', ');

  return (
    <View
      style={styles.row}
      onTouchEnd={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${source.title}. ${line}${locator ? `, ${locator}` : ''}`}
    >
      {index != null ? (
        <View style={styles.marker}>
          <Text variant="mono" tone="sandstone">
            {index}
          </Text>
        </View>
      ) : null}

      <View style={styles.body}>
        <Text variant="caption">{source.title}</Text>
        <Text variant="caption" tone="muted">
          {line}
          {locator ? ` · ${locator}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  marker: {
    minWidth: 22,
    height: 22,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.xs,
  },
  body: { flex: 1, gap: spacing.xxs },
});

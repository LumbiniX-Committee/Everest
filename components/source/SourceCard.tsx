import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import { SOURCE_KIND_LABELS, type Citation, type Source } from '@/types';

export type SourceCardProps = {
  source: Source;
  /** Narrows the reference to a place within the source. */
  citation?: Citation;
  onPress?: () => void;
  /** Drops the caveat and reference line, for dense lists. */
  compact?: boolean;
};

/**
 * One source, rendered the same way everywhere.
 *
 * §24: a pillar inscription cited by a Dhamma answer and an excavation report
 * cited by a site detail screen must look identical, because they carry the
 * same kind of authority and the reader should judge them by the same habits.
 *
 * The caveat is not hidden behind a disclosure. A reader who does not expand it
 * has not been told, and on this surface being told is the product.
 */
export function SourceCard({ source, citation, onPress, compact = false }: SourceCardProps) {
  const locator = citation?.locator;
  const reference = [source.reference, locator].filter(Boolean).join(' · ');

  return (
    <Card onPress={onPress} accessibilityLabel={`Source: ${source.title}`}>
      <View style={styles.head}>
        <View style={styles.kind}>
          <Text variant="label" tone="muted" uppercase>
            {SOURCE_KIND_LABELS[source.kind]}
          </Text>
        </View>
        {source.date ? (
          <Text variant="mono" tone="muted">
            {source.date}
          </Text>
        ) : null}
      </View>

      <Text variant="heading" style={styles.title}>
        {source.title}
      </Text>

      <Text variant="caption" tone="secondary">
        {source.attribution}
      </Text>

      {!compact && reference ? (
        <Text variant="mono" tone="muted" style={styles.reference}>
          {reference}
        </Text>
      ) : null}

      {!compact && source.caveat ? (
        <View style={styles.caveat}>
          <Text variant="caption" tone="secondary">
            {source.caveat}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  kind: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  title: { marginBottom: spacing.xxs },
  reference: { marginTop: spacing.sm },
  caveat: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

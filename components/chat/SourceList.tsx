import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Citation as CitationRow } from '@/components/source';
import { findSource } from '@/data';
import { colors, radii, spacing } from '@/theme';
import type { Citation, Source } from '@/types';

/**
 * What a reply rests on, listed under the reply.
 *
 * §14 asks for the order question → answer → sources, and this is how that
 * order survives inside a chat: the sources are not a separate screen you may or
 * may not reach, they are part of the turn. A claim and its evidence arrive in
 * one bubble or the claim is unsupported.
 *
 * Deduplicated on the way in. A citation's identity is its source plus its
 * locator, so one passage referred to twice is one source — listing it twice
 * both raises a duplicate React key and overstates the evidence to exactly the
 * reader who is checking it. `core/dhamma` collapses duplicates before this
 * point; this stays because the render must not be what breaks when it does not.
 */

export type SourceListProps = {
  citations: Citation[];
  /** Overridden for "Related, but not an answer" under a refusal. */
  label?: string;
  /** Numbered when the reply's claims are numbered against them. */
  numbered?: boolean;
  onOpenSource?: (source: Source) => void;
};

export function uniqueCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const identity = `${citation.sourceId}::${citation.locator ?? ''}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export function SourceList({ citations, label, numbered = true, onOpenSource }: SourceListProps) {
  const unique = uniqueCitations(citations);
  if (unique.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="muted" uppercase>
        {label ?? (unique.length === 1 ? 'Source' : 'Sources')}
      </Text>
      {unique.map((citation, index) => {
        const source = findSource(citation.sourceId);
        if (!source) return null;
        return (
          <CitationRow
            key={`${citation.sourceId}-${citation.locator ?? index}`}
            source={source}
            citation={citation}
            index={numbered ? index + 1 : undefined}
            onPress={onOpenSource ? () => onOpenSource(source) : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.md,
    // A shade back from the bubble it sits in, so the evidence reads as attached
    // to the claim rather than as another claim.
    backgroundColor: colors.background,
  },
});

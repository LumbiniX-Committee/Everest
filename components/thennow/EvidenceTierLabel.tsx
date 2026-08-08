import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radii, spacing } from '@/theme';
import type { EvidenceTier } from '@/types';

/**
 * The evidence-tier badge — Charter #6.
 *
 * Rendered on every historical panel so a viewer can always tell a photograph
 * from a reconstruction. That transparency is the product, not a disclaimer, so
 * the badge sits on the image itself rather than in fine print below it.
 *
 * A photograph or survey drawing reads as neutral record; a reconstruction or
 * impression is marked in amber (`seeking`) — not as a warning, but so the eye
 * catches "this was made, not found" without having to read.
 */
const TIER_LABELS: Record<EvidenceTier, string> = {
  historical_photograph: 'Photograph',
  survey_drawing: 'Survey drawing',
  conditioned_reconstruction: 'Reconstruction',
  artistic_impression: 'Artistic impression',
};

const GENERATED: ReadonlySet<EvidenceTier> = new Set<EvidenceTier>([
  'conditioned_reconstruction',
  'artistic_impression',
]);

export function EvidenceTierLabel({ tier }: { tier: EvidenceTier }) {
  const generated = GENERATED.has(tier);
  return (
    <View
      style={styles.badge}
      accessibilityLabel={`Evidence tier: ${TIER_LABELS[tier]}${
        generated ? ', a reconstruction, not a photograph' : ''
      }`}
    >
      <Text variant="label" tone={generated ? 'seeking' : 'inverse'} uppercase>
        {TIER_LABELS[tier]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(37, 42, 39, 0.72)',
  },
});

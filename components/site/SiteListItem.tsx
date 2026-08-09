import { Image, StyleSheet, View } from 'react-native';

import { Card, ConditionBadge, Text } from '@/components/ui';
import type { SiteWithDistance } from '@/hooks';
import { usePreferences } from '@/store';
import { radii, spacing } from '@/theme';
import { formatDistance } from '@/utils';

export function SiteListItem({
  site,
  onPress,
}: {
  site: SiteWithDistance;
  onPress: () => void;
}) {
  const { preferences } = usePreferences();

  return (
    <Card onPress={onPress} style={site.image ? styles.cardWithImage : undefined} accessibilityLabel={`${site.name}. ${site.summary}`}>
      {site.image ? (
        <View style={styles.imageBanner}>
          <Image
            source={typeof site.image === 'string' ? { uri: site.image } : site.image}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={site.image ? styles.content : styles.contentNoPad}>
        <View style={styles.headRow}>
          <View style={styles.names}>
            <Text variant="heading">{site.name}</Text>
            {site.nameNepali ? (
              <Text variant="caption" tone="muted">
                {site.nameNepali}
              </Text>
            ) : null}
          </View>
          {site.distanceM != null ? (
            <Text variant="mono" tone="secondary">
              {formatDistance(site.distanceM, preferences.distanceUnit)}
            </Text>
          ) : null}
        </View>

        <Text variant="body" tone="secondary" style={styles.summary}>
          {site.summary}
        </Text>

        <View style={styles.footRow}>
          <ConditionBadge status={site.condition} />
          <Text variant="label" tone="muted" uppercase>
            {site.vantageIds.length === 0
              ? 'No vantage yet'
              : `${site.vantageIds.length} vantage${site.vantageIds.length === 1 ? '' : 's'}`}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  // When an image is present, remove card padding so the image reaches the edges.
  // overflow:hidden ensures the image clips to the card's rounded corners.
  cardWithImage: {
    padding: 0,
    overflow: 'hidden',
  },
  imageBanner: {
    width: '100%',
    aspectRatio: 3.2,
    overflow: 'hidden',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Padding applied to the text block when an image sits above it.
  content: {
    padding: spacing.base,
  },
  // Zero-padding passthrough when there is no image (card already has padding).
  contentNoPad: {},
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  names: { flexShrink: 1, gap: spacing.xxs },
  summary: { marginTop: spacing.sm },
  footRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});

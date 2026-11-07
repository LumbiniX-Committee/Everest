import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackBar, EmptyState } from '@/components/common';
import { VisitInfo } from '@/components/site';
import { Button, Divider, MetaRow, Screen, Text } from '@/components/ui';
import { commonsThumb, feeForPlace, findPlace } from '@/data';
import { useCurrentPosition, useSafeBack } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { application } from '@/services';
import { usePreferences } from '@/store';
import { radii, spacing } from '@/theme';
import { distanceMeters, formatDistance } from '@/utils';

const CATEGORY_LABEL: Record<string, string> = {
  temple: 'Temple',
  stupa: 'Stupa',
  monastery: 'Monastery',
  monument: 'Monument',
  museum: 'Museum',
  palace: 'Palace',
  archaeological: 'Archaeological site',
  viewpoint: 'Viewpoint',
  nature: 'Nature',
  attraction: 'Place to visit',
};

/** A listed place: what open data says about it, labelled as such. */
export function PlaceDetailScreen({ placeId }: { placeId: string }) {
  const router = useRouter();
  const goBack = useSafeBack();
  const ui = useVisitorLiteralCopy();
  const { preferences } = usePreferences();
  const { coordinate } = useCurrentPosition({ watch: true });
  const [imageFailed, setImageFailed] = useState(false);
  const place = findPlace(placeId);

  if (!place) {
    return (
      <Screen>
        <EmptyState title="No such place" body="This place is not in the listing." actionLabel="Back" onAction={goBack} />
      </Screen>
    );
  }

  const distance = coordinate ? distanceMeters(coordinate, place.coordinate) : null;
  const sources = place.sources
    .map((source) => (source === 'osm' ? '© OpenStreetMap contributors (ODbL)' : 'Wikidata (CC0)'))
    .join(' · ');

  return (
    <Screen scroll>
      <BackBar />
      {place.image && !imageFailed ? (
        <Image
          source={{ uri: commonsThumb(place.image, 900) }}
          style={styles.image}
          accessibilityIgnoresInvertColors
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          {CATEGORY_LABEL[place.category]}
        </Text>
        <Text variant="title" translate={false}>
          {place.name}
        </Text>
        {place.nameNepali ? (
          <Text variant="body" tone="secondary" translate={false}>
            {place.nameNepali}
          </Text>
        ) : null}
        {place.description ? (
          <Text variant="body" translate={false}>
            {place.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label="Directions"
          icon="directions"
          onPress={() => router.dismissTo({ pathname: '/(main)/tirtha/map', params: { guideTo: place.id } })}
        />
        <Button
          label="See on the map"
          icon="map-marker-outline"
          variant="secondary"
          onPress={() => router.dismissTo({ pathname: '/(main)/tirtha/map', params: { focusSiteId: place.id } })}
        />
      </View>

      <Divider />
      <VisitInfo fee={feeForPlace(place)} hours={place.hours} wheelchair={place.wheelchair} />
      {distance != null ? <MetaRow label={ui('Distance')} value={formatDistance(distance, preferences.distanceUnit)} /> : null}

      {place.wikipedia || place.website ? (
        <>
          <Divider />
          <View style={styles.actions}>
            {place.wikipedia ? (
              <Button
                label="Read on Wikipedia"
                variant="quiet"
                onPress={() => void application.openExternal(`https://en.wikipedia.org/wiki/${encodeURIComponent(place.wikipedia!)}`)}
              />
            ) : null}
            {place.website ? (
              <Button label="Official website" variant="quiet" onPress={() => void application.openExternal(place.website!)} />
            ) : null}
          </View>
        </>
      ) : null}

      <Text variant="caption" tone="muted" style={styles.sources}>
        {`${ui('A listing from open data, not yet checked on site.')} ${sources}${place.image ? ` · ${ui('Photo: Wikimedia Commons')}` : ''}`}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 220, borderRadius: radii.lg, marginBottom: spacing.md },
  head: { gap: spacing.xs, marginBottom: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sources: { marginTop: spacing.lg, marginBottom: spacing.xl },
});

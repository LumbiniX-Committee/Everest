import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackBar, EmptyState } from '@/components/common';
import { ScanCards } from '@/components/models';
import { PhotoHero, VisitInfo } from '@/components/site';
import { Button, Divider, Icon, MetaRow, Screen, SegmentedControl, Text } from '@/components/ui';
import { commonsThumb, feeForPlace, findPlace, flagshipCover, flagshipForPlace, guideFor, modelFor, placeNote, scansFor } from '@/data';
import { useCurrentPosition, useSafeBack } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { LookAroundButton } from '@/features/panorama';
import { application } from '@/services';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { WISDOM_TIER_OPTIONS } from '@/types';
import { distanceMeters, formatDistance } from '@/utils';
import { FlagshipDepth, FlagshipGallery, FlagshipVisit } from './FlagshipGuide';

const DEPTH_OPTIONS = WISDOM_TIER_OPTIONS.filter((option) => option.value !== 'custom');

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
  const { preferences, update } = usePreferences();
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

  const flagship = flagshipForPlace(place.id);
  const tier = preferences.wisdomTier === 'custom' ? 'medium' : preferences.wisdomTier;
  const language = preferences.interfaceLanguage;
  const distance = coordinate ? distanceMeters(coordinate, place.coordinate) : null;
  const sources = place.sources
    .map((source) => (source === 'osm' ? '© OpenStreetMap contributors (ODbL)' : 'Wikidata (CC0)'))
    .join(' · ');

  return (
    <Screen scroll>
      <BackBar />
      {flagship ? (
        <PhotoHero uri={flagshipCover(flagship).uri} credit={flagshipCover(flagship).credit} height={240} style={styles.hero} />
      ) : place.image && !imageFailed ? (
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
        {place.description && !flagship ? (
          <Text variant="body" translate={false}>
            {place.description}
          </Text>
        ) : null}
      </View>

      {flagship ? (
        <>
          <View style={styles.depth}>
            <SegmentedControl
              accessibilityLabel={ui('How much to tell')}
              options={DEPTH_OPTIONS.map((option) => ({ value: option.value, label: ui(option.label) }))}
              value={tier}
              onChange={(value) => void update('wisdomTier', value)}
            />
            <Text variant="caption" tone="muted" center>
              {ui(DEPTH_OPTIONS.find((option) => option.value === tier)!.hint)}
            </Text>
          </View>
          <FlagshipDepth flagship={flagship} depth={tier} language={language} />
          <FlagshipGallery flagship={flagship} language={language} />
        </>
      ) : null}

      {guideFor(place.id) ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/(main)/tirtha/guide/[placeId]', params: { placeId: place.id } })}
          style={({ pressed }) => [styles.guide, pressed && styles.pressed]}
        >
          <Icon name="book-open-page-variant-outline" size={26} color={colors.accent} />
          <View style={styles.guideText}>
            <Text variant="bodyStrong" tone="onScrim">
              Open the full guide
            </Text>
            <Text variant="caption" tone="onScrim">
              The story at your depth, a walk with mapped stops, photographs and what to know before going.
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.onScrim} />
        </Pressable>
      ) : null}

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
        {modelFor(place.id) ? (
          <Button
            label="View in 3D"
            icon="cube-outline"
            variant="secondary"
            onPress={() => router.push(`/(main)/tirtha/model/${modelFor(place.id)!.id}`)}
          />
        ) : null}
        <LookAroundButton placeId={place.id} />
      </View>

      {placeNote(place.id) ? (
        <View style={styles.note}>
          <Text variant="heading">{placeNote(place.id)!.heading}</Text>
          <Text variant="body" translate={false}>{placeNote(place.id)!.body}</Text>
          {placeNote(place.id)!.rules.map((rule) => (
            <Text key={rule} variant="body" tone="secondary" translate={false}>{`• ${rule}`}</Text>
          ))}
          <Text variant="caption" tone="muted" translate={false}>
            {`Sources: ${placeNote(place.id)!.sources.map((source) => source.title).join('; ')}`}
          </Text>
        </View>
      ) : null}

      {scansFor(place.id).length ? (
        <View style={styles.note}>
          <ScanCards scans={scansFor(place.id)} />
        </View>
      ) : null}

      {flagship ? (
        <>
          <Divider />
          <FlagshipVisit flagship={flagship} language={language} />
        </>
      ) : null}

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
        {`${ui('A listing from open data, not yet checked on site.')} ${sources}${place.image || flagship ? ` · ${ui('Photo: Wikimedia Commons')}` : ''}`}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { gap: spacing.sm, marginVertical: spacing.lg },
  image: { width: '100%', height: 220, borderRadius: radii.lg, marginBottom: spacing.md },
  hero: { marginBottom: spacing.md },
  depth: { gap: spacing.xs, marginBottom: spacing.sm },
  head: { gap: spacing.xs, marginBottom: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sources: { marginTop: spacing.lg, marginBottom: spacing.xl },
  guide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundDeep,
  },
  guideText: { flex: 1, gap: spacing.xxs },
  pressed: { opacity: 0.85 },
});

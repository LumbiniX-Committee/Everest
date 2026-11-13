import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SiteVisual } from '@/components/site';
import { BottomSheet, Text } from '@/components/ui';
import { demoSites, PLACES } from '@/data';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { navigation } from '@/services';
import { colors, font, radii, spacing } from '@/theme';
import type { Coordinate } from '@/types';
import { distanceMeters, formatDistance } from '@/utils';

/**
 * Where to go next.
 *
 * The world opened on one fixed view and offered no way to look anywhere else,
 * so every place beyond the Sacred Garden — the monastic zones, Tilaurakot 27 km
 * out — existed in the data and nowhere a player could reach. This is the list
 * that makes them reachable.
 *
 * It takes the camera there always, and the player too when the walk is
 * driving: a demonstration nobody can steer is a video, and someone showing the
 * app should be able to say "now the pillar" and be at the pillar. On a real
 * device the player is wherever their feet are — the camera moves, the figure
 * does not, and the distance shown is the honest one.
 */

export type PlacePickerProps = {
  visible: boolean;
  onClose: () => void;
  /** Where the player is, for the distances. Null before the first fix. */
  coordinate: Coordinate | null;
  /** The site the player is standing at, marked so the list says "you are here". */
  atSiteId: string | null;
  /** True when the walk can actually carry the player there. */
  canTravel: boolean;
  onSelect: (siteId: string) => void;
  /** A listed place from open data, chosen from search. */
  onSelectPlace?: (placeId: string) => void;
  /** Anywhere else in Nepal found by name: the map goes there. */
  onSelectPoint?: (point: navigation.FoundPlace) => void;
};

export function PlacePicker({
  visible,
  onClose,
  coordinate,
  atSiteId,
  canTravel,
  onSelect,
  onSelectPlace,
  onSelectPoint,
}: PlacePickerProps) {
  const ui = useVisitorLiteralCopy();
  const [query, setQuery] = useState('');
  const needle = normalise(query);
  // Everything else in Nepal, from OpenStreetMap, once typing pauses.
  const [found, setFound] = useState<navigation.FoundPlace[]>([]);
  const [searching, setSearching] = useState<'idle' | 'busy' | 'failed'>('idle');
  useEffect(() => {
    setFound([]);
    if (!onSelectPoint || query.trim().length < 3) { setSearching('idle'); return; }
    const controller = new AbortController();
    setSearching('busy');
    const timer = setTimeout(() => {
      navigation.searchPlaces(query, controller.signal)
        .then((rows) => { setFound(rows); setSearching('idle'); })
        .catch(() => { if (!controller.signal.aborted) setSearching('failed'); });
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, onSelectPoint]);
  useEffect(() => { if (!visible) setQuery(''); }, [visible]);
  // Nearest first. A list of places to walk to that is not ordered by how far
  // away they are is a list you have to read rather than scan.
  const places = [...demoSites]
    .map((site) => ({
      site,
      distanceM: coordinate ? distanceMeters(coordinate, site.coordinate) : null,
    }))
    .filter(({ site }) => !needle || [site.name, site.nameNepali ?? ''].some((name) => normalise(name).includes(needle)))
    .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Go to"
      subtitle={canTravel ? 'Takes you there' : 'Moves the view; your position is your own'}
      scroll
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={ui('Search places')}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={ui('Search places')}
        autoCorrect={false}
        autoFocus
        returnKeyType="search"
        style={styles.search}
      />
      {onSelectPoint && query.trim().length >= 3 ? (
        <View style={styles.list}>
          {searching === 'busy' && found.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
          {searching === 'failed' ? <Text variant="caption" tone="secondary">Search needs a connection. The places below still work offline.</Text> : null}
          {found.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              accessibilityLabel={`${place.name}, ${place.detail}`}
              accessibilityHint={ui('Shows this place on the map')}
              onPress={() => onSelectPoint(place)}
              style={({ pressed }) => [styles.placeRow, pressed && styles.pressed]}
            >
              <Text variant="bodyStrong" numberOfLines={1} translate={false}>{place.name}</Text>
              <Text variant="caption" tone="secondary" numberOfLines={1} translate={false}>
                {place.detail}{coordinate ? ` · ${formatDistance(distanceMeters(coordinate, place.coordinate))}` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {needle && onSelectPlace ? (
        <View style={styles.list}>
          {PLACES.filter((place) => [place.name, place.nameNepali ?? ''].some((name) => normalise(name).includes(needle)))
            .slice(0, 15)
            .map((place) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={place.name}
                onPress={() => onSelectPlace(place.id)}
                style={({ pressed }) => [styles.placeRow, pressed && styles.pressed]}
              >
                <Text variant="bodyStrong" translate={false}>{place.name}</Text>
                {place.description ? (
                  <Text variant="caption" tone="secondary" numberOfLines={1} translate={false}>{place.description}</Text>
                ) : null}
              </Pressable>
            ))}
        </View>
      ) : null}
      {places.length === 0 && !(needle && onSelectPlace) && found.length === 0 ? (
        <Text variant="body" tone="secondary">
          No place matches that name.
        </Text>
      ) : null}
      <View style={styles.list}>
        {places.map(({ site, distanceM }) => {
          const here = site.id === atSiteId;
          return (
            <Pressable
              key={site.id}
              accessibilityRole="button"
              accessibilityLabel={site.name}
              accessibilityHint={
                ui(here ? 'You are already here' : canTravel ? 'Travel here' : 'Move the view here')
              }
              onPress={() => onSelect(site.id)}
              style={({ pressed }) => [styles.row, here && styles.rowHere, pressed && styles.pressed]}
            >
              <SiteVisual siteId={site.id} height={76} quiet style={styles.thumb} />

              <View style={styles.rowText}>
                <Text variant="heading" numberOfLines={1} ellipsizeMode="tail" translate={false}>
                  {site.name}
                </Text>
                {site.summary ? (
                  <Text variant="caption" tone="secondary" numberOfLines={1} ellipsizeMode="tail" translate={false}>
                    {site.summary}
                  </Text>
                ) : null}
              </View>
              <Text variant="mono" tone="sandstone" numberOfLines={1}>
                {here ? 'you are here' : distanceM !== null ? formatDistance(distanceM) : '—'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

/** Matches "Sakshi" to "Sākṣī", so nobody needs to type diacritics. */
function normalise(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

const styles = StyleSheet.create({
  search: {
    ...font('body'),
    minHeight: 48,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  list: { gap: spacing.sm, paddingBottom: spacing.base },
  placeRow: { gap: spacing.xxs, minHeight: 56, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 94,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  rowHere: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceSelected },
  pressed: { opacity: 0.7 },
  thumb: { width: 76 },
  rowText: { flex: 1, minWidth: 0, gap: spacing.xs },
});

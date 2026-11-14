import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, InteractionManager, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SiteVisual } from '@/components/site';
import { BottomSheet, Text } from '@/components/ui';
import { demoSites } from '@/data';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { navigation, search } from '@/services';
import { usePreferences } from '@/store';
import { colors, font, radii, spacing } from '@/theme';
import type { Coordinate } from '@/types';
import { distanceMeters, formatDistance } from '@/utils';

/**
 * Where to go next, and search for anywhere.
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
 *
 * Search answers from the phone first, on every keystroke, from an index built
 * once (services/search). OpenStreetMap is asked only after typing pauses,
 * because its public geocoder allows one request a second, and its answers are
 * appended below ours without repeating anything we already list. Only the
 * typed words go to it, never the visitor's position.
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

/** OpenStreetMap is asked once typing has paused this long; Nominatim allows one request a second. */
const REMOTE_PAUSE_MS = 600;

const GROUP_TITLES = {
  heritage: 'Heritage sites',
  place: 'Places',
  essential: 'Essentials',
  trek: 'Treks',
} as const;

const GROUP_LIMIT = { heritage: 8, place: 8, essential: 6, trek: 6 } as const;

type RemoteState = 'idle' | 'busy' | 'offline' | 'unavailable';

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
  const router = useRouter();
  const { preferences } = usePreferences();
  const unit = preferences.distanceUnit;
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  // The index is built once, after the sheet has finished opening, so the
  // first frame of the animation is not spent folding 1,600 names.
  const [local, setLocal] = useState<ReturnType<typeof search.localSearch> | null>(null);
  useEffect(() => {
    if (!visible || local) return;
    const task = InteractionManager.runAfterInteractions(() => setLocal(search.localSearch()));
    return () => task.cancel();
  }, [visible, local]);

  const [recent, setRecent] = useState<search.RecentSearch[]>([]);
  useEffect(() => {
    if (!visible) return;
    let live = true;
    void search.recentSearches().then((items) => { if (live) setRecent(items); }).catch(() => undefined);
    return () => { live = false; };
  }, [visible]);
  // Closing clears the query: adjusted while rendering, as React recommends
  // for state that follows a prop, rather than in an effect.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (!visible) setQuery('');
  }

  // Instant: no waiting for typing to pause.
  const groups = useMemo(() => {
    if (!local || !trimmed) return [];
    return search.groupHits(search.searchIndex(local.index, trimmed, { near: coordinate }), GROUP_LIMIT);
  }, [local, trimmed, coordinate]);
  const localCount = groups.reduce((sum, group) => sum + group.hits.length, 0);

  // Everything else in Nepal, from OpenStreetMap, once typing pauses. Each
  // keystroke cancels the request before it.
  // The answer is kept with the words it answers, so a stale one is never shown
  // and nothing has to be reset when the query changes.
  const wantsRemote = Boolean(onSelectPoint) && trimmed.length >= 3;
  const [answer, setAnswer] = useState<{ query: string; rows: navigation.FoundPlace[]; state: RemoteState } | null>(null);
  useEffect(() => {
    if (!wantsRemote) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      navigation.searchPlaces(trimmed, controller.signal)
        .then((rows) => setAnswer({ query: trimmed, rows, state: 'idle' }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          const offline = error instanceof navigation.PlaceSearchError && error.reason === 'offline';
          setAnswer({ query: trimmed, rows: [], state: offline ? 'offline' : 'unavailable' });
        });
    }, REMOTE_PAUSE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [trimmed, wantsRemote]);
  const current = wantsRemote && answer?.query === trimmed ? answer : null;
  const remote: RemoteState = !wantsRemote ? 'idle' : current ? current.state : 'busy';
  const found = useMemo(() => current?.rows ?? [], [current]);
  const remoteRows = useMemo(
    () => (local ? search.dedupeRemote(found, local.docs) : found),
    [found, local],
  );

  // With nothing typed: heritage sites nearest first. A list of places to walk
  // to that is not ordered by how far away they are is a list you have to read
  // rather than scan.
  const nearest = useMemo(
    () =>
      [...demoSites]
        .map((site) => ({ site, distanceM: coordinate ? distanceMeters(coordinate, site.coordinate) : null }))
        .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity)),
    [coordinate],
  );

  const remember = (item: search.RecentSearch) => {
    void search.rememberSearch(item).then(setRecent).catch(() => undefined);
  };

  /** One place to act on a choice, whether from results or recents. */
  const choose = (item: search.RecentSearch) => {
    remember(item);
    if (item.kind === 'heritage') return onSelect(item.key.slice('site:'.length));
    if (item.kind === 'place' && onSelectPlace) return onSelectPlace(item.key.slice('place:'.length));
    if (item.kind === 'trek') {
      const trekId = search.trekIdOf(item.key);
      onClose();
      if (trekId) router.push(`/(main)/tirtha/treks/${trekId}`);
      return;
    }
    if (item.coordinate && onSelectPoint) {
      onSelectPoint({ id: item.key, name: item.name, detail: item.detail ?? '', coordinate: item.coordinate });
    }
  };

  const fromHit = (hit: search.SearchHit): search.RecentSearch => ({
    key: hit.doc.key,
    kind: hit.doc.kind,
    name: hit.doc.name,
    detail: hit.doc.detail ?? null,
    coordinate: hit.doc.coordinate ?? null,
  });
  const fromRemote = (place: navigation.FoundPlace): search.RecentSearch => ({
    key: place.id,
    kind: 'osm',
    name: place.name,
    detail: place.detail,
    coordinate: place.coordinate,
  });
  const distanceTo = (point: { latitude: number; longitude: number } | null) =>
    coordinate && point ? formatDistance(distanceMeters(coordinate, point), unit) : null;

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

      {!trimmed && recent.length ? (
        <View style={styles.list}>
          <View style={styles.groupHead}>
            <Text variant="label" tone="muted" uppercase>Recent</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ui('Clear recent searches')}
              hitSlop={12}
              onPress={() => { setRecent([]); void search.clearRecentSearches().catch(() => undefined); }}
            >
              <Text variant="caption" tone="secondary">Clear</Text>
            </Pressable>
          </View>
          {recent.map((item) => (
            <ResultRow key={item.key} name={item.name} detail={item.detail} distance={distanceTo(item.coordinate)} onPress={() => choose(item)} />
          ))}
        </View>
      ) : null}

      {trimmed ? (
        <>
          {!local ? <ActivityIndicator color={colors.primary} /> : null}
          {groups.map((group) => (
            <View key={group.kind} style={styles.list}>
              <Text variant="label" tone="muted" uppercase>{ui(GROUP_TITLES[group.kind])}</Text>
              {group.hits.map((hit) =>
                hit.doc.kind === 'heritage' ? (
                  <SiteRow
                    key={hit.doc.key}
                    siteId={hit.doc.key.slice('site:'.length)}
                    name={hit.doc.name}
                    summary={hit.doc.detail ?? null}
                    here={hit.doc.key === `site:${atSiteId}`}
                    distance={hit.distanceM != null ? formatDistance(hit.distanceM, unit) : null}
                    hint={ui(hit.doc.key === `site:${atSiteId}` ? 'You are already here' : canTravel ? 'Travel here' : 'Move the view here')}
                    onPress={() => choose(fromHit(hit))}
                  />
                ) : (
                  <ResultRow
                    key={hit.doc.key}
                    name={hit.doc.name}
                    detail={hit.doc.detail ?? null}
                    distance={hit.distanceM != null ? formatDistance(hit.distanceM, unit) : null}
                    hint={hit.doc.kind === 'trek' ? ui('Opens this trek') : ui('Shows this place on the map')}
                    onPress={() => choose(fromHit(hit))}
                  />
                ),
              )}
            </View>
          ))}

          {onSelectPoint && trimmed.length >= 3 ? (
            <View style={styles.list}>
              <Text variant="label" tone="muted" uppercase>Streets and places from OpenStreetMap</Text>
              {remote === 'busy' && remoteRows.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
              {remote === 'offline' ? (
                <Text variant="caption" tone="secondary">You are offline. Results from this phone are above.</Text>
              ) : null}
              {remote === 'unavailable' ? (
                <Text variant="caption" tone="secondary">OpenStreetMap search is not answering. Results from this phone are above.</Text>
              ) : null}
              {remote === 'idle' && remoteRows.length === 0 ? (
                <Text variant="caption" tone="muted">Nothing more from OpenStreetMap.</Text>
              ) : null}
              {remoteRows.map((place) => (
                <ResultRow
                  key={place.id}
                  name={place.name}
                  detail={place.detail}
                  distance={distanceTo(place.coordinate)}
                  hint={ui('Shows this place on the map')}
                  onPress={() => choose(fromRemote(place))}
                />
              ))}
            </View>
          ) : null}

          {local && localCount === 0 && remoteRows.length === 0 && remote !== 'busy' ? (
            <Text variant="body" tone="secondary">No place matches that name.</Text>
          ) : null}
        </>
      ) : (
        <View style={styles.list}>
          {nearest.map(({ site, distanceM }) => (
            <SiteRow
              key={site.id}
              siteId={site.id}
              name={site.name}
              summary={site.summary}
              here={site.id === atSiteId}
              distance={distanceM !== null ? formatDistance(distanceM, unit) : null}
              hint={ui(site.id === atSiteId ? 'You are already here' : canTravel ? 'Travel here' : 'Move the view here')}
              onPress={() => choose({ key: `site:${site.id}`, kind: 'heritage', name: site.name, detail: site.summary, coordinate: site.coordinate })}
            />
          ))}
        </View>
      )}
    </BottomSheet>
  );
}

function SiteRow({
  siteId,
  name,
  summary,
  here,
  distance,
  hint,
  onPress,
}: {
  siteId: string;
  name: string;
  summary: string | null;
  here: boolean;
  distance: string | null;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, here && styles.rowHere, pressed && styles.pressed]}
    >
      <SiteVisual siteId={siteId} height={76} quiet style={styles.thumb} />
      <View style={styles.rowText}>
        <Text variant="heading" numberOfLines={1} ellipsizeMode="tail" translate={false}>
          {name}
        </Text>
        {summary ? (
          <Text variant="caption" tone="secondary" numberOfLines={1} ellipsizeMode="tail" translate={false}>
            {summary}
          </Text>
        ) : null}
      </View>
      <Text variant="mono" tone="sandstone" numberOfLines={1}>
        {here ? 'you are here' : distance ?? '—'}
      </Text>
    </Pressable>
  );
}

function ResultRow({
  name,
  detail,
  distance,
  hint,
  onPress,
}: {
  name: string;
  detail: string | null;
  distance: string | null;
  hint?: string;
  onPress: () => void;
}) {
  const line = [detail, distance].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={line ? `${name}, ${line}` : name}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.placeRow, pressed && styles.pressed]}
    >
      <Text variant="bodyStrong" numberOfLines={1} translate={false}>{name}</Text>
      {line ? (
        <Text variant="caption" tone="secondary" numberOfLines={1} translate={false}>{line}</Text>
      ) : null}
    </Pressable>
  );
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
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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

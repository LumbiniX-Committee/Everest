import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/common';
import { Mascot } from '@/components/mascot';
import { Button, Card, Chip, ChipRow, Icon, Screen, SearchField, Text, type IconName } from '@/components/ui';
import { HUB_BOUNDS, HUB_CENTRES, essentialsFor, essentialsNear, findTrek, trekStop } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { application } from '@/services';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import type { DistanceUnit, Essential, EssentialKind } from '@/types';
import { distanceMeters, formatDistance } from '@/utils';

export const KIND_LABELS: Record<EssentialKind, string> = {
  stay: 'Hotels',
  food: 'Eat',
  health: 'Health',
  money: 'Money',
  travel: 'Travel',
  transport: 'Transport',
  police: 'Police',
};
const KIND_ICONS: Record<EssentialKind, IconName> = {
  stay: 'bed-outline',
  food: 'silverware-fork-knife',
  health: 'medical-bag',
  money: 'cash-multiple',
  travel: 'bag-suitcase-outline',
  transport: 'bus',
  police: 'police-badge-outline',
};
const KINDS = Object.keys(KIND_LABELS) as EssentialKind[];
const HUB_LABELS = { lumbini: 'Lumbini', kathmandu: 'Kathmandu', pokhara: 'Pokhara', chitwan: 'Chitwan' } as const;
type Hub = keyof typeof HUB_LABELS;
const HUBS = Object.keys(HUB_LABELS) as Hub[];
/** Where to start when nothing else says: the capital, where most visitors land. */
const FALLBACK_HUB: Hub = 'kathmandu';
/** Near me widens step by step until something is in range. */
const NEAR_RADII_M = [3000, 10000, 25000];
/** Items per category in the grouped overview, and per page in a single category. */
const GROUP_PREVIEW = 3;
const PAGE = 30;

type Listed = Essential & { distanceM: number | null };

const isHub = (value: string | undefined | null): value is Hub => !!value && value in HUB_LABELS;

function hubContaining(point: { latitude: number; longitude: number }): Hub | null {
  return (
    HUBS.find((hub) => {
      const b = HUB_BOUNDS[hub];
      return point.latitude >= b.south && point.latitude <= b.north && point.longitude >= b.west && point.longitude <= b.east;
    }) ?? null
  );
}

/** Case- and diacritic-insensitive, so "pokhara" finds "Pokharā" and "lake side" finds "Lakeside". */
const fold = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');

const categoryText = (category: string) => {
  const words = category.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

type Point = { latitude: number; longitude: number };

/** The places for one area, nearest first, before any search or category filter. */
function listFor(
  trekId: string | undefined,
  near: string | undefined,
  area: Hub | 'near',
  coordinate: Point | null,
): { base: Listed[]; radiusM: number | null } {
  const withDistance = (list: Essential[]): Listed[] => {
    const from: Point | null =
      coordinate ?? (trekId || area === 'near' ? null : { longitude: HUB_CENTRES[area][0], latitude: HUB_CENTRES[area][1] });
    return list
      .map((item) => ({ ...item, d: from ? distanceMeters(from, item.coordinate) : null }))
      .sort((a, b) => (a.d ?? 0) - (b.d ?? 0) || b.confidence - a.confidence)
      // Distance is shown only from the visitor's own position, never from a hub centre.
      .map(({ d, ...item }) => ({ ...item, distanceM: coordinate ? d : null }));
  };
  if (trekId) return { base: withDistance(essentialsFor(trekId, null, near)), radiusM: null };
  if (area === 'near' && coordinate) {
    for (const radius of NEAR_RADII_M) {
      const found = essentialsNear(coordinate, radius);
      if (found.length >= 5 || radius === NEAR_RADII_M[NEAR_RADII_M.length - 1]) return { base: found, radiusM: radius };
    }
  }
  return { base: withDistance(essentialsFor(area === 'near' ? FALLBACK_HUB : area)), radiusM: null };
}

function searchList(list: Listed[], query: string): Listed[] {
  const needle = fold(query);
  if (!needle) return list;
  return list.filter((item) => fold(`${item.name} ${item.address ?? ''} ${item.category}`).includes(needle));
}

function countByKind(list: Listed[]): Record<EssentialKind, number> {
  const out = Object.fromEntries(KINDS.map((id) => [id, 0])) as Record<EssentialKind, number>;
  for (const item of list) out[item.kind] += 1;
  return out;
}

/**
 * Where to stay, eat, get help or money: practical places from Overture Maps,
 * each with its source and licence. Opening hours are not in this data, so
 * none are shown; the phone number is the reliable way to check.
 *
 * Always opens on a list. The area is, in order: the one asked for, the home
 * hub, the hub the phone is standing in, else Kathmandu — so a visitor whose
 * position has not arrived yet still sees something useful at once. The list is
 * bundled, so it works offline; only directions and websites need signal.
 */
export function EssentialsScreen({ area, near, kind: initialKind }: { area?: string; near?: string; kind?: string }) {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  const { preferences } = usePreferences();
  const { coordinate } = useCurrentPosition({ watch: true });
  const trek = findTrek(area);
  const asked: Hub | 'near' | null = isHub(area) ? area : isHub(preferences.homeHub) ? preferences.homeHub : preferences.homeHub === 'near-me' ? 'near' : null;
  const [picked, setPicked] = useState<Hub | 'near' | null>(asked);
  const [kind, setKind] = useState<EssentialKind | null>(
    initialKind && initialKind in KIND_LABELS ? (initialKind as EssentialKind) : null,
  );
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void application.isOnline().then((value) => active && setOnline(value));
    return () => {
      active = false;
    };
  }, []);

  // Until someone picks, follow the phone: the hub it is in, else the fallback.
  const positionHub = coordinate ? hubContaining(coordinate) : null;
  const selected: Hub | 'near' = picked ?? positionHub ?? FALLBACK_HUB;
  // Near me with no fix yet shows a real area meanwhile rather than an empty page.
  const waitingForPosition = selected === 'near' && !coordinate;
  const effective: Hub | 'near' = waitingForPosition ? positionHub ?? FALLBACK_HUB : selected;

  const choose = (next: Hub | 'near') => {
    setPicked(next);
    setLimit(PAGE);
  };
  const chooseKind = (next: EssentialKind | null) => {
    setKind(next);
    setLimit(PAGE);
  };

  // Left to the React Compiler to memoise; a manual memo here conflicts with
  // `trek` being passed on to trekStop below. A thousand rows filter in well under a frame.
  const { base, radiusM } = listFor(trek?.id, near, effective, coordinate);
  const searched = searchList(base, query);
  const counts = countByKind(searched);

  const shown = kind ? searched.filter((item) => item.kind === kind) : searched;
  const grouped = !kind && !query;
  const stop = trek ? trekStop(trek, near) : undefined;
  const title = trek ? (stop ? `${ui('Near')} ${stop.name}` : trek.name) : ui('Essentials');
  const areaName = trek ? null : effective === 'near' ? ui('Near me') : ui(HUB_LABELS[effective]);
  const order = coordinate ? ui('nearest to you first') : ui('nearest to the centre first');
  const radiusText = radiusM ? formatDistance(radiusM, preferences.distanceUnit) : null;
  // Nepali puts the postposition after the distance: "३ किमी भित्र".
  const within = radiusText
    ? preferences.interfaceLanguage === 'ne'
      ? `${radiusText} ${ui('within')}`
      : `${ui('within')} ${radiusText}`
    : null;
  const status = [
    `${shown.length} ${ui('places')}`,
    within ?? areaName,
    shown.length > 1 ? order : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const directions = (item: Essential) => router.dismissTo({ pathname: '/(main)/tirtha/map', params: { guideTo: item.id } });

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow={trek ? trek.name : 'Essentials'}
        title={title}
        subtitle="Places to stay, eat, get help or money. Call ahead: opening hours are not known."
      />

      <SearchField value={query} onChangeText={setQuery} placeholder="Search by name or street" />

      {!trek ? (
        <ChipRow style={styles.chipRow}>
          <Chip label="Near me" icon="crosshairs-gps" selected={selected === 'near'} onPress={() => choose('near')} />
          {HUBS.map((id) => (
            <Chip key={id} label={HUB_LABELS[id]} selected={selected === id} onPress={() => choose(id)} />
          ))}
        </ChipRow>
      ) : null}
      <ChipRow>
        <Chip label="All" count={searched.length} selected={kind == null} onPress={() => chooseKind(null)} />
        {KINDS.filter((id) => counts[id] > 0 || kind === id).map((id) => (
          <Chip
            key={id}
            label={KIND_LABELS[id]}
            icon={KIND_ICONS[id]}
            count={counts[id]}
            selected={kind === id}
            onPress={() => chooseKind(kind === id ? null : id)}
          />
        ))}
      </ChipRow>

      {waitingForPosition ? (
        <Notice icon="crosshairs-gps" text={`${ui('Finding your position. Meanwhile, showing')} ${ui(HUB_LABELS[effective === 'near' ? FALLBACK_HUB : effective])}.`} />
      ) : null}
      {online === false ? (
        <Notice icon="wifi-off" text={ui('You are offline. These listings are saved on this phone; maps and websites need a connection.')} />
      ) : null}

      <Text variant="caption" tone="secondary" style={styles.status} translate={false}>
        {status}
      </Text>

      {shown.length === 0 ? (
        <View style={styles.emptyRow}>
          <Mascot name="monkey" height={80} />
          <Text variant="body" tone="secondary" style={styles.flex}>
            {query ? 'Nothing matches your search here. Try another word or area.' : 'Nothing of this kind is listed here yet.'}
          </Text>
        </View>
      ) : grouped ? (
        KINDS.filter((id) => counts[id] > 0).map((id) => (
          <View key={id} style={styles.group}>
            <View style={styles.groupHead}>
              <Icon name={KIND_ICONS[id]} size={18} color={colors.primary} />
              <Text variant="heading" style={styles.flex}>
                {KIND_LABELS[id]}
              </Text>
              <Text variant="caption" tone="muted" translate={false}>
                {String(counts[id])}
              </Text>
            </View>
            {shown
              .filter((item) => item.kind === id)
              .slice(0, GROUP_PREVIEW)
              .map((item) => (
                <EssentialCard key={item.id} item={item} unit={preferences.distanceUnit} onDirections={() => directions(item)} />
              ))}
            {counts[id] > GROUP_PREVIEW ? (
              <Button
                label={`${ui('See all')} ${counts[id]}`}
                variant="quiet"
                size="sm"
                icon="chevron-right"
                onPress={() => chooseKind(id)}
              />
            ) : null}
          </View>
        ))
      ) : (
        <View style={styles.group}>
          {shown.slice(0, limit).map((item) => (
            <EssentialCard key={item.id} item={item} unit={preferences.distanceUnit} onDirections={() => directions(item)} />
          ))}
          {shown.length > limit ? (
            <Button label="Show more" variant="secondary" block onPress={() => setLimit((value) => value + PAGE)} />
          ) : null}
        </View>
      )}

      <Text variant="caption" tone="muted" style={styles.note}>
        From Overture Maps Places, an open dataset. Listings are not checked on site and can be out of date.
      </Text>
    </Screen>
  );
}

function Notice({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.notice}>
      <Icon name={icon} size={18} color={colors.textSecondary} />
      <Text variant="caption" tone="secondary" style={styles.flex} translate={false}>
        {text}
      </Text>
    </View>
  );
}

function EssentialCard({ item, unit, onDirections }: { item: Listed; unit: DistanceUnit; onDirections: () => void }) {
  const meta = [categoryText(item.category), item.distanceM != null ? formatDistance(item.distanceM, unit) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Card style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.kindTile}>
          <Icon name={KIND_ICONS[item.kind]} size={18} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text variant="bodyStrong" translate={false} numberOfLines={2}>
            {item.name}
          </Text>
          <Text variant="caption" tone="secondary" translate={false} numberOfLines={1}>
            {meta}
          </Text>
          {item.address ? (
            <Text variant="caption" tone="muted" translate={false} numberOfLines={1}>
              {item.address}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Directions" icon="directions" variant="secondary" size="sm" onPress={onDirections} />
        {item.phone ? (
          <Button
            label="Call"
            icon="phone-outline"
            variant="secondary"
            size="sm"
            onPress={() => void Linking.openURL(`tel:${item.phone}`)}
          />
        ) : null}
        {item.website ? (
          <Button label="Website" icon="web" variant="quiet" size="sm" onPress={() => void application.openExternal(item.website!)} />
        ) : null}
      </View>
      <Text variant="caption" tone="muted" translate={false} numberOfLines={1}>
        {`Overture Maps · ${item.source} · ${item.license}`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chipRow: { marginTop: spacing.sm },
  status: { marginTop: spacing.sm, marginBottom: spacing.xs },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
  },
  group: { gap: spacing.sm, marginTop: spacing.base },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  card: { padding: spacing.md, gap: spacing.sm },
  cardHead: { flexDirection: 'row', gap: spacing.md },
  kindTile: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  note: { marginTop: spacing.lg, marginBottom: spacing.xl },
});

import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/common';
import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { HUB_CENTRES, essentialsFor, essentialsNear, findTrek, trekStop } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { application } from '@/services';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';
import type { Essential, EssentialKind } from '@/types';
import { distanceMeters, formatDistance } from '@/utils';

export const KIND_LABELS: Record<EssentialKind, string> = {
  stay: 'Stay',
  food: 'Eat',
  health: 'Health',
  money: 'Money',
  travel: 'Travel',
  transport: 'Transport',
  police: 'Police',
};
const KINDS = Object.keys(KIND_LABELS) as EssentialKind[];
const HUB_LABELS = { lumbini: 'Lumbini', kathmandu: 'Kathmandu', pokhara: 'Pokhara', chitwan: 'Chitwan' } as const;
type Hub = keyof typeof HUB_LABELS;
const NEAR_ME_RADIUS_M = 3000;

/**
 * Where to stay, eat, get help or money: practical places from Overture Maps,
 * each with its source and licence. Opening hours are not in this data, so
 * none are shown; the phone number is the reliable way to check.
 */
export function EssentialsScreen({ area, near, kind: initialKind }: { area?: string; near?: string; kind?: string }) {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  const { preferences } = usePreferences();
  const { coordinate } = useCurrentPosition({ watch: true });
  const trek = findTrek(area);
  const startHub: Hub | 'near' =
    area && area in HUB_LABELS ? (area as Hub) : preferences.homeHub in HUB_LABELS ? (preferences.homeHub as Hub) : 'near';
  const [hub, setHub] = useState<Hub | 'near'>(startHub);
  const [kind, setKind] = useState<EssentialKind | null>(
    initialKind && initialKind in KIND_LABELS ? (initialKind as EssentialKind) : null,
  );

  const items = useMemo(() => {
    const from = coordinate ?? (hub !== 'near' ? { longitude: HUB_CENTRES[hub][0], latitude: HUB_CENTRES[hub][1] } : null);
    const withDistance = (list: Essential[]) =>
      list
        .map((item) => ({ ...item, distanceM: from ? distanceMeters(from, item.coordinate) : null }))
        .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0) || b.confidence - a.confidence);
    if (trek) return withDistance(essentialsFor(trek.id, kind, near));
    if (hub === 'near') return coordinate ? essentialsNear(coordinate, NEAR_ME_RADIUS_M, kind) : [];
    return withDistance(essentialsFor(hub, kind));
  }, [trek, near, hub, kind, coordinate]);

  const stop = trek ? trekStop(trek, near) : undefined;
  const title = trek ? (stop ? `${ui('Near')} ${stop.name}` : trek.name) : ui('Essentials');

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow={trek ? trek.name : 'Essentials'}
        title={title}
        subtitle="Places to stay, eat, get help or money. Call ahead: opening hours are not known."
      />

      {!trek ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={ui('Near me')} selected={hub === 'near'} onPress={() => setHub('near')} />
          {(Object.keys(HUB_LABELS) as Hub[]).map((id) => (
            <Chip key={id} label={HUB_LABELS[id]} selected={hub === id} onPress={() => setHub(id)} />
          ))}
        </ScrollView>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={ui('All')} selected={kind == null} onPress={() => setKind(null)} />
        {KINDS.map((id) => (
          <Chip key={id} label={ui(KIND_LABELS[id])} selected={kind === id} onPress={() => setKind(id)} />
        ))}
      </ScrollView>

      {hub === 'near' && !trek && !coordinate ? (
        <Text variant="body" tone="secondary" style={styles.empty}>
          Waiting for your position. Pick an area above to browse instead.
        </Text>
      ) : items.length === 0 ? (
        <Text variant="body" tone="secondary" style={styles.empty}>
          Nothing of this kind is listed here yet.
        </Text>
      ) : (
        <View style={styles.list}>
          {items.slice(0, 80).map((item) => (
            <Card key={item.id}>
              <Text variant="label" tone="muted" uppercase translate={false}>
                {`${ui(KIND_LABELS[item.kind])} · ${item.category.replace(/_/g, ' ')}`}
              </Text>
              <Text variant="bodyStrong" translate={false}>
                {item.name}
              </Text>
              {item.address ? (
                <Text variant="caption" tone="secondary" translate={false}>
                  {item.address}
                </Text>
              ) : null}
              {item.distanceM != null ? (
                <Text variant="caption" tone="secondary" translate={false}>
                  {formatDistance(item.distanceM, preferences.distanceUnit)}
                </Text>
              ) : null}
              <View style={styles.actions}>
                {item.phone ? (
                  <Button label="Call" icon="phone-outline" variant="secondary" onPress={() => void Linking.openURL(`tel:${item.phone}`)} />
                ) : null}
                <Button
                  label="Directions"
                  icon="directions"
                  variant="secondary"
                  onPress={() => router.dismissTo({ pathname: '/(main)/tirtha/map', params: { guideTo: item.id } })}
                />
                {item.website ? (
                  <Button label="Website" variant="quiet" onPress={() => void application.openExternal(item.website!)} />
                ) : null}
              </View>
              <Text variant="caption" tone="muted" translate={false}>
                {`Overture Maps · ${item.source} · ${item.license}`}
              </Text>
            </Card>
          ))}
        </View>
      )}
      <Text variant="caption" tone="muted" style={styles.note}>
        From Overture Maps Places, an open dataset. Listings are not checked on site and can be out of date.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: spacing.xs, paddingVertical: spacing.xs },
  list: { gap: spacing.md, marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  empty: { marginTop: spacing.lg },
  note: { marginTop: spacing.lg, marginBottom: spacing.xl },
});

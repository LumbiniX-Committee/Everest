/**
 * app/src/screens/TirthaScreen.tsx — the map home.
 *
 * A dark map centred on Lumbini, site pins by tier, live position, and a single
 * bottom card: nearest site, distance, and "N viewpoints need a resurvey" —
 * stated as fact, not exhortation (07-DESIGN-SYSTEM §5).
 *
 * The MapLibre surface itself is lane B's (it owns the native map dependency);
 * this screen renders everything around it and hands B a single slot to mount
 * the map into. All the non-map logic — nearest site, distance label — comes
 * from app/src/map/geofence.ts, which is tested.
 *
 * Screen bodies live here as plain components; the route file under app/app/ is
 * a three-line wrapper, so a different router in B's starter kit costs three
 * lines, not a rewrite.
 */

import type { ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import type { Coords, Site } from '../../../shared/types.ts';
import { nearestSite, type GeofenceSite } from '../map/geofence.ts';
import { color, space, radius, border } from '../design/tokens';
import { Txt } from '../design/ui';

export interface TirthaScreenProps {
  sites: Site[];
  /** Live device position, or null while it is still resolving. */
  position: Coords | null;
  /** How many active vantages currently need a resurvey. */
  resurveyCount: number;
  /** Lane B mounts the MapLibre view into this slot. */
  mapSlot?: ReactNode;
  onOpenSite: (siteId: string) => void;
  loading?: boolean;
}

export function TirthaScreen({
  sites,
  position,
  resurveyCount,
  mapSlot,
  onOpenSite,
  loading,
}: TirthaScreenProps) {
  const geofenceSites: GeofenceSite[] = sites.map((s) => ({
    id: s.id,
    coords: s.coords,
    geofence_m: s.geofence_m,
  }));
  const near = position ? nearestSite(position, geofenceSites) : null;
  const nearSite = near ? sites.find((s) => s.id === near.site.id) ?? null : null;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      {/* Map surface — lane B mounts MapLibre + PMTiles here. */}
      <View style={{ flex: 1 }}>
        {mapSlot ?? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Txt role="label" tone="sand_faint">
              {loading ? 'loading' : 'map mounts here'}
            </Txt>
          </View>
        )}
      </View>

      {/* The single bottom card. */}
      <View
        style={{
          position: 'absolute',
          left: space.lg,
          right: space.lg,
          bottom: space.xl,
          backgroundColor: color.ground2,
          borderColor: color.ground3,
          borderWidth: border.hairline,
          borderRadius: radius.lg,
          padding: space.lg,
        }}
      >
        {nearSite && near ? (
          <Pressable onPress={() => onOpenSite(nearSite.id)} accessibilityRole="button">
            <Txt role="label" tone="sand_dim">
              nearest
            </Txt>
            <Txt role="title" tone="white" style={{ marginTop: space.xs }}>
              {nearSite.name.en}
            </Txt>
            <Txt role="body" tone="sand" style={{ marginTop: 2 }}>
              {nearSite.name.ne}
            </Txt>
            <Txt role="data" tone="sand_dim" style={{ marginTop: space.sm }}>
              {near.label} {near.compass}
            </Txt>
          </Pressable>
        ) : (
          <Txt role="body" tone="sand_dim">
            {position ? 'No monuments nearby.' : 'Finding your position.'}
          </Txt>
        )}

        {/* Call to action, stated as fact. */}
        <View style={{ marginTop: space.md }}>
          {resurveyCount > 0 ? (
            <Txt role="body" tone="seek">
              {resurveyCount === 1
                ? '1 viewpoint needs a resurvey'
                : `${resurveyCount} viewpoints need a resurvey`}
            </Txt>
          ) : (
            <Txt role="body" tone="resolved">
              Every viewpoint here is current. Nothing needs you today.
            </Txt>
          )}
        </View>
      </View>
    </View>
  );
}

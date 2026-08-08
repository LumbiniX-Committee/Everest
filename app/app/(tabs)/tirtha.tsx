/**
 * Route wrapper — expo-router mounts this at /(tabs)/tirtha.
 *
 * Thin by design: it loads data and hands it to TirthaScreen. If B's starter
 * kit uses a different router, only this file changes. Live position comes from
 * lane B's expo-location; until that is wired we fall back to Lumbini centre.
 */

import { useEffect, useState } from 'react';
import type { Coords, Site } from '../../../shared/types.ts';
import { TirthaScreen } from '../../src/screens/TirthaScreen';
import { api } from '../../src/api/client';
import { LUMBINI_CENTRE } from '../../../shared/geo.ts';
// import { router } from 'expo-router';        // B: wire navigation
// import * as Location from 'expo-location';   // B: wire live position

export default function TirthaRoute() {
  const [sites, setSites] = useState<Site[]>([]);
  const [position, setPosition] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .sites()
      .then(setSites)
      .finally(() => setLoading(false));
    setPosition(LUMBINI_CENTRE); // B: replace with Location.watchPositionAsync
  }, []);

  return (
    <TirthaScreen
      sites={sites}
      position={position}
      resurveyCount={0} // B/C: derive from /vantages/next coverage
      loading={loading}
      onOpenSite={(id) => {
        // router.push(`/site/${id}`);
        void id;
      }}
    />
  );
}

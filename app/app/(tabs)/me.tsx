/**
 * Route wrapper — /(tabs)/me. Loads merit + sites and renders MeScreen.
 * The chaityāvalī register comes from local state (lane A's db/queue) once wired;
 * until then it renders empty, which is a valid, designed state.
 */

import { useEffect, useState } from 'react';
import type { MeritSummary, ChaityavaliEntry, Site } from '../../../shared/types.ts';
import { MeScreen } from '../../src/screens/MeScreen';
import { api } from '../../src/api/client';

export default function MeRoute() {
  const [merit, setMerit] = useState<MeritSummary | null>(null);
  const [siteById, setSiteById] = useState<Record<string, Site>>({});
  const register: ChaityavaliEntry[] = []; // A: bind from local ChaityavaliRegister

  useEffect(() => {
    api.meritMe().then(setMerit);
    api.sites().then((s) => setSiteById(Object.fromEntries(s.map((x) => [x.id, x]))));
  }, []);

  if (!merit) return null; // A: render a loading state
  return <MeScreen merit={merit} register={register} siteById={siteById} />;
}

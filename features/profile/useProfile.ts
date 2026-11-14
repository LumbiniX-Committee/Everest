import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { StorageKeys } from '@/constants';
import { database, storage } from '@/services';
import { useQuests } from '@/store';

/** The longest name kept. A profile label, not a biography. */
export const DISPLAY_NAME_MAX = 40;

export type ProfileStats = {
  places: number;
  photos: number;
  reports: number;
  quests: number;
};

/**
 * The visitor's profile: a name they chose and the counts from their record.
 *
 * Both live on this phone only. The name is an AsyncStorage string that no
 * sync, upload or analytics path reads — the app's promise is that it never
 * collects a name — and the counts are read from the local database, so they
 * work offline and are never estimated. Reloaded on focus, so a name changed
 * on the Profile screen shows on Settings when you come back.
 */
export function useProfile() {
  const { completedQuests } = useQuests();
  const [displayName, setDisplayNameState] = useState('');
  const [counts, setCounts] = useState<Omit<ProfileStats, 'quests'> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const [name, visits, photos, reports] = await Promise.all([
          storage.getString(StorageKeys.profileDisplayName),
          database.listSiteVisits().catch(() => []),
          database.countObservations().catch(() => 0),
          database.listConditionReports().catch(() => []),
        ]);
        if (!active) return;
        setDisplayNameState(name ?? '');
        setCounts({ places: visits.length, photos, reports: reports.length });
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const setDisplayName = useCallback(async (next: string) => {
    const clean = next.replace(/\s+/g, ' ').trim().slice(0, DISPLAY_NAME_MAX);
    setDisplayNameState(clean);
    if (clean) await storage.setString(StorageKeys.profileDisplayName, clean);
    else await storage.remove(StorageKeys.profileDisplayName);
  }, []);

  const stats: ProfileStats | null = counts ? { ...counts, quests: completedQuests.length } : null;
  return { displayName, setDisplayName, stats };
}

/** Up to two initials from a chosen name, in any script; empty when there is no name. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const first = Array.from(words[0])[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? '') : '';
  return (first + last).toUpperCase();
}

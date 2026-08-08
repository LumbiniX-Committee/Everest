/**
 * Route wrapper — /(tabs)/quests. Loads quests for the current position and
 * renders QuestsScreen. Position from lane B's expo-location; Lumbini centre
 * until wired.
 */

import { useEffect, useState } from 'react';
import type { Quest, QuestState } from '../../../shared/types.ts';
import { QuestsScreen, type QuestListItem } from '../../src/screens/QuestsScreen';
import { api } from '../../src/api/client';
import { LUMBINI_CENTRE } from '../../../shared/geo.ts';

export default function QuestsRoute() {
  const [items, setItems] = useState<QuestListItem[]>([]);

  useEffect(() => {
    api.quests(LUMBINI_CENTRE.lat, LUMBINI_CENTRE.lon).then((rows) => {
      setItems(
        rows.map((r) => ({
          quest: r.quest as Quest,
          state: {
            quest_id: (r.quest as Quest).id,
            availability: r.availability as QuestState['availability'],
            distance_m: r.distance_m,
            completed_at: null,
          },
        })),
      );
    });
  }, []);

  return (
    <QuestsScreen
      items={items}
      onOpen={(id) => {
        // router.push(`/quest/${id}`)  — detail + completion flow
        void id;
      }}
    />
  );
}

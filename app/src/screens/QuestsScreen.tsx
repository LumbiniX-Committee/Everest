/**
 * app/src/screens/QuestsScreen.tsx — the sangha-task list.
 *
 * A list that ends. The terminal card says "That's everything." — never
 * infinite scroll, never "come back tomorrow" (07-DESIGN-SYSTEM §5, charter's
 * anti-craving stance). Each row shows availability plainly; a quest that is
 * too far or outside its window says so without scolding.
 */

import { View, Pressable } from 'react-native';
import type { Quest, QuestState, QuestAvailability } from '../../../shared/types.ts';
import { color, space, border, radius } from '../design/tokens';
import { emptyStates } from '../design/copy/empty-states.ts';
import { Txt } from '../design/ui';

export interface QuestListItem {
  quest: Quest;
  state: QuestState;
}

export interface QuestsScreenProps {
  items: QuestListItem[];
  onOpen: (questId: string) => void;
}

const AVAILABILITY_LABEL: Record<QuestAvailability, string> = {
  available: 'available now',
  too_far: 'walk closer',
  outside_window: 'another time',
  completed: 'done',
  rate_limited: 'again tomorrow',
};

const AVAILABILITY_TONE: Record<QuestAvailability, 'seek' | 'sand_dim' | 'resolved'> = {
  available: 'seek',
  too_far: 'sand_dim',
  outside_window: 'sand_dim',
  completed: 'resolved',
  rate_limited: 'sand_dim',
};

export function QuestsScreen({ items, onOpen }: QuestsScreenProps) {
  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: color.ground, padding: space.lg, justifyContent: 'center' }}>
        <Txt role="body" tone="sand_dim">
          {emptyStates.noQuests.en}
        </Txt>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.ground, padding: space.lg }}>
      {items.map(({ quest, state }) => {
        const available = state.availability === 'available';
        return (
          <Pressable
            key={quest.id}
            onPress={() => available && onOpen(quest.id)}
            disabled={!available}
            accessibilityRole="button"
            style={{
              marginBottom: space.sm,
              padding: space.md,
              borderColor: color.ground3,
              borderWidth: border.hairline,
              borderRadius: radius.md,
              opacity: available ? 1 : 0.6,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt role="label" tone={AVAILABILITY_TONE[state.availability]}>
                {AVAILABILITY_LABEL[state.availability]}
              </Txt>
              <Txt role="data" tone="sand_dim">
                {quest.merit} puṇya
              </Txt>
            </View>
            <Txt role="title" tone="white" style={{ marginTop: space.xs }}>
              {quest.title.en}
            </Txt>
            <Txt role="bodySm" tone="sand" style={{ marginTop: 2 }}>
              {quest.title.ne}
            </Txt>
            <Txt role="bodySm" tone="sand_dim" style={{ marginTop: space.sm }}>
              {quest.description.en}
            </Txt>
            {state.distance_m != null && !available && state.availability === 'too_far' && (
              <Txt role="data" tone="sand_faint" style={{ marginTop: space.xs }}>
                {state.distance_m} m away
              </Txt>
            )}
          </Pressable>
        );
      })}

      {/* The feed ends. */}
      <View style={{ alignItems: 'center', paddingVertical: space.xl }}>
        <Txt role="body" tone="sand_faint">
          {emptyStates.endOfList.en}
        </Txt>
      </View>
    </View>
  );
}

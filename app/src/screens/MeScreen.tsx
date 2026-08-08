/**
 * app/src/screens/MeScreen.tsx — merit and the chaityāvalī register.
 *
 * Merit balance in the large data face; today's earning against the cap as a
 * bar that COMPLETES AND STOPS; the register of witnessed sites. No streak, no  lint-vocab:allow
 * leaderboard, no comparison to anyone (07-DESIGN-SYSTEM §5).  lint-vocab:allow
 *
 * On reaching the cap the bar shows "You've done enough today." — it does not
 * count down to tomorrow and it does not nag (05-CONTENT-SPEC §6).
 */

import { View } from 'react-native';
import type { MeritSummary, ChaityavaliEntry, Site } from '../../../shared/types.ts';
import { color, space, border, radius } from '../design/tokens';
import { emptyStates } from '../design/copy/empty-states.ts';
import { Txt, Rule } from '../design/ui';

export interface MeScreenProps {
  merit: MeritSummary;
  register: ChaityavaliEntry[];
  /** For rendering site names in the register. */
  siteById: Record<string, Site>;
}

export function MeScreen({ merit, register, siteById }: MeScreenProps) {
  const pct = merit.cap > 0 ? Math.min(1, merit.today / merit.cap) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground, padding: space.lg }}>
      <Txt role="label" tone="sand_dim">
        puṇya
      </Txt>
      <Txt role="dataLg" tone="white" style={{ marginTop: space.xs }}>
        {merit.balance}
      </Txt>

      {/* Today's bar — completes and stops. */}
      <View style={{ marginTop: space.lg }}>
        <View
          style={{
            height: 6,
            backgroundColor: color.ground3,
            borderRadius: radius.pill,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${pct * 100}%`,
              height: '100%',
              backgroundColor: merit.complete ? color.resolved : color.seek,
            }}
          />
        </View>
        <Txt role="data" tone="sand_dim" style={{ marginTop: space.sm }}>
          {merit.complete ? emptyStates.capReached.en : `${merit.today} / ${merit.cap} today`}
        </Txt>
      </View>

      <Rule />

      {/* Chaityāvalī — a register, never a collection. */}
      <Txt role="label" tone="sand_dim">
        chaityāvalī · witnessed
      </Txt>
      {register.length === 0 ? (
        <Txt role="body" tone="sand_dim" style={{ marginTop: space.md }}>
          {emptyStates.noCaptures.en}
        </Txt>
      ) : (
        register.map((entry) => {
          const site = siteById[entry.site_id];
          return (
            <View
              key={entry.site_id}
              style={{
                marginTop: space.sm,
                padding: space.md,
                borderColor: color.ground3,
                borderWidth: border.hairline,
                borderRadius: radius.md,
              }}
            >
              <Txt role="title" tone="white">
                {site ? site.name.en : entry.site_id}
              </Txt>
              {site && (
                <Txt role="bodySm" tone="sand" style={{ marginTop: 2 }}>
                  {site.name.ne}
                </Txt>
              )}
              <Txt role="data" tone="sand_dim" style={{ marginTop: space.sm }}>
                {entry.capture_ids.length} view{entry.capture_ids.length === 1 ? '' : 's'} ·{' '}
                {entry.days_visited} day{entry.days_visited === 1 ? '' : 's'}
              </Txt>
            </View>
          );
        })
      )}
    </View>
  );
}

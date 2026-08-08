/**
 * app/src/screens/CloseRitualCard.tsx — the moment the app closes itself.
 *
 * Shown when SessionCloseTracker (app/src/session/closeRitual.ts) fires. Every-
 * thing fades except one line and a single Close button. No "continue anyway",
 * no dismiss-X in the corner — the only way out is Close or locking the phone
 * (07-DESIGN-SYSTEM §7). The most memorable thirty seconds of the demo.
 */

import { View, Pressable } from 'react-native';
import { color, space, border, radius } from '../design/tokens';
import { Txt } from '../design/ui';

export interface CloseRitualCardProps {
  onClose: () => void;
}

export function CloseRitualCard({ onClose }: CloseRitualCardProps) {
  return (
    <View
      style={{
        ...StyleSheetAbsoluteFill,
        backgroundColor: color.ground,
        alignItems: 'center',
        justifyContent: 'center',
        padding: space.xl,
      }}
    >
      <Txt role="title" tone="white" style={{ textAlign: 'center' }}>
        You came here to see this place.
      </Txt>
      <Txt role="body" tone="sand_dim" style={{ textAlign: 'center', marginTop: space.sm }}>
        We'll be here when you get back.
      </Txt>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        style={{
          marginTop: space.xxl,
          paddingVertical: space.md,
          paddingHorizontal: space.xl,
          borderColor: color.ground3,
          borderWidth: border.hairline,
          borderRadius: radius.md,
        }}
      >
        <Txt role="label" tone="sand">
          close
        </Txt>
      </Pressable>
    </View>
  );
}

/** Inlined so this file needs nothing but react-native's View. */
const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

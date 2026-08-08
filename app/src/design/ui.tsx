/**
 * app/src/design/ui.tsx — the two primitives every screen is built from.
 *
 * `Txt` applies a type role (07 §3) and a colour token in one place, so no
 * screen hand-rolls font families. `Screen` is the dark ground every surface
 * sits on — the interface is dark because the instrument requires it (07 §1).
 *
 * Imports react-native, so it only typechecks once B's build lands. Deps are
 * limited to react + react-native so it never breaks the native build.
 */

import type { ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { color, space, type ColorToken } from './tokens';
import { type, type TypeToken } from './type';

export function Txt({
  role = 'body',
  tone = 'sand',
  children,
  style,
}: {
  role?: TypeToken;
  tone?: ColorToken;
  children: ReactNode;
  style?: object;
}) {
  const r = type[role];
  return (
    <Text
      style={[
        {
          fontFamily: r.family,
          fontSize: r.size,
          lineHeight: r.lh,
          fontWeight: String(r.weight) as never,
          letterSpacing: 'ls' in r ? r.ls : undefined,
          textTransform: 'transform' in r ? r.transform : undefined,
          color: color[tone],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Screen({ children, scroll = false }: { children: ReactNode; scroll?: boolean }) {
  const inner = (
    <View style={{ flex: 1, backgroundColor: color.ground, padding: space.lg }}>{children}</View>
  );
  if (!scroll) return inner;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.ground }} contentContainerStyle={{ padding: space.lg }}>
      {children}
    </ScrollView>
  );
}

/** A thin divider in the border tone. */
export function Rule() {
  return <View style={{ height: 1, backgroundColor: color.ground3, marginVertical: space.md }} />;
}

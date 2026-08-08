/**
 * app/src/design/Reticle.tsx — the signature element, at three scales.
 *
 * Source: 07-DESIGN-SYSTEM §4. One object, three scales (full / badge / icon),
 * and the whole visual language of the app derives from it. Everything else is
 * disciplined to near-invisibility.
 *
 * Built from plain <View> borders — NO react-native-svg dependency — so it
 * cannot break B's native build. Four corner brackets; their separation is
 * driven by `1 - align`, exactly as §4 specifies: the reticle physically closes
 * as you get the shot right, then crosses from amber `seek` to lapis `lock`.
 *
 * This file imports react-native, so it only typechecks once B's build lands.
 * The maths (bracketGap, reticleColor) lives in reticle-math.ts as pure
 * functions so it is testable today — see reticle-math.test.ts.
 */

import { View } from 'react-native';
import { color, border } from './tokens';
import { ALIGN_LOCK_THRESHOLD, bracketGap, reticleColor } from './reticle-math';

export { ALIGN_LOCK_THRESHOLD, bracketGap, reticleColor };

export type ReticleScale = 'full' | 'badge' | 'icon';

const SIZES: Record<ReticleScale, { box: number; arm: number; maxGap: number }> = {
  full: { box: 240, arm: 28, maxGap: 26 },
  badge: { box: 28, arm: 8, maxGap: 3 },
  icon: { box: 20, arm: 6, maxGap: 2 },
};

interface ReticleProps {
  scale?: ReticleScale;
  /** 0–1 from the alignment engine. Ignored for badge/icon. */
  align?: number;
  /** Badge scale: filled if the vantage has been surveyed. */
  surveyed?: boolean;
}

/**
 * A single corner bracket, drawn with two borders on a transparent View.
 * `corner` picks which two edges get the stroke.
 */
function Corner({
  corner,
  arm,
  stroke,
  offset,
}: {
  corner: 'tl' | 'tr' | 'bl' | 'br';
  arm: number;
  stroke: string;
  offset: number;
}) {
  const isTop = corner === 'tl' || corner === 'tr';
  const isLeft = corner === 'tl' || corner === 'bl';
  return (
    <View
      style={{
        position: 'absolute',
        width: arm,
        height: arm,
        [isTop ? 'top' : 'bottom']: offset,
        [isLeft ? 'left' : 'right']: offset,
        [isTop ? 'borderTopWidth' : 'borderBottomWidth']: border.thick,
        [isLeft ? 'borderLeftWidth' : 'borderRightWidth']: border.thick,
        borderColor: stroke,
      }}
    />
  );
}

export function Reticle({ scale = 'full', align = 0, surveyed = false }: ReticleProps) {
  const { box, arm, maxGap } = SIZES[scale];
  const stroke =
    scale === 'full'
      ? reticleColor(align)
      : surveyed
        ? color.lock
        : color.sand_dim;
  const gap = scale === 'full' ? bracketGap(align, maxGap) : maxGap;

  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      <Corner corner="tl" arm={arm} stroke={stroke} offset={gap} />
      <Corner corner="tr" arm={arm} stroke={stroke} offset={gap} />
      <Corner corner="bl" arm={arm} stroke={stroke} offset={gap} />
      <Corner corner="br" arm={arm} stroke={stroke} offset={gap} />
      {/* centre dot at badge/icon scale — the ◦ in the spec */}
      {scale !== 'full' && (
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: stroke,
          }}
        />
      )}
    </View>
  );
}

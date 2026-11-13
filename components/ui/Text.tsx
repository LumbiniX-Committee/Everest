import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useInterfaceLanguage } from '@/i18n/context';
import { localizeVisitorNode } from '@/i18n/literals';
import { colors, text as textStyle, type TypographyVariant } from '@/theme';

type ToneName =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'sandstone'
  | 'locked'
  | 'seeking'
  | 'warning'
  | 'error'
  | 'open'
  | 'resolved'
  | 'inverse'
  | 'onScrim'
  | 'accent';

const tones: Record<ToneName, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  sandstone: colors.sandstoneDeep,
  locked: colors.alignmentLocked,
  seeking: colors.alignmentSeeking,
  warning: colors.warning,
  error: colors.error,
  open: colors.openCondition,
  resolved: colors.resolved,
  /** Text on a `primary` fill. */
  inverse: colors.onPrimary,
  /** Text over a photograph or dark scrim, in either palette. */
  onScrim: colors.onScrim,
  /** A marigold highlight, only over a dark scrim. */
  accent: colors.accent,
};

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: ToneName;
  /** Convenience for `label`, which is almost always set in caps. */
  uppercase?: boolean;
  center?: boolean;
  /** False for quotations, authored heritage text, and visitor evidence. */
  translate?: boolean;
};

/**
 * The only Text in the app.
 *
 * Everything renders through here so no component ever names a font family, a
 * size, or a hex value. Style resolution happens at render time, which is what
 * lets the typography layer swap in the real families once they are bundled.
 */
/** Display sizes are already large; they scale least. */
const LARGE = new Set<TypographyVariant>(['display', 'title', 'heading'] as TypographyVariant[]);

export function Text({
  variant = 'body',
  tone = 'primary',
  uppercase = false,
  center = false,
  translate = true,
  children,
  style,
  ...rest
}: TextProps) {
  const language = useInterfaceLanguage();
  return (
    <RNText
      // Follows the phone's text size, but only so far: at the largest system
      // settings titles wrapped word by word and pushed the map off screen.
      maxFontSizeMultiplier={LARGE.has(variant) ? 1.1 : 1.25}
      {...rest}
      style={[
        textStyle(variant),
        { color: tones[tone] },
        uppercase && { textTransform: 'uppercase' },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {translate ? localizeVisitorNode(language, children) : children}
    </RNText>
  );
}

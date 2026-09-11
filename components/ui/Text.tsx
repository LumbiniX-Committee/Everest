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
  | 'inverse';

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
  inverse: colors.backgroundDeep,
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

import { Text as RNText, type TextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { textVariants, type TextVariant } from '../theme/typography';
import type { Palette } from '../theme/tokens';

type Tone = 'ink' | 'soft' | 'muted' | 'faint' | 'onInk' | 'onAccent' | 'accent' | 'danger' | 'success' | 'info';

const toneKey: Record<Tone, keyof Palette> = {
  ink: 'ink',
  soft: 'inkSoft',
  muted: 'muted',
  faint: 'faint',
  onInk: 'onInk',
  onAccent: 'onAccent',
  accent: 'accentDeep',
  danger: 'danger',
  success: 'success',
  info: 'info',
};

export interface TProps extends TextProps {
  variant?: TextVariant;
  tone?: Tone;
  color?: string;
  center?: boolean;
}

export function T({ variant = 'body', tone = 'ink', color, center, style, ...rest }: TProps) {
  const { c } = useTheme();
  return (
    <RNText
      {...rest}
      style={[textVariants[variant], { color: color ?? (c[toneKey[tone]] as string) }, center && { textAlign: 'center' }, style]}
    />
  );
}

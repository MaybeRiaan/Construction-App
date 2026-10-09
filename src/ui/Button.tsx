import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { T } from './Text';

export type ButtonVariant = 'primary' | 'accent' | 'soft' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const heights: Record<ButtonSize, number> = { sm: 38, md: 48, lg: 56 };

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, iconRight, disabled, loading, full, style, accessibilityLabel }: ButtonProps) {
  const { c } = useTheme();
  const fg =
    variant === 'primary' ? c.onInk : variant === 'accent' ? c.onAccent : variant === 'danger' ? c.danger : c.ink;
  const base = (pressed: boolean): StyleProp<ViewStyle> => [
    {
      height: heights[size],
      paddingHorizontal: size === 'sm' ? 14 : 20,
      borderRadius: size === 'lg' ? radii.md + 2 : radii.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      opacity: disabled ? 0.45 : 1,
    },
    full && { alignSelf: 'stretch' },
    variant === 'primary' && { backgroundColor: c.ink, boxShadow: pressed ? 'none' : `0px 8px 18px ${c.shadowDark}` },
    variant === 'accent' && { backgroundColor: c.accent, boxShadow: pressed ? 'none' : `0px 8px 18px rgba(226, 161, 0, 0.35)` },
    variant === 'soft' && neu(c, pressed ? 'insetSm' : 'raisedSm'),
    variant === 'ghost' && { backgroundColor: 'transparent' },
    variant === 'danger' && neu(c, pressed ? 'insetSm' : 'raisedSm'),
    style,
  ];
  return (
    <Press
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={base}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'sm' ? 16 : 19} color={fg} />}
          <T variant={size === 'sm' ? 'smallStrong' : 'bodyStrong'} color={fg} numberOfLines={1}>
            {title}
          </T>
          {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 19} color={fg} />}
        </>
      )}
    </Press>
  );
}

export function ButtonRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', gap: 12 }, style]}>{children}</View>;
}

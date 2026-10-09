import { View, type StyleProp, type ViewStyle } from 'react-native';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { T } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Coloured dot or icon tint for categories. */
  color?: string;
  count?: number;
  /** neu: on the base surface. float: over the map. */
  surface?: 'neu' | 'float';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, icon, color, count, surface = 'neu', size = 'md', style }: ChipProps) {
  const { c } = useTheme();
  const fg = selected ? c.onInk : c.ink;
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      scaleTo={0.95}
      style={(pressed) => [
        {
          height: size === 'sm' ? 32 : 38,
          paddingHorizontal: size === 'sm' ? 12 : 14,
          borderRadius: radii.pill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        selected ? { backgroundColor: c.ink } : surface === 'float' ? neu(c, 'float') : neu(c, pressed ? 'insetSm' : 'raisedSm'),
        style,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={size === 'sm' ? 14 : 16} color={selected ? c.onInk : color ?? c.ink} />
      ) : color ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      ) : null}
      <T variant={size === 'sm' ? 'smallStrong' : 'smallStrong'} color={fg} numberOfLines={1}>
        {label}
      </T>
      {count != null && (
        <T variant="micro" color={selected ? c.onInk : c.muted} style={{ opacity: 0.85 }}>
          {count}
        </T>
      )}
    </Press>
  );
}

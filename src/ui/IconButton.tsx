import { View, type StyleProp, type ViewStyle } from 'react-native';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { T } from './Text';

export interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  /** raised: neumorphic. float: over the map. ink/accent: filled. plain: no chrome. */
  variant?: 'raised' | 'float' | 'ink' | 'accent' | 'plain';
  color?: string;
  badge?: number | string;
  active?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  iconFill?: string;
}

export function IconButton({ icon, onPress, size = 44, variant = 'raised', color, badge, active, label, style, iconFill }: IconButtonProps) {
  const { c } = useTheme();
  const fg = color ?? (variant === 'ink' ? c.onInk : variant === 'accent' ? c.onAccent : c.ink);
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      scaleTo={0.92}
      style={(pressed) => [
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        variant === 'raised' && neu(c, pressed || active ? 'insetSm' : 'raisedSm'),
        variant === 'float' && neu(c, 'float'),
        variant === 'ink' && { backgroundColor: c.ink },
        variant === 'accent' && { backgroundColor: c.accent },
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.44)} color={fg} fill={iconFill} />
      {badge != null && badge !== 0 && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T variant="micro" color={c.onAccent} style={{ fontSize: 10, lineHeight: 12 }}>
            {badge}
          </T>
        </View>
      )}
    </Press>
  );
}

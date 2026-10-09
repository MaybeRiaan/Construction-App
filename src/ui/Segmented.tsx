import { View, type StyleProp, type ViewStyle } from 'react-native';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { T } from './Text';

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  icon?: IconName;
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegmentOption<V>[];
  value: V;
  onChange: (v: V) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <View style={[neu(c, 'insetSm'), { flexDirection: 'row', borderRadius: radii.md, padding: 4, gap: 4 }, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Press
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            scaleTo={0.97}
            style={[
              { flex: 1, height: 38, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
              on && neu(c, 'raisedSm'),
            ]}
          >
            {o.icon && <Icon name={o.icon} size={15} color={on ? c.ink : c.muted} />}
            <T variant="smallStrong" tone={on ? 'ink' : 'muted'} numberOfLines={1}>
              {o.label}
            </T>
          </Press>
        );
      })}
    </View>
  );
}

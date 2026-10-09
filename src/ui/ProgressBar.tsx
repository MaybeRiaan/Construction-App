import { View, type StyleProp, type ViewStyle } from 'react-native';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';

export function ProgressBar({ value, color, height = 10, style }: { value: number; color?: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[neu(c, 'insetSm'), { height, borderRadius: height / 2, overflow: 'hidden', padding: 2 }, style]}>
      <View
        style={{
          width: `${Math.max(pct > 0 ? 6 : 0, pct * 100)}%`,
          height: '100%',
          borderRadius: (height - 4) / 2,
          backgroundColor: color ?? c.accent,
        }}
      />
    </View>
  );
}

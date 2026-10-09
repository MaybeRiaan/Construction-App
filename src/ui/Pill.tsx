import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { Icon, type IconName } from './Icon';
import { T } from './Text';

export type PillTone = 'neutral' | 'ink' | 'accent' | 'success' | 'danger' | 'sponsored' | 'info' | 'glass';

export function Pill({ label, tone = 'neutral', icon, style }: { label: string; tone?: PillTone; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const { c, isDark } = useTheme();
  const map: Record<PillTone, { bg: string; fg: string }> = {
    neutral: { bg: c.well, fg: c.inkSoft },
    ink: { bg: c.ink, fg: c.onInk },
    accent: { bg: c.accent, fg: c.onAccent },
    success: { bg: isDark ? 'rgba(60,196,136,0.16)' : 'rgba(23,144,90,0.12)', fg: c.success },
    danger: { bg: isDark ? 'rgba(255,107,111,0.16)' : 'rgba(217,61,66,0.1)', fg: c.danger },
    sponsored: { bg: isDark ? 'rgba(255,201,51,0.16)' : 'rgba(255,194,26,0.22)', fg: isDark ? c.accent : '#7A5600' },
    info: { bg: isDark ? 'rgba(110,152,255,0.16)' : 'rgba(42,99,240,0.1)', fg: c.info },
    glass: { bg: 'rgba(16,18,22,0.55)', fg: '#FFFFFF' },
  };
  const { bg, fg } = map[tone];
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, borderRadius: radii.pill, paddingHorizontal: 9, height: 24, alignSelf: 'flex-start' },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={12} color={fg} strokeWidth={2.6} />}
      <T variant="micro" color={fg} numberOfLines={1} style={{ fontSize: 11.5 }}>
        {label}
      </T>
    </View>
  );
}

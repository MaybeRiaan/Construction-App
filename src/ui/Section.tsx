import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from './Icon';
import { Press } from './Press';
import { T } from './Text';

export function SectionHeader({ title, action, onAction, eyebrow, style }: { title: string; action?: string; onAction?: () => void; eyebrow?: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12, gap: 12 }, style]}>
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <T variant="label" tone="muted" style={{ marginBottom: 3 }}>
            {eyebrow}
          </T>
        ) : null}
        <T variant="h2" numberOfLines={1}>
          {title}
        </T>
      </View>
      {action ? (
        <Press onPress={onAction} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 }}>
          <T variant="smallStrong" tone="soft">
            {action}
          </T>
          <Icon name="chevronRight" size={16} color={c.inkSoft} />
        </Press>
      ) : null}
    </View>
  );
}

export function Row({ children, gap = 12, style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

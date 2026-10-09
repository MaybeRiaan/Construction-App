import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHunt } from '../state/hunt';
import { useTheme } from '../theme/ThemeProvider';
import { hazard } from '../theme/tokens';
import { Icon, type IconName } from '../ui/Icon';
import { Press } from '../ui/Press';
import { T } from '../ui/Text';

const TABS: Record<string, { label: string; icon: IconName }> = {
  Explore: { label: 'Explore', icon: 'compass' },
  Saved: { label: 'Saved', icon: 'heart' },
  Hunt: { label: 'Hunt', icon: 'hardHat' },
  Profile: { label: 'Family', icon: 'users' },
};

export const TAB_BAR_HEIGHT = 66;

export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 14;
}

/** Floating soft pill, Uber-style active state (filled circle). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const hunting = useHunt((s) => Boolean(s.activeHunt));
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: 18 }}
    >
      <View
        style={{
          height: TAB_BAR_HEIGHT,
          borderRadius: TAB_BAR_HEIGHT / 2,
          backgroundColor: c.card,
          boxShadow: c.floatShadow,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: 8,
        }}
      >
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const def = TABS[route.name];
          const isHunt = route.name === 'Hunt';
          const bg = focused ? (isHunt ? hazard.yellow : c.ink) : 'transparent';
          const fg = focused ? (isHunt ? hazard.black : c.onInk) : c.muted;
          return (
            <Press
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={def.label}
              scaleTo={0.9}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={{ alignItems: 'center', justifyContent: 'center', width: 72, gap: 3 }}
            >
              <View style={{ width: 44, height: 32, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={def.icon} size={19} color={fg} fill={focused && route.name === 'Saved' ? fg : undefined} />
                {isHunt && hunting && !focused ? (
                  <View style={{ position: 'absolute', top: 2, right: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: c.danger, borderWidth: 2, borderColor: c.card }} />
                ) : null}
              </View>
              <T variant="micro" tone={focused ? 'ink' : 'muted'} style={{ fontSize: 10.5 }}>
                {def.label}
              </T>
            </Press>
          );
        })}
      </View>
    </View>
  );
}

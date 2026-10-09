import { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { Press } from './Press';

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useTheme();
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: value ? 1 : 0, useNativeDriver: Platform.OS !== 'web', speed: 24, bounciness: 6 }).start();
  }, [value, x]);
  return (
    <Press
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      scaleTo={1}
      style={[{ width: 54, height: 32, borderRadius: 16, padding: 3, justifyContent: 'center' }, value ? { backgroundColor: c.ink } : neu(c, 'insetSm')]}
    >
      <Animated.View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? c.accent : c.bg,
          boxShadow: `1px 2px 5px ${c.shadowDark}`,
          transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) }],
        }}
      />
      <View />
    </Press>
  );
}

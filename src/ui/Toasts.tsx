import { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi, type Toast } from '../state/ui';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { Icon } from './Icon';
import { T } from './Text';

function ToastRow({ toast }: { toast: Toast }) {
  const { c } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 18, bounciness: 8 }).start();
  }, [anim]);
  const bg = toast.tone === 'accent' ? c.accent : toast.tone === 'danger' ? c.danger : c.ink;
  const fg = toast.tone === 'accent' ? c.onAccent : toast.tone === 'danger' ? '#fff' : c.onInk;
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        backgroundColor: bg,
        borderRadius: radii.pill,
        paddingHorizontal: 16,
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        alignSelf: 'center',
        maxWidth: '92%',
        boxShadow: c.floatShadow,
      }}
    >
      {toast.icon && <Icon name={toast.icon} size={17} color={fg} />}
      <T variant="smallStrong" color={fg} style={{ flexShrink: 1 }}>
        {toast.text}
      </T>
    </Animated.View>
  );
}

export function Toasts() {
  const toasts = useUi((s) => s.toasts);
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, alignItems: 'center', gap: 8, zIndex: 1000 }}>
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} />
      ))}
    </View>
  );
}

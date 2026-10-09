import { useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { haptics } from '../services/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  children?: ReactNode | ((pressed: boolean) => ReactNode);
  /** Scale on press. Set to 1 to disable. */
  scaleTo?: number;
  haptic?: boolean;
}

/** Pressable with a soft scale-down, optional haptic, and a pointer cursor on web. */
export function Press({ style, children, scaleTo = 0.97, haptic = true, onPressIn, onPressOut, onPress, disabled, ...rest }: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: to === 1 ? 6 : 0 }).start();
  const resolved = typeof style === 'function' ? style(pressed) : style;
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        if (scaleTo !== 1) animate(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        if (scaleTo !== 1) animate(1);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) haptics.tap();
        onPress?.(e);
      }}
      style={[
        resolved,
        { transform: [{ scale }] },
        Platform.OS === 'web' ? ({ cursor: disabled ? 'default' : 'pointer', userSelect: 'none' } as ViewStyle) : null,
      ]}
    >
      {typeof children === 'function' ? children(pressed) : children}
    </AnimatedPressable>
  );
}

import { useMemo, useRef, useState } from 'react';
import { PanResponder, View, type LayoutChangeEvent } from 'react-native';
import { haptics } from '../services/haptics';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Map slider position (0–1) to a value; defaults to linear. */
  curve?: 'linear' | 'ease';
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void;
  label: string;
}

/**
 * Neumorphic slider: an inset track, an ink fill and a raised knob. Every
 * child ignores touches so `locationX` is always relative to the track,
 * which keeps it correct on native and on the web.
 */
export function Slider({ value, min, max, step = 1, curve = 'linear', onChange, onChangeEnd, label }: SliderProps) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const start = useRef(0);
  const last = useRef(value);
  const KNOB = 30;

  const toT = (v: number) => {
    const t = (v - min) / (max - min);
    return curve === 'ease' ? Math.sqrt(Math.max(0, t)) : t;
  };
  const fromT = (t: number) => {
    const clamped = Math.max(0, Math.min(1, t));
    const lin = curve === 'ease' ? clamped * clamped : clamped;
    const raw = min + lin * (max - min);
    return Math.max(min, Math.min(max, Math.round(raw / step) * step));
  };

  const usable = Math.max(1, width - KNOB);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          start.current = e.nativeEvent.locationX - KNOB / 2;
          const v = fromT(start.current / usable);
          if (v !== last.current) {
            last.current = v;
            onChange(v);
          }
        },
        onPanResponderMove: (_e, g) => {
          const v = fromT((start.current + g.dx) / usable);
          if (v !== last.current) {
            last.current = v;
            haptics.tap();
            onChange(v);
          }
        },
        onPanResponderRelease: () => onChangeEnd?.(last.current),
        onPanResponderTerminate: () => onChangeEnd?.(last.current),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usable, min, max, step, curve, onChange, onChangeEnd],
  );

  last.current = value;
  const x = toT(value) * usable;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      onAccessibilityAction={(e) => {
        const next = e.nativeEvent.actionName === 'increment' ? value + step : value - step;
        onChange(Math.max(min, Math.min(max, next)));
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: 44, justifyContent: 'center' }}
      {...responder.panHandlers}
    >
      <View pointerEvents="none" style={[neu(c, 'insetSm'), { height: 12, borderRadius: 6, marginHorizontal: KNOB / 2 - 6 }]} />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: KNOB / 2 - 3, width: Math.max(0, x + 6), height: 6, borderRadius: 3, backgroundColor: c.ink, top: 19 }}
      />
      <View
        pointerEvents="none"
        style={[
          neu(c, 'raisedSm'),
          { position: 'absolute', left: x, top: 7, width: KNOB, height: KNOB, borderRadius: KNOB / 2, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent }} />
      </View>
    </View>
  );
}

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface SheetHandle {
  snapTo: (index: number) => void;
  index: () => number;
  scrollToTop: () => void;
}

export interface SheetProps {
  /**
   * Visible heights. Numbers <= 1 are fractions of the container height.
   * Must be ascending.
   */
  snapPoints: number[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Drag area: handle, title, chips. */
  header: ReactNode;
  children: ReactNode;
  /** Extra space under the content, e.g. for a floating tab bar. */
  bottomInset?: number;
  /** Gap kept between the fully open sheet and the top of the screen. */
  topGap?: number;
}

const useNative = Platform.OS !== 'web';

/**
 * A map-style bottom sheet with snap points. Drag the header to move it;
 * scrolling the list while the sheet is part-open expands it fully.
 * Measures its container, so it works inside the web device frame too.
 */
export const Sheet = forwardRef<SheetHandle, SheetProps>(function Sheet(
  { snapPoints, initialIndex = 1, onIndexChange, header, children, bottomInset = 0, topGap = 60 },
  ref,
) {
  const { c } = useTheme();
  const [height, setHeight] = useState(0);
  const [index, setIndex] = useState(initialIndex);
  const indexRef = useRef(initialIndex);
  const translateY = useRef(new Animated.Value(10000)).current;
  const current = useRef(10000);
  const dragStart = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const heights = useMemo(
    () => snapPoints.map((p) => Math.min(height - topGap, p <= 1 ? p * height : p)),
    [snapPoints, height, topGap],
  );
  const ys = useMemo(() => heights.map((h) => height - h), [heights, height]);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => (current.current = value));
    return () => translateY.removeListener(id);
  }, [translateY]);

  const animateTo = useCallback(
    (i: number, velocity = 0) => {
      if (!height) return;
      const target = Math.max(0, Math.min(ys.length - 1, i));
      indexRef.current = target;
      setIndex(target);
      onIndexChange?.(target);
      Animated.spring(translateY, {
        toValue: ys[target],
        velocity,
        useNativeDriver: useNative,
        tension: 70,
        friction: 13,
      }).start();
    },
    [height, ys, onIndexChange, translateY],
  );

  // Place the sheet when the container is first measured or resized.
  useEffect(() => {
    if (!height) return;
    translateY.setValue(ys[indexRef.current]);
  }, [height, ys, translateY]);

  useImperativeHandle(ref, () => ({
    snapTo: (i: number) => animateTo(i),
    index: () => indexRef.current,
    scrollToTop: () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
  }));

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          dragStart.current = current.current;
        },
        onPanResponderMove: (_e, g) => {
          const min = ys[ys.length - 1] - 30;
          const max = ys[0] + 40;
          translateY.setValue(Math.max(min, Math.min(max, dragStart.current + g.dy)));
        },
        onPanResponderRelease: (_e, g) => {
          const projected = current.current + g.vy * 140;
          let best = 0;
          ys.forEach((y, i) => {
            if (Math.abs(y - projected) < Math.abs(ys[best] - projected)) best = i;
          });
          animateTo(best, g.vy);
        },
        onPanResponderTerminate: () => animateTo(indexRef.current),
      }),
    [ys, animateTo, translateY],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.y > 8 && indexRef.current < ys.length - 1) animateTo(ys.length - 1);
  };

  const visible = heights[index] ?? 0;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      onLayout={(e: LayoutChangeEvent) => setHeight(Math.round(e.nativeEvent.layout.height))}
    >
      {height > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height,
            backgroundColor: c.bg,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            boxShadow: `0px -10px 30px ${c.scheme === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(40,52,72,0.16)'}`,
            transform: [{ translateY }],
          }}
        >
          <View {...pan.panHandlers}>
            <View
              style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => animateTo(indexRef.current === ys.length - 1 ? 1 : indexRef.current + 1)}
            >
              <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: c.faint, opacity: 0.6 }} />
            </View>
            {header}
          </View>
          <ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={32}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: height - visible + bottomInset + 24 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
});

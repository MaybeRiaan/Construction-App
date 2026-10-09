import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from './IconButton';
import { T } from './Text';

export function ScreenHeader({
  title,
  right,
  onBack,
  close,
  float,
  style,
  safe = true,
}: {
  title?: string;
  right?: ReactNode;
  onBack?: () => void;
  /** Show a close (×) instead of a back chevron, for modals. */
  close?: boolean;
  /** Buttons float over content (e.g. a hero image). */
  float?: boolean;
  style?: StyleProp<ViewStyle>;
  safe?: boolean;
}) {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const back = onBack ?? (() => (nav.canGoBack() ? nav.goBack() : undefined));
  return (
    <View
      style={[
        { paddingTop: (safe ? insets.top : 0) + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
        float && { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
        style,
      ]}
      pointerEvents="box-none"
    >
      <IconButton icon={close ? 'close' : 'back'} label={close ? 'Close' : 'Back'} onPress={back} variant={float ? 'float' : 'raised'} size={42} />
      <View style={{ flex: 1 }} pointerEvents="none">
        {title ? (
          <T variant="h3" numberOfLines={1}>
            {title}
          </T>
        ) : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: 10 }}>{right}</View> : null}
    </View>
  );
}

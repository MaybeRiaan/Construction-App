import { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { hazard } from '../theme/tokens';

/** Construction-site hazard stripes. */
export function Hazard({ height = 10, style, radius = 0 }: { height?: number; style?: StyleProp<ViewStyle>; radius?: number }) {
  const raw = useId();
  const id = `hz${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[{ height, overflow: 'hidden', borderRadius: radius }, style]}>
      <Svg width="100%" height={height}>
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={height * 2} height={height * 2} patternTransform="rotate(-45)">
            <Rect x={0} y={0} width={height} height={height * 2} fill={hazard.black} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height={height} fill={hazard.yellow} />
        <Rect x={0} y={0} width="100%" height={height} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

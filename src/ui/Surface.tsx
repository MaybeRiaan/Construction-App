import { View, type ViewProps } from 'react-native';
import { neu, type Depth } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';

export interface SurfaceProps extends ViewProps {
  depth?: Depth;
  radius?: number;
  padding?: number;
}

/** A neumorphic block: raised out of, or pressed into, the base surface. */
export function Surface({ depth = 'raised', radius = radii.lg, padding, style, ...rest }: SurfaceProps) {
  const { c } = useTheme();
  return <View {...rest} style={[neu(c, depth), { borderRadius: radius }, padding != null && { padding }, style]} />;
}

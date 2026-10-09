import { useTheme } from '../theme/ThemeProvider';
import { icons, type IconName } from './iconRegistry';

export type { IconName };

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}

export function Icon({ name, size = 20, color, strokeWidth = 2.2, fill }: IconProps) {
  const { c } = useTheme();
  const Cmp = icons[name];
  return <Cmp size={size} color={color ?? c.ink} strokeWidth={strokeWidth} fill={fill ?? 'none'} />;
}

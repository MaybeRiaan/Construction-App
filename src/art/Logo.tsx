import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { hazard } from '../theme/tokens';

/** Playdar mark: a radar sweep with a pin dot. Yellow on ink. */
export function LogoMark({ size = 40, ink = hazard.black }: { size?: number; ink?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={hazard.yellow} stopOpacity="0.95" />
          <Stop offset="1" stopColor={hazard.yellow} stopOpacity="0.15" />
        </LinearGradient>
      </Defs>
      <Circle cx="24" cy="24" r="23" fill={ink} />
      <Circle cx="24" cy="24" r="16.5" fill="none" stroke={hazard.yellow} strokeOpacity="0.35" strokeWidth="1.6" />
      <Circle cx="24" cy="24" r="9.5" fill="none" stroke={hazard.yellow} strokeOpacity="0.55" strokeWidth="1.6" />
      <Path d="M24 24 L24 4.5 A19.5 19.5 0 0 1 42.6 18.2 Z" fill="url(#sweep)" />
      <Circle cx="24" cy="24" r="3.4" fill={hazard.yellow} />
      <Circle cx="33.5" cy="13.5" r="2.6" fill="#FFFFFF" />
    </Svg>
  );
}

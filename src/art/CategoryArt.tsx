import { useId, useMemo, type ReactNode } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { CATEGORY_BY_ID } from '../data/categories';
import { seeded } from '../domain/game';
import type { CategoryId } from '../domain/types';

/**
 * Generated cover art for places without photos: a flat, friendly scene per
 * category with small seeded variations so neighbouring cards differ.
 */
export function CategoryArt({ category, seed, width, height, radius = 0 }: { category: CategoryId; seed: number; width: number | `${number}%`; height: number; radius?: number }) {
  const raw = useId();
  const id = `g${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const def = CATEGORY_BY_ID[category];
  const scene = useMemo(() => drawScene(category, seed, def.color, def.tint), [category, seed, def.color, def.tint]);
  return (
    <Svg width={width} height={height} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" style={{ borderRadius: radius }}>
      <Defs>
        <LinearGradient id={`${id}bg`} x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor={def.tint} stopOpacity="1" />
          <Stop offset="1" stopColor={def.color} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="320" height="200" fill={`url(#${id}bg)`} />
      {scene}
    </Svg>
  );
}

const W = '#FFFFFF';

function drawScene(category: CategoryId, seed: number, color: string, tint: string): ReactNode {
  const r = seeded(seed);
  const jitter = (n: number) => (r() - 0.5) * n;
  const sun = (
    <G key="sun" opacity={0.9}>
      <Circle cx={250 + jitter(40)} cy={52 + jitter(16)} r={22} fill={W} opacity={0.85} />
    </G>
  );
  const hills = (
    <G key="hills">
      <Path d={`M0 ${150 + jitter(10)} Q 80 ${110 + jitter(20)} 170 ${148 + jitter(10)} T 320 ${132 + jitter(14)} V200 H0 Z`} fill={W} opacity={0.22} />
      <Path d={`M0 ${172 + jitter(8)} Q 110 ${138 + jitter(16)} 210 ${170 + jitter(8)} T 320 ${160 + jitter(10)} V200 H0 Z`} fill={color} opacity={0.55} />
    </G>
  );
  const tree = (x: number, y: number, s: number, k: string) => (
    <G key={k}>
      <Rect x={x - 3 * s} y={y} width={6 * s} height={24 * s} rx={2} fill="#3B2A1E" opacity={0.5} />
      <Circle cx={x} cy={y - 6 * s} r={20 * s} fill={color} />
      <Circle cx={x - 9 * s} cy={y + 1 * s} r={12 * s} fill={color} />
      <Circle cx={x + 10 * s} cy={y} r={11 * s} fill={color} />
      <Circle cx={x - 5 * s} cy={y - 12 * s} r={8 * s} fill={W} opacity={0.35} />
    </G>
  );

  switch (category) {
    case 'parks':
      return [
        sun,
        hills,
        tree(70 + jitter(30), 120, 1.1, 't1'),
        tree(150 + jitter(30), 130, 0.85, 't2'),
        tree(230 + jitter(30), 118, 1.25, 't3'),
      ];
    case 'playgrounds':
      return [
        sun,
        hills,
        <G key="slide" opacity={0.92}>
          <Rect x={92} y={70} width={8} height={92} rx={3} fill={W} />
          <Rect x={132} y={70} width={8} height={92} rx={3} fill={W} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Rect key={i} x={98} y={84 + i * 16} width={36} height={5} rx={2} fill={W} />
          ))}
          <Rect x={86} y={62} width={60} height={12} rx={4} fill={W} />
          <Path d="M146 70 C 190 70 190 150 240 160" stroke={W} strokeWidth={14} fill="none" strokeLinecap="round" />
        </G>,
        <G key="swing" opacity={0.7}>
          <Line x1={250} y1={92} x2={250} y2={140} stroke={W} strokeWidth={3} />
          <Line x1={276} y1={92} x2={276} y2={140} stroke={W} strokeWidth={3} />
          <Rect x={244} y={138} width={38} height={7} rx={3} fill={W} />
        </G>,
      ];
    case 'walks':
      return [
        sun,
        <Polygon key="m" points={`40,140 110,${60 + jitter(20)} 180,140`} fill={W} opacity={0.3} />,
        <Polygon key="m2" points={`120,150 200,${70 + jitter(20)} 290,150`} fill={W} opacity={0.22} />,
        hills,
        <Path key="path" d={`M60 200 C 120 170 ${200 + jitter(30)} 175 190 150 S 240 125 280 128`} stroke={W} strokeWidth={6} strokeDasharray="10 9" fill="none" strokeLinecap="round" opacity={0.95} />,
        tree(40, 150, 0.7, 't1'),
        tree(270, 142, 0.6, 't2'),
      ];
    case 'books':
      return [
        <G key="books" opacity={0.95}>
          {[0, 1, 2, 3].map((i) => (
            <Rect key={i} x={60 + i * 34} y={60 + (i % 2) * 14 + jitter(8)} width={28} height={100 - (i % 2) * 14} rx={4} fill={W} opacity={0.9 - i * 0.12} />
          ))}
          <Rect x={196} y={82} width={28} height={78} rx={4} fill={W} opacity={0.55} transform="rotate(12 210 120)" />
          <Rect x={40} y={160} width={240} height={10} rx={4} fill={W} opacity={0.5} />
        </G>,
        <Path key="star" d="M262 54 l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2z" fill={W} opacity={0.85} />,
      ];
    case 'indoor':
      return [
        <G key="blocks">
          <Rect x={70} y={112} width={52} height={52} rx={8} fill={W} opacity={0.95} />
          <Rect x={126} y={112} width={52} height={52} rx={8} fill={W} opacity={0.7} />
          <Rect x={98} y={58} width={52} height={52} rx={8} fill={W} opacity={0.82} />
          <Circle cx={96} cy={138} r={9} fill={color} opacity={0.6} />
          <Polygon points="152,124 166,150 138,150" fill={color} opacity={0.6} />
        </G>,
        <G key="balloon" opacity={0.9}>
          <Ellipse cx={238 + jitter(20)} cy={70} rx={26} ry={31} fill={W} />
          <Path d={`M238 101 q -8 22 6 44 t -4 40`} stroke={W} strokeWidth={2} fill="none" />
        </G>,
      ];
    case 'water':
      return [
        sun,
        ...[0, 1, 2].map((i) => (
          <Path
            key={`w${i}`}
            d={`M0 ${118 + i * 26} q 20 -14 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 V200 H0 Z`}
            fill={W}
            opacity={0.25 + i * 0.18}
          />
        )),
        <Path key="drop" d="M140 40 C 140 40 118 70 118 84 a 22 22 0 0 0 44 0 C 162 70 140 40 140 40z" fill={W} opacity={0.9} />,
      ];
    case 'animals':
      return [
        hills,
        ...[0, 1, 2, 3].map((i) => {
          const x = 60 + i * 62 + jitter(14);
          const y = 70 + (i % 2) * 34 + jitter(10);
          return (
            <G key={`p${i}`} opacity={0.9 - i * 0.1}>
              <Ellipse cx={x} cy={y + 12} rx={13} ry={11} fill={W} />
              <Circle cx={x - 13} cy={y - 4} r={5} fill={W} />
              <Circle cx={x - 4} cy={y - 10} r={5} fill={W} />
              <Circle cx={x + 6} cy={y - 10} r={5} fill={W} />
              <Circle cx={x + 14} cy={y - 3} r={5} fill={W} />
            </G>
          );
        }),
      ];
    case 'museums':
      return [
        <G key="museum" opacity={0.95}>
          <Polygon points="70,82 160,40 250,82" fill={W} />
          <Rect x={76} y={86} width={168} height={10} rx={3} fill={W} opacity={0.85} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Rect key={i} x={88 + i * 32} y={100} width={14} height={52} rx={3} fill={W} opacity={0.8} />
          ))}
          <Rect x={66} y={152} width={188} height={12} rx={3} fill={W} />
        </G>,
      ];
    case 'cafes':
      return [
        <G key="cup" opacity={0.95}>
          <Path d="M108 92 h96 v34 a40 40 0 0 1 -40 40 h-16 a40 40 0 0 1 -40 -40z" fill={W} />
          <Path d="M204 102 h10 a16 16 0 0 1 0 32 h-12" stroke={W} strokeWidth={8} fill="none" />
          <Ellipse cx={160} cy={172} rx={78} ry={9} fill={W} opacity={0.6} />
          {[0, 1, 2].map((i) => (
            <Path key={i} d={`M${134 + i * 24} 80 c -10 -12 10 -20 0 -34`} stroke={W} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.75} />
          ))}
        </G>,
        <Circle key="cookie" cx={262} cy={150} r={20} fill={tint} opacity={0.95} />,
      ];
    case 'events':
      return [
        <Path key="string" d="M0 46 Q 160 96 320 40" stroke={W} strokeWidth={2.5} fill="none" opacity={0.85} />,
        ...[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const x = 24 + i * 44;
          const y = 46 + Math.sin((i / 6) * Math.PI) * 24 - (i > 3 ? 4 : 0);
          return <Polygon key={`f${i}`} points={`${x - 12},${y} ${x + 12},${y} ${x},${y + 26}`} fill={W} opacity={i % 2 ? 0.6 : 0.95} />;
        }),
        <G key="tent" opacity={0.95}>
          <Polygon points="160,92 230,168 90,168" fill={W} />
          <Polygon points="160,110 182,168 138,168" fill={color} opacity={0.65} />
        </G>,
      ];
    case 'sights':
    default:
      return [
        sun,
        hills,
        <G key="train" opacity={0.95}>
          <Rect x={86} y={104} width={110} height={44} rx={8} fill={W} />
          <Rect x={168} y={80} width={40} height={68} rx={8} fill={W} />
          <Rect x={104} y={86} width={16} height={22} rx={3} fill={W} />
          <Rect x={176} y={88} width={24} height={20} rx={4} fill={color} opacity={0.5} />
          <Circle cx={112} cy={152} r={12} fill={W} />
          <Circle cx={150} cy={152} r={12} fill={W} />
          <Circle cx={190} cy={152} r={12} fill={W} />
          <Circle cx={112} cy={70} r={8} fill={W} opacity={0.6} />
          <Circle cx={124} cy={56} r={11} fill={W} opacity={0.45} />
        </G>,
      ];
  }
}

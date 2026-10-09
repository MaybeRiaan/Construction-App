import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { MACHINE_COLOURS, VEHICLE_COLOUR } from '../data/vehicles';
import type { MachineColour, VehicleTypeId } from '../domain/types';

/**
 * Sticker-style construction machines, drawn from simple shapes on a
 * 160×100 canvas. `locked` renders a flat silhouette for the Yard's
 * not-yet-found slots.
 */

interface P {
  body: string;
  bodyDark: string;
  dark: string;
  glass: string;
  wheel: string;
  hub: string;
  line: string;
  metal: string;
  dirt: string;
  shadow: string;
}

const DARK_BODY: Record<MachineColour, string> = {
  yellow: '#E0A100',
  orange: '#D9640A',
  red: '#B5333A',
  green: '#1F7A49',
  blue: '#1C62B8',
  white: '#C9CFD8',
  other: '#6B7280',
};

function palette(colour: MachineColour, locked?: string): P {
  if (locked) {
    return { body: locked, bodyDark: locked, dark: locked, glass: locked, wheel: locked, hub: locked, line: locked, metal: locked, dirt: locked, shadow: 'transparent' };
  }
  const swatch = MACHINE_COLOURS.find((m) => m.id === colour)?.swatch ?? '#FFC21A';
  return {
    body: swatch,
    bodyDark: DARK_BODY[colour],
    dark: '#2B2F36',
    glass: '#CFE7FF',
    wheel: '#23262B',
    hub: '#C9CED6',
    line: '#15171B',
    metal: '#9AA3AF',
    dirt: '#8A5A3C',
    shadow: 'rgba(0,0,0,0.14)',
  };
}

const SW = 3;

function Wheel({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: P }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={p.wheel} stroke={p.line} strokeWidth={SW} />
      <Circle cx={cx} cy={cy} r={r * 0.42} fill={p.hub} stroke={p.line} strokeWidth={2} />
    </G>
  );
}

function Track({ x, y, w, h, p }: { x: number; y: number; w: number; h: number; p: P }) {
  const r = h / 2;
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={r} fill={p.dark} stroke={p.line} strokeWidth={SW} />
      <Circle cx={x + r} cy={y + r} r={r - 4} fill={p.hub} stroke={p.line} strokeWidth={2} />
      <Circle cx={x + w - r} cy={y + r} r={r - 4} fill={p.hub} stroke={p.line} strokeWidth={2} />
      {w > 60 && <Circle cx={x + w / 2} cy={y + r} r={r - 6} fill={p.hub} stroke={p.line} strokeWidth={2} />}
    </G>
  );
}

function Beam({ pts, w, p, color }: { pts: string; w: number; p: P; color?: string }) {
  return (
    <G>
      <Polyline points={pts} stroke={p.line} strokeWidth={w + SW * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={pts} stroke={color ?? p.body} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

function Box({ x, y, w, h, rx = 5, fill, p }: { x: number; y: number; w: number; h: number; rx?: number; fill: string; p: P }) {
  return <Rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />;
}

function Win({ x, y, w, h, p }: { x: number; y: number; w: number; h: number; p: P }) {
  return <Rect x={x} y={y} width={w} height={h} rx={3} fill={p.glass} stroke={p.line} strokeWidth={2.4} />;
}

function Shadow({ x1, x2, p }: { x1: number; x2: number; p: P }) {
  return <Ellipse cx={(x1 + x2) / 2} cy={93} rx={(x2 - x1) / 2} ry={4} fill={p.shadow} />;
}

const DRAW: Record<VehicleTypeId, (p: P) => ReactNode> = {
  excavator: (p) => (
    <G>
      <Shadow x1={14} x2={150} p={p} />
      <Track x={16} y={70} w={80} h={20} p={p} />
      <Box x={22} y={50} w={66} h={22} fill={p.body} p={p} />
      <Box x={72} y={52} w={22} h={16} rx={4} fill={p.bodyDark} p={p} />
      <Box x={28} y={24} w={30} h={28} fill={p.body} p={p} />
      <Win x={33} y={29} w={20} h={15} p={p} />
      <Beam pts="78,54 110,16 140,48" w={9} p={p} />
      <Line x1={92} y1={44} x2={112} y2={22} stroke={p.metal} strokeWidth={3} strokeLinecap="round" />
      <Path d="M134 44 L152 50 L150 66 Q 141 74 130 64 Z" fill={p.dark} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M132 66 l-3 5 M139 70 l-2 5 M146 68 l0 5" stroke={p.line} strokeWidth={2.5} strokeLinecap="round" />
    </G>
  ),
  bulldozer: (p) => (
    <G>
      <Shadow x1={6} x2={140} p={p} />
      <Track x={24} y={70} w={92} h={20} p={p} />
      <Box x={30} y={46} w={74} h={26} fill={p.body} p={p} />
      <Box x={60} y={20} w={36} h={28} fill={p.body} p={p} />
      <Win x={66} y={25} w={24} h={15} p={p} />
      <Rect x={44} y={34} width={6} height={13} rx={2} fill={p.dark} stroke={p.line} strokeWidth={2} />
      <Line x1={24} y1={60} x2={40} y2={66} stroke={p.line} strokeWidth={5} strokeLinecap="round" />
      <Path d="M10 40 Q 2 66 10 92 L 26 92 L 26 40 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M12 48 Q 7 66 12 84" stroke={p.bodyDark} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Beam pts="104,60 130,78" w={6} p={p} color={p.dark} />
      <Path d="M128 74 l8 14 l-6 0 z" fill={p.dark} stroke={p.line} strokeWidth={2.5} strokeLinejoin="round" />
    </G>
  ),
  backhoe: (p) => (
    <G>
      <Shadow x1={6} x2={156} p={p} />
      <Beam pts="44,62 16,64" w={6} p={p} />
      <Path d="M4 52 L22 54 L20 78 L6 78 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Box x={24} y={52} w={92} h={24} fill={p.body} p={p} />
      <Box x={66} y={18} w={40} h={36} fill={p.body} p={p} />
      <Win x={71} y={23} w={30} h={20} p={p} />
      <Beam pts="114,58 138,22 152,58" w={7} p={p} />
      <Path d="M146 56 L158 60 L156 72 Q 150 78 142 70 Z" fill={p.dark} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Line x1={112} y1={74} x2={124} y2={90} stroke={p.line} strokeWidth={4} strokeLinecap="round" />
      <Rect x={118} y={88} width={14} height={4} rx={2} fill={p.dark} />
      <Wheel cx={38} cy={80} r={12} p={p} />
      <Wheel cx={94} cy={76} r={16} p={p} />
    </G>
  ),
  wheelLoader: (p) => (
    <G>
      <Shadow x1={4} x2={146} p={p} />
      <Beam pts="80,58 36,60" w={8} p={p} />
      <Path d="M4 38 Q 0 62 6 82 L 36 82 L 38 44 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M10 44 Q 7 62 11 76" stroke={p.bodyDark} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Box x={44} y={54} w={40} h={18} fill={p.body} p={p} />
      <Box x={78} y={48} w={64} h={26} fill={p.body} p={p} />
      <Box x={84} y={16} w={34} h={34} fill={p.body} p={p} />
      <Win x={89} y={21} w={24} h={20} p={p} />
      <Rect x={128} y={36} width={6} height={13} rx={2} fill={p.dark} stroke={p.line} strokeWidth={2} />
      <Wheel cx={56} cy={76} r={16} p={p} />
      <Wheel cx={118} cy={76} r={16} p={p} />
    </G>
  ),
  skidSteer: (p) => (
    <G>
      <Shadow x1={14} x2={128} p={p} />
      <Path d="M16 54 L40 56 L40 86 L18 86 Z" fill={p.dark} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Box x={44} y={40} w={76} h={42} rx={10} fill={p.body} p={p} />
      <Box x={56} y={22} w={44} h={40} rx={6} fill={p.dark} p={p} />
      <Win x={62} y={28} w={32} h={28} p={p} />
      <Line x1={70} y1={28} x2={70} y2={56} stroke={p.line} strokeWidth={1.6} />
      <Line x1={78} y1={28} x2={78} y2={56} stroke={p.line} strokeWidth={1.6} />
      <Line x1={86} y1={28} x2={86} y2={56} stroke={p.line} strokeWidth={1.6} />
      <Beam pts="116,36 104,30 52,44 40,64" w={7} p={p} />
      <Wheel cx={62} cy={82} r={11} p={p} />
      <Wheel cx={104} cy={82} r={11} p={p} />
    </G>
  ),
  dumpTruck: (p) => (
    <G>
      <Shadow x1={10} x2={154} p={p} />
      <Rect x={20} y={64} width={128} height={10} rx={3} fill={p.dark} stroke={p.line} strokeWidth={SW} />
      <G transform="rotate(-10 148 64)">
        <Path d="M58 64 L52 30 L150 30 L150 64 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M60 32 Q 90 12 120 24 Q 136 18 148 30 Z" fill={p.dirt} stroke={p.line} strokeWidth={2.5} strokeLinejoin="round" />
        <Line x1={70} y1={40} x2={70} y2={60} stroke={p.bodyDark} strokeWidth={4} strokeLinecap="round" />
        <Line x1={100} y1={40} x2={100} y2={60} stroke={p.bodyDark} strokeWidth={4} strokeLinecap="round" />
        <Line x1={130} y1={40} x2={130} y2={60} stroke={p.bodyDark} strokeWidth={4} strokeLinecap="round" />
      </G>
      <Box x={12} y={34} w={38} h={36} fill={p.body} p={p} />
      <Win x={17} y={39} w={22} h={16} p={p} />
      <Wheel cx={34} cy={80} r={12} p={p} />
      <Wheel cx={104} cy={80} r={12} p={p} />
      <Wheel cx={130} cy={80} r={12} p={p} />
    </G>
  ),
  towerCrane: (p) => (
    <G>
      <Rect x={58} y={88} width={34} height={6} rx={2} fill={p.dark} stroke={p.line} strokeWidth={2.5} />
      <Rect x={66} y={18} width={16} height={72} fill={p.body} stroke={p.line} strokeWidth={SW} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Polyline key={i} points={`66,${24 + i * 11} 82,${30 + i * 11} 66,${36 + i * 11}`} stroke={p.line} strokeWidth={1.8} fill="none" />
      ))}
      <Line x1={74} y1={4} x2={22} y2={18} stroke={p.line} strokeWidth={2} />
      <Line x1={74} y1={4} x2={156} y2={18} stroke={p.line} strokeWidth={2} />
      <Polygon points="68,18 74,2 80,18" fill={p.body} stroke={p.line} strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={16} y={16} width={142} height={8} fill={p.body} stroke={p.line} strokeWidth={SW} />
      {Array.from({ length: 13 }).map((_, i) => (
        <Line key={i} x1={22 + i * 10.5} y1={17} x2={27 + i * 10.5} y2={23} stroke={p.line} strokeWidth={1.4} />
      ))}
      <Box x={18} y={24} w={20} h={14} rx={2} fill={p.dark} p={p} />
      <Box x={82} y={24} w={16} h={14} rx={3} fill={p.body} p={p} />
      <Rect x={85} y={27} width={10} height={7} rx={2} fill={p.glass} />
      <Line x1={132} y1={24} x2={132} y2={62} stroke={p.line} strokeWidth={2} />
      <Path d="M132 62 q 5 0 5 5 q 0 6 -6 5" stroke={p.line} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Rect x={112} y={70} width={40} height={7} rx={2} fill={p.metal} stroke={p.line} strokeWidth={2.5} />
    </G>
  ),
  mobileCrane: (p) => (
    <G>
      <Shadow x1={8} x2={156} p={p} />
      <Beam pts="108,52 74,24 40,4" w={9} p={p} />
      <Line x1={74} y1={24} x2={40} y2={4} stroke={p.bodyDark} strokeWidth={5} strokeLinecap="round" />
      <Line x1={40} y1={6} x2={40} y2={44} stroke={p.line} strokeWidth={2} />
      <Path d="M40 44 q 5 0 5 5 q 0 6 -6 5" stroke={p.line} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Rect x={12} y={60} width={140} height={16} rx={4} fill={p.body} stroke={p.line} strokeWidth={SW} />
      <Box x={10} y={38} w={30} h={26} fill={p.body} p={p} />
      <Win x={15} y={43} w={18} h={12} p={p} />
      <Box x={84} y={44} w={40} h={18} rx={4} fill={p.bodyDark} p={p} />
      <Line x1={18} y1={76} x2={8} y2={90} stroke={p.line} strokeWidth={4} strokeLinecap="round" />
      <Line x1={148} y1={76} x2={156} y2={90} stroke={p.line} strokeWidth={4} strokeLinecap="round" />
      <Wheel cx={34} cy={82} r={10} p={p} />
      <Wheel cx={58} cy={82} r={10} p={p} />
      <Wheel cx={110} cy={82} r={10} p={p} />
      <Wheel cx={134} cy={82} r={10} p={p} />
    </G>
  ),
  telehandler: (p) => (
    <G>
      <Shadow x1={6} x2={150} p={p} />
      <Beam pts="130,56 72,36 22,22" w={10} p={p} />
      <Line x1={72} y1={36} x2={24} y2={22} stroke={p.bodyDark} strokeWidth={5} strokeLinecap="round" />
      <Rect x={10} y={14} width={8} height={30} rx={2} fill={p.dark} stroke={p.line} strokeWidth={2.5} />
      <Line x1={14} y1={42} x2={0} y2={42} stroke={p.dark} strokeWidth={5} strokeLinecap="round" />
      <Box x={20} y={54} w={124} h={22} fill={p.body} p={p} />
      <Box x={30} y={26} w={30} h={32} fill={p.body} p={p} />
      <Win x={35} y={31} w={20} h={18} p={p} />
      <Wheel cx={44} cy={78} r={14} p={p} />
      <Wheel cx={120} cy={78} r={14} p={p} />
    </G>
  ),
  forklift: (p) => (
    <G>
      <Shadow x1={6} x2={134} p={p} />
      <Rect x={30} y={10} width={10} height={80} rx={2} fill={p.dark} stroke={p.line} strokeWidth={SW} />
      <Path d="M36 76 L6 76 L6 82 L36 82" fill={p.metal} stroke={p.line} strokeWidth={2.5} strokeLinejoin="round" />
      <Box x={8} y={50} w={26} h={24} rx={2} fill="#C8915F" p={p} />
      <Line x1={21} y1={50} x2={21} y2={74} stroke={p.line} strokeWidth={1.6} />
      <Path d="M44 52 L44 80 L120 80 Q 130 80 130 70 L130 58 Q 130 52 122 52 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M108 52 Q 130 50 130 66" fill={p.bodyDark} stroke={p.line} strokeWidth={2.5} />
      <Polyline points="60,52 60,18 104,18 104,52" stroke={p.line} strokeWidth={4} fill="none" strokeLinejoin="round" />
      <Rect x={56} y={14} width={52} height={7} rx={3} fill={p.dark} stroke={p.line} strokeWidth={2} />
      <Rect x={74} y={40} width={16} height={12} rx={3} fill={p.dark} />
      <Wheel cx={56} cy={82} r={12} p={p} />
      <Wheel cx={112} cy={84} r={10} p={p} />
    </G>
  ),
  cherryPicker: (p) => (
    <G>
      <Shadow x1={18} x2={140} p={p} />
      <Beam pts="106,54 76,30 50,24" w={8} p={p} />
      <Rect x={26} y={4} width={34} height={20} rx={3} fill={p.body} stroke={p.line} strokeWidth={SW} />
      <Line x1={26} y1={12} x2={60} y2={12} stroke={p.line} strokeWidth={2} />
      <Line x1={36} y1={4} x2={36} y2={24} stroke={p.line} strokeWidth={1.6} />
      <Line x1={48} y1={4} x2={48} y2={24} stroke={p.line} strokeWidth={1.6} />
      <Box x={92} y={46} w={28} h={18} rx={4} fill={p.bodyDark} p={p} />
      <Box x={22} y={62} w={116} h={18} fill={p.body} p={p} />
      <Wheel cx={42} cy={82} r={11} p={p} />
      <Wheel cx={118} cy={82} r={11} p={p} />
    </G>
  ),
  roadRoller: (p) => (
    <G>
      <Shadow x1={14} x2={142} p={p} />
      <Box x={52} y={46} w={88} h={26} fill={p.body} p={p} />
      <Rect x={30} y={44} width={30} height={12} rx={3} fill={p.body} stroke={p.line} strokeWidth={SW} />
      <Line x1={80} y1={46} x2={80} y2={16} stroke={p.line} strokeWidth={4} />
      <Line x1={124} y1={46} x2={124} y2={16} stroke={p.line} strokeWidth={4} />
      <Rect x={72} y={10} width={60} height={9} rx={3} fill={p.body} stroke={p.line} strokeWidth={SW} />
      <Rect x={92} y={34} width={18} height={12} rx={3} fill={p.dark} />
      <Circle cx={38} cy={72} r={21} fill={p.metal} stroke={p.line} strokeWidth={SW} />
      <Circle cx={38} cy={72} r={13} fill={p.hub} stroke={p.line} strokeWidth={2} />
      <Rect x={32} y={51} width={12} height={8} fill={p.body} stroke={p.line} strokeWidth={2} />
      <Wheel cx={122} cy={76} r={16} p={p} />
    </G>
  ),
  grader: (p) => (
    <G>
      <Shadow x1={6} x2={150} p={p} />
      <Beam pts="104,50 70,46 34,56 20,68" w={8} p={p} />
      <Path d="M48 82 L90 76 L92 84 L50 90 Z" fill={p.dark} stroke={p.line} strokeWidth={2.5} strokeLinejoin="round" />
      <Line x1={70} y1={52} x2={70} y2={78} stroke={p.line} strokeWidth={3} />
      <Box x={98} y={50} w={54} h={24} fill={p.body} p={p} />
      <Box x={104} y={20} w={32} h={32} fill={p.body} p={p} />
      <Win x={109} y={25} w={22} h={18} p={p} />
      <Wheel cx={20} cy={80} r={11} p={p} />
      <Wheel cx={114} cy={80} r={12} p={p} />
      <Wheel cx={140} cy={80} r={12} p={p} />
    </G>
  ),
  paver: (p) => (
    <G>
      <Rect x={124} y={88} width={36} height={6} fill={p.dark} />
      <Path d="M2 30 L28 38 L28 64 L10 62 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M8 38 L24 42 L24 52 Z" fill={p.dark} />
      <Box x={22} y={40} w={106} h={34} fill={p.body} p={p} />
      <Line x1={76} y1={40} x2={76} y2={14} stroke={p.line} strokeWidth={4} />
      <Line x1={120} y1={40} x2={120} y2={14} stroke={p.line} strokeWidth={4} />
      <Rect x={68} y={8} width={60} height={9} rx={3} fill={p.body} stroke={p.line} strokeWidth={SW} />
      <Rect x={90} y={28} width={16} height={12} rx={3} fill={p.dark} />
      <Rect x={124} y={64} width={32} height={22} rx={3} fill={p.dark} stroke={p.line} strokeWidth={SW} />
      <Track x={26} y={72} w={96} h={18} p={p} />
    </G>
  ),
  cementMixer: (p) => (
    <G>
      <Shadow x1={10} x2={154} p={p} />
      <Rect x={18} y={64} width={132} height={10} rx={3} fill={p.dark} stroke={p.line} strokeWidth={SW} />
      <Path d="M52 64 Q 44 46 62 36 L 128 22 Q 152 20 152 42 Q 152 60 132 62 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M76 60 Q 72 42 92 30" stroke={p.bodyDark} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M100 61 Q 98 40 118 26" stroke={p.bodyDark} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M124 62 Q 124 44 140 30" stroke={p.bodyDark} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M150 44 L160 58" stroke={p.line} strokeWidth={5} strokeLinecap="round" />
      <Box x={12} y={34} w={34} h={36} fill={p.bodyDark} p={p} />
      <Win x={17} y={39} w={20} h={15} p={p} />
      <Wheel cx={32} cy={80} r={11} p={p} />
      <Wheel cx={104} cy={80} r={11} p={p} />
      <Wheel cx={128} cy={80} r={11} p={p} />
    </G>
  ),
  concretePump: (p) => (
    <G>
      <Shadow x1={8} x2={156} p={p} />
      <Beam pts="112,50 62,22 108,6 150,28" w={7} p={p} />
      <Line x1={150} y1={28} x2={150} y2={52} stroke={p.dark} strokeWidth={4} strokeLinecap="round" />
      <Rect x={12} y={62} width={140} height={14} rx={4} fill={p.body} stroke={p.line} strokeWidth={SW} />
      <Box x={10} y={38} w={30} h={28} fill={p.bodyDark} p={p} />
      <Win x={15} y={43} w={18} h={12} p={p} />
      <Box x={100} y={46} w={26} h={18} rx={4} fill={p.dark} p={p} />
      <Line x1={56} y1={76} x2={48} y2={90} stroke={p.line} strokeWidth={4} strokeLinecap="round" />
      <Line x1={140} y1={76} x2={150} y2={90} stroke={p.line} strokeWidth={4} strokeLinecap="round" />
      <Wheel cx={28} cy={82} r={10} p={p} />
      <Wheel cx={74} cy={82} r={10} p={p} />
      <Wheel cx={110} cy={82} r={10} p={p} />
      <Wheel cx={132} cy={82} r={10} p={p} />
    </G>
  ),
  pileDriver: (p) => (
    <G>
      <Shadow x1={30} x2={132} p={p} />
      <Rect x={118} y={36} width={8} height={60} fill={p.metal} stroke={p.line} strokeWidth={2.5} />
      <Rect x={112} y={2} width={20} height={86} rx={2} fill={p.body} stroke={p.line} strokeWidth={SW} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Line key={i} x1={112} y1={8 + i * 12} x2={132} y2={14 + i * 12} stroke={p.line} strokeWidth={1.6} />
      ))}
      <Box x={108} y={20} w={28} h={18} rx={3} fill={p.dark} p={p} />
      <Beam pts="96,54 112,30" w={5} p={p} color={p.bodyDark} />
      <Box x={36} y={50} w={76} h={22} fill={p.body} p={p} />
      <Box x={42} y={26} w={28} h={26} fill={p.body} p={p} />
      <Win x={47} y={31} w={18} h={14} p={p} />
      <Track x={32} y={72} w={84} h={18} p={p} />
    </G>
  ),
  tractor: (p) => (
    <G>
      <Shadow x1={18} x2={140} p={p} />
      <Path d="M20 70 L20 54 Q 20 48 28 48 L 92 48 L 96 70 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      <Line x1={30} y1={56} x2={60} y2={56} stroke={p.bodyDark} strokeWidth={3} strokeLinecap="round" />
      <Line x1={30} y1={62} x2={60} y2={62} stroke={p.bodyDark} strokeWidth={3} strokeLinecap="round" />
      <Rect x={52} y={26} width={6} height={22} rx={2} fill={p.dark} stroke={p.line} strokeWidth={2} />
      <Box x={84} y={14} w={46} h={46} rx={6} fill={p.body} p={p} />
      <Win x={90} y={20} w={34} h={26} p={p} />
      <Path d="M82 60 Q 112 36 142 60" fill={p.bodyDark} stroke={p.line} strokeWidth={SW} />
      <Circle cx={112} cy={70} r={24} fill={p.wheel} stroke={p.line} strokeWidth={SW} />
      <Circle cx={112} cy={70} r={11} fill="#FFC21A" stroke={p.line} strokeWidth={2} />
      <Wheel cx={36} cy={80} r={12} p={p} />
    </G>
  ),
  garbageTruck: (p) => (
    <G>
      <Shadow x1={8} x2={156} p={p} />
      <Rect x={14} y={66} width={140} height={8} rx={3} fill={p.dark} stroke={p.line} strokeWidth={SW} />
      <Path d="M50 70 L50 28 Q 50 20 58 20 L 140 20 Q 152 20 152 32 L 152 70 Z" fill={p.body} stroke={p.line} strokeWidth={SW} strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => (
        <Line key={i} x1={68 + i * 20} y1={26} x2={68 + i * 20} y2={64} stroke={p.bodyDark} strokeWidth={4} strokeLinecap="round" />
      ))}
      <Box x={140} y={30} w={18} h={42} rx={4} fill={p.bodyDark} p={p} />
      <Box x={10} y={32} w={38} h={38} fill={p.body} p={p} />
      <Win x={14} y={37} w={24} h={16} p={p} />
      <Wheel cx={32} cy={80} r={11} p={p} />
      <Wheel cx={108} cy={80} r={11} p={p} />
      <Wheel cx={132} cy={80} r={11} p={p} />
    </G>
  ),
  fireEngine: (p) => (
    <G>
      <Shadow x1={6} x2={156} p={p} />
      <Rect x={48} y={38} width={106} height={34} rx={4} fill={p.body} stroke={p.line} strokeWidth={SW} />
      <Rect x={48} y={56} width={106} height={5} fill="#F4F5F7" />
      <Rect x={60} y={42} width={22} height={12} rx={2} fill={p.bodyDark} stroke={p.line} strokeWidth={2} />
      <Rect x={88} y={42} width={22} height={12} rx={2} fill={p.bodyDark} stroke={p.line} strokeWidth={2} />
      <Circle cx={134} cy={50} r={8} fill={p.metal} stroke={p.line} strokeWidth={2.5} />
      <Line x1={36} y1={30} x2={156} y2={24} stroke={p.metal} strokeWidth={3} />
      <Line x1={36} y1={36} x2={156} y2={30} stroke={p.metal} strokeWidth={3} />
      {Array.from({ length: 11 }).map((_, i) => (
        <Line key={i} x1={42 + i * 11} y1={29.7 - i * 0.55} x2={42 + i * 11} y2={35.7 - i * 0.55} stroke={p.metal} strokeWidth={2} />
      ))}
      <Box x={8} y={30} w={42} h={42} fill={p.body} p={p} />
      <Rect x={8} y={56} width={42} height={5} fill="#F4F5F7" />
      <Win x={13} y={35} w={26} h={16} p={p} />
      <Rect x={14} y={23} width={10} height={7} rx={2} fill="#2C86F0" stroke={p.line} strokeWidth={2} />
      <Rect x={28} y={23} width={10} height={7} rx={2} fill="#FF6B6F" stroke={p.line} strokeWidth={2} />
      <Wheel cx={30} cy={80} r={11} p={p} />
      <Wheel cx={108} cy={80} r={11} p={p} />
      <Wheel cx={132} cy={80} r={11} p={p} />
    </G>
  ),
};

export function VehicleArt({
  type,
  width = 160,
  colour,
  locked,
}: {
  type: VehicleTypeId;
  width?: number;
  colour?: MachineColour;
  /** Silhouette colour for not-yet-found machines. */
  locked?: string;
}) {
  const p = palette(colour ?? VEHICLE_COLOUR[type] ?? 'yellow', locked);
  return (
    <Svg width={width} height={(width * 100) / 160} viewBox="0 0 160 100">
      {DRAW[type](p)}
    </Svg>
  );
}

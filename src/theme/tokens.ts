/**
 * Playdar design tokens.
 *
 * Concept: "Uber meets neumorphism". Surfaces are soft, extruded shapes on a
 * cool grey base; actions are bold ink (black in light mode, white in dark);
 * the one brand accent is sunbeam / safety yellow, which also carries the
 * Hard Hat Hunt game. Colour beyond that comes from the place categories.
 */

export type SchemeName = 'light' | 'dark';

export interface Palette {
  scheme: SchemeName;
  /** Base surface. Neumorphic shapes use the same colour as the background. */
  bg: string;
  /** Slightly lifted surface for dense lists and floating cards over the map. */
  card: string;
  /** Sunken wells (inputs, tracks). */
  well: string;
  shadowDark: string;
  shadowLight: string;
  /** Primary text and primary action fill. */
  ink: string;
  inkSoft: string;
  muted: string;
  faint: string;
  line: string;
  /** Text/icons on an `ink` fill. */
  onInk: string;
  accent: string;
  accentDeep: string;
  /** Text/icons on an `accent` fill. */
  onAccent: string;
  success: string;
  danger: string;
  info: string;
  scrim: string;
  /** Drop shadow used for things floating over the map. */
  floatShadow: string;
  map: MapPalette;
}

export interface MapPalette {
  land: string;
  town: string;
  water: string;
  waterEdge: string;
  park: string;
  parkEdge: string;
  road: string;
  roadCasing: string;
  roadMajor: string;
  roadMajorCasing: string;
  label: string;
  labelHalo: string;
  radiusFill: string;
  radiusStroke: string;
}

export const light: Palette = {
  scheme: 'light',
  bg: '#E7EAEF',
  card: '#EFF1F5',
  well: '#E1E5EB',
  shadowDark: 'rgba(151, 163, 184, 0.55)',
  shadowLight: 'rgba(255, 255, 255, 0.92)',
  ink: '#101216',
  inkSoft: '#3B404A',
  muted: '#6F7786',
  faint: '#A2A9B6',
  line: 'rgba(16, 18, 22, 0.08)',
  onInk: '#FFFFFF',
  accent: '#FFC21A',
  accentDeep: '#E2A100',
  onAccent: '#101216',
  success: '#17905A',
  danger: '#D93D42',
  info: '#2A63F0',
  scrim: 'rgba(16, 18, 22, 0.42)',
  floatShadow: '0px 10px 28px rgba(30, 38, 52, 0.18), 0px 2px 6px rgba(30, 38, 52, 0.10)',
  map: {
    land: '#E3E7EC',
    town: '#DDE2E8',
    water: '#B9D3EE',
    waterEdge: '#A6C4E4',
    park: '#CBE6C6',
    parkEdge: '#B6D9B0',
    road: '#F7F8FA',
    roadCasing: '#D2D8E0',
    roadMajor: '#FFFFFF',
    roadMajorCasing: '#C7CED8',
    label: '#59616E',
    labelHalo: 'rgba(227, 231, 236, 0.9)',
    radiusFill: 'rgba(255, 194, 26, 0.08)',
    radiusStroke: 'rgba(16, 18, 22, 0.55)',
  },
};

export const dark: Palette = {
  scheme: 'dark',
  bg: '#1C1F25',
  card: '#22262D',
  well: '#181B20',
  shadowDark: 'rgba(0, 0, 0, 0.55)',
  shadowLight: 'rgba(255, 255, 255, 0.05)',
  ink: '#F3F4F6',
  inkSoft: '#C4C9D2',
  muted: '#8D94A1',
  faint: '#5E6572',
  line: 'rgba(255, 255, 255, 0.08)',
  onInk: '#101216',
  accent: '#FFC933',
  accentDeep: '#F0B000',
  onAccent: '#101216',
  success: '#3CC488',
  danger: '#FF6B6F',
  info: '#6E98FF',
  scrim: 'rgba(0, 0, 0, 0.6)',
  floatShadow: '0px 12px 30px rgba(0, 0, 0, 0.45), 0px 2px 6px rgba(0, 0, 0, 0.35)',
  map: {
    land: '#20242A',
    town: '#252A31',
    water: '#1A2C42',
    waterEdge: '#1F3550',
    park: '#1F3326',
    parkEdge: '#24402D',
    road: '#30353E',
    roadCasing: '#262A31',
    roadMajor: '#3B414B',
    roadMajorCasing: '#2B3038',
    label: '#8D94A1',
    labelHalo: 'rgba(32, 36, 42, 0.9)',
    radiusFill: 'rgba(255, 201, 51, 0.07)',
    radiusStroke: 'rgba(243, 244, 246, 0.5)',
  },
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/** Hazard stripe colours for the Hard Hat Hunt. Same in both themes. */
export const hazard = {
  yellow: '#FFC21A',
  black: '#15171B',
} as const;

import { Platform, type TextStyle } from 'react-native';

/**
 * Three faces:
 * - display: Bricolage Grotesque — confident, slightly quirky headlines.
 * - body: Figtree — clean, friendly UI text (our stand-in for Uber Move).
 * - stencil: Big Shoulders Stencil — construction-site signage for the Hard Hat Hunt.
 *
 * Native loads the static font files through expo-font (see fonts.ts) and must
 * reference each weight by its own family name. Web loads the same families from
 * Google Fonts and uses CSS weights.
 */
export type FontRole = 'display' | 'body' | 'stencil';
export type Weight = 400 | 500 | 600 | 700 | 800 | 900;

const nativeFamilies: Record<FontRole, Partial<Record<Weight, string>>> = {
  display: {
    500: 'BricolageGrotesque_500Medium',
    600: 'BricolageGrotesque_600SemiBold',
    700: 'BricolageGrotesque_700Bold',
    800: 'BricolageGrotesque_800ExtraBold',
  },
  body: {
    400: 'Figtree_400Regular',
    500: 'Figtree_500Medium',
    600: 'Figtree_600SemiBold',
    700: 'Figtree_700Bold',
    800: 'Figtree_800ExtraBold',
  },
  stencil: {
    700: 'BigShouldersStencil_700Bold',
    800: 'BigShouldersStencil_800ExtraBold',
    900: 'BigShouldersStencil_900Black',
  },
};

const webStacks: Record<FontRole, string> = {
  display: '"Bricolage Grotesque", "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif',
  body: '"Figtree", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  stencil: '"Big Shoulders Stencil", "Bricolage Grotesque", Impact, "Arial Narrow", sans-serif',
};

function nearestWeight(available: Partial<Record<Weight, string>>, wanted: Weight): Weight {
  const weights = Object.keys(available).map(Number) as Weight[];
  return weights.reduce((best, w) => (Math.abs(w - wanted) < Math.abs(best - wanted) ? w : best), weights[0]);
}

export function font(role: FontRole, weight: Weight = 400): TextStyle {
  if (Platform.OS === 'web') {
    return { fontFamily: webStacks[role], fontWeight: String(weight) as TextStyle['fontWeight'] };
  }
  const families = nativeFamilies[role];
  return { fontFamily: families[nearestWeight(families, weight)] };
}

export type TextVariant =
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'micro'
  | 'label'
  | 'stencilXL'
  | 'stencil'
  | 'stencilSm'
  | 'number';

export const textVariants: Record<TextVariant, TextStyle> = {
  hero: { ...font('display', 800), fontSize: 34, lineHeight: 38, letterSpacing: -0.9 },
  h1: { ...font('display', 800), fontSize: 27, lineHeight: 32, letterSpacing: -0.6 },
  h2: { ...font('display', 700), fontSize: 21, lineHeight: 26, letterSpacing: -0.3 },
  h3: { ...font('display', 700), fontSize: 17, lineHeight: 22, letterSpacing: -0.15 },
  body: { ...font('body', 400), fontSize: 15, lineHeight: 21 },
  bodyStrong: { ...font('body', 600), fontSize: 15, lineHeight: 21 },
  small: { ...font('body', 500), fontSize: 13, lineHeight: 18 },
  smallStrong: { ...font('body', 700), fontSize: 13, lineHeight: 18 },
  micro: { ...font('body', 600), fontSize: 11, lineHeight: 14 },
  label: { ...font('body', 800), fontSize: 11, lineHeight: 14, letterSpacing: 0.9, textTransform: 'uppercase' },
  stencilXL: { ...font('stencil', 900), fontSize: 40, lineHeight: 40, letterSpacing: 1 },
  stencil: { ...font('stencil', 800), fontSize: 24, lineHeight: 26, letterSpacing: 0.8 },
  stencilSm: { ...font('stencil', 800), fontSize: 15, lineHeight: 17, letterSpacing: 0.9 },
  number: { ...font('display', 800), fontSize: 28, lineHeight: 30, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
};

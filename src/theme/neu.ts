import type { ViewStyle } from 'react-native';
import type { Palette } from './tokens';

/**
 * Neumorphic depth presets built on React Native's `boxShadow` (New
 * Architecture, iOS + Android 10+, and react-native-web). Each preset pairs a
 * light shadow from the top-left with a dark one from the bottom-right, so the
 * shape reads as pressed out of (raised) or into (inset) the base surface.
 *
 * `float` is the exception: things floating over the map can't borrow the
 * background, so they get a conventional soft drop shadow instead.
 */
export type Depth = 'raisedLg' | 'raised' | 'raisedSm' | 'inset' | 'insetSm' | 'float' | 'flat';

export function neu(c: Palette, depth: Depth): ViewStyle {
  const L = c.shadowLight;
  const D = c.shadowDark;
  switch (depth) {
    case 'raisedLg':
      return { backgroundColor: c.bg, boxShadow: `-9px -9px 20px ${L}, 9px 9px 20px ${D}` };
    case 'raised':
      return { backgroundColor: c.bg, boxShadow: `-6px -6px 14px ${L}, 6px 6px 14px ${D}` };
    case 'raisedSm':
      return { backgroundColor: c.bg, boxShadow: `-3px -3px 8px ${L}, 3px 3px 8px ${D}` };
    case 'inset':
      return { backgroundColor: c.well, boxShadow: `inset 5px 5px 11px ${D}, inset -5px -5px 11px ${L}` };
    case 'insetSm':
      return { backgroundColor: c.well, boxShadow: `inset 2px 2px 5px ${D}, inset -2px -2px 5px ${L}` };
    case 'float':
      return { backgroundColor: c.card, boxShadow: c.floatShadow };
    case 'flat':
    default:
      return { backgroundColor: c.bg };
  }
}

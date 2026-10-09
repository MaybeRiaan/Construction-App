import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

/** Native: real platform transitions, sheets and swipe-back. */
export const Stack = createNativeStackNavigator<RootStackParamList>();

export type Presentation = 'card' | 'modal' | 'sheet' | 'fade';

export function presentation(kind: Presentation, bg: string): NativeStackNavigationOptions {
  switch (kind) {
    case 'modal':
      return { headerShown: false, presentation: 'modal', contentStyle: { backgroundColor: bg } };
    case 'sheet':
      return { headerShown: false, presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } };
    case 'fade':
      return { headerShown: false, animation: 'fade', contentStyle: { backgroundColor: bg } };
    default:
      return { headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: bg } };
  }
}

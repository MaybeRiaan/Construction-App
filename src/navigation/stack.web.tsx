import { CardStyleInterpolators, createStackNavigator, TransitionPresets, type StackNavigationOptions } from '@react-navigation/stack';
import type { RootStackParamList } from './types';

/** Web: the JS stack, so transitions animate inside the device frame. */
export const Stack = createStackNavigator<RootStackParamList>();

export type Presentation = 'card' | 'modal' | 'sheet' | 'fade';

/**
 * `headerMode: 'float'` keeps every screen inside its card. Without it the
 * stack switches to full-page scrolling whenever the app fills the browser
 * window (a phone), and bottom bars end up below the fold.
 */
const base: StackNavigationOptions = { headerShown: false, headerMode: 'float' };

export function presentation(kind: Presentation, bg: string): StackNavigationOptions {
  switch (kind) {
    case 'modal':
      return { ...base, ...TransitionPresets.ModalSlideFromBottomIOS, cardStyle: { backgroundColor: bg }, gestureEnabled: false };
    case 'sheet':
      return {
        ...base,
        presentation: 'transparentModal',
        cardStyle: { backgroundColor: 'transparent' },
        cardOverlayEnabled: false,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        gestureEnabled: false,
      };
    case 'fade':
      return { ...base, cardStyle: { backgroundColor: bg }, cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter };
    default:
      return { ...base, ...TransitionPresets.SlideFromRightIOS, cardStyle: { backgroundColor: bg }, gestureEnabled: false };
  }
}

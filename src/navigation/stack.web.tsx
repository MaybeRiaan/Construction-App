import { CardStyleInterpolators, createStackNavigator, TransitionPresets, type StackNavigationOptions } from '@react-navigation/stack';
import type { RootStackParamList } from './types';

/** Web: the JS stack, so transitions animate inside the device frame. */
export const Stack = createStackNavigator<RootStackParamList>();

export type Presentation = 'card' | 'modal' | 'sheet' | 'fade';

export function presentation(kind: Presentation, bg: string): StackNavigationOptions {
  switch (kind) {
    case 'modal':
      return { headerShown: false, ...TransitionPresets.ModalSlideFromBottomIOS, cardStyle: { backgroundColor: bg }, gestureEnabled: false };
    case 'sheet':
      return {
        headerShown: false,
        presentation: 'transparentModal',
        cardStyle: { backgroundColor: 'transparent' },
        cardOverlayEnabled: false,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        gestureEnabled: false,
      };
    case 'fade':
      return { headerShown: false, cardStyle: { backgroundColor: bg }, cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter };
    default:
      return { headerShown: false, ...TransitionPresets.SlideFromRightIOS, cardStyle: { backgroundColor: bg }, gestureEnabled: false };
  }
}

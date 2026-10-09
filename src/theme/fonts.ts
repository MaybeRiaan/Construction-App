import { BigShouldersStencil_700Bold, BigShouldersStencil_800ExtraBold, BigShouldersStencil_900Black } from '@expo-google-fonts/big-shoulders-stencil';
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';

/** Native: bundle the static font files. Resolves true when loaded (or failed, falling back to system fonts). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    BigShouldersStencil_700Bold,
    BigShouldersStencil_800ExtraBold,
    BigShouldersStencil_900Black,
  });
  return loaded || Boolean(error);
}

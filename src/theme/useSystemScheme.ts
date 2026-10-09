import { useColorScheme } from 'react-native';
import type { SchemeName } from './tokens';

export function useSystemScheme(): SchemeName {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

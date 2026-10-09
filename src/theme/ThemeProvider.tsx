import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSettings } from '../state/settings';
import { dark, light, type Palette, type SchemeName } from './tokens';
import { useSystemScheme } from './useSystemScheme';

export interface Theme {
  c: Palette;
  scheme: SchemeName;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({ c: light, scheme: 'light', isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useSettings((s) => s.themePref);
  const system = useSystemScheme();
  const scheme: SchemeName = pref === 'system' ? system : pref;
  const value = useMemo<Theme>(() => ({ c: scheme === 'dark' ? dark : light, scheme, isDark: scheme === 'dark' }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

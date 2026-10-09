import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogoMark } from './src/art/Logo';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppShell } from './src/shell/AppShell';
import { CommunityProvider } from './src/state/CommunityProvider';
import { LocationProvider } from './src/state/LocationProvider';
import { PlacesProvider } from './src/state/PlacesProvider';
import { useHydrated } from './src/state/useHydrated';
import { useAppFonts } from './src/theme/fonts';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { Toasts } from './src/ui/Toasts';

function Root() {
  const { c, isDark } = useTheme();
  const fontsReady = useAppFonts();
  const hydrated = useHydrated();
  const navTheme = useMemo<NavTheme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: c.bg, card: c.bg, text: c.ink, border: c.line, primary: c.ink, notification: c.accent } };
  }, [isDark, c]);

  if (!fontsReady || !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <LogoMark size={72} />
      </View>
    );
  }

  return (
    <AppShell>
      <LocationProvider>
        <CommunityProvider>
          <PlacesProvider>
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
            <Toasts />
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </PlacesProvider>
        </CommunityProvider>
      </LocationProvider>
    </AppShell>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

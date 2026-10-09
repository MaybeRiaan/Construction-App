import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/** Native: the real device provides the frame and safe areas. */
export function AppShell({ children }: { children: ReactNode }) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}

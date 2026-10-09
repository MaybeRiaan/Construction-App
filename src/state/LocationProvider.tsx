import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { config } from '../config';
import type { LatLng } from '../domain/types';
import { locationPermission, requestLocation, supportsRealLocation } from '../services/location';

export interface LocationState {
  /** Where "you" are: the device location, or the demo town centre. */
  origin: LatLng;
  source: 'device' | 'demo';
  ready: boolean;
  /** True when this build can use the real device location (native). */
  supportsRealLocation: boolean;
  /** Ask for permission and use the device location. Resolves true if granted. */
  useDeviceLocation: () => Promise<boolean>;
}

const Ctx = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<LatLng>(config.demoCenter);
  const [source, setSource] = useState<'device' | 'demo'>('demo');
  const [ready, setReady] = useState(!supportsRealLocation);

  useEffect(() => {
    if (!supportsRealLocation) return;
    let alive = true;
    (async () => {
      if ((await locationPermission()) === 'granted') {
        const p = await requestLocation();
        if (alive && p) {
          setOrigin(p);
          setSource('device');
        }
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const useDeviceLocation = useCallback(async () => {
    const p = await requestLocation();
    if (!p) return false;
    setOrigin(p);
    setSource('device');
    return true;
  }, []);

  const value = useMemo(
    () => ({ origin, source, ready, supportsRealLocation, useDeviceLocation }),
    [origin, source, ready, useDeviceLocation],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocation(): LocationState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLocation outside LocationProvider');
  return v;
}

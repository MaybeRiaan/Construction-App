import { useEffect, useState } from 'react';
import { useHunt } from './hunt';
import { usePlaces } from './places';
import { useSettings } from './settings';

const stores = [useSettings, usePlaces, useHunt];
const allHydrated = () => stores.every((s) => s.persist.hasHydrated());

/** True once every persisted store has loaded from device storage. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);
  useEffect(() => {
    const unsubs = stores.map((s) => s.persist.onFinishHydration(() => setHydrated(allHydrated())));
    setHydrated(allHydrated());
    return () => unsubs.forEach((u) => u());
  }, []);
  return hydrated;
}

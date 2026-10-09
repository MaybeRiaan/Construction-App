import { useEffect, useState } from 'react';
import type { SchemeName } from './tokens';

/**
 * On the web the host page can force a theme with `data-theme` on <html>
 * (claude.ai artifacts do this); otherwise follow `prefers-color-scheme`.
 */
function read(): SchemeName {
  if (typeof document === 'undefined') return 'light';
  const forced = document.documentElement.getAttribute('data-theme');
  if (forced === 'dark' || forced === 'light') return forced;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useSystemScheme(): SchemeName {
  const [scheme, setScheme] = useState<SchemeName>(read);
  useEffect(() => {
    const update = () => setScheme(read());
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', update);
    } catch {
      mq = null;
    }
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mq?.removeEventListener?.('change', update);
      obs.disconnect();
    };
  }, []);
  return scheme;
}

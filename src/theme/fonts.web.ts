import { useEffect, useState } from 'react';

export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil:wght@700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700;800&display=swap';

/**
 * Web: fonts come from Google Fonts. The artifact page links the stylesheet
 * itself; for local `expo start --web` we add the link at runtime. We don't
 * block rendering on fonts; the fallback stack shows until they arrive.
 */
export function useAppFonts(): boolean {
  const [ready] = useState(true);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.querySelector('link[data-playdar-fonts]') || document.querySelector(`link[href^="https://fonts.googleapis.com/css2?family=Big+Shoulders"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_HREF;
    link.setAttribute('data-playdar-fonts', '');
    document.head.appendChild(link);
  }, []);
  return ready;
}

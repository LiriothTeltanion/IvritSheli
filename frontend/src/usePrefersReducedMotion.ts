// Module: reduced-motion preference
// Purpose: Let JavaScript-driven motion honour the same preference the CSS does.
// Notes: The stylesheet already stops CSS animation under
//        `prefers-reduced-motion: reduce`, but it cannot reach a setInterval
//        that swaps a background photograph or a mousemove handler that tilts a
//        card. Those kept running for a learner who had asked the system for
//        less movement — which is exactly the person most likely to need it.

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function read(): boolean {
  // jsdom does not implement matchMedia, and neither does a server render.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

/** Returns true while the learner has asked the system to reduce motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(read);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent): void => setReduced(event.matches);
    setReduced(media.matches);
    // Safari below 14 exposes only the deprecated listener API.
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  return reduced;
}

import { useState, useEffect } from 'react';

// Detect mobile by primary input being touch (pointer: coarse).
// This is more reliable than max-width because it doesn't break
// on orientation change and correctly excludes touch-laptops (pointer: fine).
export default function useMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    return window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

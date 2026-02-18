import { useState, useEffect } from 'react';

export default function useMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    return (
      ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
      window.matchMedia('(max-width: 1024px)').matches
    );
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1024px)');
    const handler = (e) => {
      setIsMobile(
        e.matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
      );
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

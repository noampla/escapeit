import { useState, useEffect, useCallback } from 'react';

/**
 * Lightweight URL router using the History API.
 *
 * URL scheme:
 *   /                  → menu
 *   /play              → selectLevel
 *   /map/:mapId        → mapPage
 *   /play/:mapId       → lobby (then solve)
 *   /build             → theme-select-build
 *   /build/:themeId    → build (new)
 *   /edit/:mapId       → build (edit)
 */

const ROUTES = [
  { pattern: /^\/upload-map\/?$/, mode: 'uploadMap' },
  { pattern: /^\/edit\/([^/]+)\/?$/, mode: 'build', paramName: 'editMapId' },
  { pattern: /^\/build\/([^/]+)\/?$/, mode: 'build', paramName: 'themeId' },
  { pattern: /^\/build\/?$/, mode: 'theme-select-build' },
  { pattern: /^\/map\/([^/]+)\/?$/, mode: 'mapPage', paramName: 'mapId' },
  { pattern: /^\/play\/([^/]+)\/?$/, mode: 'lobby', paramName: 'mapId' },
  { pattern: /^\/play\/?$/, mode: 'selectLevel' },
  { pattern: /^\/?$/, mode: 'menu' },
];

function parseRoute(pathname) {
  for (const route of ROUTES) {
    const match = pathname.match(route.pattern);
    if (match) {
      const params = {};
      if (route.paramName && match[1]) {
        params[route.paramName] = decodeURIComponent(match[1]);
      }
      return { mode: route.mode, params };
    }
  }
  return { mode: 'menu', params: {} };
}

function modeToPath(mode, params = {}) {
  switch (mode) {
    case 'menu': return '/';
    case 'selectLevel': return '/play';
    case 'mapPage': return `/map/${params.mapId}`;
    case 'lobby':
    case 'solve':
      return params.mapId ? `/play/${params.mapId}` : '/play';
    case 'theme-select-build': return '/build';
    case 'build':
      if (params.editMapId) return `/edit/${params.editMapId}`;
      if (params.themeId) return `/build/${params.themeId}`;
      return '/build';
    default: return '/';
  }
}

export default function useRouter() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path, { replace = false } = {}) => {
    if (path === window.location.pathname) return;
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    setRoute(parseRoute(path));
  }, []);

  const navigateByMode = useCallback((mode, params = {}) => {
    navigate(modeToPath(mode, params));
  }, [navigate]);

  // Sync URL without triggering a state change (for sub-mode transitions like lobby→solve)
  const syncUrl = useCallback((mode, params = {}) => {
    const path = modeToPath(mode, params);
    if (path !== window.location.pathname) {
      window.history.replaceState(null, '', path);
    }
  }, []);

  return { route, navigate, navigateByMode, syncUrl };
}

export { parseRoute, modeToPath };

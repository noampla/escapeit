/**
 * AI Map Generator — client-side service
 * Extracts a minimal tile catalog from the loaded theme and calls the server endpoint.
 */

// Server URL — reads from VITE_API_URL env var, falls back to same-origin for local dev
const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/generate-map`;

/**
 * Build a minimal tile catalog from the loaded theme.
 * Only sends: id, layer, walkable, tooltip, unique — enough for Claude to produce valid tile IDs.
 */
export function getTileCatalogForAI(theme) {
  const tileTypes = theme.getTileTypes();

  const tileCatalog = Object.entries(tileTypes)
    .filter(([, t]) => t.category !== null)       // only placeable tiles
    .map(([id, t]) => ({
      id,
      layer: t.layer,
      walkable: t.walkable,
      tooltip: (t.tooltip || id).replace(/\s*\(.*?\)\s*/g, ' ').trim(),
      ...(t.unique ? { unique: true } : {}),
    }));

  return {
    tileCatalog,
    startTile: theme.getStartTile?.() || 'campfire',
    exitTile: (theme.getExitTiles?.() || ['car'])[0],
    missionTypes: theme.getMissionTypes?.() || ['escape'],
  };
}

/**
 * Call the server to generate a map from a story description.
 * Returns { name, grid, missions, lives, inventoryCapacity, repairs }.
 */
export async function generateAIMap(story, themeId, theme, difficulty) {
  const { tileCatalog, startTile, exitTile, missionTypes } = getTileCatalogForAI(theme);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      story,
      themeId,
      tileCatalog,
      startTile,
      exitTile,
      missionTypes,
      difficulty,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Generation failed' }));
    throw new Error(err.error || `Server error ${res.status}`);
  }

  return res.json();
}

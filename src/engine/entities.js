// Generic entity movement system for themes
// Entities are tiles marked with isMovingEntity: true

/**
 * Move all entities on the grid based on theme's movement logic
 * @param {Array} grid - Current game grid
 * @param {Object} theme - Theme with entity movement logic
 * @param {Object} gameState - Current game state
 * @returns {Array} New grid with entities moved, or null if no changes
 */
export function moveEntities(grid, theme, gameState = {}) {
  if (!theme) {
    return null; // No theme
  }

  // Call theme's moveEntities if it exists
  if (typeof theme.moveEntities === 'function') {
    return theme.moveEntities(grid, gameState);
  }

  return null; // Theme doesn't implement entity movement
}

/**
 * Check if a tile is a moving entity
 * @param {Object} tile - Tile to check
 * @param {Object} theme - Current theme
 * @returns {boolean}
 */
export function isMovingEntity(tile, theme) {
  if (!tile || !theme) return false;

  const tileTypes = theme.getTileTypes?.() || {};
  const tileDef = tileTypes[tile.type];

  return tileDef?.isMovingEntity === true;
}

/**
 * Find all moving entities on the grid
 * @param {Array} grid - Current game grid
 * @param {Object} theme - Current theme
 * @returns {Array} Array of {x, y, tile} objects
 */
export function findMovingEntities(grid, theme) {
  const entities = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const tile = grid[y][x];
      if (isMovingEntity(tile, theme)) {
        entities.push({ x, y, tile });
      }
    }
  }

  return entities;
}

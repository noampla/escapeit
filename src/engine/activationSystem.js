// Activation System - Enables puzzle-based activation of doors/gates
// Items with specific IDs must be placed at specific positions to activate

/**
 * Check if a single requirement is met
 * @param {Array} grid - The game grid
 * @param {Object} requirement - { x, y, itemId }
 * @returns {boolean} - True if requirement is met
 */
export function checkRequirement(grid, requirement) {
  const { x, y, itemId } = requirement;
  const cell = grid[y]?.[x];
  if (!cell?.object) return false;

  const objType = cell.object.type;
  if (!objType.startsWith('item-')) return false;

  const config = cell.object.config || {};
  // Match imageId (for drawing-boards) or item type suffix
  return config.imageId === itemId || objType === `item-${itemId}`;
}

/**
 * Check all requirements for an activatable tile (unordered mode)
 * @param {Array} grid - The game grid
 * @param {Object} activationRequirements - The activation config
 * @returns {boolean} - True if all requirements are met
 */
export function checkAllRequirements(grid, activationRequirements) {
  if (!activationRequirements?.enabled) return false;

  const requirements = activationRequirements.requirements || [];
  if (requirements.length === 0) return false;

  // All requirements must be met
  return requirements.every(req => checkRequirement(grid, req));
}

/**
 * Check ordered requirements with fulfillment tracking
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state (will be mutated for progress tracking)
 * @param {Object} activationRequirements - The activation config
 * @param {string} tileKey - Unique key for this tile ("x,y")
 * @returns {boolean} - True if all requirements are met in order
 */
export function checkOrderedRequirements(grid, gameState, activationRequirements, tileKey) {
  if (!activationRequirements?.enabled || !activationRequirements.orderMatters) return false;

  const requirements = activationRequirements.requirements || [];
  if (requirements.length === 0) return false;

  // Initialize progress tracking
  if (!gameState.activationProgress) {
    gameState.activationProgress = {};
  }
  const progress = gameState.activationProgress[tileKey] || { fulfilledCount: 0 };

  // Only advance if:
  // 1. All previous requirements are still met
  // 2. The NEXT requirement (at index fulfilledCount) is now met
  const nextIndex = progress.fulfilledCount;

  if (nextIndex < requirements.length) {
    // First verify all previous requirements are still in place
    let allPreviousMet = true;
    for (let i = 0; i < nextIndex; i++) {
      if (!checkRequirement(grid, requirements[i])) {
        allPreviousMet = false;
        break;
      }
    }

    // Only check next requirement if previous ones are still met
    if (allPreviousMet && checkRequirement(grid, requirements[nextIndex])) {
      progress.fulfilledCount = nextIndex + 1;
      gameState.activationProgress[tileKey] = progress;
    }
  }

  return progress.fulfilledCount >= requirements.length;
}

/**
 * Execute activation on a tile (door opens, gate opens)
 * @param {Array} grid - The game grid
 * @param {number} x - Tile x position
 * @param {number} y - Tile y position
 * @returns {Object} - { success, method, modifyGrid }
 */
export function activateTile(grid, x, y) {
  const cell = grid[y]?.[x];
  if (!cell?.object) return { success: false };

  const tileType = cell.object.type;

  // Door pattern: replace type with -open variant
  if (tileType === 'door-key' || tileType === 'door-card') {
    cell.object.type = `${tileType}-open`;
    cell.object.config = { ...(cell.object.config || {}), activated: true };
    return { success: true, method: 'replace', modifyGrid: true };
  }

  // Ancient gate pattern: set isOpen flag
  if (tileType === 'ancient-gate') {
    cell.object.config = { ...(cell.object.config || {}), isOpen: true };
    return { success: true, method: 'flag', modifyGrid: true };
  }

  return { success: false };
}

/**
 * Find all tiles with activation requirements
 * @param {Array} grid - The game grid
 * @returns {Array} - Array of { x, y, type, config }
 */
export function getActivatableTiles(grid) {
  const tiles = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      const config = cell.object?.config;
      if (config?.activationRequirements?.enabled) {
        tiles.push({
          x,
          y,
          type: cell.object.type,
          config
        });
      }
    }
  }
  return tiles;
}

/**
 * Main check function: call after item drop/pickup
 * Checks all activatable tiles and activates those with met requirements
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state
 * @returns {Array} - Array of activated tiles { x, y, type }
 */
export function checkActivations(grid, gameState) {
  const activatableTiles = getActivatableTiles(grid);
  const results = [];

  for (const tile of activatableTiles) {
    const { x, y, config } = tile;
    const tileKey = `${x},${y}`;
    const reqs = config.activationRequirements;

    // Skip if already activated
    if (config.activated || config.isOpen) continue;

    let allMet = false;
    if (reqs.orderMatters) {
      allMet = checkOrderedRequirements(grid, gameState, reqs, tileKey);
    } else {
      allMet = checkAllRequirements(grid, reqs);
    }

    if (allMet) {
      const result = activateTile(grid, x, y);
      if (result.success) {
        results.push({ x, y, type: tile.type, ...result });
      }
    }
  }

  return results;
}

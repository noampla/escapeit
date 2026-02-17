// Activation System - Enables puzzle-based activation of doors/gates
// Items with specific IDs must be placed at specific positions to activate
// Special itemId '__player__' means player must stand on the position

export const PLAYER_REQUIREMENT_ID = '__player__';

/**
 * Check if a single requirement is met
 * @param {Array} grid - The game grid
 * @param {Object} requirement - { x, y, itemId }
 * @param {Object} playerPos - { x, y } current player position (needed for player requirements)
 * @returns {boolean} - True if requirement is met
 */
export function checkRequirement(grid, requirement, playerPos) {
  const { x, y, itemId } = requirement;

  // Player position requirement
  if (itemId === PLAYER_REQUIREMENT_ID) {
    return playerPos && playerPos.x === x && playerPos.y === y;
  }

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
 * @param {Object} playerPos - { x, y } current player position
 * @returns {boolean} - True if all requirements are met
 */
export function checkAllRequirements(grid, activationRequirements, playerPos) {
  if (!activationRequirements?.enabled) return false;

  const requirements = activationRequirements.requirements || [];
  if (requirements.length === 0) return false;

  // All requirements must be met
  return requirements.every(req => checkRequirement(grid, req, playerPos));
}

/**
 * Check ordered requirements with fulfillment tracking
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state (will be mutated for progress tracking)
 * @param {Object} activationRequirements - The activation config
 * @param {string} tileKey - Unique key for this tile ("x,y")
 * @param {Object} dropPosition - { x, y } position where item was just dropped (optional)
 * @param {Object} playerPos - { x, y } current player position
 * @returns {boolean} - True if all requirements are met in order
 */
export function checkOrderedRequirements(grid, gameState, activationRequirements, tileKey, dropPosition, playerPos) {
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
  // 3. The drop position matches the next required position (if dropPosition provided)
  const nextIndex = progress.fulfilledCount;

  if (nextIndex < requirements.length) {
    const nextReq = requirements[nextIndex];

    // If dropPosition is provided, only advance if this drop is at the next required position
    // (skip this check for player requirements since those are position-based already)
    if (dropPosition && nextReq.itemId !== PLAYER_REQUIREMENT_ID &&
        (dropPosition.x !== nextReq.x || dropPosition.y !== nextReq.y)) {
      // Drop is not at the next required position - don't advance
      return progress.fulfilledCount >= requirements.length;
    }

    // First verify all previous requirements are still in place
    let allPreviousMet = true;
    for (let i = 0; i < nextIndex; i++) {
      if (!checkRequirement(grid, requirements[i], playerPos)) {
        allPreviousMet = false;
        break;
      }
    }

    // Only check next requirement if previous ones are still met
    if (allPreviousMet && checkRequirement(grid, nextReq, playerPos)) {
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
 * Main check function: call after item drop/pickup or player movement
 * Checks all activatable tiles and activates those with met requirements
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state
 * @param {Object} dropPosition - { x, y } position where item was just dropped (optional, for ordered mode)
 * @param {Object} playerPos - { x, y } current player position
 * @returns {Array} - Array of activated tiles { x, y, type }
 */
export function checkActivations(grid, gameState, dropPosition, playerPos) {
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
      allMet = checkOrderedRequirements(grid, gameState, reqs, tileKey, dropPosition, playerPos);
    } else {
      allMet = checkAllRequirements(grid, reqs, playerPos);
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

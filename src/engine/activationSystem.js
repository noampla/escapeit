// Activation System - Enables puzzle-based activation of doors/gates
// Items with specific IDs must be placed at specific positions to activate
// Special itemId '__player__' means player must stand on the position
//
// Data model (new):
//   activationRequirements: {
//     startOpen: false,
//     conditionSequence: [
//       { direction: 'open'|'close', enabled, orderMatters, requirements: [{x,y,itemId},...] },
//       ...
//     ]
//   }
// Backwards-compat: old shape { enabled, orderMatters, requirements } treated as single open-step.

export const PLAYER_REQUIREMENT_ID = '__player__';

/**
 * Normalise activationRequirements to the new conditionSequence shape.
 */
function normaliseActivationRequirements(reqs) {
  if (!reqs) return null;
  if (Array.isArray(reqs.conditionSequence)) {
    return { startOpen: reqs.startOpen || false, conditionSequence: reqs.conditionSequence };
  }
  // Old shape
  return {
    startOpen: false,
    conditionSequence: [{
      direction: 'open',
      enabled: reqs.enabled || false,
      orderMatters: reqs.orderMatters || false,
      requirements: reqs.requirements || []
    }]
  };
}

/**
 * Check if a single requirement is met.
 * allPlayerPositions is an array of { x, y } for all players (local + peers).
 * For __player__ requirements any player in the array can satisfy it.
 * @param {Array} grid - The game grid
 * @param {Object} requirement - { x, y, itemId }
 * @param {Array} allPlayerPositions - array of { x, y } for every player
 * @returns {boolean} - True if requirement is met
 */
export function checkRequirement(grid, requirement, allPlayerPositions) {
  const { x, y, itemId } = requirement;

  // Player position requirement - satisfied if ANY player is standing there
  if (itemId === PLAYER_REQUIREMENT_ID) {
    const positions = Array.isArray(allPlayerPositions) ? allPlayerPositions : (allPlayerPositions ? [allPlayerPositions] : []);
    return positions.some(p => p && p.x === x && p.y === y);
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
 * Check all requirements for a condition step (unordered mode).
 * Each __player__ requirement must be satisfied by a DIFFERENT player position.
 * @param {Array} grid - The game grid
 * @param {Object} step - { enabled, orderMatters, requirements }
 * @param {Array} allPlayerPositions - array of { x, y } for every player
 * @returns {boolean} - True if all requirements are met
 */
export function checkAllRequirements(grid, step, allPlayerPositions) {
  if (!step?.enabled) return false;

  const requirements = step.requirements || [];
  if (requirements.length === 0) return false;

  const positions = Array.isArray(allPlayerPositions) ? allPlayerPositions : (allPlayerPositions ? [allPlayerPositions] : []);

  // For __player__ requirements, each must be satisfied by a distinct player.
  const usedPlayerIndices = new Set();
  for (const req of requirements) {
    if (req.itemId === PLAYER_REQUIREMENT_ID) {
      const idx = positions.findIndex((p, i) => p && p.x === req.x && p.y === req.y && !usedPlayerIndices.has(i));
      if (idx === -1) return false;
      usedPlayerIndices.add(idx);
    } else {
      if (!checkRequirement(grid, req, positions)) return false;
    }
  }
  return true;
}

/**
 * Check ordered requirements with fulfillment tracking.
 * Each __player__ requirement must be satisfied by a DIFFERENT player position.
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state (will be mutated for progress tracking)
 * @param {Object} step - { enabled, orderMatters, requirements }
 * @param {string} progressKey - Unique key for this step's progress (e.g. "x,y:step:N")
 * @param {Object} dropPosition - { x, y } position where item was just dropped (optional)
 * @param {Array} allPlayerPositions - array of { x, y } for every player
 * @returns {boolean} - True if all requirements are met in order
 */
export function checkOrderedRequirements(grid, gameState, step, progressKey, dropPosition, allPlayerPositions) {
  if (!step?.enabled || !step.orderMatters) return false;

  const requirements = step.requirements || [];
  if (requirements.length === 0) return false;

  const positions = Array.isArray(allPlayerPositions) ? allPlayerPositions : (allPlayerPositions ? [allPlayerPositions] : []);

  if (!gameState.activationProgress) gameState.activationProgress = {};
  const progress = gameState.activationProgress[progressKey] || { fulfilledCount: 0 };

  const nextIndex = progress.fulfilledCount;

  if (nextIndex < requirements.length) {
    const nextReq = requirements[nextIndex];

    if (dropPosition && nextReq.itemId !== PLAYER_REQUIREMENT_ID &&
        (dropPosition.x !== nextReq.x || dropPosition.y !== nextReq.y)) {
      return progress.fulfilledCount >= requirements.length;
    }

    const usedPlayerIndices = new Set();
    let allPreviousMet = true;
    for (let i = 0; i < nextIndex; i++) {
      const prevReq = requirements[i];
      if (prevReq.itemId === PLAYER_REQUIREMENT_ID) {
        const idx = positions.findIndex((p, pi) => p && p.x === prevReq.x && p.y === prevReq.y && !usedPlayerIndices.has(pi));
        if (idx === -1) { allPreviousMet = false; break; }
        usedPlayerIndices.add(idx);
      } else {
        if (!checkRequirement(grid, prevReq, positions)) { allPreviousMet = false; break; }
      }
    }

    if (allPreviousMet) {
      let nextMet = false;
      if (nextReq.itemId === PLAYER_REQUIREMENT_ID) {
        const idx = positions.findIndex((p, pi) => p && p.x === nextReq.x && p.y === nextReq.y && !usedPlayerIndices.has(pi));
        nextMet = idx !== -1;
      } else {
        nextMet = checkRequirement(grid, nextReq, positions);
      }
      if (nextMet) {
        progress.fulfilledCount = nextIndex + 1;
        gameState.activationProgress[progressKey] = progress;
      }
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
 * Execute deactivation on a tile (door closes, gate closes)
 * @param {Array} grid - The game grid
 * @param {number} x - Tile x position
 * @param {number} y - Tile y position
 * @returns {Object} - { success, method, modifyGrid }
 */
export function deactivateTile(grid, x, y) {
  const cell = grid[y]?.[x];
  if (!cell?.object) return { success: false };

  const tileType = cell.object.type;

  if (tileType === 'door-key-open') {
    cell.object.type = 'door-key';
    cell.object.config = { ...(cell.object.config || {}), activated: false };
    return { success: true, method: 'replace', modifyGrid: true };
  }
  if (tileType === 'door-card-open') {
    cell.object.type = 'door-card';
    cell.object.config = { ...(cell.object.config || {}), activated: false };
    return { success: true, method: 'replace', modifyGrid: true };
  }
  if (tileType === 'ancient-gate') {
    cell.object.config = { ...(cell.object.config || {}), isOpen: false };
    return { success: true, method: 'flag', modifyGrid: true };
  }

  return { success: false };
}

/**
 * Returns true if the tile is currently open/activated.
 */
function isTileOpen(config, tileType) {
  if (config?.isOpen) return true;
  if (config?.activated) return true;
  if (tileType === 'door-key-open' || tileType === 'door-card-open') return true;
  return false;
}

/**
 * Find all tiles with activation requirements (new or old shape).
 * @param {Array} grid - The game grid
 * @returns {Array} - Array of { x, y, type, config }
 */
export function getActivatableTiles(grid) {
  const tiles = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      const config = cell.object?.config;
      const reqs = config?.activationRequirements;
      if (!reqs) continue;
      // Accept both old shape (.enabled) and new shape (.conditionSequence)
      if (reqs.enabled || Array.isArray(reqs.conditionSequence)) {
        tiles.push({ x, y, type: cell.object.type, config });
      }
    }
  }
  return tiles;
}

/**
 * Apply startOpen states at game start (call once before first render).
 * Opens tiles with startOpen:true silently and advances their step counter
 * past any leading 'open' steps.
 * @param {Array} grid - The game grid (mutated)
 * @param {Object} gameState - Game state (mutated)
 */
export function applyStartStates(grid, gameState) {
  if (!gameState.activationProgress) gameState.activationProgress = {};

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      const config = cell.object?.config;
      const reqs = config?.activationRequirements;
      if (!reqs) continue;

      const norm = normaliseActivationRequirements(reqs);
      if (!norm) continue;

      const tileKey = `${x},${y}`;

      if (norm.startOpen) {
        activateTile(grid, x, y);
        // Advance past any leading open-steps (already satisfied by startOpen)
        let step = 0;
        while (step < norm.conditionSequence.length && norm.conditionSequence[step].direction === 'open') {
          step++;
        }
        gameState.activationProgress[tileKey] = { currentStep: step };
      } else {
        if (!gameState.activationProgress[tileKey]) {
          gameState.activationProgress[tileKey] = { currentStep: 0 };
        }
      }
    }
  }
}

/**
 * Main check function: call after item drop/pickup or player movement.
 * Fires the current step in each activatable tile's condition sequence if met.
 * Handles both opening and closing in a single call.
 *
 * playerPos may be a single { x, y } (solo) or an array of { x, y } (multiplayer).
 *
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state
 * @param {Object} dropPosition - { x, y } position where item was just dropped (optional)
 * @param {Object|Array} playerPos - { x, y } or [{ x, y }, ...] for all players
 * @returns {Array} - Array of { x, y, type, direction, ...activateResult }
 */
export function checkActivations(grid, gameState, dropPosition, playerPos) {
  const allPlayerPositions = Array.isArray(playerPos) ? playerPos : (playerPos ? [playerPos] : []);

  if (!gameState.activationProgress) gameState.activationProgress = {};

  const activatableTiles = getActivatableTiles(grid);
  const results = [];

  for (const tile of activatableTiles) {
    const { x, y, config } = tile;
    const tileKey = `${x},${y}`;
    const norm = normaliseActivationRequirements(config.activationRequirements);
    if (!norm) continue;

    const { conditionSequence } = norm;
    if (!conditionSequence.length) continue;

    const progress = gameState.activationProgress[tileKey] || { currentStep: 0 };
    const stepIdx = progress.currentStep;

    if (stepIdx >= conditionSequence.length) continue; // All steps exhausted

    const step = conditionSequence[stepIdx];
    if (!step?.enabled) continue;
    if (step.conditionType === 'path') continue; // path steps handled by onPlayerMove

    const tileOpen = isTileOpen(config, tile.type);

    // Direction mismatch → silent no-op (no message to player)
    if (step.direction === 'open' && tileOpen) continue;
    if (step.direction === 'close' && !tileOpen) continue;

    const progressKey = `${tileKey}:step:${stepIdx}`;
    let met;
    if (step.orderMatters) {
      met = checkOrderedRequirements(grid, gameState, step, progressKey, dropPosition, allPlayerPositions);
    } else {
      met = checkAllRequirements(grid, step, allPlayerPositions);
    }

    if (met) {
      const result = step.direction === 'open'
        ? activateTile(grid, x, y)
        : deactivateTile(grid, x, y);

      if (result.success) {
        progress.currentStep = stepIdx + 1;
        gameState.activationProgress[tileKey] = progress;
        results.push({ x, y, type: tile.type, direction: step.direction, ...result });
      }
    }
  }

  return results;
}

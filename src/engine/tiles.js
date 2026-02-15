import { GRID_COLS, GRID_ROWS } from '../utils/constants';

export function createEmptyGrid() {
  const grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    const row = [];
    for (let x = 0; x < GRID_COLS; x++) {
      row.push({
        floor: { type: 'empty', config: {} },
        object: null
      });
    }
    grid.push(row);
  }
  return grid;
}

export function cloneGrid(grid) {
  return grid.map(row => row.map(cell => ({
    floor: {
      type: cell.floor.type,
      config: {
        ...cell.floor.config,
        // Deep clone hiddenObject if present (for buried items)
        hiddenObject: cell.floor.config?.hiddenObject
          ? { ...cell.floor.config.hiddenObject, config: { ...cell.floor.config.hiddenObject.config } }
          : cell.floor.config?.hiddenObject
      }
    },
    object: cell.object ? {
      type: cell.object.type,
      config: { ...cell.object.config }
    } : null
  })));
}

export function placeTile(grid, x, y, type, TILE_TYPES = {}) {
  const def = TILE_TYPES[type];
  if (!def) {
    // If no definition, default to floor layer
    const newGrid = cloneGrid(grid);
    newGrid[y][x].floor = { type, config: {} };
    return newGrid;
  }

  const layer = def.layer || 'floor';
  const newGrid = cloneGrid(grid);

  // Handle unique tiles - remove duplicates from same layer
  if (def.unique) {
    for (let gy = 0; gy < newGrid.length; gy++) {
      for (let gx = 0; gx < newGrid[0].length; gx++) {
        const cell = newGrid[gy][gx];
        if (layer === 'floor' && cell.floor.type === type) {
          cell.floor = { type: 'ground', config: {} };
        } else if (layer === 'object' && cell.object?.type === type) {
          cell.object = null;
        }
      }
    }
  }

  const oldCell = grid[y][x];

  if (layer === 'floor') {
    // Placing floor tile
    newGrid[y][x].floor = {
      type,
      config: def.defaultConfig ? { ...def.defaultConfig } : {}
    };

    // Clear object if new floor is not walkable
    if (!def.walkable && newGrid[y][x].object) {
      newGrid[y][x].object = null;
    }
  } else {
    // Placing object tile
    newGrid[y][x].object = {
      type,
      config: def.defaultConfig ? { ...def.defaultConfig } : {}
    };

    // Store itemType for item tiles
    if (def.isItemTile) {
      newGrid[y][x].object.config.itemType = def.itemType;
    }

    // Store underlying floor for moving entities (guards) so they preserve floor colors
    if (def.isMovingEntity) {
      newGrid[y][x].object.config.underlyingFloor = {
        type: oldCell.floor.type,
        config: { ...oldCell.floor.config }
      };
    }
  }

  return newGrid;
}

export function removeTile(grid, x, y) {
  const newGrid = cloneGrid(grid);
  const cell = newGrid[y][x];

  // If there's an object, remove it first
  if (cell.object) {
    // For moving entities, restore underlying floor
    if (cell.object.config?.underlyingFloor) {
      cell.floor = {
        type: cell.object.config.underlyingFloor.type,
        config: { ...cell.object.config.underlyingFloor.config }
      };
    }
    cell.object = null;
  }
  // If no object, remove floor (replace with empty)
  else {
    cell.floor = { type: 'empty', config: {} };
  }

  return newGrid;
}

/**
 * Check if a cell is walkable based on tile definitions from theme
 * @param {Object} cell - Grid cell with floor and object layers
 * @param {Object} TILE_TYPES - Tile definitions from theme
 * @returns {boolean} - True if walkable
 */
export function isWalkable(cell, TILE_TYPES = {}) {
  // Check object layer first (objects can block movement)
  if (cell.object) {
    const objectDef = TILE_TYPES[cell.object.type];
    // If object has a walkable property defined, use it
    if (objectDef && objectDef.walkable !== undefined) {
      return objectDef.walkable;
    }
    // Default: objects are walkable unless specified otherwise
    return true;
  }

  // Check floor layer
  const floorDef = TILE_TYPES[cell.floor.type];
  if (floorDef && floorDef.walkable !== undefined) {
    return floorDef.walkable;
  }

  // Default: if no definition found, assume not walkable for safety
  return false;
}

/**
 * Validate that an object can be placed on a floor
 * @param {Object} cell - Grid cell with floor and object layers
 * @param {string} objectType - Object type to place
 * @param {Object} TILE_TYPES - Tile definitions
 * @returns {Object} { valid: boolean, message?: string }
 */
export function validateObjectPlacement(cell, objectType, TILE_TYPES) {
  const objectDef = TILE_TYPES[objectType];
  const floorDef = TILE_TYPES[cell.floor.type];

  // Objects can only be placed on floors (not on empty/void)
  if (cell.floor.type === 'empty') {
    return {
      valid: false,
      message: 'Cannot place objects on empty tiles! Place a floor tile first.'
    };
  }

  // Check if floor is walkable (most objects need walkable floors)
  // Exception: cameras/lasers can attach to walls
  if (!floorDef?.walkable && !objectDef?.attachToWall) {
    return {
      valid: false,
      message: `Cannot place objects on ${floorDef?.label || 'this tile'}! Objects need walkable floor tiles.`
    };
  }

  return { valid: true };
}

export function findTile(grid, type) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (cell.floor.type === type) return { x, y, layer: 'floor' };
      if (cell.object?.type === type) return { x, y, layer: 'object' };
    }
  }
  return null;
}

export function findAllTiles(grid, type) {
  const results = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (cell.floor.type === type) {
        results.push({ x, y, layer: 'floor', config: cell.floor.config });
      }
      if (cell.object?.type === type) {
        results.push({ x, y, layer: 'object', config: cell.object.config });
      }
    }
  }
  return results;
}

// === BURIED OBJECT HELPERS ===

/**
 * Check if a floor tile has a hidden/buried object
 * @param {Object} cell - Grid cell with floor and object layers
 * @returns {boolean} - True if floor has a buried object
 */
export function hasHiddenObject(cell) {
  return cell.floor?.config?.hiddenObject != null;
}

/**
 * Check if a floor tile has been dug
 * @param {Object} cell - Grid cell with floor and object layers
 * @returns {boolean} - True if floor has been dug
 */
export function isDug(cell) {
  return cell.floor?.config?.dug === true;
}

/**
 * Reveal a hidden object by digging (modifies cell in place)
 * Marks the floor as dug and moves hidden object to object layer
 * @param {Object} cell - Grid cell to dig
 * @returns {Object|null} - The revealed object or null if nothing buried
 */
export function revealHiddenObject(cell) {
  if (!cell.floor?.config) {
    cell.floor.config = {};
  }

  // Mark as dug
  cell.floor.config.dug = true;

  // Check for hidden object
  const hidden = cell.floor.config.hiddenObject;
  if (hidden) {
    cell.floor.config.hiddenObject = null;
    cell.object = hidden;
    return hidden;
  }

  return null;
}

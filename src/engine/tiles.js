import { GRID_COLS, GRID_ROWS, TILE_TYPES } from '../utils/constants';

export function createEmptyGrid() {
  const grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    const row = [];
    for (let x = 0; x < GRID_COLS; x++) {
      row.push({ type: 'empty', config: {} });
    }
    grid.push(row);
  }
  return grid;
}

export function cloneGrid(grid) {
  return grid.map(row => row.map(cell => ({
    type: cell.type,
    config: { ...cell.config },
  })));
}

export function placeTile(grid, x, y, type) {
  const def = TILE_TYPES[type];
  if (!def) return grid;
  const newGrid = cloneGrid(grid);
  if (def.unique) {
    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        if (newGrid[gy][gx].type === type) {
          newGrid[gy][gx] = { type: 'ground', config: {} };
        }
      }
    }
  }
  newGrid[y][x] = {
    type,
    config: def.defaultConfig ? { ...def.defaultConfig } : {},
  };
  // Store itemType for item tiles
  if (def.isItemTile) {
    newGrid[y][x].config.itemType = def.itemType;
  }
  return newGrid;
}

export function removeTile(grid, x, y) {
  const newGrid = cloneGrid(grid);
  const cell = newGrid[y][x];
  if (cell.type === 'ground' || cell.type === 'empty') {
    newGrid[y][x] = { type: 'empty', config: {} };
  } else {
    newGrid[y][x] = { type: 'ground', config: {} };
  }
  return newGrid;
}

export function isWalkable(cell) {
  const blocking = ['tree', 'empty', 'water', 'snow', 'bear'];
  // Item tiles are walkable
  if (cell.type.startsWith('item-')) return true;
  return !blocking.includes(cell.type);
}

export function findTile(grid, type) {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (grid[y][x].type === type) return { x, y };
    }
  }
  return null;
}

export function findAllTiles(grid, type) {
  const results = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (grid[y][x].type === type) results.push({ x, y, config: grid[y][x].config });
    }
  }
  return results;
}

import { GRID_COLS, GRID_ROWS } from '../utils/constants';

// Check if player position is on a fire tile
export function checkHazards(grid, playerX, playerY) {
  const cell = grid[playerY]?.[playerX];
  if (cell && cell.type === 'fire') return 'fire';
  return null;
}

// Get all fire tile positions for builder preview
export function getAllHazardZones(grid) {
  const zones = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cell = grid[y][x];
      if (cell.type === 'fire') {
        zones.push({ x, y, hazardType: 'fire' });
      }
      if (cell.type === 'bear') {
        zones.push({ x, y, hazardType: 'bear' });
      }
    }
  }
  return zones;
}

// Flood fill to find all connected water tiles from a starting point
export function floodFillWater(grid, startX, startY) {
  const visited = new Set();
  const queue = [{ x: startX, y: startY }];
  const cells = [];
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) continue;
    if (grid[y][x].type !== 'water') continue;
    cells.push({ x, y });
    queue.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
  }
  return cells;
}

import { isWalkable } from './tiles';

export function canMoveTo(grid, x, y, TILE_TYPES = {}) {
  if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return false;
  return isWalkable(grid[y][x], TILE_TYPES);
}

export function isSamePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

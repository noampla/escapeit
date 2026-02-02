import { GRID_COLS, GRID_ROWS } from '../utils/constants';
import { isWalkable } from './tiles';

export function canMoveTo(grid, x, y) {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return false;
  return isWalkable(grid[y][x]);
}

export function isSamePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

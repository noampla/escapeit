// Universal constants - theme-independent
export const GRID_COLS = 20;
export const GRID_ROWS = 15;
export const TILE_SIZE = 40;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE;
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE;

// Directions for movement
export const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const DIRECTION_LIST = ['up', 'down', 'left', 'right'];

// Mission types (theme-independent)
export const MISSION_TYPES = [
  { id: 'collect', label: 'Find Item', needsTarget: true, targetLabel: 'Item type (e.g. axe)', targetOptions: ['key', 'axe', 'bucket', 'rope', 'knife', 'sweater', 'wood'] },
  { id: 'rescue', label: 'Rescue Friend', needsTarget: false },
  { id: 'extinguish', label: 'Extinguish All Fires', needsTarget: false },
  { id: 'reach', label: 'Reach Location', needsTarget: true, targetLabel: 'Coords (x,y)', coordBased: true },
  { id: 'escape', label: 'Reach the Car', needsTarget: false },
];

// Default game settings
export const DEFAULT_LIVES = 3;
export const DEFAULT_INVENTORY_CAPACITY = 8;

// Storage key
export const STORAGE_KEY = 'escape_it_levels_v1';

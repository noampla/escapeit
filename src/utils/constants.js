// Universal constants - theme-independent
export const GRID_COLS = 100;
export const GRID_ROWS = 100;
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

// Base mission types (theme-independent structure)
// Target options come from theme.getMissionTargetOptions()
// Base mission types - structural definitions only
// Theme-specific config (labels, amounts, etc.) comes from theme.getMissionConfig()
export const BASE_MISSION_TYPES = [
  { id: 'collect', label: 'Find Item', needsTarget: true },
  { id: 'collect-amount', label: 'Collect Amount', needsAmount: true }, // Generic amount-based mission
  { id: 'rescue', label: 'Rescue', needsTarget: false },
  { id: 'extinguish', label: 'Extinguish All Hazards', needsTarget: false },
  { id: 'reach', label: 'Reach Location', needsTarget: true, coordBased: true },
  { id: 'escape', label: 'Reach Exit', needsTarget: false },
];

// Deprecated: use BASE_MISSION_TYPES and get options from theme
export const MISSION_TYPES = BASE_MISSION_TYPES;

// Default game settings
export const DEFAULT_LIVES = 3;
export const DEFAULT_INVENTORY_CAPACITY = 8;

// Storage key
export const STORAGE_KEY = 'escape_it_levels_v1';

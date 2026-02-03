export const GRID_COLS = 20;
export const GRID_ROWS = 15;
export const TILE_SIZE = 40;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE;
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE;

export const ITEM_TYPES = {
  key: { label: 'Key', emoji: '🔑', color: '#ffdd00' },
  axe: { label: 'Axe', emoji: '🪓', color: '#aa6633' },
  bucket: { label: 'Bucket', emoji: null, color: '#5588bb', draw: 'bucket' },
  rope: { label: 'Rope', emoji: '🧵', color: '#aa8855' },
  knife: { label: 'Knife', emoji: '🔪', color: '#cccccc' },
  sweater: { label: 'Sweater', emoji: '🧥', color: '#cc4466' },
  wood: { label: 'Wood', emoji: '🪵', color: '#8b6914', draw: 'wood' },
};

export const TILE_TYPES = {
  empty: { label: 'Empty', color: '#1a1a0e', category: 'basic', tooltip: 'Empty void. Not walkable.' },
  ground: { label: 'Ground', color: '#3d5a28', category: 'basic', tooltip: 'Walkable forest ground.' },
  tree: { label: 'Tree', color: '#2d4a1a', category: 'basic', configurable: false, defaultConfig: {}, tooltip: 'Blocks movement. Cut with axe (hold E) to get wood.' },
  water: { label: 'Water', color: '#2266aa', category: 'basic', tooltip: 'Blocks movement. Use Rope + Wood nearby (hold E) to build a raft. Use Bucket nearby (hold E) to fill it.' },
  snow: { label: 'Snow', color: '#ddeeff', category: 'basic', tooltip: 'Blocks movement unless player has a Sweater.' },
  raft: { label: 'Raft', color: '#6699aa', category: null, tooltip: 'Walkable water (created by building a raft).' },
  campfire: { label: 'Campfire (Start)', color: '#cc6600', category: 'basic', unique: true, tooltip: 'Player spawn point. Only one per level.' },
  car: { label: 'Car (Exit)', color: '#4488cc', category: 'basic', unique: true, configurable: true, defaultConfig: { needsKey: true }, tooltip: 'Level exit. Reach here after completing all missions.' },

  // Individual item types as placeable tiles
  'item-key': { label: 'Key', color: '#ffdd00', category: 'interactive', isItemTile: true, itemType: 'key', tooltip: 'Collectible key. Press E to pick up.' },
  'item-axe': { label: 'Axe', color: '#aa6633', category: 'interactive', isItemTile: true, itemType: 'axe', tooltip: 'Collectible axe. Press E to pick up. Use to cut trees.' },
  'item-bucket': { label: 'Bucket', color: '#5588bb', category: 'interactive', isItemTile: true, itemType: 'bucket', tooltip: 'Collectible bucket. Press E to pick up. Fill at water, use on fire.' },
  'item-rope': { label: 'Rope', color: '#aa8855', category: 'interactive', isItemTile: true, itemType: 'rope', tooltip: 'Collectible rope. Press E to pick up. Combine with wood to build raft.' },
  'item-knife': { label: 'Knife', color: '#cccccc', category: 'interactive', isItemTile: true, itemType: 'knife', tooltip: 'Collectible knife. Press E to pick up. Defeat bears.' },
  'item-sweater': { label: 'Sweater', color: '#cc4466', category: 'interactive', isItemTile: true, itemType: 'sweater', tooltip: 'Collectible sweater. Press E to pick up. Walk through snow.' },
  'item-wood': { label: 'Wood', color: '#8b6914', category: 'interactive', isItemTile: true, itemType: 'wood', tooltip: 'Collectible wood. Press E to pick up. Combine with rope to build raft.' },

  friend: { label: 'Lost Friend', color: '#ff88cc', category: 'interactive', configurable: true, defaultConfig: { name: 'Friend' }, tooltip: 'Lost friend. Hold E to rescue.' },
  fire: { label: 'Fire', color: '#ff4400', category: 'hazard', tooltip: 'Damaging hazard. Stepping on it costs a life. Extinguish with filled Bucket (hold E nearby).' },
  bear: { label: 'Bear', color: '#8b4513', category: 'hazard', tooltip: 'Without Knife: lose a life, pushed back. With Knife: bear defeated, get Sweater.' },
};

export const CONFIG_HELP = {
  car: {
    needsKey: 'If checked, player needs a Key in inventory to escape.',
  },
  friend: {
    name: 'Name for this friend. Shown in messages and missions.',
  },
};

export const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const DIRECTION_LIST = ['up', 'down', 'left', 'right'];

export const MISSION_TYPES = [
  { id: 'collect', label: 'Find Item', needsTarget: true, targetLabel: 'Item type (e.g. axe)', targetOptions: ['key', 'axe', 'bucket', 'rope', 'knife', 'sweater', 'wood'] },
  { id: 'rescue', label: 'Rescue Friend', needsTarget: false },
  { id: 'extinguish', label: 'Extinguish All Fires', needsTarget: false },
  { id: 'reach', label: 'Reach Location', needsTarget: true, targetLabel: 'Coords (x,y)', coordBased: true },
  { id: 'escape', label: 'Reach the Car', needsTarget: false },
];

export const DEFAULT_LIVES = 3;
export const DEFAULT_INVENTORY_CAPACITY = 8;

export const STORAGE_KEY = 'forest_game_levels_v3';

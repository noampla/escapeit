// Bank Robbery Theme - Tile Definitions

// Shared color options for doors, keys, and cards
export const LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444', dark: '#882222' },
  blue: { label: 'Blue', color: '#4444cc', dark: '#222288' },
  green: { label: 'Green', color: '#44cc44', dark: '#228822' },
  yellow: { label: 'Yellow', color: '#cccc44', dark: '#888822' },
  purple: { label: 'Purple', color: '#cc44cc', dark: '#882288' }
};

export const TILE_TYPES = {
  empty: {
    label: 'Empty',
    color: '#0a0a0a',
    category: 'basic',
    tooltip: 'Empty void. Not walkable.',
    walkable: false
  },
  wall: {
    label: 'Wall',
    color: '#3a3a3a',
    category: 'basic',
    tooltip: 'Solid wall. Blocks movement.',
    walkable: false
  },
  floor: {
    label: 'Floor',
    color: '#4a4a4a',
    category: 'basic',
    configurable: true,
    defaultConfig: { floorColor: 'gray' },
    tooltip: 'Walkable floor. Shift+click to change color.',
    walkable: true
  },
  start: {
    label: 'Entry Point (Start)',
    color: '#44aa44',
    category: 'basic',
    unique: true,
    tooltip: 'Player spawn point. Only one per level.',
    walkable: true
  },
  exit: {
    label: 'Escape Van (Exit)',
    color: '#4488cc',
    category: 'basic',
    unique: true,
    tooltip: 'Level exit. Escape here after completing all missions.',
    walkable: true
  },

  // Doors
  'door-key': {
    label: 'Key Door',
    color: '#8b4513',
    category: 'interactive',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Locked door. Requires matching colored key to open.',
    walkable: false
  },
  'door-card': {
    label: 'Card Door',
    color: '#666688',
    category: 'interactive',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Electronic door. Requires matching colored keycard to open.',
    walkable: false
  },

  // Open doors (created when doors are unlocked)
  'door-key-open': {
    label: 'Open Key Door',
    color: '#5a3a1a',
    walkable: true
  },
  'door-card-open': {
    label: 'Open Card Door',
    color: '#555566',
    walkable: true
  },

  // Item tiles (placeable in builder)
  'item-key': {
    label: 'Key',
    color: '#ffdd00',
    category: 'interactive',
    isItemTile: true,
    itemType: 'key',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Collectible key. Opens matching colored key doors.',
    walkable: true
  },
  'item-card': {
    label: 'Keycard',
    color: '#aaaacc',
    category: 'interactive',
    isItemTile: true,
    itemType: 'card',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Collectible keycard. Opens matching colored card doors.',
    walkable: true
  }
};

// Floor color options
export const FLOOR_COLORS = {
  gray: { label: 'Gray', color: '#4a4a4a' },
  blue: { label: 'Blue', color: '#3a3a5a' },
  red: { label: 'Red', color: '#5a3a3a' },
  green: { label: 'Green', color: '#3a4a3a' },
  yellow: { label: 'Yellow', color: '#4a4a3a' },
  purple: { label: 'Purple', color: '#4a3a4a' },
  marble: { label: 'Marble', color: '#5a5a5a' }
};

export const CONFIG_HELP = {
  floor: {
    floorColor: 'Color of the floor for visual room distinction.'
  },
  'door-key': {
    lockColor: 'Color of the lock. Only a key of the same color can open it.'
  },
  'door-card': {
    lockColor: 'Color of the lock. Only a keycard of the same color can open it.'
  },
  'item-key': {
    lockColor: 'Color of the key. Opens doors with matching color.'
  },
  'item-card': {
    lockColor: 'Color of the keycard. Opens doors with matching color.'
  }
};

// Check if a tile is walkable
export function isWalkable(tileType, gameState = {}) {
  const tile = TILE_TYPES[tileType];
  if (!tile) return false;
  return tile.walkable === true;
}

// Custom rendering for tiles
export function renderTile(ctx, tile, cx, cy, size) {
  // Floor renders with configured color
  if (tile.type === 'floor') {
    const floorColor = tile.config?.floorColor || 'gray';
    const colorData = FLOOR_COLORS[floorColor] || FLOOR_COLORS.gray;

    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size/2, cy - size/2, size, size);
    return true;
  }

  // Wall with brick pattern
  if (tile.type === 'wall') {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;

    const rows = 3;
    for (let i = 1; i < rows; i++) {
      const y = cy - size/2 + (size / rows) * i;
      ctx.beginPath();
      ctx.moveTo(cx - size/2, y);
      ctx.lineTo(cx + size/2, y);
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    const rowHeight = size / rows;
    for (let row = 0; row < rows; row++) {
      const yStart = cy - size/2 + row * rowHeight;
      const offset = row % 2 === 0 ? 0 : size * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - size/2 + offset, yStart);
      ctx.lineTo(cx - size/2 + offset, yStart + rowHeight);
      ctx.stroke();
    }
    return true;
  }

  // Key Door
  if (tile.type === 'door-key') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Door frame
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Door panel
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(cx - size * 0.4, cy - size * 0.45, size * 0.8, size * 0.9);

    // Lock/handle with color
    ctx.fillStyle = colorData.color;
    ctx.beginPath();
    ctx.arc(cx + size * 0.2, cy, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Keyhole
    ctx.fillStyle = '#222';
    ctx.fillRect(cx + size * 0.17, cy - size * 0.03, size * 0.06, size * 0.1);

    return true;
  }

  // Card Door
  if (tile.type === 'door-card') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Metal door frame
    ctx.fillStyle = '#555566';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Door panel
    ctx.fillStyle = '#777788';
    ctx.fillRect(cx - size * 0.4, cy - size * 0.45, size * 0.8, size * 0.9);

    // Card reader with color
    ctx.fillStyle = colorData.dark;
    ctx.fillRect(cx + size * 0.1, cy - size * 0.15, size * 0.25, size * 0.3);

    // LED indicator
    ctx.fillStyle = colorData.color;
    ctx.beginPath();
    ctx.arc(cx + size * 0.22, cy - size * 0.25, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Key item
  if (tile.type === 'item-key') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Key body
    ctx.fillStyle = colorData.color;

    // Key head (circle)
    ctx.beginPath();
    ctx.arc(cx - size * 0.15, cy, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Key hole in head
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx - size * 0.15, cy, size * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Key shaft
    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.05, cy - size * 0.05, size * 0.4, size * 0.1);

    // Key teeth
    ctx.fillRect(cx + size * 0.2, cy, size * 0.08, size * 0.15);
    ctx.fillRect(cx + size * 0.1, cy, size * 0.06, size * 0.1);

    return true;
  }

  // Card item
  if (tile.type === 'item-card') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Card body
    ctx.fillStyle = '#eee';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.4);

    // Colored stripe
    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.12);

    // Chip
    ctx.fillStyle = '#daa520';
    ctx.fillRect(cx - size * 0.2, cy, size * 0.15, size * 0.12);

    return true;
  }

  // Open Key Door
  if (tile.type === 'door-key-open') {
    // Door frame
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Floor visible through open door
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9);

    // Door panel swung open (on right side)
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.35, cy - size * 0.45);
    ctx.lineTo(cx + size * 0.5, cy - size * 0.35);
    ctx.lineTo(cx + size * 0.5, cy + size * 0.35);
    ctx.lineTo(cx + size * 0.35, cy + size * 0.45);
    ctx.closePath();
    ctx.fill();

    // Door edge highlight
    ctx.fillStyle = '#a07040';
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.35, cy - size * 0.45);
    ctx.lineTo(cx + size * 0.38, cy - size * 0.42);
    ctx.lineTo(cx + size * 0.38, cy + size * 0.42);
    ctx.lineTo(cx + size * 0.35, cy + size * 0.45);
    ctx.closePath();
    ctx.fill();

    return true;
  }

  // Open Card Door
  if (tile.type === 'door-card-open') {
    // Metal door frame
    ctx.fillStyle = '#555566';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Floor visible through open door
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9);

    // Door panel slid to the side
    ctx.fillStyle = '#777788';
    ctx.fillRect(cx + size * 0.25, cy - size * 0.45, size * 0.2, size * 0.9);

    // Door panel edge
    ctx.fillStyle = '#999aab';
    ctx.fillRect(cx + size * 0.25, cy - size * 0.45, size * 0.03, size * 0.9);

    // Green LED (unlocked)
    ctx.fillStyle = '#44cc44';
    ctx.beginPath();
    ctx.arc(cx - size * 0.35, cy - size * 0.35, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  return false;
}

// Get emoji for tile rendering
export function getTileEmoji(tileType) {
  const emojiMap = {
    empty: null,
    wall: null,
    floor: null,
    start: '🚪',
    exit: '🚐',
    'door-key': null,
    'door-card': null,
    'item-key': null,
    'item-card': null
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

// === TILE CLASSIFICATIONS ===

// Tiles that items can be dropped on
export const GROUND_TILES = ['floor', 'start', 'exit'];

// Tiles player can interact with (E key)
export const INTERACTABLE_TILES = ['door-key', 'door-card'];

// Tiles to ignore for floor color detection when picking up items
export const IGNORE_TILES = ['wall', 'empty', 'door-key', 'door-card', 'door-key-open', 'door-card-open'];

// Tiles that use lock colors (doors, keys, cards)
export const LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

// Hazard tile types (bank robbery has none)
export const HAZARD_TILE_TYPES = [];

// === MOVEMENT RULES ===

// Helper to check if inventory has item with matching color
function hasMatchingItem(inventory, itemType, lockColor) {
  return inventory?.some(item =>
    item.itemType === itemType && item.lockColor === lockColor
  ) || false;
}

// Check if player can move into a tile
// Returns { allowed, message?, loseLife?, moveRaft?, respawn? }
export function checkMovementInto(tileType, gameState, tileConfig) {
  const inventory = gameState?.inventory || [];

  switch (tileType) {
    case 'door-key': {
      const doorColor = tileConfig?.lockColor || 'red';
      const hasKey = hasMatchingItem(inventory, 'key', doorColor);
      if (hasKey) {
        return {
          allowed: false,
          message: `Face the door and hold E to unlock with ${doorColor} key`
        };
      }
      return {
        allowed: false,
        message: `Locked! Need a ${doorColor} key`
      };
    }

    case 'door-card': {
      const doorColor = tileConfig?.lockColor || 'red';
      const hasCard = hasMatchingItem(inventory, 'card', doorColor);
      if (hasCard) {
        return {
          allowed: false,
          message: `Face the door and hold E to unlock with ${doorColor} keycard`
        };
      }
      return {
        allowed: false,
        message: `Locked! Need a ${doorColor} keycard`
      };
    }

    default:
      // Use default walkability
      return { allowed: isWalkable(tileType, gameState) };
  }
}

// Check if player meets exit requirements (bank robbery has no key requirement)
export function checkExitRequirements(gameState, exitConfig) {
  return { allowed: true };
}

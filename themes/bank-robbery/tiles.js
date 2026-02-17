// Bank Robbery Theme - Tile Definitions
import { getLaserBeamTiles, getCameraVisionTiles } from './hazards.js';

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
    layer: 'floor',
    tooltip: 'Empty void. Not walkable.',
    walkable: false
  },
  wall: {
    label: 'Wall',
    color: '#3a3a3a',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Solid wall. Blocks movement.',
    walkable: false
  },
  floor: {
    label: 'Floor',
    color: '#4a4a4a',
    category: 'basic',
    layer: 'floor',
    configurable: true,
    defaultConfig: { floorColor: 'gray' },
    tooltip: 'Walkable floor. Shift+click to change color.',
    walkable: true
  },
  start: {
    label: 'Entry Point (Start)',
    color: '#44aa44',
    category: 'entry-exit',
    layer: 'floor',
    unique: true,
    tooltip: 'Player spawn point. Only one per level.',
    walkable: true
  },
  exit: {
    label: 'Escape Van (Exit)',
    color: '#4488cc',
    category: 'entry-exit',
    layer: 'floor',
    unique: true,
    tooltip: 'Level exit. Escape here after completing all missions.',
    walkable: true
  },

  // Doors
  'door-key': {
    label: 'Key Door',
    color: '#8b4513',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Locked door. Requires matching colored key to open.',
    walkable: false
  },
  'door-card': {
    label: 'Card Door',
    color: '#666688',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Electronic door. Requires matching colored keycard to open.',
    walkable: false
  },
  'door-guard': {
    label: 'Guard Door',
    color: '#1a3388',
    category: 'interactive',
    layer: 'object',
    tooltip: 'Security door. Requires guard card to open.',
    walkable: false
  },

  // Open doors (created when doors are unlocked)
  'door-key-open': {
    label: 'Open Key Door',
    color: '#5a3a1a',
    layer: 'object',
    walkable: true
  },
  'door-card-open': {
    label: 'Open Card Door',
    color: '#555566',
    layer: 'object',
    walkable: true
  },
  'door-guard-open': {
    label: 'Open Guard Door',
    color: '#0d1a44',
    layer: 'object',
    walkable: true
  },

  // Item tiles (placeable in builder)
  'item-key': {
    label: 'Key',
    color: '#ffdd00',
    category: 'interactive',
    layer: 'object',
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
    layer: 'object',
    isItemTile: true,
    itemType: 'card',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Collectible keycard. Opens matching colored card doors.',
    walkable: true
  },
  'item-guard-card': {
    label: 'Guard Card',
    color: '#3355bb',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'guard-card',
    tooltip: 'Guard security card. Opens guard doors. Obtained by poisoning guards.',
    walkable: true
  },
  'item-uniform': {
    label: 'Guard Uniform',
    color: '#2244aa',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'uniform',
    wearable: true,
    tooltip: 'Guard uniform. Pick up (F) then wear (E while holding) to become invisible to cameras.',
    walkable: true
  },
  'item-mirror': {
    label: 'Mirror',
    color: '#ccddee',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'mirror',
    tooltip: 'Mirror. Pick up (F) and place (Q) to block laser beams.',
    walkable: true,
    canPickupFromAdjacent: true
  },

  // Security - Hazards
  camera: {
    label: 'Security Camera',
    color: '#444466',
    category: 'hazard',
    layer: 'object',
    configurable: true,
    defaultConfig: { direction: 'down', range: 3 },
    tooltip: 'Security camera. Place on walls or map edge. Detects player in vision cone.',
    walkable: false,
    attachToWall: true
  },
  laser: {
    label: 'Laser Tripwire',
    color: '#330000',
    category: 'hazard',
    layer: 'object',
    configurable: true,
    defaultConfig: { direction: 'down' },
    tooltip: 'Laser tripwire. Place on a wall or floor boundary. Fires a beam perpendicular to the wall until it hits another wall.',
    walkable: false,
    attachToWall: true
  },

  // Vault
  'vault-door': {
    label: 'Vault Door',
    color: '#2a2a2a',
    category: 'interactive',
    layer: 'object',
    tooltip: 'Heavy vault door. Requires a drill to open. Hold E while facing with drill in inventory.',
    walkable: false
  },
  'vault-door-open': {
    label: 'Open Vault Door',
    color: '#1a1a1a',
    layer: 'object',
    walkable: true
  },

  // Drill item tile
  'item-drill': {
    label: 'Drill',
    color: '#ffaa00',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'drill',
    tooltip: 'Power drill. Pick up (F) and use to drill through vault doors.',
    walkable: true
  },

  // Bomb item tile (placed on ground)
  'item-bomb': {
    label: 'Bomb',
    color: '#cc2222',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'bomb',
    tooltip: 'Explosive bomb. Pick up (F) and place near vault doors. Use detonator to explode.',
    walkable: true
  },

  // Detonator item tile
  'item-detonator': {
    label: 'Detonator',
    color: '#ffcc00',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'detonator',
    configurable: true,
    defaultConfig: { minSafeDistance: 2, maxRange: 6 },
    tooltip: 'Remote detonator. Pick up (F) and use (E) to detonate placed bombs. Stay at safe distance!',
    walkable: true
  },

  // Bag item tile
  'item-bag': {
    label: 'Duffel Bag',
    color: '#4a3a2a',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'bag',
    configurable: true,
    defaultConfig: { capacity: 100000 },
    tooltip: 'Duffel bag for carrying loot. Pick up (F) to auto-equip and collect money.',
    walkable: true
  },

  // Money item tile
  'item-money': {
    label: 'Cash',
    color: '#55aa55',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'money',
    configurable: true,
    defaultConfig: { amount: 50000 },
    tooltip: 'Cold hard cash! Requires equipped bag to collect. Hold E to grab.',
    walkable: true,
    pickable: false // Can't pick up with F - must collect with E into bag
  },

  // Poison bottle item tile
  'item-poison': {
    label: 'Poison Bottle',
    color: '#884499',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'poison',
    tooltip: 'Knocks out guards. Press F to pick up, then E on a guard to use.',
    walkable: true
  },

  // Walking Guard
  guard: {
    label: 'Guard',
    color: '#2244aa',
    category: 'hazard',
    layer: 'object',
    configurable: true,
    defaultConfig: { direction: 'right', visionRange: 4 },
    tooltip: 'Walking guard. Patrols back and forth. Configurable vision range.',
    walkable: false,
    isMovingEntity: true // Mark as moving entity for engine
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

// Camera and Guard direction options
export const CAMERA_DIRECTIONS = {
  up: { label: 'Up', dx: 0, dy: -1 },
  down: { label: 'Down', dx: 0, dy: 1 },
  left: { label: 'Left', dx: -1, dy: 0 },
  right: { label: 'Right', dx: 1, dy: 0 }
};

export const GUARD_DIRECTIONS = {
  up: { label: 'Up', dx: 0, dy: -1 },
  down: { label: 'Down', dx: 0, dy: 1 },
  left: { label: 'Left', dx: -1, dy: 0 },
  right: { label: 'Right', dx: 1, dy: 0 }
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
  },
  camera: {
    direction: 'Direction the camera faces (up, down, left, right).',
    range: 'How many tiles ahead the camera can see (1-5).'
  },
  laser: {
    direction: 'Direction the laser beam fires (perpendicular to the wall it is on).'
  },
  'item-detonator': {
    minSafeDistance: 'Minimum distance from bomb to survive explosion (tiles).',
    maxRange: 'Maximum distance from which detonator can trigger bomb (tiles).'
  },
  'item-bag': {
    capacity: 'Maximum amount of money the bag can hold.'
  },
  'item-money': {
    amount: 'Amount of cash in this stack.'
  },
  guard: {
    direction: 'Initial direction the guard walks.',
    visionRange: 'How many tiles the guard can see (default: 4).'
  }
};

// Generic config schema - defines what config fields each tile type has
export const CONFIG_SCHEMA = {
  floor: {
    floorColor: {
      type: 'select',
      label: 'Floor Color',
      options: 'FLOOR_COLORS',
      default: 'gray'
    }
  },
  'door-key': {
    lockColor: {
      type: 'select',
      label: 'Lock Color',
      options: 'LOCK_COLORS',
      default: 'red'
    },
    activationRequirements: {
      type: 'activation',
      label: 'Item Activation',
      default: {
        enabled: false,
        orderMatters: false,
        requirements: []
      }
    }
  },
  'door-card': {
    lockColor: {
      type: 'select',
      label: 'Lock Color',
      options: 'LOCK_COLORS',
      default: 'red'
    },
    activationRequirements: {
      type: 'activation',
      label: 'Item Activation',
      default: {
        enabled: false,
        orderMatters: false,
        requirements: []
      }
    }
  },
  'item-key': {
    lockColor: {
      type: 'select',
      label: 'Lock Color',
      options: 'LOCK_COLORS',
      default: 'red'
    }
  },
  'item-card': {
    lockColor: {
      type: 'select',
      label: 'Lock Color',
      options: 'LOCK_COLORS',
      default: 'red'
    }
  },
  camera: {
    direction: {
      type: 'select',
      label: 'Direction',
      options: 'CAMERA_DIRECTIONS',
      default: 'down'
    },
    range: {
      type: 'number',
      label: 'Vision Range',
      min: 1,
      max: 5,
      default: 3
    }
  },
  laser: {
    direction: {
      type: 'select',
      label: 'Direction',
      options: 'CAMERA_DIRECTIONS',
      default: 'down'
    }
  },
  'item-detonator': {
    minSafeDistance: {
      type: 'number',
      label: 'Min Safe Distance',
      min: 1,
      max: 10,
      default: 2
    },
    maxRange: {
      type: 'number',
      label: 'Max Range',
      min: 2,
      max: 15,
      default: 6
    }
  },
  'item-bag': {
    capacity: {
      type: 'number',
      label: 'Capacity',
      min: 10000,
      max: 5000000,
      default: 100000
    }
  },
  'item-money': {
    amount: {
      type: 'number',
      label: 'Amount ($)',
      min: 100,
      max: 5000000,
      default: 50000
    }
  },
  guard: {
    direction: {
      type: 'select',
      label: 'Direction',
      options: 'GUARD_DIRECTIONS',
      default: 'right'
    },
    visionRange: {
      type: 'number',
      label: 'Vision Range',
      min: 1,
      max: 5,
      default: 4
    }
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
  // Guard against undefined tile
  if (!tile) return false;

  // Floor renders with configured color
  if (tile.type === 'floor') {
    const floorColor = tile.config?.floorColor || 'gray';

    // Check if floorColor is a hex color (starts with #) or a color name key
    let actualColor;
    if (typeof floorColor === 'string' && floorColor.startsWith('#')) {
      // Direct hex color from random generator
      actualColor = floorColor;
    } else {
      // Color name key that maps to FLOOR_COLORS
      const colorData = FLOOR_COLORS[floorColor] || FLOOR_COLORS.gray;
      actualColor = colorData.color;
    }

    ctx.fillStyle = actualColor;
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

  // Guard Door
  if (tile.type === 'door-guard') {
    // Heavy security door frame (dark blue)
    ctx.fillStyle = '#0d1a44';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Door panel (blue-gray metal)
    ctx.fillStyle = '#1a3388';
    ctx.fillRect(cx - size * 0.4, cy - size * 0.45, size * 0.8, size * 0.9);

    // Guard badge symbol (shield shape)
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.15);
    ctx.lineTo(cx - size * 0.12, cy - size * 0.05);
    ctx.lineTo(cx - size * 0.12, cy + size * 0.1);
    ctx.lineTo(cx, cy + size * 0.2);
    ctx.lineTo(cx + size * 0.12, cy + size * 0.1);
    ctx.lineTo(cx + size * 0.12, cy - size * 0.05);
    ctx.closePath();
    ctx.fill();

    // Badge outline
    ctx.strokeStyle = '#cc9900';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Card reader slot (right side)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(cx + size * 0.15, cy - size * 0.08, size * 0.15, size * 0.16);

    // Blue LED (locked)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(cx + size * 0.22, cy - size * 0.2, size * 0.04, 0, Math.PI * 2);
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

  // Guard Card item
  if (tile.type === 'item-guard-card') {
    // Card body (blue security card)
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.4);

    // Darker blue stripe
    ctx.fillStyle = '#1a3388';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.12);

    // Gold chip
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(cx - size * 0.2, cy, size * 0.15, size * 0.12);

    // Badge symbol (small shield)
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.15, cy - size * 0.05);
    ctx.lineTo(cx + size * 0.08, cy);
    ctx.lineTo(cx + size * 0.08, cy + size * 0.08);
    ctx.lineTo(cx + size * 0.15, cy + size * 0.12);
    ctx.lineTo(cx + size * 0.22, cy + size * 0.08);
    ctx.lineTo(cx + size * 0.22, cy);
    ctx.closePath();
    ctx.fill();

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

  // Open Guard Door
  if (tile.type === 'door-guard-open') {
    // Dark blue security door frame
    ctx.fillStyle = '#0d1a44';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Floor visible through open door
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9);

    // Door panel slid to the side (blue metal)
    ctx.fillStyle = '#1a3388';
    ctx.fillRect(cx + size * 0.25, cy - size * 0.45, size * 0.2, size * 0.9);

    // Door panel edge
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(cx + size * 0.25, cy - size * 0.45, size * 0.03, size * 0.9);

    // Green LED (unlocked)
    ctx.fillStyle = '#44cc44';
    ctx.beginPath();
    ctx.arc(cx - size * 0.35, cy - size * 0.35, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Laser Tripwire emitter
  if (tile.type === 'laser') {
    const direction = tile.config?.direction || 'down';

    // Dark wall background
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Emitter housing (small dark box)
    ctx.fillStyle = '#222222';
    ctx.fillRect(cx - size * 0.18, cy - size * 0.18, size * 0.36, size * 0.36);

    // Emitter ring
    ctx.strokeStyle = '#553333';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - size * 0.18, cy - size * 0.18, size * 0.36, size * 0.36);

    // Glow around lens
    ctx.fillStyle = 'rgba(255, 30, 30, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
    ctx.fill();

    // Red lens dot in center (on top of glow)
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Short beam stub shooting out from the emitter in the configured direction
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = dirs[direction] || [0, 1];
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * size * 0.5, cy + dy * size * 0.5);
    ctx.stroke();

    return true;
  }

  // Vault Door
  if (tile.type === 'vault-door') {
    // Heavy steel vault door
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Steel plate texture
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(cx - size * 0.45, cy - size * 0.45, size * 0.9, size * 0.9);

    // Circular vault mechanism
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.32, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes on the wheel
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * size * 0.12, cy + Math.sin(angle) * size * 0.12);
      ctx.lineTo(cx + Math.cos(angle) * size * 0.28, cy + Math.sin(angle) * size * 0.28);
      ctx.stroke();
    }

    // Center bolt
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Corner bolts
    const boltPositions = [
      { x: -0.38, y: -0.38 }, { x: 0.38, y: -0.38 },
      { x: -0.38, y: 0.38 }, { x: 0.38, y: 0.38 }
    ];
    ctx.fillStyle = '#4a4a4a';
    for (const pos of boltPositions) {
      ctx.beginPath();
      ctx.arc(cx + pos.x * size, cy + pos.y * size, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    return true;
  }

  // Open Vault Door
  if (tile.type === 'vault-door-open') {
    // Show the floor color underneath instead of hardcoded black
    // Floor color is already drawn, so we don't need to fill the background again
    // Just draw the door frame and open door

    // Steel frame
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(cx - size/2, cy - size/2, size * 0.15, size);
    ctx.fillRect(cx + size * 0.35, cy - size/2, size * 0.15, size);
    ctx.fillRect(cx - size/2, cy - size/2, size, size * 0.1);
    ctx.fillRect(cx - size/2, cy + size * 0.4, size, size * 0.1);

    // Door swung open on right side
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.35, cy - size * 0.4);
    ctx.lineTo(cx + size * 0.5, cy - size * 0.3);
    ctx.lineTo(cx + size * 0.5, cy + size * 0.3);
    ctx.lineTo(cx + size * 0.35, cy + size * 0.4);
    ctx.closePath();
    ctx.fill();

    // Partial vault wheel visible on open door
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(cx + size * 0.42, cy, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Drill item tile
  if (tile.type === 'item-drill') {
    // Draw drill on the ground
    const drillX = cx;
    const drillY = cy;

    // Drill body (main housing)
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(drillX - size * 0.25, drillY - size * 0.12, size * 0.4, size * 0.24);

    // Drill chuck (front part)
    ctx.fillStyle = '#666';
    ctx.fillRect(drillX + size * 0.15, drillY - size * 0.08, size * 0.12, size * 0.16);

    // Drill bit
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(drillX + size * 0.27, drillY - size * 0.04);
    ctx.lineTo(drillX + size * 0.4, drillY);
    ctx.lineTo(drillX + size * 0.27, drillY + size * 0.04);
    ctx.closePath();
    ctx.fill();

    // Handle
    ctx.fillStyle = '#333';
    ctx.fillRect(drillX - size * 0.25, drillY + size * 0.08, size * 0.2, size * 0.15);

    // Trigger
    ctx.fillStyle = '#222';
    ctx.fillRect(drillX - size * 0.1, drillY + size * 0.02, size * 0.08, size * 0.1);

    return true;
  }

  // Bomb item tile
  if (tile.type === 'item-bomb') {
    // Bomb body (cylinder shape)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.1, size * 0.22, size * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red stripes
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(cx - size * 0.18, cy - size * 0.05, size * 0.36, size * 0.08);
    ctx.fillRect(cx - size * 0.18, cy + size * 0.12, size * 0.36, size * 0.08);

    // Fuse/wire on top
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.18);
    ctx.quadraticCurveTo(cx + size * 0.15, cy - size * 0.3, cx + size * 0.1, cy - size * 0.38);
    ctx.stroke();

    // Blinking light
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.18, size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Light glow
    ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.18, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Detonator item tile
  if (tile.type === 'item-detonator') {
    // Detonator box body
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - size * 0.2, cy - size * 0.15, size * 0.4, size * 0.35);

    // Yellow warning stripes
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(cx - size * 0.2, cy - size * 0.15, size * 0.4, size * 0.06);
    ctx.fillRect(cx - size * 0.2, cy + size * 0.14, size * 0.4, size * 0.06);

    // Red button on top
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.02, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Button highlight
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx - size * 0.03, cy - size * 0.01, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Antenna
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.12, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.12, cy - size * 0.35);
    ctx.stroke();

    // Antenna tip
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(cx + size * 0.12, cy - size * 0.35, size * 0.03, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Bag item tile
  if (tile.type === 'item-bag') {
    // Main bag body (duffel bag shape)
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.05, size * 0.38, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Darker bottom shadow
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.15, size * 0.35, size * 0.18, 0, 0, Math.PI);
    ctx.fill();

    // Zipper line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.32, cy - size * 0.02);
    ctx.lineTo(cx + size * 0.32, cy - size * 0.02);
    ctx.stroke();

    // Zipper pull
    ctx.fillStyle = '#888';
    ctx.fillRect(cx + size * 0.18, cy - size * 0.1, size * 0.1, size * 0.16);

    // Handles
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx - size * 0.18, cy - size * 0.15, size * 0.12, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + size * 0.18, cy - size * 0.15, size * 0.12, Math.PI, 0);
    ctx.stroke();

    return true;
  }

  // Money item tile - simple design with prominent amount
  if (tile.type === 'item-money') {
    const amount = tile.config?.amount || 50000;

    // Format amount with K/M suffix
    let amountText;
    if (amount >= 1000000) {
      amountText = `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
    } else if (amount >= 1000) {
      amountText = `${Math.floor(amount / 1000)}K`;
    } else {
      amountText = `${amount}`;
    }

    // Green background circle
    ctx.fillStyle = '#3a6a3a';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.08, size * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Dollar sign - large and centered
    ctx.fillStyle = '#88dd88';
    ctx.font = `bold ${size * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy - size * 0.08);

    // Amount label at bottom with background
    ctx.font = `bold ${size * 0.28}px sans-serif`;
    const textY = cy + size * 0.38;
    const textWidth = ctx.measureText(amountText).width;

    // Dark background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(cx - textWidth / 2 - 4, textY - size * 0.14, textWidth + 8, size * 0.28, 4);
    ctx.fill();

    // Amount text in bright green
    ctx.fillStyle = '#66ff66';
    ctx.fillText(amountText, cx, textY);

    return true;
  }

  // Poison bottle item tile
  if (tile.type === 'item-poison') {
    // Bottle body (glass - purple tint)
    ctx.fillStyle = '#aa88cc';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.05, size * 0.15, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bottle neck
    ctx.fillStyle = '#9977bb';
    ctx.fillRect(cx - size * 0.08, cy - size * 0.2, size * 0.16, size * 0.15);

    // Cork/cap
    ctx.fillStyle = '#553333';
    ctx.fillRect(cx - size * 0.09, cy - size * 0.25, size * 0.18, size * 0.05);

    // Skull symbol on bottle (danger)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.05, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Skull eye sockets
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - size * 0.04, cy + size * 0.02, size * 0.02, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.04, cy + size * 0.02, size * 0.02, 0, Math.PI * 2);
    ctx.fill();

    // Skull nose
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.06);
    ctx.lineTo(cx - size * 0.02, cy + size * 0.1);
    ctx.lineTo(cx + size * 0.02, cy + size * 0.1);
    ctx.closePath();
    ctx.fill();

    return true;
  }

  // Guard
  if (tile.type === 'guard') {
    const direction = tile.config?.direction || 'right';
    const isAsleep = tile.config?.asleep || false;

    // Guard body (blue uniform, darker if asleep)
    ctx.fillStyle = isAsleep ? '#1a3388' : '#2244aa';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.15, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Guard head
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.15, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Cap
    ctx.fillStyle = isAsleep ? '#0d1a44' : '#1a3388';
    ctx.beginPath();
    ctx.ellipse(cx, cy - size * 0.22, size * 0.16, size * 0.08, 0, 0, Math.PI);
    ctx.fill();

    // Badge
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(cx - size * 0.08, cy + size * 0.05, size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    if (isAsleep) {
      // Draw "Zzz" to indicate sleeping
      ctx.fillStyle = '#ffffff';
      ctx.font = `${size * 0.3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💤', cx + size * 0.25, cy - size * 0.25);
    } else {
      // Direction indicator (facing arrow) - only if awake
      ctx.save();
      ctx.translate(cx, cy);

      const rotations = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 };
      ctx.rotate(rotations[direction] || 0);

      // Arrow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(size * 0.3, 0);
      ctx.lineTo(size * 0.15, -size * 0.08);
      ctx.lineTo(size * 0.15, size * 0.08);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    return true;
  }

  // Security Camera
  if (tile.type === 'camera') {
    const direction = tile.config?.direction || 'down';

    // Wall/mount background
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Mounting bracket
    ctx.fillStyle = '#555566';
    ctx.fillRect(cx - size * 0.15, cy - size * 0.35, size * 0.3, size * 0.2);

    // Camera body - rotate based on direction
    ctx.save();
    ctx.translate(cx, cy);

    // Rotate based on direction
    const rotations = { up: Math.PI, down: 0, left: Math.PI / 2, right: -Math.PI / 2 };
    ctx.rotate(rotations[direction] || 0);

    // Camera housing (dark gray box)
    ctx.fillStyle = '#333344';
    ctx.fillRect(-size * 0.2, -size * 0.1, size * 0.4, size * 0.35);

    // Camera lens
    ctx.fillStyle = '#111122';
    ctx.beginPath();
    ctx.arc(0, size * 0.2, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Lens reflection
    ctx.fillStyle = '#4488cc';
    ctx.beginPath();
    ctx.arc(-size * 0.03, size * 0.17, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Red recording light
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(size * 0.12, -size * 0.02, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

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
    'door-guard': null,
    'item-key': null,
    'item-card': null,
    'item-guard-card': null, // Custom rendered
    'item-uniform': null, // Custom rendered
    'item-mirror': null, // Custom rendered
    camera: null, // Custom rendered
    laser: null // Custom rendered
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

// === TILE CLASSIFICATIONS ===

// Tiles that items can be dropped on
export const GROUND_TILES = ['floor', 'start', 'exit'];

// Tiles player can interact with (E key)
export const INTERACTABLE_TILES = ['door-key', 'door-card', 'door-guard', 'vault-door', 'floor', 'start', 'exit'];

// Tiles to ignore for floor color detection when picking up items
export const IGNORE_TILES = ['wall', 'empty', 'door-key', 'door-card', 'door-guard', 'door-key-open', 'door-card-open', 'door-guard-open', 'camera', 'laser'];

// Tiles that use lock colors (doors, keys, cards)
export const LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

// Hazard tile types
export const HAZARD_TILE_TYPES = ['camera', 'laser', 'guard'];

// === MOVEMENT RULES ===

// Helper to check if inventory has item with matching color
function hasMatchingItem(inventory, itemType, lockColor) {
  return inventory?.some(item =>
    item.itemType === itemType && item.lockColor === lockColor
  ) || false;
}

// Check if player can move into a tile
// Returns { allowed, message?, loseLife?, moveRaft?, respawn? }
export function checkMovementInto(tileType, gameState, tileConfig, grid, x, y) {
  const inventory = gameState?.inventory || [];

  // Check if player is trying to move into a laser beam
  if (grid && x !== undefined && y !== undefined) {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        const cell = grid[row][col];
        if (cell.object?.type === 'laser') {
          const direction = cell.object.config?.direction || 'down';
          const beamTiles = getLaserBeamTiles(grid, col, row, direction);
          // Check if target position is in the laser beam
          if (beamTiles.some(tile => tile.x === x && tile.y === y)) {
            return {
              allowed: false,
              loseLife: true,
              messageKey: 'laserBlocking'
            };
          }
        }
      }
    }
  }

  // Check if player is trying to move into a camera vision cone
  if (grid && x !== undefined && y !== undefined) {
    const cameraImmune = gameState?.worn?.body === 'uniform';
    if (!cameraImmune) {
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
          const cell = grid[row][col];
          if (cell.object?.type === 'camera') {
            const direction = cell.object.config?.direction || 'down';
            const range = cell.object.config?.range || 3;
            const visionTiles = getCameraVisionTiles(grid, col, row, direction, range);
            if (visionTiles.some(tile => tile.x === x && tile.y === y)) {
              return {
                allowed: false,
                loseLife: true,
                messageKey: 'cameraBlocking'
              };
            }
          }
        }
      }
    }
  }

  switch (tileType) {
    case 'door-key': {
      const doorColor = tileConfig?.lockColor || 'red';
      const hasKey = hasMatchingItem(inventory, 'key', doorColor);
      if (hasKey) {
        return {
          allowed: false,
          messageKey: 'doorUnlockHint',
          messageParams: { color: doorColor }
        };
      }
      return {
        allowed: false,
        messageKey: 'doorLocked',
        messageParams: { color: doorColor }
      };
    }

    case 'door-card': {
      const doorColor = tileConfig?.lockColor || 'red';
      const hasCard = hasMatchingItem(inventory, 'card', doorColor);
      if (hasCard) {
        return {
          allowed: false,
          messageKey: 'cardDoorUnlockHint',
          messageParams: { color: doorColor }
        };
      }
      return {
        allowed: false,
        messageKey: 'cardDoorLocked',
        messageParams: { color: doorColor }
      };
    }

    case 'door-guard': {
      const hasGuardCard = inventory?.some(item => item.itemType === 'guard-card');
      if (hasGuardCard) {
        return {
          allowed: false,
          messageKey: 'guardDoorUnlockHint'
        };
      }
      return {
        allowed: false,
        messageKey: 'guardDoorLocked'
      };
    }

    case 'vault-door': {
      const hasDrill = inventory?.some(item => item.itemType === 'drill');
      if (hasDrill) {
        return {
          allowed: false,
          messageKey: 'vaultDrillHint'
        };
      }
      return {
        allowed: false,
        messageKey: 'vaultNeedDrill'
      };
    }

    case 'guard': {
      // Allow walking on sleeping guards, block on awake guards
      if (tileConfig?.asleep) {
        return { allowed: true };
      }
      return {
        allowed: false,
        messageKey: 'guardBlocking'
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

// === ENTITY MOVEMENT ===

/**
 * Move all entities (guards) on the grid
 * Called every tick by the engine
 */
export function moveEntities(grid, gameState) {
  const GRID_ROWS = grid.length;
  const GRID_COLS = grid[0]?.length || 0;

  // Clone grid with two-layer structure
  const newGrid = grid.map(row => row.map(cell => ({
    floor: {
      type: cell.floor.type,
      config: { ...cell.floor.config }
    },
    object: cell.object ? {
      type: cell.object.type,
      config: { ...cell.object.config }
    } : null
  })));

  let anyMoved = false;

  // First, find all guards and their positions (to avoid moving same guard twice)
  const guards = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (newGrid[y][x].object?.type === 'guard') {
        guards.push({ x, y, guardObj: newGrid[y][x].object });
      }
    }
  }

  // Now move each guard
  for (const guard of guards) {
    const { x, y, guardObj } = guard;

    // Skip asleep or poisoning guards - they don't move
    if (guardObj.config?.asleep || guardObj.config?.poisoning) {
      continue;
    }

    const direction = guardObj.config?.direction || 'right';
    const dirData = GUARD_DIRECTIONS[direction];

    if (!dirData) continue;

    const { dx, dy } = dirData;
    const nextX = x + dx;
    const nextY = y + dy;

    // Check if next position is valid and walkable
    // Check the destination cell's floor type for walkability
    const destCell = (nextX >= 0 && nextX < GRID_COLS && nextY >= 0 && nextY < GRID_ROWS)
      ? newGrid[nextY][nextX]
      : null;

    // Check if object is blocking (items don't block, only doors and other guards)
    const isObjectBlocking = destCell?.object && !destCell.object.type.startsWith('item-');

    const canMove = destCell &&
      !isObjectBlocking && // No blocking object (items don't block)
      isWalkable(destCell.floor.type, gameState); // Floor is walkable

    if (canMove) {
      // Move guard to new position
      const movedGuard = {
        type: 'guard',
        config: { ...guardObj.config }
      };

      // Store the floor config of the destination tile
      movedGuard.config.underlyingFloor = {
        type: destCell.floor.type,
        config: { ...destCell.floor.config }
      };

      // Store any item that was on the destination tile (guard will step over it)
      if (destCell.object?.type?.startsWith('item-')) {
        movedGuard.config.underlyingObject = {
          type: destCell.object.type,
          config: { ...destCell.object.config }
        };
      } else {
        movedGuard.config.underlyingObject = null;
      }

      // Restore the floor at old position (use stored underlying floor)
      const oldFloor = guardObj.config?.underlyingFloor || { type: 'floor', config: {} };
      newGrid[y][x].floor = { type: oldFloor.type, config: { ...oldFloor.config } };

      // Restore any item that was under the guard
      if (guardObj.config?.underlyingObject) {
        newGrid[y][x].object = {
          type: guardObj.config.underlyingObject.type,
          config: { ...guardObj.config.underlyingObject.config }
        };
      } else {
        newGrid[y][x].object = null;
      }

      // Move guard to new position (object layer)
      newGrid[nextY][nextX].object = movedGuard;

      anyMoved = true;
    } else {
      // Hit wall or boundary - reverse direction
      const reverseDirections = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
      };

      const newDir = reverseDirections[direction] || 'right';
      newGrid[y][x].object.config.direction = newDir;
      anyMoved = true;
    }
  }

  return anyMoved ? newGrid : null;
}

// === PLAYER RENDERING ===

/**
 * Render the player with visual indication of worn items
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Tile size
 * @param {string} direction - Player direction ('up', 'down', 'left', 'right')
 * @param {Object} gameState - Current game state with worn items
 */
export function renderPlayer(ctx, x, y, size, direction, gameState = {}) {
  const worn = gameState.worn || {};

  // Check if wearing guard uniform
  const wearingUniform = worn.body === 'uniform';

  if (wearingUniform) {
    // Render player as guard (blue uniform)

    // Guard body (blue uniform)
    ctx.fillStyle = '#2244aa';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.15, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Guard head
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.15, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Cap
    ctx.fillStyle = '#1a3388';
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.22, size * 0.16, size * 0.08, 0, 0, Math.PI);
    ctx.fill();

    // Badge
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(x - size * 0.08, y + size * 0.05, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Render default player (civilian)
    ctx.fillStyle = '#ffffff';
    ctx.font = `${size * 0.65}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧑', x, y);
  }

  return true; // Return true to indicate custom rendering was done
}

// === TWO-LAYER SYSTEM HELPERS ===

/**
 * Get the layer a tile type belongs to
 * @param {string} tileType - The tile type
 * @returns {'floor'|'object'} - The layer
 */
export function getTileLayer(tileType) {
  const tile = TILE_TYPES[tileType];
  return tile?.layer || 'floor'; // Default to floor for safety
}

/**
 * Check if a tile type is a floor tile
 */
export function isFloorTile(tileType) {
  return getTileLayer(tileType) === 'floor';
}

/**
 * Check if a tile type is an object tile
 */
export function isObjectTile(tileType) {
  return getTileLayer(tileType) === 'object';
}

/**
 * Get default floor for this theme
 */
export function getDefaultFloor() {
  return { type: 'floor', config: { floorColor: 'gray' } };
}

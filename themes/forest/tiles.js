// Forest theme tile definitions
export const TILE_TYPES = {
  empty: {
    label: 'Empty',
    color: '#0a0a0a',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Empty void. Not walkable.',
    walkable: false
  },
  ground: {
    label: 'Ground',
    color: '#3d5a28',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Walkable forest ground.',
    walkable: true
  },
  tree: {
    label: 'Tree',
    color: '#2d4a1a',
    category: 'basic',
    layer: 'floor',
    configurable: false,
    defaultConfig: {},
    tooltip: 'Blocks movement. Cut with axe (hold E) to get wood.',
    walkable: false
  },
  water: {
    label: 'Water',
    color: '#2266aa',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Blocks movement. Build a raft (hold E with Rope + Wood), then face water and press Q to place it.',
    walkable: false
  },
  snow: {
    label: 'Snow',
    color: '#ddeeff',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Blocks movement unless wearing a Sweater (press T). Can place items here.',
    walkable: true  // Base walkable so objects can be placed in builder; conditional in gameplay
  },
  raft: {
    label: 'Raft',
    color: '#6699aa',
    category: null,
    layer: 'object',
    tooltip: 'Walkable water. Face it and press F to pick up, Q to place on water.',
    walkable: true
  },
  campfire: {
    label: 'Campfire (Start)',
    color: '#cc6600',
    category: 'basic',
    layer: 'floor',
    unique: true,
    tooltip: 'Player spawn point. Only one per level.',
    walkable: true
  },
  car: {
    label: 'Car (Exit)',
    color: '#4488cc',
    category: 'basic',
    layer: 'floor',
    unique: true,
    configurable: true,
    defaultConfig: { needsKey: true },
    tooltip: 'Level exit. Reach here after completing all missions.',
    walkable: true
  },

  // Individual item tiles
  'item-key': {
    label: 'Key',
    color: '#ffdd00',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'key',
    tooltip: 'Collectible key. Press F to pick up.',
    walkable: true
  },
  'item-axe': {
    label: 'Axe',
    color: '#aa6633',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'axe',
    tooltip: 'Collectible axe. Press F to pick up. Use to cut trees.',
    walkable: true
  },
  'item-bucket': {
    label: 'Bucket',
    color: '#5588bb',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'bucket',
    tooltip: 'Collectible bucket. Press F to pick up. Fill at water, use on fire.',
    walkable: true
  },
  'item-rope': {
    label: 'Rope',
    color: '#aa8855',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'rope',
    tooltip: 'Collectible rope. Press F to pick up. Combine with wood to build raft.',
    walkable: true
  },
  'item-knife': {
    label: 'Knife',
    color: '#cccccc',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'knife',
    tooltip: 'Collectible knife. Press F to pick up. Defeat bears.',
    walkable: true
  },
  'item-sweater': {
    label: 'Sweater',
    color: '#cc4466',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'sweater',
    tooltip: 'Collectible sweater. Press F to pick up, T to wear. Walk through snow when worn.',
    walkable: true
  },
  'item-wood': {
    label: 'Wood',
    color: '#8b6914',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'wood',
    tooltip: 'Collectible wood. Press F to pick up. Combine with rope to build raft.',
    walkable: true
  },
  'item-raft': {
    label: 'Raft',
    color: '#8b6914',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'raft',
    tooltip: 'Collectible raft. Press F to pick up. Face water and press Q to place.',
    walkable: true
  },

  friend: {
    label: 'Lost Friend',
    color: '#ff88cc',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: { name: 'Friend' },
    tooltip: 'Lost friend. Hold E to rescue.',
    walkable: true
  },
  fire: {
    label: 'Fire',
    color: '#ff4400',
    category: 'hazard',
    layer: 'object',
    tooltip: 'Damaging hazard. Stepping on it costs a life. Extinguish with filled Bucket (hold E nearby).',
    walkable: true  // Walkable but causes damage
  },
  bear: {
    label: 'Bear',
    color: '#8b4513',
    category: 'hazard',
    layer: 'object',
    tooltip: 'Without Knife: lose a life, pushed back. With Knife: bear defeated, get Sweater.',
    walkable: false  // Special: walkable with knife
  },
};

export const CONFIG_HELP = {
  car: {
    needsKey: 'If checked, player needs a Key in inventory to escape.',
  },
  friend: {
    name: 'Name for this friend. Shown in messages and missions.',
  },
};

// Generic config schema - defines what config fields each tile type has
export const CONFIG_SCHEMA = {
  car: {
    needsKey: {
      type: 'checkbox',
      label: 'Requires Key',
      default: true
    }
  },
  friend: {
    name: {
      type: 'text',
      label: 'Friend Name',
      placeholder: 'e.g. Alice',
      default: ''
    }
  }
};

// Check if a tile is walkable, considering game state
export function isWalkable(tileType, gameState = {}) {
  const tile = TILE_TYPES[tileType];
  if (!tile) return false;

  // Special cases that override base walkability
  if (tileType === 'snow') {
    // Snow requires sweater to be WORN (not just in inventory)
    const isWearingSweater = gameState.worn?.body === 'sweater';
    return isWearingSweater || false;
  }

  if (tileType === 'bear') {
    // Bear is walkable (defeated) if player has knife
    return gameState.inventory?.some(item => item.itemType === 'knife') || false;
  }

  // Basic walkability (applies to most tiles)
  if (tile.walkable) {
    return true;
  }

  return false;
}

// Draw a raft (wooden planks on water)
function drawRaft(ctx, cx, cy, size) {
  const s = size * 0.35;

  // Water background (lighter blue to show it's on water)
  ctx.fillStyle = '#3377bb';
  ctx.fillRect(cx - size/2, cy - size/2, size, size);

  // Wooden planks (horizontal)
  const plankCount = 4;
  const plankHeight = s * 0.35;
  const spacing = s * 0.15;
  const startY = cy - (plankCount * plankHeight + (plankCount - 1) * spacing) / 2;

  for (let i = 0; i < plankCount; i++) {
    const y = startY + i * (plankHeight + spacing);

    // Main plank color
    ctx.fillStyle = i % 2 === 0 ? '#8b6914' : '#7b5910';
    ctx.fillRect(cx - s * 1.2, y, s * 2.4, plankHeight);

    // Wood grain/texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(cx - s * 1.2, y, s * 0.1, plankHeight);
    ctx.fillRect(cx - s * 0.4, y, s * 0.08, plankHeight);
    ctx.fillRect(cx + s * 0.5, y, s * 0.08, plankHeight);
  }

  // Rope bindings (vertical)
  ctx.strokeStyle = '#6b5830';
  ctx.lineWidth = 2;

  // Left rope
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.7, cy - s * 0.9);
  ctx.lineTo(cx - s * 0.7, cy + s * 0.9);
  ctx.stroke();

  // Right rope
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.7, cy - s * 0.9);
  ctx.lineTo(cx + s * 0.7, cy + s * 0.9);
  ctx.stroke();
}

// Custom rendering for tiles (optional - most use emoji/color)
export function renderTile(ctx, tile, cx, cy, size) {
  // Guard against undefined tile
  if (!tile) return false;

  // Raft gets custom rendering
  if (tile.type === 'raft') {
    drawRaft(ctx, cx, cy, size);
    return true;
  }

  // All other tiles use emoji or color
  return false;
}

// Get emoji for tile rendering
export function getTileEmoji(tileType) {
  const emojiMap = {
    ground: null,  // No emoji for ground (just color)
    tree: '🌲',
    water: '🌊',
    snow: '❄️',
    raft: '🪵',
    campfire: '🏕️',
    car: '🚗',
    'item-key': '🔑',
    'item-axe': '🪓',
    'item-bucket': null,  // Custom draw
    'item-rope': '🧵',
    'item-knife': '🔪',
    'item-sweater': '🧥',
    'item-wood': null,  // Custom draw
    friend: '👤',
    fire: '🔥',
    bear: '🐻',
    empty: null,  // No emoji for empty (just color)
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

// === TILE CLASSIFICATIONS ===

// Tiles that items can be dropped on (raft excluded - can't drop items while on water)
// Snow excluded - it's a floor but you can't drop items on it (too cold!)
export const GROUND_TILES = ['ground', 'campfire', 'floor', 'start'];

// Tiles player can interact with (E key)
export const INTERACTABLE_TILES = ['tree', 'water', 'raft', 'fire', 'friend', 'bear', 'door-key', 'door-card'];

// Tiles to ignore for floor color detection when picking up items
export const IGNORE_TILES = ['wall', 'empty', 'door-key', 'door-card', 'door-key-open', 'door-card-open', 'tree', 'water', 'snow', 'bear'];

// Tiles that use lock colors (doors, keys, cards)
export const LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

// Hazard tile types (for extinguish mission)
export const HAZARD_TILE_TYPES = ['fire'];

// Lock colors for keys and doors
export const LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444' },
  blue: { label: 'Blue', color: '#4444cc' },
  green: { label: 'Green', color: '#44cc44' },
  yellow: { label: 'Yellow', color: '#cccc44' },
  purple: { label: 'Purple', color: '#cc44cc' },
};

// === MOVEMENT RULES ===

// Helper to check if inventory has item type
function hasItemType(inventory, itemType) {
  return inventory?.some(item => item.itemType === itemType) || false;
}

// Check if player can move into a tile
// Returns { allowed, message?, loseLife?, moveRaft?, respawn? }
// NOTE: tileType is the top-most tile (object if present, otherwise floor)
// We need to check floor layer separately for environmental conditions like snow
export function checkMovementInto(tileType, gameState, tileConfig, grid, x, y) {
  const inventory = gameState?.inventory || [];
  const currentTileType = gameState?.currentTileType;

  // First check if the FLOOR is snow (regardless of what's on top)
  // This ensures snow rules apply even when there's an object on the snow
  if (grid && grid[y]?.[x]?.floor?.type === 'snow') {
    const isWearingSweater = gameState?.worn?.body === 'sweater';
    if (!isWearingSweater) {
      return {
        allowed: false,
        messageKey: 'tooCold'
      };
    }
    // Wearing sweater - continue checking object layer below
  }

  // Now check object layer (or floor if no object)
  switch (tileType) {
    case 'bear':
      // Bear always attacks - must be defeated with interaction
      return {
        allowed: false,
        loseLife: true,
        messageKey: 'bearWarning'
      };

    case 'snow':
      // This case only triggers if snow is the top-most tile (no object on it)
      const isWearingSweater = gameState?.worn?.body === 'sweater';
      if (isWearingSweater) {
        return { allowed: true };
      }
      return {
        allowed: false,
        messageKey: 'tooCold'
      };

    case 'water':
      // Check if standing on raft - can push raft into water
      if (currentTileType === 'raft') {
        return {
          allowed: true,
          // Set the source tile (where player was) to water (floor), dest tile to raft (object on water)
          setSourceTile: { floor: { type: 'water', config: {} }, object: null },
          setDestTile: { floor: { type: 'water', config: {} }, object: { type: 'raft', config: {} } }
        };
      }
      return {
        allowed: false,
        messageKey: 'cantSwim'
      };

    case 'fire':
      return {
        allowed: false,
        loseLife: true,
        messageKey: 'burned'
      };

    case 'door-key': {
      const doorColor = tileConfig?.lockColor || 'red';
      const hasKey = inventory.some(
        item => item.itemType === 'key' && item.lockColor === doorColor
      );
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
      const hasCard = inventory.some(
        item => item.itemType === 'card' && item.lockColor === doorColor
      );
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

    default:
      // Use default walkability
      return { allowed: isWalkable(tileType, gameState) };
  }
}

// Check if player meets exit requirements
export function checkExitRequirements(gameState, exitConfig) {
  const needsKey = exitConfig?.needsKey !== false;

  if (needsKey && !hasItemType(gameState?.inventory, 'key')) {
    return {
      allowed: false,
      messageKey: 'needKeyToEscape'
    };
  }

  return { allowed: true };
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
  return { type: 'ground', config: {} };
}

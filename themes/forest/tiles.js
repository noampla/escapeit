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
    layer: 'object',
    configurable: false,
    defaultConfig: {},
    tooltip: 'Blocks movement. Cut with axe (hold E) to get wood.',
    walkable: false
  },
  boulder: {
    label: 'Boulder',
    color: '#5a5a5a',
    category: 'basic',
    layer: 'object',
    configurable: false,
    defaultConfig: {},
    tooltip: 'Large rock. Blocks movement.',
    walkable: false
  },
  'thorny-bush': {
    label: 'Thorny Bush',
    color: '#4a6b3a',
    category: 'basic',
    layer: 'object',
    configurable: false,
    defaultConfig: {},
    tooltip: 'Dense thorny bush. Blocks movement. Clear with knife (hold E).',
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

// Draw a boulder (large gray rock)
function drawBoulder(ctx, cx, cy, size) {
  // Main boulder shape (irregular rock)
  ctx.fillStyle = '#6a6a6a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.42, size * 0.38, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Darker shadow on bottom
  ctx.fillStyle = '#4a4a4a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.15, size * 0.38, size * 0.2, 0.2, 0, Math.PI);
  ctx.fill();

  // Rock texture highlights (lighter spots)
  ctx.fillStyle = '#8a8a8a';
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.12, cy - size * 0.1, size * 0.15, size * 0.12, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + size * 0.15, cy + size * 0.05, size * 0.1, size * 0.08, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Cracks in the rock
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.25, cy - size * 0.05);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + size * 0.1, cy - size * 0.15);
  ctx.lineTo(cx + size * 0.25, cy + size * 0.05);
  ctx.stroke();
}

// Draw a thorny bush
function drawThornyBush(ctx, cx, cy, size) {
  // Main bush body (dark green cluster)
  ctx.fillStyle = '#3a5a2a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.4, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lighter green highlights (front leaves)
  ctx.fillStyle = '#4a6b3a';
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.15, cy - size * 0.1, size * 0.2, size * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + size * 0.12, cy + size * 0.08, size * 0.18, size * 0.15, 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.18, size * 0.15, size * 0.13, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Thorns (sharp brown spikes)
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 2;

  // Draw several thorns at various angles
  const thornPositions = [
    { x: -0.25, y: -0.15, angle: -0.5 },
    { x: 0.28, y: -0.08, angle: 0.3 },
    { x: -0.3, y: 0.12, angle: -0.8 },
    { x: 0.25, y: 0.18, angle: 0.7 },
    { x: 0.05, y: -0.25, angle: 0 },
    { x: -0.12, y: 0.25, angle: -0.3 }
  ];

  thornPositions.forEach(thorn => {
    const startX = cx + thorn.x * size;
    const startY = cy + thorn.y * size;
    const length = size * 0.12;
    const endX = startX + Math.cos(thorn.angle) * length;
    const endY = startY + Math.sin(thorn.angle) * length;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Thorn tip (darker)
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath();
    ctx.arc(endX, endY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
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

  // Boulder gets custom rendering
  if (tile.type === 'boulder') {
    drawBoulder(ctx, cx, cy, size);
    return true;
  }

  // Thorny bush gets custom rendering
  if (tile.type === 'thorny-bush') {
    drawThornyBush(ctx, cx, cy, size);
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
    boulder: null,  // Custom draw
    'thorny-bush': null,  // Custom draw
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
export const INTERACTABLE_TILES = ['tree', 'thorny-bush', 'water', 'raft', 'fire', 'friend', 'bear', 'door-key', 'door-card'];

// Tiles to ignore for floor color detection when picking up items
export const IGNORE_TILES = ['wall', 'empty', 'door-key', 'door-card', 'door-key-open', 'door-card-open', 'tree', 'boulder', 'thorny-bush', 'water', 'snow', 'bear'];

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

// === PLAYER RENDERING ===

/**
 * Render the player with visual indication of worn sweater
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Tile size
 * @param {string} direction - Player direction ('up', 'down', 'left', 'right')
 * @param {Object} gameState - Current game state with worn items
 */
export function renderPlayer(ctx, x, y, size, _direction, gameState = {}) {
  const worn = gameState.worn || {};
  const wearingSweater = worn.body === 'sweater';

  // Draw player emoji
  ctx.font = '26px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧑', x, y);

  if (wearingSweater) {
    // Draw ellipse hood around head (on top of emoji)
    const sweaterColor = '#c8b4a4';
    const darkColor = '#8b7355';

    // Ellipse hood - moved up and larger to cover hair
    ctx.strokeStyle = sweaterColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.03, size * 0.28, size * 0.33, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Darker outline for visibility
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.03, size * 0.28, size * 0.33, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  return true;
}

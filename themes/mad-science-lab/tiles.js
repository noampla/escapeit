// Mad Science Lab Theme - Tile Definitions

// Floor color options for different lab areas
export const FLOOR_COLORS = {
  gray: { label: 'Lab Gray', color: '#2a2a2f' },
  white: { label: 'Clean Room', color: '#3a3a40' },
  green: { label: 'Bio Lab', color: '#1a2a1a' },
  blue: { label: 'Cryo Lab', color: '#1a1a2a' },
  yellow: { label: 'Hazard Zone', color: '#2a2a1a' },
  red: { label: 'Quarantine', color: '#2a1a1a' }
};

// Lock colors for keycards and doors
export const LOCK_COLORS = {
  red: { label: 'Red', color: '#ff4444', dark: '#aa2222', glow: 'rgba(255, 68, 68, 0.4)' },
  blue: { label: 'Blue', color: '#4488ff', dark: '#2255aa', glow: 'rgba(68, 136, 255, 0.4)' },
  green: { label: 'Green', color: '#44ff88', dark: '#22aa55', glow: 'rgba(68, 255, 136, 0.4)' },
  yellow: { label: 'Yellow', color: '#ffdd44', dark: '#aa9922', glow: 'rgba(255, 221, 68, 0.4)' },
  purple: { label: 'Purple', color: '#aa44ff', dark: '#6622aa', glow: 'rgba(170, 68, 255, 0.4)' }
};

export const TILE_TYPES = {
  empty: {
    label: 'Empty',
    color: '#050508',
    category: 'basic',
    tooltip: 'Empty void. Not walkable.',
    walkable: false
  },
  wall: {
    label: 'Wall',
    color: '#1a1a1f',
    category: 'basic',
    tooltip: 'Laboratory wall. Blocks movement.',
    walkable: false
  },
  floor: {
    label: 'Floor',
    color: '#2a2a2f',
    category: 'basic',
    configurable: true,
    defaultConfig: { floorColor: 'gray' },
    tooltip: 'Lab floor. Shift+click to change color.',
    walkable: true
  },
  start: {
    label: 'Entry Point (Start)',
    color: '#1a4a1a',
    category: 'basic',
    unique: true,
    tooltip: 'Player spawn point. Only one per level.',
    walkable: true
  },
  exit: {
    label: 'Emergency Exit',
    color: '#4a1a1a',
    category: 'basic',
    unique: true,
    tooltip: 'Emergency exit. Escape here to complete the level.',
    walkable: true
  },

  // Security Doors
  'door-card': {
    label: 'Security Door',
    color: '#2a2a3a',
    category: 'interactive',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Electronic security door. Requires matching colored keycard.',
    walkable: false
  },
  'door-card-open': {
    label: 'Open Security Door',
    color: '#1a1a2a',
    walkable: true
  },

  // Keycard item tile
  'item-card': {
    label: 'Keycard',
    color: '#3a3a4a',
    category: 'interactive',
    isItemTile: true,
    itemType: 'card',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Access keycard. Opens matching colored security doors.',
    walkable: true
  }
};

// Config schema for configurable tiles
export const CONFIG_SCHEMA = {
  floor: {
    floorColor: {
      type: 'select',
      label: 'Floor Type',
      options: 'FLOOR_COLORS',
      default: 'gray'
    }
  },
  'door-card': {
    lockColor: {
      type: 'select',
      label: 'Access Level',
      options: 'LOCK_COLORS',
      default: 'red'
    }
  },
  'item-card': {
    lockColor: {
      type: 'select',
      label: 'Access Level',
      options: 'LOCK_COLORS',
      default: 'red'
    }
  }
};

// Config help tooltips
export const CONFIG_HELP = {
  floor: {
    floorColor: 'Type of lab floor for visual room distinction.'
  },
  'door-card': {
    lockColor: 'Security clearance level. Only a keycard of the same color can open it.'
  },
  'item-card': {
    lockColor: 'Security clearance level. Opens doors with matching color.'
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
  // Floor renders with configured color and grid pattern
  if (tile.type === 'floor') {
    const floorColor = tile.config?.floorColor || 'gray';
    const colorData = FLOOR_COLORS[floorColor] || FLOOR_COLORS.gray;

    // Base floor color
    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Subtle grid pattern (lab floor tiles)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(cx - size/2, cy);
    ctx.lineTo(cx + size/2, cy);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(cx, cy - size/2);
    ctx.lineTo(cx, cy + size/2);
    ctx.stroke();

    return true;
  }

  // Wall with industrial panel look
  if (tile.type === 'wall') {
    // Base wall color
    ctx.fillStyle = '#1a1a1f';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Panel effect
    ctx.fillStyle = '#222228';
    ctx.fillRect(cx - size * 0.42, cy - size * 0.42, size * 0.84, size * 0.84);

    // Panel border highlight
    ctx.strokeStyle = '#2a2a30';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - size * 0.42, cy - size * 0.42, size * 0.84, size * 0.84);

    // Corner rivets
    ctx.fillStyle = '#3a3a40';
    const rivetPositions = [
      { x: -0.35, y: -0.35 }, { x: 0.35, y: -0.35 },
      { x: -0.35, y: 0.35 }, { x: 0.35, y: 0.35 }
    ];
    for (const pos of rivetPositions) {
      ctx.beginPath();
      ctx.arc(cx + pos.x * size, cy + pos.y * size, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }

    return true;
  }

  // Start tile - airlock/entry
  if (tile.type === 'start') {
    // Dark floor base
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Entry marker circle
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Exit tile - emergency exit
  if (tile.type === 'exit') {
    // Dark floor base
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Exit door frame
    ctx.fillStyle = '#3a2020';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9);

    // Door
    ctx.fillStyle = '#4a2525';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.4, size * 0.6, size * 0.8);

    // EXIT sign
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(cx - size * 0.25, cy - size * 0.35, size * 0.5, size * 0.15);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.1}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', cx, cy - size * 0.28);

    // Push bar
    ctx.fillStyle = '#666';
    ctx.fillRect(cx - size * 0.25, cy + size * 0.1, size * 0.5, size * 0.08);

    return true;
  }

  // Security Door (locked)
  if (tile.type === 'door-card') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Door frame (dark metal)
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Door panel (metallic)
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(cx - size * 0.4, cy - size * 0.45, size * 0.8, size * 0.9);

    // Horizontal lines (door segments)
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.4, cy - size * 0.1);
    ctx.lineTo(cx + size * 0.4, cy - size * 0.1);
    ctx.moveTo(cx - size * 0.4, cy + size * 0.2);
    ctx.lineTo(cx + size * 0.4, cy + size * 0.2);
    ctx.stroke();

    // Card reader panel
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(cx + size * 0.15, cy - size * 0.35, size * 0.2, size * 0.25);

    // Card slot
    ctx.fillStyle = '#151520';
    ctx.fillRect(cx + size * 0.18, cy - size * 0.28, size * 0.14, size * 0.04);

    // LED indicator (colored glow)
    ctx.fillStyle = colorData.glow;
    ctx.beginPath();
    ctx.arc(cx + size * 0.25, cy - size * 0.18, size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // LED core
    ctx.fillStyle = colorData.color;
    ctx.beginPath();
    ctx.arc(cx + size * 0.25, cy - size * 0.18, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Lock icon
    ctx.fillStyle = colorData.dark;
    ctx.fillRect(cx - size * 0.08, cy + size * 0.28, size * 0.16, size * 0.12);
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.28, size * 0.08, Math.PI, 0);
    ctx.stroke();

    return true;
  }

  // Open Security Door
  if (tile.type === 'door-card-open') {
    // Door frame
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Open doorway (dark interior)
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9);

    // Door panel slid to the side
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(cx + size * 0.2, cy - size * 0.45, size * 0.25, size * 0.9);

    // Panel edge highlight
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(cx + size * 0.2, cy - size * 0.45, size * 0.03, size * 0.9);

    // Green LED (unlocked)
    ctx.fillStyle = 'rgba(68, 255, 136, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - size * 0.35, cy - size * 0.35, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#44ff88';
    ctx.beginPath();
    ctx.arc(cx - size * 0.35, cy - size * 0.35, size * 0.03, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Keycard item tile
  if (tile.type === 'item-card') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Card body (white/light gray)
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(cx - size * 0.28, cy - size * 0.18, size * 0.56, size * 0.36);

    // Colored stripe at top
    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.28, cy - size * 0.18, size * 0.56, size * 0.1);

    // Chip (gold)
    ctx.fillStyle = '#daa520';
    ctx.fillRect(cx - size * 0.18, cy + size * 0.02, size * 0.14, size * 0.1);

    // Chip lines
    ctx.strokeStyle = '#aa8510';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.18, cy + size * 0.07);
    ctx.lineTo(cx - size * 0.04, cy + size * 0.07);
    ctx.moveTo(cx - size * 0.11, cy + size * 0.02);
    ctx.lineTo(cx - size * 0.11, cy + size * 0.12);
    ctx.stroke();

    // Magnetic stripe
    ctx.fillStyle = '#333';
    ctx.fillRect(cx + size * 0.05, cy + size * 0.02, size * 0.18, size * 0.06);

    return true;
  }

  return false;
}

// Get emoji for tile rendering (fallback)
export function getTileEmoji(tileType) {
  const emojiMap = {
    empty: null,
    wall: null,
    floor: null,
    start: null,
    exit: null,
    'door-card': null,
    'door-card-open': null,
    'item-card': null
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

// === TILE CLASSIFICATIONS ===

// Tiles that items can be dropped on
export const GROUND_TILES = ['floor', 'start', 'exit'];

// Tiles player can interact with (E key)
export const INTERACTABLE_TILES = ['floor', 'start', 'exit', 'door-card'];

// Tiles to ignore for floor color detection
export const IGNORE_TILES = ['wall', 'empty', 'door-card', 'door-card-open'];

// Tiles that use lock colors
export const LOCK_TILES = ['door-card', 'item-card'];

// Hazard tile types (none yet)
export const HAZARD_TILE_TYPES = [];

// === MOVEMENT RULES ===

// Helper to check if inventory has item with matching color
function hasMatchingItem(inventory, itemType, lockColor) {
  return inventory?.some(item =>
    item.itemType === itemType && item.lockColor === lockColor
  ) || false;
}

// Check if player can move into a tile
export function checkMovementInto(tileType, gameState, tileConfig) {
  const inventory = gameState?.inventory || [];

  switch (tileType) {
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

    default:
      return { allowed: isWalkable(tileType, gameState) };
  }
}

// Check if player meets exit requirements
export function checkExitRequirements(gameState, exitConfig) {
  return { allowed: true };
}

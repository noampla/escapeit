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
  }
};

// Config help tooltips
export const CONFIG_HELP = {
  floor: {
    floorColor: 'Type of lab floor for visual room distinction.'
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

  return false;
}

// Get emoji for tile rendering (fallback)
export function getTileEmoji(tileType) {
  const emojiMap = {
    empty: null,
    wall: null,
    floor: null,
    start: null,
    exit: null
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

// === TILE CLASSIFICATIONS ===

// Tiles that items can be dropped on
export const GROUND_TILES = ['floor', 'start', 'exit'];

// Tiles player can interact with (E key)
export const INTERACTABLE_TILES = ['floor', 'start', 'exit'];

// Tiles to ignore for floor color detection
export const IGNORE_TILES = ['wall', 'empty'];

// Hazard tile types (none yet)
export const HAZARD_TILE_TYPES = [];

// === MOVEMENT RULES ===

// Check if player can move into a tile
export function checkMovementInto(tileType, gameState, tileConfig) {
  return { allowed: isWalkable(tileType, gameState) };
}

// Check if player meets exit requirements
export function checkExitRequirements(gameState, exitConfig) {
  return { allowed: true };
}

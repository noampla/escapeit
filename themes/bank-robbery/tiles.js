// Bank Robbery Theme - Tile Definitions

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

  // Wall with brick pattern - more visible
  if (tile.type === 'wall') {
    // Base wall color - lighter gray
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Brick pattern
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;

    // Horizontal lines
    const rows = 3;
    for (let i = 1; i < rows; i++) {
      const y = cy - size/2 + (size / rows) * i;
      ctx.beginPath();
      ctx.moveTo(cx - size/2, y);
      ctx.lineTo(cx + size/2, y);
      ctx.stroke();
    }

    // Vertical lines (offset per row for brick effect)
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

  return false;
}

// Get emoji for tile rendering
export function getTileEmoji(tileType) {
  const emojiMap = {
    empty: null,
    wall: null,
    floor: null,
    start: '🚪',
    exit: '🚐'
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

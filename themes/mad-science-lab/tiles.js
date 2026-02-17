// Mad Science Lab Theme - Tile Definitions

// Floor color options for different lab areas
export const FLOOR_COLORS = {
  gray: { label: 'Lab Gray', color: '#2a2a2f' },
  white: { label: 'Clean Room', color: '#3a3a40' },
  green: { label: 'Bio Lab', color: '#1a2a1a' },
  blue: { label: 'Cryo Lab', color: '#1a1a2a' }
};

// Lock colors for keycards, chemical vials, and doors
export const LOCK_COLORS = {
  red: { label: 'Red', color: '#ff4444', dark: '#aa2222', glow: 'rgba(255, 68, 68, 0.4)' },
  blue: { label: 'Blue', color: '#4488ff', dark: '#2255aa', glow: 'rgba(68, 136, 255, 0.4)' },
  green: { label: 'Green', color: '#44ff88', dark: '#22aa55', glow: 'rgba(68, 255, 136, 0.4)' },
  yellow: { label: 'Yellow', color: '#ffdd44', dark: '#aa9922', glow: 'rgba(255, 221, 68, 0.4)' },
  purple: { label: 'Purple', color: '#aa44ff', dark: '#6622aa', glow: 'rgba(170, 68, 255, 0.4)' }
};

export const TILE_TYPES = {
  // === BASIC TILES ===
  empty: {
    label: 'Empty',
    color: '#050508',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Empty void. Not walkable.',
    walkable: false
  },

  wall: {
    label: 'Wall',
    color: '#1a1a1f',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Laboratory wall. Blocks movement.',
    walkable: false
  },

  floor: {
    label: 'Floor',
    color: '#2a2a2f',
    category: 'basic',
    layer: 'floor',
    configurable: true,
    defaultConfig: { floorColor: 'gray' },
    tooltip: 'Lab floor. Shift+click to change color.',
    walkable: true
  },

  start: {
    label: 'Entry Point (Start)',
    color: '#1a4a1a',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Player spawn point. Place 2+ for multiplayer (each player starts at a different one).',
    walkable: true
  },

  exit: {
    label: 'Emergency Exit',
    color: '#4a1a1a',
    category: 'basic',
    layer: 'floor',
    unique: true,
    tooltip: 'Emergency exit. Escape here to complete the level.',
    walkable: true
  },

  // === SECURITY DOORS ===
  'door-card': {
    label: 'Security Door',
    color: '#2a2a3a',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Electronic security door. Requires matching colored keycard.',
    walkable: false
  },

  'door-card-open': {
    label: 'Open Security Door',
    color: '#1a1a2a',
    layer: 'object',
    walkable: true
  },

  // === CHEMICAL DOORS ===
  'door-chemical': {
    label: 'Chemical-Sealed Door',
    color: '#2a1a2a',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Door with chemical lock. Requires matching chemical vial to neutralize seal.',
    walkable: false
  },

  'door-chemical-open': {
    label: 'Neutralized Chemical Door',
    color: '#1a1a2a',
    layer: 'object',
    walkable: true
  },

  // === TERMINALS ===
  'terminal': {
    label: 'Access Terminal',
    color: '#1a2a3a',
    category: 'interactive',
    layer: 'object',
    tooltip: 'Computer access terminal. Requires data tablet to access.',
    walkable: false
  },

  'terminal-active': {
    label: 'Active Terminal',
    color: '#1a3a2a',
    layer: 'object',
    walkable: false
  },

  // === HAZARDS ===
  'toxic_spill': {
    label: 'Toxic Spill',
    color: '#2a4a1a',
    category: 'hazard',
    layer: 'object',
    tooltip: 'Hazardous chemical spill. Need hazmat suit!',
    walkable: true
  },

  'radiation': {
    label: 'Radiation Zone',
    color: '#4a4a1a',
    category: 'hazard',
    layer: 'object',
    tooltip: 'Radioactive area. Need hazmat suit!',
    walkable: true
  },

  'laser_grid': {
    label: 'Laser Grid',
    color: '#5a1a1a',
    category: 'hazard',
    layer: 'object',
    tooltip: 'Security laser grid. Blocks movement!',
    walkable: false
  },

  'broken-glass': {
    label: 'Broken Glass',
    color: '#3a3a3a',
    category: 'hazard',
    layer: 'object',
    tooltip: 'Shattered glass. Causes damage!',
    walkable: true
  },

  'laser_grid_disabled': {
    label: 'Disabled Laser Grid',
    color: '#2a2a2a',
    category: 'object',
    layer: 'object',
    tooltip: 'Deactivated laser grid. Safe to pass.',
    walkable: true
  },

  // === ITEM TILES (Pickupable Items) ===
  'item-card': {
    label: 'Keycard',
    color: '#3a3a4a',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'card',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Access keycard. Opens matching colored security doors.',
    walkable: true
  },

  'item-chemical': {
    label: 'Chemical Vial',
    color: '#3a3a4a',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'chemical',
    configurable: true,
    defaultConfig: { lockColor: 'red' },
    tooltip: 'Chemical compound vial. Neutralizes matching colored chemical-sealed doors.',
    walkable: true
  },

  'item-tablet': {
    label: 'Data Tablet',
    color: '#3a4a5a',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'tablet',
    tooltip: 'Electronic tablet for accessing terminals.',
    walkable: true
  },

  'item-battery': {
    label: 'Power Cell',
    color: '#3a5a3a',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'battery',
    tooltip: 'High-capacity power cell.',
    walkable: true
  },

  'item-hazmat': {
    label: 'Hazmat Suit',
    color: '#5a4a2a',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'hazmat',
    tooltip: 'Full hazmat protection suit. Protects from hazards.',
    walkable: true
  },

  'item-medkit': {
    label: 'Medical Kit',
    color: '#5a3a3a',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'medkit',
    tooltip: 'Emergency medical supplies. Restores health.',
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
  'door-chemical': {
    lockColor: {
      type: 'select',
      label: 'Chemical Type',
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
  },
  'item-chemical': {
    lockColor: {
      type: 'select',
      label: 'Chemical Type',
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
  'door-chemical': {
    lockColor: 'Chemical compound type. Only matching chemical vial can neutralize it.'
  },
  'item-card': {
    lockColor: 'Security clearance level. Opens doors with matching color.'
  },
  'item-chemical': {
    lockColor: 'Chemical compound type. Neutralizes doors with matching color.'
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
  if (!tile) return false;

  // Floor with grid pattern
  if (tile.type === 'floor') {
    const floorColor = tile.config?.floorColor || 'gray';
    const colorData = FLOOR_COLORS[floorColor] || FLOOR_COLORS.gray;

    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - size/2, cy);
    ctx.lineTo(cx + size/2, cy);
    ctx.moveTo(cx, cy - size/2);
    ctx.lineTo(cx, cy + size/2);
    ctx.stroke();

    return true;
  }

  // Wall with panel effect
  if (tile.type === 'wall') {
    ctx.fillStyle = '#1a1a1f';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    ctx.fillStyle = '#222228';
    ctx.fillRect(cx - size * 0.42, cy - size * 0.42, size * 0.84, size * 0.84);

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

  // Start tile - entry point
  if (tile.type === 'start') {
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Exit tile - emergency exit
  if (tile.type === 'exit') {
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    // Door frame
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

    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(cx - size * 0.4, cy - size * 0.45, size * 0.8, size * 0.9);

    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.4, cy - size * 0.1);
    ctx.lineTo(cx + size * 0.4, cy - size * 0.1);
    ctx.moveTo(cx - size * 0.4, cy + size * 0.2);
    ctx.lineTo(cx + size * 0.4, cy + size * 0.2);
    ctx.stroke();

    // Card reader
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(cx + size * 0.15, cy - size * 0.35, size * 0.2, size * 0.25);

    ctx.fillStyle = '#151520';
    ctx.fillRect(cx + size * 0.18, cy - size * 0.28, size * 0.14, size * 0.04);

    // LED indicator
    ctx.fillStyle = colorData.glow;
    ctx.beginPath();
    ctx.arc(cx + size * 0.25, cy - size * 0.18, size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colorData.color;
    ctx.beginPath();
    ctx.arc(cx + size * 0.25, cy - size * 0.18, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Open Security Door
  if (tile.type === 'door-card-open') {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9);

    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(cx + size * 0.2, cy - size * 0.45, size * 0.25, size * 0.9);

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

  // Chemical-Sealed Door
  if (tile.type === 'door-chemical') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    ctx.fillStyle = '#2a1a2a';
    ctx.fillRect(cx - size * 0.4, cy - size * 0.45, size * 0.8, size * 0.9);

    // Chemical seal (glowing liquid effect)
    ctx.fillStyle = colorData.glow;
    ctx.fillRect(cx - size * 0.35, cy - size * 0.4, size * 0.7, size * 0.8);

    ctx.fillStyle = 'rgba(10, 10, 20, 0.7)';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.4, size * 0.7, size * 0.8);

    // Chemical streams
    for (let i = 0; i < 3; i++) {
      const x = cx - size * 0.2 + i * size * 0.2;
      ctx.fillStyle = colorData.color;
      ctx.fillRect(x, cy - size * 0.4, size * 0.04, size * 0.8);
    }

    // Warning symbol
    ctx.strokeStyle = colorData.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    return true;
  }

  // Open Chemical Door
  if (tile.type === 'door-chemical-open') {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.45, size * 0.7, size * 0.9);

    // Neutralized indicator
    ctx.fillStyle = 'rgba(68, 255, 136, 0.2)';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.4, size * 0.6, size * 0.8);

    return true;
  }

  // Terminal
  if (tile.type === 'terminal') {
    // Monitor base
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.25, size * 0.7, size * 0.5);

    // Screen (dark)
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.35);

    // Stand
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(cx - size * 0.15, cy + size * 0.25, size * 0.3, size * 0.1);

    return true;
  }

  // Active Terminal
  if (tile.type === 'terminal-active') {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - size * 0.35, cy - size * 0.25, size * 0.7, size * 0.5);

    // Screen (glowing green)
    ctx.fillStyle = '#0a3a2a';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.35);

    // Terminal text lines
    ctx.fillStyle = '#44ff88';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(cx - size * 0.25, cy - size * 0.1 + i * size * 0.1, size * 0.4, size * 0.02);
    }

    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(cx - size * 0.15, cy + size * 0.25, size * 0.3, size * 0.1);

    return true;
  }

  // Toxic Spill
  if (tile.type === 'toxic_spill') {
    ctx.fillStyle = '#44aa33';
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#338822';
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.1, cy, size * 0.25, size * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles
    ctx.fillStyle = '#55cc44';
    ctx.beginPath();
    ctx.arc(cx + size * 0.15, cy - size * 0.1, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - size * 0.2, cy + size * 0.1, size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Radiation Zone
  if (tile.type === 'radiation') {
    ctx.fillStyle = 'rgba(200, 200, 0, 0.2)';
    ctx.fillRect(cx - size/2, cy - size/2, size, size);

    ctx.fillStyle = '#aaaa00';
    ctx.strokeStyle = '#cccc00';
    ctx.lineWidth = 2;

    // Radiation symbol
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const angle = (i * 120 - 90) * Math.PI / 180;
      const x1 = cx + Math.cos(angle) * size * 0.12;
      const y1 = cy + Math.sin(angle) * size * 0.12;
      const x2 = cx + Math.cos(angle) * size * 0.35;
      const y2 = cy + Math.sin(angle) * size * 0.35;

      ctx.beginPath();
      ctx.arc(x2, y2, size * 0.1, angle + Math.PI, angle + Math.PI * 2);
      ctx.lineTo(x1, y1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    return true;
  }

  // Laser Grid
  if (tile.type === 'laser_grid') {
    ctx.fillStyle = '#3a3a4a';
    // Left emitter
    ctx.fillRect(cx - size * 0.48, cy - size * 0.1, size * 0.08, size * 0.2);
    // Right emitter
    ctx.fillRect(cx + size * 0.4, cy - size * 0.1, size * 0.08, size * 0.2);

    // Laser beams
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.4, cy + i * size * 0.1);
      ctx.lineTo(cx + size * 0.4, cy + i * size * 0.1);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    return true;
  }

  // Disabled Laser Grid
  if (tile.type === 'laser_grid_disabled') {
    ctx.fillStyle = '#2a2a2a';
    // Left emitter
    ctx.fillRect(cx - size * 0.48, cy - size * 0.1, size * 0.08, size * 0.2);
    // Right emitter
    ctx.fillRect(cx + size * 0.4, cy - size * 0.1, size * 0.08, size * 0.2);

    // Gray (disabled) laser beams - dashed to show they're off
    ctx.setLineDash([size * 0.05, size * 0.05]);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.4, cy + i * size * 0.1);
      ctx.lineTo(cx + size * 0.4, cy + i * size * 0.1);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    return true;
  }

  // Broken Glass
  if (tile.type === 'broken-glass') {
    // Glass shards
    ctx.fillStyle = '#888';
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;

    // Random shard positions
    const shards = [
      { x: -0.2, y: -0.15, w: 0.15, h: 0.2 },
      { x: 0.1, y: -0.1, w: 0.12, h: 0.18 },
      { x: -0.15, y: 0.15, w: 0.18, h: 0.15 },
      { x: 0.15, y: 0.1, w: 0.1, h: 0.12 }
    ];

    for (const shard of shards) {
      ctx.beginPath();
      ctx.moveTo(cx + shard.x * size, cy + shard.y * size);
      ctx.lineTo(cx + (shard.x + shard.w) * size, cy + shard.y * size);
      ctx.lineTo(cx + (shard.x + shard.w * 0.5) * size, cy + (shard.y + shard.h) * size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    return true;
  }

  // Keycard item tile
  if (tile.type === 'item-card') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(cx - size * 0.28, cy - size * 0.18, size * 0.56, size * 0.36);

    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.28, cy - size * 0.18, size * 0.56, size * 0.1);

    ctx.fillStyle = '#daa520';
    ctx.fillRect(cx - size * 0.18, cy + size * 0.02, size * 0.14, size * 0.1);

    ctx.strokeStyle = '#aa8510';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.18, cy + size * 0.07);
    ctx.lineTo(cx - size * 0.04, cy + size * 0.07);
    ctx.moveTo(cx - size * 0.11, cy + size * 0.02);
    ctx.lineTo(cx - size * 0.11, cy + size * 0.12);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.fillRect(cx + size * 0.05, cy + size * 0.02, size * 0.18, size * 0.06);

    return true;
  }

  // Chemical Vial item tile
  if (tile.type === 'item-chemical') {
    const lockColor = tile.config?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Vial body
    ctx.fillStyle = 'rgba(200, 220, 240, 0.3)';
    ctx.fillRect(cx - size * 0.12, cy - size * 0.2, size * 0.24, size * 0.35);

    ctx.strokeStyle = 'rgba(200, 220, 240, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - size * 0.12, cy - size * 0.2, size * 0.24, size * 0.35);

    // Chemical liquid
    const liquidHeight = size * 0.28;
    const liquidY = cy + size * 0.15 - liquidHeight;

    ctx.fillStyle = colorData.glow;
    ctx.fillRect(cx - size * 0.14, liquidY, size * 0.28, liquidHeight);

    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.12, liquidY, size * 0.24, liquidHeight);

    // Bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - size * 0.05, liquidY + size * 0.08, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size * 0.04, liquidY + size * 0.15, size * 0.025, 0, Math.PI * 2);
    ctx.fill();

    // Cap
    ctx.fillStyle = '#555';
    ctx.fillRect(cx - size * 0.14, cy - size * 0.25, size * 0.28, size * 0.05);

    ctx.fillStyle = '#777';
    ctx.fillRect(cx - size * 0.14, cy - size * 0.25, size * 0.28, size * 0.02);

    return true;
  }

  return false;
}

// Get emoji for tile rendering (fallback)
export function getTileEmoji(tileType) {
  const emojiMap = {
    // Basic tiles - custom rendered
    empty: null,
    wall: null,
    floor: null,
    start: null,
    exit: null,

    // Doors - use emojis for story modal
    'door-card': '🚪',
    'door-card-open': '🚪',
    'door-chemical': '🚪',
    'door-chemical-open': '🚪',

    // Terminals - use emoji for story modal
    'terminal': '💻',
    'terminal-active': '💻',

    // Hazards - show emojis in toolbar
    'toxic_spill': '☣️',
    'radiation': '☢️',
    'laser_grid': '🔴',
    'broken-glass': '💥',

    // Items - show emojis in toolbar
    'item-card': '🔑',
    'item-chemical': '🧪',
    'item-tablet': '📱',
    'item-battery': '🔋',
    'item-hazmat': '🦺',
    'item-medkit': '⚕️'
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

// === TILE CLASSIFICATIONS ===
export const GROUND_TILES = ['floor', 'start', 'exit'];
export const INTERACTABLE_TILES = ['floor', 'start', 'exit', 'door-card', 'door-chemical', 'terminal'];
export const IGNORE_TILES = ['wall', 'empty', 'door-card', 'door-card-open', 'door-chemical', 'door-chemical-open', 'laser_grid', 'laser_grid_disabled'];
export const LOCK_TILES = ['door-card', 'item-card', 'door-chemical', 'item-chemical'];
export const HAZARD_TILE_TYPES = ['toxic_spill', 'radiation', 'laser_grid', 'broken-glass'];

// === MOVEMENT RULES ===
function hasMatchingItem(inventory, itemType, lockColor) {
  return inventory?.some(item =>
    item.itemType === itemType && item.lockColor === lockColor
  ) || false;
}

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

    case 'door-chemical': {
      const doorColor = tileConfig?.lockColor || 'red';
      const hasChemical = hasMatchingItem(inventory, 'chemical', doorColor);
      if (hasChemical) {
        return {
          allowed: false,
          messageKey: 'chemicalDoorUnlockHint',
          messageParams: { color: doorColor }
        };
      }
      return {
        allowed: false,
        messageKey: 'chemicalDoorLocked',
        messageParams: { color: doorColor }
      };
    }

    default:
      return { allowed: isWalkable(tileType, gameState) };
  }
}

export function checkExitRequirements(gameState, exitConfig) {
  return { allowed: true };
}

// === TWO-LAYER SYSTEM HELPERS ===
export function getTileLayer(tileType) {
  const tile = TILE_TYPES[tileType];
  return tile?.layer || 'floor';
}

export function isFloorTile(tileType) {
  return getTileLayer(tileType) === 'floor';
}

export function isObjectTile(tileType) {
  return getTileLayer(tileType) === 'object';
}

export function getDefaultFloor() {
  return { type: 'floor', config: { floorColor: 'gray' } };
}

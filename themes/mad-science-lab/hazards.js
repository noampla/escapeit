// Mad Science Lab Theme - Hazard Definitions

export const HAZARD_TYPES = {
  toxic_spill: {
    name: 'Toxic Spill',
    emoji: '☣️',
    damage: 1,
    messageKey: 'toxicSpillDamage',
    renderColor: 'rgba(68, 170, 51, 0.3)',
    immunity: ['hazmat']
  },

  radiation: {
    name: 'Radiation Zone',
    emoji: '☢️',
    damage: 1,
    messageKey: 'radiationDamage',
    renderColor: 'rgba(200, 200, 0, 0.3)',
    immunity: ['hazmat']
  },

  laser_grid: {
    name: 'Laser Grid',
    emoji: '🔴',
    damage: 1,
    messageKey: 'laserGridDamage',
    renderColor: 'rgba(255, 0, 0, 0.3)',
    immunity: []
  },

  'broken-glass': {
    name: 'Broken Glass',
    emoji: '💥',
    damage: 1,
    messageKey: 'brokenGlassDamage',
    renderColor: 'rgba(150, 150, 150, 0.2)',
    immunity: ['hazmat']
  }
};

// Check if player has immunity to a hazard
function hasImmunity(gameState, immunityItems) {
  if (!immunityItems || immunityItems.length === 0) return false;

  // Check if wearing hazmat suit
  return immunityItems.includes('hazmat') && gameState?.worn?.body === 'hazmat';
}

// Check for hazard at position
export function checkHazardAt(grid, x, y, gameState) {
  const cell = grid[y]?.[x];
  if (!cell) return null;

  // Check object layer for hazards
  const tileType = cell.object?.type;

  // Toxic Spill
  if (tileType === 'toxic_spill') {
    const hazard = HAZARD_TYPES.toxic_spill;

    if (hasImmunity(gameState, hazard.immunity)) {
      return null; // Protected
    }

    return {
      type: 'toxic_spill',
      damage: hazard.damage,
      messageKey: hazard.messageKey,
      continuous: true,
      interval: 3000 // Damage every 3 seconds
    };
  }

  // Radiation Zone
  if (tileType === 'radiation') {
    const hazard = HAZARD_TYPES.radiation;

    if (hasImmunity(gameState, hazard.immunity)) {
      return null; // Protected
    }

    return {
      type: 'radiation',
      damage: hazard.damage,
      messageKey: hazard.messageKey,
      continuous: true,
      interval: 3000 // Damage every 3 seconds
    };
  }

  // Laser Grid (blocks movement entirely)
  if (tileType === 'laser_grid') {
    const hazard = HAZARD_TYPES.laser_grid;

    return {
      type: 'laser_grid',
      damage: hazard.damage,
      messageKey: hazard.messageKey,
      blocking: true // Cannot walk through
    };
  }

  // Broken Glass
  if (tileType === 'broken-glass') {
    const hazard = HAZARD_TYPES['broken-glass'];

    if (hasImmunity(gameState, hazard.immunity)) {
      return null; // Protected
    }

    return {
      type: 'broken-glass',
      damage: hazard.damage,
      messageKey: hazard.messageKey,
      continuous: true,
      interval: 4000 // Damage every 4 seconds (less frequent than toxic/radiation)
    };
  }

  return null;
}

// Get all hazard zones for visualization in builder
export function getAllHazardZones(grid) {
  const zones = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      const tileType = cell.object?.type;

      if (tileType === 'toxic_spill') {
        zones.push({ x, y, type: 'toxic_spill' });
      }

      if (tileType === 'radiation') {
        zones.push({ x, y, type: 'radiation' });
      }

      if (tileType === 'laser_grid') {
        zones.push({ x, y, type: 'laser_grid' });
      }

      if (tileType === 'broken-glass') {
        zones.push({ x, y, type: 'broken-glass' });
      }
    }
  }

  return zones;
}

// Render hazard overlay (for builder mode visualization)
export function renderHazardOverlay(ctx, grid, tileSize, offsetX, offsetY) {
  const zones = getAllHazardZones(grid);

  zones.forEach(zone => {
    const hazard = HAZARD_TYPES[zone.type];
    if (!hazard) return;

    const x = zone.x * tileSize + offsetX;
    const y = zone.y * tileSize + offsetY;

    // Draw hazard warning overlay
    ctx.fillStyle = hazard.renderColor;
    ctx.fillRect(x, y, tileSize, tileSize);

    // Draw warning border
    ctx.strokeStyle = hazard.renderColor.replace('0.3', '0.8');
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
  });
}

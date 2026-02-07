// Forest theme hazards

export const HAZARD_TYPES = {
  fire: {
    name: 'Fire',
    emoji: '🔥',
    damage: 1,
    messageKey: 'fireStep',  // Translation key for localization
    renderColor: 'rgba(255, 68, 0, 0.3)'
  },
  bear: {
    name: 'Bear',
    emoji: '🐻',
    damage: 1,
    messageKey: 'bearAttack',  // Translation key for localization
    renderColor: 'rgba(139, 69, 19, 0.3)',
    canDefeat: {
      with: 'knife',
      gives: 'sweater',
      messageKey: 'bearDefeated'  // Translation key for localization
    }
  }
};

// Check if there's a hazard at the given position
// Returns hazard info or null
export function checkHazardAt(grid, x, y, gameState) {
  const cell = grid[y]?.[x];
  if (!cell) return null;

  const tileType = cell.object?.type || cell.floor?.type;

  // Fire hazard
  if (tileType === 'fire') {
    return {
      type: 'fire',
      damage: HAZARD_TYPES.fire.damage,
      messageKey: HAZARD_TYPES.fire.messageKey
    };
  }

  // Bear hazard
  if (tileType === 'bear') {
    const hasKnife = gameState.inventory?.some(item => item.itemType === 'knife');

    if (hasKnife) {
      // Defeat the bear
      return {
        type: 'bear',
        damage: 0,
        defeated: true,
        messageKey: HAZARD_TYPES.bear.canDefeat.messageKey,
        removeTile: true,  // Remove bear from grid
        addItem: HAZARD_TYPES.bear.canDefeat.gives,  // Add sweater
        removeItem: 'knife'  // Remove knife
      };
    } else {
      // Bear attacks
      return {
        type: 'bear',
        damage: HAZARD_TYPES.bear.damage,
        messageKey: HAZARD_TYPES.bear.messageKey,
        blockMove: true  // Don't move onto bear
      };
    }
  }

  return null;
}

// Get all hazard zones for visualization in builder
export function getAllHazardZones(grid) {
  const zones = [];
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = grid[y][x];
      const tileType = cell.object?.type || cell.floor?.type;

      if (tileType === 'fire') {
        zones.push({
          x, y,
          hazardType: 'fire',
          renderColor: HAZARD_TYPES.fire.renderColor
        });
      }

      if (tileType === 'bear') {
        zones.push({
          x, y,
          hazardType: 'bear',
          renderColor: HAZARD_TYPES.bear.renderColor
        });
      }
    }
  }

  return zones;
}

// Render hazard overlay on canvas (for builder visualization)
export function renderHazardOverlay(ctx, grid, tileSize, offsetX = 0, offsetY = 0) {
  const zones = getAllHazardZones(grid);

  ctx.globalAlpha = 0.25;
  for (const zone of zones) {
    const hazard = HAZARD_TYPES[zone.hazardType];
    if (!hazard) continue;

    const px = (zone.x - offsetX) * tileSize;
    const py = (zone.y - offsetY) * tileSize;

    ctx.fillStyle = hazard.renderColor;
    ctx.fillRect(px, py, tileSize, tileSize);
  }
  ctx.globalAlpha = 1.0;
}

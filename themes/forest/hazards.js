// Forest theme hazards

export const HAZARD_TYPES = {
  fire: {
    name: 'Fire',
    emoji: '🔥',
    damage: 1,
    message: '🔥 You stepped in fire!',
    renderColor: 'rgba(255, 68, 0, 0.3)'
  },
  bear: {
    name: 'Bear',
    emoji: '🐻',
    damage: 1,
    message: '🐻 Bear attacked!',
    renderColor: 'rgba(139, 69, 19, 0.3)',
    canDefeat: {
      with: 'knife',
      gives: 'sweater',
      message: 'Bear defeated! Got sweater.'
    }
  }
};

// Check if there's a hazard at the given position
// Returns hazard info or null
export function checkHazardAt(grid, x, y, gameState) {
  const tile = grid[y]?.[x];
  if (!tile) return null;

  // Fire hazard
  if (tile.type === 'fire') {
    return {
      type: 'fire',
      damage: HAZARD_TYPES.fire.damage,
      message: HAZARD_TYPES.fire.message
    };
  }

  // Bear hazard
  if (tile.type === 'bear') {
    const hasKnife = gameState.inventory?.some(item => item.itemType === 'knife');

    if (hasKnife) {
      // Defeat the bear
      return {
        type: 'bear',
        damage: 0,
        defeated: true,
        message: HAZARD_TYPES.bear.canDefeat.message,
        removeTile: true,  // Remove bear from grid
        addItem: HAZARD_TYPES.bear.canDefeat.gives,  // Add sweater
        removeItem: 'knife'  // Remove knife
      };
    } else {
      // Bear attacks
      return {
        type: 'bear',
        damage: HAZARD_TYPES.bear.damage,
        message: HAZARD_TYPES.bear.message,
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
      const tile = grid[y][x];

      if (tile.type === 'fire') {
        zones.push({
          x, y,
          hazardType: 'fire',
          renderColor: HAZARD_TYPES.fire.renderColor
        });
      }

      if (tile.type === 'bear') {
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

// Bank Robbery Theme - Hazard Definitions

import { CAMERA_DIRECTIONS } from './tiles.js';

export const HAZARD_TYPES = {
  camera: {
    name: 'Security Camera',
    damage: 1,
    message: 'Spotted by security camera!',
    renderColor: 'rgba(255, 50, 50, 0.25)'
  }
};

// Get direction deltas
function getDirectionDelta(direction) {
  return CAMERA_DIRECTIONS[direction] || CAMERA_DIRECTIONS.down;
}

// Check if a tile blocks camera vision
function blocksVision(tileType) {
  // Walls and closed doors block vision
  const blockingTiles = ['wall', 'empty', 'door-key', 'door-card'];
  return blockingTiles.includes(tileType);
}

// Calculate camera vision tiles (cone/triangle shape that expands)
export function getCameraVisionTiles(grid, cameraX, cameraY, direction, range) {
  const tiles = [];
  const dir = getDirectionDelta(direction);
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Track which columns/rows are blocked (for cone shadow casting)
  const blockedOffsets = new Set();

  for (let dist = 1; dist <= range; dist++) {
    // Calculate the spread at this distance (cone expands as it goes)
    // At distance 1: spread 0 (width 1)
    // At distance 2: spread 1 (width 3)
    // At distance 3: spread 2 (width 5)
    const spread = dist - 1;

    for (let offset = -spread; offset <= spread; offset++) {
      // Skip if this offset line is blocked
      if (blockedOffsets.has(offset)) continue;

      let x, y;
      if (dir.dx !== 0) {
        // Horizontal direction (left/right)
        x = cameraX + dir.dx * dist;
        y = cameraY + offset;
      } else {
        // Vertical direction (up/down)
        x = cameraX + offset;
        y = cameraY + dir.dy * dist;
      }

      // Check bounds
      if (x < 0 || x >= cols || y < 0 || y >= rows) {
        continue;
      }

      const tile = grid[y][x];

      // Check if vision is blocked at this tile
      if (blocksVision(tile.type)) {
        // Mark this offset as blocked for future distances
        blockedOffsets.add(offset);
        continue;
      }

      tiles.push({ x, y, distance: dist, offset });
    }
  }

  return tiles;
}

// Check if there's a hazard at the given position
// Returns hazard info or null
export function checkHazardAt(grid, x, y, gameState) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Check all cameras to see if player is in their vision
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const tile = grid[cy][cx];

      if (tile.type === 'camera') {
        const direction = tile.config?.direction || 'down';
        const range = tile.config?.range || 3;
        const visionTiles = getCameraVisionTiles(grid, cx, cy, direction, range);

        // Check if player position is in camera vision
        const isInVision = visionTiles.some(vt => vt.x === x && vt.y === y);

        if (isInVision) {
          return {
            type: 'camera',
            damage: HAZARD_TYPES.camera.damage,
            message: HAZARD_TYPES.camera.message
          };
        }
      }
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

      if (tile.type === 'camera') {
        const direction = tile.config?.direction || 'down';
        const range = tile.config?.range || 3;
        const visionTiles = getCameraVisionTiles(grid, x, y, direction, range);

        // Add each vision tile as a hazard zone
        for (const vt of visionTiles) {
          zones.push({
            x: vt.x,
            y: vt.y,
            hazardType: 'camera',
            renderColor: HAZARD_TYPES.camera.renderColor,
            distance: vt.distance,
            sourceX: x,
            sourceY: y
          });
        }
      }
    }
  }

  return zones;
}

// Render hazard overlay on canvas (for builder visualization)
export function renderHazardOverlay(ctx, grid, tileSize, offsetX = 0, offsetY = 0) {
  const zones = getAllHazardZones(grid);

  // Render camera vision cones
  for (const zone of zones) {
    if (zone.hazardType !== 'camera') continue;

    const px = (zone.x - offsetX) * tileSize;
    const py = (zone.y - offsetY) * tileSize;

    // Fade effect based on distance (closer = more visible)
    const alpha = 0.35 - (zone.distance - 1) * 0.05;

    ctx.fillStyle = `rgba(255, 50, 50, ${Math.max(0.1, alpha)})`;
    ctx.fillRect(px, py, tileSize, tileSize);

    // Draw subtle grid pattern in vision area
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
  }
}

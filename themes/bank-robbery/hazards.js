// Bank Robbery Theme - Hazard Definitions

import { CAMERA_DIRECTIONS } from './tiles.js';

export const HAZARD_TYPES = {
  camera: {
    name: 'Security Camera',
    damage: 1,
    messageKey: 'cameraSpotted',
    renderColor: 'rgba(255, 50, 50, 0.25)'
  },
  laser: {
    name: 'Laser Tripwire',
    damage: 1,
    messageKey: 'laserCut',
    renderColor: 'rgba(255, 20, 20, 0.6)'
  },
  guard: {
    name: 'Guard',
    damage: 1,
    messageKey: 'guardSpotted',
    renderColor: 'rgba(50, 100, 255, 0.25)',
    range: 4 // Guards have a default vision range
  }
};

// Get direction deltas
function getDirectionDelta(direction) {
  return CAMERA_DIRECTIONS[direction] || CAMERA_DIRECTIONS.down;
}

// Check if a tile blocks camera vision
function blocksVision(cell) {
  // Walls, closed doors, and vault doors block vision
  const blockingTiles = ['wall', 'empty', 'door-key', 'door-card', 'vault-door'];
  // Check both floor and object layers
  return blockingTiles.includes(cell.floor?.type) || blockingTiles.includes(cell.object?.type);
}

// Trace a laser beam from (laserX, laserY) in direction until hitting a wall or map edge
export function getLaserBeamTiles(grid, laserX, laserY, direction) {
  const dir = getDirectionDelta(direction);
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const tiles = [];

  let x = laserX + dir.dx;
  let y = laserY + dir.dy;

  while (x >= 0 && x < cols && y >= 0 && y < rows) {
    const cell = grid[y][x];
    // Check if vision is blocked or mirror is present
    if (blocksVision(cell) || cell.object?.type === 'item-mirror') break;
    tiles.push({ x, y });
    x += dir.dx;
    y += dir.dy;
  }

  return tiles;
}

// Calculate camera vision tiles (cone/triangle shape that expands)
export function getCameraVisionTiles(grid, cameraX, cameraY, direction, range) {
  const tiles = [];
  const dir = getDirectionDelta(direction);
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Track which offset rays are blocked at which distance
  const blockedRays = new Map(); // offset -> earliest blocking distance

  for (let dist = 1; dist <= range; dist++) {
    // Calculate the spread at this distance (cone expands as it goes)
    // At distance 1: spread 0 (width 1)
    // At distance 2: spread 1 (width 3)
    // At distance 3: spread 2 (width 5)
    const spread = dist - 1;

    for (let offset = -spread; offset <= spread; offset++) {
      // Check if this offset was blocked earlier
      if (blockedRays.has(offset) && blockedRays.get(offset) <= dist) {
        continue;
      }

      // Check if an inner offset (closer to center) was blocked earlier
      // which would cast a shadow on this outer offset
      let shadowedByInner = false;
      if (offset !== 0) {
        const offsetSign = offset > 0 ? 1 : -1;
        // Check all offsets between 0 and current offset
        for (let checkOffset = offsetSign; Math.abs(checkOffset) < Math.abs(offset); checkOffset += offsetSign) {
          if (blockedRays.has(checkOffset) && blockedRays.get(checkOffset) < dist) {
            // This inner offset was blocked earlier, it casts a shadow
            shadowedByInner = true;
            break;
          }
        }
      }

      if (shadowedByInner) {
        continue;
      }

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
        blockedRays.set(offset, dist);
        continue;
      }

      const cell = grid[y][x];

      // Check if vision is blocked at this tile
      if (blocksVision(cell)) {
        // Mark this ray as blocked from this distance onward
        blockedRays.set(offset, dist);
        continue;
      }

      tiles.push({ x, y, distance: dist, offset });
    }
  }

  return tiles;
}

// Check if player has immunity to a hazard type
function hasHazardImmunity(gameState, hazardType) {
  if (hazardType === 'camera') {
    // Wearing guard uniform provides camera immunity
    return gameState?.worn?.body === 'uniform';
  }
  return false;
}

// Check if there's a hazard at the given position
// Returns hazard info or null
export function checkHazardAt(grid, x, y, gameState) {
  const cameraImmune = hasHazardImmunity(gameState, 'camera');
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const cell = grid[cy][cx];
      const tileType = cell.object?.type || cell.floor?.type;

      if (tileType === 'camera' && !cameraImmune) {
        const config = cell.object?.config || cell.floor?.config;
        const direction = config?.direction || 'down';
        const range = config?.range || 3;
        const visionTiles = getCameraVisionTiles(grid, cx, cy, direction, range);

        if (visionTiles.some(vt => vt.x === x && vt.y === y)) {
          return {
            type: 'camera',
            damage: HAZARD_TYPES.camera.damage,
            messageKey: HAZARD_TYPES.camera.messageKey,
            continuous: true,
            interval: 5000
          };
        }
      }

      if (tileType === 'guard' && !cameraImmune) {
        const config = cell.object?.config || cell.floor?.config;
        // Skip sleeping guards - they can't see
        if (config?.asleep) continue;

        const direction = config?.direction || 'right';
        const range = config?.visionRange || HAZARD_TYPES.guard.range; // Use configured range or default
        const visionTiles = getCameraVisionTiles(grid, cx, cy, direction, range);

        if (visionTiles.some(vt => vt.x === x && vt.y === y)) {
          return {
            type: 'guard',
            damage: HAZARD_TYPES.guard.damage,
            messageKey: HAZARD_TYPES.guard.messageKey,
            continuous: true,
            interval: 5000
          };
        }
      }

      if (tileType === 'laser') {
        const config = cell.object?.config || cell.floor?.config;
        const direction = config?.direction || 'down';
        const beamTiles = getLaserBeamTiles(grid, cx, cy, direction);

        if (beamTiles.some(bt => bt.x === x && bt.y === y)) {
          return {
            type: 'laser',
            damage: HAZARD_TYPES.laser.damage,
            messageKey: HAZARD_TYPES.laser.messageKey,
            continuous: true,
            interval: 3000
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
      const cell = grid[y][x];
      const tileType = cell.object?.type || cell.floor?.type;

      if (tileType === 'camera') {
        const config = cell.object?.config || cell.floor?.config;
        const direction = config?.direction || 'down';
        const range = config?.range || 3;
        const visionTiles = getCameraVisionTiles(grid, x, y, direction, range);

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

      if (tileType === 'guard') {
        const config = cell.object?.config || cell.floor?.config;
        // Skip sleeping guards - they can't see
        if (config?.asleep) continue;

        const direction = config?.direction || 'right';
        const range = config?.visionRange || HAZARD_TYPES.guard.range;
        const visionTiles = getCameraVisionTiles(grid, x, y, direction, range);

        for (const vt of visionTiles) {
          zones.push({
            x: vt.x,
            y: vt.y,
            hazardType: 'guard',
            renderColor: HAZARD_TYPES.guard.renderColor,
            distance: vt.distance,
            sourceX: x,
            sourceY: y
          });
        }
      }

      if (tileType === 'laser') {
        const config = cell.object?.config || cell.floor?.config;
        const direction = config?.direction || 'down';
        const beamTiles = getLaserBeamTiles(grid, x, y, direction);

        for (const bt of beamTiles) {
          zones.push({
            x: bt.x,
            y: bt.y,
            hazardType: 'laser',
            renderColor: HAZARD_TYPES.laser.renderColor,
            isLaserBeam: true,
            sourceX: x,
            sourceY: y,
            direction: direction
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

  // Render guard vision cones (blue tint)
  for (const zone of zones) {
    if (zone.hazardType !== 'guard') continue;

    const px = (zone.x - offsetX) * tileSize;
    const py = (zone.y - offsetY) * tileSize;

    // Fade effect based on distance (closer = more visible)
    const alpha = 0.35 - (zone.distance - 1) * 0.05;

    ctx.fillStyle = `rgba(50, 100, 255, ${Math.max(0.1, alpha)})`;
    ctx.fillRect(px, py, tileSize, tileSize);

    // Draw subtle grid pattern in vision area
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
  }

  // Render laser beams as thin red lines through tile centers
  // Group laser zones by source emitter to draw one continuous line per laser
  const laserSources = new Map();
  for (const zone of zones) {
    if (zone.hazardType !== 'laser') continue;
    const key = `${zone.sourceX},${zone.sourceY}`;
    if (!laserSources.has(key)) {
      laserSources.set(key, { sourceX: zone.sourceX, sourceY: zone.sourceY, direction: zone.direction, tiles: [] });
    }
    laserSources.get(key).tiles.push(zone);
  }

  for (const laser of laserSources.values()) {
    if (laser.tiles.length === 0) continue;

    // Sort tiles along the beam direction so the line is continuous
    const dir = CAMERA_DIRECTIONS[laser.direction] || CAMERA_DIRECTIONS.down;
    laser.tiles.sort((a, b) => (a.x - b.x) * dir.dx + (a.y - b.y) * dir.dy);

    const last = laser.tiles[laser.tiles.length - 1];

    const startPx = (laser.sourceX - offsetX) * tileSize + tileSize / 2;
    const startPy = (laser.sourceY - offsetY) * tileSize + tileSize / 2;
    const endPx = (last.x - offsetX) * tileSize + tileSize / 2 + dir.dx * tileSize / 2;
    const endPy = (last.y - offsetY) * tileSize + tileSize / 2 + dir.dy * tileSize / 2;

    // Outer glow
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.4)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startPx, startPy);
    ctx.lineTo(endPx, endPy);
    ctx.stroke();

    // Thin bright core
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startPx, startPy);
    ctx.lineTo(endPx, endPy);
    ctx.stroke();
  }
}

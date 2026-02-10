// Random Map Generator - Theme-specific procedural map generation
import { createEmptyGrid, cloneGrid } from './tiles';

/**
 * Generate a random map based on theme-specific rules
 * @param {Object} theme - The theme object
 * @param {Object} config - Generation configuration
 * @returns {Object} { grid, missions, success, error }
 */
export function generateRandomMap(theme, config = {}) {
  const {
    mapSize = 20, // Total map dimensions (mapSize x mapSize)
    roomCount = Math.floor(Math.random() * 3) + 2, // 2-4 rooms
    minRoomSize = 4,
    maxRoomSize = 12,
    minElementsPerRoom = 0,
    maxElementsPerRoom = 2,
    minDoorsPerRoom = 1,
    maxDoorsPerRoom = 2,
    seed = Date.now(),
  } = config;

  try {
    const TILE_TYPES = theme.getTileTypes();
    let grid = createEmptyGrid();

    // Simple seeded random (define this FIRST before using it)
    let rng = seed;
    const random = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };

    // Get theme-specific tiles
    const floorColors = getFloorColors(theme);
    const wallTile = getWallTile(TILE_TYPES);
    const doorTile = getDoorTile(TILE_TYPES);
    const objectTiles = getObjectTiles(TILE_TYPES);
    const itemTiles = getItemTiles(TILE_TYPES);
    const obstacleTiles = getObstacleTiles(TILE_TYPES);
    const hazardTiles = getHazardTiles(TILE_TYPES);
    const startTile = getStartTile(TILE_TYPES);
    const exitTile = getExitTile(TILE_TYPES);
    const defaultFloor = getDefaultFloor(TILE_TYPES);

    // Shuffle floor colors array so each generation uses different colors
    const shuffledFloorColors = [...floorColors];
    for (let i = shuffledFloorColors.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffledFloorColors[i], shuffledFloorColors[j]] = [shuffledFloorColors[j], shuffledFloorColors[i]];
    }

    // Calculate map boundaries (centered in grid)
    const gridRows = grid.length;
    const gridCols = grid[0].length;
    const offsetX = Math.floor((gridCols - mapSize) / 2);
    const offsetY = Math.floor((gridRows - mapSize) / 2);

    // Fill entire map area with default floor
    for (let y = offsetY; y < offsetY + mapSize; y++) {
      for (let x = offsetX; x < offsetX + mapSize; x++) {
        grid[y][x] = {
          floor: { type: defaultFloor, config: {} },
          object: null
        };
      }
    }

    // Generate rooms with BSP (Binary Space Partitioning)
    const rooms = [];
    const minRoomWithWalls = minRoomSize + 2; // +2 for walls
    const maxRoomWithWalls = Math.min(maxRoomSize + 2, mapSize - 2);

    // Create initial container
    const containers = [{
      x: offsetX + 1,
      y: offsetY + 1,
      width: mapSize - 2,
      height: mapSize - 2
    }];

    // Split containers to create room spaces
    const targetRooms = Math.min(roomCount, 8);
    while (containers.length < targetRooms && containers.length < 20) {
      // Find largest container to split
      let largest = containers.reduce((max, c) =>
        (c.width * c.height > max.width * max.height) ? c : max
      , containers[0]);

      // Remove largest
      const index = containers.indexOf(largest);
      containers.splice(index, 1);

      // Try to split horizontally or vertically
      const canSplitH = largest.width >= minRoomWithWalls * 2 + 1;
      const canSplitV = largest.height >= minRoomWithWalls * 2 + 1;

      if (!canSplitH && !canSplitV) {
        containers.push(largest);
        break;
      }

      const splitH = canSplitH && (!canSplitV || random() > 0.5);

      if (splitH) {
        // Split horizontally
        const minSplit = largest.x + minRoomWithWalls;
        const maxSplit = largest.x + largest.width - minRoomWithWalls;
        const splitX = Math.floor(random() * (maxSplit - minSplit)) + minSplit;

        containers.push({
          x: largest.x,
          y: largest.y,
          width: splitX - largest.x,
          height: largest.height
        });
        containers.push({
          x: splitX + 1,
          y: largest.y,
          width: largest.x + largest.width - splitX - 1,
          height: largest.height
        });
      } else {
        // Split vertically
        const minSplit = largest.y + minRoomWithWalls;
        const maxSplit = largest.y + largest.height - minRoomWithWalls;
        const splitY = Math.floor(random() * (maxSplit - minSplit)) + minSplit;

        containers.push({
          x: largest.x,
          y: largest.y,
          width: largest.width,
          height: splitY - largest.y
        });
        containers.push({
          x: largest.x,
          y: splitY + 1,
          width: largest.width,
          height: largest.y + largest.height - splitY - 1
        });
      }
    }

    // Create rooms within containers
    containers.forEach((container, idx) => {
      // Random room size within container
      const roomW = Math.min(
        Math.floor(random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize,
        container.width - 2
      );
      const roomH = Math.min(
        Math.floor(random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize,
        container.height - 2
      );

      // Random position within container
      const roomX = container.x + Math.floor(random() * (container.width - roomW));
      const roomY = container.y + Math.floor(random() * (container.height - roomH));

      const floorColor = shuffledFloorColors[idx % shuffledFloorColors.length];
      console.log(`Room ${idx}: floorColor = ${floorColor}`);

      rooms.push({
        x: roomX,
        y: roomY,
        width: roomW,
        height: roomH,
        floorColor,
        doors: []
      });
    });

    if (rooms.length === 0) {
      return { success: false, error: 'Failed to generate any rooms' };
    }

    // Build rooms: walls + colored floor
    rooms.forEach(room => {
      // Draw walls
      for (let x = room.x; x < room.x + room.width; x++) {
        // Top wall
        grid[room.y][x] = {
          floor: { type: defaultFloor, config: {} },
          object: { type: wallTile, config: {} }
        };
        // Bottom wall
        grid[room.y + room.height - 1][x] = {
          floor: { type: defaultFloor, config: {} },
          object: { type: wallTile, config: {} }
        };
      }
      for (let y = room.y; y < room.y + room.height; y++) {
        // Left wall
        grid[y][room.x] = {
          floor: { type: defaultFloor, config: {} },
          object: { type: wallTile, config: {} }
        };
        // Right wall
        grid[y][room.x + room.width - 1] = {
          floor: { type: defaultFloor, config: {} },
          object: { type: wallTile, config: {} }
        };
      }

      // Fill interior with colored floor
      for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
          grid[y][x] = {
            floor: { type: defaultFloor, config: { floorColor: room.floorColor } },
            object: null
          };
        }
      }
      console.log(`Room filled with color: ${room.floorColor}, center tile:`, grid[room.y + 1][room.x + 1]);
    });

    // Place doors to connect rooms
    rooms.forEach((room, roomIdx) => {
      const doorsToPlace = Math.floor(random() * (maxDoorsPerRoom - minDoorsPerRoom + 1)) + minDoorsPerRoom;

      for (let d = 0; d < doorsToPlace; d++) {
        // Try to place door on a wall
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 30) {
          // Pick random wall
          const side = Math.floor(random() * 4); // 0=top, 1=right, 2=bottom, 3=left
          let doorX, doorY;

          switch (side) {
            case 0: // Top wall
              doorX = room.x + 1 + Math.floor(random() * (room.width - 2));
              doorY = room.y;
              break;
            case 1: // Right wall
              doorX = room.x + room.width - 1;
              doorY = room.y + 1 + Math.floor(random() * (room.height - 2));
              break;
            case 2: // Bottom wall
              doorX = room.x + 1 + Math.floor(random() * (room.width - 2));
              doorY = room.y + room.height - 1;
              break;
            case 3: // Left wall
              doorX = room.x;
              doorY = room.y + 1 + Math.floor(random() * (room.height - 2));
              break;
          }

          // Check if there's a wall there and no door yet
          if (grid[doorY][doorX].object?.type === wallTile) {
            // Check if adjacent cell (outside room) is walkable floor
            let adjacentWalkable = false;
            const dx = side === 1 ? 1 : side === 3 ? -1 : 0;
            const dy = side === 0 ? -1 : side === 2 ? 1 : 0;
            const adjX = doorX + dx;
            const adjY = doorY + dy;

            if (adjX >= offsetX && adjX < offsetX + mapSize &&
                adjY >= offsetY && adjY < offsetY + mapSize) {
              const adjCell = grid[adjY][adjX];
              adjacentWalkable = adjCell.floor?.type === defaultFloor && !adjCell.object;
            }

            if (adjacentWalkable) {
              // Place door
              const lockColors = theme.getLockColors?.() || { red: '#ff0000' };
              const lockColorKeys = Object.keys(lockColors);
              const lockColor = lockColorKeys[Math.floor(random() * lockColorKeys.length)];

              grid[doorY][doorX] = {
                floor: { type: defaultFloor, config: {} },
                object: { type: doorTile, config: { lockColor } }
              };

              room.doors.push({ x: doorX, y: doorY, lockColor });
              placed = true;
            }
          }

          attempts++;
        }
      }
    });

    // Place start and exit in different rooms
    const startRoom = rooms[0];
    const exitRoom = rooms[rooms.length - 1];

    const startPos = {
      x: Math.floor(startRoom.x + startRoom.width / 2),
      y: Math.floor(startRoom.y + startRoom.height / 2)
    };
    const exitPos = {
      x: Math.floor(exitRoom.x + exitRoom.width / 2),
      y: Math.floor(exitRoom.y + exitRoom.height / 2)
    };

    if (startTile) {
      grid[startPos.y][startPos.x] = {
        floor: { type: startTile, config: {} },
        object: null
      };
    }

    if (exitTile) {
      grid[exitPos.y][exitPos.x] = {
        floor: { type: exitTile, config: {} },
        object: null
      };
    }

    // Place elements in rooms
    rooms.forEach((room, roomIndex) => {
      const isStartRoom = roomIndex === 0;
      const isExitRoom = roomIndex === rooms.length - 1;

      const elementCount = Math.floor(random() * (maxElementsPerRoom - minElementsPerRoom + 1)) + minElementsPerRoom;

      for (let i = 0; i < elementCount; i++) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 30) {
          // Random position in room interior
          const x = room.x + 1 + Math.floor(random() * (room.width - 2));
          const y = room.y + 1 + Math.floor(random() * (room.height - 2));

          // Don't place on start/exit
          if ((isStartRoom && x === startPos.x && y === startPos.y) ||
              (isExitRoom && x === exitPos.x && y === exitPos.y)) {
            attempts++;
            continue;
          }

          // Check if empty
          if (!grid[y][x].object && grid[y][x].floor.type !== 'empty') {
            // Choose random element type
            const rand = random();
            let elementType;

            if (rand < 0.35 && itemTiles.length > 0) {
              // 35% chance for item
              elementType = itemTiles[Math.floor(random() * itemTiles.length)];
            } else if (rand < 0.65 && obstacleTiles.length > 0) {
              // 30% chance for obstacle
              elementType = obstacleTiles[Math.floor(random() * obstacleTiles.length)];
            } else if (rand < 0.85 && hazardTiles.length > 0) {
              // 20% chance for hazard
              elementType = hazardTiles[Math.floor(random() * hazardTiles.length)];
            } else if (objectTiles.length > 0) {
              // 15% chance for any object
              elementType = objectTiles[Math.floor(random() * objectTiles.length)];
            }

            if (elementType) {
              const tileDef = TILE_TYPES[elementType];

              // Check placement constraints (e.g., camera must be on wall)
              if (tileDef.attachToWall) {
                // Skip - can't place attachToWall items in room interior
                attempts++;
                continue;
              }

              if (tileDef && !tileDef.unique) {
                grid[y][x].object = { type: elementType, config: {} };
                placed = true;
              }
            }
          }

          attempts++;
        }
      }

      // Place wall-attached items (like cameras) on room walls
      const wallAttachedTiles = objectTiles.filter(type => TILE_TYPES[type]?.attachToWall);
      if (wallAttachedTiles.length > 0 && random() > 0.5) {
        // 50% chance to place a wall-attached item in this room
        const elementType = wallAttachedTiles[Math.floor(random() * wallAttachedTiles.length)];

        // Try to place on a wall (not a door)
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 20) {
          const side = Math.floor(random() * 4);
          let wx, wy;

          switch (side) {
            case 0: // Top wall
              wx = room.x + 1 + Math.floor(random() * (room.width - 2));
              wy = room.y;
              break;
            case 1: // Right wall
              wx = room.x + room.width - 1;
              wy = room.y + 1 + Math.floor(random() * (room.height - 2));
              break;
            case 2: // Bottom wall
              wx = room.x + 1 + Math.floor(random() * (room.width - 2));
              wy = room.y + room.height - 1;
              break;
            case 3: // Left wall
              wx = room.x;
              wy = room.y + 1 + Math.floor(random() * (room.height - 2));
              break;
          }

          // Check if it's a wall (not door)
          if (grid[wy][wx].object?.type === wallTile) {
            grid[wy][wx].object = { type: elementType, config: {} };
            placed = true;
          }

          attempts++;
        }
      }
    });

    // Place keys for doors
    const allDoors = rooms.flatMap(r => r.doors);
    const lockColorCounts = {};
    allDoors.forEach(door => {
      lockColorCounts[door.lockColor] = (lockColorCounts[door.lockColor] || 0) + 1;
    });

    // Place at least one key for each lock color
    Object.keys(lockColorCounts).forEach(lockColor => {
      const keyTile = getKeyTile(TILE_TYPES);
      if (!keyTile) return;

      // Try to place key in a random room (not exit room)
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 50) {
        const roomIdx = Math.floor(random() * (rooms.length - 1)); // Not in exit room
        const room = rooms[roomIdx];

        const x = room.x + 1 + Math.floor(random() * (room.width - 2));
        const y = room.y + 1 + Math.floor(random() * (room.height - 2));

        if (!grid[y][x].object) {
          grid[y][x].object = { type: keyTile, config: { lockColor } };
          placed = true;
        }

        attempts++;
      }
    });

    // Generate missions based on placed items and theme capabilities
    const missions = generateMissions(grid, theme, allDoors.length > 0);

    return {
      success: true,
      grid,
      missions,
      roomCount: rooms.length,
      mapSize,
    };

  } catch (error) {
    console.error('Random map generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get floor colors from theme
 */
function getFloorColors(theme) {
  // Try to get FLOOR_COLORS from theme (bank theme has this)
  const floorColors = theme.getFloorColors?.();
  if (floorColors && Object.keys(floorColors).length > 0) {
    // Theme has floor color definitions - use the color keys
    const colorKeys = Object.keys(floorColors);
    console.log('Using theme floor color keys:', colorKeys);
    return colorKeys;
  }

  // Fallback: Get lock colors and extract the hex color values
  const lockColors = theme.getLockColors?.();
  if (lockColors) {
    const colors = Object.values(lockColors).map(colorObj => colorObj.color);
    console.log('Using theme lock colors for floors (hex):', colors);
    return colors;
  }

  // Final fallback to default hex colors
  const colors = [
    '#8b7355', // Brown
    '#6b8e7a', // Green
    '#7a6b8e', // Purple
    '#8e7a6b', // Tan
    '#6b7a8e', // Blue-gray
  ];
  console.log('Using default floor colors (hex):', colors);
  return colors;
}

/**
 * Get wall tile
 */
function getWallTile(TILE_TYPES) {
  if (TILE_TYPES['wall']) return 'wall';
  if (TILE_TYPES['tree']) return 'tree'; // Forest theme uses trees as walls

  // Find first non-walkable, non-unique object
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (def.layer === 'object' && !def.walkable && !def.unique && !def.isItemTile) {
      return type;
    }
  }

  return 'wall'; // Fallback
}

/**
 * Get door tile
 */
function getDoorTile(TILE_TYPES) {
  if (TILE_TYPES['door-key']) return 'door-key';
  if (TILE_TYPES['door']) return 'door';

  // Find door-like tile
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (type.includes('door') && def.layer === 'object') {
      return type;
    }
  }

  return null;
}

/**
 * Get key tile
 */
function getKeyTile(TILE_TYPES) {
  if (TILE_TYPES['item-key']) return 'item-key';
  if (TILE_TYPES['key']) return 'key';

  // Find key-like tile
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (type.includes('key') && def.isItemTile) {
      return type;
    }
  }

  return null;
}

/**
 * Get walkable floor tiles from theme
 */
function getDefaultFloor(TILE_TYPES) {
  // Look for 'ground' or 'floor' first
  if (TILE_TYPES['ground']) return 'ground';
  if (TILE_TYPES['floor']) return 'floor';

  // Otherwise find first walkable floor
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (def.layer === 'floor' && def.walkable && type !== 'empty') {
      return type;
    }
  }

  return 'ground'; // Fallback
}

/**
 * Get object tiles (non-floor)
 */
function getObjectTiles(TILE_TYPES) {
  const tiles = [];
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (def.layer === 'object' &&
        !def.unique &&
        type !== 'wall' &&
        !type.includes('door')) {
      tiles.push(type);
    }
  }
  return tiles;
}

/**
 * Get collectible item tiles
 */
function getItemTiles(TILE_TYPES) {
  const tiles = [];
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (def.layer === 'object' &&
        def.isItemTile &&
        !def.unique &&
        !type.includes('key')) { // Keys handled separately
      tiles.push(type);
    }
  }
  return tiles;
}

/**
 * Get obstacle tiles (non-walkable, non-item objects)
 */
function getObstacleTiles(TILE_TYPES) {
  const tiles = [];
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (def.layer === 'object' &&
        !def.isItemTile &&
        !def.walkable &&
        !def.unique &&
        !def.attachToWall &&
        type !== 'wall' &&
        !type.includes('door') &&
        def.category !== 'hazard') {
      tiles.push(type);
    }
  }
  return tiles;
}

/**
 * Get hazard tiles
 */
function getHazardTiles(TILE_TYPES) {
  const tiles = [];
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (def.category === 'hazard' && !def.unique) {
      tiles.push(type);
    }
  }
  return tiles;
}

/**
 * Get start tile
 */
function getStartTile(TILE_TYPES) {
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (def.unique && (type.includes('start') || type.includes('campfire') || type.includes('spawn'))) {
      return type;
    }
  }
  return null;
}

/**
 * Get exit tile
 */
function getExitTile(TILE_TYPES) {
  for (const [type, def] of Object.entries(TILE_TYPES)) {
    if (def.unique && (type.includes('exit') || type.includes('car') || type.includes('escape'))) {
      return type;
    }
  }
  return null;
}

/**
 * Generate missions based on placed items and theme capabilities
 */
function generateMissions(grid, theme, hasDoors) {
  const missions = [];
  const missionTypes = theme.getMissionTypes?.() || ['collect', 'rescue', 'escape'];

  // Count items on map
  const itemCounts = {};
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (cell.object?.type?.startsWith('item-')) {
        const itemType = cell.object.type.replace('item-', '');
        if (itemType !== 'key') { // Don't include keys as collection missions
          itemCounts[itemType] = (itemCounts[itemType] || 0) + 1;
        }
      }
      if (cell.object?.type === 'friend') {
        itemCounts['friend'] = (itemCounts['friend'] || 0) + 1;
      }
    }
  }

  // Add collect missions for some items
  if (missionTypes.includes('collect')) {
    const collectibleItems = Object.keys(itemCounts).filter(item => item !== 'friend');
    const itemsToCollect = Math.min(2, collectibleItems.length);

    for (let i = 0; i < itemsToCollect; i++) {
      if (collectibleItems[i]) {
        missions.push({
          type: 'collect',
          targetId: collectibleItems[i],
          targetAmount: 1
        });
      }
    }
  }

  // Add rescue mission if friends present
  if (missionTypes.includes('rescue') && itemCounts['friend'] > 0) {
    missions.push({
      type: 'rescue',
      targetAmount: Math.min(2, itemCounts['friend'])
    });
  }

  // Always add escape mission
  if (missionTypes.includes('escape')) {
    missions.push({
      type: 'escape'
    });
  }

  return missions;
}

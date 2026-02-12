// Procedural Map Generator for Escape Room Builder
// Creates room layouts with walls, varied floor tiles, and corridors

import { GRID_COLS, GRID_ROWS } from '../utils/constants';

// Seeded random number generator for reproducible results
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min, max) {
    return this.next() * (max - min) + min;
  }

  pick(arr) {
    if (arr.length === 0) return null;
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// Default generation config
const DEFAULT_CONFIG = {
  // Map size (the actual playable area)
  mapWidth: 25,
  mapHeight: 20,

  // Where to place the map on the grid
  offsetX: 10,
  offsetY: 10,

  // Room settings
  minRoomSize: 4,   // Minimum room dimension
  maxSplits: 6,     // How many times to split (more = more rooms)

  // Decoration
  placeStartExit: true,
  decorationDensity: 0.03,

  // Door settings
  doorChance: 1.0,  // Always place doors (rooms should be enclosed)
  lockColors: ['red', 'blue', 'green', 'yellow'],

  // Terrain features
  waterPoolChance: 0.4,   // Chance to add a water pool to a room
  snowPatchChance: 0.3,   // Chance to add a snow patch to a room

  // Floor color variety
  floorColors: ['gray', 'brown', 'beige', 'darkGray'],

  // Tile types
  tiles: {
    empty: 'empty',
    floor: 'ground',
    wall: 'tree',
    start: 'campfire',
    exit: 'car',
    door: 'door-key',
    water: 'water',
    snow: 'snow',
  },

  // Items to scatter
  decorations: [
    { type: 'item-key', weight: 2 },
    { type: 'item-axe', weight: 1 },
    { type: 'item-rope', weight: 1 },
    { type: 'item-bucket', weight: 1 },
    { type: 'item-sweater', weight: 1 },
    { type: 'fire', weight: 0.5 },
  ],
};

/**
 * Generate a procedural map with rooms defined by walls
 */
export function generateMap(options = {}) {
  const seed = options.seed ?? Date.now();
  const rng = new SeededRandom(seed);

  const config = { ...DEFAULT_CONFIG, ...options.config };

  // Adapt to theme
  if (options.theme) {
    adaptConfigToTheme(config, options.theme);
  }

  // Initialize grid with empty
  const grid = createEmptyGrid(config.tiles.empty);

  // Generate the room structure using BSP
  const rooms = generateRoomsBSP(rng, config);

  // Fill the entire map area with walls first
  fillAreaWithWalls(grid, config);

  // Carve out rooms (floor tiles)
  for (const room of rooms) {
    carveRoom(grid, room, rng, config);
  }

  // Add doorways between adjacent rooms (with doors)
  const doorways = addDoorways(grid, rooms, rng, config);

  // Place start and exit first (so we know which rooms to avoid for hazards)
  let startRoom = null;
  let exitRoom = null;
  if (config.placeStartExit && rooms.length >= 2) {
    const result = placeStartAndExit(grid, rooms, rng, config);
    startRoom = result.startRoom;
    exitRoom = result.exitRoom;
  }

  // Add terrain features (water pools, snow patches)
  addTerrainFeatures(grid, rooms, rng, config, startRoom, exitRoom);

  // Add decorations
  addDecorations(grid, rooms, rng, config);

  // Place keys for doors
  placeKeysForDoors(grid, rooms, doorways, rng, config);

  return grid;
}

/**
 * Adapt config to theme's tile types
 */
function adaptConfigToTheme(config, theme) {
  const tileTypes = theme.getTileTypes?.() || {};

  // Map generic tiles to theme-specific
  const mappings = {
    floor: ['ground', 'floor'],
    wall: ['tree', 'wall'],
    start: ['campfire', 'start', 'spawn'],
    exit: ['car', 'exit'],
  };

  for (const [key, candidates] of Object.entries(mappings)) {
    for (const candidate of candidates) {
      if (tileTypes[candidate]) {
        config.tiles[key] = candidate;
        break;
      }
    }
  }

  // Find door types and their matching key types
  // Look for door-key/item-key pair or door-card/item-card pair
  config.doorTypes = [];

  if (tileTypes['door-key'] && tileTypes['item-key']) {
    config.doorTypes.push({ door: 'door-key', key: 'item-key' });
  }
  if (tileTypes['door-card'] && tileTypes['item-card']) {
    config.doorTypes.push({ door: 'door-card', key: 'item-card' });
  }
  if (tileTypes['door-chemical'] && tileTypes['item-chemical']) {
    config.doorTypes.push({ door: 'door-chemical', key: 'item-chemical' });
  }

  // Fallback to first door type found
  if (config.doorTypes.length === 0) {
    const doorTile = Object.keys(tileTypes).find(k => k.startsWith('door-'));
    if (doorTile) {
      const keyType = doorTile.replace('door-', 'item-');
      if (tileTypes[keyType]) {
        config.doorTypes.push({ door: doorTile, key: keyType });
      }
    }
  }

  // Set primary door type for backwards compat
  config.tiles.door = config.doorTypes[0]?.door || null;

  // Only enable water/snow if theme has them
  config.tiles.water = tileTypes.water ? 'water' : null;
  config.tiles.snow = tileTypes.snow ? 'snow' : null;

  // Get floor colors from theme
  const floorColors = theme.getFloorColors?.();
  if (floorColors && Object.keys(floorColors).length > 0) {
    config.floorColors = Object.keys(floorColors);
  }

  // Get decorations from theme - only items that exist in this theme
  // Exclude key/card items since we place them separately for doors
  const excludeItems = new Set(config.doorTypes.map(dt => dt.key));
  const themeDecorations = [];
  const itemTiles = Object.entries(tileTypes).filter(([type, def]) =>
    def.isItemTile && !excludeItems.has(type)
  );
  for (const [type] of itemTiles) {
    themeDecorations.push({ type, weight: 1 });
  }

  // Add hazards with lower weight
  const hazardTypes = ['fire', 'toxic_spill', 'radiation', 'broken-glass'];
  for (const hazard of hazardTypes) {
    if (tileTypes[hazard]) {
      themeDecorations.push({ type: hazard, weight: 0.3 });
    }
  }

  if (themeDecorations.length > 0) {
    config.decorations = themeDecorations;
  }
}

/**
 * Create empty grid
 */
function createEmptyGrid(emptyType) {
  const grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    const row = [];
    for (let x = 0; x < GRID_COLS; x++) {
      row.push({
        floor: { type: emptyType, config: {} },
        object: null
      });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Fill the map area with wall tiles (as the base)
 */
function fillAreaWithWalls(grid, config) {
  const { offsetX, offsetY, mapWidth, mapHeight, tiles } = config;

  for (let y = offsetY; y < offsetY + mapHeight; y++) {
    for (let x = offsetX; x < offsetX + mapWidth; x++) {
      if (isInBounds(x, y)) {
        // Floor is ground, wall is an object on top
        grid[y][x].floor = { type: tiles.floor, config: {} };
        grid[y][x].object = { type: tiles.wall, config: {} };
      }
    }
  }
}

/**
 * BSP (Binary Space Partitioning) room generation
 * Returns array of room rectangles
 */
function generateRoomsBSP(rng, config) {
  const { offsetX, offsetY, mapWidth, mapHeight, minRoomSize, maxSplits } = config;

  // Start with the whole area (with 1-tile border for outer walls)
  const initialNode = {
    x: offsetX + 1,
    y: offsetY + 1,
    width: mapWidth - 2,
    height: mapHeight - 2,
  };

  // Recursively split
  const leaves = splitNode(initialNode, rng, minRoomSize, maxSplits, 0);

  // Convert leaves to rooms (slightly smaller to leave wall space)
  const rooms = leaves.map((leaf, index) => ({
    x: leaf.x,
    y: leaf.y,
    width: leaf.width,
    height: leaf.height,
    id: index,
    color: null, // Will be assigned later
  }));

  return rooms;
}

/**
 * Recursively split a node into smaller rooms
 * Leaves a 1-tile wall gap between resulting rooms
 */
function splitNode(node, rng, minSize, maxSplits, depth) {
  // Stop conditions - need room for 2 rooms + 1 wall between
  const minSplitSize = minSize * 2 + 2; // 2 rooms of minSize + wall between + walls on sides

  if (depth >= maxSplits) return [node];
  if (node.width < minSplitSize && node.height < minSplitSize) return [node];

  // Decide split direction
  let splitHorizontal;
  if (node.width < minSplitSize) {
    splitHorizontal = true; // Can only split horizontally
  } else if (node.height < minSplitSize) {
    splitHorizontal = false; // Can only split vertically
  } else {
    // Prefer splitting the longer dimension
    splitHorizontal = node.height > node.width ? true : (node.height < node.width ? false : rng.next() < 0.5);
  }

  if (splitHorizontal) {
    // Split horizontally (create top and bottom with wall between)
    if (node.height < minSplitSize) return [node];

    // splitY is where the wall goes
    const splitY = rng.int(node.y + minSize + 1, node.y + node.height - minSize - 2);
    const top = { x: node.x, y: node.y, width: node.width, height: splitY - node.y };
    // Leave 1 row for wall, then bottom starts
    const bottom = { x: node.x, y: splitY + 1, width: node.width, height: node.y + node.height - splitY - 1 };

    // Store the wall position for doorway creation
    top.wallBelow = splitY;
    bottom.wallAbove = splitY;

    return [
      ...splitNode(top, rng, minSize, maxSplits, depth + 1),
      ...splitNode(bottom, rng, minSize, maxSplits, depth + 1),
    ];
  } else {
    // Split vertically (create left and right with wall between)
    if (node.width < minSplitSize) return [node];

    // splitX is where the wall goes
    const splitX = rng.int(node.x + minSize + 1, node.x + node.width - minSize - 2);
    const left = { x: node.x, y: node.y, width: splitX - node.x, height: node.height };
    // Leave 1 column for wall, then right starts
    const right = { x: splitX + 1, y: node.y, width: node.x + node.width - splitX - 1, height: node.height };

    // Store the wall position for doorway creation
    left.wallRight = splitX;
    right.wallLeft = splitX;

    return [
      ...splitNode(left, rng, minSize, maxSplits, depth + 1),
      ...splitNode(right, rng, minSize, maxSplits, depth + 1),
    ];
  }
}

/**
 * Carve out a room (remove wall objects, set floor color)
 */
function carveRoom(grid, room, rng, config) {
  // Pick a random floor color for this room
  const floorColor = rng.pick(config.floorColors) || 'gray';
  room.color = floorColor;

  // Carve interior (leave 1-tile border as walls)
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (isInBounds(x, y)) {
        grid[y][x].floor = {
          type: config.tiles.floor,
          config: { floorColor }
        };
        grid[y][x].object = null; // Remove wall
      }
    }
  }
}

/**
 * Add doorways between adjacent rooms, optionally with doors
 * Returns list of doorways with their info
 */
function addDoorways(grid, rooms, rng, config) {
  const doorways = [];

  // Find pairs of adjacent rooms and add doorways
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const doorwayPositions = findDoorwayBetween(rooms[i], rooms[j], rng);
      if (doorwayPositions) {
        const floorColor = rooms[i].color || 'gray';

        // Carve the doorway (remove wall, add floor)
        for (const pos of doorwayPositions) {
          if (isInBounds(pos.x, pos.y)) {
            grid[pos.y][pos.x].floor = {
              type: config.tiles.floor,
              config: { floorColor }
            };
            grid[pos.y][pos.x].object = null;
          }
        }

        // Maybe place a door
        const hasDoor = rng.next() < config.doorChance && config.doorTypes.length > 0;
        let lockColor = null;
        let doorType = null;

        if (hasDoor) {
          // Pick a random door type from available ones
          const doorTypeInfo = rng.pick(config.doorTypes);
          doorType = doorTypeInfo;
          lockColor = rng.pick(config.lockColors);

          // Place door on the first position of the doorway
          const doorPos = doorwayPositions[0];
          if (isInBounds(doorPos.x, doorPos.y)) {
            grid[doorPos.y][doorPos.x].object = {
              type: doorTypeInfo.door,
              config: { lockColor }
            };
          }
        }

        doorways.push({
          positions: doorwayPositions,
          roomA: rooms[i],
          roomB: rooms[j],
          hasDoor,
          lockColor,
          doorType
        });
      }
    }
  }

  return doorways;
}

/**
 * Find a doorway position between two rooms if they're adjacent
 * Returns doorway positions through the wall between them
 */
function findDoorwayBetween(roomA, roomB, rng) {
  // Check if rooms share a wall (with 1-tile wall gap between them)

  const aBottom = roomA.y + roomA.height;
  const bBottom = roomB.y + roomB.height;
  const aRight = roomA.x + roomA.width;
  const bRight = roomB.x + roomB.width;

  // roomA is above roomB (wall row between them)
  if (aBottom === roomB.y - 1) {
    const overlapStart = Math.max(roomA.x, roomB.x);
    const overlapEnd = Math.min(aRight, bRight);
    if (overlapEnd - overlapStart >= 1) {
      const doorX = rng.int(overlapStart, overlapEnd - 1);
      const wallY = aBottom; // The wall row
      return [{ x: doorX, y: wallY }];
    }
  }

  // roomB is above roomA
  if (bBottom === roomA.y - 1) {
    const overlapStart = Math.max(roomA.x, roomB.x);
    const overlapEnd = Math.min(aRight, bRight);
    if (overlapEnd - overlapStart >= 1) {
      const doorX = rng.int(overlapStart, overlapEnd - 1);
      const wallY = bBottom;
      return [{ x: doorX, y: wallY }];
    }
  }

  // roomA is left of roomB
  if (aRight === roomB.x - 1) {
    const overlapStart = Math.max(roomA.y, roomB.y);
    const overlapEnd = Math.min(aBottom, bBottom);
    if (overlapEnd - overlapStart >= 1) {
      const doorY = rng.int(overlapStart, overlapEnd - 1);
      const wallX = aRight;
      return [{ x: wallX, y: doorY }];
    }
  }

  // roomB is left of roomA
  if (bRight === roomA.x - 1) {
    const overlapStart = Math.max(roomA.y, roomB.y);
    const overlapEnd = Math.min(aBottom, bBottom);
    if (overlapEnd - overlapStart >= 1) {
      const doorY = rng.int(overlapStart, overlapEnd - 1);
      const wallX = bRight;
      return [{ x: wallX, y: doorY }];
    }
  }

  return null; // Rooms not adjacent
}

/**
 * Place start and exit in different rooms
 * Returns { startRoom, exitRoom }
 */
function placeStartAndExit(grid, rooms, rng, config) {
  if (rooms.length < 2) return { startRoom: null, exitRoom: null };

  // Find two rooms that are far apart
  let maxDist = 0;
  let startRoom = rooms[0];
  let exitRoom = rooms[rooms.length - 1];

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const dist = roomDistance(rooms[i], rooms[j]);
      if (dist > maxDist) {
        maxDist = dist;
        startRoom = rooms[i];
        exitRoom = rooms[j];
      }
    }
  }

  // Mark rooms
  startRoom.isStart = true;
  exitRoom.isExit = true;

  // Place start in startRoom
  const startX = Math.floor(startRoom.x + startRoom.width / 2);
  const startY = Math.floor(startRoom.y + startRoom.height / 2);
  if (isInBounds(startX, startY)) {
    grid[startY][startX].floor = {
      type: config.tiles.start,
      config: { floorColor: startRoom.color }
    };
  }

  // Place exit in exitRoom
  const exitX = Math.floor(exitRoom.x + exitRoom.width / 2);
  const exitY = Math.floor(exitRoom.y + exitRoom.height / 2);
  if (isInBounds(exitX, exitY)) {
    grid[exitY][exitX].floor = {
      type: config.tiles.exit,
      config: { floorColor: exitRoom.color }
    };
  }

  return { startRoom, exitRoom };
}

function roomDistance(a, b) {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

/**
 * Add terrain features like water pools and snow patches
 */
function addTerrainFeatures(grid, rooms, rng, config, startRoom, exitRoom) {
  // Get rooms that aren't start or exit (safe for hazards)
  const safeRooms = rooms.filter(r => !r.isStart && !r.isExit);

  rng.shuffle(safeRooms);

  let waterRoom = null;
  let snowRoom = null;

  for (const room of safeRooms) {
    // Skip small rooms
    if (room.width < 5 || room.height < 5) continue;

    // Try to add water pool
    if (!waterRoom && config.tiles.water && rng.next() < config.waterPoolChance) {
      addWaterPool(grid, room, rng, config);
      waterRoom = room;
      continue; // Don't add snow to same room
    }

    // Try to add snow patch
    if (!snowRoom && config.tiles.snow && rng.next() < config.snowPatchChance) {
      addSnowPatch(grid, room, rng, config);
      snowRoom = room;
    }

    // Stop if we've added both
    if (waterRoom && snowRoom) break;
  }

  // Place helpful items for terrain features
  // Place rope + wood (for raft) if there's water
  if (waterRoom) {
    const otherRooms = rooms.filter(r => r !== waterRoom && !r.isExit);
    if (otherRooms.length > 0) {
      placeItemInRoom(grid, rng.pick(otherRooms), 'item-rope', rng, config);
      placeItemInRoom(grid, rng.pick(otherRooms), 'item-wood', rng, config);
    }
  }

  // Place sweater if there's snow
  if (snowRoom) {
    const otherRooms = rooms.filter(r => r !== snowRoom && !r.isExit);
    if (otherRooms.length > 0) {
      placeItemInRoom(grid, rng.pick(otherRooms), 'item-sweater', rng, config);
    }
  }
}

/**
 * Place a specific item in a room
 */
function placeItemInRoom(grid, room, itemType, rng, config) {
  const candidates = [];
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (!isInBounds(x, y)) continue;
      const cell = grid[y][x];
      if (cell.floor.type === config.tiles.floor && !cell.object) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) return false;

  const pos = rng.pick(candidates);
  grid[pos.y][pos.x].object = { type: itemType, config: {} };
  return true;
}

/**
 * Add an organic-shaped water pool to a room
 */
function addWaterPool(grid, room, rng, config) {
  // Start with a center point and grow outward organically
  const centerX = room.x + Math.floor(room.width / 2) + rng.int(-1, 1);
  const centerY = room.y + Math.floor(room.height / 2) + rng.int(-1, 1);

  // Use a set to track water tiles
  const waterTiles = new Set();
  const toProcess = [[centerX, centerY]];
  const maxTiles = rng.int(4, Math.min(10, Math.floor(room.width * room.height * 0.3)));

  // Grow the pool organically
  while (toProcess.length > 0 && waterTiles.size < maxTiles) {
    const [x, y] = toProcess.shift();
    const key = `${x},${y}`;

    if (waterTiles.has(key)) continue;

    // Check bounds - stay inside room with margin
    if (x < room.x + 1 || x >= room.x + room.width - 1) continue;
    if (y < room.y + 1 || y >= room.y + room.height - 1) continue;

    // Check if valid floor
    if (!isInBounds(x, y)) continue;
    const cell = grid[y][x];
    if (cell.floor.type !== config.tiles.floor || cell.object) continue;

    // Add this tile
    waterTiles.add(key);

    // Maybe expand to neighbors (higher chance = more blobby)
    const neighbors = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
    for (const [nx, ny] of neighbors) {
      if (rng.next() < 0.7) { // 70% chance to expand
        toProcess.push([nx, ny]);
      }
    }
  }

  // Place the water tiles
  for (const key of waterTiles) {
    const [x, y] = key.split(',').map(Number);
    grid[y][x].floor = { type: config.tiles.water, config: {} };
  }

  room.hasWater = waterTiles.size > 0;
}

/**
 * Add an organic-shaped snow patch to a room
 */
function addSnowPatch(grid, room, rng, config) {
  // Pick a corner or edge to start from
  const corners = [
    [room.x + 1, room.y + 1], // top-left
    [room.x + room.width - 2, room.y + 1], // top-right
    [room.x + 1, room.y + room.height - 2], // bottom-left
    [room.x + room.width - 2, room.y + room.height - 2], // bottom-right
  ];
  const [startX, startY] = rng.pick(corners);

  // Use cellular automata-like growth
  const snowTiles = new Set();
  const toProcess = [[startX, startY]];
  const maxTiles = rng.int(5, Math.min(12, Math.floor(room.width * room.height * 0.35)));

  while (toProcess.length > 0 && snowTiles.size < maxTiles) {
    const [x, y] = toProcess.shift();
    const key = `${x},${y}`;

    if (snowTiles.has(key)) continue;

    // Check bounds - stay inside room
    if (x < room.x || x >= room.x + room.width) continue;
    if (y < room.y || y >= room.y + room.height) continue;

    // Check if valid floor
    if (!isInBounds(x, y)) continue;
    const cell = grid[y][x];
    if (cell.floor.type !== config.tiles.floor || cell.object) continue;

    // Add this tile
    snowTiles.add(key);

    // Expand preferentially toward the starting corner for a "creeping" effect
    const neighbors = [[x-1, y], [x+1, y], [x, y-1], [x, y+1]];
    rng.shuffle(neighbors);
    for (const [nx, ny] of neighbors) {
      // Higher chance to expand if closer to start
      const distFromStart = Math.abs(nx - startX) + Math.abs(ny - startY);
      const expandChance = Math.max(0.3, 0.8 - distFromStart * 0.1);
      if (rng.next() < expandChance) {
        toProcess.push([nx, ny]);
      }
    }
  }

  // Place the snow tiles
  for (const key of snowTiles) {
    const [x, y] = key.split(',').map(Number);
    grid[y][x].floor = { type: config.tiles.snow, config: {} };
  }

  room.hasSnow = snowTiles.size > 0;
}

/**
 * Place keys for doors in accessible locations
 */
function placeKeysForDoors(grid, rooms, doorways, rng, config) {
  // Group doors by door type and lock color
  const doorGroups = {};
  for (const dw of doorways) {
    if (dw.hasDoor && dw.lockColor && dw.doorType) {
      const key = `${dw.doorType.key}:${dw.lockColor}`;
      if (!doorGroups[key]) {
        doorGroups[key] = { keyType: dw.doorType.key, lockColor: dw.lockColor, doors: [] };
      }
      doorGroups[key].doors.push(dw);
    }
  }

  // For each group, place a key somewhere
  for (const group of Object.values(doorGroups)) {
    // Place key in a room that isn't the exit (preferably start room for accessibility)
    const candidateRooms = rooms.filter(r => !r.isExit);
    // Prefer start room first, then shuffle rest
    candidateRooms.sort((a, b) => (b.isStart ? 1 : 0) - (a.isStart ? 1 : 0));

    for (const room of candidateRooms) {
      const placed = placeKeyInRoom(grid, room, group.keyType, group.lockColor, rng, config);
      if (placed) break;
    }
  }
}

/**
 * Place a key in a room
 */
function placeKeyInRoom(grid, room, keyType, lockColor, rng, config) {
  // Find empty floor tiles (no object, not water/snow/start/exit)
  const candidates = [];
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (!isInBounds(x, y)) continue;
      const cell = grid[y][x];
      if (cell.floor.type === config.tiles.floor && !cell.object) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) return false;

  // Pick random position using seeded rng
  const pos = rng.pick(candidates);
  grid[pos.y][pos.x].object = {
    type: keyType,
    config: { lockColor }
  };

  return true;
}

/**
 * Add decorations to rooms
 */
function addDecorations(grid, rooms, rng, config) {
  if (!config.decorations || config.decorations.length === 0) return;

  // Collect all floor tiles (no object, not start/exit)
  const candidates = [];
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (!isInBounds(x, y)) continue;
        const cell = grid[y][x];
        if (cell.object === null &&
            cell.floor.type !== config.tiles.start &&
            cell.floor.type !== config.tiles.exit) {
          candidates.push({ x, y });
        }
      }
    }
  }

  const numDecorations = Math.floor(candidates.length * config.decorationDensity);
  rng.shuffle(candidates);

  const totalWeight = config.decorations.reduce((sum, d) => sum + d.weight, 0);

  for (let i = 0; i < Math.min(numDecorations, candidates.length); i++) {
    const { x, y } = candidates[i];

    // Weighted random selection
    let r = rng.float(0, totalWeight);
    let selected = config.decorations[0];
    for (const dec of config.decorations) {
      r -= dec.weight;
      if (r <= 0) {
        selected = dec;
        break;
      }
    }

    grid[y][x].object = { type: selected.type, config: {} };
  }
}

function isInBounds(x, y) {
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}

/**
 * Get info about generated map
 */
export function getMapInfo(seed) {
  return {
    seed,
    seedDisplay: seed.toString(36).toUpperCase(),
  };
}

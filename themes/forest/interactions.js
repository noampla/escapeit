// Forest theme interactions
// Import flood fill utility (will need to be accessible)
import { floodFillWater } from '../../src/engine/hazards.js';

// Helper functions
function hasItemType(inventory, itemType) {
  return inventory.some(item => item.itemType === itemType);
}

function findItemIndex(inventory, itemType) {
  return inventory.findIndex(item => item.itemType === itemType);
}

// Check if player has sweater (in inventory or worn)
function hasSweater(gameState) {
  const inInventory = gameState.inventory?.some(item => item.itemType === 'sweater');
  const isWearing = gameState.worn?.body === 'sweater';
  return inInventory || isWearing;
}

// Interaction definitions
export const INTERACTIONS = {
  'cut-tree': {
    label: 'Cut Tree',
    duration: 1500,
    requirements: { inventory: ['axe'], tile: 'tree' },
    checkCustom: (gameState, tile, grid, _x, _y) => {
      // Can only chop trees if standing on the same floor type
      // Exception: sweater allows interacting with things on snow from non-snow tiles
      const playerPos = gameState.playerPos;
      if (!playerPos) return true; // Fallback: allow if no player position

      const targetFloor = tile.floor?.type;
      const playerFloor = grid[playerPos.y]?.[playerPos.x]?.floor?.type;

      // Same floor type - always allowed
      if (targetFloor === playerFloor) return true;

      // Different floor types - only allow if target is snow and player has sweater
      if (targetFloor === 'snow' && hasSweater(gameState)) return true;

      return false;
    },
    execute: (gameState, grid, x, y) => {
      // Tree is now an object tile - replace tree object with wood item object
      // Keep the floor layer as-is (could be ground, snow, etc.)
      grid[y][x].object = { type: 'item-wood', config: {} };
      return {
        success: true,
        messageKey: 'treeChopped',
        modifyGrid: true
      };
    }
  },

  'clear-thorny-bush': {
    label: 'Clear Bush',
    duration: 1500,
    requirements: { inventory: ['machete'], tile: 'thorny-bush' },
    execute: (gameState, grid, x, y) => {
      // Replace thorny bush with cleared bush visual
      grid[y][x].object = { type: 'cleared-bush', config: {} };
      return {
        success: true,
        messageKey: 'thornyBushCleared',
        modifyGrid: true
      };
    }
  },

  'fill-bucket': {
    label: 'Fill Bucket',
    duration: 1500,
    requirements: {
      inventory: ['bucket'],
      tileAny: ['water', 'raft'],
      itemState: { itemType: 'bucket', filled: false }
    },
    execute: (gameState, grid, x, y) => {
      // Find empty bucket in inventory
      const bucketIdx = gameState.inventory.findIndex(
        item => item.itemType === 'bucket' && !item.filled
      );

      if (bucketIdx === -1) {
        return { success: false, messageKey: 'noEmptyBucket' };
      }

      // Fill the bucket
      gameState.inventory[bucketIdx] = {
        ...gameState.inventory[bucketIdx],
        filled: true
      };

      return {
        success: true,
        messageKey: 'bucketFilled',
        modifyInventory: true
      };
    }
  },

  'build-raft': {
    label: 'Build Raft',
    duration: 2000,
    requirements: {
      inventory: ['rope', 'wood'],
      tileAny: ['ground', 'campfire', 'raft']  // Can build on these tiles
    },
    execute: (gameState, grid, x, y) => {
      const ropeIdx = findItemIndex(gameState.inventory, 'rope');
      const woodIdx = findItemIndex(gameState.inventory, 'wood');

      if (ropeIdx === -1 || woodIdx === -1) {
        return { success: false, messageKey: 'needRopeAndWood' };
      }

      // Remove rope and wood, add raft to inventory
      const newInventory = gameState.inventory.filter((_, i) => i !== ropeIdx && i !== woodIdx);
      newInventory.push({ itemType: 'raft', filled: false });
      gameState.inventory = newInventory;

      return {
        success: true,
        messageKey: 'raftBuilt',
        modifyInventory: true
      };
    }
  },

  'place-raft': {
    label: 'Place Raft',
    duration: 1500,
    requirements: {
      inventory: ['raft'],
      tile: 'water'
    },
    execute: (gameState, grid, x, y) => {
      // Find raft in inventory
      const raftIdx = findItemIndex(gameState.inventory, 'raft');
      if (raftIdx === -1) {
        return { success: false, messageKey: 'noRaftInInventory' };
      }

      // Place raft on water tile (object layer)
      grid[y][x].object = { type: 'raft', config: {} };

      // Remove raft from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== raftIdx);

      return {
        success: true,
        messageKey: 'raftPlaced',
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'pickup-raft': {
    label: 'Pick Up Raft',
    duration: 1500,
    requirements: {
      tile: 'raft'
    },
    checkCustom: (gameState, _tile, _grid, x, y) => {
      // Can't pick up the raft you're standing on
      const playerPos = gameState.playerPos;
      if (playerPos && playerPos.x === x && playerPos.y === y) {
        return false; // Standing on this raft, can't pick it up
      }

      // Check inventory capacity - prevent interaction from starting if full
      const maxInventory = gameState.maxInventory || 10;
      if (gameState.inventory.length >= maxInventory) {
        return false; // Inventory full, can't pick it up
      }

      return true;
    },
    // Return error info when checkCustom fails
    getCheckFailureReason: (gameState, _tile, _grid, x, y) => {
      const playerPos = gameState.playerPos;
      if (playerPos && playerPos.x === x && playerPos.y === y) {
        return { messageKey: 'cantPickupRaftOnIt' };
      }

      const maxInventory = gameState.maxInventory || 10;
      if (gameState.inventory.length >= maxInventory) {
        return { messageKey: 'inventoryFull', messageParams: { max: maxInventory } };
      }

      return null;
    },
    execute: (gameState, grid, x, y) => {
      // Remove raft from object layer (water floor remains)
      grid[y][x].object = null;

      // Add raft to inventory
      gameState.inventory.push({ itemType: 'raft', filled: false });

      return {
        success: true,
        messageKey: 'raftPickedUp',
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'extinguish-fire': {
    label: 'Extinguish Fire',
    duration: 1500,
    requirements: {
      tile: 'fire',
      itemState: { itemType: 'bucket', filled: true }
    },
    execute: (gameState, grid, x, y) => {
      const filledBucketIdx = gameState.inventory.findIndex(
        item => item.itemType === 'bucket' && item.filled
      );

      if (filledBucketIdx === -1) {
        return { success: false, messageKey: 'needFilledBucket' };
      }

      // Replace fire with extinguished fire visual
      grid[y][x].object = { type: 'extinguished-fire', config: {} };

      // Empty the bucket
      gameState.inventory[filledBucketIdx] = {
        ...gameState.inventory[filledBucketIdx],
        filled: false
      };

      return {
        success: true,
        messageKey: 'fireExtinguished',
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'rescue-friend': {
    label: 'Rescue Friend',
    duration: 1500,
    requirements: { tile: 'friend' },
    execute: (gameState, grid, x, y) => {
      const friend = grid[y][x];
      const friendName = friend.object?.config?.name || 'Friend';

      // Replace friend with rescued friend visual (footprints)
      grid[y][x].object = { type: 'rescued-friend', config: {} };

      // Update game state
      gameState.rescuedFriends = (gameState.rescuedFriends || 0) + 1;
      if (!gameState.collectedItems) gameState.collectedItems = [];
      gameState.collectedItems.push('friend');

      return {
        success: true,
        messageKey: 'rescued',
        messageParams: { name: friendName },
        modifyGrid: true,
        modifyState: {
          rescuedFriends: gameState.rescuedFriends
        }
      };
    }
  },

  'defeat-bear': {
    label: 'Defeat Bear',
    duration: 2000,
    requirements: { tile: 'bear', inventory: ['knife'] },
    execute: (gameState, grid, x, y) => {
      const knifeIdx = findItemIndex(gameState.inventory, 'knife');

      if (knifeIdx === -1) {
        return { success: false, messageKey: 'needKnife' };
      }

      // Replace bear with defeated bear visual (paw prints)
      grid[y][x].object = { type: 'defeated-bear', config: {} };

      // Remove knife and add sweater
      gameState.inventory = gameState.inventory.filter((_, i) => i !== knifeIdx);
      gameState.inventory.push({ itemType: 'sweater' });

      // Track collected item
      if (!gameState.collectedItems) gameState.collectedItems = [];
      gameState.collectedItems.push('sweater');

      return {
        success: true,
        messageKey: 'defeatedBear',
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'unlock-door-key': {
    label: 'Unlock Door',
    duration: 1000,
    requirements: { tile: 'door-key' },
    // Custom check for matching key color
    checkCustom: (gameState, tile) => {
      const doorColor = tile.object?.config?.lockColor || 'red';
      return gameState.inventory?.some(
        item => item.itemType === 'key' && item.lockColor === doorColor
      );
    },
    execute: (gameState, grid, x, y) => {
      const tile = grid[y][x];
      const doorColor = tile.object?.config?.lockColor || 'red';
      const keyIdx = gameState.inventory.findIndex(
        item => item.itemType === 'key' && item.lockColor === doorColor
      );

      if (keyIdx === -1) {
        return { success: false, messageKey: 'needKey', messageParams: { color: doorColor } };
      }

      // Open the door (object layer)
      grid[y][x].object = { type: 'door-key-open', config: {} };

      // Remove the key
      gameState.inventory = gameState.inventory.filter((_, i) => i !== keyIdx);

      return {
        success: true,
        messageKey: 'doorUnlocked',
        messageParams: { color: doorColor },
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'unlock-door-card': {
    label: 'Unlock Door',
    duration: 1000,
    requirements: { tile: 'door-card' },
    // Custom check for matching card color
    checkCustom: (gameState, tile) => {
      const doorColor = tile.object?.config?.lockColor || 'red';
      return gameState.inventory?.some(
        item => item.itemType === 'card' && item.lockColor === doorColor
      );
    },
    execute: (gameState, grid, x, y) => {
      const tile = grid[y][x];
      const doorColor = tile.object?.config?.lockColor || 'red';
      const cardIdx = gameState.inventory.findIndex(
        item => item.itemType === 'card' && item.lockColor === doorColor
      );

      if (cardIdx === -1) {
        return { success: false, messageKey: 'needKeycard', messageParams: { color: doorColor } };
      }

      // Open the door (object layer)
      grid[y][x].object = { type: 'door-card-open', config: {} };

      // Remove the card
      gameState.inventory = gameState.inventory.filter((_, i) => i !== cardIdx);

      return {
        success: true,
        messageKey: 'cardDoorUnlocked',
        messageParams: { color: doorColor },
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'wear-sweater': {
    label: '🧥 Wear Sweater',
    duration: 1500,
    requirements: { anyTile: true },
    checkCustom: (gameState, tile, grid, x, y) => {
      // Must have sweater in inventory and not already wearing one
      const hasSweater = gameState.inventory?.some(item => item.itemType === 'sweater');
      const alreadyWearing = gameState.worn?.body === 'sweater';
      return hasSweater && !alreadyWearing;
    },
    execute: (gameState, grid, x, y) => {
      const sweaterIdx = gameState.inventory.findIndex(item => item.itemType === 'sweater');

      if (sweaterIdx === -1) {
        return { success: false, error: 'No sweater in inventory!' };
      }

      // Remove from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== sweaterIdx);

      // Initialize worn object if needed
      if (!gameState.worn) gameState.worn = {};
      gameState.worn.body = 'sweater';

      return {
        success: true,
        messageKey: 'sweaterWorn',
        modifyInventory: true
      };
    }
  },

  'remove-sweater': {
    label: '🧥 Remove Sweater',
    duration: 1000,
    requirements: { anyTile: true },
    checkCustom: (gameState, tile, grid, x, y) => {
      // Must be wearing sweater
      const isWearingSweater = gameState.worn?.body === 'sweater';
      if (!isWearingSweater) return false;

      // Cannot remove sweater while standing on snow
      const currentTile = grid[y]?.[x];
      const currentTileType = currentTile?.floor?.type || currentTile?.object?.type;
      if (currentTileType === 'snow') {
        return false; // This will prevent the interaction from showing up
      }

      return true;
    },
    execute: (gameState, grid, x, y) => {
      // Double-check: cannot remove while on snow
      const currentTile = grid[y]?.[x];
      const currentTileType = currentTile?.floor?.type || currentTile?.object?.type;
      if (currentTileType === 'snow') {
        return {
          success: false,
          messageKey: 'cantRemoveSweaterOnSnow'
        };
      }

      // Remove from worn slot
      gameState.worn.body = null;

      // Add back to inventory
      gameState.inventory.push({ itemType: 'sweater' });

      return {
        success: true,
        messageKey: 'sweaterRemoved',
        modifyInventory: true
      };
    }
  },

  'read-sign': {
    label: '📜 Read Sign',
    duration: 500,
    requirements: { tile: 'sign' },
    execute: (_gameState, grid, x, y) => {
      const tile = grid[y][x];
      const message = tile.object?.config?.message || 'This sign has no message.';

      return {
        success: true,
        message: message,
        showModal: true,
        modalTitle: '📜 Sign',
        modifyGrid: false,
        modifyInventory: false
      };
    }
  },
};

// Get all available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y, isSelfCheck = false) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

  // Check each interaction
  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    if (checkRequirements(interaction.requirements, gameState, tile, interaction, grid, x, y, isSelfCheck)) {
      available.push({
        id,
        label: interaction.label,
        duration: interaction.duration || 1500 // Explicit fallback
      });
    }
  }

  return available;
}

// Check if requirements are met
function checkRequirements(requirements, gameState, tile, interaction = null, grid = null, x = 0, y = 0, isSelfCheck = false) {
  if (!requirements) return true;

  // selfOnly/facingOnly checks only apply when finding interactions (isSelfCheck is boolean)
  // During execution, isSelfCheck is undefined, so we skip these checks
  if (isSelfCheck !== undefined) {
    // selfOnly interactions should only match self-checks
    if (requirements.selfOnly && !isSelfCheck) {
      return false;
    }

    // facingOnly interactions should not match self-checks
    if (requirements.facingOnly && isSelfCheck) {
      return false;
    }
  }

  // anyTile bypasses tile checking (for self-interactions like wearing items)
  if (!requirements.anyTile) {
    // Check tile type (check both object and floor layers)
    const tileType = tile.object?.type || tile.floor?.type;

    if (requirements.tile && tileType !== requirements.tile) {
      return false;
    }

    // Check if tile is one of multiple types
    if (requirements.tileAny && !requirements.tileAny.includes(tileType)) {
      return false;
    }
  }

  // Check inventory items
  if (requirements.inventory) {
    for (const itemType of requirements.inventory) {
      if (!hasItemType(gameState.inventory, itemType)) {
        return false;
      }
    }
  }

  // Check item state (e.g., bucket filled/empty)
  if (requirements.itemState) {
    const { itemType, ...stateChecks } = requirements.itemState;
    const item = gameState.inventory.find(i => i.itemType === itemType);
    if (!item) return false;

    for (const [key, value] of Object.entries(stateChecks)) {
      if (item[key] !== value) return false;
    }
  }

  // Check custom requirement (e.g., matching key/card color, checking current tile for snow)
  if (interaction?.checkCustom) {
    if (!interaction.checkCustom(gameState, tile, grid, x, y)) {
      return false;
    }
  }

  return true;
}

// Get interaction label for display
export function getInteractionLabel(interactionId) {
  const interaction = INTERACTIONS[interactionId];
  return interaction ? interaction.label + '...' : 'Interact...';
}

// Execute an interaction
export function executeInteraction(interactionId, gameState, grid, x, y, phase = 'complete') {
  const interaction = INTERACTIONS[interactionId];
  if (!interaction) {
    return { success: false, error: 'Unknown interaction' };
  }

  const tile = grid[y]?.[x];
  if (!tile) {
    return { success: false, error: 'Invalid position' };
  }

  // Handle interaction lifecycle phases
  if (phase === 'start') {
    if (interaction.onStart) {
      return interaction.onStart(gameState, grid, x, y);
    }
    // No onStart handler - return null so SolverMode knows to ignore it
    return null;
  }

  if (phase === 'cancel') {
    if (interaction.onCancel) {
      return interaction.onCancel(gameState, grid, x, y);
    }
    // No onCancel handler - return null so SolverMode knows to ignore it
    return null;
  }

  // Default phase: 'complete'
  // Check requirements (pass grid and coordinates for full validation)
  // Note: During execution, we ignore selfOnly/facingOnly checks (those are for finding interactions)
  // So we pass isSelfCheck=undefined to skip those checks
  if (!checkRequirements(interaction.requirements, gameState, tile, interaction, grid, x, y, undefined)) {
    return { success: false, error: 'Requirements not met' };
  }

  // Execute the interaction
  return interaction.execute(gameState, grid, x, y);
}

// === Custom Drop/Pickup Handlers for Raft ===

// Direction to offset mapping
const DIRECTION_OFFSETS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

// Clone grid helper
function cloneGrid(grid) {
  return grid.map(row => row.map(cell => ({ ...cell, config: { ...cell.config } })));
}

// Custom drop handler - rafts now drop on player tile (use E to place on water instead)
// Returns { handled: true, newGrid, newInventory, message } if handled, null otherwise
export function customDrop(itemObj, gameState, grid, playerPos, direction) {
  // Let default drop handler handle all items (including raft)
  return null;
}

// Custom pickup handler - handles raft pickup from adjacent raft tile
// Returns { handled: true, newGrid, newInventory, message } if handled, null otherwise
export function customPickup(gameState, grid, playerPos, direction, maxInventory) {
  // Get facing tile position
  const offset = DIRECTION_OFFSETS[direction];
  if (!offset) {
    return null; // No direction, let default pickup handle
  }

  const targetX = playerPos.x + offset.dx;
  const targetY = playerPos.y + offset.dy;

  // Check bounds
  if (targetY < 0 || targetY >= grid.length || targetX < 0 || targetX >= grid[0].length) {
    return null; // Out of bounds, let default pickup handle (will show no item message)
  }

  const targetTile = grid[targetY][targetX];

  // Only handle raft tile pickup
  if (targetTile.type !== 'raft') {
    return null; // Not a raft, let default pickup handle
  }

  // Check if standing on the raft (can't pick up raft you're standing on)
  const currentTile = grid[playerPos.y][playerPos.x];
  if (currentTile.type === 'raft') {
    return { handled: true, messageKey: 'cantPickupRaftOnIt' };
  }

  // Check inventory capacity
  if (gameState.inventory.length >= maxInventory) {
    return { handled: true, messageKey: 'inventoryFull', messageParams: { max: maxInventory } };
  }

  // Pick up raft - convert raft tile to water
  const newGrid = cloneGrid(grid);
  newGrid[targetY][targetX] = { type: 'water', config: {} };

  // Add raft to inventory
  const newInventory = [...gameState.inventory, { itemType: 'raft', filled: false }];

  return {
    handled: true,
    newGrid,
    newInventory,
    messageKey: 'raftPickedUp'
  };
}

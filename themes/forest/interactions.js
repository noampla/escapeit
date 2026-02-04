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

// Interaction definitions
export const INTERACTIONS = {
  'cut-tree': {
    label: 'Cut Tree',
    duration: 1500,
    requirements: { inventory: ['axe'], tile: 'tree' },
    execute: (gameState, grid, x, y) => {
      // Replace tree with wood item
      grid[y][x] = { type: 'item-wood', config: {} };
      return {
        success: true,
        message: '🪓 Tree chopped! Wood left on ground.',
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
        return { success: false, message: 'No empty bucket found!' };
      }

      // Fill the bucket
      gameState.inventory[bucketIdx] = {
        ...gameState.inventory[bucketIdx],
        filled: true
      };

      return {
        success: true,
        message: 'Filled bucket with water!',
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
        return { success: false, message: 'Need rope and wood!' };
      }

      // Remove rope and wood, add raft to inventory
      const newInventory = gameState.inventory.filter((_, i) => i !== ropeIdx && i !== woodIdx);
      newInventory.push({ itemType: 'raft', filled: false });
      gameState.inventory = newInventory;

      return {
        success: true,
        message: 'Built a raft! You can now place it on water.',
        modifyInventory: true
      };
    }
  },

  'place-raft': {
    label: 'Place Raft',
    duration: 1000,
    requirements: { inventory: ['raft'], tile: 'water' },
    execute: (gameState, grid, x, y) => {
      const raftIdx = findItemIndex(gameState.inventory, 'raft');

      if (raftIdx === -1) {
        return { success: false, message: 'No raft in inventory!' };
      }

      // Place raft on water
      grid[y][x] = { type: 'raft', config: {} };

      // Remove raft from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== raftIdx);

      return {
        success: true,
        message: 'Raft placed! You can walk on it.',
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'pickup-raft': {
    label: 'Pick Up Raft',
    duration: 1000,
    requirements: { tile: 'raft' },
    execute: (gameState, grid, x, y) => {
      // Remove raft from grid
      grid[y][x] = { type: 'water', config: {} };

      // Add raft to inventory
      gameState.inventory.push({ itemType: 'raft', filled: false });

      return {
        success: true,
        message: 'Picked up raft!',
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
        return { success: false, message: 'Need a filled bucket!' };
      }

      // Remove fire, replace with ground
      grid[y][x] = { type: 'ground', config: {} };

      // Empty the bucket
      gameState.inventory[filledBucketIdx] = {
        ...gameState.inventory[filledBucketIdx],
        filled: false
      };

      return {
        success: true,
        message: 'Fire extinguished!',
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
      const friendName = friend.config?.name || 'Friend';

      // Remove friend from grid
      grid[y][x] = { type: 'ground', config: {} };

      // Update game state
      gameState.rescuedFriends = (gameState.rescuedFriends || 0) + 1;
      if (!gameState.collectedItems) gameState.collectedItems = [];
      gameState.collectedItems.push('friend');

      return {
        success: true,
        message: `Rescued: ${friendName}!`,
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
        return { success: false, message: 'Need a knife!' };
      }

      // Remove bear from grid
      grid[y][x] = { type: 'ground', config: {} };

      // Remove knife and add sweater
      gameState.inventory = gameState.inventory.filter((_, i) => i !== knifeIdx);
      gameState.inventory.push({ itemType: 'sweater' });

      // Track collected item
      if (!gameState.collectedItems) gameState.collectedItems = [];
      gameState.collectedItems.push('sweater');

      return {
        success: true,
        message: 'Defeated the bear! Got a sweater.',
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
      const doorColor = tile.config?.lockColor || 'red';
      return gameState.inventory?.some(
        item => item.itemType === 'key' && item.lockColor === doorColor
      );
    },
    execute: (gameState, grid, x, y) => {
      const tile = grid[y][x];
      const doorColor = tile.config?.lockColor || 'red';
      const keyIdx = gameState.inventory.findIndex(
        item => item.itemType === 'key' && item.lockColor === doorColor
      );

      if (keyIdx === -1) {
        return { success: false, message: `Need a ${doorColor} key!` };
      }

      // Open the door
      grid[y][x] = { type: 'door-key-open', config: {} };

      // Remove the key
      gameState.inventory = gameState.inventory.filter((_, i) => i !== keyIdx);

      return {
        success: true,
        message: `Unlocked ${doorColor} door with key!`,
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
      const doorColor = tile.config?.lockColor || 'red';
      return gameState.inventory?.some(
        item => item.itemType === 'card' && item.lockColor === doorColor
      );
    },
    execute: (gameState, grid, x, y) => {
      const tile = grid[y][x];
      const doorColor = tile.config?.lockColor || 'red';
      const cardIdx = gameState.inventory.findIndex(
        item => item.itemType === 'card' && item.lockColor === doorColor
      );

      if (cardIdx === -1) {
        return { success: false, message: `Need a ${doorColor} keycard!` };
      }

      // Open the door
      grid[y][x] = { type: 'door-card-open', config: {} };

      // Remove the card
      gameState.inventory = gameState.inventory.filter((_, i) => i !== cardIdx);

      return {
        success: true,
        message: `Unlocked ${doorColor} door with keycard!`,
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },
};

// Get all available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

  // Check each interaction
  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    if (checkRequirements(interaction.requirements, gameState, tile, interaction)) {
      available.push({
        id,
        label: interaction.label,
        duration: interaction.duration
      });
    }
  }

  return available;
}

// Check if requirements are met
function checkRequirements(requirements, gameState, tile, interaction = null) {
  if (!requirements) return true;

  // Check tile type
  if (requirements.tile && tile.type !== requirements.tile) {
    return false;
  }

  // Check if tile is one of multiple types
  if (requirements.tileAny && !requirements.tileAny.includes(tile.type)) {
    return false;
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

  // Check custom requirement (e.g., matching key/card color)
  if (interaction?.checkCustom) {
    if (!interaction.checkCustom(gameState, tile)) {
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
export function executeInteraction(interactionId, gameState, grid, x, y) {
  const interaction = INTERACTIONS[interactionId];
  if (!interaction) {
    return { success: false, error: 'Unknown interaction' };
  }

  const tile = grid[y]?.[x];
  if (!tile) {
    return { success: false, error: 'Invalid position' };
  }

  // Check requirements
  if (!checkRequirements(interaction.requirements, gameState, tile, interaction)) {
    return { success: false, error: 'Requirements not met' };
  }

  // Execute the interaction
  return interaction.execute(gameState, grid, x, y);
}

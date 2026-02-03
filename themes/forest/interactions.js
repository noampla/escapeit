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
        message: '🪓 Tree chopped! Wood left on ground.'
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
    duration: 1500,
    requirements: { inventory: ['rope', 'wood'], tile: 'water' },
    execute: (gameState, grid, x, y) => {
      const ropeIdx = findItemIndex(gameState.inventory, 'rope');
      const woodIdx = findItemIndex(gameState.inventory, 'wood');

      if (ropeIdx === -1 || woodIdx === -1) {
        return { success: false, message: 'Need rope and wood!' };
      }

      // Find all connected water tiles
      const waterCells = floodFillWater(grid, x, y);

      // Convert all water to raft
      for (const cell of waterCells) {
        grid[cell.y][cell.x] = { type: 'raft', config: {} };
      }

      // Remove rope and wood from inventory
      const newInventory = gameState.inventory.filter((_, i) => i !== ropeIdx && i !== woodIdx);
      gameState.inventory = newInventory;

      return {
        success: true,
        message: `Built a raft! (${waterCells.length} tiles)`,
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
};

// Get all available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

  // Check each interaction
  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    if (checkRequirements(interaction.requirements, gameState, tile)) {
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
function checkRequirements(requirements, gameState, tile) {
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
  if (!checkRequirements(interaction.requirements, gameState, tile)) {
    return { success: false, error: 'Requirements not met' };
  }

  // Execute the interaction
  return interaction.execute(gameState, grid, x, y);
}

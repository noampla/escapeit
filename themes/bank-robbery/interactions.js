// Bank Robbery Theme - Interaction Definitions

// Helper functions
function hasItemType(inventory, itemType) {
  return inventory?.some(item => item.itemType === itemType) || false;
}

export const INTERACTIONS = {
  'unlock-door-key': {
    label: 'Unlock Door',
    duration: 1000,
    requirements: { tile: 'door-key' },
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

  // Check custom requirement (e.g., matching key/card color)
  if (interaction?.checkCustom) {
    if (!interaction.checkCustom(gameState, tile)) {
      return false;
    }
  }

  return true;
}

// Get all available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

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

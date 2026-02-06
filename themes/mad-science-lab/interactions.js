// Mad Science Lab Theme - Interaction Definitions

import { LOCK_COLORS } from './tiles.js';

export const INTERACTIONS = {
  'unlock-card-door': {
    label: 'Use Keycard',
    duration: 800,
    requirements: {
      tileAny: ['door-card']
    },
    checkCustom: (gameState, tile) => {
      const doorColor = tile.config?.lockColor || 'red';
      return gameState.inventory?.some(item =>
        item.itemType === 'card' && item.lockColor === doorColor
      );
    }
  }
};

// Get available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

  // Check unlock card door
  if (tile.type === 'door-card') {
    const doorColor = tile.config?.lockColor || 'red';
    const hasMatchingCard = gameState.inventory?.some(item =>
      item.itemType === 'card' && item.lockColor === doorColor
    );
    if (hasMatchingCard) {
      available.push('unlock-card-door');
    }
  }

  return available;
}

// Get label for an interaction
export function getInteractionLabel(interactionId) {
  const interaction = INTERACTIONS[interactionId];
  return interaction?.label || interactionId;
}

// Execute an interaction
export function executeInteraction(interactionId, gameState, grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) {
    return { success: false, message: 'Invalid position' };
  }

  switch (interactionId) {
    case 'unlock-card-door': {
      const doorColor = tile.config?.lockColor || 'red';
      const colorLabel = LOCK_COLORS[doorColor]?.label || doorColor;

      // Find and consume the matching keycard
      const cardIndex = gameState.inventory?.findIndex(item =>
        item.itemType === 'card' && item.lockColor === doorColor
      );

      if (cardIndex === -1) {
        return {
          success: false,
          messageKey: 'needKeycard',
          messageParams: { color: colorLabel }
        };
      }

      // Remove card from inventory
      const newInventory = [...gameState.inventory];
      newInventory.splice(cardIndex, 1);

      // Open the door
      grid[y][x] = { type: 'door-card-open', config: {} };

      return {
        success: true,
        messageKey: 'cardDoorUnlocked',
        messageParams: { color: colorLabel },
        modifyGrid: true,
        modifyInventory: true,
        newInventory
      };
    }

    default:
      return {
        success: false,
        message: 'Unknown interaction'
      };
  }
}

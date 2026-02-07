// Mad Science Lab Theme - Interaction Definitions

import { LOCK_COLORS } from './tiles.js';

export const INTERACTIONS = {
  'unlock-card-door': {
    label: 'Use Keycard',
    duration: 800,
    requirements: {
      tile: 'door-card'
    },
    checkCustom: (gameState, tile) => {
      const doorColor = tile.object?.config?.lockColor || 'red';
      return gameState.inventory?.some(item =>
        item.itemType === 'card' && item.lockColor === doorColor
      );
    },
    execute: (gameState, grid, x, y) => {
      const tile = grid[y][x];
      const doorColor = tile.object?.config?.lockColor || 'red';
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
      gameState.inventory = gameState.inventory.filter((_, i) => i !== cardIndex);

      // Open the door (object layer)
      grid[y][x].object = { type: 'door-card-open', config: {} };

      return {
        success: true,
        messageKey: 'cardDoorUnlocked',
        messageParams: { color: colorLabel },
        modifyGrid: true,
        modifyInventory: true
      };
    }
  }
};

// Check if interaction requirements are met
function checkRequirements(requirements, gameState, tile, interaction) {
  if (!requirements) return true;

  // Check tile requirement (check both object and floor layers)
  const tileType = tile.object?.type || tile.floor?.type;

  if (requirements.tile && tileType !== requirements.tile) {
    return false;
  }

  // Check tileAny requirement
  if (requirements.tileAny && !requirements.tileAny.includes(tileType)) {
    return false;
  }

  // Check custom requirement
  if (interaction.checkCustom && !interaction.checkCustom(gameState, tile)) {
    return false;
  }

  return true;
}

// Get available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    if (checkRequirements(interaction.requirements, gameState, tile, interaction)) {
      available.push({
        id,
        label: interaction.label,
        duration: interaction.duration,
        progressColor: interaction.progressColor || null
      });
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
  // Check requirements
  if (!checkRequirements(interaction.requirements, gameState, tile, interaction)) {
    return { success: false, error: 'Requirements not met' };
  }

  // Execute the interaction
  return interaction.execute(gameState, grid, x, y);
}

// Mad Science Lab Theme - Interaction Definitions

import { LOCK_COLORS } from './tiles.js';

export const INTERACTIONS = {
  'unlock-card-door': {
    label: '🔑 Use Keycard',
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
  },

  'neutralize-chemical-door': {
    label: '🧪 Use Chemical Vial',
    duration: 1000,
    requirements: {
      tile: 'door-chemical'
    },
    checkCustom: (gameState, tile) => {
      const doorColor = tile.object?.config?.lockColor || 'red';
      return gameState.inventory?.some(item =>
        item.itemType === 'chemical' && item.lockColor === doorColor
      );
    },
    execute: (gameState, grid, x, y) => {
      const tile = grid[y][x];
      const doorColor = tile.object?.config?.lockColor || 'red';
      const colorLabel = LOCK_COLORS[doorColor]?.label || doorColor;

      // Find and consume the matching chemical vial
      const chemicalIndex = gameState.inventory?.findIndex(item =>
        item.itemType === 'chemical' && item.lockColor === doorColor
      );

      if (chemicalIndex === -1) {
        return {
          success: false,
          messageKey: 'needChemicalVial',
          messageParams: { color: colorLabel }
        };
      }

      // Remove chemical vial from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== chemicalIndex);

      // Open the chemical door (object layer)
      grid[y][x].object = { type: 'door-chemical-open', config: {} };

      return {
        success: true,
        messageKey: 'chemicalDoorNeutralized',
        messageParams: { color: colorLabel },
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'access-terminal': {
    label: '💻 Access Terminal',
    duration: 1500,
    requirements: {
      tile: 'terminal'
    },
    checkCustom: (gameState, tile) => {
      // Can access terminal with tablet AND battery
      const hasTablet = gameState.inventory?.some(item => item.itemType === 'tablet');
      const hasBattery = gameState.inventory?.some(item => item.itemType === 'battery');
      return hasTablet && hasBattery;
    },
    execute: (gameState, grid, x, y) => {
      const tile = grid[y][x];
      const hasTablet = gameState.inventory?.some(item => item.itemType === 'tablet');
      const hasBattery = gameState.inventory?.some(item => item.itemType === 'battery');

      if (!hasTablet) {
        return {
          success: false,
          messageKey: 'terminalNeedCode'
        };
      }

      if (!hasBattery) {
        return {
          success: false,
          messageKey: 'terminalNeedPower'
        };
      }

      // Consume the battery
      const batteryIndex = gameState.inventory?.findIndex(item => item.itemType === 'battery');
      if (batteryIndex !== -1) {
        gameState.inventory = gameState.inventory.filter((_, i) => i !== batteryIndex);
      }

      // Activate terminal and disable laser grids
      const terminalConfig = tile.object?.config || {};
      grid[y][x].object = { type: 'terminal-active', config: terminalConfig };

      // Disable all laser grids on the map (turn them gray and walkable)
      let disabledCount = 0;
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          const cell = grid[row][col];
          if (cell && cell.object && cell.object.type === 'laser_grid') {
            // Change to disabled laser grid (gray and walkable)
            cell.object = { type: 'laser_grid_disabled', config: {} };
            disabledCount++;
          }
        }
      }

      console.log(`[Terminal] Disabled ${disabledCount} laser grids`);

      return {
        success: true,
        messageKey: 'terminalLasersDisabled',
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'use-medkit': {
    label: '⚕️ Use Medical Kit',
    duration: 1000,
    progressColor: '#ff4444',
    requirements: { anyTile: true, selfOnly: true },
    checkCustom: (gameState) => {
      const hasMedkit = gameState.inventory?.some(item => item.itemType === 'medkit');
      const needsHealing = (gameState.lives || 0) < (gameState.maxLives || 3);
      return hasMedkit && needsHealing;
    },
    execute: (gameState, grid, x, y) => {
      const medkitIndex = gameState.inventory?.findIndex(item => item.itemType === 'medkit');

      if (medkitIndex === -1) {
        return {
          success: false,
          error: 'No medical kit in inventory!'
        };
      }

      // Remove medkit from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== medkitIndex);

      return {
        success: true,
        messageKey: 'medkitUsed',
        restoreLives: 1,
        modifyInventory: true
      };
    }
  },

  'wear-hazmat': {
    label: '🦺 Wear Hazmat Suit',
    duration: 1500,
    requirements: { anyTile: true, selfOnly: true },
    checkCustom: (gameState) => {
      // Must have hazmat in inventory and not already wearing one
      const hasHazmat = gameState.inventory?.some(item => item.itemType === 'hazmat');
      const alreadyWearing = gameState.worn?.body === 'hazmat';
      return hasHazmat && !alreadyWearing;
    },
    execute: (gameState, grid, x, y) => {
      const hazmatIdx = gameState.inventory.findIndex(item => item.itemType === 'hazmat');

      if (hazmatIdx === -1) {
        return { success: false, error: 'No hazmat suit in inventory!' };
      }

      // Remove from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== hazmatIdx);

      // Initialize worn object if needed
      if (!gameState.worn) gameState.worn = {};
      gameState.worn.body = 'hazmat';

      return {
        success: true,
        messageKey: 'hazmatEquipped',
        modifyInventory: true
      };
    }
  },

  'remove-hazmat': {
    label: '🦺 Remove Hazmat Suit',
    duration: 1000,
    requirements: { anyTile: true, selfOnly: true },
    checkCustom: (gameState) => {
      // Must be wearing hazmat suit
      return gameState.worn?.body === 'hazmat';
    },
    execute: (gameState, grid, x, y) => {
      // Remove from worn slot
      gameState.worn.body = null;

      // Add back to inventory
      gameState.inventory.push({ itemType: 'hazmat' });

      return {
        success: true,
        messageKey: 'hazmatRemoved',
        modifyInventory: true
      };
    }
  }
};

// Check if interaction requirements are met
function checkRequirements(requirements, gameState, tile, interaction = null, grid = null, x = 0, y = 0, isSelfCheck = false) {
  if (!requirements) return true;

  // facingOnly interactions should not match self-checks
  if (requirements.facingOnly && isSelfCheck) {
    return false;
  }

  // selfOnly interactions should only match self-checks
  if (requirements.selfOnly && !isSelfCheck) {
    return false;
  }

  // Check tile type (unless anyTile is set)
  if (!requirements.anyTile) {
    // Check tile requirement (check both object and floor layers)
    const tileType = tile.object?.type || tile.floor?.type;

    if (requirements.tile && tileType !== requirements.tile) {
      return false;
    }

    // Check tileAny requirement
    if (requirements.tileAny && !requirements.tileAny.includes(tileType)) {
      return false;
    }
  }

  // Check custom requirement
  if (interaction?.checkCustom && !interaction.checkCustom(gameState, tile, grid, x, y)) {
    return false;
  }

  return true;
}

// Get available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y, isSelfCheck = false) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    if (checkRequirements(interaction.requirements, gameState, tile, interaction, grid, x, y, isSelfCheck)) {
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
    return null;
  }

  if (phase === 'cancel') {
    if (interaction.onCancel) {
      return interaction.onCancel(gameState, grid, x, y);
    }
    return null;
  }

  // Default phase: 'complete'
  // Note: We don't re-check requirements here because they were already checked
  // when the interaction was offered. Re-checking can cause issues with isSelfCheck parameter.

  // Execute the interaction
  return interaction.execute(gameState, grid, x, y);
}

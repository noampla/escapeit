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

  'wear-uniform': {
    label: 'Wear Uniform',
    duration: 1500,
    requirements: { anyTile: true }, // Can be done on any tile
    checkCustom: (gameState, tile) => {
      // Must have uniform in inventory and not already wearing one
      const hasUniform = gameState.inventory?.some(item => item.itemType === 'uniform');
      const alreadyWearing = gameState.worn?.body === 'uniform';
      return hasUniform && !alreadyWearing;
    },
    execute: (gameState, grid, x, y) => {
      const uniformIdx = gameState.inventory.findIndex(item => item.itemType === 'uniform');

      if (uniformIdx === -1) {
        return { success: false, error: 'No uniform in inventory!' };
      }

      // Remove from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== uniformIdx);

      // Add to worn items
      if (!gameState.worn) gameState.worn = {};
      gameState.worn.body = 'uniform';

      return {
        success: true,
        message: '🎭 Disguised as guard! Cameras ignore you.',
        modifyInventory: true,
        modifyState: true
      };
    }
  },

  'remove-uniform': {
    label: 'Remove Uniform',
    duration: 1000,
    requirements: { anyTile: true },
    checkCustom: (gameState, tile) => {
      // Must be wearing uniform
      return gameState.worn?.body === 'uniform';
    },
    execute: (gameState, grid, x, y) => {
      // Remove from worn
      if (gameState.worn) {
        gameState.worn.body = null;
      }

      // Add back to inventory
      gameState.inventory.push({ itemType: 'uniform' });

      return {
        success: true,
        message: 'Removed guard uniform.',
        modifyInventory: true,
        modifyState: true
      };
    }
  },

  'place-mirror': {
    label: 'Place Mirror',
    duration: 500,
    requirements: { tileAny: ['floor', 'start', 'exit'], facingOnly: true },
    checkCustom: (gameState) => {
      return gameState.inventory?.some(item => item.itemType === 'mirror');
    },
    execute: (gameState, grid, x, y) => {
      const mirrorIdx = gameState.inventory.findIndex(item => item.itemType === 'mirror');
      if (mirrorIdx === -1) {
        return { success: false, error: 'No mirror in inventory!' };
      }

      // Place mirror on target tile (x,y is the facing tile)
      grid[y][x] = { type: 'item-mirror', config: {} };

      // Remove from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== mirrorIdx);

      return {
        success: true,
        message: 'Placed mirror.',
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'drill-vault': {
    label: 'Drill Vault',
    duration: 4000,
    progressColor: '#ff8844', // Orange progress bar for drilling
    requirements: { tile: 'vault-door' },
    checkCustom: (gameState) => {
      return gameState.inventory?.some(item => item.itemType === 'drill');
    },
    execute: (gameState, grid, x, y) => {
      const hasDrill = gameState.inventory?.some(item => item.itemType === 'drill');
      if (!hasDrill) {
        return { success: false, error: 'Need a drill!' };
      }

      // Open the vault door (drill stays in inventory - reusable)
      grid[y][x] = { type: 'vault-door-open', config: {} };

      return {
        success: true,
        message: 'Drilled through the vault door!',
        modifyGrid: true
      };
    }
  },

  'place-bomb': {
    label: 'Place Bomb',
    duration: 800,
    progressColor: '#cc2222', // Red progress bar
    requirements: { tileAny: ['floor', 'start', 'exit'], facingOnly: true },
    checkCustom: (gameState) => {
      return gameState.inventory?.some(item => item.itemType === 'bomb');
    },
    execute: (gameState, grid, x, y) => {
      const bombIdx = gameState.inventory.findIndex(item => item.itemType === 'bomb');
      if (bombIdx === -1) {
        return { success: false, error: 'No bomb in inventory!' };
      }

      // Place bomb on target tile
      grid[y][x] = { type: 'item-bomb', config: {} };

      // Remove bomb from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== bombIdx);

      return {
        success: true,
        message: 'Bomb placed. Get to safe distance and detonate!',
        modifyGrid: true,
        modifyInventory: true
      };
    }
  },

  'detonate': {
    label: 'Detonate',
    duration: 500,
    progressColor: '#ffcc00', // Yellow progress bar
    requirements: { anyTile: true },
    checkCustom: (gameState) => {
      return gameState.inventory?.some(item => item.itemType === 'detonator');
    },
    // Find the closest bomb to show progress on
    getVisualTarget: (gameState, grid, playerX, playerY) => {
      const detonator = gameState.inventory?.find(item => item.itemType === 'detonator');
      const maxRange = detonator?.maxRange ?? 6;

      let closestBomb = null;
      let closestDistance = Infinity;

      for (let gy = 0; gy < grid.length; gy++) {
        for (let gx = 0; gx < grid[gy].length; gx++) {
          if (grid[gy][gx].type === 'item-bomb') {
            const distance = Math.abs(gx - playerX) + Math.abs(gy - playerY);
            if (distance <= maxRange && distance < closestDistance) {
              closestDistance = distance;
              closestBomb = { x: gx, y: gy };
            }
          }
        }
      }

      return closestBomb; // Returns bomb position or null if no bomb in range
    },
    execute: (gameState, grid, x, y) => {
      const detonator = gameState.inventory?.find(item => item.itemType === 'detonator');
      if (!detonator) {
        return { success: false, error: 'No detonator!' };
      }

      // Get detonator range settings (from item config or defaults)
      const minSafeDistance = detonator.minSafeDistance ?? 2;
      const maxRange = detonator.maxRange ?? 6;

      // Find player position (x, y is the tile being interacted with, which is player pos for anyTile)
      const playerX = x;
      const playerY = y;

      // Find all placed bombs on the grid
      const bombs = [];
      for (let gy = 0; gy < grid.length; gy++) {
        for (let gx = 0; gx < grid[gy].length; gx++) {
          if (grid[gy][gx].type === 'item-bomb') {
            const distance = Math.abs(gx - playerX) + Math.abs(gy - playerY); // Manhattan distance
            bombs.push({ x: gx, y: gy, distance });
          }
        }
      }

      if (bombs.length === 0) {
        return { success: false, error: 'No bombs placed! Place a bomb first.' };
      }

      // Check if any bomb is too close (player dies)
      const tooClose = bombs.filter(b => b.distance < minSafeDistance);
      if (tooClose.length > 0) {
        // Player is too close - this will be fatal
        return {
          success: true,
          message: 'TOO CLOSE! The explosion killed you!',
          fatal: true, // Signal to game engine to kill player
          modifyState: { lives: 0 }
        };
      }

      // Check if any bomb is in range
      const inRange = bombs.filter(b => b.distance <= maxRange);
      if (inRange.length === 0) {
        return { success: false, error: `Out of range! Get within ${maxRange} tiles of a bomb.` };
      }

      // Explode all bombs in range
      let vaultsOpened = 0;
      for (const bomb of inRange) {
        // Remove the bomb
        grid[bomb.y][bomb.x] = { type: 'floor', config: { floorColor: 'gray' } };

        // Check adjacent tiles for vault doors and open them
        const adjacent = [
          { x: bomb.x, y: bomb.y - 1 },
          { x: bomb.x, y: bomb.y + 1 },
          { x: bomb.x - 1, y: bomb.y },
          { x: bomb.x + 1, y: bomb.y },
        ];

        for (const adj of adjacent) {
          if (adj.y >= 0 && adj.y < grid.length && adj.x >= 0 && adj.x < grid[0].length) {
            if (grid[adj.y][adj.x].type === 'vault-door') {
              grid[adj.y][adj.x] = { type: 'vault-door-open', config: {} };
              vaultsOpened++;
            }
          }
        }
      }

      const bombWord = inRange.length === 1 ? 'bomb' : 'bombs';
      const vaultMsg = vaultsOpened > 0 ? ` ${vaultsOpened} vault${vaultsOpened > 1 ? 's' : ''} opened!` : '';

      return {
        success: true,
        message: `BOOM! ${inRange.length} ${bombWord} detonated!${vaultMsg}`,
        sound: 'explosion',
        modifyGrid: true
      };
    }
  },

};

// Check if requirements are met
function checkRequirements(requirements, gameState, tile, interaction = null, grid = null, x = 0, y = 0, isSelfCheck = false) {
  if (!requirements) return true;

  // facingOnly interactions should not match self-checks
  if (requirements.facingOnly && isSelfCheck) {
    return false;
  }

  // Check tile type (unless anyTile is set)
  if (!requirements.anyTile) {
    if (requirements.tile && tile.type !== requirements.tile) {
      return false;
    }

    // Check if tile is one of multiple types
    if (requirements.tileAny && !requirements.tileAny.includes(tile.type)) {
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

  // Check custom requirement (e.g., matching key/card color)
  if (interaction?.checkCustom) {
    if (!interaction.checkCustom(gameState, tile, grid, x, y)) {
      return false;
    }
  }

  return true;
}

// Get all available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y, isSelfCheck = false) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    if (checkRequirements(interaction.requirements, gameState, tile, interaction, grid, x, y, isSelfCheck)) {
      const interactionData = {
        id,
        label: interaction.label,
        duration: interaction.duration,
        progressColor: interaction.progressColor || null
      };

      // Check if interaction has a custom visual target (e.g., detonate shows progress on bomb)
      if (interaction.getVisualTarget) {
        interactionData.visualTarget = interaction.getVisualTarget(gameState, grid, x, y);
      }

      available.push(interactionData);
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
  if (!checkRequirements(interaction.requirements, gameState, tile, interaction, grid, x, y)) {
    return { success: false, error: 'Requirements not met' };
  }

  // Execute the interaction
  return interaction.execute(gameState, grid, x, y);
}

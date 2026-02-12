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

      // Open the door (update object layer only)
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

      // Open the door (update object layer only)
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

  'unlock-door-guard': {
    label: 'Unlock Guard Door',
    duration: 1000,
    requirements: { tile: 'door-guard' },
    checkCustom: (gameState, tile) => {
      return gameState.inventory?.some(item => item.itemType === 'guard-card');
    },
    execute: (gameState, grid, x, y) => {
      const guardCardIdx = gameState.inventory.findIndex(
        item => item.itemType === 'guard-card'
      );

      if (guardCardIdx === -1) {
        return { success: false, messageKey: 'needGuardCard' };
      }

      // Open the door (update object layer only)
      grid[y][x].object = { type: 'door-guard-open', config: {} };

      // Remove the guard card
      gameState.inventory = gameState.inventory.filter((_, i) => i !== guardCardIdx);

      return {
        success: true,
        messageKey: 'guardDoorUnlocked',
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
        messageKey: 'uniformEquipped',
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
        messageKey: 'uniformRemoved',
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

      // Place mirror on target tile (x,y is the facing tile) - object layer
      grid[y][x].object = { type: 'item-mirror', config: {} };

      // Remove from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== mirrorIdx);

      return {
        success: true,
        messageKey: 'mirrorPlaced',
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

      // Open the vault door (drill stays in inventory - reusable) - object layer
      grid[y][x].object = { type: 'vault-door-open', config: {} };

      return {
        success: true,
        messageKey: 'vaultDrilled',
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

      // Place bomb on target tile - object layer
      grid[y][x].object = { type: 'item-bomb', config: {} };

      // Remove bomb from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== bombIdx);

      return {
        success: true,
        messageKey: 'bombPlaced',
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
    checkCustom: (gameState, tile, grid, x, y) => {
      // Must have detonator
      if (!gameState.inventory?.some(item => item.itemType === 'detonator')) {
        return false;
      }

      // Must have at least one visible bomb in range
      const detonator = gameState.inventory?.find(item => item.itemType === 'detonator');
      const maxRange = detonator?.maxRange ?? 6;
      const revealedTiles = gameState.revealedTiles;

      for (let gy = 0; gy < grid.length; gy++) {
        for (let gx = 0; gx < grid[gy].length; gx++) {
          if (grid[gy][gx].object?.type === 'item-bomb') {
            const distance = Math.abs(gx - x) + Math.abs(gy - y);
            // Check if bomb is in range AND visible
            const isVisible = !revealedTiles || revealedTiles.has(`${gx},${gy}`);
            if (distance <= maxRange && isVisible) {
              return true;
            }
          }
        }
      }
      return false;
    },
    // Find the closest visible bomb to show progress on
    getVisualTarget: (gameState, grid, playerX, playerY) => {
      const detonator = gameState.inventory?.find(item => item.itemType === 'detonator');
      const maxRange = detonator?.maxRange ?? 6;
      const revealedTiles = gameState.revealedTiles;

      let closestBomb = null;
      let closestDistance = Infinity;

      for (let gy = 0; gy < grid.length; gy++) {
        for (let gx = 0; gx < grid[gy].length; gx++) {
          if (grid[gy][gx].object?.type === 'item-bomb') {
            const distance = Math.abs(gx - playerX) + Math.abs(gy - playerY);
            // Only consider visible bombs
            const isVisible = !revealedTiles || revealedTiles.has(`${gx},${gy}`);
            if (distance <= maxRange && distance < closestDistance && isVisible) {
              closestDistance = distance;
              closestBomb = { x: gx, y: gy };
            }
          }
        }
      }

      return closestBomb; // Returns bomb position or null if no visible bomb in range
    },
    execute: (gameState, grid, x, y) => {
      const detonator = gameState.inventory?.find(item => item.itemType === 'detonator');
      if (!detonator) {
        return { success: false, error: 'No detonator!' };
      }

      // Get detonator range settings (from item config or defaults)
      const minSafeDistance = detonator.minSafeDistance ?? 2;
      const maxRange = detonator.maxRange ?? 6;
      const revealedTiles = gameState.revealedTiles;

      // Find player position (x, y is the tile being interacted with, which is player pos for anyTile)
      const playerX = x;
      const playerY = y;

      // Find all placed VISIBLE bombs on the grid
      const bombs = [];
      for (let gy = 0; gy < grid.length; gy++) {
        for (let gx = 0; gx < grid[gy].length; gx++) {
          if (grid[gy][gx].object?.type === 'item-bomb') {
            // Only include visible bombs
            const isVisible = !revealedTiles || revealedTiles.has(`${gx},${gy}`);
            if (isVisible) {
              const distance = Math.abs(gx - playerX) + Math.abs(gy - playerY); // Manhattan distance
              bombs.push({ x: gx, y: gy, distance });
            }
          }
        }
      }

      if (bombs.length === 0) {
        return { success: false, error: 'No visible bombs! You need to see the bomb to detonate it.' };
      }

      // Check if any bomb is too close (player dies)
      const tooClose = bombs.filter(b => b.distance < minSafeDistance);
      if (tooClose.length > 0) {
        // Player is too close - this will be fatal
        return {
          success: true,
          messageKey: 'explosionTooClose',
          fatal: true, // Signal to game engine to kill player
          modifyState: { lives: 0 }
        };
      }

      // Check if any bomb is in range
      const inRange = bombs.filter(b => b.distance <= maxRange);
      if (inRange.length === 0) {
        return { success: false, messageKey: 'bombOutOfRange', messageParams: { range: maxRange } };
      }

      // Explode all bombs in range
      let vaultsOpened = 0;
      for (const bomb of inRange) {
        // Remove the bomb from object layer
        grid[bomb.y][bomb.x].object = null;

        // Check adjacent tiles for vault doors and open them
        const adjacent = [
          { x: bomb.x, y: bomb.y - 1 },
          { x: bomb.x, y: bomb.y + 1 },
          { x: bomb.x - 1, y: bomb.y },
          { x: bomb.x + 1, y: bomb.y },
        ];

        for (const adj of adjacent) {
          if (adj.y >= 0 && adj.y < grid.length && adj.x >= 0 && adj.x < grid[0].length) {
            if (grid[adj.y][adj.x].object?.type === 'vault-door') {
              grid[adj.y][adj.x].object = { type: 'vault-door-open', config: {} };
              vaultsOpened++;
            }
          }
        }
      }

      return {
        success: true,
        messageKey: vaultsOpened > 0 ? 'bombDetonatedWithVault' : 'bombDetonated',
        messageParams: { bombs: inRange.length, vaults: vaultsOpened },
        sound: 'explosion',
        modifyGrid: true
      };
    }
  },

  'collect-money': {
    label: 'Grab Cash',
    // Duration is calculated dynamically based on amount (sqrt scale for huge amounts)
    getDuration: (gameState, tile) => {
      const amount = tile.object?.config?.amount || 50000;
      // Sqrt scale: $1K=~550ms, $100K=~1000ms, $1M=~2000ms, $5M=~4000ms
      return Math.min(5000, 500 + Math.sqrt(amount) * 1.5);
    },
    duration: 1500, // Default, overridden by getDuration
    progressColor: '#55aa55',
    requirements: { tile: 'item-money' },
    checkCustom: (gameState) => {
      // Must have bag equipped with space
      const bag = gameState.containers?.bag;
      if (!bag) return false;
      return bag.contents < bag.capacity;
    },
    execute: (gameState, grid, x, y) => {
      const bag = gameState.containers?.bag;
      if (!bag) {
        return { success: false, error: 'Need an equipped bag!' };
      }

      const tile = grid[y][x];
      const amount = tile.object?.config?.amount || 50000;
      const spaceLeft = bag.capacity - bag.contents;

      if (spaceLeft <= 0) {
        return { success: false, error: 'Bag is full!' };
      }

      // Calculate how much we can actually take
      const amountToTake = Math.min(amount, spaceLeft);

      // Add to bag
      bag.contents += amountToTake;

      // Remove money tile or reduce amount
      if (amountToTake >= amount) {
        // Take it all - remove from object layer
        grid[y][x].object = null;
      } else {
        // Partial take - reduce amount in object layer
        grid[y][x].object = { type: 'item-money', config: { amount: amount - amountToTake } };
      }

      // Format amounts with K/M suffix
      const formatMoney = (val) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`;
        if (val >= 1000) return `$${Math.floor(val / 1000)}K`;
        return `$${val}`;
      };

      return {
        success: true,
        messageKey: amountToTake >= amount ? 'moneyGrabbed' : 'moneyGrabbedPartial',
        messageParams: {
          amount: formatMoney(amountToTake),
          bagContents: formatMoney(bag.contents),
          bagCapacity: formatMoney(bag.capacity),
          remaining: formatMoney(amount - amountToTake)
        },
        modifyGrid: true,
        modifyContainers: true
      };
    }
  },

  'poison-guard': {
    label: 'Use Poison on Guard',
    duration: 2000,
    progressColor: '#884499',
    requirements: {
      inventory: ['poison'],
      // Custom check handles guard detection and positioning
    },
    // Return the guard's position for visual progress bar
    getVisualTarget: (gameState, grid, x, y) => {
      const directions = [
        { dx: 0, dy: -1, dir: 'up' },
        { dx: 0, dy: 1, dir: 'down' },
        { dx: -1, dy: 0, dir: 'left' },
        { dx: 1, dy: 0, dir: 'right' }
      ];

      for (const { dx, dy, dir } of directions) {
        const gx = x + dx;
        const gy = y + dy;

        if (gy < 0 || gy >= grid.length || gx < 0 || gx >= grid[0].length) continue;

        const guardTile = grid[gy][gx];
        if (guardTile.object?.type !== 'guard') continue;
        if (guardTile.object?.config?.asleep) continue;

        const guardDirection = guardTile.object?.config?.direction || 'right';
        const isBehind = (guardDirection === dir);

        if (isBehind) {
          return { x: gx, y: gy };
        }
      }

      return null;
    },
    // Custom check: find nearby guard where player is behind them
    checkCustom: (gameState, tile, grid, x, y) => {
      // This is called for the player's position (x, y)
      // We need to check adjacent tiles for guards
      const directions = [
        { dx: 0, dy: -1, dir: 'up' },
        { dx: 0, dy: 1, dir: 'down' },
        { dx: -1, dy: 0, dir: 'left' },
        { dx: 1, dy: 0, dir: 'right' }
      ];

      for (const { dx, dy, dir } of directions) {
        const gx = x + dx;
        const gy = y + dy;

        // Check bounds
        if (gy < 0 || gy >= grid.length || gx < 0 || gx >= grid[0].length) continue;

        const guardTile = grid[gy][gx];

        // Check if it's a guard
        if (guardTile.object?.type !== 'guard') continue;

        // Skip sleeping guards
        if (guardTile.object?.config?.asleep) continue;

        // Check if player is behind the guard
        const guardDirection = guardTile.object?.config?.direction || 'right';

        // Player is behind if the direction from player to guard is the SAME as guard's facing direction
        // Example: Guard faces RIGHT, player is to the LEFT → dir='right' (player→guard) = BEHIND
        // Example: Guard faces RIGHT, player is to the RIGHT → dir='left' (player→guard) = FRONT (blocked)
        const isBehind = (guardDirection === dir);

        if (isBehind) {
          return true;
        }
      }

      return false;
    },
    // Called when interaction starts (E key pressed)
    onStart: (gameState, grid, x, y) => {
      // Find the target guard again
      const directions = [
        { dx: 0, dy: -1, dir: 'up' },
        { dx: 0, dy: 1, dir: 'down' },
        { dx: -1, dy: 0, dir: 'left' },
        { dx: 1, dy: 0, dir: 'right' }
      ];

      for (const { dx, dy, dir } of directions) {
        const gx = x + dx;
        const gy = y + dy;

        if (gy < 0 || gy >= grid.length || gx < 0 || gx >= grid[0].length) continue;

        const guardTile = grid[gy][gx];
        if (guardTile.object?.type !== 'guard' || guardTile.object?.config?.asleep) continue;

        const guardDirection = guardTile.object?.config?.direction || 'right';
        const isBehind = (guardDirection === dir);

        if (isBehind) {
          // Immediately freeze the guard by setting poisoning flag (not asleep yet!)
          grid[gy][gx].object = {
            ...guardTile.object,
            config: {
              ...guardTile.object.config,
              poisoning: true
            }
          };

          return {
            success: true,
            modifyGrid: true
          };
        }
      }

      return { success: false };
    },
    // Called when interaction is cancelled (E key released early)
    onCancel: (gameState, grid, x, y) => {
      // Find the guard that is being poisoned (has poisoning flag set)
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      for (const { dx, dy } of directions) {
        const gx = x + dx;
        const gy = y + dy;

        if (gy < 0 || gy >= grid.length || gx < 0 || gx >= grid[0].length) continue;

        const guardTile = grid[gy][gx];
        if (guardTile?.object?.type === 'guard' && guardTile.object?.config?.poisoning) {
          // Resume guard movement by removing poisoning flag
          grid[gy][gx].object = {
            ...guardTile.object,
            config: {
              ...guardTile.object.config,
              poisoning: false
            }
          };

          return {
            success: true,
            modifyGrid: true
          };
        }
      }

      return { success: false };
    },
    execute: (gameState, grid, x, y) => {
      console.log('[POISON] Execute called at', x, y);

      // Check if player has poison
      const poisonIdx = gameState.inventory.findIndex(item => item.itemType === 'poison');
      if (poisonIdx === -1) {
        console.log('[POISON] No poison in inventory');
        return { success: false, error: 'Need poison bottle!' };
      }

      // Find the guard that is being poisoned (has poisoning flag set)
      // Search entire grid in case guard moved during interaction
      let guardPos = null;
      const GRID_ROWS = grid.length;
      const GRID_COLS = grid[0]?.length || 0;

      for (let gy = 0; gy < GRID_ROWS; gy++) {
        for (let gx = 0; gx < GRID_COLS; gx++) {
          const tile = grid[gy][gx];
          if (tile.object?.type === 'guard' && tile.object?.config?.poisoning) {
            guardPos = { x: gx, y: gy };
            console.log('[POISON] Found poisoning guard at', gx, gy);
            break;
          }
        }
        if (guardPos) break;
      }

      if (!guardPos) {
        console.log('[POISON] No poisoning guard found on grid');
        return { success: false, error: 'Guard escaped!' };
      }

      const guardTile = grid[guardPos.y][guardPos.x];
      console.log('[POISON] Guard before sleep:', guardTile.object?.config);

      // Put guard to sleep permanently (remove poisoning flag, add asleep) - object layer
      grid[guardPos.y][guardPos.x].object = {
        ...guardTile.object,
        config: {
          ...guardTile.object.config,
          poisoning: false,
          asleep: true
        }
      };

      console.log('[POISON] Guard after sleep:', grid[guardPos.y][guardPos.x].object?.config);

      // Add guard card to player's inventory
      gameState.inventory.push({ itemType: 'guard-card' });

      // Remove poison from inventory
      gameState.inventory = gameState.inventory.filter((_, i) => i !== poisonIdx);

      console.log('[POISON] Returning success with modifyGrid=true');
      return {
        success: true,
        messageKey: 'guardPoisoned',
        modifyGrid: true,
        modifyInventory: true
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
    // Check both object and floor layers for tile type
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
      // Calculate duration (may be dynamic based on tile)
      const duration = interaction.getDuration
        ? interaction.getDuration(gameState, tile)
        : interaction.duration;

      const interactionData = {
        id,
        label: interaction.label,
        duration,
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
  if (!checkRequirements(interaction.requirements, gameState, tile, interaction, grid, x, y)) {
    return { success: false, error: 'Requirements not met' };
  }

  // Execute the interaction
  return interaction.execute(gameState, grid, x, y);
}

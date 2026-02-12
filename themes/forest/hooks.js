// Forest Theme Hooks
// These hooks are called by the game engine at specific points

/**
 * Called after each player move
 * @param {Object} params - Hook parameters
 * @param {Object} params.playerPos - Current player position {x, y}
 * @param {Array} params.grid - Current grid state
 * @param {Object} params.gameState - Current game state
 * @param {Function} params.setGameState - Function to update game state
 * @param {Function} params.setGrid - Function to update grid
 * @param {Function} params.showMessage - Function to show message to player
 * @param {Function} params.cloneGrid - Function to clone the grid
 */
export function onPlayerMove({ playerPos, grid, gameState, setGameState, setGrid, showMessage, cloneGrid }) {
  // Auto-check all path gates after each move
  const gates = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x].object?.type === 'path-gate') {
        gates.push({ x, y, tile: grid[y][x] });
      }
    }
  }

  // Check each gate - track which step in the path the player is on
  for (const gate of gates) {
    const sequenceJson = gate.tile.object?.config?.sequence || '[]';
    let sequence;
    try {
      sequence = JSON.parse(sequenceJson);
    } catch (e) {
      continue;
    }

    if (sequence.length === 0) continue;

    // Get or initialize the current step for this gate
    const gateKey = `${gate.x},${gate.y}`;
    const currentStep = gameState.pathProgress?.[gateKey] || 0;

    // Check if player stepped on the next tile in the sequence
    const nextTile = sequence[currentStep];

    if (nextTile && playerPos.x === nextTile.x && playerPos.y === nextTile.y) {
      const newStep = currentStep + 1;

      // Check if path is complete
      if (newStep >= sequence.length) {
        // Path complete! Open the gate
        const message = gate.tile.object?.config?.openMessage || 'The ancient gate opens!';
        const newGrid = cloneGrid(grid);
        newGrid[gate.y][gate.x].object = null;
        setGrid(newGrid);
        showMessage(message, 2000, 'success');

        // Reset progress for this gate
        setGameState(prev => ({
          ...prev,
          pathProgress: {
            ...prev.pathProgress,
            [gateKey]: 0
          }
        }));
      } else {
        // Update progress to next step
        setGameState(prev => ({
          ...prev,
          pathProgress: {
            ...prev.pathProgress,
            [gateKey]: newStep
          }
        }));
      }
    } else {
      // Player is NOT on the expected next tile
      // If they have made progress (currentStep > 0), reset because they deviated from the path
      // This ensures the path must be walked continuously without stepping off
      if (currentStep > 0) {
        setGameState(prev => ({
          ...prev,
          pathProgress: {
            ...prev.pathProgress,
            [gateKey]: 0
          }
        }));
      }
    }
  }
}

/**
 * Initialize any theme-specific game state
 * @param {Object} existingState - Existing game state
 * @returns {Object} Updated game state with theme-specific additions
 */
export function initializeGameState(existingState) {
  return {
    ...existingState,
    pathProgress: {} // Track progress for each path-gate: { "x,y": currentStep }
  };
}

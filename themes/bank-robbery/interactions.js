// Bank Robbery Theme - Interaction Definitions

export const INTERACTIONS = {
  // Interactions will be added here
};

export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y][x];
  const available = [];

  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    const req = interaction.requirements;

    if (req.tile && tile.type !== req.tile) continue;

    if (req.inventory) {
      const hasAll = req.inventory.every(item =>
        gameState.collectedItems.includes(item)
      );
      if (!hasAll) continue;
    }

    if (req.notInventory) {
      const hasAny = req.notInventory.some(item =>
        gameState.collectedItems.includes(item)
      );
      if (hasAny) continue;
    }

    available.push(id);
  }

  return available;
}

export function getInteractionLabel(interactionId) {
  const interaction = INTERACTIONS[interactionId];
  return interaction?.label || 'Interact...';
}

export function executeInteraction(interactionId, gameState, grid, x, y) {
  const interaction = INTERACTIONS[interactionId];
  if (!interaction) {
    return { success: false, error: 'Interaction not found' };
  }

  const result = interaction.execute(gameState, grid, x, y);

  if (result.removeItems) {
    result.removeItems.forEach(item => {
      const idx = gameState.collectedItems.indexOf(item);
      if (idx !== -1) gameState.collectedItems.splice(idx, 1);
    });
  }

  if (result.addItems) {
    result.addItems.forEach(item => {
      if (!gameState.collectedItems.includes(item)) {
        gameState.collectedItems.push(item);
      }
    });
  }

  return result;
}

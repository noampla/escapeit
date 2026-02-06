// Mad Science Lab Theme - Interaction Definitions

export const INTERACTIONS = {
  // Interactions will be added as we expand the theme
};

// Get available interactions at a position
export function getAvailableInteractions(gameState, grid, x, y) {
  return []; // No interactions yet
}

// Get label for an interaction
export function getInteractionLabel(interactionId) {
  const interaction = INTERACTIONS[interactionId];
  return interaction?.label || interactionId;
}

// Execute an interaction
export function executeInteraction(interactionId, gameState, grid, x, y) {
  return {
    success: false,
    message: 'Unknown interaction'
  };
}

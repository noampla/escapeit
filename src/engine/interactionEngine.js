// Interaction Engine - Handles theme-based interactions
export class InteractionEngine {
  constructor(theme) {
    this.theme = theme;
  }

  // Get all available interactions at a position
  getAvailableActions(gameState, grid, x, y) {
    if (!this.theme) return [];
    return this.theme.getAvailableInteractions(gameState, grid, x, y);
  }

  // Execute an interaction
  executeInteraction(interactionId, gameState, grid, x, y) {
    if (!this.theme) {
      return { success: false, error: 'No theme loaded' };
    }

    const result = this.theme.executeInteraction(interactionId, gameState, grid, x, y);

    // Handle common result properties
    if (result.success) {
      // Apply grid modifications if specified
      if (result.modifyGrid) {
        // Grid is modified in-place by the interaction
      }

      // Apply inventory modifications if specified
      if (result.modifyInventory) {
        // Inventory is modified in-place by the interaction
      }

      // Apply state modifications
      if (result.modifyState) {
        Object.assign(gameState, result.modifyState);
      }
    }

    return result;
  }

  // Get label for interaction
  getLabel(interactionId) {
    if (!this.theme) return 'Interact...';
    return this.theme.getInteractionLabel(interactionId);
  }
}

export default InteractionEngine;

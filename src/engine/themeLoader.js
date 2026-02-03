// Theme Loader - Dynamically loads theme modules
export class ThemeLoader {
  constructor(themeId) {
    this.themeId = themeId;
    this.theme = null;
    this.tiles = null;
    this.items = null;
    this.interactions = null;
    this.hazards = null;
  }

  async load() {
    try {
      // Dynamic imports for theme modules
      const themeModule = await import(`../../themes/${this.themeId}/theme.json`);
      const tilesModule = await import(`../../themes/${this.themeId}/tiles.js`);
      const itemsModule = await import(`../../themes/${this.themeId}/items.js`);
      const interactionsModule = await import(`../../themes/${this.themeId}/interactions.js`);
      const hazardsModule = await import(`../../themes/${this.themeId}/hazards.js`);

      this.theme = themeModule.default || themeModule;
      this.tiles = tilesModule;
      this.items = itemsModule;
      this.interactions = interactionsModule;
      this.hazards = hazardsModule;

      return this;
    } catch (error) {
      console.error(`Failed to load theme "${this.themeId}":`, error);
      throw new Error(`Theme "${this.themeId}" could not be loaded`);
    }
  }

  // Delegation methods for easy access
  getTileTypes() {
    return this.tiles?.TILE_TYPES || {};
  }

  getItemTypes() {
    return this.items?.ITEM_TYPES || {};
  }

  getInteractions() {
    return this.interactions?.INTERACTIONS || {};
  }

  getHazards() {
    return this.hazards?.HAZARD_TYPES || {};
  }

  getConfigHelp() {
    return this.tiles?.CONFIG_HELP || {};
  }

  // Tile functions
  isWalkable(tileType, gameState) {
    return this.tiles?.isWalkable?.(tileType, gameState) || false;
  }

  renderTile(ctx, tile, x, y, size) {
    return this.tiles?.renderTile?.(ctx, tile, x, y, size) || false;
  }

  getTileEmoji(tileType) {
    return this.tiles?.getTileEmoji?.(tileType) || null;
  }

  // Item functions
  renderItem(ctx, itemType, x, y, size, state) {
    return this.items?.renderItem?.(ctx, itemType, x, y, size, state) || false;
  }

  getItemEmoji(itemType) {
    return this.items?.getItemEmoji?.(itemType) || null;
  }

  // Interaction functions
  getAvailableInteractions(gameState, grid, x, y) {
    return this.interactions?.getAvailableInteractions?.(gameState, grid, x, y) || [];
  }

  getInteractionLabel(interactionId) {
    return this.interactions?.getInteractionLabel?.(interactionId) || 'Interact...';
  }

  executeInteraction(interactionId, gameState, grid, x, y) {
    return this.interactions?.executeInteraction?.(interactionId, gameState, grid, x, y) || {
      success: false,
      error: 'Interaction not found'
    };
  }

  // Hazard functions
  checkHazardAt(grid, x, y, gameState) {
    return this.hazards?.checkHazardAt?.(grid, x, y, gameState) || null;
  }

  getAllHazardZones(grid) {
    return this.hazards?.getAllHazardZones?.(grid) || [];
  }

  renderHazardOverlay(ctx, grid, tileSize, offsetX, offsetY) {
    return this.hazards?.renderHazardOverlay?.(ctx, grid, tileSize, offsetX, offsetY);
  }

  // Theme hooks (for future extensibility)
  callHook(hookName, ...args) {
    const hooks = this.theme?.hooks || {};
    const hook = hooks[hookName];
    if (hook && typeof hook === 'function') {
      return hook(...args);
    }
    return null;
  }
}

export default ThemeLoader;

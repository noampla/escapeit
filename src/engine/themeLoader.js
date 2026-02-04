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

  // Get item label with state (for inventory display)
  getItemLabel(itemType, state) {
    if (this.items?.getItemLabel) {
      return this.items.getItemLabel(itemType, state);
    }
    const item = this.items?.ITEM_TYPES?.[itemType];
    return item?.label || itemType;
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

  // === NEW: Tile Classification Methods ===

  // Tiles that items can be dropped on
  getGroundTiles() {
    return this.tiles?.GROUND_TILES || ['ground', 'floor', 'start'];
  }

  // Tiles player can interact with (E key)
  getInteractableTiles() {
    return this.tiles?.INTERACTABLE_TILES || [];
  }

  // Tiles to ignore for floor color detection when picking up items
  getIgnoreTiles() {
    return this.tiles?.IGNORE_TILES || ['wall', 'empty'];
  }

  // Tiles that use lock colors (doors, keys, cards)
  getLockTiles() {
    return this.tiles?.LOCK_TILES || [];
  }

  // === NEW: Movement Methods ===

  // Check if player can move into a tile - returns { allowed, message?, loseLife?, moveRaft?, respawn? }
  checkMovementInto(tileType, gameState, tileConfig) {
    if (this.tiles?.checkMovementInto) {
      return this.tiles.checkMovementInto(tileType, gameState, tileConfig);
    }
    // Default: use walkability
    return { allowed: this.isWalkable(tileType, gameState) };
  }

  // === NEW: Exit Configuration ===

  // Get exit tile types for this theme
  getExitTiles() {
    return this.theme?.exitTiles || ['exit'];
  }

  // Get start/spawn tile type
  getStartTile() {
    return this.theme?.startTile || 'start';
  }

  // Check if player meets exit requirements - returns { allowed, message? }
  checkExitRequirements(gameState, exitConfig) {
    if (this.tiles?.checkExitRequirements) {
      return this.tiles.checkExitRequirements(gameState, exitConfig);
    }
    // Default: always allowed
    return { allowed: true };
  }

  // === NEW: Mission Methods ===

  // Get mission types available for this theme
  getMissionTypes() {
    return this.theme?.missions?.types || null;
  }

  // Get target options for a mission type (e.g., items for 'collect' mission)
  getMissionTargetOptions(missionType) {
    return this.theme?.missions?.targetOptions?.[missionType] || [];
  }

  // Get default mission if none specified
  getDefaultMission() {
    return this.theme?.missions?.defaultMission || {
      type: 'escape',
      description: 'Reach the exit'
    };
  }

  // Get hazard tile types (for 'extinguish' mission checking)
  getHazardTileTypes() {
    return this.tiles?.HAZARD_TILE_TYPES || ['fire'];
  }

  // === NEW: UI Theming ===

  // Get UI color scheme
  getUIColors() {
    return this.theme?.ui || {
      primaryColor: '#68aa44',
      backgroundColor: '#0a1f0a',
      accentColor: '#a8f0a8',
      dangerColor: '#ff4444',
      panelBackground: 'rgba(30, 45, 30, 0.95)',
      messageBackground: 'rgba(58, 122, 58, 0.95)'
    };
  }

  // Get lock colors (for doors/keys/cards)
  getLockColors() {
    return this.tiles?.LOCK_COLORS || this.items?.LOCK_COLORS || {
      red: { label: 'Red', color: '#cc4444' },
      blue: { label: 'Blue', color: '#4444cc' },
      green: { label: 'Green', color: '#44cc44' },
      yellow: { label: 'Yellow', color: '#cccc44' },
      purple: { label: 'Purple', color: '#cc44cc' }
    };
  }

  // Get floor colors (for floor tile configuration)
  getFloorColors() {
    return this.tiles?.FLOOR_COLORS || {};
  }

  // Get camera directions (for camera tile configuration)
  getCameraDirections() {
    return this.tiles?.CAMERA_DIRECTIONS || {};
  }

  // === Generic Config Schema Methods ===

  // Get config schema for all tiles
  getConfigSchema() {
    return this.tiles?.CONFIG_SCHEMA || {};
  }

  // Get config schema for a specific tile type
  getTileConfigSchema(tileType) {
    return this.tiles?.CONFIG_SCHEMA?.[tileType] || null;
  }

  // Get options for a config field by key name (e.g., 'FLOOR_COLORS', 'LOCK_COLORS')
  getConfigOptions(optionsKey) {
    // Look up the options from tiles module exports
    return this.tiles?.[optionsKey] || {};
  }

  // === NEW: Inventory Icon Methods ===

  // Get custom inventory icon component for an item type
  getInventoryIconComponent(itemType) {
    return this.items?.InventoryIcons?.[itemType] || null;
  }

  // Render inventory item (for HUD display)
  renderInventoryItem(ctx, itemType, x, y, size, itemState) {
    if (this.items?.renderInventoryItem) {
      return this.items.renderInventoryItem(ctx, itemType, x, y, size, itemState);
    }
    return this.renderItem(ctx, itemType, x, y, size, itemState);
  }

  // === NEW: Wearable Methods ===

  // Get wearable definitions
  getWearables() {
    return this.items?.WEARABLES || {};
  }

  // Check if an item type is wearable
  isWearable(itemType) {
    const item = this.items?.ITEM_TYPES?.[itemType];
    return item?.wearable === true;
  }

  // Alias for isWearable (used by HUD)
  isItemWearable(itemType) {
    return this.isWearable(itemType);
  }

  // Get wearable effects for an item
  getWearableEffects(itemType) {
    return this.items?.WEARABLES?.[itemType]?.effects || {};
  }
}

export default ThemeLoader;

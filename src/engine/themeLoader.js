// Theme Loader - Dynamically loads theme modules
import soundManager from './soundManager.js';
import { getThemeMessage, getThemeItemLabel, registerThemeTranslations } from '../i18n';
import { AVAILABLE_THEMES } from '../utils/themeRegistry';

/**
 * Preload translations for all registered themes
 * Call this at app startup so theme names/descriptions are available in ThemeSelect
 */
export async function preloadAllThemeTranslations() {
  const languages = ['en', 'he'];

  for (const theme of AVAILABLE_THEMES) {
    for (const lang of languages) {
      try {
        const i18nModule = await import(`../../themes/${theme.id}/i18n/${lang}.json`);
        const data = i18nModule.default || i18nModule;
        registerThemeTranslations(theme.id, lang, data);
      } catch {
        // No i18n file for this theme/language - that's OK
      }
    }
  }
}

export class ThemeLoader {
  constructor(themeId) {
    this.themeId = themeId;
    this.theme = null;
    this.tiles = null;
    this.items = null;
    this.interactions = null;
    this.hazards = null;
    this.sounds = null;
    this.story = null;
    this.language = 'en'; // Default language for message translation
  }

  // Set the current language for message translation
  setLanguage(lang) {
    this.language = lang;
  }

  // Load theme-specific translation files
  async loadThemeTranslations() {
    const languages = ['en', 'he'];

    for (const lang of languages) {
      try {
        const i18nModule = await import(`../../themes/${this.themeId}/i18n/${lang}.json`);
        const data = i18nModule.default || i18nModule;
        registerThemeTranslations(this.themeId, lang, data);
      } catch {
        // No i18n file for this language - that's OK, fallback will be used
      }
    }
  }

  // Translate a theme message key to the current language
  translateMessage(messageKey, params = {}, fallback = '') {
    return getThemeMessage(this.language, this.themeId, messageKey, params, fallback);
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

      // Try to load theme-specific sounds (optional module)
      try {
        const soundsModule = await import(`../../themes/${this.themeId}/sounds.js`);
        this.sounds = soundsModule;
        // Register theme sounds with soundManager
        soundManager.setThemeSounds({
          themeId: this.themeId,
          basePath: soundsModule.SOUNDS_PATH || `/themes/${this.themeId}/sounds/`,
          sounds: soundsModule.SOUNDS || {}
        });
      } catch {
        // No sounds.js for this theme - use engine defaults
        this.sounds = null;
        soundManager.clearThemeSounds();
      }

      // Try to load theme-specific story/tutorial (optional module)
      try {
        const storyModule = await import(`../../themes/${this.themeId}/story.js`);
        this.story = storyModule;
      } catch {
        // No story.js for this theme
        this.story = null;
      }

      // Load theme-specific translations (optional)
      await this.loadThemeTranslations();

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

  // Story/Tutorial functions
  hasStoryContent() {
    return this.story?.hasStoryContent?.() || false;
  }

  getStoryContent() {
    return this.story?.getStoryContent?.() || null;
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
  // Uses theme i18n translations when available
  getItemLabel(itemType, state) {
    // First try to get the localized label from theme i18n
    const localizedLabel = getThemeItemLabel(this.language, this.themeId, itemType, null);

    // If we have a localized base label, handle state-dependent variants
    if (localizedLabel) {
      // Handle bucket filled/empty state
      if (itemType === 'bucket' && state?.filled !== undefined) {
        const filledKey = state.filled ? 'bucketFilled' : 'bucketEmpty';
        const stateLabel = getThemeItemLabel(this.language, this.themeId, filledKey, null);
        if (stateLabel) return stateLabel;
      }

      // Handle colored items (key, card)
      if ((itemType === 'key' || itemType === 'card') && state?.lockColor) {
        const colors = this.getLockColors();
        const colorLabel = colors[state.lockColor]?.label || state.lockColor;
        return `${colorLabel} ${localizedLabel}`;
      }

      return localizedLabel;
    }

    // Fallback to theme's getItemLabel (returns English)
    if (this.items?.getItemLabel) {
      return this.items.getItemLabel(itemType, state);
    }
    const item = this.items?.ITEM_TYPES?.[itemType];
    return item?.label || itemType;
  }

  // Interaction functions
  getAvailableInteractions(gameState, grid, x, y, isSelfCheck = false) {
    return this.interactions?.getAvailableInteractions?.(gameState, grid, x, y, isSelfCheck) || [];
  }

  getInteractionLabel(interactionId) {
    return this.interactions?.getInteractionLabel?.(interactionId) || 'Interact...';
  }

  executeInteraction(interactionId, gameState, grid, x, y, phase = 'complete') {
    return this.interactions?.executeInteraction?.(interactionId, gameState, grid, x, y, phase) || {
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
  checkMovementInto(tileType, gameState, tileConfig, grid, x, y) {
    if (this.tiles?.checkMovementInto) {
      return this.tiles.checkMovementInto(tileType, gameState, tileConfig, grid, x, y);
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

  // Get theme-specific config for a mission type (label, amount range, etc.)
  getMissionConfig(missionType) {
    return this.theme?.missions?.config?.[missionType] || null;
  }

  // Check if a mission is complete (theme-specific logic)
  // Returns true if complete, false otherwise
  checkMissionComplete(mission, gameState) {
    const config = this.getMissionConfig(mission.type);

    // For amount-based missions, check the field specified in config
    if (config?.checkField) {
      const targetAmount = mission.targetAmount || config.default || 0;
      // Navigate the checkField path (e.g., "containers.bag.contents")
      const parts = config.checkField.split('.');
      let value = gameState;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return false;
      }
      return value >= targetAmount;
    }

    return null; // Let engine handle with default logic
  }

  // Get hazard tile types (for 'extinguish' mission checking)
  getHazardTileTypes() {
    return this.tiles?.HAZARD_TILE_TYPES || ['fire'];
  }

  // === Entity Movement ===
  moveEntities(grid, gameState) {
    return this.tiles?.moveEntities?.(grid, gameState) || null;
  }

  // === Player Rendering ===

  // Render player with theme-specific appearance based on worn items
  renderPlayer(ctx, x, y, size, direction, gameState) {
    if (this.tiles?.renderPlayer) {
      return this.tiles.renderPlayer(ctx, x, y, size, direction, gameState);
    }
    return false; // Return false to use default player rendering
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

  // Get notification colors for styled notifications
  getNotificationColors() {
    const defaultColors = {
      success: { bg: 'rgba(68, 136, 68, 0.95)', text: '#e8ffe8', border: '#88cc88' },
      info: { bg: 'rgba(58, 106, 138, 0.95)', text: '#e8f4ff', border: '#88aacc' },
      warning: { bg: 'rgba(138, 106, 58, 0.95)', text: '#fff8e8', border: '#ccaa66' },
      error: { bg: 'rgba(138, 58, 58, 0.95)', text: '#ffe8e8', border: '#cc6666' },
      danger: { bg: 'rgba(106, 42, 42, 0.95)', text: '#ffd8d8', border: '#aa4444' }
    };
    return this.theme?.ui?.notificationColors || defaultColors;
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

  // Check if an item tile can be picked up from adjacent tiles
  canPickupFromAdjacent(tileType) {
    const tileDef = this.tiles?.TILE_TYPES?.[tileType];
    return tileDef?.canPickupFromAdjacent === true;
  }

  // Get wearable effects for an item
  getWearableEffects(itemType) {
    return this.items?.WEARABLES?.[itemType]?.effects || {};
  }

  // === Container Methods ===

  // Get container definitions
  getContainers() {
    return this.items?.CONTAINERS || {};
  }

  // Check if an item type is a container
  isContainer(itemType) {
    return this.items?.isContainer?.(itemType) || this.items?.ITEM_TYPES?.[itemType]?.isContainer === true;
  }

  // Get container definition for an item type
  getContainerDef(itemType) {
    return this.items?.getContainerDef?.(itemType) || this.items?.CONTAINERS?.[itemType] || null;
  }

  // Custom drop handler - allows theme to handle special item drops (e.g., raft on adjacent water)
  // Returns { handled: true, newGrid, newInventory, message } if theme handles it, null otherwise
  customDrop(itemObj, gameState, grid, playerPos, direction) {
    if (this.interactions?.customDrop) {
      return this.interactions.customDrop(itemObj, gameState, grid, playerPos, direction);
    }
    return null;
  }

  // Custom pickup handler - allows theme to handle special pickups (e.g., raft tile -> water)
  // Returns { handled: true, newGrid, newInventory, message } if theme handles it, null otherwise
  customPickup(gameState, grid, playerPos, direction, maxInventory) {
    if (this.interactions?.customPickup) {
      return this.interactions.customPickup(gameState, grid, playerPos, direction, maxInventory);
    }
    return null;
  }

  // === Sound Methods ===

  /**
   * Play a sound effect
   * Checks theme-specific sounds first, falls back to engine defaults
   *
   * @param {string} soundType - Sound type (walk, blocked, pickup, drop, interact, etc.)
   * @param {Object} options - Optional: { volume, playbackRate }
   */
  playSound(soundType, options = {}) {
    soundManager.play(soundType, options);
  }

  /**
   * Get the sound to play for a specific interaction
   * Themes can define custom sounds per interaction in INTERACTION_SOUNDS
   */
  getInteractionSound(interactionId) {
    return this.sounds?.INTERACTION_SOUNDS?.[interactionId] || 'interactComplete';
  }

  /**
   * Play the sound associated with an interaction completion
   */
  playInteractionSound(interactionId, options = {}) {
    const soundType = this.getInteractionSound(interactionId);
    soundManager.play(soundType, options);
  }

  /**
   * Check if sounds are enabled
   */
  isSoundEnabled() {
    return soundManager.enabled;
  }

  /**
   * Toggle sounds on/off
   */
  toggleSound() {
    return soundManager.toggle();
  }

  /**
   * Set sound enabled state
   */
  setSoundEnabled(enabled) {
    soundManager.setEnabled(enabled);
  }

  /**
   * Set master volume
   */
  setSoundVolume(volume) {
    soundManager.setVolume(volume);
  }
}

export default ThemeLoader;

import { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import Grid from './Grid';
import { findTile, cloneGrid } from '../engine/tiles';
import { canMoveTo, isSamePos } from '../engine/collision';
import { getAllHazardZones } from '../engine/hazards';
import { checkAllMissions, checkMissionComplete } from '../engine/missions';
import { DIRECTIONS, DEFAULT_INVENTORY_CAPACITY, TILE_SIZE } from '../utils/constants';
import { ThemeContext } from '../App';
import { InteractionEngine } from '../engine/interactionEngine';
import { useUser } from '../contexts/UserContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { submitScore } from '../utils/leaderboardService.js';
import Leaderboard from './Leaderboard.jsx';
import soundManager from '../engine/soundManager.js';
import { moveEntities } from '../engine/entities.js';
import NotificationPanel from './NotificationPanel';
import StoryModal from './StoryModal';

const MOVE_COOLDOWN = 150;
const INTERACTION_DURATION = 1500;

// Default lock colors (used if theme doesn't provide them)
const DEFAULT_LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444' },
  blue: { label: 'Blue', color: '#4444cc' },
  green: { label: 'Green', color: '#44cc44' },
  yellow: { label: 'Yellow', color: '#cccc44' },
  purple: { label: 'Purple', color: '#cc44cc' },
};

// Generic inventory icon component - uses theme's renderInventoryItem
function InventoryIcon({ theme, itemType, size = 24, itemState = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    // Try theme's inventory item rendering
    const rendered = theme?.renderInventoryItem?.(ctx, itemType, 0, 0, size, itemState);
    if (!rendered) {
      // Fallback to emoji
      const emoji = theme?.getItemEmoji?.(itemType);
      if (emoji) {
        ctx.font = `${size * 0.7}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size / 2, size / 2);
      }
    }
  }, [theme, itemType, size, itemState]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />;
}

function convertLegacyItems(grid) {
  const newGrid = cloneGrid(grid);
  for (let y = 0; y < newGrid.length; y++) {
    for (let x = 0; x < newGrid[0].length; x++) {
      const cell = newGrid[y][x];
      // Convert old 'item' format to 'item-<type>' format in object layer
      if (cell.object?.type === 'item' && cell.object.config?.itemType) {
        newGrid[y][x].object = {
          type: `item-${cell.object.config.itemType}`,
          config: {}
        };
      }
    }
  }
  return newGrid;
}

// Calculate viewport centered on player position
function calculatePlayerViewport(playerPos, grid, tilesX = 20, tilesY = 15) {
  const gridCols = grid[0].length;
  const gridRows = grid.length;
  const halfX = Math.floor(tilesX / 2);
  const halfY = Math.floor(tilesY / 2);

  let minX = playerPos.x - halfX;
  let maxX = playerPos.x + halfX;
  let minY = playerPos.y - halfY;
  let maxY = playerPos.y + halfY;

  // Clamp to grid bounds
  if (minX < 0) { maxX -= minX; minX = 0; }
  if (minY < 0) { maxY -= minY; minY = 0; }
  if (maxX >= gridCols) { minX -= (maxX - gridCols + 1); maxX = gridCols - 1; }
  if (maxY >= gridRows) { minY -= (maxY - gridRows + 1); maxY = gridRows - 1; }

  // Final clamp
  minX = Math.max(0, minX);
  minY = Math.max(0, minY);

  return { minX, minY, maxX, maxY };
}

function getAdjacentPositions(x, y, grid) {
  const adjacent = [];
  const gridRows = grid.length;
  const gridCols = grid[0].length;
  if (y > 0) adjacent.push({ x, y: y - 1, key: `${x},${y - 1}` });
  if (y < gridRows - 1) adjacent.push({ x, y: y + 1, key: `${x},${y + 1}` });
  if (x > 0) adjacent.push({ x: x - 1, y, key: `${x - 1},${y}` });
  if (x < gridCols - 1) adjacent.push({ x: x + 1, y, key: `${x + 1},${y}` });
  return adjacent;
}

function initializeRevealedTiles(startX, startY, grid) {
  const revealed = new Set();
  revealed.add(`${startX},${startY}`);
  const adjacent = getAdjacentPositions(startX, startY, grid);
  adjacent.forEach(pos => revealed.add(pos.key));
  return revealed;
}

// isMissionDone is now imported as checkMissionComplete from missions.js

export default function SolverMode({ level, onBack, isTestMode = false }) {
  const theme = useContext(ThemeContext);
  const themeId = theme?.themeId || 'forest';
  const { t, isRTL, language, setLanguage, getItemLabel, getTileLabel, getMessage } = useLanguage();

  // Keep theme's language in sync with app language
  useEffect(() => {
    if (theme?.setLanguage) {
      theme.setLanguage(language);
    }
  }, [theme, language]);

  // Helper to get localized mission description
  const getMissionDescription = (mission) => {
    if (mission.description) return mission.description;
    const targetLabel = mission.targetId
      ? getTileLabel(themeId, mission.targetId, mission.targetId)
      : '';
    const typeKey = `missionTypes.${mission.type}`;
    return t(typeKey, { target: targetLabel });
  };
  const { userId, displayName } = useUser();
  const notification = useNotification();
  const interactionEngine = useMemo(() => theme ? new InteractionEngine(theme) : null, [theme]);

  // Get theme-specific values with defaults
  const LOCK_COLORS = useMemo(() => theme?.getLockColors?.() || DEFAULT_LOCK_COLORS, [theme]);
  const groundTiles = useMemo(() => theme?.getGroundTiles?.() || ['ground', 'floor', 'start'], [theme]);
  const interactableTiles = useMemo(() => theme?.getInteractableTiles?.() || [], [theme]);
  const ignoreTiles = useMemo(() => theme?.getIgnoreTiles?.() || ['wall', 'empty'], [theme]);
  const exitTiles = useMemo(() => theme?.getExitTiles?.() || ['exit'], [theme]);
  const startTileType = useMemo(() => theme?.getStartTile?.() || 'start', [theme]);

  // Compute effective missions - always include default escape mission if not present
  const effectiveMissions = useMemo(() => {
    const levelMissions = level.missions || [];
    const hasEscapeMission = levelMissions.some(m => m.type === 'escape');
    if (hasEscapeMission) {
      return levelMissions;
    }
    // Add the theme's default mission (usually "reach exit/car")
    // Use theme's default mission but don't use hardcoded description - let getMissionDescription localize it
    const themeDefault = theme?.getDefaultMission?.();
    const defaultMission = themeDefault ? { ...themeDefault, description: '' } : { type: 'escape', description: '' };
    return [...levelMissions, defaultMission];
  }, [level.missions, theme]);

  const [grid, setGrid] = useState(() => convertLegacyItems(level.grid));
  // Find start position using theme's start tile type, with fallback to generic 'start'
  const startPos = useMemo(() => {
    return findTile(level.grid, startTileType)
      || findTile(level.grid, 'start')
      || { x: 1, y: 1 };
  }, [level.grid, startTileType]);
  const [playerPos, setPlayerPos] = useState(() => ({ ...startPos }));
  const [lives, setLives] = useState(level.lives || 3);
  const maxInventory = level.inventoryCapacity || DEFAULT_INVENTORY_CAPACITY;
  const [gameState, setGameState] = useState({
    collectedItems: [],
    rescuedFriends: 0,
    reachedLocations: [],
    reachedExit: false,
    inventory: [],
    worn: {}, // Wearable items (e.g., uniform)
    containers: {}, // Container items (e.g., bag)
  });
  const [revealedTiles, setRevealedTiles] = useState(() => initializeRevealedTiles(startPos.x, startPos.y, level.grid));
  const [tick, setTick] = useState(0);
  const [message, setMessage] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [hazardZones, setHazardZones] = useState([]);
  const [interactionState, setInteractionState] = useState(null);
  const [dropMenuOpen, setDropMenuOpen] = useState(false);
  const [mouseHoldState, setMouseHoldState] = useState(null);
  const [showStoryModal, setShowStoryModal] = useState(false);

  // Check if theme has story content and show on first load
  const storyContent = useMemo(() => theme?.getStoryContent?.(), [theme]);
  const hasStory = useMemo(() => theme?.hasStoryContent?.() || false, [theme]);

  useEffect(() => {
    // Show story modal on first load if theme has story content
    // Only show once per level per browser session
    const levelKey = `story-seen-${themeId}-${level.name || level.id || 'unnamed'}`;
    const hasSeenStory = sessionStorage.getItem(levelKey);
    if (hasStory && !hasSeenStory) {
      setShowStoryModal(true);
      sessionStorage.setItem(levelKey, 'true');
    }
  }, [hasStory, themeId, level.name, level.id]);
  const [playerDirection, setPlayerDirection] = useState('down');
  const [moveCount, setMoveCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [inlineMenu, setInlineMenu] = useState(null); // { actions: [{label, action, key}] }
  const [soundEnabled, setSoundEnabled] = useState(() => soundManager.enabled);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const gridContainerRef = useRef(null);

  const messageTimerRef = useRef(null);
  const gridRef = useRef(grid);
  const gameStateRef = useRef(gameState);
  const playerPosRef = useRef(playerPos);
  const livesRef = useRef(lives);
  const gameOverRef = useRef(gameOver);
  const lastMoveRef = useRef(0);
  const lastDirRef = useRef('right');
  const playerDirectionRef = useRef('down');
  const keysDown = useRef(new Set());
  const keyPressOrder = useRef([]); // Track order of key presses
  const exitMessageShownRef = useRef(false);
  const interactionStateRef = useRef(interactionState);
  const interactionKeyReleasedRef = useRef(true); // Track if E/number key was released since last interaction
  const lastHazardDamageRef = useRef(0); // Track last time we took continuous hazard damage
  const revealedTilesRef = useRef(revealedTiles);
  const dropMenuOpenRef = useRef(dropMenuOpen);
  const inlineMenuRef = useRef(inlineMenu);
  const showRestartConfirmRef = useRef(showRestartConfirm);

  gridRef.current = grid;
  gameStateRef.current = gameState;
  playerPosRef.current = playerPos;
  livesRef.current = lives;
  gameOverRef.current = gameOver;
  interactionStateRef.current = interactionState;
  revealedTilesRef.current = revealedTiles;
  dropMenuOpenRef.current = dropMenuOpen;
  inlineMenuRef.current = inlineMenu;
  showRestartConfirmRef.current = showRestartConfirm;

  // Notification helper using translation keys
  const showNotification = useCallback((key, type = 'info', params = {}, duration = null) => {
    if (!notification) return;
    notification.notify(key, type, params, duration);
  }, [notification]);

  // Raw message notification for dynamic/theme content
  // Attempts to translate theme messages using getMessage, falls back to raw text
  const showMessage = useCallback((msg, duration = 1500, type = 'info') => {
    if (!notification) return;
    // Try to translate via theme's translateMessage if available
    const translatedMsg = theme?.translateMessage?.(msg, {}, msg) || msg;
    notification.notifyRaw(translatedMsg, type, duration);
  }, [notification, theme]);

  const respawn = useCallback(() => {
    setPlayerPos({ ...startPos });
  }, [startPos]);

  const toggleSound = useCallback(() => {
    const newEnabled = soundManager.toggle();
    setSoundEnabled(newEnabled);
  }, []);

  const loseLife = useCallback(() => {
    const newLives = livesRef.current - 1;
    setLives(newLives);
    soundManager.play('damage');
    if (newLives <= 0) {
      setGameOver('fail');
      soundManager.play('lose');
      showNotification('notifications.gameOver', 'danger', {}, 999999);
      return 0;
    }
    return newLives;
  }, [showNotification]);

  const restart = useCallback(() => {
    setGrid(convertLegacyItems(level.grid));
    setPlayerPos({ ...startPos });
    setLives(level.lives || 3);
    setGameState({
      collectedItems: [], rescuedFriends: 0,
      reachedLocations: [], reachedExit: false, inventory: [],
      worn: {},
      containers: {},
    });
    setRevealedTiles(initializeRevealedTiles(startPos.x, startPos.y, level.grid));
    setTick(0);
    setGameOver(null);
    setMessage(null);
    setInteractionState(null);
    setDropMenuOpen(false);
    setMoveCount(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    keysDown.current.clear();
    keyPressOrder.current = [];
    exitMessageShownRef.current = false;
    interactionKeyReleasedRef.current = true;
  }, [level, startPos]);

  const dropItem = useCallback((index) => {
    const inv = gameStateRef.current.inventory;
    if (index < 0 || index >= inv.length) return;

    const pos = playerPosRef.current;
    const currentGrid = gridRef.current;
    const dropped = inv[index];
    const playerDir = playerDirectionRef.current;

    // Check if theme has custom drop handler for this item
    const customResult = theme?.customDrop?.(dropped, gameStateRef.current, currentGrid, pos, playerDir);
    if (customResult?.handled) {
      if (customResult.newGrid) setGrid(customResult.newGrid);
      if (customResult.newInventory !== undefined) {
        setGameState(prev => ({ ...prev, inventory: customResult.newInventory }));
      }
      const dropMsg = customResult.messageKey
        ? getMessage(themeId, customResult.messageKey, customResult.messageParams || {})
        : customResult.message;
      if (dropMsg) showMessage(dropMsg, 1500, 'info');
      setDropMenuOpen(false);
      return;
    }

    const cell = currentGrid[pos.y][pos.x];
    // Allow dropping on ground-type tiles (uses theme's ground tiles)
    if (!groundTiles.includes(cell.floor?.type)) {
      showNotification('notifications.cantDropHere', 'error');
      return;
    }

    // Don't allow dropping if there's already an object on this tile (door, item, etc.)
    if (cell.object) {
      showNotification('notifications.cantDropHere', 'error');
      return;
    }

    const newGrid = cloneGrid(currentGrid);
    // Drop to object layer
    newGrid[pos.y][pos.x].object = { type: `item-${dropped.itemType}`, config: { ...dropped } };
    setGrid(newGrid);
    setGameState(prev => ({
      ...prev,
      inventory: prev.inventory.filter((_, i) => i !== index),
    }));
    const ITEM_TYPES = theme?.getItemTypes() || {};
    const itemDef = ITEM_TYPES[dropped.itemType];
    const droppedLabel = getItemLabel(themeId, dropped.itemType, itemDef?.label || dropped.itemType);
    soundManager.play('drop');
    showNotification('notifications.dropped', 'info', { emoji: itemDef?.emoji || '', label: droppedLabel });
    setDropMenuOpen(false);
  }, [showNotification, theme, getItemLabel, themeId]);

  const pickUpItem = useCallback((cell, px, py) => {
    const currentGS = gameStateRef.current;

    // Check if tile is pickable (some items like money must be collected via interaction)
    const TILE_TYPES = theme?.getTileTypes?.() || {};
    const tileDef = TILE_TYPES[cell.object?.type];
    if (tileDef?.pickable === false) {
      showNotification('notifications.cantPickUp', 'error');
      return false;
    }

    const itemType = cell.object.type.replace('item-', '');

    // Check if this is a container item - auto-equip instead of adding to inventory
    const isContainer = theme?.isContainer?.(itemType);

    if (!isContainer && currentGS.inventory.length >= maxInventory) {
      showNotification('notifications.inventoryFull', 'warning', { max: maxInventory });
      return false;
    }

    const newGrid = cloneGrid(gridRef.current);

    // With two-layer system, just clear the object layer - floor remains!
    newGrid[py][px].object = null;
    setGrid(newGrid);

    // Preserve all config properties from tile to inventory item
    const itemObj = { itemType, filled: false, ...cell.object.config };
    const itemLabel = theme?.getItemLabel?.(itemType, itemObj) || itemType;

    // Auto-equip containers (like bag)
    if (isContainer) {
      const containerDef = theme?.getContainerDef?.(itemType);
      const slot = containerDef?.slot || itemType;
      const newCapacity = cell.config?.capacity || containerDef?.defaultCapacity || 10000;
      const existingContainer = currentGS.containers?.[slot];

      setGameState(prev => {
        const existing = prev.containers?.[slot];
        if (existing) {
          // Add capacity to existing container
          return {
            ...prev,
            collectedItems: [...prev.collectedItems, itemType],
            containers: {
              ...prev.containers,
              [slot]: {
                ...existing,
                capacity: existing.capacity + newCapacity
              }
            }
          };
        }
        // Create new container
        return {
          ...prev,
          collectedItems: [...prev.collectedItems, itemType],
          containers: {
            ...prev.containers,
            [slot]: {
              itemType,
              capacity: newCapacity,
              contents: 0
            }
          }
        };
      });
      soundManager.play('pickup');
      if (existingContainer) {
        const totalCapacity = existingContainer.capacity + newCapacity;
        showNotification('notifications.capacityBonus', 'success', { capacity: newCapacity.toLocaleString(), total: totalCapacity.toLocaleString() });
      } else {
        showNotification('notifications.equipped', 'success', { label: itemLabel });
      }
      return true;
    }

    // Regular item - add to inventory
    setGameState(prev => ({
      ...prev,
      inventory: [...prev.inventory, itemObj],
      collectedItems: [...prev.collectedItems, itemType],
    }));
    soundManager.play('pickup');
    // Show special message for wearable items
    if (theme?.isWearable?.(itemType)) {
      showNotification('notifications.pickedUpWearable', 'success', { label: itemLabel });
    } else {
      showNotification('notifications.pickedUp', 'success', { label: itemLabel });
    }
    return true;
  }, [showNotification, maxInventory, theme]);

  const getInteractTargets = useCallback(() => {
    const pos = playerPosRef.current;
    const currentGrid = gridRef.current;
    const lastDir = lastDirRef.current;

    // Use theme's interactable tiles
    const itemTilePattern = /^item-/;

    const adjacent = Object.entries(DIRECTIONS).map(([dir, dd]) => ({
      x: pos.x + dd.dx, y: pos.y + dd.dy, dir,
    })).filter(p => p.x >= 0 && p.x < currentGrid[0].length && p.y >= 0 && p.y < currentGrid.length);

    const targets = [];

    const currentCell = currentGrid[pos.y][pos.x];
    if (itemTilePattern.test(currentCell.object?.type)) {
      targets.push({ x: pos.x, y: pos.y, dir: 'self' });
    }

    for (const adj of adjacent) {
      const c = currentGrid[adj.y][adj.x];
      // Check both object and floor layers for interactable tiles
      if (interactableTiles.includes(c.object?.type) || interactableTiles.includes(c.floor?.type)) {
        targets.push(adj);
      }
    }

    const valid = targets;

    valid.sort((a, b) => {
      const aMatch = a.dir === lastDir ? 0 : 1;
      const bMatch = b.dir === lastDir ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      const aDist = a.dir === 'self' ? 0 : 1;
      const bDist = b.dir === 'self' ? 0 : 1;
      return aDist - bDist;
    });

    return valid;
  }, [interactableTiles]);

  const startInteraction = useCallback((type, targetPos, progressColor = null, duration = null, visualTargetPos = null) => {
    soundManager.play('interact');
    soundManager.startProgress();

    // Try to call theme's onStart hook (only if interaction supports it)
    try {
      const currentGrid = gridRef.current;
      const currentGS = gameStateRef.current;
      const newGrid = cloneGrid(currentGrid);
      const startResult = theme?.executeInteraction?.(type, currentGS, newGrid, targetPos.x, targetPos.y, 'start');

      // Only apply grid changes if onStart actually returned something
      if (startResult && startResult.modifyGrid) {
        gridRef.current = newGrid; // Update ref IMMEDIATELY to prevent race condition with moveEntities
        setGrid(newGrid);
      }
    } catch (e) {
      // onStart is optional, ignore errors
    }

    setInteractionState({
      type,
      startTime: Date.now(),
      targetPos, // Position passed to execute function
      visualTargetPos: visualTargetPos || targetPos, // Position for progress bar display
      progress: 0,
      progressColor,
      duration: duration || INTERACTION_DURATION,
    });
  }, [theme]);

  const cancelInteraction = useCallback(() => {
    soundManager.stopProgress();

    // Try to call theme's onCancel hook (only if interaction supports it)
    if (interactionStateRef.current) {
      try {
        const currentGrid = gridRef.current;
        const currentGS = gameStateRef.current;
        const newGrid = cloneGrid(currentGrid);
        const { type, targetPos } = interactionStateRef.current;
        const cancelResult = theme?.executeInteraction?.(type, currentGS, newGrid, targetPos.x, targetPos.y, 'cancel');

        // Only apply grid changes if onCancel actually returned something
        if (cancelResult && cancelResult.modifyGrid) {
          gridRef.current = newGrid; // Update ref IMMEDIATELY to prevent race condition with moveEntities
          setGrid(newGrid);
        }
      } catch (e) {
        // onCancel is optional, ignore errors
      }
    }

    setInteractionState(null);
  }, [theme]);

  const handleMouseInteraction = useCallback((x, y) => {
    const pos = playerPosRef.current;
    const dx = x - pos.x;
    const dy = y - pos.y;
    const isAdjacent = (Math.abs(dx) === 1 && dy === 0) || (dx === 0 && Math.abs(dy) === 1);

    if (!isAdjacent) {
      showNotification('notifications.tooFar', 'warning');
      return;
    }

    // Determine direction
    let dir = '';
    if (dy === -1) dir = 'UP';
    else if (dy === 1) dir = 'DOWN';
    else if (dx === -1) dir = 'LEFT';
    else if (dx === 1) dir = 'RIGHT';

    const currentGrid = gridRef.current;
    const playerPos = playerPosRef.current;
    const currentGS = {
      ...gameStateRef.current,
      revealedTiles: revealedTilesRef.current,
      lives: livesRef.current,
      maxLives: level.lives || 3,
      playerPos: { x: playerPos.x, y: playerPos.y }
    };

    // Get available interactions from theme (exclude wear/remove - those use T key)
    const allInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, x, y) || [];
    const interactions = allInteractions.filter(i =>
      !i.id.includes('wear') && !i.id.includes('remove')
    );

    if (interactions.length === 0) {
      showNotification('notifications.nothingHere', 'info');
      return;
    }

    const possibleActions = interactions.map(interaction => ({
      type: interaction.id,
      targetPos: { x, y },
      dir,
      label: interaction.label,
      duration: interaction.duration,
      progressColor: interaction.progressColor,
      visualTarget: interaction.visualTarget,
    }));

    if (possibleActions.length > 1) {
      // Multiple actions - show inline menu (same as E key behavior)
      const actionsWithKeys = possibleActions.map((action, idx) => ({
        label: action.label,
        key: (idx + 1).toString(),
        action: () => startInteraction(action.type, action.targetPos, action.progressColor, action.duration, action.visualTarget),
      }));
      setInlineMenu({ actions: actionsWithKeys });
      return;
    }

    const action = possibleActions[0];
    startInteraction(action.type, action.targetPos, action.progressColor, action.duration, action.visualTarget);
  }, [theme, showMessage, startInteraction]);

  const completeInteraction = useCallback((interactionType, targetPos) => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const playerPos = playerPosRef.current;

    // Clone grid and gameState for theme to modify
    const newGrid = cloneGrid(currentGrid);
    const tempGameState = {
      ...currentGS,
      inventory: [...currentGS.inventory.map(item => ({ ...item }))],
      collectedItems: [...(currentGS.collectedItems || [])],
      worn: { ...(currentGS.worn || {}) },
      containers: currentGS.containers ? JSON.parse(JSON.stringify(currentGS.containers)) : {},
      revealedTiles: revealedTilesRef.current, // For visibility checks in interactions
      lives: livesRef.current, // Current lives for healing checks
      maxLives: level.lives || 3, // Maximum lives
      playerPos: { x: playerPos.x, y: playerPos.y }, // Player position for interaction checks
    };

    // Execute interaction through theme
    const result = theme?.executeInteraction?.(interactionType, tempGameState, newGrid, targetPos.x, targetPos.y);

    if (result?.success) {
      // Handle fatal interactions (instant death)
      if (result.fatal) {
        // Apply grid changes first (e.g., bomb explosion visuals)
        if (result.modifyGrid) {
          setGrid(newGrid);
        }
        // Show message and trigger game over
        soundManager.play('explosion');
        soundManager.play('lose');
        setLives(0);
        setGameOver('fail');
        const failMsg = result.messageKey ? getMessage(themeId, result.messageKey, result.messageParams || {}) : (result.message || t('notifications.gameOver'));
        showMessage(failMsg, 999999, 'danger');
        cancelInteraction();
        return;
      }

      // Play interaction-specific sound (theme can define custom sounds per interaction)
      const interactionSound = result.sound || theme?.getInteractionSound?.(interactionType) || 'interactComplete';
      soundManager.play(interactionSound);

      // Apply grid changes
      if (result.modifyGrid) {
        gridRef.current = newGrid; // Update ref IMMEDIATELY to prevent race condition with moveEntities
        setGrid(newGrid);
      }

      // Apply inventory/state changes
      if (result.modifyInventory || result.modifyState || result.modifyContainers) {
        setGameState(prev => ({
          ...prev,
          inventory: tempGameState.inventory,
          collectedItems: tempGameState.collectedItems,
          rescuedFriends: tempGameState.rescuedFriends ?? prev.rescuedFriends,
          worn: tempGameState.worn ?? prev.worn,
          containers: tempGameState.containers ?? prev.containers,
        }));
      }

      // Apply life restoration (for healing items like medkit)
      if (result.restoreLives && result.restoreLives > 0) {
        const maxLives = level.lives || 3;
        setLives(prev => Math.min(prev + result.restoreLives, maxLives));
      }

      // Show message (translate if messageKey provided)
      if (result.messageKey) {
        const msg = getMessage(themeId, result.messageKey, result.messageParams || {});
        showMessage(msg, 1500, 'success');
      } else if (result.message) {
        showMessage(result.message, 1500, 'success');
      }
    } else if (result?.error) {
      soundManager.play('blocked');
      showMessage(result.error, 1500, 'error');
    }

    // Mark that E/number key must be released before starting new interaction
    interactionKeyReleasedRef.current = false;
    cancelInteraction();
  }, [theme, showMessage, cancelInteraction]);

  const doPickup = useCallback(() => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const pos = playerPosRef.current;
    const playerDir = playerDirectionRef.current;
    const currentCell = currentGrid[pos.y][pos.x];

    // Check if theme has custom pickup handler
    const customResult = theme?.customPickup?.(currentGS, currentGrid, pos, playerDir, maxInventory);
    if (customResult?.handled) {
      if (customResult.newGrid) setGrid(customResult.newGrid);
      if (customResult.newInventory !== undefined) {
        setGameState(prev => ({ ...prev, inventory: customResult.newInventory }));
      }
      const pickupMsg = customResult.messageKey
        ? getMessage(themeId, customResult.messageKey, customResult.messageParams || {})
        : customResult.message;
      if (pickupMsg) showMessage(pickupMsg, 1500, 'info');
      return;
    }

    // Check if standing on an item
    if (currentCell.object?.type.startsWith('item-')) {
      if (currentGS.inventory.length >= maxInventory) {
        showNotification('notifications.inventoryFull', 'warning', { max: maxInventory });
        return;
      }
      pickUpItem(currentCell, pos.x, pos.y);
      return;
    }

    // Check adjacent tiles for items that can be picked up from adjacent
    const adjacentDirs = [
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 },  // right
    ];
    for (const dir of adjacentDirs) {
      const nx = pos.x + dir.dx;
      const ny = pos.y + dir.dy;
      if (nx >= 0 && nx < currentGrid[0].length && ny >= 0 && ny < currentGrid.length) {
        const adjCell = currentGrid[ny][nx];
        if (adjCell.object?.type?.startsWith('item-') && theme?.canPickupFromAdjacent?.(adjCell.object.type)) {
          if (currentGS.inventory.length >= maxInventory) {
            showNotification('notifications.inventoryFull', 'warning', { max: maxInventory });
            return;
          }
          pickUpItem(adjCell, nx, ny);
          return;
        }
      }
    }

    soundManager.play('blocked');
    showNotification('notifications.noItemHere', 'info');
  }, [showMessage, pickUpItem, theme, maxInventory]);

  // Toggle wearable items (T key) - separate from main interactions
  const doToggleWear = useCallback(() => {
    const playerPos = playerPosRef.current;
    const currentGS = {
      ...gameStateRef.current,
      lives: livesRef.current,
      maxLives: level.lives || 3,
      playerPos: { x: playerPos.x, y: playerPos.y }
    };
    const currentGrid = gridRef.current;

    // Get self-interactions and filter for wear/remove only
    const selfInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, playerPos.x, playerPos.y, true) || [];
    const wearInteractions = selfInteractions.filter(i =>
      i.id.includes('wear') || i.id.includes('remove')
    );

    if (wearInteractions.length === 0) {
      // Check if player has any wearables in inventory
      const hasWearables = currentGS.inventory?.some(item => theme?.isWearable?.(item.itemType));
      const isWearing = currentGS.worn && Object.values(currentGS.worn).some(v => v);

      if (!hasWearables && !isWearing) {
        soundManager.play('blocked');
        showNotification('notifications.noWearables', 'info');
      } else {
        soundManager.play('blocked');
        showNotification('notifications.cantWearNow', 'warning');
      }
      return;
    }

    // Execute the first available wear/remove action
    const interaction = wearInteractions[0];
    const execPos = { x: playerPos.x, y: playerPos.y };
    startInteraction(interaction.id, execPos, interaction.progressColor, interaction.duration, execPos);
  }, [theme, showMessage, showNotification, startInteraction]);

  const doInteract = useCallback(() => {
    const currentGrid = gridRef.current;
    const playerPos = playerPosRef.current;
    const currentGS = {
      ...gameStateRef.current,
      revealedTiles: revealedTilesRef.current,
      lives: livesRef.current,
      maxLives: level.lives || 3,
      playerPos: { x: playerPos.x, y: playerPos.y }
    };
    const targets = getInteractTargets();
    const playerDir = playerDirectionRef.current;

    // Collect all possible actions using theme's interaction system
    const possibleActions = [];

    // Filter targets: only include the one we're facing, or all if standing on something
    const facingTarget = targets.find(t => t.dir === playerDir);
    const relevantTargets = facingTarget ? [facingTarget] : targets.filter(t => t.dir === 'self');

    // Check interactions at facing tile FIRST (to match shortcut order)
    if (relevantTargets.length > 0) {
      const p = relevantTargets[0];
      const c = currentGrid[p.y][p.x];

      // Skip item pickups - those use F key now
      if (!c.object?.type?.startsWith('item-') && (p.x !== playerPos.x || p.y !== playerPos.y)) {
        // Get interactions at target tile from theme (only if different from player pos)
        // Exclude wear/remove - those use T key
        const allTargetInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, p.x, p.y) || [];
        const targetInteractions = allTargetInteractions.filter(i =>
          !i.id.includes('wear') && !i.id.includes('remove')
        );
        for (const interaction of targetInteractions) {
          // For facing tile interactions, execute at the facing tile, show progress there too
          const execPos = p;
          const visualPos = interaction.visualTarget || p;
          possibleActions.push({
            label: interaction.label,
            action: () => startInteraction(interaction.id, execPos, interaction.progressColor, interaction.duration, visualPos),
          });
        }
      }
    }

    // Then check interactions at player's current position (for self-targeted actions)
    // But exclude wearable interactions - those are handled by T key
    const selfInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, playerPos.x, playerPos.y, true) || [];
    const nonWearSelfInteractions = selfInteractions.filter(i =>
      !i.id.includes('wear') && !i.id.includes('remove')
    );
    for (const interaction of nonWearSelfInteractions) {
      // Avoid duplicates
      if (!possibleActions.find(a => a.label === interaction.label)) {
        // For self-interactions, execute at player position but optionally show progress at visualTarget (e.g., bomb)
        const execPos = { x: playerPos.x, y: playerPos.y };
        const visualPos = interaction.visualTarget || execPos;
        possibleActions.push({
          label: interaction.label,
          action: () => startInteraction(interaction.id, execPos, interaction.progressColor, interaction.duration, visualPos),
        });
      }
    }

    // Handle special case: if facing an item, show notification
    if (relevantTargets.length > 0) {
      const p = relevantTargets[0];
      const c = currentGrid[p.y][p.x];
      if (c.object?.type?.startsWith('item-') && possibleActions.length === 0) {
        soundManager.play('blocked');
        showNotification('notifications.pressF', 'info');
        return;
      }
    }

    if (possibleActions.length === 0) {
      soundManager.play('blocked');
      showNotification('notifications.nothingHere', 'info');
      return;
    }

    // If only one action, do it immediately
    if (possibleActions.length === 1) {
      possibleActions[0].action();
      return;
    }

    // Multiple actions - show menu
    const actionsWithKeys = possibleActions.map((action, idx) => ({
      ...action,
      key: (idx + 1).toString(),
    }));

    setInlineMenu({ actions: actionsWithKeys });
  }, [theme, showMessage, getInteractTargets, startInteraction, maxInventory]);

  const doMove = useCallback((dir) => {
    if (gameOverRef.current) return;

    if (interactionStateRef.current) {
      cancelInteraction();
    }

    // Clear inline menu when moving
    setInlineMenu(null);

    lastDirRef.current = dir;
    playerDirectionRef.current = dir;
    setPlayerDirection(dir);
    const d = DIRECTIONS[dir];
    const prev = playerPosRef.current;
    const nx = prev.x + d.dx, ny = prev.y + d.dy;

    const currentGrid = gridRef.current;

    if (nx < 0 || nx >= currentGrid[0].length || ny < 0 || ny >= currentGrid.length) {
      soundManager.play('blocked');
      return;
    }
    const targetCell = currentGrid[ny][nx];
    const currentCell = currentGrid[prev.y][prev.x];
    const currentGS = gameStateRef.current;

    // Helper to reveal tiles when moving/attempting to move
    const revealTargetTile = () => {
      setRevealedTiles(prev => {
        const newRevealed = new Set(prev);
        newRevealed.add(`${nx},${ny}`);
        const adjacent = getAdjacentPositions(nx, ny, currentGrid);
        adjacent.forEach(pos => newRevealed.add(pos.key));
        return newRevealed;
      });
    };

    // Use theme's movement rules
    // Check object layer first (for doors, hazards, etc.), then floor layer
    const targetType = targetCell.object?.type || targetCell.floor?.type;
    const currentType = currentCell.object?.type || currentCell.floor?.type;
    const targetConfig = targetCell.object?.config || targetCell.floor?.config;

    const moveResult = theme?.checkMovementInto?.(targetType, {
      ...currentGS,
      currentTileType: currentType
    }, targetConfig, currentGrid, nx, ny);

    if (moveResult) {
      // Handle life loss from hazards
      if (moveResult.loseLife) {
        const remaining = loseLife();
        if (remaining > 0) {
          const moveMsg = moveResult.messageKey
            ? getMessage(themeId, moveResult.messageKey, moveResult.messageParams || {})
            : moveResult.message;
          if (moveMsg) {
            showNotification('notifications.damage', 'danger', { message: moveMsg, remaining });
          }
        }
        return;
      }

      // Handle tile replacements during movement (theme-defined)
      if (moveResult.setSourceTile || moveResult.setDestTile) {
        const newGrid = cloneGrid(currentGrid);
        if (moveResult.setSourceTile) {
          newGrid[prev.y][prev.x] = moveResult.setSourceTile;
        }
        if (moveResult.setDestTile) {
          newGrid[ny][nx] = moveResult.setDestTile;
        }
        setGrid(newGrid);
        setPlayerPos({ x: nx, y: ny });
        setMoveCount(prev => prev + 1);
        revealTargetTile();
        return;
      }

      // Handle blocked movement with message
      if (!moveResult.allowed) {
        soundManager.play('blocked');
        const blockedMsg = moveResult.messageKey
          ? getMessage(themeId, moveResult.messageKey, moveResult.messageParams || {})
          : moveResult.message;
        if (blockedMsg) {
          showMessage(blockedMsg, 1500, 'info');
        }
        return;
      }

      // Movement allowed by theme
      soundManager.play('walk');
      setPlayerPos({ x: nx, y: ny });
      setMoveCount(prev => prev + 1);
      revealTargetTile();

      // Immediate hazard check on entering a new tile
      const hazard = theme?.checkHazardAt?.(currentGrid, nx, ny, currentGS);
      if (hazard && hazard.continuous) {
        lastHazardDamageRef.current = Date.now();
        const remaining = loseLife();
        if (remaining > 0) {
          const hazardMsg = hazard.messageKey ? getMessage(themeId, hazard.messageKey) : hazard.message;
          showNotification('notifications.damage', 'danger', { message: hazardMsg, remaining });
        }
      }
      return;
    }

    // Fallback: use standard canMoveTo check if theme doesn't handle this tile
    if (canMoveTo(currentGrid, nx, ny)) {
      soundManager.play('walk');
      setPlayerPos({ x: nx, y: ny });
      setMoveCount(prev => prev + 1);
      revealTargetTile();

      // Immediate hazard check on entering a new tile
      const hazard = theme?.checkHazardAt?.(currentGrid, nx, ny, gameStateRef.current);
      if (hazard && hazard.continuous) {
        lastHazardDamageRef.current = Date.now();
        const remaining = loseLife();
        if (remaining > 0) {
          const hazardMsg = hazard.messageKey ? getMessage(themeId, hazard.messageKey) : hazard.message;
          showNotification('notifications.damage', 'danger', { message: hazardMsg, remaining });
        }
      }
    }
  }, [theme, showMessage, loseLife, respawn, cancelInteraction, getMessage, themeId]);

  // Store callback refs so keyboard handler doesn't need to depend on them
  const callbacksRef = useRef({});
  callbacksRef.current = {
    doInteract,
    doPickup,
    doToggleWear,
    dropItem,
    onBack,
    restart,
  };

  useEffect(() => {
    const gameKeys = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'e', 'f', 'r', 'q', 't', '1', '2', '3', '4', '5']);

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (gameKeys.has(key) || key === 'escape') {
        e.preventDefault();
        e.stopPropagation();
      }

      keysDown.current.add(key);

      // Track order of arrow/WASD keys for movement priority
      const movementKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
      if (movementKeys.includes(key)) {
        // Remove if already in list, then add to end (most recent)
        keyPressOrder.current = keyPressOrder.current.filter(k => k !== key);
        keyPressOrder.current.push(key);
      }

      // Handle inline menu number selection
      if (inlineMenuRef.current && ['1', '2', '3', '4', '5'].includes(key)) {
        const actionIndex = parseInt(key) - 1;
        if (actionIndex < inlineMenuRef.current.actions.length) {
          // Number key just pressed, wait for hold to start action
          return;
        }
      }

      if (key === 'escape') {
        if (inlineMenuRef.current) {
          setInlineMenu(null);
          return;
        }
        if (dropMenuOpenRef.current) {
          setDropMenuOpen(false);
          return;
        }
        callbacksRef.current.onBack();
        return;
      }
      if (key === 'r') {
        if (showRestartConfirmRef.current) {
          // Already showing confirm, do nothing (handled by Y/N)
          return;
        }
        setShowRestartConfirm(true);
        return;
      }
      if (showRestartConfirmRef.current) {
        if (key === 'y') {
          setShowRestartConfirm(false);
          callbacksRef.current.restart();
        } else if (key === 'n' || key === 'escape') {
          setShowRestartConfirm(false);
        }
        return;
      }

      if (key === 'e' && !interactionStateRef.current && !inlineMenuRef.current) {
        // Only start new interaction if E was released since last interaction completed
        if (interactionKeyReleasedRef.current) {
          callbacksRef.current.doInteract();
        }
        return;
      }

      if (key === 'f' && !interactionStateRef.current && !inlineMenuRef.current) {
        callbacksRef.current.doPickup();
        return;
      }

      if (key === 't' && !interactionStateRef.current && !inlineMenuRef.current) {
        // T key for toggling wearables
        if (interactionKeyReleasedRef.current) {
          callbacksRef.current.doToggleWear();
        }
        return;
      }

      if (key === 'q') {
        setDropMenuOpen(prev => !prev);
        return;
      }

      // Number keys to drop items when drop menu is open
      if (dropMenuOpenRef.current && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
        const currentGS = gameStateRef.current;
        const itemIndex = parseInt(key) - 1;
        if (itemIndex < currentGS.inventory.length) {
          callbacksRef.current.dropItem(itemIndex);
        }
        return;
      }
    };

    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      keysDown.current.delete(key);

      // Remove from key press order
      keyPressOrder.current = keyPressOrder.current.filter(k => k !== key);

      // Handle inline menu action release
      if (inlineMenuRef.current && ['1', '2', '3', '4', '5'].includes(key)) {
        const actionIndex = parseInt(key) - 1;
        if (actionIndex < inlineMenuRef.current.actions.length) {
          // Clear menu when number key is released
          setInlineMenu(null);
        }
      }

      if (key === 'e' || key === 't') {
        // Mark E/T as released so new interactions can start
        interactionKeyReleasedRef.current = true;

        // Don't clear inline menu when E is released - let it stay visible
        // Menu will be cleared when number key is pressed or player moves

        if (interactionStateRef.current) {
          cancelInteraction();
          showNotification('notifications.cancelled', 'info');
        }
      }

      // Also cancel on number key release if interaction in progress
      if (['1', '2', '3', '4', '5'].includes(key)) {
        // Mark number key as released so new interactions can start
        interactionKeyReleasedRef.current = true;

        if (interactionStateRef.current) {
          cancelInteraction();
          showNotification('notifications.cancelled', 'info');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, []); // Empty deps - all callbacks accessed via callbacksRef

  // Check for number key holds when inline menu is active
  useEffect(() => {
    if (gameOver || !inlineMenu) return;
    const interval = setInterval(() => {
      if (interactionStateRef.current) return; // Already in an interaction
      if (!interactionKeyReleasedRef.current) return; // Key not released since last interaction

      const keys = keysDown.current;
      // Check which number key is being held
      for (let i = 0; i < inlineMenu.actions.length && i < 5; i++) {
        const keyNum = (i + 1).toString();
        if (keys.has(keyNum)) {
          // Clear menu and start interaction
          setInlineMenu(null);
          inlineMenu.actions[i].action();
          break;
        }
      }
    }, 16);
    return () => clearInterval(interval);
  }, [gameOver, inlineMenu]);

  // Check if player is holding a number key while facing multi-action tile
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      // Don't check if already in interaction or menu is open
      if (interactionStateRef.current || inlineMenu) return;
      // Don't check if key not released since last interaction
      if (!interactionKeyReleasedRef.current) return;

      const keys = keysDown.current;
      const currentGrid = gridRef.current;
      const pos = playerPosRef.current;
      const currentGS = {
        ...gameStateRef.current,
        revealedTiles: revealedTilesRef.current,
        lives: livesRef.current,
        maxLives: level.lives || 3,
        playerPos: { x: pos.x, y: pos.y }
      };
      const playerDir = playerDirectionRef.current;

      // Get adjacent tiles
      const adjacent = Object.entries(DIRECTIONS).map(([dir, dd]) => ({
        x: pos.x + dd.dx,
        y: pos.y + dd.dy,
        dir,
      })).filter(p => p.x >= 0 && p.x < currentGrid[0].length && p.y >= 0 && p.y < currentGrid.length);

      // Find the tile we're facing
      const facingTile = adjacent.find(t => t.dir === playerDir);
      if (!facingTile) return;

      const c = currentGrid[facingTile.y][facingTile.x];
      const p = { x: facingTile.x, y: facingTile.y };

      // Skip item pickups
      if (c.object?.type?.startsWith('item-')) return;

      // Get available interactions from theme
      const possibleActions = [];

      // Get interactions at target tile (exclude wear/remove - those use T key)
      const allTargetInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, p.x, p.y) || [];
      const targetInteractions = allTargetInteractions.filter(i =>
        !i.id.includes('wear') && !i.id.includes('remove')
      );
      for (const interaction of targetInteractions) {
        const execPos = p;
        const visualPos = interaction.visualTarget || p;
        possibleActions.push(() => startInteraction(interaction.id, execPos, interaction.progressColor, interaction.duration, visualPos));
      }

      // Also check interactions at player's current position (exclude wear/remove - those use T key)
      const selfInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, pos.x, pos.y) || [];
      const nonWearSelfInteractions = selfInteractions.filter(i =>
        !i.id.includes('wear') && !i.id.includes('remove')
      );
      for (const interaction of nonWearSelfInteractions) {
        // Avoid duplicates by checking if we already have this interaction type
        if (!targetInteractions.find(t => t.id === interaction.id)) {
          const execPos = { x: pos.x, y: pos.y };
          const visualPos = interaction.visualTarget || execPos;
          possibleActions.push(() => startInteraction(interaction.id, execPos, interaction.progressColor, interaction.duration, visualPos));
        }
      }

      // Only proceed if there are multiple actions
      if (possibleActions.length < 2) return;

      // Check if any number key is held (1-5 for up to 5 actions)
      for (let i = 0; i < possibleActions.length && i < 5; i++) {
        const keyNum = (i + 1).toString();
        if (keys.has(keyNum)) {
          // Execute the action
          possibleActions[i]();
          return; // Stop checking after executing
        }
      }
    }, 50); // Check every 50ms (less frequent than 16ms to avoid spam)

    return () => clearInterval(interval);
  }, [theme, gameOver, inlineMenu, startInteraction]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastMoveRef.current < MOVE_COOLDOWN) return;

      const keys = keysDown.current;

      // Find the most recently pressed direction key that's still held
      let dir = null;
      const order = keyPressOrder.current;

      // Check from most recent to oldest
      for (let i = order.length - 1; i >= 0; i--) {
        const key = order[i];
        if (keys.has(key)) {
          if (key === 'arrowup' || key === 'w') {
            dir = 'up';
            break;
          } else if (key === 'arrowdown' || key === 's') {
            dir = 'down';
            break;
          } else if (key === 'arrowleft' || key === 'a') {
            dir = 'left';
            break;
          } else if (key === 'arrowright' || key === 'd') {
            dir = 'right';
            break;
          }
        }
      }

      if (dir) {
        doMove(dir);
        lastMoveRef.current = now;
      }
    }, 16);
    return () => clearInterval(interval);
  }, [gameOver, doMove]);

  useEffect(() => {
    if (!interactionState || gameOver) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - interactionState.startTime;
      const duration = interactionState.duration || INTERACTION_DURATION;
      const progress = Math.min(elapsed / duration, 1);

      // Update progress sound pitch
      soundManager.updateProgress(progress);

      setInteractionState(prev => {
        if (!prev) return null;
        return { ...prev, progress };
      });

      if (progress >= 1) {
        soundManager.stopProgress();
        completeInteraction(interactionState.type, interactionState.targetPos);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [interactionState, gameOver, completeInteraction]);

  useEffect(() => {
    if (!mouseHoldState || gameOver) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - mouseHoldState.startTime;
      const duration = mouseHoldState.duration || INTERACTION_DURATION;
      const progress = Math.min(elapsed / duration, 1);

      setMouseHoldState(prev => {
        if (!prev) return null;
        return { ...prev, progress };
      });

      if (progress >= 1) {
        completeInteraction(mouseHoldState.interactionType, mouseHoldState.targetPos);
        setMouseHoldState(null);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [mouseHoldState, gameOver, completeInteraction]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTick(t => {
        const newTick = t + 1;
        // Only update hazard zones every 2 ticks (every 1 second) to reduce render load
        if (newTick % 2 === 0) {
          setHazardZones(getAllHazardZones(gridRef.current));
        }
        return newTick;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Separate slower interval for entity movement to avoid interfering with input
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      // Move entities if theme supports it (only when not interacting)
      if (theme && !interactionStateRef.current) {
        const newGrid = moveEntities(gridRef.current, theme, gameStateRef.current);
        if (newGrid) {
          setGrid(newGrid);
        }
      }
    }, 1000); // 1 second interval to minimize interference with input
    return () => clearInterval(interval);
  }, [gameOver, theme]);

  // Continuous hazard damage (e.g., cameras deal 1 life per 5 seconds)
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      const pos = playerPosRef.current;
      const currentGrid = gridRef.current;
      const currentGS = gameStateRef.current;

      // Check if player is in a continuous hazard zone
      const hazard = theme?.checkHazardAt?.(currentGrid, pos.x, pos.y, currentGS);

      if (hazard && hazard.continuous) {
        const now = Date.now();
        const timeSinceLastDamage = now - lastHazardDamageRef.current;
        const damageInterval = hazard.interval || 5000; // Default 5 seconds

        if (timeSinceLastDamage >= damageInterval) {
          lastHazardDamageRef.current = now;
          const remaining = loseLife();
          if (remaining > 0) {
            const hazardMsg = hazard.messageKey ? getMessage(themeId, hazard.messageKey) : hazard.message;
            showNotification('notifications.damage', 'danger', { message: hazardMsg, remaining });
          }
        }
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [gameOver, theme, loseLife, showMessage]);

  useEffect(() => {
    if (gameOver) return;
    const locKey = `${playerPos.x},${playerPos.y}`;
    if (!gameState.reachedLocations.includes(locKey)) {
      setGameState(prev => ({
        ...prev,
        reachedLocations: [...prev.reachedLocations, locKey],
      }));
    }
  }, [playerPos, gameOver]);

  // Timer for elapsed time
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver, startTime]);

  useEffect(() => {
    if (gameOver) return;
    // Check for exit tile using theme's exit tiles
    const exitPos = exitTiles.reduce((found, tileType) =>
      found || findTile(level.grid, tileType), null
    );
    if (!exitPos || !isSamePos(playerPos, exitPos)) {
      exitMessageShownRef.current = false;
      return;
    }

    const exitCell = level.grid[exitPos.y][exitPos.x];

    // Use theme's exit requirements check
    const exitResult = theme?.checkExitRequirements?.(gameState, exitCell.config);
    if (exitResult && !exitResult.allowed) {
      if (!exitMessageShownRef.current) {
        exitMessageShownRef.current = true;
        const exitMsg = exitResult.messageKey
          ? getMessage(themeId, exitResult.messageKey, exitResult.messageParams || {})
          : (exitResult.message || t('notifications.completeMissions'));
        showMessage(exitMsg, 1500, 'warning');
      }
      return;
    }

    const gs = { ...gameState, reachedExit: true };
    const { allComplete } = checkAllMissions(effectiveMissions, gs, level.fixedOrder, grid, theme);
    if (allComplete) {
      setGameState(prev => ({ ...prev, reachedExit: true }));
      setGameOver('win');
      soundManager.play('win');
      showNotification('notifications.escaped', 'success', {}, 999999);

      // Submit score to leaderboard (only for named users, not in test mode)
      if (!isTestMode && level.id && displayName) {
        const finalTime = (Date.now() - startTime) / 1000;
        submitScore(level.id, userId, displayName, finalTime, moveCount).catch(err => {
          console.error('Failed to submit score:', err);
        });
      }
    } else if (!exitMessageShownRef.current) {
      exitMessageShownRef.current = true;
      showNotification('notifications.completeMissions', 'warning');
    }
  }, [playerPos, gameOver, level, showMessage, grid, gameState, exitTiles, theme]);

  // Measure container to fill available space
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width - 40, height: rect.height - 40 });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Calculate viewport centered on player, sized to fill container
  const viewportBounds = useMemo(() => {
    const tilesX = Math.max(10, Math.floor(containerSize.width / TILE_SIZE));
    const tilesY = Math.max(8, Math.floor(containerSize.height / TILE_SIZE));
    return calculatePlayerViewport(playerPos, grid, tilesX, tilesY);
  }, [playerPos, grid, containerSize]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #0a1f0a 0%, #071507 25%, #0a1a0a 50%, #050f05 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top HUD Bar - Fixed height, no jumping */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'linear-gradient(180deg, rgba(15, 25, 15, 0.95) 0%, rgba(10, 20, 10, 0.95) 100%)',
        borderBottom: '2px solid rgba(68, 170, 68, 0.2)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        height: '80px',
        flexShrink: 0,
      }}>
        {/* Left: Lives */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            background: 'rgba(60, 20, 20, 0.6)',
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid rgba(255, 68, 68, 0.3)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{ fontSize: 10, color: '#ff9999', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
              {t('hud.lives')}
            </div>
            <div style={{ fontSize: 18 }}>
              {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, (level.lives || 3) - lives))}
            </div>
          </div>

          {/* Statistics - Time & Moves */}
          <div style={{
            display: 'flex',
            gap: 12,
          }}>
            {/* Time */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(30, 45, 60, 0.8), rgba(20, 35, 50, 0.8))',
              padding: '10px 16px',
              borderRadius: 10,
              border: '2px solid rgba(100, 180, 255, 0.5)',
              boxShadow: '0 4px 15px rgba(100, 180, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}>
              <div style={{ fontSize: 9, color: '#a8d8ff', fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
                ⏱ {t('hud.time')}
              </div>
              <div style={{ fontSize: 20, color: '#ffffff', fontWeight: '800', fontFamily: 'monospace', letterSpacing: 1 }}>
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Moves */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(60, 30, 60, 0.8), rgba(50, 20, 50, 0.8))',
              padding: '10px 16px',
              borderRadius: 10,
              border: '2px solid rgba(200, 120, 255, 0.5)',
              boxShadow: '0 4px 15px rgba(200, 120, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}>
              <div style={{ fontSize: 9, color: '#e8b8ff', fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
                🚶 {t('hud.moves')}
              </div>
              <div style={{ fontSize: 20, color: '#ffffff', fontWeight: '800', fontFamily: 'monospace', letterSpacing: 1 }}>
                {moveCount}
              </div>
            </div>
          </div>

          {/* Inventory Preview */}
          {gameState.inventory.length > 0 && (
            <div style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#ccbb99', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('hud.inventoryShort')}:
              </div>
              {gameState.inventory.filter(item => !theme?.isWearable?.(item.itemType)).slice(0, 5).map((item, i) => {
                // Get border color for items with lockColor
                const borderColor = item.lockColor
                  ? LOCK_COLORS[item.lockColor]?.color || 'rgba(200, 150, 100, 0.3)'
                  : 'rgba(200, 150, 100, 0.3)';

                return (
                  <div key={i} style={{
                    background: 'rgba(60, 45, 30, 0.6)',
                    padding: '6px',
                    borderRadius: 6,
                    fontSize: 16,
                    border: `2px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <InventoryIcon theme={theme} itemType={item.itemType} size={20} itemState={item} />
                  </div>
                );
              })}
              {gameState.inventory.filter(item => !theme?.isWearable?.(item.itemType)).length > 5 && (
                <div style={{ fontSize: 11, color: '#ccbb99', fontWeight: 'bold' }}>
                  +{gameState.inventory.filter(item => !theme?.isWearable?.(item.itemType)).length - 5}
                </div>
              )}
            </div>
          )}

          {/* Wearables Preview */}
          {gameState.inventory.some(item => theme?.isWearable?.(item.itemType)) && (
            <div style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#a8c8ff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('hud.wearShort')}:
              </div>
              {gameState.inventory.filter(item => theme?.isWearable?.(item.itemType)).map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(34, 68, 120, 0.6)',
                  padding: '6px',
                  borderRadius: 6,
                  fontSize: 16,
                  border: '2px solid rgba(100, 140, 220, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <InventoryIcon theme={theme} itemType={item.itemType} size={20} itemState={item} />
                </div>
              ))}
            </div>
          )}

          {/* Worn Items Indicator */}
          {gameState.worn && Object.entries(gameState.worn).some(([, v]) => v) && (
            <div style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}>
              {Object.entries(gameState.worn).filter(([, itemType]) => itemType).map(([slot, itemType]) => {
                const itemLabel = theme?.getItemLabel?.(itemType, {}) || itemType;
                return (
                  <div key={slot} style={{
                    background: 'linear-gradient(145deg, rgba(34, 68, 170, 0.8), rgba(26, 51, 119, 0.8))',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '2px solid rgba(100, 140, 220, 0.6)',
                    boxShadow: '0 2px 8px rgba(34, 68, 170, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <InventoryIcon theme={theme} itemType={itemType} size={16} itemState={{}} />
                    <span style={{ fontSize: 11, color: '#a8c8ff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {itemLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Equipped Containers (e.g., bag with money) */}
          {gameState.containers && Object.entries(gameState.containers).some(([, v]) => v) && (
            <div style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}>
              {Object.entries(gameState.containers).filter(([, container]) => container).map(([slot, container]) => {
                const itemLabel = theme?.getItemLabel?.(container.itemType, container) || slot;
                const fillPercent = container.capacity ? Math.min(100, (container.contents / container.capacity) * 100) : 0;
                return (
                  <div key={slot} style={{
                    background: 'linear-gradient(145deg, rgba(74, 58, 42, 0.9), rgba(58, 42, 26, 0.9))',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '2px solid rgba(139, 105, 20, 0.6)',
                    boxShadow: '0 2px 8px rgba(74, 58, 42, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    position: 'relative',
                  }}>
                    <InventoryIcon theme={theme} itemType={container.itemType} size={18} itemState={container} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 10, color: '#d4b896', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {itemLabel}
                      </span>
                      {container.contents !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 12, color: '#55dd55', fontWeight: 'bold' }}>
                            ${container.contents.toLocaleString()}
                          </span>
                          {container.capacity && (
                            <>
                              <span style={{ fontSize: 9, color: '#998866' }}>/ ${container.capacity.toLocaleString()}</span>
                              <div style={{
                                width: 40,
                                height: 4,
                                background: 'rgba(0,0,0,0.4)',
                                borderRadius: 2,
                                overflow: 'hidden',
                              }}>
                                <div style={{
                                  width: `${fillPercent}%`,
                                  height: '100%',
                                  background: fillPercent >= 90 ? '#ff6644' : fillPercent >= 70 ? '#ffaa44' : '#55aa55',
                                  transition: 'width 0.3s',
                                }} />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Missions */}
        <div style={{
          background: 'rgba(30, 45, 60, 0.6)',
          padding: '10px 14px',
          borderRadius: 10,
          maxWidth: '280px',
          border: '1px solid rgba(100, 150, 200, 0.3)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ fontSize: 10, color: '#a8d8f8', fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
            {level.fixedOrder ? t('hud.missionsOrdered') : t('hud.missions')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {effectiveMissions.map((m, i) => {
              const complete = checkMissionComplete(m, gameState, grid, theme);
              const isCurrent = level.fixedOrder && !complete && effectiveMissions.slice(0, i).every(prev => checkMissionComplete(prev, gameState, grid, theme));
              return (
                <div key={i} style={{
                  color: complete ? '#88ff88' : isCurrent ? '#ffee66' : '#99aabb',
                  fontSize: 11,
                  textDecoration: complete ? 'line-through' : 'none',
                  fontWeight: isCurrent ? '600' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{ fontSize: 12 }}>{complete ? '✓' : isCurrent ? '▶' : '○'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: isRTL ? 'rtl' : 'ltr' }}>
                    {getMissionDescription(m)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area with Notification Sidebar */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left Sidebar: Notification Panel */}
        <NotificationPanel />

        {/* Game Area - Flexible, centered */}
        <div ref={gridContainerRef} style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflow: 'hidden',
          position: 'relative',
        }}>
        <div style={{ position: 'relative' }}>
          <Grid
            grid={grid}
            playerPos={playerPos}
            playerDirection={playerDirection}
            showHazardZones={true}
            tick={tick}
            hazardZoneOverrides={hazardZones}
            revealedTiles={revealedTiles}
            viewportBounds={viewportBounds}
            onHoldStart={handleMouseInteraction}
            onHoldEnd={() => {
              if (interactionStateRef.current) {
                cancelInteraction();
              }
              setMouseHoldState(null);
            }}
            interactionTarget={(interactionState || mouseHoldState)?.visualTargetPos || (interactionState || mouseHoldState)?.targetPos}
            interactionProgress={(interactionState || mouseHoldState)?.progress || 0}
            interactionProgressColor={(interactionState || mouseHoldState)?.progressColor}
            theme={theme}
            gameState={gameState}
          />

          {/* Inline interaction menu next to player */}
          {inlineMenu && !gameOver && (
            <div style={{
              position: 'absolute',
              left: `${(playerPos.x - viewportBounds.minX + 1) * 40 + 10}px`,
              top: `${(playerPos.y - viewportBounds.minY) * 40}px`,
              background: 'linear-gradient(145deg, rgba(30, 45, 30, 0.98), rgba(20, 35, 20, 0.98))',
              borderRadius: 12,
              padding: '10px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(68, 170, 68, 0.6)',
              backdropFilter: 'blur(12px)',
              zIndex: 150,
              minWidth: 160,
            }}>
              <div style={{
                fontSize: 9,
                color: '#88ff88',
                marginBottom: 8,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                textAlign: 'center',
              }}>
                {t('controls.holdToInteract')}
              </div>
              {inlineMenu.actions.map((action, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: keysDown.current.has(action.key)
                      ? 'rgba(68, 170, 68, 0.4)'
                      : 'rgba(40, 55, 40, 0.6)',
                    borderRadius: 8,
                    marginBottom: idx < inlineMenu.actions.length - 1 ? 6 : 0,
                    border: '1px solid rgba(68, 170, 68, 0.3)',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    background: 'rgba(68, 170, 68, 0.8)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                  }}>
                    {action.key}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#ffffff',
                    fontWeight: '600',
                  }}>
                    {action.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div style={{
        padding: '12px 24px',
        background: 'linear-gradient(180deg, rgba(10, 20, 10, 0.95) 0%, rgba(15, 25, 15, 0.95) 100%)',
        borderTop: '2px solid rgba(68, 170, 68, 0.2)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}>
        <div style={{
          color: '#a8e8a8',
          fontSize: 12,
          fontFamily: 'monospace',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <span>{t('controls.move')}</span>
          <span>{t('controls.interact')}</span>
          <span>{t('controls.pickup')}</span>
          <span>{t('controls.wear')}</span>
          <span>{t('controls.drop')}</span>
          <span>{t('controls.restart')}</span>
        </div>
        <button
          onClick={toggleSound}
          style={{
            background: 'rgba(40, 55, 40, 0.6)',
            border: '1px solid rgba(68, 170, 68, 0.3)',
            borderRadius: 8,
            padding: '6px 10px',
            color: soundEnabled ? '#a8e8a8' : '#888888',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(50, 70, 50, 0.8)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(40, 55, 40, 0.6)'}
          title={soundEnabled ? t('settings.mute') : t('settings.unmute')}
        >
          <span>{soundEnabled ? '🔊' : '🔇'}</span>
        </button>
        <button
          onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
          style={{
            background: 'rgba(40, 55, 40, 0.6)',
            border: '1px solid rgba(68, 170, 68, 0.3)',
            borderRadius: 8,
            padding: '6px 10px',
            color: '#a8e8a8',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s',
            flexShrink: 0,
            fontWeight: '600',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(50, 70, 50, 0.8)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(40, 55, 40, 0.6)'}
          title={t('settings.language')}
        >
          <span>{language === 'en' ? '🇺🇸 EN' : '🇮🇱 עב'}</span>
        </button>
      </div>

      {/* Drop menu */}
      {dropMenuOpen && !gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 200,
          pointerEvents: 'auto',
        }}>
          <div
            style={{
              background: 'linear-gradient(160deg, rgba(30, 45, 30, 0.98) 0%, rgba(20, 35, 20, 0.98) 100%)',
              borderRadius: 16,
              padding: 28,
              minWidth: 320,
              maxWidth: 400,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 2px rgba(68, 170, 68, 0.4)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h2 style={{
              color: '#a8f0a8',
              margin: '0 0 8px 0',
              fontSize: 20,
              fontWeight: '800',
              textAlign: 'center',
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              {t('dropMenu.title')}
            </h2>
            <div style={{
              color: '#88cc88',
              fontSize: 12,
              textAlign: 'center',
              marginBottom: 16,
              fontWeight: '500',
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              {t('dropMenu.instruction')}
            </div>
            {gameState.inventory.length === 0 ? (
              <div style={{ color: '#a8e8a8', fontSize: 14, padding: 20, textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('dropMenu.empty')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Regular items */}
                {gameState.inventory.map((item, idx) => {
                  const isWearable = theme?.isWearable?.(item.itemType);
                  if (isWearable) return null; // Skip wearables in main list

                  const themeLabel = theme?.getItemLabel?.(item.itemType, item) || item.itemType;
                  const itemLabel = getItemLabel(themeId, item.itemType, themeLabel);

                  return (
                    <button
                      key={idx}
                      onClick={() => dropItem(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 16px',
                        background: 'rgba(40, 55, 40, 0.6)',
                        border: 'none',
                        borderRadius: 10,
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(50, 75, 50, 0.8)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(40, 55, 40, 0.6)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <span style={{
                        background: 'rgba(100, 150, 100, 0.4)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#d0f0d0',
                        minWidth: 24,
                        textAlign: 'center',
                      }}>
                        {idx + 1}
                      </span>
                      <InventoryIcon theme={theme} itemType={item.itemType} size={24} itemState={item} />
                      <span style={{ flex: 1 }}>
                        {itemLabel}
                      </span>
                    </button>
                  );
                })}

                {/* Wearables section */}
                {gameState.inventory.some(item => theme?.isWearable?.(item.itemType)) && (
                  <>
                    <div style={{
                      marginTop: 8,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(100, 140, 220, 0.3)',
                    }}>
                      <div style={{
                        color: '#a8c8ff',
                        fontSize: 11,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        <span>{t('dropMenu.wearables')}</span>
                        <span style={{
                          fontSize: 9,
                          color: '#88aadd',
                          fontWeight: 'normal',
                          textTransform: 'none',
                        }}>
                          {t('dropMenu.wearHint')}
                        </span>
                      </div>
                    </div>
                    {gameState.inventory.map((item, idx) => {
                      const isWearable = theme?.isWearable?.(item.itemType);
                      if (!isWearable) return null;

                      const themeLabel = theme?.getItemLabel?.(item.itemType, item) || item.itemType;
                      const itemLabel = getItemLabel(themeId, item.itemType, themeLabel);

                      return (
                        <button
                          key={idx}
                          onClick={() => dropItem(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 16px',
                            background: 'rgba(34, 68, 120, 0.5)',
                            border: '1px solid rgba(100, 140, 220, 0.4)',
                            borderRadius: 10,
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(34, 68, 170, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(44, 88, 150, 0.7)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(34, 68, 120, 0.5)';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <span style={{
                            background: 'rgba(100, 140, 200, 0.4)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: '#c0d8ff',
                            minWidth: 24,
                            textAlign: 'center',
                          }}>
                            {idx + 1}
                          </span>
                          <InventoryIcon theme={theme} itemType={item.itemType} size={24} itemState={item} />
                          <span style={{ flex: 1 }}>
                            {itemLabel}
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
            <button
              onClick={() => setDropMenuOpen(false)}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px',
                background: 'rgba(30, 40, 30, 0.6)',
                border: 'none',
                borderRadius: 10,
                color: '#c8e6c8',
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(40, 55, 40, 0.8)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(30, 40, 30, 0.6)'}
            >
              {t('dropMenu.close')} (Q/ESC)
            </button>
          </div>
        </div>
      )}

      {/* Restart Confirmation */}
      {showRestartConfirm && !gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 250,
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(60, 45, 30, 0.98), rgba(40, 30, 20, 0.98))',
            borderRadius: 16,
            padding: '28px 40px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(200, 150, 100, 0.4)',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#f8d8a8', margin: '0 0 16px 0', fontSize: 20, fontWeight: '700' }}>
              Restart Level?
            </h3>
            <p style={{ color: '#ccbb99', margin: '0 0 20px 0', fontSize: 14 }}>
              Your progress will be lost.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { setShowRestartConfirm(false); restart(); }}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(145deg, #5a4a2a, #4a3a1a)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Yes (Y)
              </button>
              <button
                onClick={() => setShowRestartConfirm(false)}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(145deg, #3a3a3a, #2a2a2a)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#ccc',
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                No (N)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 300,
        }}>
          <h1 style={{
            color: gameOver === 'win' ? '#88ff88' : '#ff6666',
            fontSize: 56,
            marginBottom: 20,
            fontWeight: '900',
            textShadow: gameOver === 'win'
              ? '0 0 40px rgba(68, 255, 68, 0.8), 0 0 80px rgba(68, 255, 68, 0.4)'
              : '0 0 40px rgba(255, 68, 68, 0.8), 0 0 80px rgba(255, 68, 68, 0.4)',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}>
            {gameOver === 'win' ? '🎉 You Escaped! 🎉' : '💀 Game Over 💀'}
          </h1>

          {/* Final Statistics */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 45, 60, 0.95), rgba(20, 35, 50, 0.95))',
            padding: '28px 48px',
            borderRadius: 20,
            marginBottom: 32,
            border: '3px solid rgba(100, 180, 255, 0.6)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 60px rgba(100, 180, 255, 0.2)',
            minWidth: 400,
          }}>
            <div style={{
              fontSize: 16,
              color: '#a8d8ff',
              fontWeight: '800',
              marginBottom: 20,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}>
              📊 {t('stats.finalStatistics')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 40 }}>
              {/* Time */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 14,
                  color: '#88ccff',
                  marginBottom: 8,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  direction: isRTL ? 'rtl' : 'ltr',
                }}>
                  ⏱ {t('hud.time')}
                </div>
                <div style={{
                  fontSize: 48,
                  color: '#ffffff',
                  fontWeight: '900',
                  fontFamily: 'monospace',
                  textShadow: '0 2px 20px rgba(100, 180, 255, 0.6)',
                  letterSpacing: 2,
                }}>
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#6699cc',
                  marginTop: 4,
                  direction: isRTL ? 'rtl' : 'ltr',
                }}>
                  {t('stats.minutesSeconds')}
                </div>
              </div>

              {/* Moves */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 14,
                  color: '#e8b8ff',
                  marginBottom: 8,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  direction: isRTL ? 'rtl' : 'ltr',
                }}>
                  🚶 {t('hud.moves')}
                </div>
                <div style={{
                  fontSize: 48,
                  color: '#ffffff',
                  fontWeight: '900',
                  fontFamily: 'monospace',
                  textShadow: '0 2px 20px rgba(200, 120, 255, 0.6)',
                  letterSpacing: 2,
                }}>
                  {moveCount}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#9966cc',
                  marginTop: 4,
                  direction: isRTL ? 'rtl' : 'ltr',
                }}>
                  {t('stats.totalSteps')}
                </div>
              </div>
            </div>

            {gameOver === 'win' && (
              <div style={{
                marginTop: 24,
                padding: '12px 20px',
                background: 'rgba(68, 255, 68, 0.15)',
                borderRadius: 10,
                border: '1px solid rgba(68, 255, 68, 0.3)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 13,
                  color: '#88ff88',
                  fontWeight: '700',
                  letterSpacing: 1,
                }}>
                  🏆 {t('stats.score')}: {Math.max(0, 10000 - (elapsedTime * 10) - (moveCount * 5))} {t('stats.points')}
                </div>
              </div>
            )}

            {/* Leaderboard - only show for saved levels, not test mode */}
            {gameOver === 'win' && level.id && !isTestMode && (
              <div style={{ marginTop: 16 }}>
                <Leaderboard mapId={level.id} compact={true} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={restart}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(145deg, #2a5a2a 0%, #1a4a1a 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 28px rgba(68, 170, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)';
              }}
            >
              Restart (R)
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(145deg, #2a4a2a 0%, #1a3a1a 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 28px rgba(68, 170, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)';
              }}
            >
              Back to Menu (ESC)
            </button>
            {hasStory && (
              <button
                onClick={() => setShowStoryModal(true)}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(145deg, #2a3a4a 0%, #1a2a3a 100%)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 28px rgba(78, 205, 196, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)';
                }}
              >
                📖 Help
              </button>
            )}
          </div>
        </div>
      )}

      {/* Story/Tutorial Modal */}
      {hasStory && (
        <StoryModal
          storyContent={storyContent}
          onClose={() => setShowStoryModal(false)}
          showOnFirstLoad={showStoryModal}
        />
      )}
    </div>
  );
}

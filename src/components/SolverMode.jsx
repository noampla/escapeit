import { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import Grid from './Grid';
import { findTile, cloneGrid } from '../engine/tiles';
import { canMoveTo, isSamePos } from '../engine/collision';
import { getAllHazardZones } from '../engine/hazards';
import { checkAllMissions, checkMissionComplete } from '../engine/missions';
import { DIRECTIONS, GRID_COLS, GRID_ROWS, DEFAULT_INVENTORY_CAPACITY } from '../utils/constants';
import { ThemeContext } from '../App';
import { InteractionEngine } from '../engine/interactionEngine';
import { useUser } from '../contexts/UserContext.jsx';
import { submitScore } from '../utils/leaderboardService.js';
import Leaderboard from './Leaderboard.jsx';

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
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cell = newGrid[y][x];
      if (cell.type === 'item' && cell.config?.itemType) {
        newGrid[y][x] = { type: `item-${cell.config.itemType}`, config: {} };
      }
    }
  }
  return newGrid;
}

function calculateViewportBounds(grid) {
  let minX = GRID_COLS, minY = GRID_ROWS, maxX = -1, maxY = -1;

  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cell = grid[y][x];
      if (cell.type !== 'empty') {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1) {
    return { minX: 0, minY: 0, maxX: GRID_COLS - 1, maxY: GRID_ROWS - 1 };
  }

  const padding = 2;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(GRID_COLS - 1, maxX + padding);
  maxY = Math.min(GRID_ROWS - 1, maxY + padding);

  return { minX, minY, maxX, maxY };
}

function getAdjacentPositions(x, y) {
  const adjacent = [];
  if (y > 0) adjacent.push({ x, y: y - 1, key: `${x},${y - 1}` });
  if (y < GRID_ROWS - 1) adjacent.push({ x, y: y + 1, key: `${x},${y + 1}` });
  if (x > 0) adjacent.push({ x: x - 1, y, key: `${x - 1},${y}` });
  if (x < GRID_COLS - 1) adjacent.push({ x: x + 1, y, key: `${x + 1},${y}` });
  return adjacent;
}

function initializeRevealedTiles(startX, startY) {
  const revealed = new Set();
  revealed.add(`${startX},${startY}`);
  const adjacent = getAdjacentPositions(startX, startY);
  adjacent.forEach(pos => revealed.add(pos.key));
  return revealed;
}

// isMissionDone is now imported as checkMissionComplete from missions.js

export default function SolverMode({ level, onBack, isTestMode = false }) {
  const theme = useContext(ThemeContext);
  const { userId, displayName } = useUser();
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
    const defaultMission = theme?.getDefaultMission?.() || { type: 'escape', description: 'Reach the exit' };
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
  });
  const [revealedTiles, setRevealedTiles] = useState(() => initializeRevealedTiles(startPos.x, startPos.y));
  const [tick, setTick] = useState(0);
  const [message, setMessage] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [hazardZones, setHazardZones] = useState([]);
  const [interactionState, setInteractionState] = useState(null);
  const [dropMenuOpen, setDropMenuOpen] = useState(false);
  const [mouseHoldState, setMouseHoldState] = useState(null);
  const [playerDirection, setPlayerDirection] = useState('down');
  const [moveCount, setMoveCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [inlineMenu, setInlineMenu] = useState(null); // { actions: [{label, action, key}] }

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

  gridRef.current = grid;
  gameStateRef.current = gameState;
  playerPosRef.current = playerPos;
  livesRef.current = lives;
  gameOverRef.current = gameOver;
  interactionStateRef.current = interactionState;

  const showMessage = useCallback((msg, duration = 1500) => {
    setMessage(msg);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    if (duration < 99999) {
      messageTimerRef.current = setTimeout(() => setMessage(null), duration);
    }
  }, []);

  const respawn = useCallback(() => {
    setPlayerPos({ ...startPos });
  }, [startPos]);

  const loseLife = useCallback(() => {
    const newLives = livesRef.current - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameOver('fail');
      showMessage('GAME OVER', 999999);
      return 0;
    }
    return newLives;
  }, [showMessage]);

  const restart = useCallback(() => {
    setGrid(convertLegacyItems(level.grid));
    setPlayerPos({ ...startPos });
    setLives(level.lives || 3);
    setGameState({
      collectedItems: [], rescuedFriends: 0,
      reachedLocations: [], reachedExit: false, inventory: [],
      worn: {},
    });
    setRevealedTiles(initializeRevealedTiles(startPos.x, startPos.y));
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
      if (customResult.message) showMessage(customResult.message);
      setDropMenuOpen(false);
      return;
    }

    const cell = currentGrid[pos.y][pos.x];
    // Allow dropping on ground-type tiles (uses theme's ground tiles)
    if (!groundTiles.includes(cell.type)) {
      showMessage("Can't drop here!");
      return;
    }

    const newGrid = cloneGrid(currentGrid);
    newGrid[pos.y][pos.x] = { type: `item-${dropped.itemType}`, config: {} };
    setGrid(newGrid);
    setGameState(prev => ({
      ...prev,
      inventory: prev.inventory.filter((_, i) => i !== index),
    }));
    const ITEM_TYPES = theme?.getItemTypes() || {};
    const itemDef = ITEM_TYPES[dropped.itemType];
    showMessage(`Dropped: ${itemDef?.emoji || ''} ${itemDef?.label || dropped.itemType}`);
    setDropMenuOpen(false);
  }, [showMessage, theme]);

  const pickUpItem = useCallback((cell, px, py) => {
    const currentGS = gameStateRef.current;
    if (currentGS.inventory.length >= maxInventory) {
      showMessage(`Inventory full! (${maxInventory} items max) Press Q to drop items.`);
      return false;
    }

    const itemType = cell.type.replace('item-', '');

    const newGrid = cloneGrid(gridRef.current);

    // Determine what tile to leave behind by checking surrounding tiles
    const neighbors = [
      { x: px, y: py - 1 }, // up
      { x: px, y: py + 1 }, // down
      { x: px - 1, y: py }, // left
      { x: px + 1, y: py }, // right
    ].filter(n => n.x >= 0 && n.x < GRID_COLS && n.y >= 0 && n.y < GRID_ROWS);

    // Count floor colors from neighbors (uses theme's ignore tiles)
    const colorCounts = {};

    for (const n of neighbors) {
      const neighborCell = newGrid[n.y][n.x];
      if (ignoreTiles.includes(neighborCell.type)) continue;

      if (neighborCell.type === 'floor') {
        const color = neighborCell.config?.floorColor || 'gray';
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      } else if (groundTiles.includes(neighborCell.type)) {
        // Non-floor walkable tiles count as 'ground'
        colorCounts['_ground'] = (colorCounts['_ground'] || 0) + 1;
      }
    }

    // Find most common floor color
    let maxCount = 0;
    let bestColor = null;
    for (const [color, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestColor = color;
      }
    }

    // Set the tile based on what we found
    if (bestColor === '_ground' || bestColor === null) {
      // Use 'ground' for forest theme or if no floor neighbors found
      newGrid[py][px] = { type: 'ground', config: {} };
    } else {
      // Use 'floor' with the most common color
      newGrid[py][px] = { type: 'floor', config: { floorColor: bestColor } };
    }
    setGrid(newGrid);

    // Preserve config properties like lockColor for any item
    const itemObj = { itemType, filled: false };
    if (cell.config?.lockColor) {
      itemObj.lockColor = cell.config.lockColor;
    }
    setGameState(prev => ({
      ...prev,
      inventory: [...prev.inventory, itemObj],
      collectedItems: [...prev.collectedItems, itemType],
    }));
    // Get item label from theme
    const itemLabel = theme?.getItemLabel?.(itemType, itemObj) || itemType;
    // Show special message for wearable items
    if (theme?.isWearable?.(itemType)) {
      showMessage(`Picked up: ${itemLabel} (Press E to wear)`);
    } else {
      showMessage(`Picked up: ${itemLabel}`);
    }
    return true;
  }, [showMessage, maxInventory, theme]);

  const getInteractTargets = useCallback(() => {
    const pos = playerPosRef.current;
    const currentGrid = gridRef.current;
    const lastDir = lastDirRef.current;

    // Use theme's interactable tiles
    const itemTilePattern = /^item-/;

    const adjacent = Object.entries(DIRECTIONS).map(([dir, dd]) => ({
      x: pos.x + dd.dx, y: pos.y + dd.dy, dir,
    })).filter(p => p.x >= 0 && p.x < GRID_COLS && p.y >= 0 && p.y < GRID_ROWS);

    const targets = [];

    const currentCell = currentGrid[pos.y][pos.x];
    if (itemTilePattern.test(currentCell.type)) {
      targets.push({ x: pos.x, y: pos.y, dir: 'self' });
    }

    for (const adj of adjacent) {
      const c = currentGrid[adj.y][adj.x];
      if (interactableTiles.includes(c.type)) {
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

  const startInteraction = useCallback((type, targetPos) => {
    setInteractionState({
      type,
      startTime: Date.now(),
      targetPos,
      progress: 0,
    });
  }, []);

  const cancelInteraction = useCallback(() => {
    setInteractionState(null);
  }, []);

  const handleMouseInteraction = useCallback((x, y) => {
    const pos = playerPosRef.current;
    const dx = x - pos.x;
    const dy = y - pos.y;
    const isAdjacent = (Math.abs(dx) === 1 && dy === 0) || (dx === 0 && Math.abs(dy) === 1);

    if (!isAdjacent) {
      showMessage('Too far away!');
      return;
    }

    // Determine direction
    let dir = '';
    if (dy === -1) dir = 'UP';
    else if (dy === 1) dir = 'DOWN';
    else if (dx === -1) dir = 'LEFT';
    else if (dx === 1) dir = 'RIGHT';

    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;

    // Get available interactions from theme
    const interactions = theme?.getAvailableInteractions?.(currentGS, currentGrid, x, y) || [];

    if (interactions.length === 0) {
      showMessage('Nothing to interact with here.');
      return;
    }

    const possibleActions = interactions.map(interaction => ({
      type: interaction.id,
      targetPos: { x, y },
      dir,
      label: interaction.label,
    }));

    if (possibleActions.length > 1) {
      setInteractionChoices({
        choices: possibleActions.map(action => {
          let label = action.label;
          if (action.dir) {
            label = `${label} (${action.dir})`;
          }
          return {
            label,
            action: () => {
              setInteractionChoices(null);
              startInteraction(action.type, action.targetPos);
            },
          };
        }),
      });
      return;
    }

    const action = possibleActions[0];
    startInteraction(action.type, action.targetPos);
  }, [theme, showMessage, startInteraction]);

  const completeInteraction = useCallback((interactionType, targetPos) => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;

    // Clone grid and gameState for theme to modify
    const newGrid = cloneGrid(currentGrid);
    const tempGameState = {
      ...currentGS,
      inventory: [...currentGS.inventory.map(item => ({ ...item }))],
      collectedItems: [...(currentGS.collectedItems || [])],
      worn: { ...(currentGS.worn || {}) },
    };

    // Execute interaction through theme
    const result = theme?.executeInteraction?.(interactionType, tempGameState, newGrid, targetPos.x, targetPos.y);

    if (result?.success) {
      // Apply grid changes
      if (result.modifyGrid) {
        setGrid(newGrid);
      }

      // Apply inventory/state changes
      if (result.modifyInventory || result.modifyState) {
        setGameState(prev => ({
          ...prev,
          inventory: tempGameState.inventory,
          collectedItems: tempGameState.collectedItems,
          rescuedFriends: tempGameState.rescuedFriends ?? prev.rescuedFriends,
          worn: tempGameState.worn ?? prev.worn,
        }));
      }

      // Show message
      if (result.message) {
        showMessage(result.message);
      }
    } else if (result?.error) {
      showMessage(result.error);
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
      if (customResult.message) showMessage(customResult.message);
      return;
    }

    // Check if standing on an item
    if (currentCell.type.startsWith('item-')) {
      if (currentGS.inventory.length >= maxInventory) {
        showMessage(`Inventory full! (${maxInventory} items max) Press Q to drop items.`);
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
      if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
        const adjCell = currentGrid[ny][nx];
        if (adjCell.type.startsWith('item-') && theme?.canPickupFromAdjacent?.(adjCell.type)) {
          if (currentGS.inventory.length >= maxInventory) {
            showMessage(`Inventory full! (${maxInventory} items max) Press Q to drop items.`);
            return;
          }
          pickUpItem(adjCell, nx, ny);
          return;
        }
      }
    }

    showMessage('No item here to pick up. Stand on an item and press F.');
  }, [showMessage, pickUpItem, theme, maxInventory]);

  const doInteract = useCallback(() => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const targets = getInteractTargets();
    const playerDir = playerDirectionRef.current;
    const playerPos = playerPosRef.current;

    // Collect all possible actions using theme's interaction system
    const possibleActions = [];

    // Always check interactions at player's current position first (for self-targeted actions like wear/remove)
    const selfInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, playerPos.x, playerPos.y, true) || [];
    for (const interaction of selfInteractions) {
      possibleActions.push({
        label: interaction.label,
        action: () => startInteraction(interaction.id, { x: playerPos.x, y: playerPos.y }),
      });
    }

    // Filter targets: only include the one we're facing, or all if standing on something
    const facingTarget = targets.find(t => t.dir === playerDir);
    const relevantTargets = facingTarget ? [facingTarget] : targets.filter(t => t.dir === 'self');

    // Check interactions at facing tile
    if (relevantTargets.length > 0) {
      const p = relevantTargets[0];
      const c = currentGrid[p.y][p.x];

      // Skip item pickups - those use F key now
      if (c.type.startsWith('item-')) {
        if (possibleActions.length === 0) {
          showMessage('Press F to pick up items.');
          return;
        }
        // Continue to show self-interactions if any
      } else if (p.x !== playerPos.x || p.y !== playerPos.y) {
        // Get interactions at target tile from theme (only if different from player pos)
        const targetInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, p.x, p.y) || [];
        for (const interaction of targetInteractions) {
          // Avoid duplicates
          if (!possibleActions.find(a => a.label === interaction.label)) {
            possibleActions.push({
              label: interaction.label,
              action: () => startInteraction(interaction.id, p),
            });
          }
        }
      }
    }

    if (possibleActions.length === 0) {
      showMessage('Nothing to interact with here.');
      return;
    }

    // If only one action, do it immediately
    if (possibleActions.length === 1) {
      possibleActions[0].action();
      return;
    }

    // Multiple actions - check if number key already held
    const actionsWithKeys = possibleActions.map((action, idx) => ({
      ...action,
      key: (idx + 1).toString(),
    }));

    // If user is already holding a number key, execute that action immediately
    const keys = keysDown.current;
    for (let i = 0; i < actionsWithKeys.length; i++) {
      if (keys.has(actionsWithKeys[i].key)) {
        actionsWithKeys[i].action();
        return;
      }
    }

    // Otherwise show inline menu
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

    if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) return;

    const currentGrid = gridRef.current;
    const targetCell = currentGrid[ny][nx];
    const currentCell = currentGrid[prev.y][prev.x];
    const currentGS = gameStateRef.current;

    // Helper to reveal tiles when moving/attempting to move
    const revealTargetTile = () => {
      setRevealedTiles(prev => {
        const newRevealed = new Set(prev);
        newRevealed.add(`${nx},${ny}`);
        const adjacent = getAdjacentPositions(nx, ny);
        adjacent.forEach(pos => newRevealed.add(pos.key));
        return newRevealed;
      });
    };

    // Use theme's movement rules
    const moveResult = theme?.checkMovementInto?.(targetCell.type, {
      ...currentGS,
      currentTileType: currentCell.type
    }, targetCell.config);

    if (moveResult) {
      // Always reveal tile when attempting movement (for fog of war)
      revealTargetTile();

      // Handle life loss from hazards
      if (moveResult.loseLife) {
        const remaining = loseLife();
        if (remaining > 0 && moveResult.message) {
          showMessage(`${moveResult.message} Lives: ${remaining}`);
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
        return;
      }

      // Handle blocked movement with message
      if (!moveResult.allowed) {
        if (moveResult.message) {
          showMessage(moveResult.message);
        }
        return;
      }

      // Movement allowed by theme
      setPlayerPos({ x: nx, y: ny });
      setMoveCount(prev => prev + 1);

      // Immediate hazard check on entering a new tile
      const hazard = theme?.checkHazardAt?.(currentGrid, nx, ny, currentGS);
      if (hazard && hazard.continuous) {
        lastHazardDamageRef.current = Date.now();
        const remaining = loseLife();
        if (remaining > 0) {
          showMessage(`${hazard.message} Lives: ${remaining}`);
        }
      }
      return;
    }

    // Fallback: use standard canMoveTo check if theme doesn't handle this tile
    if (canMoveTo(currentGrid, nx, ny)) {
      setPlayerPos({ x: nx, y: ny });
      setMoveCount(prev => prev + 1);
      revealTargetTile();

      // Immediate hazard check on entering a new tile
      const hazard = theme?.checkHazardAt?.(currentGrid, nx, ny, gameStateRef.current);
      if (hazard && hazard.continuous) {
        lastHazardDamageRef.current = Date.now();
        const remaining = loseLife();
        if (remaining > 0) {
          showMessage(`${hazard.message} Lives: ${remaining}`);
        }
      }
    }
  }, [theme, showMessage, loseLife, respawn, cancelInteraction]);

  useEffect(() => {
    const gameKeys = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'e', 'f', 'r', 'q', '1', '2', '3', '4', '5']);

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
      if (inlineMenu && ['1', '2', '3', '4', '5'].includes(key)) {
        const actionIndex = parseInt(key) - 1;
        if (actionIndex < inlineMenu.actions.length) {
          // Number key just pressed, wait for hold to start action
          return;
        }
      }

      if (key === 'escape') {
        if (inlineMenu) {
          setInlineMenu(null);
          return;
        }
        if (dropMenuOpen) {
          setDropMenuOpen(false);
          return;
        }
        onBack();
        return;
      }
      if (key === 'r') { restart(); return; }

      if (key === 'e' && !interactionStateRef.current && !inlineMenu) {
        // Only start new interaction if E was released since last interaction completed
        if (interactionKeyReleasedRef.current) {
          doInteract();
        }
        return;
      }

      if (key === 'f' && !interactionStateRef.current && !inlineMenu) {
        doPickup();
        return;
      }

      if (key === 'q') {
        setDropMenuOpen(prev => !prev);
        return;
      }

      // Number keys to drop items when drop menu is open
      if (dropMenuOpen && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
        const currentGS = gameStateRef.current;
        const itemIndex = parseInt(key) - 1;
        if (itemIndex < currentGS.inventory.length) {
          dropItem(itemIndex);
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
      if (inlineMenu && ['1', '2', '3', '4', '5'].includes(key)) {
        const actionIndex = parseInt(key) - 1;
        if (actionIndex < inlineMenu.actions.length && interactionStateRef.current) {
          // Action was held and completed, clear menu
          setInlineMenu(null);
        }
      }

      if (key === 'e') {
        // Mark E as released so new interactions can start
        interactionKeyReleasedRef.current = true;

        if (interactionStateRef.current) {
          cancelInteraction();
          showMessage('Interaction cancelled.');
        }
      }

      // Also cancel on number key release if interaction in progress
      if (['1', '2', '3', '4', '5'].includes(key)) {
        // Mark number key as released so new interactions can start
        interactionKeyReleasedRef.current = true;

        if (interactionStateRef.current) {
          cancelInteraction();
          showMessage('Interaction cancelled.');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [onBack, restart, doInteract, doPickup, cancelInteraction, showMessage, dropMenuOpen, inlineMenu]);

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
          // Hide menu immediately when starting interaction
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
      const currentGS = gameStateRef.current;
      const pos = playerPosRef.current;
      const playerDir = playerDirectionRef.current;

      // Get adjacent tiles
      const adjacent = Object.entries(DIRECTIONS).map(([dir, dd]) => ({
        x: pos.x + dd.dx,
        y: pos.y + dd.dy,
        dir,
      })).filter(p => p.x >= 0 && p.x < GRID_COLS && p.y >= 0 && p.y < GRID_ROWS);

      // Find the tile we're facing
      const facingTile = adjacent.find(t => t.dir === playerDir);
      if (!facingTile) return;

      const c = currentGrid[facingTile.y][facingTile.x];
      const p = { x: facingTile.x, y: facingTile.y };

      // Skip item pickups
      if (c.type.startsWith('item-')) return;

      // Get available interactions from theme
      const possibleActions = [];

      // Get interactions at target tile
      const targetInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, p.x, p.y) || [];
      for (const interaction of targetInteractions) {
        possibleActions.push(() => startInteraction(interaction.id, p));
      }

      // Also check interactions at player's current position
      const selfInteractions = theme?.getAvailableInteractions?.(currentGS, currentGrid, pos.x, pos.y) || [];
      for (const interaction of selfInteractions) {
        // Avoid duplicates by checking if we already have this interaction type
        if (!targetInteractions.find(t => t.id === interaction.id)) {
          possibleActions.push(() => startInteraction(interaction.id, { x: pos.x, y: pos.y }));
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
      const progress = Math.min(elapsed / INTERACTION_DURATION, 1);

      setInteractionState(prev => {
        if (!prev) return null;
        return { ...prev, progress };
      });

      if (progress >= 1) {
        completeInteraction(interactionState.type, interactionState.targetPos);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [interactionState, gameOver, completeInteraction]);

  useEffect(() => {
    if (!mouseHoldState || gameOver) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - mouseHoldState.startTime;
      const progress = Math.min(elapsed / INTERACTION_DURATION, 1);

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
        setHazardZones(getAllHazardZones(gridRef.current));
        return newTick;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [gameOver]);

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
            showMessage(`${hazard.message} Lives: ${remaining}`);
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
        showMessage(exitResult.message || 'Cannot exit yet!');
      }
      return;
    }

    const gs = { ...gameState, reachedExit: true };
    const { allComplete } = checkAllMissions(effectiveMissions, gs, level.fixedOrder, grid, theme);
    if (allComplete) {
      setGameState(prev => ({ ...prev, reachedExit: true }));
      setGameOver('win');
      showMessage('YOU ESCAPED!', 999999);

      // Submit score to leaderboard (only for named users, not in test mode)
      if (!isTestMode && level.id && displayName) {
        const finalTime = (Date.now() - startTime) / 1000;
        submitScore(level.id, userId, displayName, finalTime, moveCount).catch(err => {
          console.error('Failed to submit score:', err);
        });
      }
    } else if (!exitMessageShownRef.current) {
      exitMessageShownRef.current = true;
      showMessage('Complete all missions first!');
    }
  }, [playerPos, gameOver, level, showMessage, grid, gameState, exitTiles, theme]);

  // Removed viewport bounds for open-world feel
  const viewportBounds = null;

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
            <div style={{ fontSize: 10, color: '#ff9999', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Lives
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
              <div style={{ fontSize: 9, color: '#a8d8ff', fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                ⏱ Time
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
              <div style={{ fontSize: 9, color: '#e8b8ff', fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                🚶 Moves
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
              <div style={{ fontSize: 11, color: '#ccbb99', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Inv:
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
              <div style={{ fontSize: 11, color: '#a8c8ff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Wear:
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
                  <span style={{
                    position: 'absolute',
                    bottom: -6,
                    right: -4,
                    fontSize: 8,
                    color: '#a8c8ff',
                    background: 'rgba(34, 68, 120, 0.9)',
                    padding: '1px 3px',
                    borderRadius: 3,
                    fontWeight: 'bold',
                  }}>E</span>
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
        </div>

        {/* Center: Message (Fixed space) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '300px',
        }}>
          {message && (
            <div style={{
              background: 'linear-gradient(145deg, rgba(58, 122, 58, 0.95) 0%, rgba(42, 90, 42, 0.95) 100%)',
              padding: '10px 24px',
              borderRadius: 10,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '700',
              boxShadow: '0 4px 16px rgba(68, 170, 68, 0.4), 0 0 0 2px rgba(68, 170, 68, 0.3)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
            }}>
              {message}
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
          <div style={{ fontSize: 10, color: '#a8d8f8', fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Missions {level.fixedOrder ? '(Ordered)' : ''}
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
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.description || `${m.type}: ${m.targetId || ''}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Game Area - Flexible, centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
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
            onHoldEnd={() => setMouseHoldState(null)}
            interactionTarget={(interactionState || mouseHoldState)?.targetPos}
            interactionProgress={(interactionState || mouseHoldState)?.progress || 0}
            theme={theme}
          />

          {/* Inline interaction menu next to player */}
          {inlineMenu && !gameOver && (
            <div style={{
              position: 'absolute',
              left: `${(playerPos.x + 1) * 40 + 10}px`,
              top: `${playerPos.y * 40}px`,
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
                Hold key to interact
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
        gap: 20,
      }}>
        <div style={{
          color: '#a8e8a8',
          fontSize: 12,
          fontFamily: 'monospace',
          display: 'flex',
          gap: 20,
        }}>
          <span><strong>WASD/Arrows:</strong> Move</span>
          <span><strong>E:</strong> Interact</span>
          <span><strong>F:</strong> Pick up</span>
          <span><strong>Q:</strong> Drop Item</span>
          <span><strong>R:</strong> Restart</span>
        </div>
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
            }}>
              Drop Item
            </h2>
            <div style={{
              color: '#88cc88',
              fontSize: 12,
              textAlign: 'center',
              marginBottom: 16,
              fontWeight: '500',
            }}>
              Click or press number key
            </div>
            {gameState.inventory.length === 0 ? (
              <div style={{ color: '#a8e8a8', fontSize: 14, padding: 20, textAlign: 'center' }}>
                Inventory is empty
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Regular items */}
                {gameState.inventory.map((item, idx) => {
                  const isWearable = theme?.isWearable?.(item.itemType);
                  if (isWearable) return null; // Skip wearables in main list

                  const itemLabel = theme?.getItemLabel?.(item.itemType, item) || item.itemType;

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
                        <span>Wearables</span>
                        <span style={{
                          fontSize: 9,
                          color: '#88aadd',
                          fontWeight: 'normal',
                          textTransform: 'none',
                        }}>
                          (Press E to wear)
                        </span>
                      </div>
                    </div>
                    {gameState.inventory.map((item, idx) => {
                      const isWearable = theme?.isWearable?.(item.itemType);
                      if (!isWearable) return null;

                      const itemLabel = theme?.getItemLabel?.(item.itemType, item) || item.itemType;

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
              Cancel (Q or ESC)
            </button>
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
              📊 Final Statistics
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
                }}>
                  ⏱ Time
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
                }}>
                  minutes:seconds
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
                }}>
                  🚶 Moves
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
                }}>
                  total steps
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
                  🏆 Score: {Math.max(0, 10000 - (elapsedTime * 10) - (moveCount * 5))} pts
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
          </div>
        </div>
      )}
    </div>
  );
}

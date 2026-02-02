import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Grid from './Grid';
import HUD from './HUD';
import { findTile, cloneGrid } from '../engine/tiles';
import { canMoveTo, isSamePos } from '../engine/collision';
import { getAllHazardZones, floodFillWater } from '../engine/hazards';
import { checkAllMissions } from '../engine/missions';
import { DIRECTIONS, GRID_COLS, GRID_ROWS, DEFAULT_INVENTORY_CAPACITY, ITEM_TYPES } from '../utils/constants';

const MOVE_COOLDOWN = 150;
const INTERACTION_DURATION = 1500; // 1.5 seconds for hold E interactions

function hasItemType(inventory, itemType) {
  return inventory.some(item => item.itemType === itemType);
}

function findItemIndex(inventory, itemType) {
  return inventory.findIndex(item => item.itemType === itemType);
}

// Convert old 'item' tiles to new 'item-*' tiles
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

// Calculate viewport bounds from grid (bounding box of non-empty tiles + padding)
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

  // If no non-empty tiles found, return full grid
  if (maxX === -1) {
    return { minX: 0, minY: 0, maxX: GRID_COLS - 1, maxY: GRID_ROWS - 1 };
  }

  // Add padding (2 tiles on each side, clamped to grid bounds)
  const padding = 2;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(GRID_COLS - 1, maxX + padding);
  maxY = Math.min(GRID_ROWS - 1, maxY + padding);

  return { minX, minY, maxX, maxY };
}

// Get adjacent tile positions
function getAdjacentPositions(x, y) {
  const adjacent = [];
  if (y > 0) adjacent.push({ x, y: y - 1, key: `${x},${y - 1}` });
  if (y < GRID_ROWS - 1) adjacent.push({ x, y: y + 1, key: `${x},${y + 1}` });
  if (x > 0) adjacent.push({ x: x - 1, y, key: `${x - 1},${y}` });
  if (x < GRID_COLS - 1) adjacent.push({ x: x + 1, y, key: `${x + 1},${y}` });
  return adjacent;
}

// Initialize revealed tiles with starting position and adjacent tiles
function initializeRevealedTiles(startX, startY) {
  const revealed = new Set();
  revealed.add(`${startX},${startY}`);
  const adjacent = getAdjacentPositions(startX, startY);
  adjacent.forEach(pos => revealed.add(pos.key));
  return revealed;
}

export default function SolverMode({ level, onBack }) {
  const [grid, setGrid] = useState(() => convertLegacyItems(level.grid));
  const startPos = findTile(level.grid, 'campfire') || { x: 1, y: 1 };
  const [playerPos, setPlayerPos] = useState(() => ({ ...startPos }));
  const [lives, setLives] = useState(level.lives || 3);
  const maxInventory = level.inventoryCapacity || DEFAULT_INVENTORY_CAPACITY;
  const [gameState, setGameState] = useState({
    collectedItems: [],
    rescuedFriends: 0,
    reachedLocations: [],
    reachedExit: false,
    inventory: [],
  });
  const [revealedTiles, setRevealedTiles] = useState(() => initializeRevealedTiles(startPos.x, startPos.y));
  const [tick, setTick] = useState(0);
  const [message, setMessage] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [hazardZones, setHazardZones] = useState([]);
  const [interactionState, setInteractionState] = useState(null); // { type, startTime, targetPos, progress }
  const [dropMenuOpen, setDropMenuOpen] = useState(false);
  const [interactionChoices, setInteractionChoices] = useState(null); // { choices: [{label, action}] }
  const [mouseHoldState, setMouseHoldState] = useState(null); // { startTime, targetPos, progress }

  const messageTimerRef = useRef(null);
  const gridRef = useRef(grid);
  const gameStateRef = useRef(gameState);
  const playerPosRef = useRef(playerPos);
  const livesRef = useRef(lives);
  const gameOverRef = useRef(gameOver);
  const lastMoveRef = useRef(0);
  const lastDirRef = useRef('right');
  const keysDown = useRef(new Set());
  const exitMessageShownRef = useRef(false);
  const interactionStateRef = useRef(interactionState);

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
    });
    setRevealedTiles(initializeRevealedTiles(startPos.x, startPos.y));
    setTick(0);
    setGameOver(null);
    setMessage(null);
    setInteractionState(null);
    setDropMenuOpen(false);
    keysDown.current.clear();
    exitMessageShownRef.current = false;
  }, [level, startPos]);

  // Drop item from menu
  const dropItem = useCallback((index) => {
    const inv = gameStateRef.current.inventory;
    if (index < 0 || index >= inv.length) return;

    const pos = playerPosRef.current;
    const currentGrid = gridRef.current;
    const cell = currentGrid[pos.y][pos.x];
    if (cell.type !== 'ground' && cell.type !== 'campfire' && cell.type !== 'raft') {
      showMessage("Can't drop here!");
      return;
    }

    const dropped = inv[index];
    const newGrid = cloneGrid(currentGrid);
    newGrid[pos.y][pos.x] = { type: `item-${dropped.itemType}`, config: {} };
    setGrid(newGrid);
    setGameState(prev => ({
      ...prev,
      inventory: prev.inventory.filter((_, i) => i !== index),
    }));
    const itemDef = ITEM_TYPES[dropped.itemType];
    showMessage(`Dropped: ${itemDef?.emoji || ''} ${itemDef?.label || dropped.itemType}`);
    setDropMenuOpen(false);
  }, [showMessage]);

  // Pick up an item tile (requires E press)
  const pickUpItem = useCallback((cell, px, py) => {
    const currentGS = gameStateRef.current;
    if (currentGS.inventory.length >= maxInventory) {
      showMessage('Inventory full! Drop an item first (Q).');
      return false;
    }

    // Extract item type from tile type (item-axe -> axe)
    const itemType = cell.type.replace('item-', '');

    const newGrid = cloneGrid(gridRef.current);
    newGrid[py][px] = { type: 'ground', config: {} };
    setGrid(newGrid);

    const itemObj = { itemType, filled: false };
    setGameState(prev => ({
      ...prev,
      inventory: [...prev.inventory, itemObj],
      collectedItems: [...prev.collectedItems, itemType],
    }));
    const itemDef = ITEM_TYPES[itemType];
    showMessage(`Picked up: ${itemDef?.emoji || ''} ${itemDef?.label || itemType}`);
    return true;
  }, [showMessage, maxInventory]);

  // Get adjacent interactable positions sorted by direction priority
  const getInteractTargets = useCallback(() => {
    const pos = playerPosRef.current;
    const currentGrid = gridRef.current;
    const lastDir = lastDirRef.current;

    const interactable = ['tree', 'water', 'raft', 'fire', 'friend'];
    const itemTilePattern = /^item-/;

    const adjacent = Object.entries(DIRECTIONS).map(([dir, dd]) => ({
      x: pos.x + dd.dx, y: pos.y + dd.dy, dir,
    })).filter(p => p.x >= 0 && p.x < GRID_COLS && p.y >= 0 && p.y < GRID_ROWS);

    // Check current position only for items (pickup)
    // Check adjacent for hold-E interactions (tree, water, fire, friend)
    const targets = [];

    // Current tile - only for item pickup
    const currentCell = currentGrid[pos.y][pos.x];
    if (itemTilePattern.test(currentCell.type)) {
      targets.push({ x: pos.x, y: pos.y, dir: 'self' });
    }

    // Adjacent tiles - for hold-E interactions (no items)
    for (const adj of adjacent) {
      const c = currentGrid[adj.y][adj.x];
      if (interactable.includes(c.type)) {
        targets.push(adj);
      }
    }

    const valid = targets;

    // Sort: last movement direction first, then others
    valid.sort((a, b) => {
      const aMatch = a.dir === lastDir ? 0 : 1;
      const bMatch = b.dir === lastDir ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      // Then by distance (self = 0)
      const aDist = a.dir === 'self' ? 0 : 1;
      const bDist = b.dir === 'self' ? 0 : 1;
      return aDist - bDist;
    });

    return valid;
  }, []);

  // Start an interaction that requires holding E
  const startInteraction = useCallback((type, targetPos) => {
    setInteractionState({
      type,
      startTime: Date.now(),
      targetPos,
      progress: 0,
    });
  }, []);

  // Cancel interaction
  const cancelInteraction = useCallback(() => {
    setInteractionState(null);
  }, []);

  // Mouse hold handlers for interactions
  const handleMouseInteraction = useCallback((x, y) => {
    // Check if tile is adjacent to player
    const pos = playerPosRef.current;
    const dx = Math.abs(x - pos.x);
    const dy = Math.abs(y - pos.y);
    const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

    if (!isAdjacent) {
      showMessage('Too far away!');
      return;
    }

    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const c = currentGrid[y][x];

    // Collect possible actions for this tile
    const possibleActions = [];

    // Cut tree with axe
    if (c.type === 'tree' && hasItemType(currentGS.inventory, 'axe')) {
      possibleActions.push({
        type: 'cut-tree',
        targetPos: { x, y },
      });
    }

    // Fill bucket or build raft (water)
    if (c.type === 'water') {
      const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
      if (bucketIdx >= 0) {
        possibleActions.push({
          type: 'fill-bucket',
          targetPos: { x, y },
        });
      }
      if (hasItemType(currentGS.inventory, 'rope') && hasItemType(currentGS.inventory, 'wood')) {
        possibleActions.push({
          type: 'build-raft',
          targetPos: { x, y },
        });
      }
    }

    // Fill bucket from raft
    if (c.type === 'raft') {
      const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
      if (bucketIdx >= 0) {
        possibleActions.push({
          type: 'fill-bucket',
          targetPos: { x, y },
        });
      }
    }

    // Extinguish fire
    if (c.type === 'fire') {
      const filledBucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && item.filled);
      if (filledBucketIdx >= 0) {
        possibleActions.push({
          type: 'extinguish-fire',
          targetPos: { x, y },
        });
      }
    }

    // Rescue friend
    if (c.type === 'friend') {
      possibleActions.push({
        type: 'rescue-friend',
        targetPos: { x, y },
      });
    }

    if (possibleActions.length === 0) {
      showMessage('Nothing to interact with here.');
      return;
    }

    // If multiple actions, show choice menu
    if (possibleActions.length > 1) {
      setInteractionChoices({
        choices: possibleActions.map(action => ({
          label: getInteractionLabel(action.type).replace('...', ''),
          action: () => setMouseHoldState({ startTime: Date.now(), targetPos: action.targetPos, interactionType: action.type, progress: 0 }),
        })),
      });
      return;
    }

    // Single action - start hold interaction
    const action = possibleActions[0];
    setMouseHoldState({ startTime: Date.now(), targetPos: action.targetPos, interactionType: action.type, progress: 0 });
  }, [showMessage]);

  // Complete interaction after holding E
  const completeInteraction = useCallback((interactionType, targetPos) => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const c = currentGrid[targetPos.y][targetPos.x];

    // Cut cuttable tree with axe
    if (interactionType === 'cut-tree') {
      const newGrid = cloneGrid(currentGrid);
      newGrid[targetPos.y][targetPos.x] = { type: 'ground', config: {} };
      setGrid(newGrid);

      if (currentGS.inventory.length < maxInventory) {
        setGameState(prev => ({
          ...prev,
          inventory: [...prev.inventory, { itemType: 'wood' }],
          collectedItems: [...prev.collectedItems, 'wood'],
        }));
        showMessage('Tree chopped! Got wood.');
      } else {
        // Place wood on ground
        newGrid[targetPos.y][targetPos.x] = { type: 'item-wood', config: {} };
        setGrid(newGrid);
        showMessage('Tree chopped! Inventory full, wood dropped here.');
      }
    }

    // Fill bucket
    else if (interactionType === 'fill-bucket') {
      const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
      setGameState(prev => {
        const newInv = [...prev.inventory];
        newInv[bucketIdx] = { ...newInv[bucketIdx], filled: true };
        return { ...prev, inventory: newInv };
      });
      showMessage('Filled bucket with water!');
    }

    // Build raft
    else if (interactionType === 'build-raft') {
      const ropeIdx = findItemIndex(currentGS.inventory, 'rope');
      const woodIdx = findItemIndex(currentGS.inventory, 'wood');
      const newGrid = cloneGrid(currentGrid);
      const waterCells = floodFillWater(newGrid, targetPos.x, targetPos.y);
      for (const wc of waterCells) {
        newGrid[wc.y][wc.x] = { type: 'raft', config: {} };
      }
      setGrid(newGrid);
      setGameState(prev => {
        const newInv = prev.inventory.filter((_, i) => i !== ropeIdx && i !== woodIdx);
        return { ...prev, inventory: newInv };
      });
      showMessage(`Built a raft! (${waterCells.length} tiles)`);
    }

    // Extinguish fire
    else if (interactionType === 'extinguish-fire') {
      const filledBucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && item.filled);
      const newGrid = cloneGrid(currentGrid);
      newGrid[targetPos.y][targetPos.x] = { type: 'ground', config: {} };
      setGrid(newGrid);
      setGameState(prev => {
        const newInv = [...prev.inventory];
        newInv[filledBucketIdx] = { ...newInv[filledBucketIdx], filled: false };
        return { ...prev, inventory: newInv };
      });
      showMessage('Fire extinguished!');
    }

    // Rescue friend
    else if (interactionType === 'rescue-friend') {
      const friendName = c.config.name || 'Friend';
      const newGrid = cloneGrid(currentGrid);
      newGrid[targetPos.y][targetPos.x] = { type: 'ground', config: {} };
      setGrid(newGrid);
      setGameState(prev => ({
        ...prev,
        rescuedFriends: (prev.rescuedFriends || 0) + 1,
        collectedItems: [...prev.collectedItems, 'friend'],
      }));
      showMessage(`Rescued: ${friendName}!`);
    }

    cancelInteraction();
  }, [showMessage, maxInventory, cancelInteraction]);

  // Interaction logic - press E to pick up items, start hold E for other interactions
  const doInteract = useCallback(() => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const targets = getInteractTargets();

    const possibleActions = [];

    for (const p of targets) {
      const c = currentGrid[p.y][p.x];

      // Pick up items - instant with E press
      if (c.type.startsWith('item-')) {
        const itemType = c.config.itemType || c.type.replace('item-', '');
        const itemDef = ITEM_TYPES[itemType];
        const itemLabel = itemDef?.label || itemType;
        // Check inventory space
        if (currentGS.inventory.length >= maxInventory) {
          // Don't add to actions, but continue checking other interactions
          continue;
        }
        possibleActions.push({
          label: `Pick up ${itemLabel}`,
          action: () => pickUpItem(c, p.x, p.y),
        });
        continue;
      }

      // Cut tree with axe - requires holding E (all trees are cuttable now)
      if (c.type === 'tree') {
        if (hasItemType(currentGS.inventory, 'axe')) {
          possibleActions.push({
            label: 'Cut tree with axe',
            action: () => startInteraction('cut-tree', p),
          });
        }
        continue;
      }

      // Interact with water: fill bucket or build raft - requires holding E
      if (c.type === 'water') {
        const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
        if (bucketIdx >= 0) {
          possibleActions.push({
            label: 'Fill bucket with water',
            action: () => startInteraction('fill-bucket', p),
          });
        }
        if (hasItemType(currentGS.inventory, 'rope') && hasItemType(currentGS.inventory, 'wood')) {
          possibleActions.push({
            label: 'Build raft (Rope + Wood)',
            action: () => startInteraction('build-raft', p),
          });
        }
        continue;
      }

      // Interact with raft: fill bucket - requires holding E
      if (c.type === 'raft') {
        const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
        if (bucketIdx >= 0) {
          possibleActions.push({
            label: 'Fill bucket with water',
            action: () => startInteraction('fill-bucket', p),
          });
        }
        continue;
      }

      // Extinguish fire with filled bucket - requires holding E
      if (c.type === 'fire') {
        const filledBucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && item.filled);
        if (filledBucketIdx >= 0) {
          possibleActions.push({
            label: 'Extinguish fire with bucket',
            action: () => startInteraction('extinguish-fire', p),
          });
        }
        continue;
      }

      // Rescue friend - requires holding E
      if (c.type === 'friend') {
        const friendName = c.config.name || 'Friend';
        possibleActions.push({
          label: `Rescue ${friendName}`,
          action: () => startInteraction('rescue-friend', p),
        });
        continue;
      }
    }

    // If no actions available, show message
    if (possibleActions.length === 0) {
      const hasItemOnTile = currentGrid[playerPosRef.current.y][playerPosRef.current.x].type.startsWith('item-');
      if (hasItemOnTile && currentGS.inventory.length >= maxInventory) {
        showMessage(`Inventory full! (${maxInventory} items max) Press Q to drop items.`);
      } else {
        showMessage('Nothing to interact with here.');
      }
      return;
    }

    // If only one action, execute it immediately
    if (possibleActions.length === 1) {
      possibleActions[0].action();
      return;
    }

    // Multiple actions - show choice menu
    setInteractionChoices({ choices: possibleActions });
  }, [showMessage, pickUpItem, getInteractTargets, startInteraction, maxInventory]);

  // Movement logic
  const doMove = useCallback((dir) => {
    if (gameOverRef.current) return;

    // Cancel interaction on movement
    if (interactionStateRef.current) {
      cancelInteraction();
    }

    lastDirRef.current = dir;
    const d = DIRECTIONS[dir];
    const prev = playerPosRef.current;
    const nx = prev.x + d.dx, ny = prev.y + d.dy;

    if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) return;

    const currentGrid = gridRef.current;
    const targetCell = currentGrid[ny][nx];
    const currentGS = gameStateRef.current;

    // Bear encounter
    if (targetCell.type === 'bear') {
      if (hasItemType(currentGS.inventory, 'knife')) {
        const knifeIdx = findItemIndex(currentGS.inventory, 'knife');
        const newGrid = cloneGrid(currentGrid);
        newGrid[ny][nx] = { type: 'ground', config: {} };
        setGrid(newGrid);
        setGameState(prev => {
          const newInv = prev.inventory.filter((_, i) => i !== knifeIdx);
          newInv.push({ itemType: 'sweater' });
          return {
            ...prev,
            inventory: newInv,
            collectedItems: [...prev.collectedItems, 'sweater'],
          };
        });
        showMessage('Defeated the bear! Got a sweater.');
        setPlayerPos({ x: nx, y: ny });
      } else {
        const remaining = loseLife();
        if (remaining > 0) {
          showMessage(`A bear blocks your path! You need a knife. Lives: ${remaining}`);
        }
      }
      return;
    }

    // Snow - needs sweater
    if (targetCell.type === 'snow') {
      // Reveal the snow tile and adjacent tiles even if blocked
      setRevealedTiles(prev => {
        const newRevealed = new Set(prev);
        newRevealed.add(`${nx},${ny}`);
        const adjacent = getAdjacentPositions(nx, ny);
        adjacent.forEach(pos => newRevealed.add(pos.key));
        return newRevealed;
      });

      if (hasItemType(currentGS.inventory, 'sweater')) {
        setPlayerPos({ x: nx, y: ny });
      } else {
        showMessage('Too cold! You need a Sweater to enter snow.');
      }
      return;
    }

    // Water - always blocks
    if (targetCell.type === 'water') {
      showMessage("Can't swim! Build a raft (Rope + Wood) nearby.");
      return;
    }

    // Fire - stepping on it damages and pushes back
    if (targetCell.type === 'fire') {
      const remaining = loseLife();
      if (remaining > 0) {
        showMessage(`Burned by fire! Lives: ${remaining}`);
        // Stay at current position (pushed back), don't move to fire tile
      }
      return;
    }

    // Normal movement
    if (canMoveTo(currentGrid, nx, ny)) {
      setPlayerPos({ x: nx, y: ny });

      // Reveal adjacent tiles
      setRevealedTiles(prev => {
        const newRevealed = new Set(prev);
        newRevealed.add(`${nx},${ny}`);
        const adjacent = getAdjacentPositions(nx, ny);
        adjacent.forEach(pos => newRevealed.add(pos.key));
        return newRevealed;
      });
    }
  }, [showMessage, loseLife, respawn, cancelInteraction]);

  // Keyboard
  useEffect(() => {
    const gameKeys = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'e', 'r', 'q']);

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (gameKeys.has(key) || key === 'escape') {
        e.preventDefault();
        e.stopPropagation();
      }

      keysDown.current.add(key);

      if (key === 'escape') {
        // Close interaction choice menu if open
        if (interactionChoices) {
          setInteractionChoices(null);
          return;
        }
        // Close drop menu if open
        if (dropMenuOpen) {
          setDropMenuOpen(false);
          return;
        }
        // Otherwise go back to menu
        onBack();
        return;
      }
      if (key === 'r') { restart(); return; }

      // E key - start interaction or pick up item
      if (key === 'e' && !interactionStateRef.current) {
        doInteract();
        return;
      }

      // Q key - toggle drop menu
      if (key === 'q') {
        setDropMenuOpen(prev => !prev);
        return;
      }
    };

    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      keysDown.current.delete(key);

      // Release E - cancel interaction if in progress
      if (key === 'e' && interactionStateRef.current) {
        cancelInteraction();
        showMessage('Interaction cancelled.');
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [onBack, restart, doInteract, cancelInteraction, showMessage, interactionChoices, dropMenuOpen]);

  // Movement loop
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastMoveRef.current < MOVE_COOLDOWN) return;

      const keys = keysDown.current;
      let dir = null;
      if (keys.has('arrowup') || keys.has('w')) dir = 'up';
      else if (keys.has('arrowdown') || keys.has('s')) dir = 'down';
      else if (keys.has('arrowleft') || keys.has('a')) dir = 'left';
      else if (keys.has('arrowright') || keys.has('d')) dir = 'right';

      if (dir) {
        doMove(dir);
        lastMoveRef.current = now;
      }
    }, 16);
    return () => clearInterval(interval);
  }, [gameOver, doMove]);

  // Hold E interaction progress
  useEffect(() => {
    if (!interactionState || gameOver) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - interactionState.startTime;
      const progress = Math.min(elapsed / INTERACTION_DURATION, 1);

      setInteractionState(prev => {
        if (!prev) return null;
        return { ...prev, progress };
      });

      // Complete interaction when progress reaches 100%
      if (progress >= 1) {
        completeInteraction(interactionState.type, interactionState.targetPos);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [interactionState, gameOver, completeInteraction]);

  // Mouse hold interaction progress
  useEffect(() => {
    if (!mouseHoldState || gameOver) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - mouseHoldState.startTime;
      const progress = Math.min(elapsed / INTERACTION_DURATION, 1);

      setMouseHoldState(prev => {
        if (!prev) return null;
        return { ...prev, progress };
      });

      // Complete interaction when progress reaches 100%
      if (progress >= 1) {
        completeInteraction(mouseHoldState.interactionType, mouseHoldState.targetPos);
        setMouseHoldState(null);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [mouseHoldState, gameOver, completeInteraction]);

  // Tick: hazard zones update
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

  // Reach location tracking
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

  // Exit check (car) - check for key requirement
  useEffect(() => {
    if (gameOver) return;
    const exitPos = findTile(level.grid, 'car');
    if (!exitPos || !isSamePos(playerPos, exitPos)) {
      exitMessageShownRef.current = false;
      return;
    }

    // Check if car requires key
    const carCell = level.grid[exitPos.y][exitPos.x];
    const needsKey = carCell.config?.needsKey !== false; // Default true

    if (needsKey && !hasItemType(gameState.inventory, 'key')) {
      if (!exitMessageShownRef.current) {
        exitMessageShownRef.current = true;
        showMessage('You need a Key to start the car!');
      }
      return;
    }

    const gs = { ...gameState, reachedExit: true };
    const { allComplete } = checkAllMissions(level.missions || [], gs, level.fixedOrder, grid);
    if (allComplete) {
      setGameState(prev => ({ ...prev, reachedExit: true }));
      setGameOver('win');
      showMessage('YOU ESCAPED THE FOREST!', 999999);
    } else if (!exitMessageShownRef.current) {
      exitMessageShownRef.current = true;
      showMessage('Complete all missions first!');
    }
  }, [playerPos, gameOver, level, showMessage, grid, gameState]);

  // Calculate viewport bounds for dynamic canvas sizing
  const viewportBounds = useMemo(() => calculateViewportBounds(grid), [grid]);

  const btnStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 100%)',
    border: '2px solid #446644',
    borderRadius: 8,
    color: '#eee',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  };

  // Get interaction label for progress bar
  const getInteractionLabel = (type) => {
    switch (type) {
      case 'cut-tree': return 'Cutting tree...';
      case 'fill-bucket': return 'Filling bucket...';
      case 'build-raft': return 'Building raft...';
      case 'extinguish-fire': return 'Extinguishing fire...';
      case 'rescue-friend': return 'Rescuing friend...';
      default: return 'Interacting...';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, #0f2a0f 0%, #0a1a0a 60%, #050f05 100%)',
        position: 'relative',
      }}
      tabIndex={0}
      ref={el => el && el.focus()}
    >
      <div style={{ position: 'relative' }}>
        <HUD
          lives={lives}
          maxLives={level.lives || 3}
          missions={level.missions || []}
          gameState={gameState}
          fixedOrder={level.fixedOrder}
          message={message}
          inventory={gameState.inventory}
          grid={grid}
        />
        <Grid
          grid={grid}
          playerPos={playerPos}
          showHazardZones={true}
          tick={tick}
          hazardZoneOverrides={hazardZones}
          revealedTiles={revealedTiles}
          viewportBounds={viewportBounds}
          onHoldStart={handleMouseInteraction}
          onHoldEnd={() => setMouseHoldState(null)}
        />

        {/* Hold E progress bar */}
        {interactionState && (
          <div style={{
            position: 'absolute',
            bottom: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, rgba(26, 42, 26, 0.95) 0%, rgba(10, 26, 10, 0.95) 100%)',
            border: '3px solid #66aa66',
            borderRadius: 10,
            padding: '10px 16px',
            minWidth: 220,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              color: '#eeffee',
              fontSize: 13,
              marginBottom: 6,
              textAlign: 'center',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}>
              {getInteractionLabel(interactionState.type)}
            </div>
            <div style={{
              width: '100%',
              height: 10,
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 5,
              overflow: 'hidden',
              border: '1px solid #335533',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
            }}>
              <div style={{
                width: `${interactionState.progress * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #44ff44 0%, #66ff88 100%)',
                transition: 'width 16ms linear',
                boxShadow: '0 0 10px rgba(68, 255, 68, 0.5)',
              }} />
            </div>
            <div style={{
              color: '#99bb99',
              fontSize: 11,
              marginTop: 4,
              textAlign: 'center',
            }}>
              Hold E to continue
            </div>
          </div>
        )}

        {/* Mouse hold progress bar */}
        {mouseHoldState && (
          <div style={{
            position: 'absolute',
            bottom: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, rgba(26, 42, 26, 0.95) 0%, rgba(10, 26, 10, 0.95) 100%)',
            border: '3px solid #66aa66',
            borderRadius: 10,
            padding: '10px 16px',
            minWidth: 220,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              color: '#eeffee',
              fontSize: 13,
              marginBottom: 6,
              textAlign: 'center',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}>
              {getInteractionLabel(mouseHoldState.interactionType)}
            </div>
            <div style={{
              width: '100%',
              height: 10,
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 5,
              overflow: 'hidden',
              border: '1px solid #335533',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
            }}>
              <div style={{
                width: `${mouseHoldState.progress * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #44ff44 0%, #66ff88 100%)',
                transition: 'width 16ms linear',
                boxShadow: '0 0 10px rgba(68, 255, 68, 0.5)',
              }} />
            </div>
            <div style={{
              color: '#99bb99',
              fontSize: 11,
              marginTop: 4,
              textAlign: 'center',
            }}>
              Hold mouse button to continue
            </div>
          </div>
        )}
      </div>

      {/* Drop menu (Q) */}
      {dropMenuOpen && !gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)',
          zIndex: 30,
        }}
        onClick={() => setDropMenuOpen(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a3a1a 0%, #0f2a0f 100%)',
              border: '3px solid #66aa66',
              borderRadius: 12,
              padding: 24,
              minWidth: 340,
              maxWidth: 440,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: '#88dd88',
              margin: '0 0 16px 0',
              fontSize: 20,
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(136, 221, 136, 0.3)',
            }}>
              Drop Item (Q)
            </h2>
            {gameState.inventory.length === 0 ? (
              <div style={{ color: '#888', fontSize: 14, padding: 10 }}>
                Inventory is empty
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {gameState.inventory.map((item, idx) => {
                  const itemDef = ITEM_TYPES[item.itemType];
                  const label = itemDef?.label || item.itemType;
                  const emoji = itemDef?.emoji || '';
                  const filledText = item.filled ? ' (filled)' : '';
                  return (
                    <button
                      key={idx}
                      onClick={() => dropItem(idx)}
                      style={{
                        ...btnStyle,
                        textAlign: 'left',
                        width: '100%',
                        background: '#2a3a2a',
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#3a4a3a'}
                      onMouseLeave={(e) => e.target.style.background = '#2a3a2a'}
                    >
                      {emoji} {label}{filledText}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setDropMenuOpen(false)}
              style={{ ...btnStyle, marginTop: 12, width: '100%' }}
            >
              Cancel (Q or ESC)
            </button>
          </div>
        </div>
      )}

      {/* Interaction choice menu */}
      {interactionChoices && !gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)',
          zIndex: 30,
        }}
        onClick={() => setInteractionChoices(null)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a3a1a 0%, #0f2a0f 100%)',
              border: '3px solid #66aa66',
              borderRadius: 12,
              padding: 24,
              minWidth: 340,
              maxWidth: 440,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: '#88dd88',
              margin: '0 0 16px 0',
              fontSize: 20,
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(136, 221, 136, 0.3)',
            }}>
              Choose Interaction
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {interactionChoices.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInteractionChoices(null);
                    choice.action();
                  }}
                  style={{
                    ...btnStyle,
                    textAlign: 'left',
                    width: '100%',
                    background: '#2a3a2a',
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#3a4a3a'}
                  onMouseLeave={(e) => e.target.style.background = '#2a3a2a'}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setInteractionChoices(null)}
              style={{ ...btnStyle, marginTop: 12, width: '100%' }}
            >
              Cancel (ESC)
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 20,
        }}>
          <h1 style={{
            color: gameOver === 'win' ? '#44ff44' : '#ff4444',
            fontSize: 56,
            marginBottom: 30,
            fontWeight: '900',
            textShadow: gameOver === 'win'
              ? '0 0 20px rgba(68, 255, 68, 0.8), 0 4px 16px rgba(68, 255, 68, 0.5)'
              : '0 0 20px rgba(255, 68, 68, 0.8), 0 4px 16px rgba(255, 68, 68, 0.5)',
            letterSpacing: 2,
          }}>
            {gameOver === 'win' ? '🎉 YOU ESCAPED! 🎉' : '💀 GAME OVER 💀'}
          </h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={restart} style={btnStyle}>Restart (R)</button>
            <button onClick={onBack} style={btnStyle}>Back to Menu (ESC)</button>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 16,
        color: '#88aa88',
        fontSize: 12,
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 8,
        border: '1px solid #335533',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
      }}>
        WASD/Arrows: Move | E: Pick up / Hold to interact | Q: Drop Item Menu | R: Restart | ESC: Menu
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
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

    const interactable = ['tree', 'water', 'fire', 'friend'];
    const itemTilePattern = /^item-/;

    const adjacent = Object.entries(DIRECTIONS).map(([dir, dd]) => ({
      x: pos.x + dd.dx, y: pos.y + dd.dy, dir,
    })).filter(p => p.x >= 0 && p.x < GRID_COLS && p.y >= 0 && p.y < GRID_ROWS);

    // Also check current position (for items)
    const targets = [{ x: pos.x, y: pos.y, dir: 'self' }, ...adjacent];

    // Filter to interactable cells
    const valid = targets.filter(p => {
      const c = currentGrid[p.y][p.x];
      if (itemTilePattern.test(c.type)) return true;
      if (interactable.includes(c.type)) return true;
      if (c.type === 'tree' && c.config.cuttable) return true;
      return false;
    });

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

    for (const p of targets) {
      const c = currentGrid[p.y][p.x];

      // Pick up items - instant with E press
      if (c.type.startsWith('item-')) {
        pickUpItem(c, p.x, p.y);
        return;
      }

      // Cut cuttable tree with axe - requires holding E
      if (c.type === 'tree' && c.config.cuttable) {
        if (hasItemType(currentGS.inventory, 'axe')) {
          startInteraction('cut-tree', p);
          return;
        } else {
          showMessage('You need an Axe to cut this tree.');
          return;
        }
      }

      // Interact with water: fill bucket or build raft - requires holding E
      if (c.type === 'water') {
        const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
        if (bucketIdx >= 0) {
          startInteraction('fill-bucket', p);
          return;
        }
        if (hasItemType(currentGS.inventory, 'rope') && hasItemType(currentGS.inventory, 'wood')) {
          startInteraction('build-raft', p);
          return;
        }
        showMessage('Need Rope + Wood to build a raft, or empty Bucket to fill.');
        return;
      }

      // Extinguish fire with filled bucket - requires holding E
      if (c.type === 'fire') {
        const filledBucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && item.filled);
        if (filledBucketIdx >= 0) {
          startInteraction('extinguish-fire', p);
          return;
        } else {
          showMessage('You need a filled Bucket to extinguish fire.');
          return;
        }
      }

      // Rescue friend - requires holding E
      if (c.type === 'friend') {
        startInteraction('rescue-friend', p);
        return;
      }
    }
  }, [showMessage, pickUpItem, getInteractTargets, startInteraction]);

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

    // Fire - stepping on it damages
    if (targetCell.type === 'fire') {
      const remaining = loseLife();
      if (remaining > 0) {
        showMessage(`Burned by fire! Lives: ${remaining}`);
        respawn();
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
        setDropMenuOpen(false);
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
  }, [onBack, restart, doInteract, cancelInteraction, showMessage]);

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

  const btnStyle = { padding: '10px 20px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 6, color: '#ccc', cursor: 'pointer', fontSize: 14 };

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
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a1a0a', position: 'relative' }}
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
        />

        {/* Hold E progress bar */}
        {interactionState && (
          <div style={{
            position: 'absolute',
            bottom: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            border: '2px solid #446644',
            borderRadius: 8,
            padding: '8px 12px',
            minWidth: 200,
          }}>
            <div style={{ color: '#ccc', fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
              {getInteractionLabel(interactionState.type)}
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#2a3a2a',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${interactionState.progress * 100}%`,
                height: '100%',
                background: '#44ff44',
                transition: 'width 16ms linear',
              }} />
            </div>
            <div style={{ color: '#888', fontSize: 10, marginTop: 2, textAlign: 'center' }}>
              Hold E to continue
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
              background: '#1a2a1a',
              border: '2px solid #446644',
              borderRadius: 8,
              padding: 20,
              minWidth: 300,
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#ccc', margin: '0 0 12px 0', fontSize: 18 }}>
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

      {gameOver && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', zIndex: 20,
        }}>
          <h1 style={{ color: gameOver === 'win' ? '#44ff44' : '#ff4444', fontSize: 48, marginBottom: 20 }}>
            {gameOver === 'win' ? 'YOU ESCAPED!' : 'GAME OVER'}
          </h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={restart} style={btnStyle}>Restart (R)</button>
            <button onClick={onBack} style={btnStyle}>Back to Menu (ESC)</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, color: '#446644', fontSize: 11 }}>
        WASD/Arrows: Move | E: Pick up / Hold to interact | Q: Drop Item Menu | R: Restart | ESC: Menu
      </div>
    </div>
  );
}

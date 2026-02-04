import { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import Grid from './Grid';
import { findTile, cloneGrid } from '../engine/tiles';
import { canMoveTo, isSamePos } from '../engine/collision';
import { getAllHazardZones } from '../engine/hazards';
import { checkAllMissions } from '../engine/missions';
import { DIRECTIONS, GRID_COLS, GRID_ROWS, DEFAULT_INVENTORY_CAPACITY } from '../utils/constants';
import { ThemeContext } from '../App';
import { InteractionEngine } from '../engine/interactionEngine';

const MOVE_COOLDOWN = 150;
const INTERACTION_DURATION = 1500;

function hasItemType(inventory, itemType) {
  return inventory.some(item => item.itemType === itemType);
}

function findItemIndex(inventory, itemType) {
  return inventory.findIndex(item => item.itemType === itemType);
}

// Canvas component to draw wood icon matching the map
function WoodIcon({ size = 24 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const s = size * 0.32;

    ctx.clearRect(0, 0, size, size);

    // Bottom log - darker
    ctx.fillStyle = '#6b4910';
    ctx.fillRect(cx - s * 0.75, cy + s * 0.25, s * 1.5, s * 0.55);

    // Bottom log - bark texture
    ctx.fillStyle = '#5a3808';
    ctx.fillRect(cx - s * 0.75, cy + s * 0.25, s * 0.08, s * 0.55);
    ctx.fillRect(cx - s * 0.3, cy + s * 0.25, s * 0.08, s * 0.55);
    ctx.fillRect(cx + s * 0.2, cy + s * 0.25, s * 0.08, s * 0.55);

    // Bottom log - end cut rings
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.arc(cx + s * 0.75, cy + s * 0.52, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b4910';
    ctx.beginPath();
    ctx.arc(cx + s * 0.75, cy + s * 0.52, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a07818';
    ctx.beginPath();
    ctx.arc(cx + s * 0.75, cy + s * 0.52, s * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Top log - lighter
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(cx - s * 1.05, cy - s * 0.35, s * 2.1, s * 0.6);

    // Top log - highlight
    ctx.fillStyle = '#a58420';
    ctx.fillRect(cx - s * 1.05, cy - s * 0.35, s * 2.1, s * 0.18);

    // Top log - bark lines
    ctx.fillStyle = '#6b4910';
    ctx.fillRect(cx - s * 0.85, cy - s * 0.35, s * 0.08, s * 0.6);
    ctx.fillRect(cx - s * 0.3, cy - s * 0.35, s * 0.08, s * 0.6);
    ctx.fillRect(cx + s * 0.35, cy - s * 0.35, s * 0.08, s * 0.6);
    ctx.fillRect(cx + s * 0.85, cy - s * 0.35, s * 0.08, s * 0.6);

    // Top log - end cut rings
    ctx.fillStyle = '#a58420';
    ctx.beginPath();
    ctx.arc(cx - s * 1.05, cy - s * 0.05, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.arc(cx - s * 1.05, cy - s * 0.05, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c09828';
    ctx.beginPath();
    ctx.arc(cx - s * 1.05, cy - s * 0.05, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }, [size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />;
}

// Canvas component to draw bucket icon matching the map
function BucketIcon({ size = 24, filled = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const s = size * 0.35;

    ctx.clearRect(0, 0, size, size);

    if (filled) {
      // FILLED BUCKET - Blue with water
      ctx.fillStyle = '#6699cc';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
      ctx.lineTo(cx - s * 0.6, cy + s * 0.7);
      ctx.closePath();
      ctx.fill();

      // Shadow/depth on right side
      ctx.fillStyle = '#4477aa';
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.3, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
      ctx.lineTo(cx + s * 0.3, cy + s * 0.7);
      ctx.closePath();
      ctx.fill();

      // Highlight on left side
      ctx.fillStyle = '#88bbee';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx - s * 0.3, cy - s * 0.6);
      ctx.lineTo(cx - s * 0.2, cy + s * 0.3);
      ctx.lineTo(cx - s * 0.6, cy + s * 0.3);
      ctx.closePath();
      ctx.fill();

      // Water
      ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.7, cy - s * 0.3);
      ctx.lineTo(cx + s * 0.7, cy - s * 0.3);
      ctx.lineTo(cx + s * 0.55, cy + s * 0.6);
      ctx.lineTo(cx - s * 0.55, cy + s * 0.6);
      ctx.closePath();
      ctx.fill();

      // Rim (top edge)
      ctx.strokeStyle = '#334455';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
      ctx.stroke();

      // Handle
      ctx.strokeStyle = '#556677';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.85, s * 0.55, Math.PI * 0.85, Math.PI * 0.15);
      ctx.stroke();

      // Handle connection points
      ctx.fillStyle = '#556677';
      ctx.beginPath();
      ctx.arc(cx - s * 0.4, cy - s * 0.6, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + s * 0.4, cy - s * 0.6, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // EMPTY BUCKET - Simple gray outline
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;

      // Bucket outline (trapezoid)
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
      ctx.lineTo(cx - s * 0.6, cy + s * 0.7);
      ctx.closePath();
      ctx.stroke();

      // Handle
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.85, s * 0.55, Math.PI * 0.85, Math.PI * 0.15);
      ctx.stroke();

      // Handle connection points
      ctx.fillStyle = '#888888';
      ctx.beginPath();
      ctx.arc(cx - s * 0.4, cy - s * 0.6, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + s * 0.4, cy - s * 0.6, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [size, filled]);

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

function isMissionDone(mission, gs, grid) {
  switch (mission.type) {
    case 'collect': return gs.collectedItems.includes(mission.targetId);
    case 'rescue': return gs.rescuedFriends > 0 || gs.collectedItems.includes('friend');
    case 'extinguish': {
      if (!grid) return false;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x].type === 'fire') return false;
        }
      }
      return true;
    }
    case 'reach': return gs.reachedLocations.includes(mission.targetId);
    case 'escape': return gs.reachedExit;
    default: return false;
  }
}

export default function SolverMode({ level, onBack }) {
  const theme = useContext(ThemeContext);
  const interactionEngine = useMemo(() => theme ? new InteractionEngine(theme) : null, [theme]);

  const [grid, setGrid] = useState(() => convertLegacyItems(level.grid));
  const startPos = findTile(level.grid, 'campfire') || findTile(level.grid, 'start') || { x: 1, y: 1 };
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
    setMoveCount(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    keysDown.current.clear();
    keyPressOrder.current = [];
    exitMessageShownRef.current = false;
  }, [level, startPos]);

  const dropItem = useCallback((index) => {
    const inv = gameStateRef.current.inventory;
    if (index < 0 || index >= inv.length) return;

    const pos = playerPosRef.current;
    const currentGrid = gridRef.current;
    const cell = currentGrid[pos.y][pos.x];
    // Allow dropping on ground-type tiles (forest: ground, campfire, raft | bank: floor, start)
    const groundTiles = ['ground', 'campfire', 'raft', 'floor', 'start'];
    if (!groundTiles.includes(cell.type)) {
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
    newGrid[py][px] = { type: 'ground', config: {} };
    setGrid(newGrid);

    const itemObj = { itemType, filled: false };
    setGameState(prev => ({
      ...prev,
      inventory: [...prev.inventory, itemObj],
      collectedItems: [...prev.collectedItems, itemType],
    }));
    const ITEM_TYPES = theme?.getItemTypes() || {};
    const itemDef = ITEM_TYPES[itemType];
    // Show custom canvas icons for wood and bucket
    if (itemType === 'wood') {
      showMessage(
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Picked up: <WoodIcon size={20} /> {itemDef?.label || itemType}
        </span>
      );
    } else if (itemType === 'bucket') {
      showMessage(
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Picked up: <BucketIcon size={20} filled={false} /> {itemDef?.label || itemType}
        </span>
      );
    } else {
      showMessage(`Picked up: ${itemDef?.emoji || ''} ${itemDef?.label || itemType}`);
    }
    return true;
  }, [showMessage, maxInventory]);

  const getInteractTargets = useCallback(() => {
    const pos = playerPosRef.current;
    const currentGrid = gridRef.current;
    const lastDir = lastDirRef.current;

    const interactable = ['tree', 'water', 'raft', 'fire', 'friend', 'bear'];
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
      if (interactable.includes(c.type)) {
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
  }, []);

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
    const c = currentGrid[y][x];

    const possibleActions = [];

    if (c.type === 'tree' && hasItemType(currentGS.inventory, 'axe')) {
      possibleActions.push({
        type: 'cut-tree',
        targetPos: { x, y },
        dir,
      });
    }

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

    if (c.type === 'raft') {
      const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
      if (bucketIdx >= 0) {
        possibleActions.push({
          type: 'fill-bucket',
          targetPos: { x, y },
        });
      }
    }

    if (c.type === 'fire') {
      const filledBucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && item.filled);
      if (filledBucketIdx >= 0) {
        possibleActions.push({
          type: 'extinguish-fire',
          targetPos: { x, y },
        });
      }
    }

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

    if (possibleActions.length > 1) {
      setInteractionChoices({
        choices: possibleActions.map(action => {
          let label = getInteractionLabel(action.type).replace('...', '');
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
  }, [showMessage]);

  const completeInteraction = useCallback((interactionType, targetPos) => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const c = currentGrid[targetPos.y][targetPos.x];

    if (interactionType === 'cut-tree') {
      const newGrid = cloneGrid(currentGrid);
      newGrid[targetPos.y][targetPos.x] = { type: 'item-wood', config: {} };
      setGrid(newGrid);
      showMessage('🪓 Tree chopped! Wood left on ground.');
    }

    else if (interactionType === 'fill-bucket') {
      const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
      setGameState(prev => {
        const newInv = [...prev.inventory];
        newInv[bucketIdx] = { ...newInv[bucketIdx], filled: true };
        return { ...prev, inventory: newInv };
      });
      showMessage('Filled bucket with water!');
    }

    else if (interactionType === 'build-raft') {
      const ropeIdx = findItemIndex(currentGS.inventory, 'rope');
      const woodIdx = findItemIndex(currentGS.inventory, 'wood');
      setGameState(prev => {
        const newInv = prev.inventory.filter((_, i) => i !== ropeIdx && i !== woodIdx);
        newInv.push({ itemType: 'raft', filled: false });
        return { ...prev, inventory: newInv };
      });
      showMessage('Built a raft! You can now place it on water.');
    }

    else if (interactionType === 'place-raft') {
      const raftIdx = findItemIndex(currentGS.inventory, 'raft');
      const newGrid = cloneGrid(currentGrid);
      newGrid[targetPos.y][targetPos.x] = { type: 'raft', config: {} };
      setGrid(newGrid);
      setGameState(prev => {
        const newInv = prev.inventory.filter((_, i) => i !== raftIdx);
        return { ...prev, inventory: newInv };
      });
      showMessage('Raft placed! You can walk on it.');
    }

    else if (interactionType === 'pickup-raft') {
      const newGrid = cloneGrid(currentGrid);
      newGrid[targetPos.y][targetPos.x] = { type: 'water', config: {} };
      setGrid(newGrid);
      setGameState(prev => {
        const newInv = [...prev.inventory];
        newInv.push({ itemType: 'raft', filled: false });
        return { ...prev, inventory: newInv };
      });
      showMessage('Picked up raft!');
    }

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

    else if (interactionType === 'defeat-bear') {
      const knifeIdx = findItemIndex(currentGS.inventory, 'knife');
      const newGrid = cloneGrid(currentGrid);
      newGrid[targetPos.y][targetPos.x] = { type: 'ground', config: {} };
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
    }

    cancelInteraction();
  }, [showMessage, cancelInteraction]);

  const doPickup = useCallback(() => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const pos = playerPosRef.current;
    const currentCell = currentGrid[pos.y][pos.x];

    // Check if standing on an item
    if (currentCell.type.startsWith('item-')) {
      if (currentGS.inventory.length >= maxInventory) {
        showMessage(`Inventory full! (${maxInventory} items max) Press Q to drop items.`);
        return;
      }
      pickUpItem(currentCell, pos.x, pos.y);
      return;
    }

    showMessage('No item here to pick up. Stand on an item and press F.');
  }, [showMessage, pickUpItem]);

  const doInteract = useCallback(() => {
    const currentGrid = gridRef.current;
    const currentGS = gameStateRef.current;
    const targets = getInteractTargets();
    const playerDir = playerDirectionRef.current;

    // Filter targets: only include the one we're facing, or all if standing on something
    const facingTarget = targets.find(t => t.dir === playerDir);
    const relevantTargets = facingTarget ? [facingTarget] : targets.filter(t => t.dir === 'self');

    if (relevantTargets.length === 0) {
      showMessage('Nothing to interact with in that direction.');
      return;
    }

    const p = relevantTargets[0];
    const c = currentGrid[p.y][p.x];

    // Skip item pickups - those use F key now
    if (c.type.startsWith('item-')) {
      showMessage('Press F to pick up items.');
      return;
    }

    // Collect all possible actions for this tile
    const possibleActions = [];

    // First check current tile for building raft
    const currentTile = currentGrid[playerPosRef.current.y][playerPosRef.current.x];
    if ((currentTile.type === 'ground' || currentTile.type === 'campfire' || currentTile.type === 'raft') &&
        hasItemType(currentGS.inventory, 'rope') && hasItemType(currentGS.inventory, 'wood')) {
      possibleActions.push({
        label: 'Build raft',
        action: () => startInteraction('build-raft', { x: playerPosRef.current.x, y: playerPosRef.current.y }),
      });
    }

    if (c.type === 'tree' && hasItemType(currentGS.inventory, 'axe')) {
      possibleActions.push({
        label: 'Cut tree',
        action: () => startInteraction('cut-tree', p),
      });
    }

    if (c.type === 'water') {
      const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
      if (bucketIdx >= 0) {
        possibleActions.push({
          label: 'Fill bucket',
          action: () => startInteraction('fill-bucket', p),
        });
      }
      // Place raft on water
      if (hasItemType(currentGS.inventory, 'raft')) {
        possibleActions.push({
          label: 'Place raft',
          action: () => startInteraction('place-raft', p),
        });
      }
    }

    if (c.type === 'raft') {
      const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
      if (bucketIdx >= 0) {
        possibleActions.push({
          label: 'Fill bucket',
          action: () => startInteraction('fill-bucket', p),
        });
      }
      // Pick up raft
      possibleActions.push({
        label: 'Pick up raft',
        action: () => startInteraction('pickup-raft', p),
      });
    }

    if (c.type === 'fire') {
      const filledBucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && item.filled);
      if (filledBucketIdx >= 0) {
        possibleActions.push({
          label: 'Extinguish fire',
          action: () => startInteraction('extinguish-fire', p),
        });
      }
    }

    if (c.type === 'friend') {
      possibleActions.push({
        label: 'Rescue friend',
        action: () => startInteraction('rescue-friend', p),
      });
    }

    if (c.type === 'bear' && hasItemType(currentGS.inventory, 'knife')) {
      possibleActions.push({
        label: 'Defeat bear',
        action: () => startInteraction('defeat-bear', p),
      });
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
  }, [showMessage, getInteractTargets, startInteraction, maxInventory]);

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
    const currentGS = gameStateRef.current;

    if (targetCell.type === 'bear') {
      // Bear always blocks movement - must be defeated with interaction (hold E)
      const remaining = loseLife();
      if (remaining > 0) {
        showMessage(`A bear attacks! Hold E near the bear with a knife to defeat it. Lives: ${remaining}`);
      }
      return;
    }

    if (targetCell.type === 'snow') {
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

    if (targetCell.type === 'water') {
      // Check if standing on a raft - if so, move the raft with you
      const currentCell = currentGrid[prev.y][prev.x];
      if (currentCell.type === 'raft') {
        const newGrid = cloneGrid(currentGrid);
        // Move raft from current position to water
        newGrid[prev.y][prev.x] = { type: 'water', config: {} };
        newGrid[ny][nx] = { type: 'raft', config: {} };
        setGrid(newGrid);
        setPlayerPos({ x: nx, y: ny });
        setMoveCount(prev => prev + 1);

        setRevealedTiles(prev => {
          const newRevealed = new Set(prev);
          newRevealed.add(`${nx},${ny}`);
          const adjacent = getAdjacentPositions(nx, ny);
          adjacent.forEach(pos => newRevealed.add(pos.key));
          return newRevealed;
        });
        return;
      } else {
        showMessage("Can't swim! Place a raft on the water.");
        return;
      }
    }

    if (targetCell.type === 'fire') {
      const remaining = loseLife();
      if (remaining > 0) {
        showMessage(`Burned by fire! Lives: ${remaining}`);
      }
      return;
    }

    if (canMoveTo(currentGrid, nx, ny)) {
      // Check if moving from raft to non-water tile - leave raft behind
      const currentCell = currentGrid[prev.y][prev.x];
      if (currentCell.type === 'raft' && targetCell.type !== 'water') {
        // Moving from raft to ground/other - raft stays as raft
        setPlayerPos({ x: nx, y: ny });
      } else {
        setPlayerPos({ x: nx, y: ny });
      }
      setMoveCount(prev => prev + 1);

      setRevealedTiles(prev => {
        const newRevealed = new Set(prev);
        newRevealed.add(`${nx},${ny}`);
        const adjacent = getAdjacentPositions(nx, ny);
        adjacent.forEach(pos => newRevealed.add(pos.key));
        return newRevealed;
      });
    }
  }, [showMessage, loseLife, respawn, cancelInteraction]);

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
        doInteract();
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

      if (key === 'e' && interactionStateRef.current) {
        cancelInteraction();
        showMessage('Interaction cancelled.');
      }

      // Also cancel on number key release if interaction in progress
      if (['1', '2', '3', '4', '5'].includes(key) && interactionStateRef.current) {
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
  }, [onBack, restart, doInteract, doPickup, cancelInteraction, showMessage, dropMenuOpen, inlineMenu]);

  // Check for number key holds when inline menu is active
  useEffect(() => {
    if (gameOver || !inlineMenu) return;
    const interval = setInterval(() => {
      if (interactionStateRef.current) return; // Already in an interaction

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

      // Collect possible actions - MUST MATCH ORDER IN doInteract()
      const possibleActions = [];

      // First check current tile for building raft
      const currentTile = currentGrid[pos.y][pos.x];
      if ((currentTile.type === 'ground' || currentTile.type === 'campfire' || currentTile.type === 'raft') &&
          hasItemType(currentGS.inventory, 'rope') && hasItemType(currentGS.inventory, 'wood')) {
        possibleActions.push(() => startInteraction('build-raft', { x: pos.x, y: pos.y }));
      }

      if (c.type === 'tree' && hasItemType(currentGS.inventory, 'axe')) {
        possibleActions.push(() => startInteraction('cut-tree', p));
      }

      if (c.type === 'water') {
        const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
        if (bucketIdx >= 0) {
          possibleActions.push(() => startInteraction('fill-bucket', p));
        }
        // Place raft on water
        if (hasItemType(currentGS.inventory, 'raft')) {
          possibleActions.push(() => startInteraction('place-raft', p));
        }
      }

      if (c.type === 'raft') {
        const bucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && !item.filled);
        if (bucketIdx >= 0) {
          possibleActions.push(() => startInteraction('fill-bucket', p));
        }
        // Pick up raft
        possibleActions.push(() => startInteraction('pickup-raft', p));
      }

      if (c.type === 'fire') {
        const filledBucketIdx = currentGS.inventory.findIndex(item => item.itemType === 'bucket' && item.filled);
        if (filledBucketIdx >= 0) {
          possibleActions.push(() => startInteraction('extinguish-fire', p));
        }
      }

      if (c.type === 'friend') {
        possibleActions.push(() => startInteraction('rescue-friend', p));
      }

      if (c.type === 'bear' && hasItemType(currentGS.inventory, 'knife')) {
        possibleActions.push(() => startInteraction('defeat-bear', p));
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
  }, [gameOver, inlineMenu, startInteraction]);

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
    // Check for exit tile (forest: 'car', bank: 'exit')
    const exitPos = findTile(level.grid, 'car') || findTile(level.grid, 'exit');
    if (!exitPos || !isSamePos(playerPos, exitPos)) {
      exitMessageShownRef.current = false;
      return;
    }

    const exitCell = level.grid[exitPos.y][exitPos.x];
    const needsKey = exitCell.config?.needsKey !== false;

    if (needsKey && !hasItemType(gameState.inventory, 'key')) {
      if (!exitMessageShownRef.current) {
        exitMessageShownRef.current = true;
        showMessage('You need a Key to escape!');
      }
      return;
    }

    const gs = { ...gameState, reachedExit: true };
    const { allComplete } = checkAllMissions(level.missions || [], gs, level.fixedOrder, grid);
    if (allComplete) {
      setGameState(prev => ({ ...prev, reachedExit: true }));
      setGameOver('win');
      showMessage('YOU ESCAPED!', 999999);
    } else if (!exitMessageShownRef.current) {
      exitMessageShownRef.current = true;
      showMessage('Complete all missions first!');
    }
  }, [playerPos, gameOver, level, showMessage, grid, gameState]);

  // Removed viewport bounds for open-world feel
  const viewportBounds = null;

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
              {gameState.inventory.slice(0, 5).map((item, i) => {
                const ITEM_TYPES = theme?.getItemTypes() || {};
                const def = ITEM_TYPES[item.itemType];
                const isWood = item.itemType === 'wood';
                const isBucket = item.itemType === 'bucket';
                let emoji = def?.emoji || '';

                return (
                  <div key={i} style={{
                    background: 'rgba(60, 45, 30, 0.6)',
                    padding: '6px',
                    borderRadius: 6,
                    fontSize: 16,
                    border: '1px solid rgba(200, 150, 100, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isWood ? <WoodIcon size={20} /> : isBucket ? <BucketIcon size={20} filled={item.filled} /> : emoji}
                  </div>
                );
              })}
              {gameState.inventory.length > 5 && (
                <div style={{ fontSize: 11, color: '#ccbb99', fontWeight: 'bold' }}>
                  +{gameState.inventory.length - 5}
                </div>
              )}
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
            {(level.missions || []).map((m, i) => {
              const complete = isMissionDone(m, gameState, grid);
              const isCurrent = level.fixedOrder && !complete && (level.missions || []).slice(0, i).every(prev => isMissionDone(prev, gameState, grid));
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
                {gameState.inventory.map((item, idx) => {
                  const ITEM_TYPES = theme?.getItemTypes() || {};
                  const itemDef = ITEM_TYPES[item.itemType];
                  const label = itemDef?.label || item.itemType;
                  const isWood = item.itemType === 'wood';
                  const isBucket = item.itemType === 'bucket';
                  let emoji = itemDef?.emoji || '';
                  // Show bucket status clearly
                  const statusText = isBucket ? (item.filled ? ' (Full)' : ' (Empty)') : '';
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
                      {isWood ? <WoodIcon size={24} /> : isBucket ? <BucketIcon size={24} filled={item.filled} /> : <span style={{ fontSize: 18 }}>{emoji}</span>}
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                        <span>{label}</span>
                        {isBucket && (
                          <span style={{
                            fontSize: 11,
                            color: item.filled ? '#88ccff' : '#ffaa66',
                            fontWeight: 'bold',
                          }}>
                            {item.filled ? 'Full' : 'Empty'}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
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

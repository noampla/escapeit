import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'maps';

/**
 * Recursively remove undefined values from an object (Firebase doesn't accept undefined)
 * Also removes null values for hiddenObject to keep data clean
 */
function cleanForFirebase(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirebase);
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip undefined values entirely
      if (value === undefined) continue;
      // For hiddenObject specifically, skip if null (don't store empty hiddenObject)
      if (key === 'hiddenObject' && value === null) continue;
      cleaned[key] = cleanForFirebase(value);
    }
    return cleaned;
  }
  return obj;
}

// Firestore doesn't allow nested arrays. Flatten grid (2D) to 1D on save, restore on load.
function flattenLevel(level) {
  const { grid, ...rest } = level;
  // Clean the data to remove undefined values before saving
  const cleanedGrid = cleanForFirebase(grid.flat());
  const cleanedRest = cleanForFirebase(rest);
  // Store grid dimensions for proper restoration
  return { ...cleanedRest, grid: cleanedGrid, gridCols: grid[0].length, gridRows: grid.length };
}

/**
 * Migrate old single-layer grid to new two-layer format
 * @param {Array} oldGrid - Old format grid
 * @param {string} themeId - Theme ID for layer assignment
 * @returns {Array} New format grid
 */
function migrateGridToTwoLayer(oldGrid, themeId = 'forest') {
  // Check if already migrated (has floor property)
  if (oldGrid.length > 0 && oldGrid[0].length > 0 && oldGrid[0][0].floor !== undefined) {
    return oldGrid; // Already in new format
  }

  // Default floor type based on theme
  const getDefaultFloor = (themeId) => {
    if (themeId === 'forest') {
      return { type: 'ground', config: {} };
    } else if (themeId === 'bank-robbery' || themeId === 'mad-science-lab') {
      return { type: 'floor', config: {} };
    }
    return { type: 'ground', config: {} };
  };

  // Determine layer based on tile type (simple heuristic)
  const isObjectTile = (tileType) => {
    // Items, doors, hazards, entities are objects
    if (tileType.startsWith('item-')) return true;
    if (tileType.startsWith('door-')) return true;
    if (['fire', 'bear', 'friend', 'raft', 'camera', 'laser', 'guard', 'vault-door', 'vault-door-open'].includes(tileType)) return true;
    return false;
  };

  return oldGrid.map(row => row.map(oldCell => {
    const tileType = oldCell.type;
    const isObject = isObjectTile(tileType);

    if (isObject) {
      // Object on default floor
      return {
        floor: getDefaultFloor(themeId),
        object: { type: tileType, config: { ...oldCell.config } }
      };
    } else {
      // Floor tile (including empty, walls, ground, start, exit, etc.)
      return {
        floor: { type: tileType, config: { ...oldCell.config } },
        object: null
      };
    }
  }));
}

function restoreLevel(data) {
  const { grid, gridCols, gridRows, themeId, ...rest } = data;
  // Use stored dimensions, fallback to legacy 20x15 for old saved levels
  const cols = gridCols || 20;
  const restored = [];
  for (let row = 0; row < grid.length / cols; row++) {
    restored.push(grid.slice(row * cols, (row + 1) * cols));
  }

  // Migrate to two-layer format if needed
  const migratedGrid = migrateGridToTwoLayer(restored, themeId || 'forest');

  return { ...rest, themeId, grid: migratedGrid };
}

export async function saveLevels(levels) {
  const snapshot = await getDocs(collection(db, COLLECTION));
  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, COLLECTION, d.id));
  }
  for (const level of levels) {
    await setDoc(doc(db, COLLECTION, level.id), flattenLevel(level));
  }
}

// In-memory cache to avoid re-downloading all grids on every mount
let _levelsCache = null;
let _levelsCacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

// Server URL — same pattern as aiMapService.js
const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function loadLevels(forceRefresh = false) {
  if (!forceRefresh && _levelsCache && (Date.now() - _levelsCacheTime < CACHE_TTL)) {
    console.log('loadLevels: returning cached', _levelsCache.length, 'levels');
    return _levelsCache;
  }

  console.log('loadLevels: fetching from API (metadata only)...');
  const res = await fetch(`${BASE_URL}/api/levels`);
  if (!res.ok) throw new Error(`Failed to load levels: ${res.status}`);
  const levels = await res.json();
  console.log('loadLevels: got', levels.length, 'levels:', levels.map(l => `${l.id}: ${l.name} (${l.themeId})`));

  _levelsCache = levels;
  _levelsCacheTime = Date.now();
  return levels;
}

export function invalidateLevelsCache() {
  _levelsCache = null;
  _levelsCacheTime = 0;
}

export async function saveLevel(level) {
  await setDoc(doc(db, COLLECTION, level.id), flattenLevel(level));
  invalidateLevelsCache();
}

export async function deleteLevel(id) {
  await deleteDoc(doc(db, COLLECTION, id));
  invalidateLevelsCache();
}

// Load a single level by ID — fetches full doc (including grid) from the server
export async function loadLevelById(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/levels/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`loadLevelById failed: ${res.status}`);
    const data = await res.json();
    return { ...restoreLevel(data), id: data.id };
  } catch (err) {
    console.error('loadLevelById failed:', err);
    return null;
  }
}

// Load levels created by a specific user
export async function loadLevelsByCreator(creatorId) {
  const q = query(collection(db, COLLECTION), where('creatorId', '==', creatorId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...restoreLevel(d.data()), id: d.id }));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// No-op: migration was for localStorage themeId. Firestore has no legacy data.
export function migrateLevels() {}

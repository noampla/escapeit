import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
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

export async function loadLevels() {
  console.log('loadLevels: fetching from Firebase...');
  const snapshot = await getDocs(collection(db, COLLECTION));
  // Use document ID as the level's id (in case data.id is missing/different)
  const levels = snapshot.docs.map(d => {
    const data = restoreLevel(d.data());
    return { ...data, id: d.id }; // Ensure doc ID is used
  });
  console.log('loadLevels: got', levels.length, 'levels:', levels.map(l => `${l.id}: ${l.name} (${l.themeId})`));

  // Check for duplicate IDs (shouldn't happen with doc IDs)
  const ids = levels.map(l => l.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    console.warn('DUPLICATE IDs FOUND:', duplicates);
  }

  return levels;
}

export async function saveLevel(level) {
  await setDoc(doc(db, COLLECTION, level.id), flattenLevel(level));
}

export async function deleteLevel(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Load a single level by ID (for direct URL access)
export async function loadLevelById(id) {
  const docSnap = await getDoc(doc(db, COLLECTION, id));
  if (!docSnap.exists()) return null;
  return { ...restoreLevel(docSnap.data()), id: docSnap.id };
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

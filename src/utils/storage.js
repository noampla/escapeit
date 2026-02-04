import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GRID_COLS } from './constants';

const COLLECTION = 'maps';

// Firestore doesn't allow nested arrays. Flatten grid (2D) to 1D on save, restore on load.
function flattenLevel(level) {
  const { grid, ...rest } = level;
  return { ...rest, grid: grid.flat() };
}

function restoreLevel(data) {
  const { grid, ...rest } = data;
  const restored = [];
  for (let row = 0; row < grid.length / GRID_COLS; row++) {
    restored.push(grid.slice(row * GRID_COLS, (row + 1) * GRID_COLS));
  }
  return { ...rest, grid: restored };
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
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(d => restoreLevel(d.data()));
}

export async function saveLevel(level) {
  await setDoc(doc(db, COLLECTION, level.id), flattenLevel(level));
}

export async function deleteLevel(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// No-op: migration was for localStorage themeId. Firestore has no legacy data.
export function migrateLevels() {}

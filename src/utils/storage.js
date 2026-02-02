import { STORAGE_KEY } from './constants';

export function saveLevels(levels) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
}

export function loadLevels() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLevel(level) {
  const levels = loadLevels();
  const idx = levels.findIndex(l => l.id === level.id);
  if (idx >= 0) levels[idx] = level;
  else levels.push(level);
  saveLevels(levels);
}

export function deleteLevel(id) {
  const levels = loadLevels().filter(l => l.id !== id);
  saveLevels(levels);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

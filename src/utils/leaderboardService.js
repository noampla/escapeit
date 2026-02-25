// Leaderboard service — reads go through the server API, writes go direct to Firestore
import { db } from './firebase.js';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const LEADERBOARD_COLLECTION = 'leaderboards';
const BASE_URL = import.meta.env.VITE_API_URL || '';

// ── Client-side leaderboard cache with in-flight deduplication ──────────────
// Maps mapId → { data, time }  (data = { topByTime, topBySteps, playerCount })
const lbCache = new Map();
const lbInflight = new Map(); // mapId → Promise (prevents duplicate requests)
const LB_CACHE_TTL = 30_000; // 30 seconds

async function fetchLeaderboard(mapId) {
  const cached = lbCache.get(mapId);
  if (cached && Date.now() - cached.time < LB_CACHE_TTL) return cached.data;

  // Deduplicate: if a request for this mapId is already in-flight, wait for it
  if (lbInflight.has(mapId)) return lbInflight.get(mapId);

  const promise = fetch(`${BASE_URL}/api/leaderboard/${mapId}`)
    .then(res => {
      if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      lbCache.set(mapId, { data, time: Date.now() });
      lbInflight.delete(mapId);
      return data;
    })
    .catch(err => {
      lbInflight.delete(mapId);
      throw err;
    });

  lbInflight.set(mapId, promise);
  return promise;
}

export function invalidateLeaderboardCache(mapId) {
  if (mapId) lbCache.delete(mapId);
  else lbCache.clear();
}

// ── Submit a score (write stays client-side — no server auth needed) ─────────
// Preserves best metrics: keeps min(old, new) for time and steps independently
export async function submitScore(mapId, userId, userName, time, steps) {
  if (!userName) return null; // anonymous users don't appear on leaderboards

  const entryId = `${mapId}_${userId}`;
  const docRef = doc(db, LEADERBOARD_COLLECTION, entryId);

  let bestTime = Math.round(time * 100) / 100;
  let bestSteps = steps;

  try {
    const existingDoc = await getDoc(docRef);
    if (existingDoc.exists()) {
      const existing = existingDoc.data();
      if (existing.time != null && existing.time < bestTime) bestTime = existing.time;
      if (existing.steps != null && existing.steps < bestSteps) bestSteps = existing.steps;
    }
  } catch (err) {
    console.warn('Could not read existing score, saving current:', err);
  }

  const entry = { mapId, userId, userName, time: bestTime, steps: bestSteps, completedAt: serverTimestamp() };
  await setDoc(docRef, entry);

  // Bust the cache so the next leaderboard fetch reflects the new score
  invalidateLeaderboardCache(mapId);

  return entry;
}

// ── Read functions — all go through the server ──────────────────────────────

export async function getTopScoresByTime(mapId, count = 10) {
  const data = await fetchLeaderboard(mapId);
  return data.topByTime.slice(0, count);
}

export async function getTopScoresBySteps(mapId, count = 10) {
  const data = await fetchLeaderboard(mapId);
  return data.topBySteps.slice(0, count);
}

export async function getPlayerCount(mapId) {
  const data = await fetchLeaderboard(mapId);
  return data.playerCount;
}

export async function getUserRanks(mapId, userId) {
  if (!userId) return { timeRank: null, stepsRank: null };
  const res = await fetch(`${BASE_URL}/api/leaderboard/${mapId}/me?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`getUserRanks failed: ${res.status}`);
  return res.json(); // { userScore, timeRank, stepsRank }
}

// ── Format time for display (seconds → MM:SS.ms) ────────────────────────────
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);
  if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  return `${secs}.${ms.toString().padStart(2, '0')}s`;
}

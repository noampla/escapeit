// Leaderboard service for managing puzzle completion scores
import { db } from './firebase.js';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

const LEADERBOARD_COLLECTION = 'leaderboards';

// Submit a score to the leaderboard (only for named users)
export async function submitScore(mapId, userId, userName, time, steps) {
  if (!userName) {
    // Anonymous users don't appear on leaderboards
    return null;
  }

  const entryId = `${mapId}_${userId}`;

  const entry = {
    mapId,
    userId,
    userName,
    time: Math.round(time * 100) / 100, // Round to 2 decimal places
    steps,
    completedAt: serverTimestamp()
  };

  await setDoc(doc(db, LEADERBOARD_COLLECTION, entryId), entry);
  return entry;
}

// Get top scores for a map by time (fastest)
export async function getTopScoresByTime(mapId, count = 10) {
  const q = query(
    collection(db, LEADERBOARD_COLLECTION),
    where('mapId', '==', mapId),
    orderBy('time', 'asc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, index) => ({
    rank: index + 1,
    id: doc.id,
    ...doc.data()
  }));
}

// Get top scores for a map by steps (least moves)
export async function getTopScoresBySteps(mapId, count = 10) {
  const q = query(
    collection(db, LEADERBOARD_COLLECTION),
    where('mapId', '==', mapId),
    orderBy('steps', 'asc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, index) => ({
    rank: index + 1,
    id: doc.id,
    ...doc.data()
  }));
}

// Get a user's score for a specific map
export async function getUserScore(mapId, userId) {
  const entryId = `${mapId}_${userId}`;
  const docRef = doc(db, LEADERBOARD_COLLECTION, entryId);
  const docSnap = await getDocs(query(
    collection(db, LEADERBOARD_COLLECTION),
    where('mapId', '==', mapId),
    where('userId', '==', userId)
  ));

  if (docSnap.empty) {
    return null;
  }

  return { id: docSnap.docs[0].id, ...docSnap.docs[0].data() };
}

// Get user's rank for a specific map (both time and steps)
export async function getUserRanks(mapId, userId) {
  const userScore = await getUserScore(mapId, userId);
  if (!userScore) {
    return { timeRank: null, stepsRank: null };
  }

  // Count how many scores are better (for time)
  const timeQuery = query(
    collection(db, LEADERBOARD_COLLECTION),
    where('mapId', '==', mapId),
    where('time', '<', userScore.time)
  );
  const timeSnapshot = await getDocs(timeQuery);
  const timeRank = timeSnapshot.size + 1;

  // Count how many scores are better (for steps)
  const stepsQuery = query(
    collection(db, LEADERBOARD_COLLECTION),
    where('mapId', '==', mapId),
    where('steps', '<', userScore.steps)
  );
  const stepsSnapshot = await getDocs(stepsQuery);
  const stepsRank = stepsSnapshot.size + 1;

  return { timeRank, stepsRank, userScore };
}

// Format time for display (seconds to MM:SS.ms)
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  return `${secs}.${ms.toString().padStart(2, '0')}s`;
}

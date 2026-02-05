// User service for managing anonymous/named users and transfer codes
import { db } from './firebase.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const LOCAL_STORAGE_KEY = 'escapeit_user_id';

// Generate a unique user ID (similar to level ID generation)
function generateUserId() {
  return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Generate a 6-character transfer code
function generateTransferCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get or create the current user
export async function getOrCreateUser() {
  let userId = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (userId) {
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return { id: userId, ...userDoc.data() };
    }
    // User ID in localStorage but not in Firestore - create it
  } else {
    // Generate new user ID
    userId = generateUserId();
    localStorage.setItem(LOCAL_STORAGE_KEY, userId);
  }

  // Create new user document
  const userData = {
    displayName: null,
    createdAt: serverTimestamp(),
    transferCode: null
  };

  await setDoc(doc(db, USERS_COLLECTION, userId), userData);
  return { id: userId, ...userData };
}

// Get current user ID from localStorage (sync, for quick checks)
export function getCurrentUserId() {
  return localStorage.getItem(LOCAL_STORAGE_KEY);
}

// Get user data by ID
export async function getUserById(userId) {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (userDoc.exists()) {
    return { id: userId, ...userDoc.data() };
  }
  return null;
}

// Check if a display name is available
export async function isNameAvailable(displayName) {
  if (!displayName || displayName.trim().length < 2) {
    return false;
  }

  const normalizedName = displayName.trim().toLowerCase();
  const q = query(
    collection(db, USERS_COLLECTION),
    where('displayNameLower', '==', normalizedName)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

// Claim a display name for the current user
export async function claimDisplayName(displayName) {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('No user session');
  }

  const trimmedName = displayName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    throw new Error('Name must be 2-20 characters');
  }

  // Check availability
  const available = await isNameAvailable(trimmedName);
  if (!available) {
    throw new Error('Name is already taken');
  }

  // Update user document
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    displayName: trimmedName,
    displayNameLower: trimmedName.toLowerCase()
  });

  return { id: userId, displayName: trimmedName };
}

// Generate and save a transfer code for the current user
export async function generateUserTransferCode() {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('No user session');
  }

  // Check if user has a name (required for transfer)
  const user = await getUserById(userId);
  if (!user?.displayName) {
    throw new Error('You need a name before you can get a transfer code');
  }

  // Check if user already has a transfer code
  if (user.transferCode) {
    return user.transferCode;
  }

  // Generate unique transfer code
  let code;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    code = generateTransferCode();
    const q = query(
      collection(db, USERS_COLLECTION),
      where('transferCode', '==', code)
    );
    const snapshot = await getDocs(q);
    isUnique = snapshot.empty;
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique code, please try again');
  }

  // Save the code
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    transferCode: code
  });

  return code;
}

// Use a transfer code to link this browser to an existing user
export async function useTransferCode(code) {
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode.length !== 6) {
    throw new Error('Invalid code format');
  }

  // Find user with this transfer code
  const q = query(
    collection(db, USERS_COLLECTION),
    where('transferCode', '==', normalizedCode)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Invalid transfer code');
  }

  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;

  // Check if trying to transfer to self
  const currentUserId = getCurrentUserId();
  if (currentUserId === userId) {
    throw new Error('This is already your account');
  }

  // Link this browser to the found user
  localStorage.setItem(LOCAL_STORAGE_KEY, userId);

  return { id: userId, ...userDoc.data() };
}

// Get current user's display name (or null if anonymous)
export async function getCurrentUserName() {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const user = await getUserById(userId);
  return user?.displayName || null;
}

// Check if current user is the creator of a map
export function isCurrentUserCreator(map) {
  const userId = getCurrentUserId();
  return userId && map?.creatorId === userId;
}

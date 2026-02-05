// User context for app-wide user state management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getOrCreateUser,
  claimDisplayName,
  generateUserTransferCode,
  useTransferCode,
  getCurrentUserId
} from '../utils/userService.js';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize user on mount
  useEffect(() => {
    async function initUser() {
      try {
        const userData = await getOrCreateUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to initialize user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    initUser();
  }, []);

  // Claim a display name
  const claimName = useCallback(async (name) => {
    try {
      setError(null);
      const updatedUser = await claimDisplayName(name);
      setUser(prev => ({ ...prev, displayName: updatedUser.displayName }));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Get transfer code
  const getTransferCode = useCallback(async () => {
    try {
      setError(null);
      const code = await generateUserTransferCode();
      setUser(prev => ({ ...prev, transferCode: code }));
      return code;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Use transfer code to link account
  const linkWithCode = useCallback(async (code) => {
    try {
      setError(null);
      const linkedUser = await useTransferCode(code);
      setUser(linkedUser);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAnonymous: !user?.displayName,
    displayName: user?.displayName || null,
    userId: user?.id || getCurrentUserId(),
    claimName,
    getTransferCode,
    linkWithCode,
    clearError
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;

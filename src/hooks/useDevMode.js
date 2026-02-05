/**
 * useDevMode - Secret Easter Egg Hook for Developer Panel
 *
 * Activation methods:
 * 1. Ctrl+Shift+D (or Cmd+Shift+D on Mac)
 * 2. Type "devmode" anywhere (Konami-style secret code)
 * 3. Ctrl+Shift+N - Quick add task (opens panel with quick add)
 *
 * The panel is completely hidden from normal users.
 */

import { useState, useEffect, useCallback } from 'react';

// Secret code sequence
const SECRET_CODE = 'devmode';

export default function useDevMode() {
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [typedSequence, setTypedSequence] = useState('');

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl+Shift+D - Toggle dev panel
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      e.stopPropagation();
      setIsDevPanelOpen(prev => !prev);
      return;
    }

    // Ctrl+Shift+N - Quick add (opens panel with quick add ready)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      e.stopPropagation();
      setIsDevPanelOpen(true);
      setShowQuickAdd(true);
      return;
    }

    // Secret code detection (only when not in input/textarea)
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        setTypedSequence(prev => {
          const next = (prev + e.key.toLowerCase()).slice(-SECRET_CODE.length);
          if (next === SECRET_CODE) {
            setIsDevPanelOpen(true);
            return '';
          }
          return next;
        });
      }
    }
  }, []);

  // Clear typed sequence after inactivity
  useEffect(() => {
    if (!typedSequence) return;
    const timer = setTimeout(() => setTypedSequence(''), 2000);
    return () => clearTimeout(timer);
  }, [typedSequence]);

  // Global key listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  return {
    isDevPanelOpen,
    setIsDevPanelOpen,
    showQuickAdd,
    setShowQuickAdd,
    closeDevPanel: () => {
      setIsDevPanelOpen(false);
      setShowQuickAdd(false);
    },
    openDevPanel: () => setIsDevPanelOpen(true),
    toggleDevPanel: () => setIsDevPanelOpen(prev => !prev),
  };
}

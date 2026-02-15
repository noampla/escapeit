import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useLanguage } from './LanguageContext';

const NotificationContext = createContext(null);

// Notification types with their default durations
const NOTIFICATION_TYPES = {
  success: { duration: 2000, icon: '✓' },
  info: { duration: 3000, icon: 'ℹ' },
  warning: { duration: 4000, icon: '⚠' },
  error: { duration: 5000, icon: '✕' },
  danger: { duration: 5000, icon: '💀' },
};

// Default colors (can be overridden by theme)
const DEFAULT_COLORS = {
  success: { bg: 'rgba(76, 175, 80, 0.95)', border: '#4CAF50', text: '#ffffff' },
  info: { bg: 'rgba(33, 150, 243, 0.95)', border: '#2196F3', text: '#ffffff' },
  warning: { bg: 'rgba(255, 152, 0, 0.95)', border: '#FF9800', text: '#ffffff' },
  error: { bg: 'rgba(244, 67, 54, 0.95)', border: '#F44336', text: '#ffffff' },
  danger: { bg: 'rgba(211, 47, 47, 0.95)', border: '#D32F2F', text: '#ffffff' },
};

const MAX_HISTORY = 50;

/**
 * Notification Provider component
 * Provides notification system throughout the app
 */
export function NotificationProvider({ children, themeColors = null }) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const timerRef = useRef(null);
  const idCounterRef = useRef(0);

  // Get colors from theme or use defaults
  const getColors = useCallback((type) => {
    if (themeColors && themeColors[type]) {
      const themeColor = themeColors[type];
      // Handle both object format {bg, text, border} and simple string format
      if (typeof themeColor === 'object') {
        return {
          bg: themeColor.bg || DEFAULT_COLORS[type].bg,
          text: themeColor.text || DEFAULT_COLORS[type].text,
          border: themeColor.border || DEFAULT_COLORS[type].border,
        };
      }
      // Legacy: simple color string
      return {
        bg: `${themeColor}f2`,
        border: themeColor,
        text: '#ffffff',
      };
    }
    return DEFAULT_COLORS[type] || DEFAULT_COLORS.info;
  }, [themeColors]);

  // Clear current notification
  const clearCurrent = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrent(null);
  }, []);

  // Add notification to history
  const addToHistory = useCallback((notification) => {
    setHistory(prev => {
      const updated = [notification, ...prev].slice(0, MAX_HISTORY);
      return updated;
    });
  }, []);

  /**
   * Show a notification using a translation key
   * @param {string} messageKey - Translation key (e.g., 'notifications.escaped')
   * @param {string} type - Notification type (success, info, warning, error, danger)
   * @param {object} params - Parameters for string interpolation
   * @param {number} duration - Optional custom duration in ms
   * @param {boolean} transient - If true, show notification but don't save to history
   */
  const notify = useCallback((messageKey, type = 'info', params = {}, duration = null, transient = false) => {
    const text = t(messageKey, params);
    const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    const colors = getColors(type);
    const id = ++idCounterRef.current;

    const notification = {
      id,
      text,
      type,
      colors,
      icon: typeConfig.icon,
      timestamp: Date.now(),
    };

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set current notification
    setCurrent(notification);

    // Add to history only if not transient
    if (!transient) {
      addToHistory(notification);
    }

    // Auto-dismiss
    const dismissDuration = duration || typeConfig.duration;
    if (dismissDuration < 99999) {
      timerRef.current = setTimeout(() => {
        setCurrent(prev => prev?.id === id ? null : prev);
      }, dismissDuration);
    }

    return id;
  }, [t, getColors, addToHistory]);

  /**
   * Show a notification with raw text (for dynamic/theme messages)
   * @param {string} text - The notification text
   * @param {string} type - Notification type
   * @param {number} duration - Optional custom duration in ms
   * @param {boolean} transient - If true, show notification but don't save to history
   */
  const notifyRaw = useCallback((text, type = 'info', duration = null, transient = false) => {
    const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    const colors = getColors(type);
    const id = ++idCounterRef.current;

    const notification = {
      id,
      text,
      type,
      colors,
      icon: typeConfig.icon,
      timestamp: Date.now(),
    };

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set current notification
    setCurrent(notification);

    // Add to history only if not transient
    if (!transient) {
      addToHistory(notification);
    }

    // Auto-dismiss
    const dismissDuration = duration || typeConfig.duration;
    if (dismissDuration < 99999) {
      timerRef.current = setTimeout(() => {
        setCurrent(prev => prev?.id === id ? null : prev);
      }, dismissDuration);
    }

    return id;
  }, [getColors, addToHistory]);

  /**
   * Get the last N notifications from history
   * @param {number} count - Number of notifications to return
   */
  const getRecentHistory = useCallback((count = 3) => {
    return history.slice(0, count);
  }, [history]);

  /**
   * Get full notification history
   */
  const getFullHistory = useCallback(() => {
    return history;
  }, [history]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * Dismiss a specific notification from history
   * @param {number} id - Notification ID
   */
  const dismissFromHistory = useCallback((id) => {
    setHistory(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    current,
    history,
    notify,
    notifyRaw,
    clearCurrent,
    getRecentHistory,
    getFullHistory,
    clearHistory,
    dismissFromHistory,
    NOTIFICATION_TYPES,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification context
 * Returns null if not within a NotificationProvider (e.g., test mode)
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  // Return null instead of throwing - allows graceful degradation in test mode
  if (!context) {
    return null;
  }
  return context;
}

export default NotificationContext;

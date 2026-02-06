import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationHistoryModal from './NotificationHistoryModal';

/**
 * Notification log showing last 3 notifications in top-right corner
 */
export default function NotificationLog() {
  const { t, isRTL } = useLanguage();
  const { getRecentHistory, history, dismissFromHistory } = useNotification();
  const [showModal, setShowModal] = useState(false);

  const recentNotifications = getRecentHistory(3);

  if (recentNotifications.length === 0 && history.length === 0) {
    return null;
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 70,
          right: isRTL ? 'auto' : 16,
          left: isRTL ? 16 : 'auto',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 280,
          pointerEvents: 'auto',
        }}
      >
        {/* Recent notifications */}
        {recentNotifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{
              background: `linear-gradient(145deg, ${notification.colors.bg.replace('0.95', '0.85')} 0%, ${notification.colors.bg.replace('0.95', '0.75')} 100%)`,
              padding: '8px 12px',
              borderRadius: 8,
              color: notification.colors.text,
              fontSize: 12,
              boxShadow: `0 2px 10px rgba(0, 0, 0, 0.3), 0 0 0 1px ${notification.colors.border}40`,
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              direction: isRTL ? 'rtl' : 'ltr',
              cursor: 'pointer',
              opacity: 1 - (index * 0.15),
              transition: 'all 0.2s ease',
            }}
            onClick={() => dismissFromHistory(notification.id)}
            title={formatTime(notification.timestamp)}
          >
            <span style={{ fontSize: 12, opacity: 0.8 }}>{notification.icon}</span>
            <span style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {notification.text}
            </span>
          </div>
        ))}

        {/* Expand button */}
        {history.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'rgba(40, 40, 40, 0.9)',
              border: '1px solid rgba(100, 100, 100, 0.3)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#aaa',
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(60, 60, 60, 0.95)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(40, 40, 40, 0.9)';
              e.currentTarget.style.color = '#aaa';
            }}
          >
            <span>▼</span>
            <span>{t('notificationLog.expand')} ({history.length})</span>
          </button>
        )}
      </div>

      {/* History Modal */}
      {showModal && (
        <NotificationHistoryModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

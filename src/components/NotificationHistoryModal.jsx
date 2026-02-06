import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Full notification history modal
 */
export default function NotificationHistoryModal({ onClose }) {
  const { t, isRTL } = useLanguage();
  const { getFullHistory, clearHistory, dismissFromHistory } = useNotification();

  const history = getFullHistory();

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
          borderRadius: 16,
          padding: 24,
          minWidth: 360,
          maxWidth: 480,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(100, 100, 100, 0.2)',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(100, 100, 100, 0.3)',
        }}>
          <h2 style={{
            color: '#ffffff',
            margin: 0,
            fontSize: 18,
            fontWeight: '700',
          }}>
            {t('notificationLog.expand').replace(/\s*\(\d+\)/, '')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Notification list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {history.length === 0 ? (
            <div style={{
              color: '#666',
              textAlign: 'center',
              padding: 40,
              fontSize: 14,
            }}>
              {t('notificationLog.noHistory')}
            </div>
          ) : (
            history.map((notification) => (
              <div
                key={notification.id}
                style={{
                  background: `linear-gradient(145deg, ${notification.colors.bg.replace('0.95', '0.6')} 0%, ${notification.colors.bg.replace('0.95', '0.4')} 100%)`,
                  padding: '10px 14px',
                  borderRadius: 10,
                  color: notification.colors.text,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  border: `1px solid ${notification.colors.border}40`,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onClick={() => dismissFromHistory(notification.id)}
              >
                <span style={{ fontSize: 14, opacity: 0.9, flexShrink: 0 }}>
                  {notification.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 4 }}>{notification.text}</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid rgba(100, 100, 100, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <button
              onClick={clearHistory}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'rgba(80, 40, 40, 0.6)',
                border: '1px solid rgba(200, 100, 100, 0.3)',
                borderRadius: 8,
                color: '#ffaaaa',
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(100, 50, 50, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(80, 40, 40, 0.6)'}
            >
              {t('notificationLog.clearAll')}
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: 'rgba(40, 40, 40, 0.6)',
                border: '1px solid rgba(100, 100, 100, 0.3)',
                borderRadius: 8,
                color: '#cccccc',
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(60, 60, 60, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(40, 40, 40, 0.6)'}
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Unified notification panel - sidebar with current notification, log, and modal
 * Displays on the left side of the game screen
 */
export default function NotificationPanel({ collapsed = false }) {
  const { t, isRTL } = useLanguage();
  const notificationCtx = useNotification();
  const [showModal, setShowModal] = useState(false);

  // Handle case when notification context is not available
  if (!notificationCtx) return null;

  const { current, history, getRecentHistory, dismissFromHistory, clearHistory, clearCurrent } = notificationCtx;
  // Show all available history instead of limiting to 5
  const recentNotifications = history;

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (collapsed) {
    // Collapsed mode: just show indicator if there are notifications
    if (history.length === 0) return null;
    return (
      <div
        style={{
          width: 40,
          background: 'rgba(20, 25, 30, 0.9)',
          borderRight: '1px solid rgba(100, 100, 100, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: current?.colors?.bg || 'rgba(50, 50, 50, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            cursor: 'pointer',
          }}
          title={t('notificationLog.expand')}
        >
          {current?.icon || `${history.length}`}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          width: 220,
          background: 'linear-gradient(180deg, rgba(20, 25, 30, 0.95) 0%, rgba(15, 20, 25, 0.95) 100%)',
          borderRight: '1px solid rgba(100, 100, 100, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid rgba(100, 100, 100, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            color: '#aabbcc',
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1,
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {t('notificationLog.expand').replace(/\s*\(\d+\)/, '')}
          </span>
          {history.length > 0 && (
            <span style={{
              background: 'rgba(100, 150, 200, 0.3)',
              color: '#aaddff',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 8,
              fontWeight: '600',
            }}>
              {history.length}
            </span>
          )}
        </div>

        {/* Current Notification (highlighted) */}
        {current && (
          <div
            style={{
              margin: '10px',
              padding: '12px',
              background: `linear-gradient(145deg, ${current.colors.bg} 0%, ${current.colors.bg.replace('0.95', '0.85')} 100%)`,
              borderRadius: 10,
              border: `2px solid ${current.colors.border}`,
              boxShadow: `0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px ${current.colors.border}40`,
              cursor: 'pointer',
              animation: 'pulseGlow 1.5s ease-in-out infinite',
            }}
            onClick={clearCurrent}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              <span style={{
                fontSize: 18,
                flexShrink: 0,
              }}>
                {current.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: current.colors.text,
                  fontSize: 13,
                  fontWeight: '600',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}>
                  {current.text}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Notifications Log */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {recentNotifications.length === 0 && !current ? (
            <div style={{
              color: '#555',
              fontSize: 11,
              textAlign: 'center',
              padding: '20px 10px',
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              {t('notificationLog.noHistory')}
            </div>
          ) : (
            recentNotifications
              .filter(n => n.id !== current?.id) // Don't show current in log
              .map((notification, index) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '8px 10px',
                    background: `linear-gradient(145deg, ${notification.colors.bg.replace('0.95', '0.4')} 0%, ${notification.colors.bg.replace('0.95', '0.25')} 100%)`,
                    borderRadius: 8,
                    border: `1px solid ${notification.colors.border}30`,
                    cursor: 'pointer',
                    opacity: Math.max(0.6, 1 - (index * 0.05)),
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => dismissFromHistory(notification.id)}
                  title={formatTime(notification.timestamp)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}>
                    <span style={{
                      fontSize: 12,
                      opacity: 0.8,
                      flexShrink: 0,
                    }}>
                      {notification.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: notification.colors.text,
                        fontSize: 11,
                        lineHeight: 1.3,
                        opacity: 0.9,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {notification.text}
                      </div>
                      <div style={{
                        fontSize: 9,
                        color: '#888',
                        marginTop: 4,
                      }}>
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer Actions */}
        {history.length > 0 && (
          <div style={{
            padding: '10px',
            borderTop: '1px solid rgba(100, 100, 100, 0.2)',
            display: 'flex',
            gap: 8,
          }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: 'rgba(50, 60, 70, 0.6)',
                border: '1px solid rgba(100, 150, 200, 0.3)',
                borderRadius: 6,
                color: '#aaddff',
                fontSize: 10,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(60, 80, 100, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(50, 60, 70, 0.6)'}
            >
              {t('notificationLog.expand')} ({history.length})
            </button>
            <button
              onClick={clearHistory}
              style={{
                padding: '8px 10px',
                background: 'rgba(70, 40, 40, 0.6)',
                border: '1px solid rgba(200, 100, 100, 0.3)',
                borderRadius: 6,
                color: '#ffaaaa',
                fontSize: 10,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(90, 50, 50, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(70, 40, 40, 0.6)'}
              title={t('notificationLog.clearAll')}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Full History Modal */}
      {showModal && (
        <NotificationHistoryModal
          history={history}
          dismissFromHistory={dismissFromHistory}
          clearHistory={clearHistory}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px ${current?.colors?.border || '#666'}40; }
          50% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px ${current?.colors?.border || '#666'}60; }
        }
      `}</style>
    </>
  );
}

/**
 * Full notification history modal (inline component)
 */
function NotificationHistoryModal({ history, dismissFromHistory, clearHistory, onClose }) {
  const { t, isRTL } = useLanguage();

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, rgba(30, 35, 40, 0.98) 0%, rgba(20, 25, 30, 0.98) 100%)',
          borderRadius: 16,
          padding: 24,
          minWidth: 380,
          maxWidth: 500,
          maxHeight: '75vh',
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
                  background: `linear-gradient(145deg, ${notification.colors.bg.replace('0.95', '0.5')} 0%, ${notification.colors.bg.replace('0.95', '0.35')} 100%)`,
                  padding: '12px 14px',
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
                <span style={{ fontSize: 16, opacity: 0.9, flexShrink: 0 }}>
                  {notification.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 4, lineHeight: 1.4 }}>{notification.text}</div>
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
              onClick={() => { clearHistory(); onClose(); }}
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
                background: 'rgba(40, 50, 60, 0.6)',
                border: '1px solid rgba(100, 100, 100, 0.3)',
                borderRadius: 8,
                color: '#cccccc',
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(60, 70, 80, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(40, 50, 60, 0.6)'}
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

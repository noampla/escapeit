import { useState, useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function MobileNotificationOverlay() {
  const { t, isRTL } = useLanguage();
  const notificationCtx = useNotification();
  const [showHistory, setShowHistory] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const prevCurrentRef = useRef(null);

  if (!notificationCtx) return null;
  const { current, history, dismissFromHistory, clearHistory, clearCurrent } = notificationCtx;

  // Animate toast in/out when current notification changes
  useEffect(() => {
    if (current && current !== prevCurrentRef.current) {
      setToastVisible(true);
      prevCurrentRef.current = current;
    } else if (!current) {
      setToastVisible(false);
      prevCurrentRef.current = null;
    }
  }, [current]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Toast notification */}
      {current && toastVisible && (
        <div
          onClick={clearCurrent}
          style={{
            position: 'absolute',
            top: 'calc(52px + env(safe-area-inset-top, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 450,
            pointerEvents: 'auto',
            maxWidth: 'calc(100vw - 120px)',
            background: `linear-gradient(145deg, ${current.colors.bg}, ${current.colors.bg.replace('0.95', '0.85')})`,
            borderRadius: 10,
            padding: '8px 14px',
            border: `1px solid ${current.colors.border}`,
            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.5)`,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            direction: isRTL ? 'rtl' : 'ltr',
            opacity: 0.92,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>{current.icon}</span>
          <span style={{
            color: current.colors.text,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.3,
          }}>
            {current.text}
          </span>
        </div>
      )}

      {/* History button (top-right) */}
      <div
        onClick={() => setShowHistory(true)}
        style={{
          position: 'absolute',
          top: 'calc(8px + env(safe-area-inset-top, 0px))',
          right: 'calc(50px + env(safe-area-inset-right, 0px))',
          zIndex: 450,
          pointerEvents: 'auto',
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <span style={{ fontSize: 14 }}>📜</span>
        {history.length > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#4488ff',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            width: 16,
            height: 16,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {history.length > 9 ? '9+' : history.length}
          </span>
        )}
      </div>

      {/* History overlay */}
      {showHistory && (
        <div
          onClick={() => setShowHistory(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 600,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              margin: 'calc(40px + env(safe-area-inset-top, 0px)) calc(12px + env(safe-area-inset-right, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)) calc(12px + env(safe-area-inset-left, 0px))',
              background: 'rgba(20, 25, 30, 0.92)',
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid rgba(100, 100, 100, 0.3)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(100, 100, 100, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                color: '#aabbcc',
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
                Message History
              </span>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: 22,
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              {history.length === 0 ? (
                <div style={{
                  color: '#666',
                  textAlign: 'center',
                  padding: 40,
                  fontSize: 13,
                }}>
                  No messages yet
                </div>
              ) : (
                history.map((notification) => (
                  <div
                    key={notification.id}
                    style={{
                      background: `linear-gradient(145deg, ${notification.colors.bg.replace('0.95', '0.5')}, ${notification.colors.bg.replace('0.95', '0.35')})`,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${notification.colors.border}30`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      direction: isRTL ? 'rtl' : 'ltr',
                    }}
                  >
                    <span style={{ fontSize: 14, opacity: 0.9, flexShrink: 0 }}>
                      {notification.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: notification.colors.text,
                        fontSize: 12,
                        lineHeight: 1.3,
                      }}>
                        {notification.text}
                      </div>
                      <div style={{ fontSize: 9, color: '#888', marginTop: 3 }}>
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
                padding: '10px 12px',
                borderTop: '1px solid rgba(100, 100, 100, 0.3)',
                display: 'flex',
                gap: 8,
              }}>
                <button
                  onClick={() => { clearHistory(); setShowHistory(false); }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(80, 40, 40, 0.6)',
                    border: '1px solid rgba(200, 100, 100, 0.3)',
                    borderRadius: 8,
                    color: '#ffaaaa',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(40, 50, 60, 0.6)',
                    border: '1px solid rgba(100, 100, 100, 0.3)',
                    borderRadius: 8,
                    color: '#ccc',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

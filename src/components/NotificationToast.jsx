import { useLanguage } from '../contexts/LanguageContext';

/**
 * Single notification toast display
 */
export default function NotificationToast({ notification, onDismiss }) {
  const { isRTL } = useLanguage();

  if (!notification) return null;

  const { text, colors, icon, type } = notification;

  return (
    <div
      style={{
        background: `linear-gradient(145deg, ${colors.bg} 0%, ${colors.bg.replace('0.95', '0.85')} 100%)`,
        padding: '12px 20px',
        borderRadius: 12,
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 2px ${colors.border}60`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        direction: isRTL ? 'rtl' : 'ltr',
        cursor: onDismiss ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onDismiss}
    >
      <span style={{
        fontSize: 16,
        opacity: 0.9,
      }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{text}</span>
    </div>
  );
}

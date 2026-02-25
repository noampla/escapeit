import { AVAILABLE_THEMES } from '../utils/themeRegistry';
import { useLanguage } from '../contexts/LanguageContext';

export default function ThemeSelect({ onSelectTheme, onBack }) {
  const { t, isRTL, getLocalizedThemeName, getLocalizedThemeDescription } = useLanguage();
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
      color: '#ffffff',
      padding: '40px',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <img
          src="/images/escapeit-logo.png"
          alt="Escape It"
          style={{
            width: '72px',
            height: '72px',
            marginBottom: '12px',
            filter: 'drop-shadow(0 2px 12px rgba(255, 255, 255, 0.15))',
          }}
        />
        <h2 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          margin: 0,
          marginBottom: '10px',
          color: '#ffffff',
          direction: isRTL ? 'rtl' : 'ltr'
        }}>
          {t('themeSelect.title')}
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#999',
          direction: isRTL ? 'rtl' : 'ltr'
        }}>
          {t('themeSelect.subtitle')}
        </p>
      </div>

      {/* Theme Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        width: '100%',
        marginBottom: '40px'
      }}>
        {AVAILABLE_THEMES.map(theme => (
          <div
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {/* Theme emoji/icon */}
            <div style={{
              fontSize: '64px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              {theme.emoji || '🎯'}
            </div>

            {/* Theme info */}
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              textAlign: 'center',
              color: '#ffffff',
              direction: isRTL ? 'rtl' : 'ltr'
            }}>
              {getLocalizedThemeName(theme.id, theme.name)}
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#aaa',
              textAlign: 'center',
              marginBottom: '16px',
              minHeight: '40px',
              direction: isRTL ? 'rtl' : 'ltr'
            }}>
              {getLocalizedThemeDescription(theme.id, theme.description)}
            </p>

            {/* Meta info */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '12px',
              color: '#888'
            }}>
              <span>⭐ {theme.difficulty}</span>
              {theme.author && <span>👤 {theme.author}</span>}
            </div>

            {/* Select button */}
            <button
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4488cc 0%, #3366aa 100%)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #5599dd 0%, #4477bb 100%)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #4488cc 0%, #3366aa 100%)';
              }}
            >
              {t('themeSelect.createWith')}
            </button>
          </div>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          background: 'transparent',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        {isRTL ? `${t('themeSelect.backToMenu')} →` : `← ${t('themeSelect.backToMenu')}`}
      </button>
    </div>
  );
}

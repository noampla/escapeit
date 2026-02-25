import { AVAILABLE_THEMES } from '../utils/themeRegistry';
import { useLanguage } from '../contexts/LanguageContext';

export default function MainMenu({ onCreateNew, onPlayLevels }) {
  const { t, isRTL, language, setLanguage, getLocalizedThemeName } = useLanguage();
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #0f1b2e 0%, #0a1220 40%, #060d17 100%)',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Language toggle - top right */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: '600',
          border: 'none',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
        title={t('settings.language')}
      >
        {language === 'en' ? '🇺🇸 English' : '🇮🇱 עברית'}
      </button>

      {/* Animated background glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 40%, rgba(232, 138, 46, 0.12) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(74, 164, 74, 0.08) 0%, transparent 50%)',
        animation: 'ambientPulse 4s ease-in-out infinite',
      }}></div>

      {/* Floating particles — above everything, not clipped by logo */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? '3px' : '2px',
            height: i % 3 === 0 ? '3px' : '2px',
            borderRadius: '50%',
            background: i % 2 === 0
              ? 'rgba(232, 168, 76, 0.6)'
              : 'rgba(100, 180, 100, 0.5)',
            left: `${5 + (i * 4.7) % 90}%`,
            bottom: '-5%',
            animation: `floatUp ${6 + (i % 5) * 2}s linear infinite`,
            animationDelay: `${(i * 0.7) % 8}s`,
            boxShadow: i % 2 === 0
              ? '0 0 6px rgba(232, 168, 76, 0.4)'
              : '0 0 6px rgba(100, 180, 100, 0.3)',
          }} />
        ))}
      </div>

      {/* Logo */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        marginBottom: '40px',
      }}>
        <img
          src="/images/escapeit-entry.png"
          alt="Escape It — Build. Play. Escape."
          style={{
            maxWidth: '480px',
            width: '85vw',
            height: 'auto',
            clipPath: 'inset(0 0 2px 0)',
          }}
        />
      </div>

      {/* Menu buttons */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minWidth: '300px'
      }}>
        <button
          onClick={onCreateNew}
          style={{
            padding: '18px 36px',
            fontSize: '18px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #e08830 0%, #c47020 100%)',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(224, 136, 48, 0.35), inset 0 -2px 10px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(224, 136, 48, 0.55), inset 0 -2px 10px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(224, 136, 48, 0.35), inset 0 -2px 10px rgba(0, 0, 0, 0.2)';
          }}
        >
          <span style={{ fontSize: '24px' }}>🎨</span>
          {t('mainMenu.createNew')}
        </button>

        <button
          onClick={onPlayLevels}
          style={{
            padding: '18px 36px',
            fontSize: '18px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3d8c3d 0%, #2d7a2d 100%)',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(61, 140, 61, 0.35), inset 0 -2px 10px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(61, 140, 61, 0.55), inset 0 -2px 10px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(61, 140, 61, 0.35), inset 0 -2px 10px rgba(0, 0, 0, 0.2)';
          }}
        >
          <span style={{ fontSize: '24px' }}>🎮</span>
          {t('mainMenu.playRooms')}
        </button>
      </div>

      {/* Theme showcase */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginTop: '40px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          direction: isRTL ? 'rtl' : 'ltr'
        }}>
          {t('themeSelect.availableThemes')}
        </p>
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {AVAILABLE_THEMES.map((theme, i) => (
            <span
              key={theme.id}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '20px',
                fontSize: '14px',
                color: '#aaa',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                animation: `themeFadeIn 0.6s ease-out ${0.1 * i}s both`,
              }}
            >
              {theme.emoji} {getLocalizedThemeName(theme.id, theme.name)}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% {
            transform: translateY(-110vh) translateX(30px);
            opacity: 0;
          }
        }

        @keyframes themeFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

      `}</style>
    </div>
  );
}

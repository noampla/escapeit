import { AVAILABLE_THEMES } from '../utils/themeRegistry';

export default function MainMenu({ onCreateNew, onPlayLevels }) {
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
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        background: 'radial-gradient(circle at 20% 50%, rgba(68, 170, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(68, 136, 204, 0.3) 0%, transparent 50%)',
        animation: 'pulse 4s ease-in-out infinite',
      }}></div>

      {/* Logo */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        marginBottom: '60px'
      }}>
        <h1 style={{
          fontSize: '72px',
          fontWeight: 'bold',
          margin: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #cccccc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 4px 20px rgba(255, 255, 255, 0.3)',
          letterSpacing: '4px'
        }}>
          ESCAPE IT
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#999',
          marginTop: '10px',
          letterSpacing: '2px'
        }}>
          Create & Play Custom Escape Rooms
        </p>
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
            background: 'linear-gradient(135deg, #4488cc 0%, #3366aa 100%)',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(68, 136, 204, 0.4), inset 0 -2px 10px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(68, 136, 204, 0.5), inset 0 -2px 10px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(68, 136, 204, 0.4), inset 0 -2px 10px rgba(0, 0, 0, 0.2)';
          }}
        >
          <span style={{ fontSize: '24px' }}>🎨</span>
          Create New Escape Room
        </button>

        <button
          onClick={onPlayLevels}
          style={{
            padding: '18px 36px',
            fontSize: '18px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #44aa44 0%, #338833 100%)',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(68, 170, 68, 0.4), inset 0 -2px 10px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(68, 170, 68, 0.5), inset 0 -2px 10px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(68, 170, 68, 0.4), inset 0 -2px 10px rgba(0, 0, 0, 0.2)';
          }}
        >
          <span style={{ fontSize: '24px' }}>🎮</span>
          Play Escape Rooms
        </button>
      </div>

      {/* Theme showcase */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginTop: '60px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Available Themes
        </p>
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {AVAILABLE_THEMES.map(theme => (
            <span
              key={theme.id}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: '14px',
                color: '#aaa',
                backdropFilter: 'blur(10px)'
              }}
            >
              {theme.emoji} {theme.name}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

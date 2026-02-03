import { useState, useEffect } from 'react';
import { loadLevels, deleteLevel } from '../utils/storage';

export default function LevelSelect({ onSelect, onEdit, onBack }) {
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    setLevels(loadLevels());
  }, []);

  const handleDelete = (id, name) => {
    if (confirm(`Delete level "${name}"?`)) {
      deleteLevel(id);
      setLevels(loadLevels());
    }
  };

  const btnStyle = {
    padding: '10px 20px',
    background: 'linear-gradient(145deg, #2a5a2a 0%, #1a4a1a 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#c8e6c8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(68, 170, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  return (
    <div style={{
      padding: '60px 50px',
      maxWidth: 900,
      margin: '0 auto',
      background: 'linear-gradient(135deg, #0a1f0a 0%, #071507 25%, #0a1a0a 50%, #050f05 100%)',
      minHeight: '100vh',
      position: 'relative',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(68, 170, 68, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(68, 170, 68, 0.02) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />
      <button
        onClick={onBack}
        style={{ ...btnStyle, marginBottom: 40, zIndex: 10, position: 'relative' }}
        onMouseEnter={(e) => {
          e.target.style.background = 'linear-gradient(145deg, #3a7a3a 0%, #2a5a2a 100%)';
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'linear-gradient(145deg, #2a5a2a 0%, #1a4a1a 100%)';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        ← Back to Menu
      </button>
      <h2 style={{
        color: '#a8f0a8',
        marginBottom: 40,
        fontSize: 42,
        fontWeight: '900',
        textShadow: `
          0 0 30px rgba(136, 221, 136, 0.6),
          0 0 60px rgba(136, 221, 136, 0.3),
          0 4px 16px rgba(0, 0, 0, 0.8)
        `,
        letterSpacing: 3,
        textTransform: 'uppercase',
        zIndex: 10,
        position: 'relative',
      }}>
        🌲 Select a Forest
      </h2>
      {levels.length === 0 ? (
        <p style={{
          color: '#a8f0a8',
          fontSize: 18,
          padding: '40px',
          background: 'linear-gradient(145deg, rgba(30, 45, 30, 0.7) 0%, rgba(20, 35, 20, 0.7) 100%)',
          borderRadius: 16,
          border: 'none',
          textAlign: 'center',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(68, 170, 68, 0.2)',
          backdropFilter: 'blur(10px)',
          fontWeight: '600',
          zIndex: 10,
          position: 'relative',
        }}>
          No saved forests yet. Build one first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, zIndex: 10, position: 'relative' }}>
          {levels.map(level => (
            <div key={level.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              background: 'linear-gradient(145deg, rgba(30, 55, 30, 0.8) 0%, rgba(20, 40, 20, 0.8) 100%)',
              borderRadius: 14,
              border: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(68, 170, 68, 0.2)',
              backdropFilter: 'blur(10px)',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(68, 170, 68, 0.3), 0 0 0 2px rgba(68, 170, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(68, 170, 68, 0.2)';
              }}
            >
              <div>
                <div style={{
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: '700',
                  marginBottom: 6,
                }}>
                  {level.name}
                </div>
                <div style={{
                  color: '#a8e8a8',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  fontWeight: '500',
                }}>
                  {level.missions?.length || 0} missions • {level.lives || 3} lives • {new Date(level.updatedAt || level.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onSelect(level)} style={{ ...btnStyle, background: 'linear-gradient(145deg, #2a5a4a 0%, #1a4a3a 100%)' }}>▶ Play</button>
                {onEdit && <button onClick={() => onEdit(level)} style={{ ...btnStyle, background: 'linear-gradient(145deg, #4a5a2a 0%, #3a4a1a 100%)' }}>✏ Edit</button>}
                <button onClick={() => handleDelete(level.id, level.name)} style={{ ...btnStyle, background: 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

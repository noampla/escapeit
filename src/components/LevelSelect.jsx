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
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 100%)',
    border: '2px solid #446644',
    borderRadius: 6,
    color: '#ddd',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
  };

  return (
    <div style={{
      padding: 50,
      maxWidth: 700,
      margin: '0 auto',
      background: 'radial-gradient(ellipse at center, #0f2a0f 0%, #0a1a0a 60%, #050f05 100%)',
      minHeight: '100vh',
    }}>
      <button
        onClick={onBack}
        style={{ ...btnStyle, marginBottom: 30 }}
        onMouseEnter={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #3a5a3a 0%, #2a4a2a 100%)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 100%)';
        }}
      >
        ← Back to Menu
      </button>
      <h2 style={{
        color: '#88dd88',
        marginBottom: 30,
        fontSize: 32,
        fontWeight: '900',
        textShadow: '0 4px 12px rgba(136, 221, 136, 0.4), 0 0 40px rgba(136, 221, 136, 0.2)',
        letterSpacing: 2,
      }}>
        🌲 Select a Forest
      </h2>
      {levels.length === 0 ? (
        <p style={{
          color: '#88aa88',
          fontSize: 16,
          padding: '30px',
          background: 'rgba(26, 42, 26, 0.5)',
          borderRadius: 12,
          border: '2px solid #446644',
          textAlign: 'center',
        }}>
          No saved forests yet. Build one first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {levels.map(level => (
            <div key={level.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(26, 42, 26, 0.7) 0%, rgba(10, 26, 10, 0.7) 100%)',
              borderRadius: 10,
              border: '2px solid #446644',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#66aa66';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 170, 102, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#446644';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              }}
            >
              <div>
                <div style={{
                  color: '#eeffee',
                  fontSize: 17,
                  fontWeight: 'bold',
                  marginBottom: 4,
                }}>
                  {level.name}
                </div>
                <div style={{
                  color: '#88aa88',
                  fontSize: 12,
                }}>
                  {level.missions?.length || 0} missions · {level.lives || 3} lives · {new Date(level.updatedAt || level.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => onSelect(level)} style={{ ...btnStyle, background: '#2a4a2a' }}>▶ Play</button>
                {onEdit && <button onClick={() => onEdit(level)} style={{ ...btnStyle, background: '#2a3a4a' }}>✏ Edit</button>}
                <button onClick={() => handleDelete(level.id, level.name)} style={{ ...btnStyle, background: '#4a2a2a' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

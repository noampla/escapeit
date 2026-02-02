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

  const btnStyle = { padding: '6px 12px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 4, color: '#ccc', cursor: 'pointer', fontSize: 12 };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto', background: '#0a1a0a', minHeight: '100vh' }}>
      <button onClick={onBack} style={{ ...btnStyle, marginBottom: 20 }}>← Back to Menu</button>
      <h2 style={{ color: '#88cc88', marginBottom: 20 }}>🌲 Select a Forest</h2>
      {levels.length === 0 ? (
        <p style={{ color: '#668866' }}>No saved forests yet. Build one first!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {levels.map(level => (
            <div key={level.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: '#1a2a1a', borderRadius: 6, border: '1px solid #335533',
            }}>
              <div>
                <div style={{ color: '#ddd', fontSize: 15, fontWeight: 'bold' }}>{level.name}</div>
                <div style={{ color: '#668866', fontSize: 11 }}>
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

import { useState, useEffect } from 'react';
import { loadLevels, deleteLevel } from '../utils/storage';
import { getThemeById } from '../utils/themeRegistry';
import { useUser } from '../contexts/UserContext.jsx';
import { getTopScoresByTime, getTopScoresBySteps, formatTime } from '../utils/leaderboardService.js';
import Leaderboard from './Leaderboard.jsx';

// Mini leaderboard preview showing top 3 for time and steps
function LeaderboardPreview({ mapId }) {
  const [timeScores, setTimeScores] = useState([]);
  const [stepsScores, setStepsScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapId) return;
    setLoading(true);
    Promise.all([
      getTopScoresByTime(mapId, 3),
      getTopScoresBySteps(mapId, 3)
    ]).then(([time, steps]) => {
      setTimeScores(time);
      setStepsScores(steps);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [mapId]);

  if (loading) {
    return <div style={{ color: '#666', fontSize: 11 }}>Loading...</div>;
  }

  if (timeScores.length === 0 && stepsScores.length === 0) {
    return <div style={{ color: '#666', fontSize: 11, fontStyle: 'italic' }}>No scores yet</div>;
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#aaa' }}>
      {/* Fastest times */}
      <div>
        <div style={{ color: '#888', marginBottom: 4, fontWeight: '600' }}>⏱ Fastest</div>
        {timeScores.slice(0, 3).map((s, i) => (
          <div key={s.id} style={{ display: 'flex', gap: 4 }}>
            <span>{medals[i]}</span>
            <span style={{ color: '#ccc', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.userName}</span>
            <span style={{ color: '#8f8' }}>{formatTime(s.time)}</span>
          </div>
        ))}
      </div>
      {/* Least steps */}
      <div>
        <div style={{ color: '#888', marginBottom: 4, fontWeight: '600' }}>👣 Fewest</div>
        {stepsScores.slice(0, 3).map((s, i) => (
          <div key={s.id} style={{ display: 'flex', gap: 4 }}>
            <span>{medals[i]}</span>
            <span style={{ color: '#ccc', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.userName}</span>
            <span style={{ color: '#88f' }}>{s.steps}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Modal for full leaderboard
function LeaderboardModal({ mapId, levelName, onClose }) {
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #444',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 18 }}>{levelName}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        <Leaderboard mapId={mapId} compact={false} />
      </div>
    </div>
  );
}

export default function LevelSelect({ onSelect, onEdit, onBack }) {
  const [levels, setLevels] = useState([]);
  const { userId } = useUser();
  const [modalLevel, setModalLevel] = useState(null);

  useEffect(() => {
    console.log('LevelSelect: useEffect triggered');
    loadLevels().then(loaded => {
      console.log('LevelSelect: setting levels, count:', loaded.length);
      setLevels(loaded);
    });
  }, []);

  const handleDelete = (id, name) => {
    if (confirm(`Delete level "${name}"?`)) {
      deleteLevel(id).then(() => loadLevels().then(setLevels));
    }
  };

  const btnStyle = {
    padding: '10px 20px',
    background: 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#e8e8e8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(100, 100, 100, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 50%, #0a0a0a 100%)',
    }}>
    <div style={{
      padding: '60px 50px 100px',
      maxWidth: 900,
      margin: '0 auto',
      minHeight: '100vh',
      position: 'relative',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(100, 150, 200, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(100, 150, 200, 0.02) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />

      <button
        onClick={onBack}
        style={{ ...btnStyle, marginBottom: 40, zIndex: 10, position: 'relative' }}
        onMouseEnter={(e) => {
          e.target.style.background = 'linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)';
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        ← Back to Menu
      </button>

      <h2 style={{
        color: '#ffffff',
        marginBottom: 40,
        fontSize: 42,
        fontWeight: '900',
        textShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
        letterSpacing: 3,
        textTransform: 'uppercase',
        zIndex: 10,
        position: 'relative',
      }}>
        Play Escape Rooms
      </h2>

      {levels.length === 0 ? (
        <p style={{
          color: '#cccccc',
          fontSize: 18,
          padding: '40px',
          background: 'rgba(30, 30, 30, 0.7)',
          borderRadius: 16,
          border: 'none',
          textAlign: 'center',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          fontWeight: '600',
          zIndex: 10,
          position: 'relative',
        }}>
          No saved levels yet. Create one first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, zIndex: 10, position: 'relative' }}>
          {console.log('RENDERING levels:', levels.length, levels.map(l => l.name))}
          {levels.map(level => {
            console.log('Rendering level:', level.id, level.name, level.themeId);
            const theme = getThemeById(level.themeId || 'forest');
            const isCreator = userId && level.creatorId === userId;
            return (
              <div key={level.id} style={{
                padding: '20px 24px',
                background: 'rgba(30, 30, 30, 0.8)',
                borderRadius: 14,
                border: `2px solid ${theme?.primaryColor || '#666'}33`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 28px rgba(0, 0, 0, 0.5), 0 0 0 2px ${theme?.primaryColor || '#666'}66`;
                  e.currentTarget.style.borderColor = `${theme?.primaryColor || '#666'}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.borderColor = `${theme?.primaryColor || '#666'}33`;
                }}
              >
                {/* Top row: level info + buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    {/* Theme badge */}
                    {theme && (
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: `${theme.primaryColor}22`,
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: theme.primaryColor,
                        marginBottom: '8px',
                        border: `1px solid ${theme.primaryColor}44`
                      }}>
                        {theme.emoji} {theme.name}
                      </div>
                    )}

                    <div style={{
                      color: '#ffffff',
                      fontSize: 20,
                      fontWeight: '700',
                      marginBottom: 6,
                    }}>
                      {level.name}
                    </div>

                    <div style={{
                      color: '#aaaaaa',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      fontWeight: '500',
                    }}>
                      {level.missions?.length || 0} missions • {level.lives || 3} lives
                      {level.creatorName && ` • by ${level.creatorName}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onSelect(level)}
                      style={{ ...btnStyle, background: 'linear-gradient(145deg, #2a4a3a 0%, #1a3a2a 100%)' }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'linear-gradient(145deg, #3a5a4a 0%, #2a4a3a 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(145deg, #2a4a3a 0%, #1a3a2a 100%)';
                      }}
                    >
                      ▶ Play
                    </button>

                    <button
                      onClick={() => setModalLevel(level)}
                      style={{ ...btnStyle, background: 'linear-gradient(145deg, #3a3a4a 0%, #2a2a3a 100%)', padding: '10px 14px' }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'linear-gradient(145deg, #4a4a5a 0%, #3a3a4a 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(145deg, #3a3a4a 0%, #2a2a3a 100%)';
                      }}
                      title="View full leaderboard"
                    >
                      🏆
                    </button>

                    {onEdit && isCreator && (
                      <button
                        onClick={() => onEdit(level)}
                        style={{ ...btnStyle, background: 'linear-gradient(145deg, #4a4a2a 0%, #3a3a1a 100%)' }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(145deg, #5a5a3a 0%, #4a4a2a 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(145deg, #4a4a2a 0%, #3a3a1a 100%)';
                        }}
                      >
                        ✏ Edit
                      </button>
                    )}

                    {isCreator && (
                      <button
                        onClick={() => handleDelete(level.id, level.name)}
                        style={{ ...btnStyle, background: 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)' }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(145deg, #6a3a3a 0%, #5a2a2a 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)';
                        }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                {/* Leaderboard preview */}
                <div style={{
                  borderTop: '1px solid #333',
                  paddingTop: 12,
                  marginTop: 4,
                }}>
                  <LeaderboardPreview mapId={level.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard modal */}
      {modalLevel && (
        <LeaderboardModal
          mapId={modalLevel.id}
          levelName={modalLevel.name}
          onClose={() => setModalLevel(null)}
        />
      )}
    </div>
    </div>
  );
}

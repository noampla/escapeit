import { useState, useEffect, useMemo } from 'react';
import { loadLevels, deleteLevel } from '../utils/storage';
import { getThemeById } from '../utils/themeRegistry';
import { useUser } from '../contexts/UserContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { getTopScoresByTime, getTopScoresBySteps, formatTime } from '../utils/leaderboardService.js';

// Mini leaderboard preview showing top 3 for time and steps
function LeaderboardPreview({ mapId }) {
  const { t } = useLanguage();
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
    return <div style={{ color: '#666', fontSize: 11 }}>{t('common.loading')}</div>;
  }

  if (timeScores.length === 0 && stepsScores.length === 0) {
    return (
      <div style={{ color: '#777', fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
        {t('leaderboard.noScores')}
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ display: 'flex', gap: 28, justifyContent: 'center', padding: '2px 0' }}>
      {/* Fastest times */}
      {timeScores.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#aaa', marginBottom: 6, fontWeight: '600', fontSize: 13 }}>⏱ Time</div>
          {timeScores.slice(0, 2).map((s, i) => (
            <div key={s.id} style={{ display: 'flex', gap: 6, fontSize: 14, marginBottom: 2, justifyContent: 'center' }}>
              <span>{medals[i]}</span>
              <span style={{ color: '#7d7', fontWeight: '500' }}>{formatTime(s.time)}</span>
            </div>
          ))}
        </div>
      )}
      {/* Least steps */}
      {stepsScores.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#aaa', marginBottom: 6, fontWeight: '600', fontSize: 13 }}>👣 Steps</div>
          {stepsScores.slice(0, 2).map((s, i) => (
            <div key={s.id} style={{ display: 'flex', gap: 6, fontSize: 14, marginBottom: 2, justifyContent: 'center' }}>
              <span>{medals[i]}</span>
              <span style={{ color: '#99f', fontWeight: '500' }}>{s.steps}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sort options
const SORT_OPTIONS = [
  { id: 'random', labelKey: 'levelSelect.sortRandom', icon: '🎲' },
  { id: 'easy', labelKey: 'levelSelect.sortEasyFirst', icon: '🟢' },
  { id: 'hard', labelKey: 'levelSelect.sortHardFirst', icon: '🔴' },
  { id: 'newest', labelKey: 'levelSelect.sortNewest', icon: '🆕' },
];

// Shuffle array (Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function LevelSelect({ onSelect, onEdit, onBack, onViewMapPage }) {
  const { t, isRTL, getLocalizedThemeName } = useLanguage();
  const [levels, setLevels] = useState([]);
  const [bestTimes, setBestTimes] = useState({}); // mapId -> best time in seconds
  const { userId } = useUser();
  const [sortBy, setSortBy] = useState('random');
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    loadLevels().then(async (loaded) => {
      setLevels(loaded);
      // Fetch best times for all levels
      const times = {};
      await Promise.all(loaded.map(async (level) => {
        const scores = await getTopScoresByTime(level.id, 1);
        times[level.id] = scores[0]?.time || null; // null means no scores yet
      }));
      setBestTimes(times);
    });
  }, []);

  // Sort levels based on selection
  const sortedLevels = useMemo(() => {
    if (levels.length === 0) return [];

    switch (sortBy) {
      case 'easy':
        // Sort by fastest solve time (easiest = quickest to solve)
        // Maps with no scores go to the end
        return [...levels].sort((a, b) => {
          const timeA = bestTimes[a.id];
          const timeB = bestTimes[b.id];
          if (timeA === null && timeB === null) return 0;
          if (timeA === null) return 1; // no score goes last
          if (timeB === null) return -1;
          return timeA - timeB; // lower time = easier
        });
      case 'hard':
        // Sort by slowest solve time (hardest = took longest to solve)
        // Maps with no scores go last
        return [...levels].sort((a, b) => {
          const timeA = bestTimes[a.id];
          const timeB = bestTimes[b.id];
          if (timeA === null && timeB === null) return 0;
          if (timeA === null) return 1; // no score goes last
          if (timeB === null) return -1;
          return timeB - timeA; // higher time = harder
        });
      case 'newest':
        return [...levels].sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
      case 'random':
      default:
        return shuffleArray(levels);
    }
  }, [levels, sortBy, bestTimes]);

  const handleDelete = (id, name) => {
    if (confirm(t('levelSelect.deleteConfirm', { name }))) {
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
        padding: '40px 30px 100px',
        maxWidth: 1200,
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

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30,
          flexWrap: 'wrap',
          gap: 16,
          zIndex: 10,
          position: 'relative',
        }}>
          <button
            onClick={onBack}
            style={btnStyle}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {isRTL ? `${t('levelSelect.backToMenu')} →` : `← ${t('levelSelect.backToMenu')}`}
          </button>

          <h2 style={{
            color: '#ffffff',
            fontSize: 32,
            fontWeight: '900',
            textShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            margin: 0,
            flex: 1,
            textAlign: 'center',
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {t('levelSelect.title')}
          </h2>

          {/* Sort dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 13 }}>{t('levelSelect.sortBy')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.icon} {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {levels.length === 0 ? (
          <p style={{
            color: '#cccccc',
            fontSize: 18,
            padding: '60px 40px',
            background: 'rgba(30, 30, 30, 0.7)',
            borderRadius: 16,
            textAlign: 'center',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            fontWeight: '600',
            zIndex: 10,
            position: 'relative',
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {t('levelSelect.noLevels')}
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
            zIndex: 10,
            position: 'relative',
          }}>
            {sortedLevels.map(level => {
              const theme = getThemeById(level.themeId || 'forest');
              const isCreator = userId && level.creatorId === userId;
              const isHovered = hoveredCard === level.id;

              return (
                <div
                  key={level.id}
                  style={{
                    background: 'rgba(25, 25, 25, 0.9)',
                    borderRadius: 16,
                    border: `2px solid ${isHovered ? theme?.primaryColor || '#666' : 'rgba(80, 80, 80, 0.3)'}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isHovered
                      ? `0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px ${theme?.primaryColor || '#666'}33`
                      : '0 4px 16px rgba(0, 0, 0, 0.4)',
                    transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHoveredCard(level.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => onSelect(level)}
                >
                  {/* Theme Icon */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px 14px',
                    background: `radial-gradient(circle at center, ${theme?.primaryColor || '#666'}15 0%, rgba(0,0,0,0.4) 70%)`,
                  }}>
                    <div style={{
                      fontSize: 64,
                      filter: `drop-shadow(0 0 20px ${theme?.primaryColor || '#666'}66)`,
                      transition: 'transform 0.3s ease',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    }}>
                      {theme?.emoji || '🎮'}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '14px 18px 18px' }}>
                    {/* Theme badge */}
                    {theme && (
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: `${theme.primaryColor}22`,
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: theme.primaryColor,
                        marginBottom: '10px',
                        border: `1px solid ${theme.primaryColor}33`
                      }}>
                        {theme.emoji} {getLocalizedThemeName(theme.id, theme.name)}
                      </div>
                    )}

                    {/* Level name */}
                    <div style={{
                      color: '#ffffff',
                      fontSize: 20,
                      fontWeight: '700',
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {level.name}
                    </div>

                    {/* Stats */}
                    <div style={{
                      color: '#999999',
                      fontSize: 13,
                      marginBottom: 12,
                      direction: isRTL ? 'rtl' : 'ltr',
                    }}>
                      {t('levelSelect.levelStats', { missions: level.missions?.length || 0, lives: level.lives || 3 })}
                      {level.creatorName && (
                        <span style={{ color: '#777' }}> • {level.creatorName}</span>
                      )}
                    </div>

                    {/* Leaderboard preview */}
                    <div style={{
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      paddingTop: 12,
                      marginBottom: 14,
                      height: 75,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <LeaderboardPreview mapId={level.id} />
                    </div>

                    {/* Action buttons */}
                    <div style={{
                      display: 'flex',
                      gap: 10,
                      justifyContent: 'center',
                    }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onSelect(level)}
                        style={{
                          ...btnStyle,
                          flex: 1,
                          padding: '12px 18px',
                          background: 'linear-gradient(145deg, #2a5a3a 0%, #1a4a2a 100%)',
                          fontSize: 15,
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(145deg, #3a6a4a 0%, #2a5a3a 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(145deg, #2a5a3a 0%, #1a4a2a 100%)';
                        }}
                      >
                        ▶ {t('levelSelect.play')}
                      </button>

                      <button
                        onClick={() => onViewMapPage(level)}
                        style={{
                          ...btnStyle,
                          padding: '12px 14px',
                          background: 'linear-gradient(145deg, #3a3a4a 0%, #2a2a3a 100%)',
                          fontSize: 15,
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(145deg, #4a4a5a 0%, #3a3a4a 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(145deg, #3a3a4a 0%, #2a2a3a 100%)';
                        }}
                        title={t('levelSelect.viewMapPage')}
                      >
                        🏆
                      </button>

                      {/* Edit/Delete - always visible for creators */}
                      {isCreator && onEdit && (
                        <button
                          onClick={() => onEdit(level)}
                          style={{
                            ...btnStyle,
                            padding: '12px 14px',
                            background: 'linear-gradient(145deg, #4a4a2a 0%, #3a3a1a 100%)',
                            fontSize: 15,
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(145deg, #5a5a3a 0%, #4a4a2a 100%)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(145deg, #4a4a2a 0%, #3a3a1a 100%)';
                          }}
                          title={t('levelSelect.edit')}
                        >
                          ✏
                        </button>
                      )}
                      {isCreator && (
                        <button
                          onClick={() => handleDelete(level.id, level.name)}
                          style={{
                            ...btnStyle,
                            padding: '12px 14px',
                            background: 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)',
                            fontSize: 15,
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(145deg, #6a3a3a 0%, #5a2a2a 100%)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)';
                          }}
                          title={t('levelSelect.delete')}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

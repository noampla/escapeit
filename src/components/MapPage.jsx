import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext.jsx';
import { getThemeById } from '../utils/themeRegistry';
import {
  getTopScoresByTime,
  getTopScoresBySteps,
  getUserRanks,
  getPlayerCount,
  formatTime
} from '../utils/leaderboardService.js';
import Leaderboard from './Leaderboard.jsx';

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

export default function MapPage({ level, onPlay, onBack }) {
  const { t, isRTL, getLocalizedThemeName } = useLanguage();
  const { userId } = useUser();
  const [topTime, setTopTime] = useState(null);
  const [topSteps, setTopSteps] = useState(null);
  const [userRanks, setUserRanks] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const theme = getThemeById(level.themeId || 'forest');
  const color = theme?.primaryColor || '#888';

  useEffect(() => {
    if (!level.id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getTopScoresByTime(level.id, 1),
      getTopScoresBySteps(level.id, 1),
      userId ? getUserRanks(level.id, userId) : Promise.resolve({ timeRank: null, stepsRank: null }),
      getPlayerCount(level.id),
    ]).then(([timeScores, stepsScores, ranks, count]) => {
      setTopTime(timeScores[0] || null);
      setTopSteps(stepsScores[0] || null);
      setUserRanks(ranks);
      setPlayerCount(count);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [level.id, userId]);

  const userScore = userRanks?.userScore;
  const timeDiff = userScore && topTime ? userScore.time - topTime.time : null;
  const stepsDiff = userScore && topSteps ? userScore.steps - topSteps.steps : null;
  const isTimeRecord = timeDiff !== null && timeDiff <= 0;
  const isStepsRecord = stepsDiff !== null && stepsDiff <= 0;

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 50%, #0a0a0a 100%)',
    }}>
      <div style={{
        padding: '32px 24px 120px',
        maxWidth: 560,
        margin: '0 auto',
        position: 'relative',
        direction: isRTL ? 'rtl' : 'ltr',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 30%, ${color}08 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, ${color}05 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Back button */}
        <button
          onClick={onBack}
          style={{ ...btnStyle, marginBottom: 24, position: 'relative', zIndex: 1 }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {isRTL ? `${t('mapPage.backToList')} \u2192` : `\u2190 ${t('mapPage.backToList')}`}
        </button>

        {/* Hero card */}
        <div style={{
          background: 'rgba(25, 25, 25, 0.9)',
          border: `2px solid ${color}44`,
          borderRadius: 16,
          padding: '28px 24px 22px',
          marginBottom: 20,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${color}10`,
        }}>
          {/* Theme emoji */}
          <div style={{
            fontSize: 64,
            lineHeight: 1,
            marginBottom: 14,
            filter: `drop-shadow(0 0 20px ${color}44)`,
          }}>
            {theme?.emoji || '?'}
          </div>

          {/* Map name */}
          <h1 style={{
            color: '#fff',
            fontSize: 26,
            fontWeight: 900,
            margin: '0 0 8px',
            letterSpacing: 1,
            textShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
          }}>
            {level.name}
          </h1>

          {/* Theme badge */}
          {theme && (
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: `${color}22`,
              border: `1px solid ${color}33`,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: color,
              marginBottom: 10,
            }}>
              {theme.emoji} {getLocalizedThemeName(theme.id, theme.name)}
            </div>
          )}

          {/* Creator + Stats */}
          <div style={{ color: '#999', fontSize: 13, marginBottom: 4 }}>
            {level.creatorName && (
              <span>{t('mapPage.by', { name: level.creatorName })}</span>
            )}
            {level.creatorName && <span style={{ color: '#555' }}> \u00B7 </span>}
            <span style={{ color: '#777' }}>
              {t('mapPage.missions', { count: level.missions?.length || 0 })}
              {' \u00B7 '}
              {t('mapPage.lives', { count: level.lives || 3 })}
            </span>
          </div>

          {/* Player count */}
          <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>
            {playerCount === 0
              ? t('mapPage.noPlayersYet')
              : playerCount === 1
                ? t('mapPage.onePlayerCompeted')
                : t('mapPage.playersCompeted', { count: playerCount })}
          </div>
        </div>

        {/* Record Banner */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 32, position: 'relative', zIndex: 1, fontSize: 13 }}>
            {t('common.loading')}
          </div>
        ) : topTime || topSteps ? (
          <div style={{
            background: 'linear-gradient(145deg, rgba(35, 30, 15, 0.9) 0%, rgba(25, 22, 10, 0.9) 100%)',
            border: '2px solid rgba(201, 162, 39, 0.35)',
            borderRadius: 14,
            padding: '22px 24px',
            marginBottom: 18,
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 0 24px rgba(201, 162, 39, 0.08), 0 6px 24px rgba(0, 0, 0, 0.4)',
          }}>
            <div style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: 'rgba(201, 162, 39, 0.7)',
              marginBottom: 14,
              fontWeight: 700,
              textAlign: 'center',
            }}>
              {t('mapPage.record')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 36 }}>
              {topTime && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#7d7',
                    fontFamily: 'monospace',
                  }}>
                    {formatTime(topTime.time)}
                  </div>
                  <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>
                    {t('mapPage.bestTime')}
                  </div>
                  <div style={{ fontSize: 13, color: '#c9a227', marginTop: 4, fontWeight: 600 }}>
                    {'🥇 '}{topTime.userName}
                  </div>
                </div>
              )}
              {topSteps && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#99f',
                    fontFamily: 'monospace',
                  }}>
                    {topSteps.steps}
                  </div>
                  <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>
                    {t('mapPage.leastSteps')}
                  </div>
                  <div style={{ fontSize: 13, color: '#c9a227', marginTop: 4, fontWeight: 600 }}>
                    {'🥇 '}{topSteps.userName}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#777',
            padding: '26px 16px',
            background: 'rgba(30, 30, 30, 0.6)',
            borderRadius: 14,
            marginBottom: 18,
            border: '1px dashed #444',
            fontStyle: 'italic',
            fontSize: 14,
            position: 'relative',
            zIndex: 1,
          }}>
            {t('mapPage.noRecordsYet')}
          </div>
        )}

        {/* Your Personal Best */}
        {userScore && (
          <div style={{
            background: 'rgba(25, 25, 40, 0.7)',
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 18,
            border: '1px solid rgba(100, 100, 200, 0.2)',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{
              fontSize: 11,
              color: '#88a',
              fontWeight: 700,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 2,
              textAlign: 'center',
            }}>
              {t('mapPage.yourBest')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#7d7', fontFamily: 'monospace' }}>
                  {formatTime(userScore.time)}
                </div>
                <div style={{ fontSize: 11, color: '#667' }}>
                  {t('mapPage.timeRank')}: #{userRanks.timeRank}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#99f', fontFamily: 'monospace' }}>
                  {userScore.steps}
                </div>
                <div style={{ fontSize: 11, color: '#667' }}>
                  {t('mapPage.stepsRank')}: #{userRanks.stepsRank}
                </div>
              </div>
            </div>
            {/* Gap to record */}
            {isTimeRecord && isStepsRecord ? (
              <div style={{
                textAlign: 'center',
                marginTop: 12,
                color: '#ffd700',
                fontSize: 14,
                fontWeight: 700,
              }}>
                {'🏆 '}{t('mapPage.youHoldTheRecord')}
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
                {timeDiff > 0 && (
                  <span style={{ color: '#f88' }}>
                    {t('mapPage.timeBehind', { time: formatTime(timeDiff) })}
                  </span>
                )}
                {timeDiff > 0 && stepsDiff > 0 && (
                  <span style={{ color: '#444' }}> \u00B7 </span>
                )}
                {stepsDiff > 0 && (
                  <span style={{ color: '#f88' }}>
                    {t('mapPage.stepsBehind', { steps: stepsDiff })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Full Leaderboard */}
        {level.id && (
          <div style={{ marginBottom: 20, position: 'relative', zIndex: 1 }}>
            <Leaderboard mapId={level.id} compact={false} />
          </div>
        )}

        {/* Sticky Play Button */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          paddingTop: 14,
          paddingBottom: 18,
          background: 'linear-gradient(to top, rgba(10, 10, 10, 1) 60%, rgba(10, 10, 10, 0) 100%)',
          zIndex: 10,
        }}>
          <button
            onClick={onPlay}
            style={{
              display: 'block',
              width: '100%',
              padding: '16px 0',
              fontSize: 16,
              fontWeight: 700,
              border: 'none',
              borderRadius: 12,
              background: 'linear-gradient(145deg, #2a5a3a 0%, #1a4a2a 100%)',
              color: '#fff',
              cursor: 'pointer',
              letterSpacing: 1,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 20px rgba(68, 170, 68, 0.3), 0 0 0 1px rgba(100, 100, 100, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, #3a6a4a 0%, #2a5a3a 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(68, 170, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(145deg, #2a5a3a 0%, #1a4a2a 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(68, 170, 68, 0.3), 0 0 0 1px rgba(100, 100, 100, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)';
            }}
          >
            {'▶ '}{t('mapPage.play')}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { checkMissionComplete } from '../engine/missions';

// Reuse the InventoryIcon pattern from SolverMode
function MiniInventoryIcon({ theme, itemType, size = 24, itemState = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    const rendered = theme?.renderInventoryItem?.(ctx, itemType, 0, 0, size, itemState);
    if (!rendered) {
      const emoji = theme?.getItemEmoji?.(itemType);
      if (emoji) {
        ctx.font = `${size * 0.7}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size / 2, size / 2);
      }
    }
  }, [theme, itemType, size, itemState]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />;
}

export default function MobileHUD({
  lives,
  maxLives,
  elapsedTime,
  moveCount,
  gameState,
  grid,
  theme,
  missions,
  fixedOrder,
  isRTL,
  containers,
  onRestart,
  onBack,
  gameOver,
  soundEnabled,
  toggleSound,
}) {
  const [missionsExpanded, setMissionsExpanded] = useState(false);

  const completedCount = missions.filter(m => checkMissionComplete(m, gameState, grid, theme)).length;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      pointerEvents: 'none',
      zIndex: 400,
      padding: 'calc(8px + env(safe-area-inset-top, 0px)) calc(12px + env(safe-area-inset-right, 0px)) 0 calc(12px + env(safe-area-inset-left, 0px))',
    }}>
      {/* Top row: lives + time/moves + sound */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        {/* Lives */}
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 8,
          padding: '4px 8px',
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{ fontSize: 16 }}>
            {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, maxLives - lives))}
          </div>
        </div>

        {/* Time + Moves pill */}
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 8,
          padding: '4px 10px',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <span style={{ color: '#a8d8ff', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </span>
          <span style={{ color: '#555', fontSize: 10 }}>|</span>
          <span style={{ color: '#e8b8ff', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>
            {moveCount}
          </span>
        </div>

        {/* Sound toggle */}
        <button style={{
          pointerEvents: 'auto',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 8,
          padding: '4px 8px',
          backdropFilter: 'blur(6px)',
          border: 'none',
          color: '#fff',
          fontSize: 16,
          cursor: 'pointer',
        }} onClick={toggleSound}>
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Missions - collapsible */}
      {missions.length > 0 && (
        <div style={{
          marginTop: 6,
          pointerEvents: 'auto',
        }}>
          <div
            onClick={() => setMissionsExpanded(prev => !prev)}
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 8,
              padding: '4px 10px',
              backdropFilter: 'blur(6px)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <span style={{ color: '#a8d8f8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Missions ({completedCount}/{missions.length})
            </span>
            <span style={{ color: '#a8d8f8', fontSize: 10 }}>
              {missionsExpanded ? '▲' : '▼'}
            </span>
          </div>
          {missionsExpanded && (
            <div style={{
              marginTop: 4,
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 8,
              padding: '8px 10px',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}>
              {missions.map((m, i) => {
                const complete = checkMissionComplete(m, gameState, grid, theme);
                const isCurrent = fixedOrder && !complete && missions.slice(0, i).every(prev => checkMissionComplete(prev, gameState, grid, theme));
                return (
                  <div key={i} style={{
                    color: complete ? '#88ff88' : isCurrent ? '#ffee66' : '#99aabb',
                    fontSize: 11,
                    textDecoration: complete ? 'line-through' : 'none',
                    fontWeight: isCurrent ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}>
                    <span style={{ fontSize: 10 }}>{complete ? '✓' : isCurrent ? '▶' : '○'}</span>
                    <span>{m.description || m.type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inventory strip */}
      {gameState.inventory.length > 0 && (
        <div style={{
          marginTop: 6,
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          pointerEvents: 'none',
        }}>
          {gameState.inventory.map((item, i) => {
            const isWorn = gameState.worn && Object.values(gameState.worn).includes(item.itemType);
            return (
              <div key={i} style={{
                background: isWorn ? 'rgba(34, 68, 120, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                borderRadius: 6,
                padding: 3,
                border: isWorn ? '1px solid rgba(100, 140, 220, 0.5)' : '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
              }}>
                <MiniInventoryIcon theme={theme} itemType={item.itemType} size={24} itemState={item} />
              </div>
            );
          })}
        </div>
      )}

      {/* Containers (e.g., money bag) */}
      {containers && Object.entries(containers).some(([, v]) => v) && (
        <div style={{
          marginTop: 4,
          display: 'flex',
          gap: 6,
          pointerEvents: 'none',
        }}>
          {Object.entries(containers).filter(([, c]) => c).map(([slot, container]) => {
            const fillPercent = container.capacity ? Math.min(100, (container.contents / container.capacity) * 100) : 0;
            return (
              <div key={slot} style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 6,
                padding: '3px 8px',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <MiniInventoryIcon theme={theme} itemType={container.itemType} size={18} itemState={container} />
                {container.contents !== undefined && (
                  <>
                    <span style={{ fontSize: 11, color: '#55dd55', fontWeight: 'bold' }}>
                      ${container.contents.toLocaleString()}
                    </span>
                    {container.capacity && (
                      <div style={{
                        width: 30,
                        height: 3,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${fillPercent}%`,
                          height: '100%',
                          background: fillPercent >= 90 ? '#ff6644' : fillPercent >= 70 ? '#ffaa44' : '#55aa55',
                        }} />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useRef, useEffect, useState, useMemo } from 'react';
import Grid from './Grid';
import MobileJoystick from './MobileJoystick';
import MobileHUD from './MobileHUD';
import MobileNotificationOverlay from './MobileNotificationOverlay';
import MobileDropModal from './MobileDropModal';
import StoryModal from './StoryModal';
import Leaderboard from './Leaderboard.jsx';
import InventoryPreview from './InventoryPreview';
import { TILE_SIZE } from '../utils/constants';

function calculatePlayerViewport(playerPos, grid, tilesX = 20, tilesY = 15) {
  const gridCols = grid[0].length;
  const gridRows = grid.length;
  const halfX = Math.floor(tilesX / 2);
  const halfY = Math.floor(tilesY / 2);

  let minX = playerPos.x - halfX;
  let maxX = playerPos.x + halfX;
  let minY = playerPos.y - halfY;
  let maxY = playerPos.y + halfY;

  if (minX < 0) { maxX -= minX; minX = 0; }
  if (minY < 0) { maxY -= minY; minY = 0; }
  if (maxX >= gridCols) { minX -= (maxX - gridCols + 1); maxX = gridCols - 1; }
  if (maxY >= gridRows) { minY -= (maxY - gridRows + 1); maxY = gridRows - 1; }

  minX = Math.max(0, minX);
  minY = Math.max(0, minY);

  return { minX, minY, maxX, maxY };
}

export default function MobileSolverLayout({
  // Grid / rendering
  grid,
  playerPos,
  playerDirection,
  tick,
  hazardZones,
  revealedTiles,
  theme,
  gameState,
  caveBordersRevealed,
  peerPositions,
  interactionState,
  mouseHoldState,
  handleMouseInteraction,
  cancelInteraction,

  // Game state
  lives,
  maxLives,
  elapsedTime,
  moveCount,
  gameOver,
  isMultiplayer,

  // Actions
  keysDown,
  keyPressOrder,
  doPickup,
  doInteract,
  doToggleWear,
  dropItem,
  restart,
  onBack,
  interactionKeyReleasedRef,

  // UI state
  dropMenuOpen,
  setDropMenuOpen,
  inlineMenu,
  setInlineMenu,
  showRestartConfirm,
  setShowRestartConfirm,
  showExitConfirm,
  setShowExitConfirm,
  messageModal,
  setMessageModal,
  showStoryModal,
  setShowStoryModal,
  storyContent,
  hasStory,

  // Misc
  isRTL,
  isTestMode,
  soundEnabled,
  toggleSound,
  themeId,
  t,
  getItemLabel,
  getMissionDescription,
  effectiveMissions,
  level,
}) {
  const gridContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Measure container
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Calculate viewport for full screen
  const viewportBounds = useMemo(() => {
    const tilesX = Math.max(10, Math.floor(containerSize.width / TILE_SIZE));
    const tilesY = Math.max(8, Math.floor(containerSize.height / TILE_SIZE));
    return calculatePlayerViewport(playerPos, grid, tilesX, tilesY);
  }, [playerPos, grid, containerSize]);

  // Mobile pickup-or-drop handler
  const handlePickupOrDrop = () => {
    // Check if there's something to pick up on current or adjacent tile
    const pos = playerPos;
    const currentCell = grid[pos.y]?.[pos.x];
    const hasItemHere = currentCell?.object?.type?.startsWith('item-');

    // Check adjacent tiles
    let hasAdjacentItem = false;
    const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    for (const dir of dirs) {
      const nx = pos.x + dir.dx;
      const ny = pos.y + dir.dy;
      if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
        const adj = grid[ny][nx];
        if (adj?.object?.type?.startsWith('item-') && theme?.canPickupFromAdjacent?.(adj.object.type)) {
          hasAdjacentItem = true;
          break;
        }
      }
    }

    if (hasItemHere || hasAdjacentItem) {
      doPickup();
    } else if (gameState.inventory.length > 0) {
      setDropMenuOpen(true);
    } else {
      doPickup(); // Will show "no item here" notification
    }
  };

  const handleInteractRelease = () => {
    interactionKeyReleasedRef.current = true;
    if (interactionState) {
      cancelInteraction();
    }
  };

  return (
    <div className="mobile-game-container" style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000',
    }}>
      {/* Full-screen canvas */}
      <div ref={gridContainerRef} style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Grid
          grid={grid}
          playerPos={playerPos}
          playerDirection={playerDirection}
          showHazardZones={true}
          tick={tick}
          hazardZoneOverrides={hazardZones}
          revealedTiles={revealedTiles}
          viewportBounds={viewportBounds}
          onHoldStart={handleMouseInteraction}
          onHoldEnd={() => {
            if (interactionState) cancelInteraction();
          }}
          interactionTarget={(interactionState || mouseHoldState)?.visualTargetPos || (interactionState || mouseHoldState)?.targetPos}
          interactionProgress={(interactionState || mouseHoldState)?.progress || 0}
          interactionProgressColor={(interactionState || mouseHoldState)?.progressColor}
          theme={theme}
          gameState={gameState}
          caveBordersRevealed={caveBordersRevealed}
          peerPositions={peerPositions}
        />
      </div>

      {/* Mobile HUD overlay */}
      {!gameOver && (
        <MobileHUD
          lives={lives}
          maxLives={maxLives}
          elapsedTime={elapsedTime}
          moveCount={moveCount}
          gameState={gameState}
          grid={grid}
          theme={theme}
          missions={effectiveMissions}
          fixedOrder={level.fixedOrder}
          isRTL={isRTL}
          containers={gameState.containers}
          onRestart={restart}
          onBack={onBack}
          gameOver={gameOver}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
        />
      )}

      {/* Notification overlay */}
      {!gameOver && <MobileNotificationOverlay />}

      {/* Joystick */}
      {!gameOver && (
        <MobileJoystick
          keysDown={keysDown}
          keyPressOrder={keyPressOrder}
          onPickup={handlePickupOrDrop}
          onInteract={doInteract}
          onWear={doToggleWear}
          onInteractRelease={handleInteractRelease}
          interactionState={interactionState}
          isRTL={isRTL}
        />
      )}

      {/* Inline interaction menu (touch-friendly) */}
      {inlineMenu && !gameOver && (
        <div style={{
          position: 'absolute',
          bottom: 220,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 500,
          pointerEvents: 'auto',
          background: 'linear-gradient(145deg, rgba(30, 45, 30, 0.96), rgba(20, 35, 20, 0.96))',
          borderRadius: 14,
          padding: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(68, 170, 68, 0.6)',
          backdropFilter: 'blur(12px)',
          minWidth: 200,
          maxWidth: 'calc(100vw - 32px)',
        }}>
          <div style={{
            fontSize: 10,
            color: '#88ff88',
            marginBottom: 8,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center',
          }}>
            Choose Action
          </div>
          {inlineMenu.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInlineMenu(null);
                action.action();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                background: 'rgba(40, 55, 40, 0.6)',
                borderRadius: 8,
                marginBottom: idx < inlineMenu.actions.length - 1 ? 6 : 0,
                border: '1px solid rgba(68, 170, 68, 0.3)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                minHeight: 48,
              }}
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={() => setInlineMenu(null)}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '10px',
              background: 'rgba(60, 40, 40, 0.5)',
              border: '1px solid rgba(200, 100, 100, 0.3)',
              borderRadius: 8,
              color: '#ffaaaa',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Drop modal */}
      {dropMenuOpen && !gameOver && (
        <MobileDropModal
          inventory={gameState.inventory}
          theme={theme}
          themeId={themeId}
          onDrop={(idx) => { dropItem(idx); setDropMenuOpen(false); }}
          onClose={() => setDropMenuOpen(false)}
          getItemLabel={getItemLabel}
          isRTL={isRTL}
        />
      )}

      {/* Restart Confirmation */}
      {showRestartConfirm && !gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 700,
          pointerEvents: 'auto',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(60, 45, 30, 0.98), rgba(40, 30, 20, 0.98))',
            borderRadius: 16,
            padding: '24px 32px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
            textAlign: 'center',
            maxWidth: 'calc(100vw - 48px)',
          }}>
            <h3 style={{ color: '#f8d8a8', margin: '0 0 12px 0', fontSize: 18, fontWeight: 700 }}>
              Restart Level?
            </h3>
            <p style={{ color: '#ccbb99', margin: '0 0 20px 0', fontSize: 13 }}>
              Your progress will be lost.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { setShowRestartConfirm(false); restart(); }}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(145deg, #5a4a2a, #4a3a1a)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 80,
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setShowRestartConfirm(false)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(145deg, #3a3a3a, #2a2a2a)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#ccc',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 80,
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation */}
      {showExitConfirm && !gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 700,
          pointerEvents: 'auto',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(45, 45, 60, 0.98), rgba(30, 30, 45, 0.98))',
            borderRadius: 16,
            padding: '24px 32px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
            textAlign: 'center',
            maxWidth: 'calc(100vw - 48px)',
          }}>
            <h3 style={{ color: '#a8c8f8', margin: '0 0 12px 0', fontSize: 18, fontWeight: 700 }}>
              {isTestMode ? t('exitConfirm.exitTest') : t('exitConfirm.title')}
            </h3>
            <p style={{ color: '#99aabb', margin: '0 0 20px 0', fontSize: 13 }}>
              {t('exitConfirm.message')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { setShowExitConfirm(false); onBack(); }}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(145deg, #4a4a5a, #3a3a4a)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 80,
                }}
              >
                {t('common.yes')}
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(145deg, #3a3a3a, #2a2a2a)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#ccc',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 80,
                }}
              >
                {t('common.no')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 800,
          pointerEvents: 'auto',
          padding: '20px',
        }}>
          <h1 style={{
            color: gameOver === 'win' ? '#88ff88' : '#ff6666',
            fontSize: 36,
            marginBottom: 16,
            fontWeight: 900,
            textShadow: gameOver === 'win'
              ? '0 0 30px rgba(68, 255, 68, 0.8)'
              : '0 0 30px rgba(255, 68, 68, 0.8)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}>
            {gameOver === 'win' ? 'You Escaped!' : 'Game Over'}
          </h1>

          {/* Stats */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 45, 60, 0.95), rgba(20, 35, 50, 0.95))',
            padding: '20px 32px',
            borderRadius: 16,
            marginBottom: 24,
            border: '2px solid rgba(100, 180, 255, 0.5)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            width: '100%',
            maxWidth: 320,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#88ccff', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                  Time
                </div>
                <div style={{ fontSize: 32, color: '#fff', fontWeight: 900, fontFamily: 'monospace' }}>
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#e8b8ff', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                  Moves
                </div>
                <div style={{ fontSize: 32, color: '#fff', fontWeight: 900, fontFamily: 'monospace' }}>
                  {moveCount}
                </div>
              </div>
            </div>

            {gameOver === 'win' && (
              <div style={{
                marginTop: 16,
                padding: '8px 12px',
                background: 'rgba(68, 255, 68, 0.15)',
                borderRadius: 8,
                border: '1px solid rgba(68, 255, 68, 0.3)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, color: '#88ff88', fontWeight: 700 }}>
                  Score: {Math.max(0, 10000 - (elapsedTime * 10) - (moveCount * 5))}
                </div>
              </div>
            )}

            {gameOver === 'win' && level.id && !isTestMode && (
              <div style={{ marginTop: 12 }}>
                <Leaderboard mapId={level.id} compact={true} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={restart}
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(145deg, #2a5a2a, #1a4a1a)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              }}
            >
              Restart
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(145deg, #2a4a2a, #1a3a1a)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              }}
            >
              Menu
            </button>
            {hasStory && (
              <button
                onClick={() => setShowStoryModal(true)}
                style={{
                  padding: '14px 24px',
                  background: 'linear-gradient(145deg, #2a3a4a, #1a2a3a)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                }}
              >
                Help
              </button>
            )}
          </div>
        </div>
      )}

      {/* Story/Tutorial Modal */}
      {hasStory && (
        <StoryModal
          storyContent={storyContent}
          onClose={() => setShowStoryModal(false)}
          showOnFirstLoad={showStoryModal}
        />
      )}

      {/* Message Modal */}
      {messageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
          }}
          onClick={() => setMessageModal(null)}
        >
          <div
            style={{
              backgroundColor: '#2a2a3e',
              border: '2px solid #4a4a6e',
              borderRadius: 8,
              padding: 20,
              maxWidth: '90vw',
              minWidth: 260,
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                color: '#aaa',
                fontSize: 24,
                cursor: 'pointer',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
              }}
              onClick={() => setMessageModal(null)}
            >
              ×
            </button>
            {messageModal.title && (
              <h3 style={{ margin: '0 0 12px 0', color: '#eee', fontSize: 18 }}>
                {messageModal.title}
              </h3>
            )}
            {messageModal.image && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: messageModal.message ? 12 : 0,
              }}>
                <img
                  src={messageModal.image}
                  alt="Drawing"
                  style={{
                    imageRendering: 'pixelated',
                    width: 200,
                    height: 200,
                    border: '2px solid #6a5a4a',
                    borderRadius: 4,
                    backgroundColor: '#d4c4a8',
                  }}
                />
              </div>
            )}
            {messageModal.message && (
              <div style={{
                color: '#ddd',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                marginTop: messageModal.title ? 0 : 8,
              }}>
                {messageModal.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

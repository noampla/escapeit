import { useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

// Component to render inventory item icon using theme's rendering
function InventoryItemIcon({ itemType, itemState = {} }) {
  const canvasRef = useRef(null);
  const theme = useContext(ThemeContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 20, 20);

    // Try theme's inventory item rendering
    const rendered = theme?.renderInventoryItem?.(ctx, itemType, 0, 0, 20, itemState);
    if (!rendered) {
      // Fallback to emoji if theme doesn't render it
      const emoji = theme?.getItemEmoji?.(itemType);
      if (emoji) {
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 10, 10);
      }
    }
  }, [itemType, itemState, theme]);

  return <canvas ref={canvasRef} width={20} height={20} style={{ flexShrink: 0 }} />;
}

export default function HUD({ lives, maxLives, missions, gameState, fixedOrder, message, inventory = [], grid, worn = {} }) {
  const theme = useContext(ThemeContext);
  const { t, isRTL, getItemLabel, getTileLabel } = useLanguage();
  const themeId = theme?.themeId || 'forest';

  // Helper to get localized mission description
  const getMissionDescription = (mission) => {
    if (mission.description) return mission.description;

    // Get localized target name if available
    const targetLabel = mission.targetId
      ? getTileLabel(themeId, mission.targetId, mission.targetId)
      : '';

    // Use localized mission type template
    const typeKey = `missionTypes.${mission.type}`;
    return t(typeKey, { target: targetLabel });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 14, pointerEvents: 'none' }}>
      {/* Lives */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(30, 20, 20, 0.95) 0%, rgba(20, 10, 10, 0.95) 100%)',
        padding: '12px 18px',
        borderRadius: 12,
        border: 'none',
        boxShadow: `
          0 6px 20px rgba(0, 0, 0, 0.6),
          0 0 0 2px rgba(255, 68, 68, 0.3),
          inset 0 2px 0 rgba(255, 255, 255, 0.08)
        `,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ color: '#ff9999', fontSize: 10, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase', direction: isRTL ? 'rtl' : 'ltr' }}>
          {t('hud.lives')}
        </div>
        <span style={{ color: '#ff6666', fontSize: 20 }}>
          {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, maxLives - lives))}
        </span>
      </div>

      {/* Message - Fixed space to prevent layout shift */}
      <div style={{
        minWidth: 350,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 56,
      }}>
        {message && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(58, 122, 58, 0.98) 0%, rgba(42, 90, 42, 0.98) 100%)',
            padding: '14px 28px',
            borderRadius: 14,
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '700',
            border: 'none',
            boxShadow: `
              0 6px 24px rgba(68, 170, 68, 0.5),
              0 0 0 2px rgba(68, 170, 68, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.2)
            `,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            letterSpacing: 0.5,
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Missions */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(30, 45, 60, 0.95) 0%, rgba(20, 30, 40, 0.95) 100%)',
        padding: '14px 18px',
        borderRadius: 12,
        maxWidth: 300,
        border: 'none',
        boxShadow: `
          0 6px 20px rgba(0, 0, 0, 0.6),
          0 0 0 2px rgba(100, 150, 200, 0.3),
          inset 0 2px 0 rgba(255, 255, 255, 0.08)
        `,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          color: '#a8d8f8',
          fontSize: 11,
          marginBottom: 8,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          {fixedOrder ? t('hud.missionsOrdered') : t('hud.missions')}
        </div>
        {missions.map((m, i) => {
          const complete = isMissionDone(m, gameState, grid, theme);
          const isCurrent = fixedOrder && !complete && missions.slice(0, i).every(prev => isMissionDone(prev, gameState, grid, theme));
          return (
            <div key={i} style={{
              color: complete ? '#88ff88' : isCurrent ? '#ffee66' : '#99aabb',
              fontSize: 13,
              textDecoration: complete ? 'line-through' : 'none',
              fontWeight: isCurrent ? '600' : '500',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              <span style={{ fontSize: 14 }}>{complete ? '✓' : isCurrent ? '▶' : '○'}</span>
              {getMissionDescription(m)}
            </div>
          );
        })}
      </div>

      {/* Inventory */}
      {inventory.length > 0 && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(60, 45, 30, 0.95) 0%, rgba(40, 30, 20, 0.95) 100%)',
          padding: '14px 18px',
          borderRadius: 12,
          border: 'none',
          boxShadow: `
            0 6px 20px rgba(0, 0, 0, 0.6),
            0 0 0 2px rgba(200, 150, 100, 0.3),
            inset 0 2px 0 rgba(255, 255, 255, 0.08)
          `,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            color: '#f8d8a8',
            fontSize: 11,
            marginBottom: 8,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {t('hud.inventory')}
          </div>
          {inventory.map((item, i) => {
            // Use localized label from i18n, with theme's getItemLabel as fallback
            const themeLabel = theme?.getItemLabel?.(item.itemType, item) || item.itemType;
            const label = getItemLabel(themeId, item.itemType, themeLabel);
            return (
              <div key={i} style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '6px 10px',
                borderRadius: 8,
              }}>
                <InventoryItemIcon itemType={item.itemType} itemState={item} />
                <span style={{ flex: 1 }}>{label}</span>
              </div>
            );
          })}
          <div style={{
            color: '#ccbb99',
            fontSize: 11,
            marginTop: 10,
            fontFamily: 'monospace',
            paddingTop: 8,
            borderTop: '1px solid rgba(200, 150, 100, 0.2)',
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {t('hud.dropHint')}
          </div>
        </div>
      )}

      {/* Worn Items */}
      {worn && Object.values(worn).some(v => v) && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(45, 30, 60, 0.95) 0%, rgba(30, 20, 40, 0.95) 100%)',
          padding: '14px 18px',
          borderRadius: 12,
          border: 'none',
          boxShadow: `
            0 6px 20px rgba(0, 0, 0, 0.6),
            0 0 0 2px rgba(150, 100, 200, 0.3),
            inset 0 2px 0 rgba(255, 255, 255, 0.08)
          `,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            color: '#d8a8f8',
            fontSize: 11,
            marginBottom: 8,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {t('hud.wearing')}
          </div>
          {Object.entries(worn).filter(([, itemType]) => itemType).map(([slot, itemType]) => {
            const themeLabel = theme?.getItemLabel?.(itemType, {}) || itemType;
            const label = getItemLabel(themeId, itemType, themeLabel);
            return (
              <div key={slot} style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '6px 10px',
                borderRadius: 8,
              }}>
                <InventoryItemIcon itemType={itemType} itemState={{}} />
                <span style={{ flex: 1 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function isMissionDone(mission, gs, grid, theme) {
  switch (mission.type) {
    case 'collect': return gs.collectedItems.includes(mission.targetId);
    case 'rescue': return gs.rescuedFriends > 0 || gs.collectedItems.includes('friend');
    case 'extinguish': {
      if (!grid) return false;
      // Get hazard tile types from theme (defaults to generic hazard types)
      const hazardTiles = theme?.getHazardTileTypes?.() || [];
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (hazardTiles.includes(grid[y][x].type)) return false;
        }
      }
      return true;
    }
    case 'reach': return gs.reachedLocations.includes(mission.targetId);
    case 'escape': return gs.reachedExit;
    default: return false;
  }
}

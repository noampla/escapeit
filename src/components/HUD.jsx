import { useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../App';

// Component to render inventory item icon
function InventoryItemIcon({ itemType, filled }) {
  const canvasRef = useRef(null);
  const theme = useContext(ThemeContext);

  useEffect(() => {
    if ((itemType === 'bucket' || itemType === 'wood') && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 20, 20);

      // Special handling for empty bucket in inventory - render as simple outline
      if (itemType === 'bucket' && filled !== true) {
        const cx = 10;
        const cy = 10;
        const s = 20 * 0.28;

        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;

        // Bucket outline (trapezoid)
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.8, cy - s * 0.3);
        ctx.lineTo(cx + s * 0.8, cy - s * 0.3);
        ctx.lineTo(cx + s * 0.6, cy + s * 0.8);
        ctx.lineTo(cx - s * 0.6, cy + s * 0.8);
        ctx.closePath();
        ctx.stroke();

        // Handle
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.5, s * 0.55, Math.PI * 0.85, Math.PI * 0.15);
        ctx.stroke();

        // Handle connection points
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(cx - s * 0.7, cy - s * 0.3, s * 0.1, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.7, cy - s * 0.3, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Use theme's renderItem function for filled bucket and wood
        const isFilled = filled === true;
        const rendered = theme?.renderItem?.(ctx, itemType, 0, 0, 20, { filled: isFilled });

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
      }
    }
  }, [itemType, filled, theme]);

  if (itemType === 'bucket' || itemType === 'wood') {
    return <canvas ref={canvasRef} width={20} height={20} style={{ flexShrink: 0 }} />;
  }

  // For other items, use emoji from theme
  const emoji = theme?.getItemEmoji?.(itemType);
  return <span style={{ fontSize: 16 }}>{emoji}</span>;
}

export default function HUD({ lives, maxLives, missions, gameState, fixedOrder, message, inventory = [], grid }) {
  const theme = useContext(ThemeContext);

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
        <div style={{ color: '#ff9999', fontSize: 10, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
          Lives
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
        }}>
          Missions{fixedOrder ? ' (Ordered)' : ''}
        </div>
        {missions.map((m, i) => {
          const complete = isMissionDone(m, gameState, grid);
          const isCurrent = fixedOrder && !complete && missions.slice(0, i).every(prev => isMissionDone(prev, gameState, grid));
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
            }}>
              <span style={{ fontSize: 14 }}>{complete ? '✓' : isCurrent ? '▶' : '○'}</span>
              {m.description || `${m.type}: ${m.targetId || ''}`}
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
          }}>
            Inventory
          </div>
          {inventory.map((item, i) => {
            const itemTypes = theme?.getItemTypes?.() || {};
            const def = itemTypes[item.itemType];
            const label = def ? def.label : item.itemType;
            const suffix = item.itemType === 'bucket' ? (item.filled ? ' (full)' : ' (empty)') : '';
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
                <InventoryItemIcon itemType={item.itemType} filled={item.filled} />
                {label}{suffix}
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
          }}>
            Press Q to drop
          </div>
        </div>
      )}
    </div>
  );
}

function isMissionDone(mission, gs, grid) {
  switch (mission.type) {
    case 'collect': return gs.collectedItems.includes(mission.targetId);
    case 'rescue': return gs.rescuedFriends > 0 || gs.collectedItems.includes('friend');
    case 'extinguish': {
      if (!grid) return false;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x].type === 'fire') return false;
        }
      }
      return true;
    }
    case 'reach': return gs.reachedLocations.includes(mission.targetId);
    case 'escape': return gs.reachedExit;
    default: return false;
  }
}

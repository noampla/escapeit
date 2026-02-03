import { useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../App';

const categories = [
  { id: 'basic', label: 'Terrain' },
  { id: 'interactive', label: 'Objects' },
  { id: 'hazard', label: 'Hazards' },
];

const TOOLBAR_EMOJIS = {
  tree: '🌲', water: '🌊', snow: '❄️',
  campfire: '🏕️', car: '🚗',
  friend: '👤',
  fire: '🔥', bear: '🐻',
  // Item tiles
  'item-key': '🔑',
  'item-axe': '🪓',
  'item-rope': '🧵',
  'item-knife': '🔪',
  'item-sweater': '🧥',
};

// Draw mini bucket icon
function drawMiniBucket(ctx, size) {
  const s = size * 0.3;
  const cx = size / 2, cy = size / 2;

  ctx.fillStyle = '#6699cc';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#4477aa';
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.3, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#556677';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.85, s * 0.55, Math.PI * 0.85, Math.PI * 0.15);
  ctx.stroke();
}

// Draw mini wood icon
function drawMiniWood(ctx, size) {
  const s = size * 0.28;
  const cx = size / 2, cy = size / 2;

  ctx.fillStyle = '#6b4910';
  ctx.fillRect(cx - s * 0.75, cy + s * 0.25, s * 1.5, s * 0.55);

  ctx.fillStyle = '#8b6914';
  ctx.fillRect(cx - s * 1.05, cy - s * 0.35, s * 2.1, s * 0.6);

  ctx.fillStyle = '#a58420';
  ctx.fillRect(cx - s * 1.05, cy - s * 0.35, s * 2.1, s * 0.18);

  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.arc(cx + s * 1.05, cy - s * 0.05, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function ToolbarIcon({ type, theme, TILE_TYPES }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (type === 'item-bucket' || type === 'item-wood') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 16, 16);
      if (type === 'item-bucket') {
        drawMiniBucket(ctx, 16);
      } else if (type === 'item-wood') {
        drawMiniWood(ctx, 16);
      }
    }
  }, [type]);

  const emoji = TOOLBAR_EMOJIS[type];

  if (type === 'item-bucket' || type === 'item-wood') {
    return <canvas ref={canvasRef} width={16} height={16} style={{ flexShrink: 0 }} />;
  }

  if (emoji) {
    return <span style={{ fontSize: 16 }}>{emoji}</span>;
  }

  const def = TILE_TYPES[type];
  return <span style={{
    width: 14, height: 14, borderRadius: 3,
    background: def?.color || '#666', display: 'inline-block', flexShrink: 0,
  }} />;
}

export default function Toolbar({ selected, onSelect }) {
  const theme = useContext(ThemeContext);
  const TILE_TYPES = theme?.getTileTypes() || {};

  return (
    <div style={{
      width: 210,
      background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
      padding: 18,
      overflowY: 'auto',
      borderRight: `2px solid ${theme?.primaryColor ? `${theme.primaryColor}40` : 'rgba(100, 150, 200, 0.3)'}`,
      boxShadow: `
        inset -6px 0 20px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.05)
      `,
      backdropFilter: 'blur(10px)',
    }}>
      <h3 style={{
        margin: '0 0 20px',
        color: theme?.primaryColor || '#aaddff',
        fontSize: 18,
        fontWeight: '800',
        textShadow: `
          0 0 20px ${theme?.primaryColor ? `${theme.primaryColor}80` : 'rgba(170, 221, 255, 0.5)'},
          0 2px 8px rgba(0, 0, 0, 0.8)
        `,
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}>
        {theme?.emoji || '🎯'} Objects
      </h3>
      {categories.map(cat => {
        const items = Object.entries(TILE_TYPES).filter(([, def]) => def.category === cat.id);
        if (items.length === 0) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 20 }}>
            <div style={{
              color: theme?.primaryColor || '#aaddff',
              fontSize: 12,
              marginBottom: 10,
              textTransform: 'uppercase',
              fontWeight: '700',
              letterSpacing: 1,
            }}>
              {cat.label}
            </div>
            {items.map(([type, def]) => {
              return (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '11px 14px',
                    marginBottom: 6,
                    background: selected === type
                      ? 'linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)'
                      : 'linear-gradient(145deg, rgba(40, 40, 40, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)',
                    border: 'none',
                    borderRadius: 10,
                    color: selected === type ? '#ffffff' : '#e8e8e8',
                    cursor: 'pointer',
                    fontSize: 14,
                    textAlign: 'left',
                    fontWeight: selected === type ? '700' : '500',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: selected === type
                      ? `0 4px 16px rgba(100, 100, 100, 0.3), 0 0 0 2px ${theme?.primaryColor ? `${theme.primaryColor}66` : 'rgba(100, 150, 200, 0.4)'}, inset 0 2px 0 rgba(255,255,255,0.15)`
                      : '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(100, 100, 100, 0.15)',
                    transform: selected === type ? 'translateX(4px)' : 'translateX(0)',
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== type) {
                      e.target.style.background = 'linear-gradient(145deg, rgba(50, 50, 50, 0.8) 0%, rgba(40, 40, 40, 0.8) 100%)';
                      e.target.style.transform = 'translateX(2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(100, 100, 100, 0.2), 0 0 0 1px rgba(100, 100, 100, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== type) {
                      e.target.style.background = 'linear-gradient(145deg, rgba(40, 40, 40, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)';
                      e.target.style.transform = 'translateX(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(100, 100, 100, 0.15)';
                    }
                  }}
                >
                  <ToolbarIcon type={type} theme={theme} TILE_TYPES={TILE_TYPES} />
                  {def.label}
                </button>
              );
            })}
          </div>
        );
      })}
      <div style={{
        color: '#aaaaaa',
        fontSize: 12,
        marginTop: 20,
        padding: '12px 14px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.3) 100%)',
        borderRadius: 10,
        border: `1px solid ${theme?.primaryColor ? `${theme.primaryColor}33` : 'rgba(100, 100, 100, 0.2)'}`,
        lineHeight: 1.8,
        fontFamily: 'monospace',
      }}>
        <div style={{ color: theme?.primaryColor || '#aaddff', fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>Controls</div>
        Left click: place<br />
        Right click: remove
      </div>
    </div>
  );
}

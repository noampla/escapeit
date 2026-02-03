import { useEffect, useRef } from 'react';
import { TILE_TYPES, ITEM_TYPES } from '../utils/constants';

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

function ToolbarIcon({ type }) {
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
  return (
    <div style={{
      width: 190,
      background: 'linear-gradient(180deg, #1a3a1a 0%, #0f2a0f 100%)',
      padding: 14,
      overflowY: 'auto',
      borderRight: '3px solid #446644',
      boxShadow: 'inset -4px 0 12px rgba(0, 0, 0, 0.3)',
    }}>
      <h3 style={{
        margin: '0 0 14px',
        color: '#88dd88',
        fontSize: 16,
        fontWeight: 'bold',
        textShadow: '0 2px 6px rgba(136, 221, 136, 0.3)',
      }}>
        🌲 Objects
      </h3>
      {categories.map(cat => {
        const items = Object.entries(TILE_TYPES).filter(([, def]) => def.category === cat.id);
        if (items.length === 0) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 16 }}>
            <div style={{
              color: '#99bb99',
              fontSize: 11,
              marginBottom: 6,
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: 0.5,
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
                    gap: 8,
                    width: '100%',
                    padding: '8px 10px',
                    marginBottom: 4,
                    background: selected === type
                      ? 'linear-gradient(135deg, #3a5a3a 0%, #2a4a2a 100%)'
                      : 'linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 100%)',
                    border: selected === type ? '2px solid #66aa66' : '2px solid transparent',
                    borderRadius: 6,
                    color: selected === type ? '#eeffee' : '#ddd',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    fontWeight: selected === type ? '600' : '400',
                    transition: 'all 0.15s ease',
                    boxShadow: selected === type
                      ? '0 4px 12px rgba(102, 170, 102, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : '0 2px 6px rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== type) {
                      e.target.style.background = 'linear-gradient(135deg, #3a4a3a 0%, #2a3a2a 100%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== type) {
                      e.target.style.background = 'linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 100%)';
                    }
                  }}
                >
                  <ToolbarIcon type={type} />
                  {def.label}
                </button>
              );
            })}
          </div>
        );
      })}
      <div style={{
        color: '#99bb99',
        fontSize: 11,
        marginTop: 16,
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 6,
        border: '1px solid #335533',
        lineHeight: 1.6,
      }}>
        <strong>Controls:</strong><br />
        Left click: place<br />
        Right click: remove
      </div>
    </div>
  );
}

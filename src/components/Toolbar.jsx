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
    <div style={{ width: 170, background: '#1a2a1a', padding: 10, overflowY: 'auto', borderRight: '2px solid #335533' }}>
      <h3 style={{ margin: '0 0 10px', color: '#aaa', fontSize: 14 }}>🌲 Objects</h3>
      {categories.map(cat => {
        const items = Object.entries(TILE_TYPES).filter(([, def]) => def.category === cat.id);
        if (items.length === 0) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 4, textTransform: 'uppercase' }}>{cat.label}</div>
            {items.map(([type, def]) => {
              return (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                    padding: '5px 8px', marginBottom: 2,
                    background: selected === type ? '#3a5a3a' : '#2a3a2a',
                    border: selected === type ? '1px solid #66aa66' : '1px solid transparent',
                    borderRadius: 4, color: '#ddd', cursor: 'pointer', fontSize: 12, textAlign: 'left',
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
      <div style={{ color: '#556644', fontSize: 10, marginTop: 10 }}>
        Left click: place<br />
        Right click: remove
      </div>
    </div>
  );
}

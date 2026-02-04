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

// Draw mini key icon with color
function drawMiniKey(ctx, size, color = '#cc4444') {
  const s = size * 0.35;
  const cx = size / 2, cy = size / 2;

  ctx.fillStyle = color;

  // Key head (circle)
  ctx.beginPath();
  ctx.arc(cx - s * 0.3, cy, s * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Key hole
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(cx - s * 0.3, cy, s * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Key shaft
  ctx.fillStyle = color;
  ctx.fillRect(cx - s * 0.05, cy - s * 0.1, s * 0.7, s * 0.2);

  // Key teeth
  ctx.fillRect(cx + s * 0.4, cy, s * 0.15, s * 0.25);
  ctx.fillRect(cx + s * 0.2, cy, s * 0.1, s * 0.18);
}

// Draw mini card icon with color
function drawMiniCard(ctx, size, color = '#cc4444') {
  const s = size * 0.4;
  const cx = size / 2, cy = size / 2;

  // Card body
  ctx.fillStyle = '#eee';
  ctx.fillRect(cx - s * 0.6, cy - s * 0.4, s * 1.2, s * 0.8);

  // Colored stripe
  ctx.fillStyle = color;
  ctx.fillRect(cx - s * 0.6, cy - s * 0.4, s * 1.2, s * 0.25);

  // Chip
  ctx.fillStyle = '#daa520';
  ctx.fillRect(cx - s * 0.4, cy + s * 0.05, s * 0.3, s * 0.22);
}

function ToolbarIcon({ type, theme, TILE_TYPES, lockColor }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (type === 'item-bucket' || type === 'item-wood' || type === 'item-key' || type === 'item-card') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 16, 16);
      if (type === 'item-bucket') {
        drawMiniBucket(ctx, 16);
      } else if (type === 'item-wood') {
        drawMiniWood(ctx, 16);
      } else if (type === 'item-key') {
        const color = LOCK_COLORS[lockColor]?.color || '#cc4444';
        drawMiniKey(ctx, 16, color);
      } else if (type === 'item-card') {
        const color = LOCK_COLORS[lockColor]?.color || '#cc4444';
        drawMiniCard(ctx, 16, color);
      }
    }
  }, [type, lockColor]);

  const emoji = TOOLBAR_EMOJIS[type];

  if (type === 'item-bucket' || type === 'item-wood' || type === 'item-key' || type === 'item-card') {
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

// Floor color options
const FLOOR_COLORS = {
  gray: { label: 'Gray', color: '#4a4a4a' },
  blue: { label: 'Blue', color: '#3a3a5a' },
  red: { label: 'Red', color: '#5a3a3a' },
  green: { label: 'Green', color: '#3a4a3a' },
  yellow: { label: 'Yellow', color: '#4a4a3a' },
  purple: { label: 'Purple', color: '#4a3a4a' },
  marble: { label: 'Marble', color: '#5a5a5a' },
};

// Lock color options for doors/keys/cards
const LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444' },
  blue: { label: 'Blue', color: '#4444cc' },
  green: { label: 'Green', color: '#44cc44' },
  yellow: { label: 'Yellow', color: '#cccc44' },
  purple: { label: 'Purple', color: '#cc44cc' },
};

// Tiles that use lock colors
const LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

export default function Toolbar({ selected, onSelect, floorColor, onFloorColorChange, lockColor, onLockColorChange }) {
  const theme = useContext(ThemeContext);
  const TILE_TYPES = theme?.getTileTypes() || {};
  const toolbarRef = useRef(null);

  return (
    <div ref={toolbarRef} style={{
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
      position: 'relative',
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
              const isLockTile = LOCK_TILES.includes(type);
              const isFloorTile = type === 'floor';
              const showLockColorIndicator = isLockTile && selected === type;
              const showFloorColorIndicator = isFloorTile && selected === type;

              return (
                <div key={type}>
                  <button
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
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(50, 50, 50, 0.8) 0%, rgba(40, 40, 40, 0.8) 100%)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 100, 100, 0.2), 0 0 0 1px rgba(100, 100, 100, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selected !== type) {
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(40, 40, 40, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(100, 100, 100, 0.15)';
                      }
                    }}
                  >
                    <ToolbarIcon type={type} theme={theme} TILE_TYPES={TILE_TYPES} lockColor={lockColor} />
                    <span style={{ flex: 1 }}>{def.label}</span>
                    {showLockColorIndicator && (
                      <span style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: LOCK_COLORS[lockColor]?.color || '#cc4444',
                        border: '1px solid rgba(255,255,255,0.5)',
                        flexShrink: 0,
                      }} />
                    )}
                    {showFloorColorIndicator && (
                      <span style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: FLOOR_COLORS[floorColor]?.color || '#4a4a4a',
                        border: '1px solid rgba(255,255,255,0.5)',
                        flexShrink: 0,
                      }} />
                    )}
                  </button>

                  {/* Lock color picker inline - shows right below the selected button */}
                  {selected === type && isLockTile && onLockColorChange && (
                    <div style={{
                      marginTop: 4,
                      marginBottom: 6,
                      padding: '8px 10px',
                      background: 'linear-gradient(145deg, rgba(50, 50, 50, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)',
                      borderRadius: 8,
                      border: `2px solid ${LOCK_COLORS[lockColor]?.color || '#cc4444'}`,
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                        {Object.entries(LOCK_COLORS).map(([colorId, colorDef]) => (
                          <button
                            key={colorId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onLockColorChange(colorId);
                            }}
                            title={colorDef.label}
                            style={{
                              width: 26,
                              height: 26,
                              background: colorDef.color,
                              border: lockColor === colorId ? '3px solid #fff' : '2px solid #444',
                              borderRadius: 5,
                              cursor: 'pointer',
                              boxShadow: lockColor === colorId
                                ? '0 0 8px rgba(255,255,255,0.6)'
                                : '0 2px 4px rgba(0,0,0,0.3)',
                              transition: 'all 0.15s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floor color picker inline - shows right below the selected floor button */}
                  {selected === type && isFloorTile && onFloorColorChange && (
                    <div style={{
                      marginTop: 4,
                      marginBottom: 6,
                      padding: '8px 10px',
                      background: 'linear-gradient(145deg, rgba(50, 50, 50, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)',
                      borderRadius: 8,
                      border: `2px solid ${FLOOR_COLORS[floorColor]?.color || '#4a4a4a'}`,
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                        {Object.entries(FLOOR_COLORS).map(([colorId, colorDef]) => (
                          <button
                            key={colorId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onFloorColorChange(colorId);
                            }}
                            title={colorDef.label}
                            style={{
                              width: 26,
                              height: 26,
                              background: colorDef.color,
                              border: floorColor === colorId ? '3px solid #fff' : '2px solid #444',
                              borderRadius: 5,
                              cursor: 'pointer',
                              boxShadow: floorColor === colorId
                                ? '0 0 8px rgba(255,255,255,0.6)'
                                : '0 2px 4px rgba(0,0,0,0.3)',
                              transition: 'all 0.15s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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

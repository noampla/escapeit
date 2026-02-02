import { useRef, useEffect, useCallback, useState } from 'react';
import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_COLS, GRID_ROWS, TILE_TYPES, ITEM_TYPES } from '../utils/constants';
import { getAllHazardZones } from '../engine/hazards';

const TILE_EMOJIS = {
  tree: '🌲', water: '🌊', snow: '❄️', raft: '🛶',
  campfire: '🏕️', car: '🚗', friend: '👤', fire: '🔥', bear: '🐻',
  // Item tiles
  'item-key': '🔑',
  'item-axe': '🪓',
  'item-bucket': '🪣',
  'item-rope': '🧵',
  'item-knife': '🔪',
  'item-sweater': '🧥',
  'item-wood': '🪵',
};

// Draw a bucket shape on canvas
function drawBucket(ctx, cx, cy, size) {
  const s = size * 0.35;
  ctx.fillStyle = '#5588bb';
  // Trapezoid body
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.7);
  ctx.closePath();
  ctx.fill();
  // Handle
  ctx.strokeStyle = '#5588bb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.8, s * 0.5, Math.PI, 0);
  ctx.stroke();
}

// Draw wood logs on canvas
function drawWood(ctx, cx, cy, size) {
  const s = size * 0.3;
  ctx.fillStyle = '#8b6914';
  // Two logs
  ctx.fillRect(cx - s, cy - s * 0.3, s * 2, s * 0.5);
  ctx.fillRect(cx - s * 0.7, cy + s * 0.3, s * 1.4, s * 0.5);
  // Rings
  ctx.fillStyle = '#a07818';
  ctx.beginPath();
  ctx.arc(cx + s, cy - s * 0.05, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.7, cy + s * 0.55, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

export default function Grid({ grid, onClick, onRightClick, onDrag, playerPos, showHazardZones, tick = 0, hazardZoneOverrides, showTooltips = false, revealedTiles }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const isDragging = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        // Fog of war in solve mode
        if (revealedTiles && !revealedTiles.has(`${x},${y}`)) {
          ctx.fillStyle = '#000';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          continue;
        }

        const cell = grid[y][x];
        const def = TILE_TYPES[cell.type] || TILE_TYPES.empty;
        const px = x * TILE_SIZE, py = y * TILE_SIZE;
        const cx = px + TILE_SIZE / 2, cy = py + TILE_SIZE / 2;

        ctx.fillStyle = def.color;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        ctx.strokeStyle = '#2a3a2a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Draw item tiles
        if (cell.type.startsWith('item-')) {
          const emoji = TILE_EMOJIS[cell.type];
          if (cell.type === 'item-bucket') {
            drawBucket(ctx, cx, cy, TILE_SIZE);
          } else if (cell.type === 'item-wood') {
            drawWood(ctx, cx, cy, TILE_SIZE);
          } else if (emoji) {
            ctx.font = '22px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, cx, cy);
          }
        } else {
          const emoji = TILE_EMOJIS[cell.type];
          if (emoji) {
            ctx.font = '22px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, cx, cy);
          }
        }
      }
    }

    // Hazard zones overlay
    if (showHazardZones) {
      const zones = hazardZoneOverrides || getAllHazardZones(grid);
      ctx.globalAlpha = 0.25;
      for (const z of zones) {
        if (revealedTiles && !revealedTiles.has(`${z.x},${z.y}`)) continue;
        const zpx = z.x * TILE_SIZE, zpy = z.y * TILE_SIZE;
        ctx.fillStyle = z.hazardType === 'bear' ? '#8b4513' : '#ff4400';
        ctx.fillRect(zpx, zpy, TILE_SIZE, TILE_SIZE);
      }
      ctx.globalAlpha = 1;
    }

    // Player
    if (playerPos) {
      const ppx = playerPos.x * TILE_SIZE, ppy = playerPos.y * TILE_SIZE;
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧑', ppx + TILE_SIZE / 2, ppy + TILE_SIZE / 2);
    }
  }, [grid, playerPos, showHazardZones, tick, hazardZoneOverrides, revealedTiles]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getTileAt = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) return { x, y };
    return null;
  };

  const handleMouseDown = (e) => {
    if (e.button === 2) return;
    const pos = getTileAt(e);
    if (pos && onClick) onClick(pos.x, pos.y, e);
    isDragging.current = true;
  };

  const handleMouseMove = (e) => {
    if (isDragging.current && onDrag) {
      const pos = getTileAt(e);
      if (pos) onDrag(pos.x, pos.y, e);
    }
    if (!showTooltips) { setTooltip(null); return; }
    const pos = getTileAt(e);
    if (!pos) { setTooltip(null); return; }
    const cell = grid[pos.y][pos.x];
    const def = TILE_TYPES[cell.type];
    if (def && def.tooltip && cell.type !== 'empty' && cell.type !== 'ground') {
      const rect = canvasRef.current.getBoundingClientRect();
      setTooltip({
        text: `${def.label}: ${def.tooltip}`,
        x: e.clientX - rect.left + 10,
        y: e.clientY - rect.top - 10,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    if (!onRightClick) return;
    const pos = getTileAt(e);
    if (pos) onRightClick(pos.x, pos.y);
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    isDragging.current = false;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleRightClick}
        onMouseLeave={handleMouseLeave}
        style={{ border: '2px solid #446644', cursor: 'crosshair', display: 'block' }}
        tabIndex={-1}
      />
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x, top: tooltip.y,
          background: 'rgba(0,0,0,0.85)', color: '#eee', padding: '4px 8px',
          borderRadius: 4, fontSize: 11, pointerEvents: 'none', zIndex: 50,
          maxWidth: 220, whiteSpace: 'pre-wrap',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

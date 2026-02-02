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

  // Bucket body (trapezoid) - main fill
  ctx.fillStyle = '#6699cc';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.7);
  ctx.closePath();
  ctx.fill();

  // Shadow/depth on right side
  ctx.fillStyle = '#4477aa';
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.3, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.7);
  ctx.closePath();
  ctx.fill();

  // Highlight on left side
  ctx.fillStyle = '#88bbee';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.6);
  ctx.lineTo(cx - s * 0.2, cy + s * 0.3);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.3);
  ctx.closePath();
  ctx.fill();

  // Rim (top edge)
  ctx.strokeStyle = '#334455';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
  ctx.stroke();

  // Handle
  ctx.strokeStyle = '#556677';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.85, s * 0.55, Math.PI * 0.85, Math.PI * 0.15);
  ctx.stroke();

  // Handle connection points
  ctx.fillStyle = '#556677';
  ctx.beginPath();
  ctx.arc(cx - s * 0.4, cy - s * 0.6, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.4, cy - s * 0.6, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

// Draw wood logs on canvas
function drawWood(ctx, cx, cy, size) {
  const s = size * 0.32;

  // Bottom log - darker
  ctx.fillStyle = '#6b4910';
  ctx.fillRect(cx - s * 0.75, cy + s * 0.25, s * 1.5, s * 0.55);

  // Bottom log - bark texture
  ctx.fillStyle = '#5a3808';
  ctx.fillRect(cx - s * 0.75, cy + s * 0.25, s * 0.08, s * 0.55);
  ctx.fillRect(cx - s * 0.3, cy + s * 0.25, s * 0.08, s * 0.55);
  ctx.fillRect(cx + s * 0.2, cy + s * 0.25, s * 0.08, s * 0.55);

  // Bottom log - end cut rings
  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.arc(cx + s * 0.75, cy + s * 0.52, s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b4910';
  ctx.beginPath();
  ctx.arc(cx + s * 0.75, cy + s * 0.52, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a07818';
  ctx.beginPath();
  ctx.arc(cx + s * 0.75, cy + s * 0.52, s * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Top log - lighter
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(cx - s * 1.05, cy - s * 0.35, s * 2.1, s * 0.6);

  // Top log - highlight
  ctx.fillStyle = '#a58420';
  ctx.fillRect(cx - s * 1.05, cy - s * 0.35, s * 2.1, s * 0.18);

  // Top log - bark texture
  ctx.fillStyle = '#6b4910';
  ctx.fillRect(cx - s * 1.05, cy - s * 0.1, s * 0.09, s * 0.35);
  ctx.fillRect(cx - s * 0.5, cy - s * 0.1, s * 0.09, s * 0.35);
  ctx.fillRect(cx + s * 0.1, cy - s * 0.1, s * 0.09, s * 0.35);
  ctx.fillRect(cx + s * 0.7, cy - s * 0.1, s * 0.09, s * 0.35);

  // Top log - end cut rings
  ctx.fillStyle = '#9b7418';
  ctx.beginPath();
  ctx.arc(cx + s * 1.05, cy - s * 0.05, s * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7b5814';
  ctx.beginPath();
  ctx.arc(cx + s * 1.05, cy - s * 0.05, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b08820';
  ctx.beginPath();
  ctx.arc(cx + s * 1.05, cy - s * 0.05, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export default function Grid({ grid, onClick, onRightClick, onDrag, onHoldStart, onHoldEnd, playerPos, showHazardZones, tick = 0, hazardZoneOverrides, showTooltips = false, revealedTiles, viewportBounds }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const isDragging = useRef(false);
  const holdStartTime = useRef(null);
  const holdStartPos = useRef(null);

  // Calculate canvas dimensions based on viewport bounds
  const canvasWidth = viewportBounds
    ? (viewportBounds.maxX - viewportBounds.minX + 1) * TILE_SIZE
    : CANVAS_WIDTH;
  const canvasHeight = viewportBounds
    ? (viewportBounds.maxY - viewportBounds.minY + 1) * TILE_SIZE
    : CANVAS_HEIGHT;

  // Calculate offset for rendering
  const offsetX = viewportBounds ? viewportBounds.minX : 0;
  const offsetY = viewportBounds ? viewportBounds.minY : 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Determine the range of tiles to render
    const startX = viewportBounds ? viewportBounds.minX : 0;
    const startY = viewportBounds ? viewportBounds.minY : 0;
    const endX = viewportBounds ? viewportBounds.maxX : GRID_COLS - 1;
    const endY = viewportBounds ? viewportBounds.maxY : GRID_ROWS - 1;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        // Fog of war in solve mode
        if (revealedTiles && !revealedTiles.has(`${x},${y}`)) {
          ctx.fillStyle = '#000';
          ctx.fillRect((x - offsetX) * TILE_SIZE, (y - offsetY) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          continue;
        }

        const cell = grid[y][x];
        const def = TILE_TYPES[cell.type] || TILE_TYPES.empty;
        const px = (x - offsetX) * TILE_SIZE, py = (y - offsetY) * TILE_SIZE;
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
        // Skip zones outside viewport
        if (viewportBounds && (z.x < startX || z.x > endX || z.y < startY || z.y > endY)) continue;
        if (revealedTiles && !revealedTiles.has(`${z.x},${z.y}`)) continue;
        const zpx = (z.x - offsetX) * TILE_SIZE, zpy = (z.y - offsetY) * TILE_SIZE;
        ctx.fillStyle = z.hazardType === 'bear' ? '#8b4513' : '#ff4400';
        ctx.fillRect(zpx, zpy, TILE_SIZE, TILE_SIZE);
      }
      ctx.globalAlpha = 1;
    }

    // Player
    if (playerPos) {
      const ppx = (playerPos.x - offsetX) * TILE_SIZE, ppy = (playerPos.y - offsetY) * TILE_SIZE;
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧑', ppx + TILE_SIZE / 2, ppy + TILE_SIZE / 2);
    }
  }, [grid, playerPos, showHazardZones, tick, hazardZoneOverrides, revealedTiles, viewportBounds, canvasWidth, canvasHeight, offsetX, offsetY]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getTileAt = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const localX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const localY = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    const x = localX + offsetX;
    const y = localY + offsetY;
    if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) return { x, y };
    return null;
  };

  const handleMouseDown = (e) => {
    if (e.button === 2) return;
    const pos = getTileAt(e);
    if (pos) {
      // Start hold timer for interactions
      if (onHoldStart) {
        holdStartTime.current = Date.now();
        holdStartPos.current = pos;
        onHoldStart(pos.x, pos.y);
      }
      if (onClick) onClick(pos.x, pos.y, e);
    }
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
    // End hold interaction
    if (onHoldEnd && holdStartPos.current) {
      onHoldEnd();
    }
    holdStartTime.current = null;
    holdStartPos.current = null;
    isDragging.current = false;
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    if (!onRightClick) return;
    const pos = getTileAt(e);
    if (pos) onRightClick(pos.x, pos.y);
  };

  const handleMouseLeave = () => {
    // Cancel hold on mouse leave
    if (onHoldEnd && holdStartPos.current) {
      onHoldEnd();
    }
    holdStartTime.current = null;
    holdStartPos.current = null;
    setTooltip(null);
    isDragging.current = false;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
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

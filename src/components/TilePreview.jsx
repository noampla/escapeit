import { useRef, useEffect, useState, useMemo } from 'react';
import './TilePreview.css';

/**
 * TilePreview - Shows an enlarged animated preview of a tile when hovering
 * Theme-agnostic: works with any tile rendering (emoji or custom canvas)
 *
 * Props:
 * - tileType: string - The tile type to preview (e.g., 'water', 'item-key')
 * - theme: ThemeLoader instance
 * - lockColor: optional lock color for items like keys/doors
 */
export default function TilePreview({ tileType, theme, lockColor }) {
  const canvasRef = useRef(null);
  const [animationClass, setAnimationClass] = useState('');
  const prevTileType = useRef(null);

  // Compute tile info synchronously
  const tileInfo = useMemo(() => {
    if (!tileType) return null;

    const TILE_TYPES = theme?.getTileTypes() || {};
    const ITEM_TYPES = theme?.getItemTypes() || {};

    let tileDef = null;
    let itemType = null;

    // Check if it's an item tile
    if (tileType.startsWith('item-')) {
      itemType = tileType.replace('item-', '');
      tileDef = ITEM_TYPES[itemType] || TILE_TYPES[tileType];
    } else {
      tileDef = TILE_TYPES[tileType];
    }

    // Skip empty/ground tiles
    if (!tileType || tileType === 'empty' || tileType === 'ground') {
      return null;
    }

    const label = tileDef?.label || tileType;

    return { tileType, tileDef, itemType, label };
  }, [tileType, theme]);

  // Re-trigger animation when tile type changes
  useEffect(() => {
    if (tileType && tileType !== prevTileType.current) {
      prevTileType.current = tileType;
      // Reset and re-trigger animation
      setAnimationClass('');
      requestAnimationFrame(() => {
        setAnimationClass('animate');
      });
    }
  }, [tileType]);

  // Render canvas when tileInfo changes
  useEffect(() => {
    if (!tileInfo) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { tileType: type, tileDef, itemType } = tileInfo;
    const ctx = canvas.getContext('2d');
    const size = 120;

    ctx.clearRect(0, 0, size, size);

    // Draw background with theme color or default
    const bgColor = tileDef?.color || '#2a3a2a';
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 12);
    ctx.fill();

    const cx = size / 2;
    const cy = size / 2;

    // Try to render using theme methods
    let rendered = false;

    if (itemType) {
      // Render item with larger size
      const itemState = { lockColor };
      rendered = theme?.renderItem?.(ctx, itemType, 0, 0, size, itemState);
      if (!rendered) {
        const emoji = theme?.getItemEmoji?.(itemType);
        if (emoji) {
          ctx.font = '72px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, cx, cy);
          rendered = true;
        }
      }
    } else {
      // Render tile
      const tile = { type, config: { lockColor } };
      rendered = theme?.renderTile?.(ctx, tile, cx, cy, size);
      if (!rendered) {
        const emoji = theme?.getTileEmoji?.(type);
        if (emoji) {
          ctx.font = '72px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, cx, cy);
          rendered = true;
        }
      }
    }

    // Fallback emojis
    if (!rendered) {
      const fallbackEmojis = {
        tree: '🌲', water: '🌊', snow: '❄️', raft: '🛶',
        campfire: '🏕️', car: '🚗', fire: '🔥', bear: '🐻',
        wall: '🧱', door: '🚪', start: '🚪', exit: '🚐',
        'door-key': '🚪', 'door-card': '🚪',
        'item-key': '🔑', 'item-axe': '🪓', 'item-bucket': '🪣',
        'item-card': '💳', 'item-vial': '🧪', 'item-rope': '🧵',
        'item-knife': '🔪', 'item-sweater': '🧥', 'item-wood': '🪵',
        floor: '⬜', empty: '⬛', ground: '🟫',
      };
      const emoji = fallbackEmojis[type];
      if (emoji) {
        ctx.font = '72px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, cx, cy);
        rendered = true;
      }
    }

    // Ultimate fallback: draw the tile type text
    if (!rendered) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type || '?', cx, cy);
    }
  }, [tileInfo, theme, lockColor]);

  // Don't render if no valid tile info
  if (!tileInfo) return null;

  return (
    <div className="tile-preview-overlay">
      <div className={`tile-preview-container ${animationClass}`}>
        <canvas
          ref={canvasRef}
          className="tile-preview-canvas"
          width={120}
          height={120}
        />
        <div className="tile-preview-label">
          {tileInfo.label}
        </div>
      </div>
    </div>
  );
}

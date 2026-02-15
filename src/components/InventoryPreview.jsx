import { useRef, useEffect, useState, useMemo } from 'react';
import './TilePreview.css'; // Reuse the same CSS animations
import soundManager from '../engine/soundManager.js';

/**
 * InventoryPreview - Shows an enlarged preview of an inventory item when hovering
 * Theme-agnostic: works with any item rendering (emoji or custom canvas)
 * For drawing boards, uses description as label if available
 *
 * Props:
 * - item: { itemType, lockColor, drawingData, description, imageId, ... }
 * - theme: ThemeLoader instance
 */
export default function InventoryPreview({ item, theme }) {
  const canvasRef = useRef(null);
  const [animationClass, setAnimationClass] = useState('');
  const prevItemType = useRef(null);

  // Compute item info synchronously
  const itemInfo = useMemo(() => {
    if (!item?.itemType) return null;

    const ITEM_TYPES = theme?.getItemTypes() || {};
    const itemDef = ITEM_TYPES[item.itemType];
    const defaultLabel = theme?.getItemLabel?.(item.itemType, item) || itemDef?.label || item.itemType;

    // For drawing boards, prefer description over default label
    const label = item.description || defaultLabel;

    return {
      itemType: item.itemType,
      itemDef,
      label,
    };
  }, [item, theme]);

  // Re-trigger animation and play sound when item changes
  useEffect(() => {
    if (item?.itemType && item.itemType !== prevItemType.current) {
      prevItemType.current = item.itemType;
      setAnimationClass('');
      requestAnimationFrame(() => {
        setAnimationClass('animate');
      });
      // Play hover sound
      soundManager.play('hover');
    }
  }, [item?.itemType]);

  // Render canvas when itemInfo changes
  useEffect(() => {
    if (!itemInfo) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 120;

    ctx.clearRect(0, 0, size, size);

    // Draw white background for better visibility
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 12);
    ctx.fill();

    // Render item using theme's method
    const itemState = { ...item };
    let rendered = theme?.renderInventoryItem?.(ctx, itemInfo.itemType, 0, 0, size, itemState);

    if (!rendered) {
      // Fallback to emoji
      const emoji = theme?.getItemEmoji?.(itemInfo.itemType);
      if (emoji) {
        ctx.font = '72px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size / 2, size / 2);
        rendered = true;
      }
    }

    // Ultimate fallback
    if (!rendered) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(itemInfo.itemType, size / 2, size / 2);
    }
  }, [itemInfo, theme, item]);

  if (!itemInfo) return null;

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
          {itemInfo.label}
        </div>
      </div>
    </div>
  );
}

// Mad Science Lab Theme - Item Definitions

import { LOCK_COLORS } from './tiles.js';

export const ITEM_TYPES = {
  card: {
    label: 'Keycard',
    emoji: null, // Custom render
    color: '#e8e8f0',
    description: 'Security access keycard'
  }
};

// Render item on canvas (custom rendering)
// x, y are TOP-LEFT corner of the tile
export function renderItem(ctx, itemType, x, y, size, state = {}) {
  if (itemType === 'card') {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const lockColor = state?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Card body
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(cx - size * 0.28, cy - size * 0.18, size * 0.56, size * 0.36);

    // Colored stripe
    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.28, cy - size * 0.18, size * 0.56, size * 0.1);

    // Chip
    ctx.fillStyle = '#daa520';
    ctx.fillRect(cx - size * 0.18, cy + size * 0.02, size * 0.14, size * 0.1);

    // Chip lines
    ctx.strokeStyle = '#aa8510';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.18, cy + size * 0.07);
    ctx.lineTo(cx - size * 0.04, cy + size * 0.07);
    ctx.moveTo(cx - size * 0.11, cy + size * 0.02);
    ctx.lineTo(cx - size * 0.11, cy + size * 0.12);
    ctx.stroke();

    // Magnetic stripe
    ctx.fillStyle = '#333';
    ctx.fillRect(cx + size * 0.05, cy + size * 0.02, size * 0.18, size * 0.06);

    return true;
  }

  return false;
}

// Render item in inventory (same as renderItem)
export function renderInventoryItem(ctx, itemType, x, y, size, state = {}) {
  return renderItem(ctx, itemType, x, y, size, state);
}

// Get emoji for item
export function getItemEmoji(itemType) {
  return null; // All custom rendered
}

// Get label for item (with state info)
export function getItemLabel(itemType, state = {}) {
  const item = ITEM_TYPES[itemType];
  if (!item) return itemType;

  // Handle colored items
  if (itemType === 'card' && state?.lockColor) {
    const colorLabel = LOCK_COLORS[state.lockColor]?.label || state.lockColor;
    return `${colorLabel} ${item.label}`;
  }

  return item.label;
}

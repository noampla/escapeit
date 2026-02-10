// Mad Science Lab Theme - Item Definitions

import { LOCK_COLORS } from './tiles.js';

export const ITEM_TYPES = {
  // Security & Access
  card: {
    label: 'Keycard',
    emoji: null, // Custom render
    color: '#e8e8f0',
    description: 'Security access keycard'
  },

  // Chemistry System
  chemical: {
    label: 'Chemical Vial',
    emoji: null, // Custom render with color variants
    color: '#88ccff',
    description: 'Sealed chemical vial - color indicates compound type'
  },

  // Technology
  tablet: {
    label: 'Data Tablet',
    emoji: '📱',
    color: '#4488cc',
    description: 'Electronic tablet for accessing lab terminals. Use with power cell to disable lasers.'
  },

  // Power & Energy
  battery: {
    label: 'Power Cell',
    emoji: '🔋',
    color: '#44ff44',
    description: 'High-capacity power cell. Required to activate terminals and disable laser grids.'
  },

  // Protection
  hazmat: {
    label: 'Hazmat Suit',
    emoji: '🦺',
    color: '#ffaa00',
    description: 'Full hazmat suit - protects from toxic environments. Press E to wear.',
    wearable: true,
    wearSlot: 'body'
  },

  // Medical
  medkit: {
    label: 'Medical Kit',
    emoji: '⚕️',
    color: '#ff4444',
    description: 'Emergency medical supplies. Press E to use and restore 1 life.'
  }
};

// Render item on canvas (custom rendering)
// x, y are TOP-LEFT corner of the tile
export function renderItem(ctx, itemType, x, y, size, state = {}) {
  const cx = x + size / 2;
  const cy = y + size / 2;

  if (itemType === 'card') {
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

  if (itemType === 'chemical') {
    const lockColor = state?.lockColor || 'red';
    const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

    // Vial body (glass with transparency)
    ctx.fillStyle = 'rgba(200, 220, 240, 0.3)';
    ctx.fillRect(cx - size * 0.12, cy - size * 0.2, size * 0.24, size * 0.35);

    // Vial outline
    ctx.strokeStyle = 'rgba(200, 220, 240, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - size * 0.12, cy - size * 0.2, size * 0.24, size * 0.35);

    // Chemical liquid (colored, with glow effect)
    const liquidHeight = size * 0.28;
    const liquidY = cy + size * 0.15 - liquidHeight;

    // Glow effect
    ctx.fillStyle = colorData.glow;
    ctx.fillRect(cx - size * 0.14, liquidY, size * 0.28, liquidHeight);

    // Liquid
    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.12, liquidY, size * 0.24, liquidHeight);

    // Bubbles in liquid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - size * 0.05, liquidY + size * 0.08, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size * 0.04, liquidY + size * 0.15, size * 0.025, 0, Math.PI * 2);
    ctx.fill();

    // Cap (metal)
    ctx.fillStyle = '#555';
    ctx.fillRect(cx - size * 0.14, cy - size * 0.25, size * 0.28, size * 0.05);

    // Cap highlight
    ctx.fillStyle = '#777';
    ctx.fillRect(cx - size * 0.14, cy - size * 0.25, size * 0.28, size * 0.02);

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
  const item = ITEM_TYPES[itemType];
  return item?.emoji || null;
}

// Get label for item (with state info)
export function getItemLabel(itemType, state = {}) {
  const item = ITEM_TYPES[itemType];
  if (!item) return itemType;

  // Handle colored items (keycard and chemical vials)
  if ((itemType === 'card' || itemType === 'chemical') && state?.lockColor) {
    const colorLabel = LOCK_COLORS[state.lockColor]?.label || state.lockColor;
    return `${colorLabel} ${item.label}`;
  }

  return item.label;
}

// Define wearable items and their effects
export const WEARABLES = {
  hazmat: {
    label: 'Hazmat Suit',
    slot: 'body',
    effects: {
      hazardImmunity: ['toxic_spill', 'radiation', 'broken-glass']
    }
  }
};

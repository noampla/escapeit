// Bank Robbery Theme - Item Definitions

// Lock colors (same as in tiles.js) - exported for use by engine
export const LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444', dark: '#882222' },
  blue: { label: 'Blue', color: '#4444cc', dark: '#222288' },
  green: { label: 'Green', color: '#44cc44', dark: '#228822' },
  yellow: { label: 'Yellow', color: '#cccc44', dark: '#888822' },
  purple: { label: 'Purple', color: '#cc44cc', dark: '#882288' }
};

export const ITEM_TYPES = {
  key: {
    label: 'Key',
    emoji: null, // Custom rendered
    color: '#ffdd00',
    description: 'Opens matching colored key doors'
  },
  card: {
    label: 'Keycard',
    emoji: null, // Custom rendered
    color: '#aaaacc',
    description: 'Opens matching colored card doors'
  },
  uniform: {
    label: 'Guard Uniform',
    emoji: null, // Custom rendered
    color: '#2244aa',
    description: 'Wear to become invisible to cameras',
    wearable: true,
    wearSlot: 'body'
  }
};

// Define wearable items and their effects
export const WEARABLES = {
  uniform: {
    label: 'Guard Uniform',
    slot: 'body',
    effects: {
      cameraImmunity: true
    }
  }
};

export function renderItem(ctx, itemType, x, y, size, state = null) {
  const lockColor = state?.lockColor || 'red';
  const colorData = LOCK_COLORS[lockColor] || LOCK_COLORS.red;

  // Key item (in inventory)
  if (itemType === 'key') {
    const cx = x + size / 2;
    const cy = y + size / 2;

    ctx.fillStyle = colorData.color;

    // Key head (circle)
    ctx.beginPath();
    ctx.arc(cx - size * 0.15, cy, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Key hole in head
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx - size * 0.15, cy, size * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Key shaft
    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.05, cy - size * 0.05, size * 0.4, size * 0.1);

    // Key teeth
    ctx.fillRect(cx + size * 0.2, cy, size * 0.08, size * 0.15);
    ctx.fillRect(cx + size * 0.1, cy, size * 0.06, size * 0.1);

    return true;
  }

  // Card item (in inventory)
  if (itemType === 'card') {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Card body
    ctx.fillStyle = '#eee';
    ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.4);

    // Colored stripe
    ctx.fillStyle = colorData.color;
    ctx.fillRect(cx - size * 0.3, cy - size * 0.2, size * 0.6, size * 0.12);

    // Chip
    ctx.fillStyle = '#daa520';
    ctx.fillRect(cx - size * 0.2, cy, size * 0.15, size * 0.12);

    return true;
  }

  // Uniform item
  if (itemType === 'uniform') {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const s = size * 0.4;

    // Guard uniform (shirt shape)
    ctx.fillStyle = '#2244aa';

    // Body
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.6, cy - s * 0.3);
    ctx.lineTo(cx + s * 0.6, cy - s * 0.3);
    ctx.lineTo(cx + s * 0.7, cy + s * 0.8);
    ctx.lineTo(cx - s * 0.7, cy + s * 0.8);
    ctx.closePath();
    ctx.fill();

    // Collar
    ctx.fillStyle = '#1a3377';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.3, cy - s * 0.3);
    ctx.lineTo(cx, cy - s * 0.1);
    ctx.lineTo(cx + s * 0.3, cy - s * 0.3);
    ctx.lineTo(cx + s * 0.2, cy - s * 0.5);
    ctx.lineTo(cx, cy - s * 0.3);
    ctx.lineTo(cx - s * 0.2, cy - s * 0.5);
    ctx.closePath();
    ctx.fill();

    // Badge
    ctx.fillStyle = '#daa520';
    ctx.beginPath();
    ctx.arc(cx + s * 0.3, cy, s * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Buttons
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.1, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.4, s * 0.08, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  return false;
}

export function getItemEmoji(itemType) {
  const item = ITEM_TYPES[itemType];
  return item?.emoji || null;
}

// Get display label for item with color info
export function getItemLabel(itemType, state = null) {
  const item = ITEM_TYPES[itemType];
  const baseLabel = item?.label || itemType;

  if ((itemType === 'key' || itemType === 'card') && state?.lockColor) {
    const colorData = LOCK_COLORS[state.lockColor];
    return `${colorData?.label || state.lockColor} ${baseLabel}`;
  }

  return baseLabel;
}

// Render inventory item (same as renderItem for bank robbery)
export function renderInventoryItem(ctx, itemType, x, y, size, state = null) {
  return renderItem(ctx, itemType, x, y, size, state);
}

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
  },
  mirror: {
    label: 'Mirror',
    emoji: null, // Custom rendered
    color: '#ccddee',
    description: 'Blocks laser beams when placed on the ground'
  },
  drill: {
    label: 'Drill',
    emoji: null, // Custom rendered
    color: '#ff8800',
    description: 'Power drill for opening vault doors'
  },
  bomb: {
    label: 'Bomb',
    emoji: null, // Custom rendered
    color: '#cc2222',
    description: 'Explosive. Place near vault doors and detonate remotely.'
  },
  detonator: {
    label: 'Detonator',
    emoji: null, // Custom rendered
    color: '#ffcc00',
    description: 'Triggers placed bombs. Stay at safe distance!'
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

  // Drill item
  if (itemType === 'drill') {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Drill body (main housing - orange)
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(cx - size * 0.25, cy - size * 0.12, size * 0.4, size * 0.24);

    // Drill chuck (front part - metal)
    ctx.fillStyle = '#666';
    ctx.fillRect(cx + size * 0.15, cy - size * 0.08, size * 0.12, size * 0.16);

    // Drill bit (pointed metal)
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.27, cy - size * 0.04);
    ctx.lineTo(cx + size * 0.4, cy);
    ctx.lineTo(cx + size * 0.27, cy + size * 0.04);
    ctx.closePath();
    ctx.fill();

    // Handle (black grip)
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - size * 0.25, cy + size * 0.08, size * 0.2, size * 0.15);

    // Trigger
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - size * 0.1, cy + size * 0.02, size * 0.08, size * 0.1);

    return true;
  }

  // Bomb item (in inventory)
  if (itemType === 'bomb') {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Bomb body (cylinder shape)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.05, size * 0.2, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red stripes
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(cx - size * 0.16, cy - size * 0.08, size * 0.32, size * 0.07);
    ctx.fillRect(cx - size * 0.16, cy + size * 0.08, size * 0.32, size * 0.07);

    // Fuse/wire on top
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.2);
    ctx.quadraticCurveTo(cx + size * 0.12, cy - size * 0.28, cx + size * 0.08, cy - size * 0.35);
    ctx.stroke();

    // Blinking light
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.2, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    return true;
  }

  // Detonator item (in inventory)
  if (itemType === 'detonator') {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Detonator box body
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - size * 0.18, cy - size * 0.12, size * 0.36, size * 0.3);

    // Yellow warning stripes
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(cx - size * 0.18, cy - size * 0.12, size * 0.36, size * 0.05);
    ctx.fillRect(cx - size * 0.18, cy + size * 0.13, size * 0.36, size * 0.05);

    // Red button on top
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.02, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Button highlight
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx - size * 0.02, cy, size * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // Antenna
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.1, cy - size * 0.12);
    ctx.lineTo(cx + size * 0.1, cy - size * 0.3);
    ctx.stroke();

    return true;
  }

  // Mirror item
  if (itemType === 'mirror') {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Handle (wooden frame bottom)
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(cx - size * 0.06, cy + size * 0.15, size * 0.12, size * 0.28);

    // Mirror frame (dark border)
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - size * 0.28, cy - size * 0.32, size * 0.56, size * 0.5);

    // Mirror glass (light reflective surface)
    ctx.fillStyle = '#d8eaf5';
    ctx.fillRect(cx - size * 0.24, cy - size * 0.28, size * 0.48, size * 0.42);

    // Reflection highlight (top-left diagonal streak)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, cy - size * 0.26);
    ctx.lineTo(cx - size * 0.05, cy - size * 0.26);
    ctx.lineTo(cx - size * 0.2, cy - size * 0.1);
    ctx.closePath();
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

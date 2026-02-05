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
  },
  bag: {
    label: 'Duffel Bag',
    emoji: null, // Custom rendered
    color: '#4a3a2a',
    description: 'Equip to collect money. Press E to equip.',
    isContainer: true,
    containerSlot: 'bag',
    accepts: ['money'], // What item types can go in this container
  },
  money: {
    label: 'Cash',
    emoji: null, // Custom rendered
    color: '#55aa55',
    description: 'Cold hard cash. Requires equipped bag to collect.'
  },
  poison: {
    label: 'Poison Bottle',
    emoji: null, // Custom rendered
    color: '#884499',
    description: 'Use on guards to knock them out. Press E on a guard.'
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

// Define container items (bags, etc.)
export const CONTAINERS = {
  bag: {
    label: 'Duffel Bag',
    slot: 'bag',
    accepts: ['money'],
    defaultCapacity: 100000, // Default max money ($100K)
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

  // Bag item (duffel bag)
  if (itemType === 'bag') {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Main bag body (rounded rectangle shape)
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.05, size * 0.35, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Darker bottom
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.12, size * 0.32, size * 0.15, 0, 0, Math.PI);
    ctx.fill();

    // Zipper line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.28, cy - size * 0.02);
    ctx.lineTo(cx + size * 0.28, cy - size * 0.02);
    ctx.stroke();

    // Zipper pull
    ctx.fillStyle = '#888';
    ctx.fillRect(cx + size * 0.15, cy - size * 0.08, size * 0.08, size * 0.12);

    // Handles
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - size * 0.15, cy - size * 0.12, size * 0.1, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + size * 0.15, cy - size * 0.12, size * 0.1, Math.PI, 0);
    ctx.stroke();

    return true;
  }

  // Money item (cash stack) - simple design with prominent amount
  if (itemType === 'money') {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const amount = state?.amount || 50000;

    // Format amount with K/M suffix
    let amountText;
    if (amount >= 1000000) {
      amountText = `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
    } else if (amount >= 1000) {
      amountText = `${Math.floor(amount / 1000)}K`;
    } else {
      amountText = `${amount}`;
    }

    // Green background circle
    ctx.fillStyle = '#3a6a3a';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.08, size * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Dollar sign - large and centered
    ctx.fillStyle = '#88dd88';
    ctx.font = `bold ${size * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy - size * 0.08);

    // Amount label at bottom with background
    ctx.font = `bold ${size * 0.28}px sans-serif`;
    const textY = cy + size * 0.38;
    const textWidth = ctx.measureText(amountText).width;

    // Dark background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(cx - textWidth / 2 - 4, textY - size * 0.14, textWidth + 8, size * 0.28, 4);
    ctx.fill();

    // Amount text in bright green
    ctx.fillStyle = '#66ff66';
    ctx.fillText(amountText, cx, textY);

    return true;
  }

  // Poison bottle item (in inventory)
  if (itemType === 'poison') {
    const cx = x + size / 2;
    const cy = y + size / 2;

    // Bottle body (glass - purple tint)
    ctx.fillStyle = '#aa88cc';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.05, size * 0.15, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bottle neck
    ctx.fillStyle = '#9977bb';
    ctx.fillRect(cx - size * 0.08, cy - size * 0.2, size * 0.16, size * 0.15);

    // Cork/cap
    ctx.fillStyle = '#553333';
    ctx.fillRect(cx - size * 0.09, cy - size * 0.25, size * 0.18, size * 0.05);

    // Skull symbol on bottle (danger)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.05, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Skull eye sockets
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - size * 0.04, cy + size * 0.02, size * 0.02, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.04, cy + size * 0.02, size * 0.02, 0, Math.PI * 2);
    ctx.fill();

    // Skull nose
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.06);
    ctx.lineTo(cx - size * 0.02, cy + size * 0.1);
    ctx.lineTo(cx + size * 0.02, cy + size * 0.1);
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

// Format money amount with K/M suffix
function formatMoney(amount) {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
  } else if (amount >= 1000) {
    return `$${Math.floor(amount / 1000)}K`;
  }
  return `$${amount}`;
}

// Get display label for item with color info
export function getItemLabel(itemType, state = null) {
  const item = ITEM_TYPES[itemType];
  const baseLabel = item?.label || itemType;

  if ((itemType === 'key' || itemType === 'card') && state?.lockColor) {
    const colorData = LOCK_COLORS[state.lockColor];
    return `${colorData?.label || state.lockColor} ${baseLabel}`;
  }

  // Show money amount
  if (itemType === 'money' && state?.amount) {
    return formatMoney(state.amount);
  }

  // Show bag contents with formatted amount
  if (itemType === 'bag' && state?.contents !== undefined) {
    return `${baseLabel} (${formatMoney(state.contents)})`;
  }

  return baseLabel;
}

// Check if an item type is a container
export function isContainer(itemType) {
  return ITEM_TYPES[itemType]?.isContainer === true;
}

// Get container definition
export function getContainerDef(itemType) {
  return CONTAINERS[itemType] || null;
}

// Render inventory item (same as renderItem for bank robbery)
export function renderInventoryItem(ctx, itemType, x, y, size, state = null) {
  return renderItem(ctx, itemType, x, y, size, state);
}

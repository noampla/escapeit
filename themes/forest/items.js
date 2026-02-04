// Forest theme item definitions
export const ITEM_TYPES = {
  key: {
    label: 'Key',
    emoji: '🔑',
    color: '#ffdd00',
    description: 'Opens locked doors and exits'
  },
  axe: {
    label: 'Axe',
    emoji: '🪓',
    color: '#aa6633',
    description: 'Used to chop trees for wood'
  },
  bucket: {
    label: 'Bucket',
    emoji: null,  // Custom draw
    color: '#5588bb',
    draw: 'bucket',
    description: 'Fill with water to extinguish fires',
    states: {
      empty: { label: 'Empty Bucket', filled: false },
      filled: { label: 'Filled Bucket', filled: true }
    },
    defaultState: 'empty'
  },
  rope: {
    label: 'Rope',
    emoji: '🧵',
    color: '#aa8855',
    description: 'Combine with wood to build rafts'
  },
  knife: {
    label: 'Knife',
    emoji: '🔪',
    color: '#cccccc',
    description: 'Defeat bears to get sweater'
  },
  sweater: {
    label: 'Sweater',
    emoji: '🧥',
    color: '#cc4466',
    description: 'Walk through snowy areas'
  },
  wood: {
    label: 'Wood',
    emoji: null,  // Custom draw
    color: '#8b6914',
    draw: 'wood',
    description: 'Combine with rope to build rafts'
  },
  raft: {
    label: 'Raft',
    emoji: '🛶',
    color: '#8b6914',
    description: 'Place on water to travel across'
  },
};

// Custom rendering for bucket
function drawBucket(ctx, cx, cy, size, filled = false) {
  const s = size * 0.28;

  // Colors change based on filled state
  const bodyColor = filled ? '#4488dd' : '#888888';
  const shadowColor = filled ? '#2266bb' : '#666666';
  const highlightColor = filled ? '#6699ff' : '#aaaaaa';
  const rimColor = filled ? '#1a4488' : '#444444';
  const handleColor = filled ? '#556677' : '#555555';

  // Bucket body (trapezoid) - main fill
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.8);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.8);
  ctx.closePath();
  ctx.fill();

  // Shadow/depth on right side
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.3, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.8);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.8);
  ctx.closePath();
  ctx.fill();

  // Highlight on left side
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.2, cy + s * 0.4);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.4);
  ctx.closePath();
  ctx.fill();

  // Rim (top edge)
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.8, cy - s * 0.3);
  ctx.stroke();

  // Handle
  ctx.strokeStyle = handleColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.5, s * 0.55, Math.PI * 0.85, Math.PI * 0.15);
  ctx.stroke();

  // Handle connection points
  ctx.fillStyle = handleColor;
  ctx.beginPath();
  ctx.arc(cx - s * 0.7, cy - s * 0.3, s * 0.12, 0, Math.PI * 2);
  ctx.arc(cx + s * 0.7, cy - s * 0.3, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

// Custom rendering for wood
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

// Render item on canvas
// state: for stateful items like bucket (filled/empty)
export function renderItem(ctx, itemType, x, y, size, state = null) {
  const item = ITEM_TYPES[itemType];
  if (!item) return false;

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Custom drawing
  if (item.draw === 'bucket') {
    // Explicitly check if filled is true, otherwise render as empty (false)
    const isFilled = state?.filled === true;
    drawBucket(ctx, cx, cy, size, isFilled);
    return true;
  }

  if (item.draw === 'wood') {
    drawWood(ctx, cx, cy, size);
    return true;
  }

  // Emoji rendering (handled by Grid component)
  return false;
}

// Get emoji for item
export function getItemEmoji(itemType) {
  const item = ITEM_TYPES[itemType];
  return item?.emoji || null;
}

// Lock colors for keys and cards
export const LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444' },
  blue: { label: 'Blue', color: '#4444cc' },
  green: { label: 'Green', color: '#44cc44' },
  yellow: { label: 'Yellow', color: '#cccc44' },
  purple: { label: 'Purple', color: '#cc44cc' },
};

// Draw a key icon
export function drawKey(ctx, cx, cy, size, lockColor = 'red') {
  const s = size * 0.3;
  const color = LOCK_COLORS[lockColor]?.color || '#cc4444';

  // Key head (circle)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - s * 0.3, cy - s * 0.2, s * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Key hole
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(cx - s * 0.3, cy - s * 0.2, s * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Key shaft
  ctx.fillStyle = color;
  ctx.fillRect(cx - s * 0.1, cy - s * 0.15, s * 1.1, s * 0.3);

  // Key teeth
  ctx.fillRect(cx + s * 0.5, cy + s * 0.15, s * 0.15, s * 0.25);
  ctx.fillRect(cx + s * 0.75, cy + s * 0.15, s * 0.15, s * 0.35);

  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(cx - s * 0.4, cy - s * 0.35, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

// Draw a card/keycard icon
export function drawCard(ctx, cx, cy, size, lockColor = 'red') {
  const s = size * 0.3;
  const color = LOCK_COLORS[lockColor]?.color || '#cc4444';

  // Card body
  ctx.fillStyle = color;
  const cardWidth = s * 1.4;
  const cardHeight = s * 0.9;
  const radius = s * 0.15;

  // Rounded rectangle
  ctx.beginPath();
  ctx.moveTo(cx - cardWidth/2 + radius, cy - cardHeight/2);
  ctx.lineTo(cx + cardWidth/2 - radius, cy - cardHeight/2);
  ctx.quadraticCurveTo(cx + cardWidth/2, cy - cardHeight/2, cx + cardWidth/2, cy - cardHeight/2 + radius);
  ctx.lineTo(cx + cardWidth/2, cy + cardHeight/2 - radius);
  ctx.quadraticCurveTo(cx + cardWidth/2, cy + cardHeight/2, cx + cardWidth/2 - radius, cy + cardHeight/2);
  ctx.lineTo(cx - cardWidth/2 + radius, cy + cardHeight/2);
  ctx.quadraticCurveTo(cx - cardWidth/2, cy + cardHeight/2, cx - cardWidth/2, cy + cardHeight/2 - radius);
  ctx.lineTo(cx - cardWidth/2, cy - cardHeight/2 + radius);
  ctx.quadraticCurveTo(cx - cardWidth/2, cy - cardHeight/2, cx - cardWidth/2 + radius, cy - cardHeight/2);
  ctx.closePath();
  ctx.fill();

  // Magnetic stripe
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - cardWidth/2 + s * 0.1, cy - s * 0.1, cardWidth - s * 0.2, s * 0.2);

  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(cx - cardWidth/2 + s * 0.1, cy - cardHeight/2 + s * 0.08, cardWidth * 0.4, s * 0.15);
}

// Render inventory item (for HUD display)
// This is similar to renderItem but optimized for inventory icons
export function renderInventoryItem(ctx, itemType, x, y, size, state = null) {
  const item = ITEM_TYPES[itemType];
  if (!item) return false;

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Custom drawing for stateful items
  if (item.draw === 'bucket') {
    const isFilled = state?.filled === true;
    drawBucket(ctx, cx, cy, size, isFilled);
    return true;
  }

  if (item.draw === 'wood') {
    drawWood(ctx, cx, cy, size);
    return true;
  }

  // Key with lock color
  if (itemType === 'key' && state?.lockColor) {
    drawKey(ctx, cx, cy, size, state.lockColor);
    return true;
  }

  // Card with lock color
  if (itemType === 'card' && state?.lockColor) {
    drawCard(ctx, cx, cy, size, state.lockColor);
    return true;
  }

  // Emoji rendering (handled by caller)
  return false;
}

// Get item label with state
export function getItemLabel(itemType, state = null) {
  const item = ITEM_TYPES[itemType];
  if (!item) return itemType;

  // For bucket, show filled/empty state
  if (itemType === 'bucket') {
    return state?.filled ? 'Filled Bucket' : 'Empty Bucket';
  }

  // For key/card, show color
  if ((itemType === 'key' || itemType === 'card') && state?.lockColor) {
    const colorLabel = LOCK_COLORS[state.lockColor]?.label || state.lockColor;
    return `${colorLabel} ${item.label}`;
  }

  return item.label;
}

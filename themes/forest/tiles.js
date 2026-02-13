// Forest theme tile definitions
export const TILE_TYPES = {
  empty: {
    label: 'Empty',
    color: '#0a0a0a',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Empty void. Not walkable.',
    walkable: false
  },
  ground: {
    label: 'Ground',
    color: '#3d5a28',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Walkable forest ground.',
    walkable: true
  },
  tree: {
    label: 'Tree',
    color: '#2d4a1a',
    category: 'basic',
    layer: 'object',
    configurable: false,
    defaultConfig: {},
    tooltip: 'Blocks movement. Cut with axe (hold E) to get wood.',
    walkable: false
  },
  boulder: {
    label: 'Boulder',
    color: '#5a5a5a',
    category: 'basic',
    layer: 'object',
    configurable: false,
    defaultConfig: {},
    tooltip: 'Large rock. Blocks movement.',
    walkable: false
  },
  'thorny-bush': {
    label: 'Thorny Bush',
    color: '#4a6b3a',
    category: 'basic',
    layer: 'object',
    configurable: false,
    defaultConfig: {},
    tooltip: 'Dense thorny bush. Blocks movement. Clear with knife (hold E).',
    walkable: false
  },
  water: {
    label: 'Water',
    color: '#2266aa',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Blocks movement. Build a raft (hold E with Rope + Wood), then face water and press Q to place it.',
    walkable: false
  },
  snow: {
    label: 'Snow',
    color: '#ddeeff',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Blocks movement unless wearing a Sweater (press T). Can place items here.',
    walkable: true  // Base walkable so objects can be placed in builder; conditional in gameplay
  },
  raft: {
    label: 'Raft',
    color: '#6699aa',
    category: null,
    layer: 'object',
    tooltip: 'Walkable water. Face it and press F to pick up, Q to place on water.',
    walkable: true
  },
  campfire: {
    label: 'Campfire (Start)',
    color: '#cc6600',
    category: 'basic',
    layer: 'floor',
    unique: true,
    tooltip: 'Player spawn point. Only one per level.',
    walkable: true
  },
  car: {
    label: 'Car (Exit)',
    color: '#4488cc',
    category: 'basic',
    layer: 'floor',
    unique: true,
    configurable: true,
    defaultConfig: { needsKey: true },
    tooltip: 'Level exit. Reach here after completing all missions.',
    walkable: true
  },

  // Individual item tiles
  'item-key': {
    label: 'Key',
    color: '#ffdd00',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'key',
    tooltip: 'Collectible key. Press F to pick up.',
    walkable: true
  },
  'item-axe': {
    label: 'Axe',
    color: '#aa6633',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'axe',
    tooltip: 'Collectible axe. Press F to pick up. Use to cut trees.',
    walkable: true
  },
  'item-bucket': {
    label: 'Bucket',
    color: '#5588bb',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'bucket',
    tooltip: 'Collectible bucket. Press F to pick up. Fill at water, use on fire.',
    walkable: true
  },
  'item-rope': {
    label: 'Rope',
    color: '#aa8855',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'rope',
    tooltip: 'Collectible rope. Press F to pick up. Combine with wood to build raft.',
    walkable: true
  },
  'item-knife': {
    label: 'Knife',
    color: '#cccccc',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'knife',
    tooltip: 'Collectible knife. Press F to pick up. Defeat bears.',
    walkable: true
  },
  'item-machete': {
    label: 'Machete',
    color: '#888888',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'machete',
    tooltip: 'Collectible machete. Press F to pick up. Cut thorny bushes.',
    walkable: true
  },
  'item-stick': {
    label: 'Stick',
    color: '#8b6914',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'stick',
    tooltip: 'Collectible stick. Press F to pick up. Light at fire to make torch.',
    walkable: true
  },
  'item-torch': {
    label: 'Torch',
    color: '#ff8800',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'torch',
    tooltip: 'Collectible lit torch. Press F to pick up. Provides light.',
    walkable: true
  },
  'item-sweater': {
    label: 'Sweater',
    color: '#cc4466',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'sweater',
    tooltip: 'Collectible sweater. Press F to pick up, T to wear. Walk through snow when worn.',
    walkable: true
  },
  'item-wood': {
    label: 'Wood',
    color: '#8b6914',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'wood',
    tooltip: 'Collectible wood. Press F to pick up. Combine with rope to build raft.',
    walkable: true
  },
  'item-raft': {
    label: 'Raft',
    color: '#8b6914',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'raft',
    tooltip: 'Collectible raft. Press F to pick up. Face water and press Q to place.',
    walkable: true
  },

  friend: {
    label: 'Lost Friend',
    color: '#ff88cc',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: { name: 'Friend' },
    tooltip: 'Lost friend. Hold E to rescue.',
    walkable: true
  },
  fire: {
    label: 'Fire',
    color: '#ff4400',
    category: 'hazard',
    layer: 'object',
    tooltip: 'Damaging hazard. Stepping on it costs a life. Extinguish with filled Bucket (hold E nearby).',
    walkable: true  // Walkable but causes damage
  },
  bear: {
    label: 'Bear',
    color: '#8b4513',
    category: 'hazard',
    layer: 'object',
    tooltip: 'Without Knife: lose a life, pushed back. With Knife: bear defeated, get Sweater.',
    walkable: false  // Special: walkable with knife
  },
  'ancient-gate': {
    label: 'Ancient Gate',
    color: '#7a6a5a',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: {
      pathTiles: [],  // Array of {x, y} coordinates in the correct order
      isOpen: false   // Runtime state - whether the gate is currently open
    },
    tooltip: 'Ancient stone gate. Create a path by clicking tiles in order. Walk the path correctly to open.',
    walkable: false  // Not walkable until path is completed
  },
  sign: {
    label: 'Sign',
    color: '#8b7355',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: { message: 'Press E to read this sign.' },
    tooltip: 'A sign with a message. Press E to read.',
    walkable: true
  },

  // Removed/defeated object states (visual only, walkable)
  'tree-stump': {
    label: 'Tree Stump',
    color: '#6b4423',
    category: null,  // Not placeable in builder
    layer: 'object',
    tooltip: 'Remains of a cut tree.',
    walkable: true
  },
  'cleared-bush': {
    label: 'Cleared Bush',
    color: '#5a7b4a',
    category: null,
    layer: 'object',
    tooltip: 'Cleared thorny bush area.',
    walkable: true
  },
  'extinguished-fire': {
    label: 'Extinguished Fire',
    color: '#4a4a4a',
    category: null,
    layer: 'object',
    tooltip: 'Remains of extinguished fire.',
    walkable: true
  },
  'defeated-bear': {
    label: 'Defeated Bear',
    color: '#6b4423',
    category: null,
    layer: 'object',
    tooltip: 'Paw prints from defeated bear.',
    walkable: true
  },
  'rescued-friend': {
    label: 'Rescued Friend',
    color: '#aaaaaa',
    category: null,
    layer: 'object',
    tooltip: 'Footprints from rescued friend.',
    walkable: true
  },
};

export const CONFIG_HELP = {
  car: {
    needsKey: 'If checked, player needs a Key in inventory to escape.',
  },
  friend: {
    name: 'Name for this friend. Shown in messages and missions.',
  },
  'ancient-gate': {
    pathTiles: 'Click tiles on the map to define the path. Tiles must be connected (up/down/left/right). Player must walk the path in order without leaving.',
  },
  sign: {
    message: 'The message that appears when the player presses E to read the sign.',
  },
};

// Generic config schema - defines what config fields each tile type has
export const CONFIG_SCHEMA = {
  car: {
    needsKey: {
      type: 'checkbox',
      label: 'Requires Key',
      default: true
    }
  },
  friend: {
    name: {
      type: 'text',
      label: 'Friend Name',
      placeholder: 'e.g. Alice',
      default: ''
    }
  },
  'ancient-gate': {
    pathTiles: {
      type: 'path',  // Special type handled by the builder
      label: 'Path Tiles',
      default: []
    }
  },
  sign: {
    message: {
      type: 'textarea',
      label: 'Sign Message',
      placeholder: 'Enter the message to display...',
      default: 'Press E to read this sign.'
    }
  }
};

// Check if a tile is walkable, considering game state
export function isWalkable(tileType, gameState = {}, tileConfig = {}) {
  const tile = TILE_TYPES[tileType];
  if (!tile) return false;

  // Special cases that override base walkability
  if (tileType === 'snow') {
    // Snow requires sweater to be WORN (not just in inventory)
    const isWearingSweater = gameState.worn?.body === 'sweater';
    return isWearingSweater || false;
  }

  if (tileType === 'bear') {
    // Bear is walkable (defeated) if player has knife
    return gameState.inventory?.some(item => item.itemType === 'knife') || false;
  }

  if (tileType === 'ancient-gate') {
    // Ancient gate is only walkable if it's open (path completed)
    return tileConfig?.isOpen === true;
  }

  // Basic walkability (applies to most tiles)
  if (tile.walkable) {
    return true;
  }

  return false;
}

// Draw a raft (wooden planks on water)
function drawRaft(ctx, cx, cy, size) {
  const s = size * 0.35;

  // Water background (lighter blue to show it's on water)
  ctx.fillStyle = '#3377bb';
  ctx.fillRect(cx - size/2, cy - size/2, size, size);

  // Wooden planks (horizontal)
  const plankCount = 4;
  const plankHeight = s * 0.35;
  const spacing = s * 0.15;
  const startY = cy - (plankCount * plankHeight + (plankCount - 1) * spacing) / 2;

  for (let i = 0; i < plankCount; i++) {
    const y = startY + i * (plankHeight + spacing);

    // Main plank color
    ctx.fillStyle = i % 2 === 0 ? '#8b6914' : '#7b5910';
    ctx.fillRect(cx - s * 1.2, y, s * 2.4, plankHeight);

    // Wood grain/texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(cx - s * 1.2, y, s * 0.1, plankHeight);
    ctx.fillRect(cx - s * 0.4, y, s * 0.08, plankHeight);
    ctx.fillRect(cx + s * 0.5, y, s * 0.08, plankHeight);
  }

  // Rope bindings (vertical)
  ctx.strokeStyle = '#6b5830';
  ctx.lineWidth = 2;

  // Left rope
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.7, cy - s * 0.9);
  ctx.lineTo(cx - s * 0.7, cy + s * 0.9);
  ctx.stroke();

  // Right rope
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.7, cy - s * 0.9);
  ctx.lineTo(cx + s * 0.7, cy + s * 0.9);
  ctx.stroke();
}

// Draw a boulder (large gray rock)
function drawBoulder(ctx, cx, cy, size) {
  // Main boulder shape (irregular rock)
  ctx.fillStyle = '#6a6a6a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.42, size * 0.38, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Darker shadow on bottom
  ctx.fillStyle = '#4a4a4a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.15, size * 0.38, size * 0.2, 0.2, 0, Math.PI);
  ctx.fill();

  // Rock texture highlights (lighter spots)
  ctx.fillStyle = '#8a8a8a';
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.12, cy - size * 0.1, size * 0.15, size * 0.12, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + size * 0.15, cy + size * 0.05, size * 0.1, size * 0.08, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Cracks in the rock
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.25, cy - size * 0.05);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + size * 0.1, cy - size * 0.15);
  ctx.lineTo(cx + size * 0.25, cy + size * 0.05);
  ctx.stroke();
}

// Draw a thorny bush
function drawThornyBush(ctx, cx, cy, size) {
  // Main bush body (dark green cluster)
  ctx.fillStyle = '#3a5a2a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.4, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lighter green highlights (front leaves)
  ctx.fillStyle = '#4a6b3a';
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.15, cy - size * 0.1, size * 0.2, size * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + size * 0.12, cy + size * 0.08, size * 0.18, size * 0.15, 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.18, size * 0.15, size * 0.13, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Thorns (sharp brown spikes)
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 2;

  // Draw several thorns at various angles
  const thornPositions = [
    { x: -0.25, y: -0.15, angle: -0.5 },
    { x: 0.28, y: -0.08, angle: 0.3 },
    { x: -0.3, y: 0.12, angle: -0.8 },
    { x: 0.25, y: 0.18, angle: 0.7 },
    { x: 0.05, y: -0.25, angle: 0 },
    { x: -0.12, y: 0.25, angle: -0.3 }
  ];

  thornPositions.forEach(thorn => {
    const startX = cx + thorn.x * size;
    const startY = cy + thorn.y * size;
    const length = size * 0.12;
    const endX = startX + Math.cos(thorn.angle) * length;
    const endY = startY + Math.sin(thorn.angle) * length;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Thorn tip (darker)
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath();
    ctx.arc(endX, endY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Draw an ancient stone gate
function drawAncientGate(ctx, cx, cy, size, config = {}) {
  const isOpen = config?.isOpen || false;
  const gateColor = '#6a5a4a';
  const stoneColor = '#8a7a6a';
  const darkStone = '#5a4a3a';

  // Left pillar
  ctx.fillStyle = stoneColor;
  ctx.fillRect(cx - size * 0.45, cy - size * 0.4, size * 0.25, size * 0.8);

  // Stone texture on left pillar
  ctx.fillStyle = darkStone;
  ctx.fillRect(cx - size * 0.42, cy - size * 0.35, size * 0.08, size * 0.1);
  ctx.fillRect(cx - size * 0.38, cy - size * 0.1, size * 0.1, size * 0.12);
  ctx.fillRect(cx - size * 0.40, cy + size * 0.15, size * 0.09, size * 0.08);

  // Right pillar
  ctx.fillStyle = stoneColor;
  ctx.fillRect(cx + size * 0.2, cy - size * 0.4, size * 0.25, size * 0.8);

  // Stone texture on right pillar
  ctx.fillStyle = darkStone;
  ctx.fillRect(cx + size * 0.23, cy - size * 0.30, size * 0.09, size * 0.11);
  ctx.fillRect(cx + size * 0.25, cy - size * 0.05, size * 0.08, size * 0.1);
  ctx.fillRect(cx + size * 0.28, cy + size * 0.2, size * 0.1, size * 0.09);

  // Top archway
  ctx.fillStyle = stoneColor;
  ctx.fillRect(cx - size * 0.45, cy - size * 0.45, size * 0.9, size * 0.15);

  // Arch detail
  ctx.fillStyle = darkStone;
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.3, size * 0.35, Math.PI, 0, false);
  ctx.lineWidth = 3;
  ctx.strokeStyle = darkStone;
  ctx.stroke();

  if (!isOpen) {
    // Closed gate (wooden bars)
    ctx.fillStyle = gateColor;
    const barCount = 5;
    const barWidth = size * 0.08;
    const spacing = (size * 0.6) / barCount;

    for (let i = 0; i < barCount; i++) {
      const x = cx - size * 0.3 + i * spacing;
      ctx.fillRect(x, cy - size * 0.25, barWidth, size * 0.65);

      // Wood grain
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x + barWidth * 0.2, cy - size * 0.25, barWidth * 0.1, size * 0.65);
      ctx.fillStyle = gateColor;
    }

    // Horizontal support bars
    ctx.fillRect(cx - size * 0.35, cy - size * 0.15, size * 0.7, size * 0.08);
    ctx.fillRect(cx - size * 0.35, cy + size * 0.15, size * 0.7, size * 0.08);
  } else {
    // Open gate - draw mystical glow
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.4);
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(cx - size * 0.4, cy - size * 0.3, size * 0.8, size * 0.6);
  }
}

// Draw a machete
function drawMachete(ctx, cx, cy, size) {
  const bladeGray = '#c0c0c0';
  const bladeDark = '#808080';
  const handleBrown = '#6b4423';
  const handleDark = '#4a2f1a';

  // Blade (angled, wide cutting tool)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.5); // Angle the machete

  // Main blade
  ctx.fillStyle = bladeGray;
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, -size * 0.08);
  ctx.lineTo(size * 0.35, -size * 0.05);
  ctx.lineTo(size * 0.38, size * 0.02);
  ctx.lineTo(-size * 0.3, size * 0.05);
  ctx.closePath();
  ctx.fill();

  // Blade edge (darker)
  ctx.fillStyle = bladeDark;
  ctx.beginPath();
  ctx.moveTo(size * 0.25, -size * 0.04);
  ctx.lineTo(size * 0.38, size * 0.02);
  ctx.lineTo(size * 0.35, -size * 0.05);
  ctx.closePath();
  ctx.fill();

  // Blade shine/highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, -size * 0.05);
  ctx.lineTo(size * 0.25, -size * 0.03);
  ctx.stroke();

  // Handle (wood grip)
  ctx.fillStyle = handleBrown;
  ctx.fillRect(-size * 0.35, -size * 0.08, size * 0.12, size * 0.13);

  // Handle texture lines
  ctx.strokeStyle = handleDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, -size * 0.03);
  ctx.lineTo(-size * 0.23, -size * 0.03);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-size * 0.35, size * 0.02);
  ctx.lineTo(-size * 0.23, size * 0.02);
  ctx.stroke();

  // Guard/hilt
  ctx.fillStyle = bladeDark;
  ctx.fillRect(-size * 0.24, -size * 0.10, size * 0.04, size * 0.17);

  ctx.restore();
}

// Draw a stick (simple wooden stick)
function drawStick(ctx, cx, cy, size) {
  const stickBrown = '#8b6914';
  const stickDark = '#6b4910';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.3); // Slight angle

  // Main stick body
  ctx.fillStyle = stickBrown;
  ctx.fillRect(-size * 0.35, -size * 0.05, size * 0.7, size * 0.1);

  // Dark side for depth
  ctx.fillStyle = stickDark;
  ctx.fillRect(-size * 0.35, size * 0.02, size * 0.7, size * 0.03);

  // Wood texture lines
  ctx.strokeStyle = stickDark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const x = -size * 0.3 + i * size * 0.2;
    ctx.beginPath();
    ctx.moveTo(x, -size * 0.05);
    ctx.lineTo(x, size * 0.05);
    ctx.stroke();
  }

  ctx.restore();
}

// Draw a lit torch (flaming torch)
function drawTorch(ctx, cx, cy, size) {
  const stickBrown = '#6b4910';
  const stickDark = '#4a2f1a';

  ctx.save();
  ctx.translate(cx, cy);

  // Wooden handle
  ctx.fillStyle = stickBrown;
  ctx.fillRect(-size * 0.06, size * 0.05, size * 0.12, size * 0.4);

  // Handle texture
  ctx.fillStyle = stickDark;
  ctx.fillRect(-size * 0.06, size * 0.1, size * 0.12, size * 0.03);
  ctx.fillRect(-size * 0.06, size * 0.2, size * 0.12, size * 0.03);
  ctx.fillRect(-size * 0.06, size * 0.3, size * 0.12, size * 0.03);

  // Wrapped cloth at top
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(-size * 0.1, -size * 0.05, size * 0.2, size * 0.12);

  // Flames - outer orange
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.35);
  ctx.bezierCurveTo(-size * 0.15, -size * 0.25, -size * 0.12, -size * 0.1, -size * 0.08, -size * 0.05);
  ctx.lineTo(size * 0.08, -size * 0.05);
  ctx.bezierCurveTo(size * 0.12, -size * 0.1, size * 0.15, -size * 0.25, 0, -size * 0.35);
  ctx.closePath();
  ctx.fill();

  // Flames - middle yellow-orange
  ctx.fillStyle = '#ff9933';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.3);
  ctx.bezierCurveTo(-size * 0.1, -size * 0.22, -size * 0.08, -size * 0.12, -size * 0.05, -size * 0.05);
  ctx.lineTo(size * 0.05, -size * 0.05);
  ctx.bezierCurveTo(size * 0.08, -size * 0.12, size * 0.1, -size * 0.22, 0, -size * 0.3);
  ctx.closePath();
  ctx.fill();

  // Flames - inner yellow
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.25);
  ctx.bezierCurveTo(-size * 0.06, -size * 0.18, -size * 0.04, -size * 0.1, -size * 0.03, -size * 0.05);
  ctx.lineTo(size * 0.03, -size * 0.05);
  ctx.bezierCurveTo(size * 0.04, -size * 0.1, size * 0.06, -size * 0.18, 0, -size * 0.25);
  ctx.closePath();
  ctx.fill();

  // Flame highlights (bright center)
  ctx.fillStyle = '#ffff66';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.12, size * 0.025, size * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw a wooden sign
function drawSign(ctx, cx, cy, size) {
  const woodColor = '#8b7355';
  const darkWood = '#6b5335';
  const postColor = '#7a6a5a';

  // Wooden post
  ctx.fillStyle = postColor;
  ctx.fillRect(cx - size * 0.08, cy, size * 0.16, size * 0.4);

  // Sign board
  ctx.fillStyle = woodColor;
  ctx.fillRect(cx - size * 0.35, cy - size * 0.25, size * 0.7, size * 0.35);

  // Wood grain lines
  ctx.strokeStyle = darkWood;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.3, cy - size * 0.15);
  ctx.lineTo(cx + size * 0.3, cy - size * 0.15);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - size * 0.3, cy);
  ctx.lineTo(cx + size * 0.3, cy);
  ctx.stroke();

  // Border
  ctx.strokeStyle = darkWood;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - size * 0.35, cy - size * 0.25, size * 0.7, size * 0.35);
}

// Draw a tree stump (removed tree)
function drawTreeStump(ctx, cx, cy, size) {
  const stumpColor = '#6b4423';
  const darkBrown = '#4a2f1a';
  const lightBrown = '#8b6434';

  // Main stump (oval shape)
  ctx.fillStyle = stumpColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.35, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Annual rings (tree rings)
  ctx.strokeStyle = darkBrown;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.25, size * 0.18, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.15, size * 0.11, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Highlights
  ctx.fillStyle = lightBrown;
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.1, cy - size * 0.05, size * 0.08, size * 0.06, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Wood grain cracks
  ctx.strokeStyle = darkBrown;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + size * 0.2, cy - size * 0.1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - size * 0.15, cy + size * 0.12);
  ctx.stroke();
}

// Draw cleared bush area (grass/ground)
function drawClearedBush(ctx, cx, cy, size) {
  // Light patches of grass to show something was cleared
  const grassColor = '#4a6b3a';
  const lightGrass = '#5a7b4a';

  // Small grass tufts scattered around
  const tufts = [
    { x: -0.15, y: -0.1, w: 0.1, h: 0.08 },
    { x: 0.1, y: 0.05, w: 0.12, h: 0.09 },
    { x: -0.05, y: 0.12, w: 0.08, h: 0.07 },
    { x: 0.15, y: -0.08, w: 0.09, h: 0.08 }
  ];

  tufts.forEach(tuft => {
    ctx.fillStyle = grassColor;
    ctx.beginPath();
    ctx.ellipse(
      cx + tuft.x * size,
      cy + tuft.y * size,
      tuft.w * size,
      tuft.h * size,
      0, 0, Math.PI * 2
    );
    ctx.fill();
  });

  // Add lighter highlights
  ctx.fillStyle = lightGrass;
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.12, cy - size * 0.08, size * 0.05, size * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Draw extinguished fire (burnt logs in X pattern with ash)
function drawExtinguishedFire(ctx, cx, cy, size) {
  const charcoal = '#2a2a2a';
  const ashGray = '#5a5a5a';
  const logBrown = '#3a2a1a';

  // Draw burnt logs in X pattern
  const logWidth = size * 0.12;
  const logLength = size * 0.5;

  // Log 1: diagonal from top-left to bottom-right (\)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4); // 45 degrees
  ctx.fillStyle = charcoal;
  ctx.fillRect(-logLength / 2, -logWidth / 2, logLength, logWidth);

  // Add texture to log
  ctx.fillStyle = logBrown;
  ctx.fillRect(-logLength / 2 + logWidth * 0.2, -logWidth / 2, logWidth * 0.15, logWidth);
  ctx.fillRect(-logLength / 2 + logLength * 0.4, -logWidth / 2, logWidth * 0.15, logWidth);
  ctx.fillRect(-logLength / 2 + logLength * 0.7, -logWidth / 2, logWidth * 0.15, logWidth);
  ctx.restore();

  // Log 2: diagonal from top-right to bottom-left (/)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4); // -45 degrees
  ctx.fillStyle = charcoal;
  ctx.fillRect(-logLength / 2, -logWidth / 2, logLength, logWidth);

  // Add texture to log
  ctx.fillStyle = logBrown;
  ctx.fillRect(-logLength / 2 + logWidth * 0.3, -logWidth / 2, logWidth * 0.15, logWidth);
  ctx.fillRect(-logLength / 2 + logLength * 0.5, -logWidth / 2, logWidth * 0.15, logWidth);
  ctx.fillRect(-logLength / 2 + logLength * 0.8, -logWidth / 2, logWidth * 0.15, logWidth);
  ctx.restore();

  // Ash pile in center (where logs cross)
  ctx.fillStyle = ashGray;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Darker ash in center
  ctx.fillStyle = '#4a4a4a';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

// Draw defeated bear remains (paw prints)
function drawDefeatedBear(ctx, cx, cy, size) {
  const pawColor = '#6b4423';
  const padColor = '#5a3a20';

  // Draw two paw prints side by side
  const drawPaw = (x, y, scale) => {
    // Main pad
    ctx.fillStyle = pawColor;
    ctx.beginPath();
    ctx.ellipse(x, y + scale * 0.08, scale * 0.12, scale * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Toe pads (4 toes)
    const toePositions = [
      { dx: -0.1, dy: -0.08 },
      { dx: -0.03, dy: -0.12 },
      { dx: 0.04, dy: -0.12 },
      { dx: 0.11, dy: -0.08 }
    ];

    ctx.fillStyle = padColor;
    toePositions.forEach(toe => {
      ctx.beginPath();
      ctx.arc(x + toe.dx * scale, y + toe.dy * scale, scale * 0.045, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Left paw print
  drawPaw(cx - size * 0.15, cy, size);

  // Right paw print (slightly offset)
  drawPaw(cx + size * 0.15, cy + size * 0.1, size);
}

// Draw rescued friend spot (fading footprints)
function drawRescuedFriend(ctx, cx, cy, size) {
  const footColor = 'rgba(100, 100, 100, 0.3)';

  // Draw simple footprints fading away
  const drawFootprint = (x, y, scale, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = footColor;

    // Foot sole
    ctx.beginPath();
    ctx.ellipse(0, 0, scale * 0.08, scale * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Toes (5 small circles)
    for (let i = 0; i < 5; i++) {
      const angle = (i - 2) * 0.3;
      const tx = Math.sin(angle) * scale * 0.08;
      const ty = -scale * 0.14;
      ctx.beginPath();
      ctx.arc(tx, ty, scale * 0.025, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Walking away footprints (left, right, left)
  drawFootprint(cx - size * 0.1, cy + size * 0.15, size, -0.2);
  drawFootprint(cx + size * 0.08, cy, size, 0.2);
  drawFootprint(cx - size * 0.05, cy - size * 0.15, size * 0.8, -0.15);
}

// Custom rendering for tiles (optional - most use emoji/color)
export function renderTile(ctx, tile, cx, cy, size) {
  // Guard against undefined tile
  if (!tile) return false;

  // Raft gets custom rendering
  if (tile.type === 'raft') {
    drawRaft(ctx, cx, cy, size);
    return true;
  }

  // Boulder gets custom rendering
  if (tile.type === 'boulder') {
    drawBoulder(ctx, cx, cy, size);
    return true;
  }

  // Thorny bush gets custom rendering
  if (tile.type === 'thorny-bush') {
    drawThornyBush(ctx, cx, cy, size);
    return true;
  }

  // Ancient gate gets custom rendering
  if (tile.type === 'ancient-gate') {
    drawAncientGate(ctx, cx, cy, size, tile.config);
    return true;
  }

  // Sign gets custom rendering
  if (tile.type === 'sign') {
    drawSign(ctx, cx, cy, size);
    return true;
  }

  // Machete gets custom rendering
  if (tile.type === 'item-machete') {
    drawMachete(ctx, cx, cy, size);
    return true;
  }

  // Stick gets custom rendering
  if (tile.type === 'item-stick') {
    drawStick(ctx, cx, cy, size);
    return true;
  }

  // Torch gets custom rendering
  if (tile.type === 'item-torch') {
    drawTorch(ctx, cx, cy, size);
    return true;
  }

  // Removed/defeated object states get custom rendering
  if (tile.type === 'tree-stump') {
    drawTreeStump(ctx, cx, cy, size);
    return true;
  }

  if (tile.type === 'cleared-bush') {
    drawClearedBush(ctx, cx, cy, size);
    return true;
  }

  if (tile.type === 'extinguished-fire') {
    drawExtinguishedFire(ctx, cx, cy, size);
    return true;
  }

  if (tile.type === 'defeated-bear') {
    drawDefeatedBear(ctx, cx, cy, size);
    return true;
  }

  if (tile.type === 'rescued-friend') {
    drawRescuedFriend(ctx, cx, cy, size);
    return true;
  }

  // All other tiles use emoji or color
  return false;
}

// Get emoji for tile rendering
export function getTileEmoji(tileType) {
  const emojiMap = {
    ground: null,  // No emoji for ground (just color)
    tree: '🌲',
    boulder: null,  // Custom draw
    'thorny-bush': null,  // Custom draw
    water: '🌊',
    snow: '❄️',
    raft: null,  // Custom draw (wooden planks on water)
    campfire: '🏕️',
    car: '🚗',
    'item-key': '🔑',
    'item-axe': '🪓',
    'item-bucket': null,  // Custom draw
    'item-rope': '🧵',
    'item-knife': '🔪',
    'item-machete': null,  // Custom draw
    'item-stick': null,  // Custom draw
    'item-torch': null,  // Custom draw
    'item-sweater': '🧥',
    'item-wood': null,  // Custom draw
    'item-raft': '🛶',  // Raft item uses boat emoji
    friend: '👤',
    fire: '🔥',
    bear: '🐻',
    empty: null,  // No emoji for empty (just color)
    'ancient-gate': null,  // Custom draw
    sign: null,  // Custom draw
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

// === TILE CLASSIFICATIONS ===

// Tiles that items can be dropped on (raft excluded - can't drop items while on water)
// Snow excluded - it's a floor but you can't drop items on it (too cold!)
export const GROUND_TILES = ['ground', 'campfire', 'floor', 'start'];

// Tiles player can interact with (E key)
export const INTERACTABLE_TILES = ['tree', 'thorny-bush', 'water', 'raft', 'fire', 'friend', 'bear', 'door-key', 'door-card', 'sign'];

// Tiles to ignore for floor color detection when picking up items
export const IGNORE_TILES = ['wall', 'empty', 'door-key', 'door-card', 'door-key-open', 'door-card-open', 'tree', 'boulder', 'thorny-bush', 'water', 'snow', 'bear'];

// Tiles that use lock colors (doors, keys, cards)
export const LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

// Hazard tile types (for extinguish mission)
export const HAZARD_TILE_TYPES = ['fire'];

// Lock colors for keys and doors
export const LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444' },
  blue: { label: 'Blue', color: '#4444cc' },
  green: { label: 'Green', color: '#44cc44' },
  yellow: { label: 'Yellow', color: '#cccc44' },
  purple: { label: 'Purple', color: '#cc44cc' },
};

// === MOVEMENT RULES ===

// Helper to check if inventory has item type
function hasItemType(inventory, itemType) {
  return inventory?.some(item => item.itemType === itemType) || false;
}

// Check if player can move into a tile
// Returns { allowed, message?, loseLife?, moveRaft?, respawn? }
// NOTE: tileType is the top-most tile (object if present, otherwise floor)
// We need to check floor layer separately for environmental conditions like snow
export function checkMovementInto(tileType, gameState, tileConfig, grid, x, y) {
  const inventory = gameState?.inventory || [];
  const currentTileType = gameState?.currentTileType;

  // First check if the FLOOR is snow (regardless of what's on top)
  // This ensures snow rules apply even when there's an object on the snow
  if (grid && grid[y]?.[x]?.floor?.type === 'snow') {
    const isWearingSweater = gameState?.worn?.body === 'sweater';
    if (!isWearingSweater) {
      return {
        allowed: false,
        messageKey: 'tooCold'
      };
    }
    // Wearing sweater - continue checking object layer below
  }

  // Now check object layer (or floor if no object)
  switch (tileType) {
    case 'bear':
      // Bear always attacks - must be defeated with interaction
      return {
        allowed: false,
        loseLife: true,
        messageKey: 'bearWarning'
      };

    case 'snow':
      // This case only triggers if snow is the top-most tile (no object on it)
      const isWearingSweater = gameState?.worn?.body === 'sweater';
      if (isWearingSweater) {
        return { allowed: true };
      }
      return {
        allowed: false,
        messageKey: 'tooCold'
      };

    case 'water':
      // Check if standing on raft - can push raft into water
      if (currentTileType === 'raft') {
        return {
          allowed: true,
          // Set the source tile (where player was) to water (floor), dest tile to raft (object on water)
          setSourceTile: { floor: { type: 'water', config: {} }, object: null },
          setDestTile: { floor: { type: 'water', config: {} }, object: { type: 'raft', config: {} } }
        };
      }
      return {
        allowed: false,
        messageKey: 'cantSwim'
      };

    case 'fire':
      return {
        allowed: false,
        loseLife: true,
        messageKey: 'burned'
      };

    case 'door-key': {
      const doorColor = tileConfig?.lockColor || 'red';
      const hasKey = inventory.some(
        item => item.itemType === 'key' && item.lockColor === doorColor
      );
      if (hasKey) {
        return {
          allowed: false,
          messageKey: 'doorUnlockHint',
          messageParams: { color: doorColor }
        };
      }
      return {
        allowed: false,
        messageKey: 'doorLocked',
        messageParams: { color: doorColor }
      };
    }

    case 'door-card': {
      const doorColor = tileConfig?.lockColor || 'red';
      const hasCard = inventory.some(
        item => item.itemType === 'card' && item.lockColor === doorColor
      );
      if (hasCard) {
        return {
          allowed: false,
          messageKey: 'cardDoorUnlockHint',
          messageParams: { color: doorColor }
        };
      }
      return {
        allowed: false,
        messageKey: 'cardDoorLocked',
        messageParams: { color: doorColor }
      };
    }

    default:
      // Use default walkability
      return { allowed: isWalkable(tileType, gameState, tileConfig) };
  }
}

// Check if player meets exit requirements
export function checkExitRequirements(gameState, exitConfig) {
  const needsKey = exitConfig?.needsKey !== false;

  if (needsKey && !hasItemType(gameState?.inventory, 'key')) {
    return {
      allowed: false,
      messageKey: 'needKeyToEscape'
    };
  }

  return { allowed: true };
}

// === POST-MOVEMENT LOGIC ===

/**
 * Called after player movement - handles path tracking for ancient gates
 * @param {Object} gameState - Current game state
 * @param {Array} grid - Game grid
 * @param {number} newX - New player X position
 * @param {number} newY - New player Y position
 * @returns {Object|null} - Result object { success, message, modifyGrid } or null
 */
export function onPlayerMove(gameState, grid, newX, newY) {
  // Initialize path progress tracking if needed
  if (!gameState.ancientGateProgress) {
    gameState.ancientGateProgress = {};
  }

  // Find all ancient gates in the grid
  const gates = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (cell.object?.type === 'ancient-gate') {
        gates.push({ x, y, config: cell.object.config });
      }
    }
  }

  // Check each gate's path
  for (const gate of gates) {
    const gateKey = `${gate.x},${gate.y}`;
    const pathTiles = gate.config?.pathTiles || [];

    // Skip if no path defined or already open
    if (pathTiles.length === 0 || gate.config?.isOpen) {
      continue;
    }

    // Get current progress for this gate
    const progress = gameState.ancientGateProgress[gateKey] || { step: 0, active: false };

    // Check if player is on a path tile
    const currentStepIndex = pathTiles.findIndex(tile => tile.x === newX && tile.y === newY);

    if (currentStepIndex !== -1) {
      // Player is on a path tile
      if (currentStepIndex === 0) {
        // Starting the path
        progress.step = 1;
        progress.active = true;
        gameState.ancientGateProgress[gateKey] = progress;
      } else if (progress.active && currentStepIndex === progress.step) {
        // Correct next step
        progress.step++;
        gameState.ancientGateProgress[gateKey] = progress;

        // Check if path completed
        if (progress.step >= pathTiles.length) {
          // Path completed! Open the gate
          grid[gate.y][gate.x].object.config.isOpen = true;

          // Reset progress
          gameState.ancientGateProgress[gateKey] = { step: 0, active: false };

          return {
            success: true,
            message: '🌟 The ancient gate opens with a mystical glow!',
            modifyGrid: true
          };
        }
      } else if (progress.active) {
        // Wrong tile - reset progress
        progress.step = 0;
        progress.active = false;
        gameState.ancientGateProgress[gateKey] = progress;

        return {
          success: false,
          message: '❌ You broke the path sequence. Start again from the beginning.',
          modifyGrid: false
        };
      }
    } else if (progress.active) {
      // Player left the path - reset progress
      progress.step = 0;
      progress.active = false;
      gameState.ancientGateProgress[gateKey] = progress;

      return {
        success: false,
        message: '❌ You left the path. Start again from the beginning.',
        modifyGrid: false
      };
    }
  }

  return null;
}

// === TWO-LAYER SYSTEM HELPERS ===

/**
 * Get the layer a tile type belongs to
 * @param {string} tileType - The tile type
 * @returns {'floor'|'object'} - The layer
 */
export function getTileLayer(tileType) {
  const tile = TILE_TYPES[tileType];
  return tile?.layer || 'floor'; // Default to floor for safety
}

/**
 * Check if a tile type is a floor tile
 */
export function isFloorTile(tileType) {
  return getTileLayer(tileType) === 'floor';
}

/**
 * Check if a tile type is an object tile
 */
export function isObjectTile(tileType) {
  return getTileLayer(tileType) === 'object';
}

/**
 * Get default floor for this theme
 */
export function getDefaultFloor() {
  return { type: 'ground', config: {} };
}

// === PLAYER RENDERING ===

/**
 * Render the player with visual indication of worn sweater
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Tile size
 * @param {string} direction - Player direction ('up', 'down', 'left', 'right')
 * @param {Object} gameState - Current game state with worn items
 */
export function renderPlayer(ctx, x, y, size, _direction, gameState = {}) {
  const worn = gameState.worn || {};
  const wearingSweater = worn.body === 'sweater';

  // Draw player emoji
  ctx.font = '26px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧑', x, y);

  if (wearingSweater) {
    // Draw ellipse hood around head (on top of emoji)
    const sweaterColor = '#c8b4a4';
    const darkColor = '#8b7355';

    // Ellipse hood - moved up and larger to cover hair
    ctx.strokeStyle = sweaterColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.03, size * 0.28, size * 0.33, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Darker outline for visibility
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.03, size * 0.28, size * 0.33, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  return true;
}

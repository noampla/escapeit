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
    tooltip: 'Walkable forest ground. May contain buried items (Ctrl+click to bury).',
    walkable: true,
    configurable: true,
    defaultConfig: { hiddenObject: null, dug: false }
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
    tooltip: 'Large rock. Blocks movement. Carve with pickaxe (hold E) to break.',
    walkable: false
  },
  'rock-wall': {
    label: 'Rock Wall',
    color: '#4a4a5a',
    category: 'basic',
    layer: 'object',
    configurable: false,
    defaultConfig: {},
    tooltip: 'Vertical cliff face. Blocks movement permanently.',
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
  'cave-entry': {
    label: 'Cave Entry',
    color: '#4a4a5a',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Entrance to a dark cave. The only way in or out of the cave interior.',
    walkable: true
    // Note: cave-entry is NOT a dark zone - it's always visible as the entrance
  },
  cave: {
    label: 'Cave Floor',
    color: '#2a2a3a',
    category: 'basic',
    layer: 'floor',
    tooltip: 'Dark cave interior. Can only enter through cave entry. Contents are hidden in darkness.',
    walkable: true,  // Walkable but with directional restrictions
    isDarkZone: true  // Part of the cave dark zone
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
  'item-pickaxe': {
    label: 'Pickaxe',
    color: '#777777',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'pickaxe',
    tooltip: 'Collectible pickaxe. Press F to pick up. Carve boulders.',
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
  'item-shovel': {
    label: 'Shovel',
    color: '#8b7355',
    category: 'interactive',
    layer: 'object',
    isItemTile: true,
    itemType: 'shovel',
    tooltip: 'Collectible shovel. Press F to pick up. Use to dig ground (hold E) to find buried items.',
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
  'item-drawing-board': {
    label: 'Drawing Board',
    color: '#5a4a3a',
    category: 'interactive',
    layer: 'object',
    configurable: true,
    defaultConfig: { drawingData: null, imageId: '', description: 'Drawing', pickable: true },
    isItemTile: true,
    itemType: 'drawing-board',
    tooltip: 'A board with a custom drawing. Press F to pick up, E to view.',
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
  'carved-boulder': {
    label: 'Carved Boulder',
    color: '#6a6a6a',
    category: null,
    layer: 'object',
    tooltip: 'Broken rock pieces from carved boulder.',
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
    activationRequirements: 'Configure items that must be placed at specific positions to open the gate. Alternative to path-based opening.',
  },
  sign: {
    message: 'The message that appears when the player presses E to read the sign.',
  },
  'item-drawing-board': {
    description: 'What this drawing represents (shown as title when viewing).',
    imageId: 'Unique ID for this drawing (used for puzzle logic later).',
    pickable: 'If unchecked, the drawing cannot be picked up with F key.',
    drawingData: 'Click to open the drawing editor. Draw a simple image using the color palette.',
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
    },
    activationRequirements: {
      type: 'activation',
      label: 'Item Activation',
      default: {
        enabled: false,
        orderMatters: false,
        requirements: []
      }
    }
  },
  sign: {
    message: {
      type: 'textarea',
      label: 'Sign Message',
      placeholder: 'Enter the message to display...',
      default: 'Press E to read this sign.'
    }
  },
  'item-drawing-board': {
    description: {
      type: 'text',
      label: 'Description',
      placeholder: 'e.g. Old Map, Secret Note',
      default: 'Drawing'
    },
    imageId: {
      type: 'text',
      label: 'Image ID',
      placeholder: 'e.g. map1, clue-a',
      default: ''
    },
    pickable: {
      type: 'checkbox',
      label: 'Can be picked up',
      default: true
    },
    drawingData: {
      type: 'canvas',
      label: 'Drawing',
      width: 16,
      height: 16,
      palette: ['#222222', '#ffffff', '#cc4444', '#4444cc'],
      default: null
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

// Draw a rock wall (vertical cliff face)
function drawRockWall(ctx, cx, cy, size) {
  const wallColor = '#5a5a6a';
  const darkWall = '#3a3a4a';
  const lightWall = '#7a7a8a';
  const crackColor = '#2a2a3a';

  // Main wall face (tall vertical rectangle)
  ctx.fillStyle = wallColor;
  ctx.fillRect(cx - size * 0.45, cy - size * 0.5, size * 0.9, size);

  // Stratification layers (horizontal lines to show rock layers)
  ctx.fillStyle = darkWall;
  ctx.fillRect(cx - size * 0.45, cy - size * 0.3, size * 0.9, size * 0.08);
  ctx.fillRect(cx - size * 0.45, cy + size * 0.1, size * 0.9, size * 0.06);
  ctx.fillRect(cx - size * 0.45, cy + size * 0.35, size * 0.9, size * 0.07);

  // Light highlights on top layers
  ctx.fillStyle = lightWall;
  ctx.fillRect(cx - size * 0.45, cy - size * 0.5, size * 0.9, size * 0.05);
  ctx.fillRect(cx - size * 0.45, cy - size * 0.22, size * 0.9, size * 0.03);

  // Vertical cracks
  ctx.strokeStyle = crackColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.2, cy - size * 0.4);
  ctx.lineTo(cx - size * 0.15, cy + size * 0.3);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + size * 0.15, cy - size * 0.25);
  ctx.lineTo(cx + size * 0.2, cy + size * 0.4);
  ctx.stroke();

  // Small rock protrusions for texture
  ctx.fillStyle = lightWall;
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.3, cy - size * 0.15, size * 0.08, size * 0.06, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + size * 0.25, cy + size * 0.2, size * 0.07, size * 0.05, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = darkWall;
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.06, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
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

// Draw a pickaxe
function drawPickaxe(ctx, cx, cy, size) {
  const metalGray = '#888888';
  const metalDark = '#666666';
  const metalLight = '#aaaaaa';
  const handleBrown = '#6b4423';
  const handleDark = '#4a2f1a';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.4); // Angle the pickaxe

  // Wooden handle
  ctx.fillStyle = handleBrown;
  ctx.fillRect(-size * 0.4, -size * 0.05, size * 0.8, size * 0.1);

  // Handle texture
  ctx.fillStyle = handleDark;
  ctx.fillRect(-size * 0.35, -size * 0.05, size * 0.03, size * 0.1);
  ctx.fillRect(-size * 0.15, -size * 0.05, size * 0.03, size * 0.1);
  ctx.fillRect(size * 0.05, -size * 0.05, size * 0.03, size * 0.1);

  // Metal head base (center block where pick points attach)
  ctx.fillStyle = metalGray;
  ctx.fillRect(size * 0.2, -size * 0.1, size * 0.15, size * 0.2);

  // Left pick point (angled down-left)
  ctx.fillStyle = metalGray;
  ctx.beginPath();
  ctx.moveTo(size * 0.2, -size * 0.05);
  ctx.lineTo(size * 0.05, -size * 0.2);
  ctx.lineTo(size * 0.1, -size * 0.15);
  ctx.lineTo(size * 0.2, size * 0.05);
  ctx.closePath();
  ctx.fill();

  // Right pick point (angled down-right)
  ctx.fillStyle = metalGray;
  ctx.beginPath();
  ctx.moveTo(size * 0.35, -size * 0.05);
  ctx.lineTo(size * 0.45, -size * 0.2);
  ctx.lineTo(size * 0.4, -size * 0.15);
  ctx.lineTo(size * 0.35, size * 0.05);
  ctx.closePath();
  ctx.fill();

  // Darker shading on pick points
  ctx.fillStyle = metalDark;
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.05);
  ctx.lineTo(size * 0.1, -size * 0.15);
  ctx.lineTo(size * 0.12, -size * 0.13);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(size * 0.35, size * 0.05);
  ctx.lineTo(size * 0.4, -size * 0.15);
  ctx.lineTo(size * 0.38, -size * 0.13);
  ctx.closePath();
  ctx.fill();

  // Metal highlights
  ctx.fillStyle = metalLight;
  ctx.beginPath();
  ctx.arc(size * 0.275, -size * 0.05, size * 0.04, 0, Math.PI * 2);
  ctx.fill();

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

// Draw a shovel
function drawShovel(ctx, cx, cy, size) {
  const handleColor = '#6b4423';
  const handleDark = '#4a2f1a';
  const bladeColor = '#888888';
  const bladeDark = '#666666';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.4); // Slight angle

  // Wooden handle
  ctx.fillStyle = handleColor;
  ctx.fillRect(-size * 0.04, -size * 0.38, size * 0.08, size * 0.55);

  // Handle texture
  ctx.fillStyle = handleDark;
  ctx.fillRect(-size * 0.04, -size * 0.32, size * 0.08, size * 0.03);
  ctx.fillRect(-size * 0.04, -size * 0.18, size * 0.08, size * 0.03);
  ctx.fillRect(-size * 0.04, -size * 0.04, size * 0.08, size * 0.03);

  // Metal blade
  ctx.fillStyle = bladeColor;
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, size * 0.17);
  ctx.lineTo(size * 0.15, size * 0.17);
  ctx.lineTo(size * 0.12, size * 0.38);
  ctx.quadraticCurveTo(0, size * 0.45, -size * 0.12, size * 0.38);
  ctx.closePath();
  ctx.fill();

  // Blade edge highlight
  ctx.fillStyle = bladeDark;
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, size * 0.32);
  ctx.quadraticCurveTo(0, size * 0.38, size * 0.1, size * 0.32);
  ctx.lineTo(size * 0.12, size * 0.38);
  ctx.quadraticCurveTo(0, size * 0.45, -size * 0.12, size * 0.38);
  ctx.closePath();
  ctx.fill();

  // Handle top grip
  ctx.fillStyle = handleDark;
  ctx.fillRect(-size * 0.06, -size * 0.4, size * 0.12, size * 0.05);

  ctx.restore();
}

// Draw dug ground (disturbed earth after digging)
function drawDugGround(ctx, cx, cy, size) {
  // Base darker ground color (disturbed earth)
  ctx.fillStyle = '#4a3a20';
  ctx.fillRect(cx - size/2, cy - size/2, size, size);

  // Dirt mounds around the hole
  ctx.fillStyle = '#5a4a30';
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.25, cy - size * 0.25, size * 0.18, size * 0.12, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + size * 0.22, cy - size * 0.18, size * 0.15, size * 0.1, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + size * 0.18, cy + size * 0.22, size * 0.16, size * 0.11, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx - size * 0.2, cy + size * 0.2, size * 0.14, size * 0.1, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Darker depression in center (the hole)
  ctx.fillStyle = '#3a2a15';
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.22, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Even darker center
  ctx.fillStyle = '#2a1a0a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.02, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
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

// Image cache for drawing board tiles
const drawingImageCache = new Map();

// Get or create cached image from base64 data
function getDrawingImage(dataUrl) {
  if (!dataUrl) return null;
  if (!drawingImageCache.has(dataUrl)) {
    const img = new Image();
    img.src = dataUrl;
    drawingImageCache.set(dataUrl, img);
  }
  return drawingImageCache.get(dataUrl);
}

// Draw a drawing board with custom pixel art
function drawDrawingBoard(ctx, cx, cy, size, config = {}) {
  const woodColor = '#6b5335';
  const darkWood = '#4a3a25';
  const boardColor = '#8b7355';

  // Wooden frame
  ctx.fillStyle = woodColor;
  ctx.fillRect(cx - size * 0.4, cy - size * 0.35, size * 0.8, size * 0.7);

  // Inner board area (lighter)
  ctx.fillStyle = boardColor;
  ctx.fillRect(cx - size * 0.32, cy - size * 0.27, size * 0.64, size * 0.54);

  // Frame border
  ctx.strokeStyle = darkWood;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - size * 0.4, cy - size * 0.35, size * 0.8, size * 0.7);

  // Draw the custom image if it exists
  const drawingData = config?.drawingData;
  if (drawingData) {
    const img = getDrawingImage(drawingData);
    if (img && img.complete && img.naturalWidth > 0) {
      // Draw the image scaled to fit the board area
      const drawSize = size * 0.56;
      ctx.imageSmoothingEnabled = false; // Pixel art - no smoothing
      ctx.drawImage(img, cx - drawSize / 2, cy - drawSize / 2 + size * 0.02, drawSize, drawSize);
      ctx.imageSmoothingEnabled = true;
    }
  } else {
    // No drawing - show placeholder text
    ctx.fillStyle = '#666';
    ctx.font = `${size * 0.12}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Empty', cx, cy);
  }
}

// Draw a cave entry (dark opening with rocky arch)
function drawCaveEntry(ctx, cx, cy, size) {
  const darkColor = '#1a1a2a';
  const rockColor = '#5a5a6a';
  const darkRock = '#3a3a4a';

  // Background darkness (the cave opening)
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.1, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Rocky arch at top
  ctx.fillStyle = rockColor;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.45, cy + size * 0.2);
  ctx.quadraticCurveTo(cx - size * 0.4, cy - size * 0.35, cx, cy - size * 0.4);
  ctx.quadraticCurveTo(cx + size * 0.4, cy - size * 0.35, cx + size * 0.45, cy + size * 0.2);
  ctx.lineTo(cx + size * 0.35, cy + size * 0.15);
  ctx.quadraticCurveTo(cx + size * 0.3, cy - size * 0.2, cx, cy - size * 0.25);
  ctx.quadraticCurveTo(cx - size * 0.3, cy - size * 0.2, cx - size * 0.35, cy + size * 0.15);
  ctx.closePath();
  ctx.fill();

  // Rock texture
  ctx.fillStyle = darkRock;
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.25, cy - size * 0.2, size * 0.08, size * 0.06, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.2, cy - size * 0.15, size * 0.06, size * 0.05, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Side rocks
  ctx.fillStyle = rockColor;
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.4, cy + size * 0.1, size * 0.12, size * 0.2, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.4, cy + size * 0.1, size * 0.12, size * 0.2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Darker inner void for depth
  ctx.fillStyle = '#0a0a15';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.1, size * 0.25, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Draw cave floor (dark rocky surface)
function drawCaveFloor(ctx, cx, cy, size) {
  const darkColor = '#1a1a2a';
  const rockyColor = '#2a2a3a';
  const accentColor = '#3a3a4a';

  // Dark base
  ctx.fillStyle = darkColor;
  ctx.fillRect(cx - size / 2, cy - size / 2, size, size);

  // Rocky texture (small stones)
  const stones = [
    { x: -0.25, y: -0.2, r: 0.08 },
    { x: 0.15, y: -0.15, r: 0.06 },
    { x: -0.1, y: 0.2, r: 0.07 },
    { x: 0.25, y: 0.15, r: 0.05 },
    { x: 0.05, y: -0.3, r: 0.04 },
    { x: -0.3, y: 0.1, r: 0.05 },
    { x: 0.3, y: -0.05, r: 0.06 },
  ];

  stones.forEach(stone => {
    ctx.fillStyle = rockyColor;
    ctx.beginPath();
    ctx.arc(cx + stone.x * size, cy + stone.y * size, stone.r * size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Subtle highlights
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.15, cy - size * 0.1, size * 0.04, size * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.2, cy + size * 0.15, size * 0.03, size * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
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

// Draw carved boulder (broken rock pieces)
function drawCarvedBoulder(ctx, cx, cy, size) {
  const rockGray = '#6a6a6a';
  const darkGray = '#4a4a4a';
  const lightGray = '#8a8a8a';

  // Scattered broken rock pieces
  const pieces = [
    { x: -0.2, y: -0.15, w: 0.15, h: 0.12, angle: -0.3 },
    { x: 0.15, y: -0.1, w: 0.12, h: 0.1, angle: 0.4 },
    { x: -0.1, y: 0.15, w: 0.18, h: 0.14, angle: 0.2 },
    { x: 0.2, y: 0.1, w: 0.13, h: 0.11, angle: -0.5 },
    { x: 0, y: -0.05, w: 0.1, h: 0.08, angle: 0.1 },
  ];

  pieces.forEach(piece => {
    ctx.save();
    ctx.translate(cx + piece.x * size, cy + piece.y * size);
    ctx.rotate(piece.angle);

    // Main rock piece (irregular shape)
    ctx.fillStyle = rockGray;
    ctx.beginPath();
    ctx.ellipse(0, 0, piece.w * size, piece.h * size, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark shadow on one side
    ctx.fillStyle = darkGray;
    ctx.beginPath();
    ctx.ellipse(piece.w * size * 0.3, piece.h * size * 0.2, piece.w * size * 0.5, piece.h * size * 0.4, 0.5, 0, Math.PI);
    ctx.fill();

    // Light highlight
    ctx.fillStyle = lightGray;
    ctx.beginPath();
    ctx.ellipse(-piece.w * size * 0.2, -piece.h * size * 0.15, piece.w * size * 0.3, piece.h * size * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // Small rock dust/debris (tiny dots)
  ctx.fillStyle = 'rgba(106, 106, 106, 0.4)';
  const debris = [
    { x: -0.25, y: 0.05 },
    { x: 0.1, y: 0.2 },
    { x: -0.05, y: -0.2 },
    { x: 0.25, y: -0.05 },
    { x: 0.05, y: 0.1 },
  ];

  debris.forEach(dot => {
    ctx.beginPath();
    ctx.arc(cx + dot.x * size, cy + dot.y * size, size * 0.02, 0, Math.PI * 2);
    ctx.fill();
  });
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

  // Rock wall gets custom rendering
  if (tile.type === 'rock-wall') {
    drawRockWall(ctx, cx, cy, size);
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

  // Drawing board gets custom rendering
  if (tile.type === 'item-drawing-board') {
    drawDrawingBoard(ctx, cx, cy, size, tile.config);
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

  // Shovel gets custom rendering
  if (tile.type === 'item-shovel') {
    drawShovel(ctx, cx, cy, size);
    return true;
  }

  // Dug ground gets custom rendering (floor that has been dug)
  if (tile.type === 'ground' && tile.config?.dug) {
    drawDugGround(ctx, cx, cy, size);
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

  if (tile.type === 'carved-boulder') {
    drawCarvedBoulder(ctx, cx, cy, size);
    return true;
  }

  // Cave entry gets custom rendering
  if (tile.type === 'cave-entry') {
    drawCaveEntry(ctx, cx, cy, size);
    return true;
  }

  // Cave floor gets custom rendering
  if (tile.type === 'cave') {
    drawCaveFloor(ctx, cx, cy, size);
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
    'rock-wall': null,  // Custom draw
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
    'item-pickaxe': '⛏️',
    'item-machete': null,  // Custom draw
    'item-stick': null,  // Custom draw
    'item-torch': null,  // Custom draw
    'item-sweater': '🧥',
    'item-wood': null,  // Custom draw
    'item-raft': '🛶',  // Raft item uses boat emoji
    'item-shovel': null,  // Custom draw
    friend: '👤',
    fire: '🔥',
    bear: '🐻',
    empty: null,  // No emoji for empty (just color)
    'ancient-gate': null,  // Custom draw
    sign: null,  // Custom draw
    'cave-entry': null,  // Custom draw
    cave: null,  // Custom draw (just dark color)
  };

  return emojiMap[tileType] !== undefined ? emojiMap[tileType] : null;
}

// === TILE CLASSIFICATIONS ===

// Tiles that items can be dropped on (raft excluded - can't drop items while on water)
// Snow excluded - it's a floor but you can't drop items on it (too cold!)
// Cave tiles included - can place items in caves (they'll be hidden in darkness)
export const GROUND_TILES = ['ground', 'campfire', 'floor', 'start', 'cave', 'cave-entry'];

// Tiles player can interact with (E key)
export const INTERACTABLE_TILES = ['tree', 'boulder', 'thorny-bush', 'water', 'raft', 'fire', 'friend', 'bear', 'door-key', 'door-card', 'sign', 'item-drawing-board', 'ground'];

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

  // Get floor types for cave movement restrictions
  const destFloorType = grid?.[y]?.[x]?.floor?.type;
  const sourceFloorType = gameState?.currentFloorType;

  // Cave movement restrictions
  // Cave tiles can only be entered from cave-entry or other cave tiles
  if (destFloorType === 'cave') {
    const validSource = ['cave', 'cave-entry'].includes(sourceFloorType);
    if (!validSource) {
      return {
        allowed: false,
        messageKey: 'caveBlocked'
      };
    }
  }

  // Can only exit cave tiles through cave-entry (not directly to regular ground)
  if (sourceFloorType === 'cave') {
    const validDest = ['cave', 'cave-entry'].includes(destFloorType);
    if (!validDest) {
      return {
        allowed: false,
        messageKey: 'caveExitBlocked'
      };
    }
  }

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

// === DARK ZONE FUNCTIONS (Caves) ===

/**
 * Check if the player is currently in a cave area (cave or cave-entry)
 * When in cave area, player can see into the dark zone (5-tile visibility)
 * @param {Object} playerPos - Player position { x, y }
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state
 * @returns {boolean} - True if player is in cave area (can see into dark zone)
 */
export function isPlayerInDarkZone(playerPos, grid, gameState = {}) {
  if (!playerPos || !grid) return false;

  const cell = grid[playerPos.y]?.[playerPos.x];
  if (!cell) return false;

  // Check if player is on cave or cave-entry tiles
  const floorType = cell.floor?.type;
  return floorType === 'cave' || floorType === 'cave-entry';
}

/**
 * Check if the player is standing on an actual dark tile (not just near it)
 * This is used for fog of war blocking and player dark overlay
 * Cave-entry is NOT a dark tile - it's the transition point
 * @param {Object} playerPos - Player position { x, y }
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state
 * @returns {boolean} - True if player is on a dark tile (cave interior)
 */
export function isPlayerOnDarkTile(playerPos, grid, gameState = {}) {
  if (!playerPos || !grid) return false;

  const cell = grid[playerPos.y]?.[playerPos.x];
  if (!cell) return false;

  // Only return true if the tile itself has isDarkZone property
  const floorType = cell.floor?.type;
  const tileDef = TILE_TYPES[floorType];
  return tileDef?.isDarkZone === true;
}

/**
 * Get all dark zone tile positions in the grid
 * These tiles will be blacked out when the player is in a dark zone
 * @param {Array} grid - The game grid
 * @returns {Set} - Set of position strings "x,y" for dark zone tiles
 */
export function getDarkZoneTiles(grid) {
  const tiles = new Set();

  if (!grid || !Array.isArray(grid)) return tiles;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      const floorType = cell?.floor?.type;
      const tileDef = TILE_TYPES[floorType];

      if (tileDef?.isDarkZone === true) {
        tiles.add(`${x},${y}`);
      }
    }
  }

  return tiles;
}

/**
 * Check if the player has a light source in their inventory
 * When true, dark zone tiles are lit up (no dark overlay, objects visible)
 * @param {Object} gameState - Current game state with inventory
 * @returns {boolean} - True if player has a light source (torch)
 */
export function hasLightInDarkZone(gameState = {}) {
  const inventory = gameState.inventory || [];
  // Torch provides light in dark zones
  return inventory.some(item => item.itemType === 'torch');
}

/**
 * Get all tiles illuminated by dropped torches in dark zones
 * Returns a Set of "x,y" position strings for tiles within 5-tile range of dropped torches
 * @param {Array} grid - The game grid
 * @returns {Set} - Set of position strings for torch-lit tiles
 */
export function getDroppedTorchLitTiles(grid) {
  const lit = new Set();
  if (!grid || !Array.isArray(grid)) return lit;

  // Find all dropped torches in dark zone tiles
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      // Check if this is a torch item on the ground
      if (cell.object?.type === 'item-torch') {
        // Check if it's in a dark zone tile
        const floorType = cell.floor?.type;
        const tileDef = TILE_TYPES[floorType];
        if (tileDef?.isDarkZone === true) {
          // Add the torch tile and 4 cardinal neighbors
          lit.add(`${x},${y}`);
          lit.add(`${x},${y - 1}`);
          lit.add(`${x},${y + 1}`);
          lit.add(`${x - 1},${y}`);
          lit.add(`${x + 1},${y}`);
        }
      }
    }
  }

  return lit;
}

/**
 * Check if player is illuminated by a dropped torch in a dark zone
 * @param {Object} playerPos - Player position { x, y }
 * @param {Array} grid - The game grid
 * @returns {boolean} - True if player is within torch light radius
 */
export function isPlayerNearDroppedTorch(playerPos, grid) {
  if (!playerPos || !grid) return false;
  const torchLitTiles = getDroppedTorchLitTiles(grid);
  return torchLitTiles.has(`${playerPos.x},${playerPos.y}`);
}

/**
 * Check if the player can pick up items in a dark zone
 * Returns false if player is in dark zone without a light source
 * @param {Object} playerPos - Player position { x, y }
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state
 * @returns {boolean} - True if player can pick up items
 */
export function canPickupInDarkZone(playerPos, grid, gameState = {}) {
  // If not in dark zone, can always pick up
  if (!isPlayerInDarkZone(playerPos, grid, gameState)) {
    return true;
  }
  // In dark zone - can pick up if has light OR is near a dropped torch
  return hasLightInDarkZone(gameState) || isPlayerNearDroppedTorch(playerPos, grid);
}

/**
 * Check if the player can interact with objects in a dark zone
 * Returns false if player is in dark zone without a light source
 * @param {Object} playerPos - Player position { x, y }
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state
 * @returns {boolean} - True if player can interact
 */
export function canInteractInDarkZone(playerPos, grid, gameState = {}) {
  // If not in dark zone, can always interact
  if (!isPlayerInDarkZone(playerPos, grid, gameState)) {
    return true;
  }
  // In dark zone - can interact if has light OR is near a dropped torch
  return hasLightInDarkZone(gameState) || isPlayerNearDroppedTorch(playerPos, grid);
}

/**
 * Check if interaction between two tiles is allowed
 * Blocks interaction across zone boundaries (e.g., from inside cave to outside)
 * @param {Object} fromPos - Source position { x, y }
 * @param {Object} toPos - Target position { x, y }
 * @param {Array} grid - The game grid
 * @param {Object} gameState - Current game state
 * @returns {boolean} - True if interaction is allowed
 */
export function canInteractBetweenTiles(fromPos, toPos, grid, gameState = {}) {
  if (!fromPos || !toPos || !grid) return true;

  const fromCell = grid[fromPos.y]?.[fromPos.x];
  const toCell = grid[toPos.y]?.[toPos.x];
  if (!fromCell || !toCell) return true;

  const fromFloor = fromCell.floor?.type;
  const toFloor = toCell.floor?.type;

  // Cave zone includes 'cave' and 'cave-entry' tiles
  const fromInCave = fromFloor === 'cave' || fromFloor === 'cave-entry';
  const toInCave = toFloor === 'cave' || toFloor === 'cave-entry';

  // If both are in cave zone or both are outside, allow interaction
  if (fromInCave === toInCave) {
    return true;
  }

  // Cave-entry is the threshold - it can interact with both sides
  if (fromFloor === 'cave-entry' || toFloor === 'cave-entry') {
    return true;
  }

  // Crossing zone boundary without going through entry - block
  return false;
}

/**
 * Get the cave region (connected component) that contains the given position
 * Uses flood-fill to find all cave/cave-entry tiles connected to the position
 * @param {Object} playerPos - Player position { x, y }
 * @param {Array} grid - The game grid
 * @returns {Set} - Set of position strings "x,y" for all tiles in this cave region
 */
export function getCaveRegion(playerPos, grid) {
  const region = new Set();
  if (!playerPos || !grid) return region;

  const startCell = grid[playerPos.y]?.[playerPos.x];
  if (!startCell) return region;

  // Check if player is in a cave area
  const startFloor = startCell.floor?.type;
  if (startFloor !== 'cave' && startFloor !== 'cave-entry') {
    return region; // Not in a cave
  }

  // Flood-fill to find all connected cave tiles
  const visited = new Set();
  const queue = [{ x: playerPos.x, y: playerPos.y }];

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const cell = grid[y]?.[x];
    if (!cell) continue;

    const floorType = cell.floor?.type;
    // Only include cave and cave-entry tiles
    if (floorType !== 'cave' && floorType !== 'cave-entry') continue;

    region.add(key);

    // Add cardinal neighbors to queue
    queue.push({ x: x - 1, y });
    queue.push({ x: x + 1, y });
    queue.push({ x, y: y - 1 });
    queue.push({ x, y: y + 1 });
  }

  return region;
}

/**
 * Get the borders of the current tile that lead to non-cave areas
 * Used for auto-revealing borders when standing on edge tiles
 * @param {Object} pos - Tile position { x, y }
 * @param {Array} grid - The game grid
 * @returns {Array} - Array of border strings like "x,y-direction"
 */
export function getTileBorders(pos, grid) {
  const borders = [];
  if (!pos || !grid) return borders;

  const cell = grid[pos.y]?.[pos.x];
  if (!cell) return borders;

  // Only applies to dark zone tiles (caves)
  const floorType = cell.floor?.type;
  const tileDef = TILE_TYPES[floorType];
  if (!tileDef?.isDarkZone) return borders;

  const directions = [
    { dir: 'up', dx: 0, dy: -1 },
    { dir: 'down', dx: 0, dy: 1 },
    { dir: 'left', dx: -1, dy: 0 },
    { dir: 'right', dx: 1, dy: 0 }
  ];

  for (const { dir, dx, dy } of directions) {
    const adjX = pos.x + dx;
    const adjY = pos.y + dy;
    const adjCell = grid[adjY]?.[adjX];

    if (!adjCell) {
      // Out of bounds - this is a border
      borders.push(`${pos.x},${pos.y}-${dir}`);
      continue;
    }

    const adjFloor = adjCell.floor?.type;
    // If adjacent is not cave and not cave-entry, this is a border
    if (adjFloor !== 'cave' && adjFloor !== 'cave-entry') {
      borders.push(`${pos.x},${pos.y}-${dir}`);
    }
  }

  return borders;
}

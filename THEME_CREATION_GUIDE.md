# Complete Guide: Adding New Themes to Escape It

This guide covers **everything** you need to create a new theme for the Escape It puzzle game engine. Follow all steps to ensure your theme appears in the menu and works correctly.

---

## 🚨 CRITICAL: Overview of Required Steps

To add a new theme, you must:
1. Create the theme folder structure
2. Create 6 required files (theme.json, tiles.js, items.js, interactions.js, hazards.js, style.css)
3. **✅ REGISTER the theme in `src/utils/themeRegistry.js`** ← **REQUIRED FOR MENU!**

**Without step 3, your theme will NOT appear in the game menu!**

---

## Theme Structure

Every theme must have this exact folder structure:

```
themes/
  {theme-id}/
    ├── theme.json          # Theme metadata (REQUIRED)
    ├── tiles.js            # Tile definitions and rendering (REQUIRED)
    ├── items.js            # Item definitions and rendering (REQUIRED)
    ├── interactions.js     # Interaction logic (REQUIRED)
    ├── hazards.js          # Hazard checking logic (REQUIRED)
    └── style.css           # Optional theme-specific styling
```

**Important:** The `{theme-id}` folder name must match the `id` field in theme.json exactly.

---

## Step 1: Create theme.json

This file contains metadata about your theme.

**Location:** `themes/{theme-id}/theme.json`

**Required Fields:**
```json
{
  "id": "dungeon",                              // Must match folder name
  "name": "Escape the Dungeon",                 // Display name
  "description": "Navigate dark corridors",     // Short description
  "emoji": "🏰",                                // Theme icon
  "version": "1.0.0",                           // Semantic version
  "author": "Your Name",                        // Creator name
  "primaryColor": "#444466",                    // Main theme color
  "backgroundColor": "#1a1a22",                 // Background color
  "accentColor": "#8888cc"                      // Accent color
}
```

**Example (Dungeon Theme):**
```json
{
  "id": "dungeon",
  "name": "Escape the Dungeon",
  "description": "Navigate dark corridors and escape the castle",
  "emoji": "🏰",
  "version": "1.0.0",
  "author": "Claude",
  "primaryColor": "#444466",
  "backgroundColor": "#1a1a22",
  "accentColor": "#8888cc"
}
```

---

## Step 2: Create tiles.js

This file defines all tile types, their walkability, and custom rendering.

**Location:** `themes/{theme-id}/tiles.js`

**Required Exports:**
1. `TILE_TYPES` - Object containing all tile definitions
2. `isWalkable(tileType, gameState)` - Function to check if tile is walkable
3. `renderTile(ctx, tile, x, y, size)` - Optional custom rendering function
4. `getTileEmoji(tileType)` - Function to get emoji for tile

### Tile Type Structure

```javascript
export const TILE_TYPES = {
  'tile-id': {
    label: 'Display Name',         // Shown in builder toolbar
    emoji: '🟫',                    // Visual representation
    category: 'terrain',            // Category: 'terrain', 'obstacle', 'interactive', 'goal'
    color: '#8b4513',               // Color for styling
    walkable: true,                 // Can player walk on it?
    description: 'Description',     // Tooltip text

    // Optional: Custom rendering
    draw: 'custom-function-name',   // If set, use custom rendering

    // Optional: Configuration
    config: {
      propertyName: {
        type: 'string',             // 'string', 'number', 'boolean', 'select'
        label: 'Property Label',
        default: 'value',
        options: ['opt1', 'opt2']   // For 'select' type
      }
    }
  }
};
```

### Walkability Function

```javascript
export function isWalkable(tileType, gameState) {
  const tile = TILE_TYPES[tileType];
  if (!tile) return false;

  // Simple case: use walkable property
  if (typeof tile.walkable === 'boolean') {
    return tile.walkable;
  }

  // Complex case: conditional walkability based on game state
  switch (tileType) {
    case 'locked-door':
      return gameState.collectedItems.includes('key');
    case 'frozen-path':
      return gameState.collectedItems.includes('ice-pick');
    default:
      return tile.walkable || false;
  }
}
```

### Custom Rendering Function

If a tile needs custom drawing beyond emoji, implement `renderTile`:

```javascript
export function renderTile(ctx, tile, x, y, size) {
  // tile.type is the tile type string (e.g., 'stone-wall')
  // tile.config contains configuration values

  // Check if this tile uses custom rendering
  const tileType = TILE_TYPES[tile.type];
  if (!tileType?.draw) return false;

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Example: Draw stone wall with texture
  if (tileType.draw === 'stone-wall') {
    ctx.fillStyle = '#555566';
    ctx.fillRect(x, y, size, size);

    // Add stone texture
    ctx.fillStyle = '#444455';
    ctx.fillRect(x + 2, y + 2, size * 0.3, size * 0.3);
    ctx.fillRect(x + size * 0.6, y + size * 0.5, size * 0.35, size * 0.4);

    return true; // Signal that we rendered it
  }

  return false; // Tile doesn't need custom rendering
}
```

### Emoji Function

```javascript
export function getTileEmoji(tileType) {
  const tile = TILE_TYPES[tileType];
  return tile?.emoji || null;
}
```

### Complete Example (Dungeon Theme tiles.js)

```javascript
export const TILE_TYPES = {
  floor: {
    label: 'Stone Floor',
    emoji: '⬜',
    category: 'terrain',
    color: '#666677',
    walkable: true,
    description: 'Cold stone floor'
  },
  wall: {
    label: 'Stone Wall',
    emoji: '🟫',
    category: 'obstacle',
    color: '#444455',
    walkable: false,
    description: 'Solid stone wall'
  },
  'locked-door': {
    label: 'Locked Door',
    emoji: '🚪',
    category: 'obstacle',
    color: '#8b4513',
    walkable: false, // Base walkability - overridden by isWalkable()
    description: 'Requires a key to open'
  },
  treasure: {
    label: 'Treasure Chest',
    emoji: '📦',
    category: 'interactive',
    color: '#ffd700',
    walkable: true,
    description: 'Contains valuable items'
  },
  exit: {
    label: 'Exit Portal',
    emoji: '🚪',
    category: 'goal',
    color: '#00ff00',
    walkable: true,
    description: 'Escape through here'
  },
  'item-key': {
    label: 'Key',
    emoji: '🔑',
    category: 'interactive',
    color: '#ffdd00',
    walkable: true,
    description: 'Unlocks doors'
  },
  'item-torch': {
    label: 'Torch',
    emoji: '🔦',
    category: 'interactive',
    color: '#ff8800',
    walkable: true,
    description: 'Illuminates dark areas'
  }
};

export function isWalkable(tileType, gameState) {
  const tile = TILE_TYPES[tileType];
  if (!tile) return false;

  // Locked doors require key
  if (tileType === 'locked-door') {
    return gameState.collectedItems.includes('key');
  }

  return tile.walkable || false;
}

export function renderTile(ctx, tile, x, y, size) {
  // No custom rendering needed for dungeon theme
  return false;
}

export function getTileEmoji(tileType) {
  const tile = TILE_TYPES[tileType];
  return tile?.emoji || null;
}

export const CONFIG_HELP = {
  // Add configuration help if needed
};
```

---

## Step 3: Create items.js

This file defines collectible items, their appearance, and optional custom rendering.

**Location:** `themes/{theme-id}/items.js`

**Required Exports:**
1. `ITEM_TYPES` - Object containing all item definitions
2. `renderItem(ctx, itemType, x, y, size, state)` - Optional custom rendering
3. `getItemEmoji(itemType)` - Function to get emoji for item

### Item Type Structure

```javascript
export const ITEM_TYPES = {
  'item-id': {
    label: 'Item Name',             // Display name
    emoji: '🔑',                    // Visual representation (or null for custom)
    color: '#ffdd00',               // Color for styling
    description: 'What it does',    // Description text

    // Optional: Custom rendering
    draw: 'custom-function',        // If set, use custom rendering

    // Optional: Stateful items (e.g., filled/empty bucket)
    states: {
      empty: { label: 'Empty Bucket', filled: false },
      filled: { label: 'Full Bucket', filled: true }
    },
    defaultState: 'empty'
  }
};
```

### Custom Item Rendering

Items with `draw` property need custom rendering. The `state` parameter allows items to look different based on their state.

```javascript
export function renderItem(ctx, itemType, x, y, size, state = null) {
  const item = ITEM_TYPES[itemType];
  if (!item) return false;

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Example: Render torch with animated flame
  if (item.draw === 'torch') {
    const s = size * 0.3;

    // Torch handle
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(cx - s * 0.15, cy, s * 0.3, s * 0.8);

    // Flame (changes based on state if provided)
    const flameColor = state?.lit ? '#ff8800' : '#666666';
    ctx.fillStyle = flameColor;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.3);
    ctx.lineTo(cx - s * 0.3, cy + s * 0.2);
    ctx.lineTo(cx + s * 0.3, cy + s * 0.2);
    ctx.closePath();
    ctx.fill();

    return true;
  }

  return false; // Use emoji rendering
}
```

### Complete Example (Dungeon items.js)

```javascript
export const ITEM_TYPES = {
  key: {
    label: 'Iron Key',
    emoji: '🔑',
    color: '#ffdd00',
    description: 'Opens locked doors'
  },
  torch: {
    label: 'Torch',
    emoji: '🔦',
    color: '#ff8800',
    description: 'Illuminates dark areas'
  },
  sword: {
    label: 'Sword',
    emoji: '⚔️',
    color: '#c0c0c0',
    description: 'Defeats monsters'
  },
  potion: {
    label: 'Health Potion',
    emoji: '🧪',
    color: '#ff0000',
    description: 'Restores health'
  },
  shield: {
    label: 'Shield',
    emoji: '🛡️',
    color: '#8899aa',
    description: 'Protects from damage'
  }
};

export function renderItem(ctx, itemType, x, y, size, state = null) {
  // No custom rendering for dungeon items
  return false;
}

export function getItemEmoji(itemType) {
  const item = ITEM_TYPES[itemType];
  return item?.emoji || null;
}
```

---

## Step 4: Create interactions.js

This file defines what happens when players interact with tiles and items.

**Location:** `themes/{theme-id}/interactions.js`

**Required Exports:**
1. `INTERACTIONS` - Object containing all interaction definitions
2. `getAvailableInteractions(gameState, grid, x, y)` - Returns available interactions at position
3. `getInteractionLabel(interactionId)` - Returns display label for interaction
4. `executeInteraction(interactionId, gameState, grid, x, y)` - Executes the interaction

### Interaction Structure

```javascript
export const INTERACTIONS = {
  'interaction-id': {
    label: 'Action Label',          // Display text (e.g., "Unlock Door")
    duration: 1000,                 // Animation duration in milliseconds

    // Requirements for this interaction to be available
    requirements: {
      tile: 'locked-door',          // Tile type at position (optional)
      inventory: ['key'],           // Items player must have (optional)
      notInventory: ['sword'],      // Items player must NOT have (optional)
      adjacent: 'treasure',         // Adjacent tile type required (optional)
    },

    // What happens when executed
    execute: (gameState, grid, x, y) => {
      // Modify game state and grid
      // Return result object
      return {
        success: true,
        message: '🔓 Door unlocked!',
        removeItems: ['key'],       // Items to remove from inventory
        addItems: [],               // Items to add to inventory
        sound: 'unlock'             // Optional sound effect
      };
    }
  }
};
```

### Get Available Interactions

```javascript
export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y][x];
  const available = [];

  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    const req = interaction.requirements;

    // Check tile requirement
    if (req.tile && tile.type !== req.tile) continue;

    // Check inventory requirements
    if (req.inventory) {
      const hasAll = req.inventory.every(item =>
        gameState.collectedItems.includes(item)
      );
      if (!hasAll) continue;
    }

    // Check NOT inventory requirements
    if (req.notInventory) {
      const hasAny = req.notInventory.some(item =>
        gameState.collectedItems.includes(item)
      );
      if (hasAny) continue;
    }

    // Check adjacent tiles
    if (req.adjacent) {
      const hasAdjacent = [
        grid[y-1]?.[x],
        grid[y+1]?.[x],
        grid[y]?.[x-1],
        grid[y]?.[x+1]
      ].some(adjTile => adjTile?.type === req.adjacent);

      if (!hasAdjacent) continue;
    }

    available.push(id);
  }

  return available;
}
```

### Execute Interaction

```javascript
export function executeInteraction(interactionId, gameState, grid, x, y) {
  const interaction = INTERACTIONS[interactionId];
  if (!interaction) {
    return { success: false, error: 'Interaction not found' };
  }

  // Execute the interaction's function
  const result = interaction.execute(gameState, grid, x, y);

  // Handle item removal
  if (result.removeItems) {
    result.removeItems.forEach(item => {
      const idx = gameState.collectedItems.indexOf(item);
      if (idx !== -1) gameState.collectedItems.splice(idx, 1);
    });
  }

  // Handle item addition
  if (result.addItems) {
    result.addItems.forEach(item => {
      if (!gameState.collectedItems.includes(item)) {
        gameState.collectedItems.push(item);
      }
    });
  }

  return result;
}

export function getInteractionLabel(interactionId) {
  const interaction = INTERACTIONS[interactionId];
  return interaction?.label || 'Interact...';
}
```

### Complete Example (Dungeon interactions.js)

```javascript
export const INTERACTIONS = {
  'unlock-door': {
    label: '🔓 Unlock Door',
    duration: 1500,
    requirements: {
      tile: 'locked-door',
      inventory: ['key']
    },
    execute: (gameState, grid, x, y) => {
      // Transform door to floor
      grid[y][x] = { type: 'floor', config: {} };

      return {
        success: true,
        message: '🔓 Door unlocked!',
        removeItems: ['key']
      };
    }
  },

  'pickup-key': {
    label: '🔑 Pick Up Key',
    duration: 800,
    requirements: {
      tile: 'item-key',
      notInventory: ['key']
    },
    execute: (gameState, grid, x, y) => {
      // Remove key from grid
      grid[y][x] = { type: 'floor', config: {} };

      return {
        success: true,
        message: '🔑 Key acquired!',
        addItems: ['key']
      };
    }
  },

  'pickup-torch': {
    label: '🔦 Pick Up Torch',
    duration: 800,
    requirements: {
      tile: 'item-torch'
    },
    execute: (gameState, grid, x, y) => {
      grid[y][x] = { type: 'floor', config: {} };

      return {
        success: true,
        message: '🔦 Torch acquired!',
        addItems: ['torch']
      };
    }
  },

  'pickup-sword': {
    label: '⚔️ Pick Up Sword',
    duration: 800,
    requirements: {
      tile: 'item-sword'
    },
    execute: (gameState, grid, x, y) => {
      grid[y][x] = { type: 'floor', config: {} };

      return {
        success: true,
        message: '⚔️ Sword acquired!',
        addItems: ['sword']
      };
    }
  },

  'open-treasure': {
    label: '📦 Open Treasure',
    duration: 2000,
    requirements: {
      tile: 'treasure'
    },
    execute: (gameState, grid, x, y) => {
      // Replace treasure with random item
      const items = ['key', 'potion', 'shield'];
      const randomItem = items[Math.floor(Math.random() * items.length)];

      grid[y][x] = { type: `item-${randomItem}`, config: {} };

      return {
        success: true,
        message: '📦 Treasure opened!'
      };
    }
  },

  'use-potion': {
    label: '🧪 Use Potion',
    duration: 1000,
    requirements: {
      inventory: ['potion']
    },
    execute: (gameState, grid, x, y) => {
      // Restore health
      gameState.lives = Math.min(gameState.lives + 1, gameState.maxLives);

      return {
        success: true,
        message: '🧪 Health restored!',
        removeItems: ['potion']
      };
    }
  },

  'defeat-monster': {
    label: '⚔️ Defeat Monster',
    duration: 2000,
    requirements: {
      tile: 'monster',
      inventory: ['sword']
    },
    execute: (gameState, grid, x, y) => {
      // Remove monster
      grid[y][x] = { type: 'floor', config: {} };

      return {
        success: true,
        message: '⚔️ Monster defeated!'
      };
    }
  }
};

export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y][x];
  const available = [];

  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    const req = interaction.requirements;

    // Check tile requirement
    if (req.tile && tile.type !== req.tile) continue;

    // Check inventory requirements
    if (req.inventory) {
      const hasAll = req.inventory.every(item =>
        gameState.collectedItems.includes(item)
      );
      if (!hasAll) continue;
    }

    // Check NOT inventory requirements
    if (req.notInventory) {
      const hasAny = req.notInventory.some(item =>
        gameState.collectedItems.includes(item)
      );
      if (hasAny) continue;
    }

    available.push(id);
  }

  return available;
}

export function getInteractionLabel(interactionId) {
  const interaction = INTERACTIONS[interactionId];
  return interaction?.label || 'Interact...';
}

export function executeInteraction(interactionId, gameState, grid, x, y) {
  const interaction = INTERACTIONS[interactionId];
  if (!interaction) {
    return { success: false, error: 'Interaction not found' };
  }

  const result = interaction.execute(gameState, grid, x, y);

  // Handle item changes
  if (result.removeItems) {
    result.removeItems.forEach(item => {
      const idx = gameState.collectedItems.indexOf(item);
      if (idx !== -1) gameState.collectedItems.splice(idx, 1);
    });
  }

  if (result.addItems) {
    result.addItems.forEach(item => {
      if (!gameState.collectedItems.includes(item)) {
        gameState.collectedItems.push(item);
      }
    });
  }

  return result;
}
```

---

## Step 5: Create hazards.js

This file defines environmental hazards that can damage the player.

**Location:** `themes/{theme-id}/hazards.js`

**Required Exports:**
1. `HAZARD_TYPES` - Object containing hazard definitions
2. `checkHazardAt(grid, x, y, gameState)` - Check for hazards at position
3. `getAllHazardZones(grid)` - Get all hazard locations (for visual overlay)
4. `renderHazardOverlay(ctx, grid, tileSize, offsetX, offsetY)` - Optional visual overlay

### Hazard Type Structure

```javascript
export const HAZARD_TYPES = {
  'hazard-id': {
    emoji: '🔥',                    // Visual representation
    damage: 1,                      // Damage amount
    message: 'You got burned!',     // Damage message
    renderColor: 'rgba(255,100,0,0.3)', // Overlay color

    // Optional: Immunity items
    immunity: ['shield'],           // Items that prevent damage

    // Optional: Custom damage calculation
    calculateDamage: (gameState) => {
      return gameState.inventory.includes('armor') ? 0 : 1;
    }
  }
};
```

### Check Hazard Function

```javascript
export function checkHazardAt(grid, x, y, gameState) {
  const tile = grid[y][x];

  // Check for spike trap
  if (tile.type === 'spike-trap') {
    const hazard = HAZARD_TYPES.spikes;

    // Check immunity
    if (hazard.immunity) {
      const isImmune = hazard.immunity.some(item =>
        gameState.collectedItems.includes(item)
      );
      if (isImmune) return null;
    }

    return {
      type: 'spikes',
      damage: hazard.damage,
      message: hazard.message
    };
  }

  // Check for poison gas (adjacent check)
  const adjacent = [
    grid[y-1]?.[x],
    grid[y+1]?.[x],
    grid[y]?.[x-1],
    grid[y]?.[x+1]
  ];

  if (adjacent.some(t => t?.type === 'poison-gas')) {
    const hazard = HAZARD_TYPES.poison;
    return {
      type: 'poison',
      damage: hazard.damage,
      message: hazard.message
    };
  }

  return null; // No hazard
}
```

### Complete Example (Dungeon hazards.js)

```javascript
export const HAZARD_TYPES = {
  spikes: {
    emoji: '🗡️',
    damage: 1,
    message: '🗡️ Ouch! Spike trap!',
    renderColor: 'rgba(200,0,0,0.3)',
    immunity: ['shield']
  },

  monster: {
    emoji: '👹',
    damage: 1,
    message: '👹 Monster attacks!',
    renderColor: 'rgba(139,0,0,0.3)',
    immunity: ['sword']
  },

  poison: {
    emoji: '☠️',
    damage: 1,
    message: '☠️ Poison gas!',
    renderColor: 'rgba(0,200,0,0.3)'
  }
};

export function checkHazardAt(grid, x, y, gameState) {
  const tile = grid[y][x];

  // Direct hazard tiles
  if (tile.type === 'spike-trap') {
    const hazard = HAZARD_TYPES.spikes;

    // Check immunity
    if (gameState.collectedItems.includes('shield')) {
      return null; // Protected
    }

    return {
      type: 'spikes',
      damage: hazard.damage,
      message: hazard.message
    };
  }

  if (tile.type === 'monster') {
    const hazard = HAZARD_TYPES.monster;

    // Check immunity
    if (gameState.collectedItems.includes('sword')) {
      return null; // Can defeat
    }

    return {
      type: 'monster',
      damage: hazard.damage,
      message: hazard.message
    };
  }

  // Adjacent poison gas
  const adjacent = [
    grid[y-1]?.[x],
    grid[y+1]?.[x],
    grid[y]?.[x-1],
    grid[y]?.[x+1]
  ];

  if (adjacent.some(t => t?.type === 'poison-gas')) {
    return {
      type: 'poison',
      damage: HAZARD_TYPES.poison.damage,
      message: HAZARD_TYPES.poison.message
    };
  }

  return null;
}

export function getAllHazardZones(grid) {
  const zones = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const tile = grid[y][x];

      if (tile.type === 'spike-trap') {
        zones.push({ x, y, type: 'spikes' });
      }

      if (tile.type === 'monster') {
        zones.push({ x, y, type: 'monster' });
      }

      if (tile.type === 'poison-gas') {
        // Add adjacent zones too
        zones.push({ x, y, type: 'poison' });
        zones.push({ x: x-1, y, type: 'poison' });
        zones.push({ x: x+1, y, type: 'poison' });
        zones.push({ x, y: y-1, type: 'poison' });
        zones.push({ x, y: y+1, type: 'poison' });
      }
    }
  }

  return zones;
}

export function renderHazardOverlay(ctx, grid, tileSize, offsetX, offsetY) {
  const zones = getAllHazardZones(grid);

  zones.forEach(zone => {
    const hazard = HAZARD_TYPES[zone.type];
    if (!hazard) return;

    const x = zone.x * tileSize + offsetX;
    const y = zone.y * tileSize + offsetY;

    ctx.fillStyle = hazard.renderColor;
    ctx.fillRect(x, y, tileSize, tileSize);
  });
}
```

---

## Step 6: Create style.css (Optional)

Custom styling for your theme.

**Location:** `themes/{theme-id}/style.css`

**Example:**
```css
/* Dungeon Theme Styles */
[data-theme="dungeon"] {
  --theme-primary: #444466;
  --theme-background: #1a1a22;
  --theme-accent: #8888cc;
}

[data-theme="dungeon"] body {
  background: linear-gradient(135deg, #1a1a22 0%, #2a2a33 100%);
}

[data-theme="dungeon"] .grid-cell {
  border-color: rgba(136, 136, 204, 0.2);
}

[data-theme="dungeon"] .player {
  filter: drop-shadow(0 0 10px #8888cc);
}
```

---

## 🚨 Step 7: REGISTER YOUR THEME (CRITICAL!)

**This step is REQUIRED for your theme to appear in the game menu!**

**Location:** `src/utils/themeRegistry.js`

Add your theme to the `AVAILABLE_THEMES` array:

```javascript
export const AVAILABLE_THEMES = [
  {
    id: 'forest',
    name: 'Lost in the Forest',
    description: 'Escape the mystical forest',
    emoji: '🌲',
    difficulty: 'Medium',
    author: 'Original'
  },
  // ADD YOUR THEME HERE ⬇️
  {
    id: 'dungeon',                              // Must match folder name AND theme.json id
    name: 'Escape the Dungeon',                 // Display name
    description: 'Navigate dark corridors',     // Short description
    emoji: '🏰',                                // Theme icon
    difficulty: 'Hard',                         // Optional difficulty
    author: 'Your Name'                         // Optional author
  }
];
```

**Critical Requirements:**
- The `id` field MUST exactly match:
  - Your theme folder name (`themes/dungeon/`)
  - The `id` field in `theme.json`
- Without this registration, your theme will NOT appear in:
  - Theme selection menu
  - Level browser theme filters
  - Anywhere in the UI

**After adding your theme here, it will immediately appear in the game menu on next page load.**

---

## Testing Your Theme

### ✅ Complete Checklist

1. **Folder Structure**
   - [ ] Created `themes/{theme-id}/` folder
   - [ ] Folder name matches theme.json `id` field exactly

2. **Required Files**
   - [ ] Created `theme.json` with all required fields
   - [ ] Created `tiles.js` with TILE_TYPES, isWalkable, getTileEmoji
   - [ ] Created `items.js` with ITEM_TYPES, renderItem, getItemEmoji
   - [ ] Created `interactions.js` with INTERACTIONS and functions
   - [ ] Created `hazards.js` with HAZARD_TYPES and checkHazardAt
   - [ ] Created `style.css` (optional but recommended)

3. **Theme Registration** ← **MOST IMPORTANT!**
   - [ ] Added theme to `src/utils/themeRegistry.js` AVAILABLE_THEMES array
   - [ ] Verified `id` matches folder name and theme.json

4. **Functionality Tests**
   - [ ] Theme appears in main menu theme selection
   - [ ] Can create new level with theme
   - [ ] All tiles render correctly in builder
   - [ ] All items render correctly in builder
   - [ ] Can place player start and exit
   - [ ] Can save level
   - [ ] Can load and play level
   - [ ] All interactions work correctly
   - [ ] Hazards damage player correctly
   - [ ] Level completion works

5. **Visual Tests**
   - [ ] Theme colors applied correctly
   - [ ] Custom rendered items/tiles look good
   - [ ] Emoji fallbacks work
   - [ ] Theme badge shows in level list

### Manual Testing Steps

1. **Start the app** - Theme should appear in "Create New Escape Room" menu
2. **Select your theme** - Should load into builder with theme colors
3. **Build a simple level:**
   - Place floor tiles
   - Place obstacles
   - Place items
   - Place player start
   - Place exit
4. **Add missions** - Configure win conditions
5. **Save level** - Check localStorage for themeId
6. **Play level** - Test all interactions and hazards
7. **Complete level** - Verify win condition triggers

---

## Common Issues and Solutions

### Theme doesn't appear in menu
**Cause:** Not registered in `src/utils/themeRegistry.js`
**Solution:** Add theme to AVAILABLE_THEMES array with matching `id`

### Theme fails to load
**Cause:** Folder name doesn't match theme.json `id`
**Solution:** Ensure exact match: `themes/dungeon/` and `{ "id": "dungeon" }`

### Interactions don't work
**Cause:** Missing or incorrect requirements
**Solution:** Check `getAvailableInteractions()` logic, verify tile types and inventory items match exactly

### Tiles not rendering
**Cause:** Missing emoji or custom rendering not working
**Solution:** Ensure `getTileEmoji()` returns valid emoji, or implement `renderTile()` correctly

### Hazards not damaging player
**Cause:** `checkHazardAt()` not checking correct tile types
**Solution:** Verify hazard tile type matches what's in grid, check immunity conditions

### Custom rendering not working
**Cause:** `renderTile()` or `renderItem()` not returning `true`
**Solution:** Must return `true` after drawing to signal custom rendering succeeded

---

## Advanced Tips

### Multi-Step Interactions

For complex interactions requiring multiple items or steps:

```javascript
'craft-ladder': {
  label: '🪜 Craft Ladder',
  duration: 2500,
  requirements: {
    inventory: ['wood', 'rope']
  },
  execute: (gameState, grid, x, y) => {
    return {
      success: true,
      message: '🪜 Ladder crafted!',
      removeItems: ['wood', 'rope'],
      addItems: ['ladder']
    };
  }
}
```

### Conditional Hazards

Hazards that depend on game state:

```javascript
export function checkHazardAt(grid, x, y, gameState) {
  if (tile.type === 'darkness') {
    // Only dangerous without torch
    if (!gameState.collectedItems.includes('torch')) {
      return {
        type: 'darkness',
        damage: 1,
        message: '🌑 Lost in darkness!'
      };
    }
  }
  return null;
}
```

### Animated Tiles

Use canvas to create animated effects:

```javascript
export function renderTile(ctx, tile, x, y, size) {
  if (tile.type === 'water') {
    const time = Date.now() / 1000;
    const wave = Math.sin(time * 2 + x + y) * 5;

    ctx.fillStyle = '#4488dd';
    ctx.fillRect(x, y + wave, size, size);

    return true;
  }
  return false;
}
```

---

## Summary

To add a new theme:

1. ✅ Create `themes/{theme-id}/` folder
2. ✅ Create 6 files: theme.json, tiles.js, items.js, interactions.js, hazards.js, style.css
3. ✅ **REGISTER in `src/utils/themeRegistry.js`** ← **CRITICAL!**
4. ✅ Test thoroughly
5. ✅ Verify theme appears in menu

**Remember:** Step 3 (registration) is REQUIRED. Without it, your perfectly crafted theme will not appear in the game, no matter how good the theme files are!

---

## Need Help?

- Check the forest theme (`themes/forest/`) as a complete reference implementation
- All theme files must export the exact functions listed in this guide
- The `id` field must match everywhere: folder name, theme.json, and registry
- Test each file individually before testing the complete theme
- Use browser console to debug dynamic import errors

Happy theme building! 🎨

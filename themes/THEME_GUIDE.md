# Escape It - Theme Creation Guide

Create your own themes for Escape It without touching the engine code. Everything is self-contained within your theme folder.

## Quick Start

1. Create a folder in `themes/` with your theme id (e.g., `themes/my-theme/`)
2. Create these 5 files:
   - `theme.json` - Theme metadata and configuration
   - `tiles.js` - Tile definitions and movement rules
   - `items.js` - Collectible item definitions
   - `interactions.js` - Player interactions (E key actions)
   - `hazards.js` - Hazard zones (optional, can be empty)

3. Register your theme in `src/App.jsx` (add to AVAILABLE_THEMES array)

---

## File Reference

### theme.json

Basic metadata and configuration for your theme.

```json
{
  "id": "my-theme",
  "name": "My Theme Name",
  "description": "Short description",
  "emoji": "🎮",
  "version": "1.0.0",
  "author": "Your Name",

  "primaryColor": "#6688aa",
  "backgroundColor": "#1a1a1a",
  "accentColor": "#88aacc",

  "startTile": "start",
  "exitTiles": ["exit"],

  "ui": {
    "primaryColor": "#6688aa",
    "backgroundColor": "#1a1a1a",
    "accentColor": "#88aacc",
    "dangerColor": "#ff4444",
    "panelBackground": "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
    "hudBackground": "linear-gradient(180deg, rgba(25, 25, 25, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)",
    "messageBackground": "linear-gradient(145deg, rgba(50, 50, 50, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%)",
    "buttonBackground": "linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)",
    "buttonHoverShadow": "0 8px 28px rgba(100, 150, 200, 0.4)"
  },

  "missions": {
    "types": ["collect", "reach", "escape"],
    "targetOptions": {
      "collect": ["key", "card", "gem"]
    },
    "defaultMission": {
      "type": "escape",
      "description": "Reach the exit"
    }
  }
}
```

**Key Fields:**
- `startTile` - Tile type where player spawns
- `exitTiles` - Array of tile types that count as level exit
- `missions.types` - Available mission types for this theme
- `missions.targetOptions` - Dropdown options for "collect" missions
- `missions.defaultMission` - Auto-added if level has no escape mission

---

### tiles.js

Define all tile types, their appearance, and movement rules.

```javascript
// Lock/door colors (if your theme has locked doors)
export const LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444', dark: '#882222' },
  blue: { label: 'Blue', color: '#4444cc', dark: '#222288' }
};

// All tile types in your theme
export const TILE_TYPES = {
  empty: {
    label: 'Empty',
    color: '#0a0a0a',
    category: 'basic',
    tooltip: 'Empty void. Not walkable.',
    walkable: false
  },
  wall: {
    label: 'Wall',
    color: '#3a3a3a',
    category: 'basic',
    tooltip: 'Solid wall.',
    walkable: false
  },
  floor: {
    label: 'Floor',
    color: '#4a4a4a',
    category: 'basic',
    configurable: true,              // Shows in Properties Panel when selected
    defaultConfig: { floorColor: 'gray' },  // Default config when tile is placed
    tooltip: 'Walkable floor.',
    walkable: true
  },
  start: {
    label: 'Start',
    color: '#44aa44',
    category: 'basic',
    unique: true,
    tooltip: 'Player spawn point.',
    walkable: true
  },
  exit: {
    label: 'Exit',
    color: '#4488cc',
    category: 'basic',
    unique: true,
    tooltip: 'Level exit.',
    walkable: true
  },

  // Interactive tile example
  'my-obstacle': {
    label: 'Obstacle',
    color: '#884422',
    category: 'interactive',
    tooltip: 'Blocks path until removed.',
    walkable: false
  },

  // Item tile example (player can pick up)
  'item-gem': {
    label: 'Gem',
    color: '#44ffff',
    category: 'interactive',
    isItemTile: true,
    itemType: 'gem',
    tooltip: 'Collectible gem.',
    walkable: true
  }
};

// Floor color variants
export const FLOOR_COLORS = {
  gray: { label: 'Gray', color: '#4a4a4a' },
  blue: { label: 'Blue', color: '#3a3a5a' }
};

// Help text for configurable tiles (shown below each field)
export const CONFIG_HELP = {
  floor: {
    floorColor: 'Visual color of the floor.'
  }
};

// === CONFIG_SCHEMA: Dynamic Properties Panel ===
// Define configurable fields for tiles that appear in the Properties Panel

export const CONFIG_SCHEMA = {
  // Floor tile with color selection
  floor: {
    floorColor: {
      type: 'select',           // Field type: 'select', 'checkbox', 'text', 'number'
      label: 'Floor Color',     // Label shown in Properties Panel
      options: 'FLOOR_COLORS',  // Key name of exported options object
      default: 'gray'           // Default value
    }
  },

  // Example: Camera tile with direction and range
  camera: {
    direction: {
      type: 'select',
      label: 'Direction',
      options: 'CAMERA_DIRECTIONS',  // Must export CAMERA_DIRECTIONS object
      default: 'down'
    },
    range: {
      type: 'number',
      label: 'Vision Range',
      min: 1,                   // Minimum value
      max: 5,                   // Maximum value
      default: 3
    }
  },

  // Example: Door with color and auto-close
  'door-key': {
    lockColor: {
      type: 'select',
      label: 'Lock Color',
      options: 'LOCK_COLORS',
      default: 'red'
    },
    autoClose: {
      type: 'checkbox',
      label: 'Auto-close after passing',
      default: false
    }
  },

  // Example: Sign with custom text
  sign: {
    message: {
      type: 'text',
      label: 'Message',
      placeholder: 'Enter sign text...',
      default: ''
    }
  }
};

// Options objects referenced by CONFIG_SCHEMA (must be exported)
export const CAMERA_DIRECTIONS = {
  up: { label: 'Up' },
  down: { label: 'Down' },
  left: { label: 'Left' },
  right: { label: 'Right' }
};

// === TILE CLASSIFICATIONS ===

// Tiles where items can be dropped
export const GROUND_TILES = ['floor', 'start', 'exit'];

// Tiles player can interact with (E key)
export const INTERACTABLE_TILES = ['my-obstacle'];

// Ignored for floor color detection
export const IGNORE_TILES = ['wall', 'empty'];

// Tiles using lock colors
export const LOCK_TILES = ['door-key', 'item-key'];

// Hazard tile types (for 'extinguish' mission)
export const HAZARD_TILE_TYPES = ['fire', 'lava'];

// === REQUIRED FUNCTIONS ===

export function isWalkable(tileType, gameState = {}) {
  const tile = TILE_TYPES[tileType];
  return tile?.walkable === true;
}

// Custom tile rendering (return true if handled, false for emoji fallback)
export function renderTile(ctx, tile, cx, cy, size) {
  if (tile.type === 'floor') {
    const color = FLOOR_COLORS[tile.config?.floorColor]?.color || '#4a4a4a';
    ctx.fillStyle = color;
    ctx.fillRect(cx - size/2, cy - size/2, size, size);
    return true;
  }
  return false; // Use emoji or default
}

export function getTileEmoji(tileType) {
  const emojis = {
    start: '🚪',
    exit: '🏁',
    'item-gem': '💎'
  };
  return emojis[tileType] || null;
}

// === MOVEMENT RULES ===

// Return: { allowed, message?, loseLife?, setSourceTile?, setDestTile? }
export function checkMovementInto(tileType, gameState, tileConfig) {
  switch (tileType) {
    case 'my-obstacle':
      return { allowed: false, message: 'Path blocked!' };

    case 'hazard':
      return { allowed: false, loseLife: true, message: 'Ouch!' };

    default:
      return { allowed: isWalkable(tileType, gameState) };
  }
}

// Exit requirements (optional - return { allowed: true } if no requirements)
export function checkExitRequirements(gameState, exitConfig) {
  // Example: require a key to exit
  if (exitConfig?.needsKey) {
    const hasKey = gameState.inventory?.some(i => i.itemType === 'key');
    if (!hasKey) {
      return { allowed: false, message: 'Need a key to exit!' };
    }
  }
  return { allowed: true };
}
```

**Movement Rule Return Values:**
- `allowed: boolean` - Can the player enter this tile?
- `message: string` - Message to show player
- `loseLife: boolean` - Lose a life when attempting entry
- `setSourceTile: object` - Replace the tile player is leaving (e.g., for rafts)
- `setDestTile: object` - Replace the destination tile

---

### CONFIG_SCHEMA Reference

The `CONFIG_SCHEMA` export in `tiles.js` defines which properties appear in the Properties Panel when a tile is selected in the builder. Each tile type can have multiple configurable fields.

**Field Types:**

| Type | Description | Extra Properties |
|------|-------------|------------------|
| `checkbox` | Boolean toggle | `default: boolean` |
| `text` | Text input | `default: string`, `placeholder: string` |
| `number` | Numeric input | `default: number`, `min: number`, `max: number` |
| `select` | Dropdown menu | `default: string`, `options: string` (key name) |

**Select Options:**

For `select` fields, the `options` property is a string key that references an exported object in your `tiles.js`:

```javascript
// CONFIG_SCHEMA references 'FLOOR_COLORS' by name
export const CONFIG_SCHEMA = {
  floor: {
    floorColor: { type: 'select', label: 'Floor Color', options: 'FLOOR_COLORS', default: 'gray' }
  }
};

// The actual options - must be exported
export const FLOOR_COLORS = {
  gray: { label: 'Gray', color: '#4a4a4a' },
  blue: { label: 'Blue', color: '#3a3a5a' },
  wood: { label: 'Wood', color: '#8b6914' }
};
```

**Accessing Config in Code:**

Tile config values are stored in `tile.config` and can be accessed in rendering and movement functions:

```javascript
export function renderTile(ctx, tile, cx, cy, size) {
  if (tile.type === 'floor') {
    // Read the configured floor color
    const colorKey = tile.config?.floorColor || 'gray';
    const color = FLOOR_COLORS[colorKey]?.color || '#4a4a4a';
    ctx.fillStyle = color;
    ctx.fillRect(cx - size/2, cy - size/2, size, size);
    return true;
  }
  return false;
}
```

**Help Text:**

Add `CONFIG_HELP` to show explanatory text below each field:

```javascript
export const CONFIG_HELP = {
  camera: {
    direction: 'Which way the camera faces.',
    range: 'How many tiles the camera can see.'
  }
};
```

---

### items.js

Define collectible items that go in the player's inventory.

```javascript
export const ITEM_TYPES = {
  gem: {
    label: 'Gem',
    emoji: '💎',
    color: '#44ffff',
    description: 'Shiny collectible'
  },
  key: {
    label: 'Key',
    emoji: null, // Use custom rendering
    color: '#ffdd00',
    description: 'Opens locked doors'
  }
};

// Render item on grid (return true if custom rendered)
export function renderItem(ctx, itemType, x, y, size, state = {}) {
  if (itemType === 'key') {
    // Custom key rendering with lock color
    const color = state?.lockColor ? LOCK_COLORS[state.lockColor]?.color : '#ffdd00';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }
  return false; // Use emoji
}

// Render item in inventory HUD
export function renderInventoryItem(ctx, itemType, x, y, size, state = {}) {
  return renderItem(ctx, itemType, x, y, size, state);
}

export function getItemEmoji(itemType) {
  return ITEM_TYPES[itemType]?.emoji || null;
}

// Label with state info (e.g., "Red Key" instead of "Key")
export function getItemLabel(itemType, state = {}) {
  const item = ITEM_TYPES[itemType];
  const baseLabel = item?.label || itemType;

  if (itemType === 'key' && state?.lockColor) {
    return `${state.lockColor} ${baseLabel}`;
  }
  return baseLabel;
}
```

---

### interactions.js

Define what happens when player presses E near tiles.

```javascript
// Helper functions
function hasItemType(inventory, itemType) {
  return inventory?.some(item => item.itemType === itemType) || false;
}

// All interactions
export const INTERACTIONS = {
  'remove-obstacle': {
    label: 'Remove Obstacle',
    duration: 1500, // milliseconds to hold E
    requirements: {
      tile: 'my-obstacle',      // Must be facing this tile type
      inventory: ['tool']        // Must have these items
    },
    execute: (gameState, grid, x, y) => {
      // Remove the obstacle
      grid[y][x] = { type: 'floor', config: {} };

      return {
        success: true,
        message: 'Obstacle removed!',
        modifyGrid: true  // IMPORTANT: set true if you changed grid
      };
    }
  },

  'unlock-door': {
    label: 'Unlock Door',
    duration: 1000,
    requirements: { tile: 'door-key' },
    // Custom check for matching key color
    checkCustom: (gameState, tile) => {
      const doorColor = tile.config?.lockColor || 'red';
      return gameState.inventory?.some(
        item => item.itemType === 'key' && item.lockColor === doorColor
      );
    },
    execute: (gameState, grid, x, y) => {
      const doorColor = grid[y][x].config?.lockColor || 'red';

      // Remove key from inventory
      const keyIdx = gameState.inventory.findIndex(
        item => item.itemType === 'key' && item.lockColor === doorColor
      );
      gameState.inventory = gameState.inventory.filter((_, i) => i !== keyIdx);

      // Open the door
      grid[y][x] = { type: 'door-open', config: {} };

      return {
        success: true,
        message: `Unlocked ${doorColor} door!`,
        modifyGrid: true,
        modifyInventory: true
      };
    }
  }
};

// === REQUIRED EXPORTS ===

export function getAvailableInteractions(gameState, grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) return [];

  const available = [];

  for (const [id, interaction] of Object.entries(INTERACTIONS)) {
    if (checkRequirements(interaction.requirements, gameState, tile, interaction)) {
      available.push({
        id,
        label: interaction.label,
        duration: interaction.duration
      });
    }
  }

  return available;
}

function checkRequirements(req, gameState, tile, interaction) {
  if (!req) return true;

  // Check tile type
  if (req.tile && tile.type !== req.tile) return false;

  // Check tile is one of multiple types
  if (req.tileAny && !req.tileAny.includes(tile.type)) return false;

  // Check inventory
  if (req.inventory) {
    for (const itemType of req.inventory) {
      if (!hasItemType(gameState.inventory, itemType)) return false;
    }
  }

  // Check item state (e.g., bucket must be filled)
  if (req.itemState) {
    const { itemType, ...stateChecks } = req.itemState;
    const item = gameState.inventory?.find(i => i.itemType === itemType);
    if (!item) return false;
    for (const [key, value] of Object.entries(stateChecks)) {
      if (item[key] !== value) return false;
    }
  }

  // Custom check function
  if (interaction?.checkCustom) {
    if (!interaction.checkCustom(gameState, tile)) return false;
  }

  return true;
}

export function getInteractionLabel(interactionId) {
  const interaction = INTERACTIONS[interactionId];
  return interaction ? interaction.label + '...' : 'Interact...';
}

export function executeInteraction(interactionId, gameState, grid, x, y) {
  const interaction = INTERACTIONS[interactionId];
  if (!interaction) return { success: false, error: 'Unknown interaction' };

  const tile = grid[y]?.[x];
  if (!tile) return { success: false, error: 'Invalid position' };

  if (!checkRequirements(interaction.requirements, gameState, tile, interaction)) {
    return { success: false, error: 'Requirements not met' };
  }

  return interaction.execute(gameState, grid, x, y);
}
```

**Execute Return Values:**
- `success: boolean` - Did the interaction succeed?
- `message: string` - Message to show player
- `modifyGrid: boolean` - Set TRUE if you changed the grid
- `modifyInventory: boolean` - Set true if you changed inventory
- `modifyState: object` - Additional state changes (e.g., `{ rescuedFriends: 1 }`)

---

### hazards.js

Define hazard zones that damage the player (optional).

```javascript
export const HAZARD_TYPES = {
  fire: {
    damage: 1,
    renderColor: '#ff4400',
    message: 'Burned by fire!'
  }
};

export function checkHazardAt(grid, x, y, gameState) {
  const tile = grid[y]?.[x];
  if (!tile) return null;

  // Example: fire hazard
  if (tile.type === 'fire') {
    return HAZARD_TYPES.fire;
  }

  return null;
}

export function getAllHazardZones(grid) {
  const zones = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const tile = grid[y][x];

      if (tile.type === 'fire') {
        zones.push({
          x, y,
          hazardType: 'fire',
          renderColor: HAZARD_TYPES.fire.renderColor
        });
      }
    }
  }

  return zones;
}

export function renderHazardOverlay(ctx, grid, tileSize, offsetX, offsetY) {
  // Optional: custom hazard rendering
}
```

If your theme has no hazards, just export empty functions:

```javascript
export const HAZARD_TYPES = {};
export function checkHazardAt() { return null; }
export function getAllHazardZones() { return []; }
export function renderHazardOverlay() {}
```

---

## Registering Your Theme

Add your theme to `src/App.jsx`:

```javascript
const AVAILABLE_THEMES = [
  { id: 'forest', name: 'Lost in the Forest', emoji: '🌲' },
  { id: 'bank-robbery', name: 'Bank Heist', emoji: '🏦' },
  { id: 'my-theme', name: 'My Theme', emoji: '🎮' }  // Add here
];
```

---

## Mission Types

Available mission types (defined in `src/utils/constants.js`):

| Type | Description | Needs Target |
|------|-------------|--------------|
| `collect` | Player must collect specific item | Yes (item type) |
| `rescue` | Player must rescue friends | No |
| `extinguish` | Player must remove all hazards | No |
| `reach` | Player must reach coordinates | Yes (x,y) |
| `escape` | Player must reach exit | No |

Configure which types your theme supports in `theme.json`:

```json
{
  "missions": {
    "types": ["collect", "escape"],
    "targetOptions": {
      "collect": ["gem", "key", "coin"]
    }
  }
}
```

---

## Tips

1. **Start simple** - Copy `bank-robbery` as a template (simpler than `forest`)

2. **Test incrementally** - Add one tile type at a time

3. **Use custom rendering** - Return `true` from `renderTile()` for polished graphics

4. **Remember modifyGrid** - Always set `modifyGrid: true` if your interaction changes tiles

5. **Hazards are optional** - Many themes don't need them

6. **Lock colors are shared** - Define `LOCK_COLORS` in both `tiles.js` and `items.js` for consistency

7. **Make tiles configurable** - Set `configurable: true` on tiles that need per-instance settings, then define their fields in `CONFIG_SCHEMA`

8. **Export options objects** - Any object referenced in `CONFIG_SCHEMA` (like `FLOOR_COLORS`, `CAMERA_DIRECTIONS`) must be exported from `tiles.js`

---

## Example: Minimal Theme

A bare-bones theme with just walls, floors, and exits:

**theme.json:**
```json
{
  "id": "minimal",
  "name": "Minimal",
  "emoji": "⬜",
  "startTile": "start",
  "exitTiles": ["exit"],
  "missions": {
    "types": ["escape"],
    "defaultMission": { "type": "escape", "description": "Reach the exit" }
  }
}
```

**tiles.js:**
```javascript
export const TILE_TYPES = {
  empty: { label: 'Empty', color: '#000', walkable: false },
  wall: { label: 'Wall', color: '#444', walkable: false },
  floor: { label: 'Floor', color: '#666', walkable: true },
  start: { label: 'Start', color: '#4a4', walkable: true, unique: true },
  exit: { label: 'Exit', color: '#48c', walkable: true, unique: true }
};

export const GROUND_TILES = ['floor', 'start', 'exit'];
export const INTERACTABLE_TILES = [];
export const IGNORE_TILES = ['wall', 'empty'];
export const LOCK_TILES = [];
export const HAZARD_TILE_TYPES = [];

export function isWalkable(type) { return TILE_TYPES[type]?.walkable; }
export function renderTile() { return false; }
export function getTileEmoji(type) { return type === 'start' ? '🚪' : type === 'exit' ? '🏁' : null; }
export function checkMovementInto(type) { return { allowed: isWalkable(type) }; }
export function checkExitRequirements() { return { allowed: true }; }
```

**items.js:**
```javascript
export const ITEM_TYPES = {};
export function renderItem() { return false; }
export function renderInventoryItem() { return false; }
export function getItemEmoji() { return null; }
export function getItemLabel(type) { return type; }
```

**interactions.js:**
```javascript
export const INTERACTIONS = {};
export function getAvailableInteractions() { return []; }
export function getInteractionLabel() { return 'Interact...'; }
export function executeInteraction() { return { success: false }; }
```

**hazards.js:**
```javascript
export const HAZARD_TYPES = {};
export function checkHazardAt() { return null; }
export function getAllHazardZones() { return []; }
export function renderHazardOverlay() {}
```

---

That's it! Your theme is completely self-contained. The engine handles everything else automatically.

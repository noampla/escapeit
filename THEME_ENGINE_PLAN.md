# Escape It - Theme Engine Transformation Plan

## Executive Summary

This document outlines the plan to transform the current "Lost in the Forest" puzzle game into **"Escape It"** - a generic escape room engine that supports multiple themes through a plugin-like architecture. The goal is to make theme creation AI-friendly: an AI agent (Claude Code) should be able to take theme instructions and create a new playable escape room by writing isolated theme files with minimal code changes to the core engine.

---

## Current State Analysis

### What Works Well (Keep As-Is)
1. **Core Engine Architecture** - Grid system, collision, missions, fog-of-war
2. **Builder/Solver Separation** - Clean separation between level creation and gameplay
3. **Storage System** - LocalStorage-based persistence works universally
4. **Mission System** - Already generic with 5 mission types
5. **Interaction Mechanics** - Hold-to-interact, multi-action menus
6. **Inventory Management** - Capacity-based system with drop mechanics

### What's Tightly Coupled to "Woods" Theme
1. **Visual Styling** - Colors, backgrounds, effects hardcoded in CSS
2. **Tile Definitions** - Emojis, colors, labels in constants.js (🌲,🌊,❄️,🔥,🐻)
3. **Item Types** - Forest-specific items (axe, bucket, rope, knife, sweater, wood)
4. **Interaction Logic** - Hardcoded recipes (axe+tree→wood, rope+wood+water→raft)
5. **Hazard Types** - Fire and bear mechanics specific to forest
6. **Canvas Rendering** - Custom drawing code for bucket/wood items

---

## Architecture Vision

### Theme Plugin System

Each theme will be a **self-contained folder** with these files:

```
themes/
├── forest/                      (existing theme)
│   ├── theme.json              (metadata, colors, fonts)
│   ├── tiles.js                (tile definitions + tooltips)
│   ├── items.js                (item definitions + rendering)
│   ├── interactions.js         (interaction rules + logic)
│   ├── hazards.js              (hazard types + effects)
│   ├── style.css               (theme-specific styling)
│   └── assets/                 (optional images/sounds)
│       └── background.jpg
│
├── haunted-mansion/            (new theme example)
│   ├── theme.json
│   ├── tiles.js
│   ├── items.js
│   ├── interactions.js
│   ├── hazards.js
│   ├── style.css
│   └── assets/
│
└── space-station/              (new theme example)
    └── ...
```

### Core Engine (Theme-Agnostic)

```
src/
├── engine/
│   ├── grid.js                 (generic grid operations)
│   ├── collision.js            (uses theme's walkability rules)
│   ├── interaction.js          (generic interaction dispatcher)
│   ├── mission.js              (unchanged - already generic)
│   └── themeLoader.js          (NEW - loads and validates themes)
│
├── components/
│   ├── App.jsx                 (add theme selector)
│   ├── BuilderMode.jsx         (use theme's tiles/items)
│   ├── SolverMode.jsx          (use theme's interactions)
│   ├── Grid.jsx                (use theme's rendering)
│   └── ThemeSelect.jsx         (NEW - theme picker UI)
│
└── utils/
    ├── constants.js            (only global constants - grid size, etc.)
    └── themeRegistry.js        (NEW - available themes catalog)
```

---

## Detailed Refactoring Plan

### Phase 1: Extract Current Theme (Foundation)

**Goal**: Move all forest-specific code into `themes/forest/` without breaking functionality.

#### Step 1.1: Create Theme Structure
- Create `themes/forest/` folder
- Create `theme.json` with metadata:
  ```json
  {
    "id": "forest",
    "name": "Lost in the Forest",
    "description": "Escape the mystical forest",
    "version": "1.0.0",
    "author": "Original",
    "primaryColor": "#68aa44",
    "backgroundColor": "#0a1f0a",
    "accentColor": "#a8f0a8"
  }
  ```

#### Step 1.2: Extract Tile Definitions
- Move tile definitions from `src/utils/constants.js` to `themes/forest/tiles.js`
- Export as:
  ```javascript
  export const TILE_TYPES = {
    ground: { emoji: '🏕️', category: 'terrain', ... },
    tree: { emoji: '🌲', category: 'terrain', ... },
    water: { emoji: '🌊', category: 'terrain', ... },
    // ... all tiles
  };

  export function isWalkable(tileType) {
    // Forest-specific walkability logic
  }

  export function renderTile(ctx, tile, x, y, size) {
    // Custom rendering for bucket/wood if needed
  }
  ```

#### Step 1.3: Extract Item Definitions
- Move item definitions to `themes/forest/items.js`
- Export as:
  ```javascript
  export const ITEM_TYPES = {
    key: { label: 'Key', emoji: '🔑', color: '#ffdd00' },
    axe: { label: 'Axe', emoji: '🪓', color: '#aa6633' },
    // ... all items
  };

  export function renderItem(ctx, itemType, x, y, size, state) {
    // Custom canvas drawing for bucket/wood
  }
  ```

#### Step 1.4: Extract Interaction Logic
- Create `themes/forest/interactions.js`
- Move hardcoded interaction logic from `SolverMode.jsx`
- Export as function registry:
  ```javascript
  export const INTERACTIONS = {
    'axe+tree': {
      label: 'Cut Tree',
      duration: 1500,
      requirements: { inventory: ['axe'] },
      execute: (gameState, grid, x, y) => {
        // Remove tree, add wood item to ground
        return { success: true, message: 'Tree cut!' };
      }
    },
    'rope+wood+water': {
      label: 'Build Raft',
      duration: 1500,
      requirements: { inventory: ['rope', 'wood'], tile: 'water' },
      execute: (gameState, grid, x, y) => {
        // Flood-fill water to raft
        return { success: true, message: 'Raft built!' };
      }
    },
    // ... all interactions
  };

  export function getAvailableInteractions(gameState, grid, x, y) {
    // Returns array of available interactions at position
  }
  ```

#### Step 1.5: Extract Hazard Logic
- Create `themes/forest/hazards.js`
- Export:
  ```javascript
  export const HAZARD_TYPES = {
    fire: {
      name: 'Fire',
      emoji: '🔥',
      damage: 1,
      zones: 'self', // or 'adjacent'
      canExtinguish: true,
      renderColor: 'rgba(255, 100, 0, 0.3)'
    },
    bear: {
      name: 'Bear',
      emoji: '🐻',
      damage: 1,
      zones: 'self',
      canDefeat: { with: 'knife', gives: 'sweater' },
      renderColor: 'rgba(139, 69, 19, 0.3)'
    }
  };

  export function checkHazardAt(grid, x, y, gameState) {
    // Returns hazard effect or null
  }
  ```

#### Step 1.6: Extract Theme Styling
- Move forest-specific CSS from `src/index.css` to `themes/forest/style.css`
- Include:
  - Color variables (CSS custom properties)
  - Background patterns
  - Glow effects
  - Button styles with forest colors
- Keep only generic structural CSS in `index.css`

---

### Phase 2: Create Theme Engine (Core Abstraction)

**Goal**: Build the generic engine that loads and uses themes.

#### Step 2.1: Theme Loader Module
Create `src/engine/themeLoader.js`:
```javascript
class ThemeLoader {
  constructor(themeId) {
    this.themeId = themeId;
    this.theme = null;
    this.tiles = null;
    this.items = null;
    this.interactions = null;
    this.hazards = null;
  }

  async load() {
    // Dynamically import theme modules
    const themeModule = await import(`../../themes/${this.themeId}/theme.json`);
    const tilesModule = await import(`../../themes/${this.themeId}/tiles.js`);
    const itemsModule = await import(`../../themes/${this.themeId}/items.js`);
    const interactionsModule = await import(`../../themes/${this.themeId}/interactions.js`);
    const hazardsModule = await import(`../../themes/${this.themeId}/hazards.js`);

    this.theme = themeModule.default;
    this.tiles = tilesModule;
    this.items = itemsModule;
    this.interactions = interactionsModule;
    this.hazards = hazardsModule;

    // Load theme CSS
    this.loadThemeStyles();

    return this;
  }

  loadThemeStyles() {
    // Inject theme CSS into document
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/themes/${this.themeId}/style.css`;
    document.head.appendChild(link);
  }

  getTileTypes() { return this.tiles.TILE_TYPES; }
  getItemTypes() { return this.items.ITEM_TYPES; }
  getInteractions() { return this.interactions.INTERACTIONS; }
  getHazards() { return this.hazards.HAZARD_TYPES; }

  // Delegation methods
  isWalkable(tileType) { return this.tiles.isWalkable(tileType); }
  renderTile(ctx, tile, x, y, size) { return this.tiles.renderTile(ctx, tile, x, y, size); }
  renderItem(ctx, itemType, x, y, size, state) { return this.items.renderItem(ctx, itemType, x, y, size, state); }
  getAvailableInteractions(gameState, grid, x, y) {
    return this.interactions.getAvailableInteractions(gameState, grid, x, y);
  }
  checkHazardAt(grid, x, y, gameState) {
    return this.hazards.checkHazardAt(grid, x, y, gameState);
  }
}

export default ThemeLoader;
```

#### Step 2.2: Theme Registry
Create `src/utils/themeRegistry.js`:
```javascript
export const AVAILABLE_THEMES = [
  {
    id: 'forest',
    name: 'Lost in the Forest',
    description: 'Escape the mystical forest',
    thumbnail: '/themes/forest/assets/thumbnail.jpg',
    difficulty: 'medium'
  },
  // Future themes added here
];

export function getThemeById(id) {
  return AVAILABLE_THEMES.find(t => t.id === id);
}
```

#### Step 2.3: Generic Collision System
Refactor `src/engine/collision.js`:
```javascript
export function canMoveTo(grid, x, y, theme, gameState) {
  // Use theme's walkability rules
  const tile = grid[y]?.[x];
  if (!tile) return false;

  // Check if tile itself is walkable
  if (!theme.isWalkable(tile.type)) {
    // Check for special conditions (sweater+snow, raft+water)
    return checkSpecialWalkability(tile, gameState, theme);
  }

  return true;
}

function checkSpecialWalkability(tile, gameState, theme) {
  // Theme-specific logic for conditional walkability
  const interactions = theme.getInteractions();
  // Check if player has items that make this tile walkable
  // ...
}
```

#### Step 2.4: Generic Interaction Dispatcher
Create `src/engine/interactionEngine.js`:
```javascript
export class InteractionEngine {
  constructor(theme) {
    this.theme = theme;
  }

  getAvailableActions(gameState, grid, x, y) {
    return this.theme.getAvailableInteractions(gameState, grid, x, y);
  }

  executeInteraction(interactionId, gameState, grid, x, y) {
    const interactions = this.theme.getInteractions();
    const interaction = interactions[interactionId];

    if (!interaction) {
      return { success: false, error: 'Unknown interaction' };
    }

    // Validate requirements
    if (!this.validateRequirements(interaction.requirements, gameState, grid, x, y)) {
      return { success: false, error: 'Requirements not met' };
    }

    // Execute the interaction
    return interaction.execute(gameState, grid, x, y);
  }

  validateRequirements(requirements, gameState, grid, x, y) {
    // Check inventory items
    if (requirements.inventory) {
      for (const item of requirements.inventory) {
        if (!gameState.inventory.includes(item)) return false;
      }
    }

    // Check tile type
    if (requirements.tile) {
      const tile = grid[y]?.[x];
      if (tile?.type !== requirements.tile) return false;
    }

    return true;
  }
}
```

---

### Phase 3: Refactor Components to Use Theme

**Goal**: Update all React components to be theme-agnostic.

#### Step 3.1: App.jsx - Theme Selection
- Add theme state: `const [currentTheme, setCurrentTheme] = useState('forest')`
- Load theme on mount: `useEffect(() => { loadTheme(currentTheme) })`
- Pass theme context down through React Context:
  ```javascript
  const ThemeContext = createContext();

  function App() {
    const [theme, setTheme] = useState(null);

    useEffect(() => {
      const loader = new ThemeLoader(currentTheme);
      loader.load().then(setTheme);
    }, [currentTheme]);

    if (!theme) return <div>Loading theme...</div>;

    return (
      <ThemeContext.Provider value={theme}>
        {/* ... rest of app */}
      </ThemeContext.Provider>
    );
  }
  ```

#### Step 3.2: BuilderMode.jsx - Use Theme Tiles
- Access theme via context: `const theme = useContext(ThemeContext)`
- Replace hardcoded tile references with `theme.getTileTypes()`
- Replace item references with `theme.getItemTypes()`
- Pass theme to Toolbar, PropertiesPanel, Grid components

#### Step 3.3: SolverMode.jsx - Use Theme Interactions
- Replace hardcoded interaction logic with `InteractionEngine`
- Example refactor:
  ```javascript
  // OLD:
  if (tile.type === 'tree' && inventory.includes('axe')) {
    // Hardcoded tree cutting logic
  }

  // NEW:
  const interactionEngine = new InteractionEngine(theme);
  const actions = interactionEngine.getAvailableActions(gameState, grid, playerX, playerY);
  // Show actions in UI, execute selected action
  ```
- Replace hazard checking with `theme.checkHazardAt()`

#### Step 3.4: Grid.jsx - Use Theme Rendering
- Replace emoji rendering with `theme.renderTile()`
- Replace item rendering with `theme.renderItem()`
- Apply theme colors from CSS variables

#### Step 3.5: Create ThemeSelect Component
- Grid/list view of available themes
- Show thumbnail, name, description
- Click to switch theme (triggers theme reload)

---

### Phase 4: Theme Validation & Developer Tools

**Goal**: Make it easy to create and validate new themes.

#### Step 4.1: Theme Validator
Create `src/engine/themeValidator.js`:
```javascript
export function validateTheme(themeLoader) {
  const errors = [];

  // Check required exports
  if (!themeLoader.getTileTypes()) {
    errors.push('Missing TILE_TYPES export');
  }

  // Check tile structure
  const tiles = themeLoader.getTileTypes();
  for (const [key, tile] of Object.entries(tiles)) {
    if (!tile.emoji && !tile.render) {
      errors.push(`Tile ${key} missing emoji or render function`);
    }
    if (!tile.category) {
      errors.push(`Tile ${key} missing category`);
    }
  }

  // Check interactions reference valid tiles/items
  const interactions = themeLoader.getInteractions();
  for (const [key, interaction] of Object.entries(interactions)) {
    if (!interaction.execute || typeof interaction.execute !== 'function') {
      errors.push(`Interaction ${key} missing execute function`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

#### Step 4.2: Theme Creation Wizard (Optional)
- CLI or UI tool to scaffold new theme folder
- Generates template files with comments/examples
- Example: `npm run create-theme haunted-mansion`

#### Step 4.3: Theme Documentation
Create `THEME_CREATION_GUIDE.md`:
- Step-by-step guide for creating new themes
- API reference for all required exports
- Examples of common interactions
- Best practices for AI-generated themes

---

### Phase 5: Storage & Level Format Updates

**Goal**: Make levels theme-aware.

#### Step 5.1: Update Level Format
Add `themeId` to level data structure:
```javascript
{
  id: '123',
  name: 'Forest Escape',
  themeId: 'forest',  // NEW
  grid: [...],
  missions: [...],
  // ... rest
}
```

#### Step 5.2: Update Storage Module
- When loading level, validate that theme exists
- If theme missing, show error or fallback to default
- Add migration function for existing levels (add `themeId: 'forest'`)

#### Step 5.3: Level Import/Export
- Export levels as JSON files
- Import levels from JSON (validate theme availability)

---

## Theme Complexity Analysis

### Easy to Theme (No Code Required)
1. **Visual Style** - Colors, fonts, backgrounds (CSS + theme.json)
2. **Tile Emojis** - Simple mapping (theme.json or tiles.js)
3. **Item Emojis** - Simple mapping (items.js)
4. **Hazard Colors** - Overlay colors (hazards.js)
5. **Labels & Descriptions** - Text content (all theme files)

### Medium Complexity (Simple JS Code)
1. **Tile Walkability Rules** - Boolean logic (`isWalkable` function)
2. **Hazard Effects** - Damage amounts, conditions
3. **Simple Interactions** - Item pickups, door unlocking
4. **Mission Types** - Already generic, just need theme-specific targets

### Higher Complexity (Custom Logic Required)
1. **Advanced Interactions** - Multi-item crafting, area effects
2. **Custom Rendering** - Canvas drawing for special items
3. **Conditional Walkability** - Complex item+tile combinations
4. **Flood-Fill Operations** - Area transformations (like raft building)
5. **State-Based Items** - Items with multiple states (filled bucket)

---

## Example: New Theme Creation

### Example Theme: "Haunted Mansion"

#### theme.json
```json
{
  "id": "haunted-mansion",
  "name": "Escape the Haunted Mansion",
  "description": "Survive the night in a spooky mansion",
  "primaryColor": "#663399",
  "backgroundColor": "#1a0033",
  "accentColor": "#9966cc"
}
```

#### tiles.js (excerpt)
```javascript
export const TILE_TYPES = {
  floor: { emoji: '⬜', walkable: true, category: 'terrain' },
  wall: { emoji: '🧱', walkable: false, category: 'terrain' },
  door_locked: { emoji: '🚪', walkable: false, category: 'objects' },
  door_open: { emoji: '🚪', walkable: true, category: 'objects' },
  window: { emoji: '🪟', walkable: false, category: 'objects' },
  ghost: { emoji: '👻', walkable: false, category: 'hazards' },
  // ...
};

export function isWalkable(tileType) {
  return TILE_TYPES[tileType]?.walkable ?? false;
}
```

#### items.js
```javascript
export const ITEM_TYPES = {
  key: { emoji: '🔑', label: 'Brass Key' },
  candle: { emoji: '🕯️', label: 'Candle' },
  cross: { emoji: '✝️', label: 'Holy Cross' },
  garlic: { emoji: '🧄', label: 'Garlic' },
  // ...
};
```

#### interactions.js
```javascript
export const INTERACTIONS = {
  'key+door_locked': {
    label: 'Unlock Door',
    duration: 1500,
    requirements: { inventory: ['key'], tile: 'door_locked' },
    execute: (gameState, grid, x, y) => {
      grid[y][x].type = 'door_open';
      return { success: true, message: 'Door unlocked!' };
    }
  },
  'cross+ghost': {
    label: 'Banish Ghost',
    duration: 2000,
    requirements: { inventory: ['cross'], tile: 'ghost' },
    execute: (gameState, grid, x, y) => {
      grid[y][x].type = 'floor';
      return { success: true, message: 'Ghost banished!' };
    }
  },
  // ...
};
```

#### hazards.js
```javascript
export const HAZARD_TYPES = {
  ghost: {
    name: 'Ghost',
    damage: 1,
    zones: 'self',
    renderColor: 'rgba(200, 200, 255, 0.3)'
  },
  darkness: {
    name: 'Darkness',
    damage: 0, // No damage, but limits vision
    effect: 'reduceFogOfWar',
    renderColor: 'rgba(0, 0, 0, 0.5)'
  }
};
```

---

## AI-Friendly Theme Creation Workflow

### Workflow for Claude Code to Create New Theme

When a user says: *"Create a new theme called 'Space Station' where you escape from an alien-infested space station"*

Claude Code would:

1. **Create Theme Folder Structure**
   ```bash
   mkdir -p themes/space-station/assets
   ```

2. **Generate theme.json**
   - Extract colors from theme description (blues, silvers, metallics)
   - Set metadata (name, description, ID)

3. **Generate tiles.js**
   - Define tiles: floor, wall, airlock, window, alien, etc.
   - Implement `isWalkable()` function
   - Add tooltips/descriptions

4. **Generate items.js**
   - Define items: keycard, wrench, oxygen tank, laser gun, etc.
   - Choose emojis or describe custom rendering needs

5. **Generate interactions.js**
   - Define logical interactions:
     - keycard + airlock → open airlock
     - laser gun + alien → kill alien
     - wrench + panel → repair panel
   - Write execute functions for each

6. **Generate hazards.js**
   - Define hazards: aliens, vacuum (needs oxygen), fire
   - Set damage amounts and conditions

7. **Generate style.css**
   - Create color scheme (dark blues, grays, metallic accents)
   - Set backgrounds (starfield, metal textures)
   - Style buttons/panels with futuristic look

8. **Update themeRegistry.js**
   - Add new theme to AVAILABLE_THEMES array

9. **Test & Validate**
   - Run theme validator
   - Create a simple test level
   - Verify interactions work

### AI Prompt Template for New Themes

```
Create a new escape room theme with the following characteristics:

**Theme Name**: [name]
**Setting**: [description of environment]
**Color Palette**: [primary colors]
**Goal**: [how players escape]

**Tiles** (terrain and obstacles):
- [List 5-10 tile types with emojis]

**Items** (collectibles):
- [List 5-10 items with emojis and purposes]

**Interactions** (how items work with tiles):
- [List 5-10 interaction rules, e.g., "wrench + locked panel = open panel"]

**Hazards** (dangers):
- [List 2-5 hazards with effects]

**Special Mechanics** (optional):
- [Any unique theme-specific rules]

Generate all theme files following the Escape It theme structure.
```

---

## File Structure Summary

### Before (Current)
```
src/
├── components/
│   └── [All components with hardcoded forest theme]
├── engine/
│   └── [Engine code mixed with forest-specific logic]
└── utils/
    └── constants.js  [Forest tiles/items hardcoded]
```

### After (Refactored)
```
themes/
├── forest/
│   ├── theme.json
│   ├── tiles.js
│   ├── items.js
│   ├── interactions.js
│   ├── hazards.js
│   ├── style.css
│   └── assets/
├── haunted-mansion/
│   └── [same structure]
└── space-station/
    └── [same structure]

src/
├── components/
│   ├── App.jsx  [Theme loader + context]
│   ├── ThemeSelect.jsx  [NEW]
│   └── [Other components - theme agnostic]
├── engine/
│   ├── themeLoader.js  [NEW]
│   ├── themeValidator.js  [NEW]
│   ├── interactionEngine.js  [NEW]
│   └── [Other engine code - generic]
└── utils/
    ├── themeRegistry.js  [NEW]
    └── constants.js  [Only universal constants]
```

---

## Migration Strategy

### Backward Compatibility
- Existing saved levels get `themeId: 'forest'` added automatically
- No data loss for current players
- Old levels continue working with forest theme

### Gradual Rollout
1. **Phase 1** - Refactor (no visible changes to users)
2. **Phase 2** - Add theme selector (forest still default)
3. **Phase 3** - Ship with 2-3 example themes
4. **Phase 4** - Document theme creation for community

---

## Risk Assessment

### Low Risk
- Visual styling extraction (CSS isolation)
- Tile/item definition extraction (data structure changes)
- Theme metadata (additive changes)

### Medium Risk
- Interaction logic refactoring (complex game logic)
- Component refactoring (React structure changes)
- Storage format updates (requires migration)

### High Risk
- Breaking existing saved levels (mitigation: add migration)
- Performance issues with dynamic imports (mitigation: test thoroughly)
- Theme validation gaps (mitigation: comprehensive validator)

---

## Success Criteria

A successful theme engine implementation allows:

1. ✅ **Quick Theme Creation**: Claude Code can generate a basic playable theme in <30 minutes of AI agent work
2. ✅ **No Core Engine Changes**: New themes don't require modifying src/engine or src/components
3. ✅ **Isolated Theme Code**: Each theme is 100% contained in its themes/[name]/ folder
4. ✅ **Hot-Swappable**: Switch themes without restarting the app
5. ✅ **Backward Compatible**: All existing forest levels continue working
6. ✅ **Validation**: Theme validator catches errors before runtime
7. ✅ **Documentation**: Clear guide for AI agents to follow

---

## Implementation Estimate

### Complexity by Phase

| Phase | Description | Complexity | Dependencies |
|-------|-------------|------------|--------------|
| **Phase 1** | Extract current theme | Medium | None |
| **Phase 2** | Create theme engine | High | Phase 1 |
| **Phase 3** | Refactor components | High | Phase 2 |
| **Phase 4** | Validation & tools | Low | Phase 3 |
| **Phase 5** | Storage updates | Medium | Phase 3 |

### Key Challenges

1. **Interaction Logic Extraction**: Current interactions deeply embedded in SolverMode.jsx (~1800 lines)
2. **Dynamic Imports**: Vite configuration may need adjustment for dynamic theme loading
3. **CSS Isolation**: Preventing theme CSS conflicts
4. **Testing**: Need to test with multiple themes to ensure engine is truly generic

---

## Open Questions

1. **Custom Asset Support**: Should themes support custom images/sounds? How to bundle?
2. **Theme Versioning**: How to handle theme updates that break old levels?
3. **Community Themes**: Will users share themes? Need export/import system?
4. **Theme Dependencies**: Can themes extend/inherit from others?
5. **Advanced Canvas Rendering**: How much custom rendering freedom should themes have?

---

## Appendix: Theme API Reference

### Required Exports

#### tiles.js
```javascript
export const TILE_TYPES = {
  [id]: {
    emoji: string,              // Emoji to render
    category: string,           // 'terrain' | 'objects' | 'hazards'
    walkable: boolean,          // Can player walk on it?
    label: string,              // Display name
    description: string,        // Tooltip text
    color?: string,             // Background color
    render?: function,          // Custom rendering function
  }
}

export function isWalkable(tileType: string): boolean
export function renderTile(ctx, tile, x, y, size): void
```

#### items.js
```javascript
export const ITEM_TYPES = {
  [id]: {
    emoji: string,
    label: string,
    color: string,
    description: string,
    render?: function,
    stackable?: boolean,
    states?: object,          // For stateful items like filled/empty bucket
  }
}

export function renderItem(ctx, itemType, x, y, size, state): void
```

#### interactions.js
```javascript
export const INTERACTIONS = {
  [id]: {
    label: string,                    // Display name
    duration: number,                 // Hold duration in ms
    requirements: {
      inventory?: string[],           // Required items in inventory
      tile?: string,                  // Required tile type at position
      state?: object,                 // Other game state requirements
    },
    execute: (gameState, grid, x, y) => {
      // Modify gameState and grid
      return {
        success: boolean,
        message?: string,
        removeItems?: string[],       // Items to remove from inventory
        addItems?: string[],          // Items to add to inventory
      };
    }
  }
}

export function getAvailableInteractions(gameState, grid, x, y): string[]
```

#### hazards.js
```javascript
export const HAZARD_TYPES = {
  [id]: {
    name: string,
    emoji: string,
    damage: number,                   // Lives lost when triggered
    zones: 'self' | 'adjacent',       // Hazard area
    renderColor: string,              // RGBA color for hazard overlay
    canDefeat?: {                     // Optional defeat mechanism
      with: string,                   // Item needed
      gives?: string,                 // Item awarded
    },
    canExtinguish?: boolean,          // Can be removed?
    effect?: string,                  // Special effect name
  }
}

export function checkHazardAt(grid, x, y, gameState): {
  type: string,
  damage: number,
  canProceed: boolean,
} | null
```

#### theme.json
```json
{
  "id": "unique-id",
  "name": "Display Name",
  "description": "Short description",
  "version": "1.0.0",
  "author": "Creator name",
  "primaryColor": "#hex",
  "backgroundColor": "#hex",
  "accentColor": "#hex",
  "fontFamily": "optional font name"
}
```

---

## Enabling Very Specific Theme Functionality

### Question: Will this enable VERY specific/unique theme functionality?

**Short Answer: YES** - The architecture is designed to support highly specific, theme-unique mechanics.

### How It Works: Three Levels of Customization

#### Level 1: Simple Configuration (No Custom Code)
For basic themes using existing patterns:
- Change emojis, colors, labels
- Reuse standard interactions (unlock, collect, extinguish)
- Works for: Prison escape, museum heist, underwater adventure

#### Level 2: Custom Interaction Logic (Isolated JS Functions)
For themes with unique mechanics:
- Write custom `execute()` functions in `interactions.js`
- Access full game state and grid
- Modify anything: grid tiles, inventory, custom state properties

**Example**: Time travel theme with paradox mechanics
```javascript
// themes/time-travel/interactions.js
export const INTERACTIONS = {
  'time-device+past-self': {
    label: 'Create Paradox',
    duration: 2000,
    requirements: { inventory: ['time-device'], tile: 'past-self' },
    execute: (gameState, grid, x, y) => {
      // Unique logic: meeting yourself creates timeline split
      gameState.timelinesSplit = (gameState.timelinesSplit || 0) + 1;

      // Duplicate player inventory in alternate timeline
      gameState.alternateInventory = [...gameState.inventory];

      // Create portal to alternate timeline
      grid[y][x] = { type: 'timeline-portal', config: { timeline: gameState.timelinesSplit } };

      return {
        success: true,
        message: `Timeline split! Paradoxes: ${gameState.timelinesSplit}`
      };
    }
  }
};
```

#### Level 3: Theme-Specific Game State (Custom Properties)
For themes that need persistent custom data:

**Example**: Virus outbreak theme with infection spread
```javascript
// themes/virus-outbreak/interactions.js

// Theme-specific initialization
export function initializeThemeState() {
  return {
    infectionLevel: 0,
    curedNPCs: [],
    vaccinesCreated: 0,
    timeUntilOutbreak: 100, // moves remaining
  };
}

// Infection spreads each turn
export function onPlayerMove(gameState, grid, newX, newY) {
  // Custom per-turn logic
  gameState.timeUntilOutbreak -= 1;

  if (gameState.timeUntilOutbreak <= 0 && gameState.infectionLevel < 10) {
    gameState.infectionLevel += 1;
    spreadInfection(grid, gameState.infectionLevel);
  }
}

// Multi-step crafting system
export const INTERACTIONS = {
  'sample+lab': {
    label: 'Analyze Sample',
    duration: 3000,
    requirements: { inventory: ['blood-sample'], tile: 'laboratory' },
    execute: (gameState, grid, x, y) => {
      gameState.researchProgress = (gameState.researchProgress || 0) + 1;

      if (gameState.researchProgress >= 3) {
        // Add vaccine blueprint to inventory
        return {
          success: true,
          message: 'Vaccine formula discovered!',
          addItems: ['vaccine-blueprint']
        };
      }

      return {
        success: true,
        message: `Research progress: ${gameState.researchProgress}/3`
      };
    }
  },

  'blueprint+chemicals+lab': {
    label: 'Create Vaccine',
    duration: 4000,
    requirements: {
      inventory: ['vaccine-blueprint', 'chemical-a', 'chemical-b'],
      tile: 'laboratory'
    },
    execute: (gameState, grid, x, y) => {
      gameState.vaccinesCreated += 1;
      return {
        success: true,
        message: 'Vaccine created!',
        removeItems: ['chemical-a', 'chemical-b'],
        addItems: ['vaccine']
      };
    }
  }
};
```

### Advanced Theme Capabilities

#### 1. **Dynamic Grid Transformation**
Themes can modify the grid extensively:

```javascript
// Earthquake theme - shift tiles randomly
export const INTERACTIONS = {
  'seismic-trigger': {
    execute: (gameState, grid, x, y) => {
      // Shift entire sections of the grid
      for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          const targetY = y + dy;
          const targetX = x + dx;
          if (Math.random() > 0.7) {
            // Rubble replaces floor
            grid[targetY][targetX] = { type: 'rubble', config: {} };
          }
        }
      }
      return { success: true, message: 'Earthquake! Tiles shifted!' };
    }
  }
};
```

#### 2. **Complex State Machines**
Items can have multiple states with transitions:

```javascript
// themes/alchemy/items.js
export const ITEM_TYPES = {
  potion: {
    label: 'Potion',
    emoji: '🧪',
    states: {
      empty: { color: '#cccccc', label: 'Empty Vial' },
      water: { color: '#4488ff', label: 'Water Vial' },
      poison: { color: '#44ff44', label: 'Poison' },
      healing: { color: '#ff4444', label: 'Healing Potion' },
      transmute: { color: '#ffaa00', label: 'Transmutation Elixir' },
    },
    defaultState: 'empty'
  }
};

// interactions.js
export const INTERACTIONS = {
  'potion:water+herb-red': {
    execute: (gameState, grid, x, y) => {
      // Change potion state
      const potionIdx = gameState.inventory.findIndex(
        item => item.itemType === 'potion' && item.state === 'water'
      );
      gameState.inventory[potionIdx].state = 'healing';
      return { success: true, removeItems: ['herb-red'] };
    }
  }
};
```

#### 3. **Conditional Rendering**
Themes can control what players see:

```javascript
// themes/stealth/hazards.js
export function checkHazardAt(grid, x, y, gameState) {
  const tile = grid[y][x];

  // Guards only see you if you're not in shadows
  if (tile.type === 'guard') {
    const inShadows = checkAdjacentTiles(grid, x, y, 'shadow').length > 0;
    const hasCamouflage = gameState.inventory.some(i => i.itemType === 'camo-suit');

    if (inShadows || hasCamouflage) {
      return null; // Not detected
    }

    return {
      type: 'guard',
      damage: 1,
      message: 'Spotted by guard!'
    };
  }
}
```

#### 4. **Procedural Content**
Themes can generate dynamic content:

```javascript
// themes/dungeon-crawler/tiles.js
export function onLevelLoad(grid, level) {
  // Spawn random enemies based on level difficulty
  const enemyCount = Math.floor(level.difficulty * 5);

  for (let i = 0; i < enemyCount; i++) {
    const emptyTiles = findAllTilesOfType(grid, 'ground');
    const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];

    grid[randomTile.y][randomTile.x] = {
      type: 'enemy',
      config: {
        health: level.difficulty * 2,
        damage: level.difficulty,
        loot: randomLoot(level.difficulty)
      }
    };
  }
}
```

#### 5. **Global Theme Effects**
Themes can hook into the game loop:

```javascript
// themes/time-limit/theme.js
export const THEME_HOOKS = {
  // Called every game tick
  onTick: (gameState, grid, deltaTime) => {
    gameState.timeRemaining -= deltaTime;

    if (gameState.timeRemaining <= 0) {
      return { gameOver: true, reason: 'Time ran out!' };
    }
  },

  // Called before player moves
  beforeMove: (gameState, grid, fromPos, toPos) => {
    // Ice tiles make you slide
    const targetTile = grid[toPos.y][toPos.x];
    if (targetTile.type === 'ice') {
      return {
        override: true,
        newPos: slideUntilNotIce(grid, toPos)
      };
    }
  },

  // Called after player moves
  afterMove: (gameState, grid, pos) => {
    // Leave footprints
    if (grid[pos.y][pos.x].type === 'ground') {
      gameState.footprints = gameState.footprints || [];
      gameState.footprints.push({ x: pos.x, y: pos.y, age: 0 });
    }
  }
};
```

### What This Means for Theme Creation

#### ✅ **Fully Supported** - Write isolated code in theme folder:
1. **Unique items** with custom states
2. **Complex crafting** systems (multi-step, branching recipes)
3. **Dynamic world** changes (earthquakes, floods, day/night)
4. **Custom game mechanics** (stealth, combat, time pressure)
5. **Procedural generation** (random enemies, loot, puzzles)
6. **State machines** (quest lines, NPC dialogue trees)
7. **Physics/movement** modifications (sliding, teleportation)
8. **Vision/rendering** changes (darkness, illusions, x-ray vision)
9. **Meta-progression** (unlock new items as you play)
10. **Multi-item interactions** (combine 3+ items)

#### ⚠️ **Requires Minor Engine Extension** - Add hook to core:
1. **Custom UI overlays** (health bars, mini-maps) - Need to extend HUD component
2. **Custom input controls** (aim, charge attacks) - Need keyboard hook
3. **Multiplayer/NPCs with AI** - Need to extend game loop for NPC turns
4. **Custom win conditions** beyond missions - Already flexible with mission system

#### ❌ **Not Supported** - Would require major refactoring:
1. **3D rendering** - Core uses 2D canvas
2. **Real-time physics** - Turn-based system
3. **Networking** - No multiplayer infrastructure

### Example: Ultra-Specific Theme

**"Underwater Laboratory: Oxygen Crisis"**

```javascript
// themes/underwater-lab/interactions.js

// UNIQUE MECHANIC #1: Oxygen depletes over time
export function onPlayerMove(gameState, grid) {
  gameState.oxygen = (gameState.oxygen || 100) - 1;

  if (gameState.oxygen <= 0) {
    return { damage: 1, message: 'Out of oxygen!' };
  }
}

// UNIQUE MECHANIC #2: Pressure affects movement
export function beforeMove(gameState, grid, fromPos, toPos) {
  const depth = toPos.y; // Deeper = more pressure
  const hasDiveSuit = gameState.inventory.some(i => i.itemType === 'dive-suit');

  if (depth > 10 && !hasDiveSuit) {
    return {
      blocked: true,
      message: 'Pressure too high! Need dive suit.'
    };
  }
}

// UNIQUE MECHANIC #3: Flooding spreads
export function onTick(gameState, grid) {
  if (gameState.hullBreached) {
    spreadWater(grid); // Water floods new tiles each turn
  }
}

// UNIQUE INTERACTION: Seal hull breach
export const INTERACTIONS = {
  'weld-torch+hull-breach': {
    label: 'Repair Breach',
    duration: 3000,
    requirements: { inventory: ['weld-torch', 'metal-plate'], tile: 'hull-breach' },
    execute: (gameState, grid, x, y) => {
      grid[y][x] = { type: 'repaired-wall', config: {} };
      gameState.hullBreached = false;

      // Stop water spread
      stopWaterSpread(grid);

      return {
        success: true,
        message: 'Hull breach sealed!',
        removeItems: ['metal-plate']
      };
    }
  },

  // Fill oxygen tank at station
  'tank+oxygen-station': {
    label: 'Refill Oxygen',
    duration: 2000,
    requirements: { tile: 'oxygen-station' },
    execute: (gameState, grid, x, y) => {
      const oldOxygen = gameState.oxygen;
      gameState.oxygen = 100;
      return {
        success: true,
        message: `Oxygen refilled! (${oldOxygen}% → 100%)`
      };
    }
  }
};
```

### Architecture Enhancements for Maximum Flexibility

To support these advanced features, add these to Phase 2:

**1. Theme Hooks System**
```javascript
// src/engine/themeLoader.js
class ThemeLoader {
  // ... existing code ...

  getHooks() {
    return this.theme.THEME_HOOKS || {};
  }

  callHook(hookName, ...args) {
    const hooks = this.getHooks();
    if (hooks[hookName]) {
      return hooks[hookName](...args);
    }
  }
}
```

**2. Extended Game State**
```javascript
// src/components/SolverMode.jsx
const [gameState, setGameState] = useState({
  // Standard fields
  inventory: [],
  lives: 3,
  // ...

  // Theme-specific extension point
  themeState: {} // Themes can store anything here
});
```

**3. Interaction Result Extensions**
```javascript
// Interactions can return extended results
{
  success: boolean,
  message?: string,
  removeItems?: string[],
  addItems?: string[],
  damage?: number,
  modifyGrid?: { x, y, newTile }[],
  modifyState?: object,  // Merge into gameState.themeState
  gameOver?: boolean,
  customUI?: ReactComponent  // Optional: render custom UI
}
```

## Conclusion

**YES, the architecture enables very specific theme functionality.**

The key insight: **themes have full access to game state and grid through their execute functions**. This means:
- Any interaction can read/modify anything
- Themes can add custom properties to game state
- Complex multi-step mechanics are just functions
- No limits on creativity within the 2D grid-based paradigm

The engine provides the **infrastructure** (grid, rendering, input, missions), while themes provide the **content and logic** (tiles, items, interactions). This separation means themes can be as simple or complex as needed, without touching the core engine.

---

## Test Case: Camera Security System

### Scenario: "Prison Escape" Theme
**Mechanic**: Cameras see you and take lives. You can disable them with a button elsewhere on the board.

### Analysis: Is This Supported?

**Answer: YES, but requires adding one hook to the architecture.**

### Implementation Breakdown

#### ✅ **Already Supported:**

1. **Camera tiles** - Just a tile type
2. **Button tiles** - Just another tile type
3. **Button interaction** - Standard interaction
4. **State tracking** - Which cameras are on/off

#### ⚠️ **Needs New Hook: "Vision/Line-of-Sight Check"**

The challenge: Cameras need to check if they can "see" the player **every turn**, not just when interacting.

### Current Architecture Gap

Looking at the proposed hooks:
```javascript
export const THEME_HOOKS = {
  onTick: (gameState, grid, deltaTime) => { },
  beforeMove: (gameState, grid, fromPos, toPos) => { },
  afterMove: (gameState, grid, pos) => { }
}
```

**Problem**: `afterMove` hook is perfect for this! We just need to make sure it can return damage.

### Full Implementation Example

```javascript
// themes/prison-escape/tiles.js
export const TILE_TYPES = {
  floor: { emoji: '⬜', walkable: true, category: 'terrain' },
  wall: { emoji: '🧱', walkable: false, category: 'terrain' },

  camera: {
    emoji: '📹',
    walkable: true,
    category: 'hazards',
    description: 'Security camera - will spot you if active',
    config: {
      direction: 'right', // 'up', 'down', 'left', 'right'
      range: 5,
      active: true
    }
  },

  control_panel: {
    emoji: '🎛️',
    walkable: true,
    category: 'objects',
    description: 'Security control panel',
    config: {
      controlsCamera: null // Will be set to camera position {x, y}
    }
  }
};

// Helper: Check if position is in camera's line of sight
function isInLineOfSight(grid, cameraX, cameraY, targetX, targetY) {
  const camera = grid[cameraY][cameraX];
  const direction = camera.config.direction;
  const range = camera.config.range || 5;

  // Check direction
  let inDirection = false;
  switch (direction) {
    case 'right':
      inDirection = targetX > cameraX && targetY === cameraY;
      break;
    case 'left':
      inDirection = targetX < cameraX && targetY === cameraY;
      break;
    case 'down':
      inDirection = targetY > cameraY && targetX === cameraX;
      break;
    case 'up':
      inDirection = targetY < cameraY && targetX === cameraX;
      break;
  }

  if (!inDirection) return false;

  // Check range
  const distance = Math.abs(targetX - cameraX) + Math.abs(targetY - cameraY);
  if (distance > range) return false;

  // Check for walls blocking line of sight
  const dx = Math.sign(targetX - cameraX);
  const dy = Math.sign(targetY - cameraY);

  let x = cameraX + dx;
  let y = cameraY + dy;

  while (x !== targetX || y !== targetY) {
    const tile = grid[y]?.[x];
    if (!tile || tile.type === 'wall') {
      return false; // Wall blocks vision
    }
    x += dx;
    y += dy;
  }

  return true;
}
```

```javascript
// themes/prison-escape/interactions.js

export const INTERACTIONS = {
  'control_panel': {
    label: 'Disable Camera',
    duration: 1500,
    requirements: { tile: 'control_panel' },
    execute: (gameState, grid, x, y) => {
      const panel = grid[y][x];
      const cameraPos = panel.config.controlsCamera;

      if (!cameraPos) {
        return { success: false, message: 'Panel not connected to any camera' };
      }

      const camera = grid[cameraPos.y][cameraPos.x];
      if (!camera || camera.type !== 'camera') {
        return { success: false, message: 'Camera not found' };
      }

      // Toggle camera
      const wasActive = camera.config.active;
      camera.config.active = !wasActive;

      // Track in theme state
      gameState.themeState = gameState.themeState || {};
      gameState.themeState.disabledCameras = gameState.themeState.disabledCameras || [];

      if (!wasActive) {
        // Removing from disabled list
        gameState.themeState.disabledCameras =
          gameState.themeState.disabledCameras.filter(
            pos => !(pos.x === cameraPos.x && pos.y === cameraPos.y)
          );
      } else {
        // Adding to disabled list
        gameState.themeState.disabledCameras.push(cameraPos);
      }

      return {
        success: true,
        message: wasActive
          ? '✅ Camera disabled!'
          : '⚠️ Camera reactivated!',
        modifyGrid: [{
          x: cameraPos.x,
          y: cameraPos.y,
          newTile: { ...camera, config: { ...camera.config, active: !wasActive } }
        }]
      };
    }
  }
};

// Hook: Check cameras after every move
export function afterMove(gameState, grid, playerPos) {
  const damages = [];

  // Find all active cameras
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const tile = grid[y][x];

      if (tile.type === 'camera' && tile.config.active) {
        // Check if camera sees player
        if (isInLineOfSight(grid, x, y, playerPos.x, playerPos.y)) {
          damages.push({
            source: 'camera',
            position: { x, y },
            amount: 1,
            message: '📹 Caught on camera!'
          });
        }
      }
    }
  }

  // Return first damage (or could accumulate all)
  if (damages.length > 0) {
    return {
      damage: damages[0].amount,
      message: damages[0].message
    };
  }

  return null;
}
```

```javascript
// themes/prison-escape/hazards.js

export function checkHazardAt(grid, x, y, gameState) {
  const tile = grid[y][x];

  // Laser grids (different from cameras - instant damage on tile)
  if (tile.type === 'laser_grid' && tile.config.active) {
    return {
      type: 'laser_grid',
      damage: 1,
      message: '⚡ Hit by laser!'
    };
  }

  return null;
}

// Visual rendering of camera vision cones
export function renderHazardOverlay(ctx, grid, tileSize) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const tile = grid[y][x];

      if (tile.type === 'camera' && tile.config.active) {
        // Draw vision cone
        const direction = tile.config.direction;
        const range = tile.config.range || 5;

        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Red tint

        // Draw based on direction
        switch (direction) {
          case 'right':
            for (let i = 1; i <= range; i++) {
              const tx = x + i;
              if (tx < grid[0].length && grid[y][tx].type !== 'wall') {
                ctx.fillRect(tx * tileSize, y * tileSize, tileSize, tileSize);
              } else break;
            }
            break;
          // ... similar for other directions
        }
      }
    }
  }
}
```

### Architecture Enhancement Needed

**Update Phase 2 to include:**

```javascript
// src/components/SolverMode.jsx - After player moves

useEffect(() => {
  if (!theme) return;

  // Call theme's afterMove hook
  const result = theme.callHook('afterMove', gameState, grid, playerPos);

  if (result?.damage) {
    // Apply damage from theme hook
    setGameState(prev => ({
      ...prev,
      lives: Math.max(0, prev.lives - result.damage)
    }));

    if (result.message) {
      showMessage(result.message);
    }
  }

  if (result?.modifyState) {
    // Theme can modify state
    setGameState(prev => ({
      ...prev,
      themeState: { ...prev.themeState, ...result.modifyState }
    }));
  }
}, [playerPos, theme]);
```

### Advanced Variant: Rotating Cameras

```javascript
// themes/prison-escape/interactions.js

export function onTick(gameState, grid) {
  // Rotate cameras every 3 seconds (3000ms)
  gameState.themeState = gameState.themeState || {};
  gameState.themeState.cameraRotationTimer =
    (gameState.themeState.cameraRotationTimer || 0) + 1;

  if (gameState.themeState.cameraRotationTimer >= 30) { // 30 ticks = ~3 seconds
    gameState.themeState.cameraRotationTimer = 0;

    // Rotate all cameras
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const tile = grid[y][x];

        if (tile.type === 'camera' && tile.config.active) {
          // Rotate clockwise
          const directions = ['up', 'right', 'down', 'left'];
          const currentIdx = directions.indexOf(tile.config.direction);
          const nextIdx = (currentIdx + 1) % 4;
          tile.config.direction = directions[nextIdx];
        }
      }
    }
  }
}
```

### Visual Feedback in Builder

In BuilderMode, when placing a control panel, let the user click a camera to link them:

```javascript
// src/components/PropertiesPanel.jsx - Extended for camera theme

if (tile.type === 'control_panel') {
  return (
    <div>
      <h3>Control Panel</h3>
      <button onClick={() => setMode('linkCamera')}>
        Link to Camera (click camera on grid)
      </button>
      {tile.config.controlsCamera && (
        <p>Controls camera at: ({tile.config.controlsCamera.x}, {tile.config.controlsCamera.y})</p>
      )}
    </div>
  );
}

if (tile.type === 'camera') {
  return (
    <div>
      <h3>Security Camera</h3>
      <label>
        Direction:
        <select value={tile.config.direction} onChange={e => updateConfig('direction', e.target.value)}>
          <option value="up">Up ↑</option>
          <option value="down">Down ↓</option>
          <option value="left">Left ←</option>
          <option value="right">Right →</option>
        </select>
      </label>
      <label>
        Range:
        <input type="number" min="1" max="10"
          value={tile.config.range || 5}
          onChange={e => updateConfig('range', parseInt(e.target.value))} />
      </label>
      <label>
        <input type="checkbox"
          checked={tile.config.active ?? true}
          onChange={e => updateConfig('active', e.target.checked)} />
        Active
      </label>
    </div>
  );
}
```

---

## Updated Architecture: Full Support for Camera Mechanics

### Verdict: ✅ FULLY SUPPORTED with one addition

**What was already in the plan:**
- Theme hooks (`afterMove`, `onTick`)
- Custom tile configurations
- Interaction system
- State management

**What needs to be clarified/added:**
1. **afterMove hook can return damage** (minor addition to Phase 2)
2. **Hazard overlay rendering** (add `renderHazardOverlay` to theme API)
3. **Builder UI for tile configurations** (extend PropertiesPanel to be theme-aware)

### Key Insight

The camera mechanic demonstrates the architecture's flexibility:
- **Cameras** = tiles with config (direction, range, active state)
- **Buttons** = tiles with interaction handlers
- **Line-of-sight** = pure function in theme folder
- **Per-turn checks** = `afterMove` hook
- **Rotation** = `onTick` hook
- **Visual cones** = custom rendering function

**Everything stays in the theme folder. Zero changes to core engine logic.**

### Other Similar Mechanics Now Supported

With this pattern, you can also implement:
- 🔦 **Flashlights** - Player's vision cone that reveals hidden enemies
- 👁️ **Stealth vision** - Enemies have vision cones, hide in shadows
- 🌙 **Day/Night cycle** - Vision range changes based on time
- 🚨 **Alarm systems** - Triggered areas that spawn guards
- 🎯 **Turrets** - Auto-fire at player in range
- 🔍 **Detective vision** - Reveal clues within range
- 📡 **Radar** - Detect items/enemies through walls

**All using the same line-of-sight pattern!**

---

## UI/UX Flow: Branding and Theme Selection

### Question: Where does theme selection happen? How does the main page change?

**Answer: Theme selection happens BEFORE building/playing. Main page gets rebranded to "Escape It".**

### Proposed User Flow

```
┌─────────────────────────────────────┐
│   ESCAPE IT - Main Menu             │
│   (Generic branding, no theme yet)  │
│                                     │
│   [Create New Escape Room]          │
│   [Play Escape Rooms]               │
│   [About]                           │
└─────────────────────────────────────┘
           │
           ├─→ Create New Escape Room
           │   ↓
           │   ┌─────────────────────────────┐
           │   │  Choose Theme               │
           │   │  ┌───────┐  ┌───────┐       │
           │   │  │ 🌲    │  │ 🏛️    │       │
           │   │  │Forest │  │Mansion│       │
           │   │  └───────┘  └───────┘       │
           │   │  ┌───────┐  ┌───────┐       │
           │   │  │ 🚀    │  │ 🏥    │       │
           │   │  │Space  │  │Hospital│      │
           │   │  └───────┘  └───────┘       │
           │   └─────────────────────────────┘
           │          ↓
           │   ┌─────────────────────────────┐
           │   │  Builder Mode (themed)      │
           │   │  - Forest tiles/items       │
           │   │  - Forest colors/style      │
           │   └─────────────────────────────┘
           │
           └─→ Play Escape Rooms
               ↓
               ┌─────────────────────────────┐
               │  Browse Levels              │
               │  ┌───────────────────────┐  │
               │  │ 🌲 Forest Escape      │  │
               │  │ Theme: Forest         │  │
               │  │ [Play] [Edit]         │  │
               │  └───────────────────────┘  │
               │  ┌───────────────────────┐  │
               │  │ 🏛️ Haunted Mansion    │  │
               │  │ Theme: Mansion        │  │
               │  │ [Play] [Edit]         │  │
               │  └───────────────────────┘  │
               └─────────────────────────────┘
                      ↓ [Play]
               ┌─────────────────────────────┐
               │  Solver Mode (themed)       │
               │  - Loads level's theme      │
               │  - Applies theme style      │
               └─────────────────────────────┘
```

### Main Page Rebranding

#### Current State (App.jsx)
```javascript
// Forest-specific branding
<h1>Lost in the Forest</h1>
<button>Build Forest</button>
<button>Survive Forest</button>
```

#### New State (App.jsx) - Generic Branding
```javascript
<div className="main-menu">
  <div className="logo">
    <h1>ESCAPE IT</h1>
    <p className="tagline">Create & Play Custom Escape Rooms</p>
  </div>

  <div className="menu-buttons">
    <button onClick={() => setMode('theme-select-build')} className="primary">
      <span className="icon">🎨</span>
      Create New Escape Room
    </button>

    <button onClick={() => setMode('selectLevel')} className="secondary">
      <span className="icon">🎮</span>
      Play Escape Rooms
    </button>

    <button onClick={() => setMode('about')} className="tertiary">
      <span className="icon">ℹ️</span>
      About
    </button>
  </div>

  <div className="theme-showcase">
    <p>Available Themes:</p>
    <div className="theme-badges">
      {AVAILABLE_THEMES.map(theme => (
        <span key={theme.id} className="theme-badge">
          {theme.emoji || '🎯'} {theme.name}
        </span>
      ))}
    </div>
  </div>
</div>
```

### Theme Selection Screens

#### Option A: Theme Selection Before Builder (Recommended)

```javascript
// New component: ThemeSelect.jsx
function ThemeSelect({ onSelectTheme, purpose }) {
  return (
    <div className="theme-select-screen">
      <h2>
        {purpose === 'build' ? 'Choose a Theme for Your Escape Room' : 'Filter by Theme'}
      </h2>

      <div className="theme-grid">
        {AVAILABLE_THEMES.map(theme => (
          <div
            key={theme.id}
            className="theme-card"
            onClick={() => onSelectTheme(theme.id)}
          >
            <div className="theme-thumbnail">
              {theme.thumbnail ? (
                <img src={theme.thumbnail} alt={theme.name} />
              ) : (
                <div className="theme-emoji">{theme.emoji || '🎯'}</div>
              )}
            </div>

            <div className="theme-info">
              <h3>{theme.name}</h3>
              <p className="theme-description">{theme.description}</p>

              <div className="theme-meta">
                <span className="difficulty">⭐ {theme.difficulty}</span>
                {purpose === 'browse' && (
                  <span className="level-count">
                    {getLevelCountForTheme(theme.id)} levels
                  </span>
                )}
              </div>
            </div>

            <button className="select-btn">
              {purpose === 'build' ? 'Create with this theme' : 'View levels'}
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => history.back()} className="back-btn">
        ← Back to Menu
      </button>
    </div>
  );
}
```

#### App.jsx Mode Flow

```javascript
function App() {
  const [mode, setMode] = useState('menu');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  // Mode states:
  // - 'menu': Main menu
  // - 'theme-select-build': Choose theme for building
  // - 'build': Builder mode (needs selectedTheme)
  // - 'selectLevel': Browse all levels (can filter by theme)
  // - 'solve': Play a level (needs selectedLevel)
  // - 'about': About page

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    setMode('build');
  };

  return (
    <div className="app">
      {mode === 'menu' && (
        <MainMenu
          onCreateNew={() => setMode('theme-select-build')}
          onPlayLevels={() => setMode('selectLevel')}
          onAbout={() => setMode('about')}
        />
      )}

      {mode === 'theme-select-build' && (
        <ThemeSelect
          purpose="build"
          onSelectTheme={handleThemeSelect}
          onBack={() => setMode('menu')}
        />
      )}

      {mode === 'build' && selectedTheme && (
        <BuilderMode
          themeId={selectedTheme}
          onBack={() => setMode('menu')}
          onTest={(level) => {
            setSelectedLevel(level);
            setMode('solve');
          }}
        />
      )}

      {mode === 'selectLevel' && (
        <LevelSelect
          onPlay={(level) => {
            setSelectedLevel(level);
            setSelectedTheme(level.themeId); // Load theme from level
            setMode('solve');
          }}
          onEdit={(level) => {
            setSelectedLevel(level);
            setSelectedTheme(level.themeId);
            setMode('build');
          }}
          onBack={() => setMode('menu')}
        />
      )}

      {mode === 'solve' && selectedLevel && selectedTheme && (
        <SolverMode
          level={selectedLevel}
          themeId={selectedTheme}
          onBack={() => setMode('selectLevel')}
        />
      )}

      {mode === 'about' && (
        <AboutPage onBack={() => setMode('menu')} />
      )}
    </div>
  );
}
```

### Level Select with Theme Filtering

```javascript
// Updated LevelSelect.jsx
function LevelSelect({ onPlay, onEdit, onBack }) {
  const [levels] = useState(loadLevels());
  const [filterTheme, setFilterTheme] = useState(null);

  const filteredLevels = filterTheme
    ? levels.filter(l => l.themeId === filterTheme)
    : levels;

  return (
    <div className="level-select">
      <div className="header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Play Escape Rooms</h2>

        {/* Theme filter */}
        <div className="theme-filter">
          <button
            className={!filterTheme ? 'active' : ''}
            onClick={() => setFilterTheme(null)}
          >
            All Themes
          </button>
          {AVAILABLE_THEMES.map(theme => (
            <button
              key={theme.id}
              className={filterTheme === theme.id ? 'active' : ''}
              onClick={() => setFilterTheme(theme.id)}
            >
              {theme.emoji} {theme.name}
            </button>
          ))}
        </div>
      </div>

      <div className="level-grid">
        {filteredLevels.map(level => (
          <LevelCard
            key={level.id}
            level={level}
            theme={getThemeById(level.themeId)}
            onPlay={() => onPlay(level)}
            onEdit={() => onEdit(level)}
          />
        ))}
      </div>
    </div>
  );
}

function LevelCard({ level, theme, onPlay, onEdit }) {
  return (
    <div className="level-card" style={{ borderColor: theme.primaryColor }}>
      {/* Theme badge */}
      <div className="theme-badge" style={{ backgroundColor: theme.primaryColor }}>
        {theme.emoji} {theme.name}
      </div>

      <h3>{level.name}</h3>

      <div className="level-stats">
        <span>❤️ Lives: {level.lives}</span>
        <span>🎒 Capacity: {level.inventoryCapacity}</span>
        <span>🎯 Missions: {level.missions.length}</span>
      </div>

      <div className="level-actions">
        <button onClick={onPlay} className="play-btn">
          ▶️ Play
        </button>
        <button onClick={onEdit} className="edit-btn">
          ✏️ Edit
        </button>
      </div>
    </div>
  );
}
```

### Builder Mode - Theme Locked

Once in builder mode, the theme is **locked** for that level:

```javascript
function BuilderMode({ themeId, levelToEdit, onBack, onTest }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    // Load theme on mount
    const loader = new ThemeLoader(themeId);
    loader.load().then(setTheme);
  }, [themeId]);

  if (!theme) return <div>Loading theme...</div>;

  return (
    <div className="builder-mode" data-theme={themeId}>
      <div className="builder-header">
        <button onClick={onBack}>← Exit</button>

        {/* Show which theme we're using */}
        <div className="current-theme-indicator">
          <span>Theme: {theme.theme.name}</span>
          <span className="theme-emoji">{theme.theme.emoji}</span>
        </div>

        <input
          type="text"
          placeholder="Level name..."
          value={levelName}
          onChange={(e) => setLevelName(e.target.value)}
        />

        <button onClick={handleSave}>💾 Save</button>
        <button onClick={() => onTest(currentLevel)}>▶️ Test</button>
      </div>

      {/* Rest of builder UI - uses theme's tiles/items */}
      <Toolbar theme={theme} selectedTool={selectedTool} onSelectTool={setSelectedTool} />
      <Grid theme={theme} grid={grid} ... />
      <PropertiesPanel theme={theme} ... />
      <MissionEditor missions={missions} ... />
    </div>
  );
}
```

### Styling Strategy

#### Generic App Styles (index.css)
- Neutral colors for main menu (grays, whites)
- Generic button styles
- Layout/structure only

#### Theme-Specific Styles (themes/*/style.css)
- Loaded dynamically when theme is active
- Applied via data attribute: `[data-theme="forest"]`
- Only affects builder/solver screens

```css
/* index.css - Generic */
.app {
  background: #1a1a1a;
  color: #ffffff;
}

.main-menu {
  /* Neutral styling */
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
}

/* themes/forest/style.css - Theme-specific */
[data-theme="forest"] {
  --theme-primary: #68aa44;
  --theme-bg: #0a1f0a;
  --theme-accent: #a8f0a8;
}

[data-theme="forest"] .builder-mode,
[data-theme="forest"] .solver-mode {
  background-color: var(--theme-bg);
  color: var(--theme-accent);
}

[data-theme="forest"] button {
  background: linear-gradient(135deg, #68aa44, #44aa44);
  box-shadow: 0 0 20px rgba(104, 170, 68, 0.4);
}
```

### Summary of Changes

| Component | Current | After Refactor |
|-----------|---------|----------------|
| **Main Menu** | "Lost in the Forest" branding | "Escape It" generic branding |
| **Create Button** | Goes directly to builder | Goes to theme selection screen |
| **Builder Mode** | Uses hardcoded forest theme | Receives themeId prop, loads theme |
| **Level List** | Shows all levels | Shows all levels + theme filter |
| **Level Card** | Generic styling | Shows theme badge, themed colors |
| **Solver Mode** | Uses hardcoded forest theme | Loads theme from level.themeId |

### Migration for Existing Levels

```javascript
// src/utils/storage.js
export function migrateLevels() {
  const levels = loadLevels();
  let needsSave = false;

  levels.forEach(level => {
    if (!level.themeId) {
      level.themeId = 'forest'; // Default to forest
      needsSave = true;
    }
  });

  if (needsSave) {
    saveLevels(levels);
  }
}

// Call on app startup
// App.jsx
useEffect(() => {
  migrateLevels();
}, []);
```

---

## Final Architecture Decision

### ✅ Recommended Flow:

1. **Main Menu**: Generic "Escape It" branding, no theme loaded
2. **Create New**: Shows theme selection grid → loads theme → enters builder
3. **Play**: Shows level list with theme badges → click level → loads theme → enters solver
4. **Theme Locked Per Level**: Once a level is created with a theme, it stays with that theme
5. **Theme Change**: Only way to change theme is to create a new level

### Alternative Considered (Not Recommended):

- Let users switch themes mid-build: Too complex, breaks existing levels, confusing UX
- Default theme: Removes choice, defeats purpose of multi-theme system

---

**End of Plan Document**

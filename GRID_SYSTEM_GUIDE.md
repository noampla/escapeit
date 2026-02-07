# Two-Layer Grid System Guide

## Architecture Overview

### Grid Structure
Every cell in the grid has TWO layers:
```javascript
grid[y][x] = {
  floor: { type: 'ground', config: {} },  // Always present (base layer)
  object: { type: 'item-key', config: {} } | null  // Optional (top layer)
}
```

### Key Principle
- **Floor layer**: Terrain, walls, ground, water, snow, start/exit points
- **Object layer**: Items, doors, hazards, entities (guards, cameras, bears)
- **Objects render transparently on top of floors** (no background fill)
- **Objects can only be placed on floor tiles** (not on empty/void)

---

## Common Tasks & How to Do Them

### Task 1: Make a Tile Walkable/Unwalkable

**Example**: "Make snow walkable" or "Make water unwalkable"

**File**: `themes/<theme-name>/tiles.js`

**Change**: Update the `walkable` property in `TILE_TYPES`

```javascript
export const TILE_TYPES = {
  snow: {
    label: 'Snow',
    color: '#ddeeff',
    category: 'basic',
    layer: 'floor',  // <- Keep layer as 'floor'
    walkable: true,  // <- CHANGE: false → true
    tooltip: '...'
  }
}
```

**That's it!** The engine automatically uses this property.

---

### Task 2: Convert Floor to Object (or vice versa)

**Example**: "Make snow an object instead of floor" or "Make fire a floor instead of object"

**File**: `themes/<theme-name>/tiles.js`

**Change**: Update the `layer` property

```javascript
// Before: Snow as floor
snow: {
  label: 'Snow',
  layer: 'floor',  // <- Old
  // ...
}

// After: Snow as object
snow: {
  label: 'Snow',
  layer: 'object',  // <- CHANGE: 'floor' → 'object'
  // ...
}
```

**Important**: When changing layers:
- **Floor → Object**: Objects need walkable floors beneath them
  - In builder mode, `validateObjectPlacement()` checks this
  - You may need to update placement validation logic
- **Object → Floor**: Usually safe, just change the layer

**Files that might need updates after layer change**:
1. `themes/<theme>/tiles.js` - Change layer property
2. `themes/<theme>/hazards.js` - If it's a hazard, update detection logic
3. `themes/<theme>/interactions.js` - If it's interactable, update interaction checks

---

### Task 3: Allow Objects on Non-Walkable Floors

**Example**: "Allow placing items on snow" or "Allow cameras on walls"

**Option A: Make the floor walkable** (see Task 1)

**Option B: Add `attachToWall` property** (for special cases like cameras)

**File**: `themes/<theme-name>/tiles.js`

```javascript
camera: {
  label: 'Security Camera',
  layer: 'object',
  walkable: false,
  attachToWall: true,  // <- ADD THIS
  tooltip: 'Can be placed on walls or boundaries'
}
```

**Validation Logic**: `src/engine/tiles.js` - `validateObjectPlacement()`
```javascript
// Exception: cameras/lasers can attach to walls
if (!floorDef?.walkable && !objectDef?.attachToWall) {
  return { valid: false, message: '...' };
}
```

---

### Task 4: Make a Hazard Tile Safe to Walk On

**Example**: "Make fire not damage player" or "Make bear friendly"

**Files to change**:

1. **themes/<theme>/tiles.js** - Make it walkable
```javascript
fire: {
  label: 'Fire',
  layer: 'object',
  walkable: true,  // <- Allow walking on it
  // ...
}
```

2. **themes/<theme>/hazards.js** - Remove hazard detection
```javascript
export function checkHazardAt(grid, x, y, gameState) {
  const cell = grid[y]?.[x];
  const tileType = cell.object?.type || cell.floor?.type;

  // REMOVE or comment out:
  // if (tileType === 'fire') {
  //   return { type: 'fire', damage: 1, ... };
  // }

  return null;
}
```

3. **themes/<theme>/tiles.js** - Update movement rules (if special logic exists)
```javascript
export function checkMovementInto(tileType, gameState, tileConfig) {
  // REMOVE fire check:
  // case 'fire':
  //   return { allowed: false, loseLife: true };
}
```

---

### Task 5: Add New Tile Type

**Example**: "Add a 'mud' floor tile" or "Add a 'coin' item"

**File**: `themes/<theme-name>/tiles.js`

**Steps**:
1. Decide the layer (floor or object)
2. Add to `TILE_TYPES`
3. Add emoji (optional)
4. Add to category for builder toolbar

```javascript
export const TILE_TYPES = {
  // ... existing tiles

  mud: {
    label: 'Mud',
    color: '#6b5a3a',
    category: 'basic',      // 'basic', 'interactive', 'hazard', or null
    layer: 'floor',         // 'floor' or 'object'
    tooltip: 'Sticky mud. Slows movement.',
    walkable: true,         // Can player walk on it?
    configurable: false,    // Can player configure properties?
    defaultConfig: {}       // Default config values
  }
}

// Add emoji (optional)
export function getTileEmoji(tileType) {
  const emojiMap = {
    // ... existing emojis
    mud: '🟫'
  };
  return emojiMap[tileType];
}
```

---

### Task 6: Make Special Movement Rules

**Example**: "Make snow walkable only with sweater"

**File**: `themes/<theme-name>/tiles.js`

**Two places to update**:

1. **Static walkability** - `TILE_TYPES`
```javascript
snow: {
  walkable: false,  // Base walkability (without items)
  // ...
}
```

2. **Dynamic walkability** - `checkMovementInto()` function
```javascript
export function checkMovementInto(tileType, gameState, tileConfig) {
  switch (tileType) {
    case 'snow':
      const hasSweater = gameState.inventory?.some(
        item => item.itemType === 'sweater'
      );
      if (hasSweater) {
        return { allowed: true };
      }
      return {
        allowed: false,
        messageKey: 'tooCold'
      };

    // ... other cases
  }
}
```

**Pattern for special movement**:
- Base `walkable: false` in TILE_TYPES
- Add logic in `checkMovementInto()` to allow conditionally
- Return `{ allowed: true }` or `{ allowed: false, messageKey: '...' }`

---

### Task 7: Change Tile During Gameplay

**Example**: "When tree is cut, replace with wood" or "Open door removes it"

**File**: `themes/<theme-name>/interactions.js`

**Pattern**: Modify the grid in the `execute()` function

```javascript
execute: (gameState, grid, x, y) => {
  const cell = grid[y][x];

  // Modify floor layer
  grid[y][x].floor = { type: 'ground', config: {} };

  // Modify object layer
  grid[y][x].object = { type: 'item-wood', config: {} };

  // Or remove object
  grid[y][x].object = null;

  return {
    success: true,
    modifyGrid: true,  // Signal that grid changed
    messageKey: 'treeCut'
  };
}
```

**Remember**:
- Access layers with `cell.floor` and `cell.object`
- Always check both layers: `const tileType = cell.object?.type || cell.floor?.type`
- Set `modifyGrid: true` to update the display

---

## File Reference

### Core Engine Files

**src/engine/tiles.js**
- `createEmptyGrid()` - Creates two-layer grid
- `placeTile()` - Places tiles on correct layer
- `removeTile()` - Removes object first, then floor
- `isWalkable()` - Checks if cell is walkable
- `validateObjectPlacement()` - Validates object placement on floors

**src/engine/hazards.js**
- Generic hazard detection (fire, bear for forest theme)
- Falls back to theme-specific hazards

**src/engine/collision.js**
- `canMoveTo()` - Checks if movement is valid
- Uses `isWalkable()` from tiles.js

---

### Theme Files (per theme)

**themes/<theme>/tiles.js** - **MOST IMPORTANT**
- `TILE_TYPES` - Define all tiles (layer, walkable, color, etc.)
- `getTileEmoji()` - Emoji mappings
- `renderTile()` - Custom rendering (optional)
- `checkMovementInto()` - Special movement rules
- `isWalkable()` - Theme-specific walkability logic
- `getTileLayer()` - Get layer for tile type
- `getDefaultFloor()` - Default floor for theme

**themes/<theme>/hazards.js**
- `HAZARD_TYPES` - Define hazards
- `checkHazardAt()` - Check if position has hazard
- `getAllHazardZones()` - Get vision cones/zones for builder
- Remember: Check both layers `cell.object?.type || cell.floor?.type`

**themes/<theme>/interactions.js**
- `INTERACTIONS` - Define all interactions (E key actions)
- `executeInteraction()` - Modify grid during interactions
- Check both layers in requirements
- Modify correct layer in execute

---

### UI/Rendering Files

**src/components/Grid.jsx**
- Renders both layers
- Floor first (opaque background), then object (transparent)
- Shows hazard zones overlay
- Pattern:
  ```javascript
  // Layer 1: Floor
  const floorDef = TILE_TYPES[cell.floor?.type];
  ctx.fillStyle = floorDef.color;  // Opaque background
  ctx.fillRect(...);

  // Layer 2: Object (if exists)
  if (cell.object) {
    // NO BACKGROUND - transparent on floor
    renderTile(ctx, cell.object, ...);
  }
  ```

**src/components/BuilderMode.jsx**
- `canPlaceTile()` - Check if camera/laser can be placed on wall
- `handleGridClick()` - Validate object placement with `validateObjectPlacement()`
- Shows hazard zones when `showHazardZones` is true

**src/components/SolverMode.jsx**
- All gameplay logic
- **Critical**: Always check both layers
  - `cell.object?.type || cell.floor?.type`
  - `cell.object?.type?.startsWith('item-')`
- Movement, interactions, pickups all use two-layer format

---

## Key Patterns & Best Practices

### ✅ Always Check Both Layers
```javascript
// ✅ GOOD
const tileType = cell.object?.type || cell.floor?.type;
if (tileType === 'fire') { ... }

// ❌ BAD
if (cell.type === 'fire') { ... }  // cell.type doesn't exist!
```

### ✅ Access Config from Correct Layer
```javascript
// ✅ GOOD
const config = cell.object?.config || cell.floor?.config;
const direction = config?.direction || 'down';

// ❌ BAD
const direction = cell.config?.direction;  // cell.config doesn't exist!
```

### ✅ Null Safety with Optional Chaining
```javascript
// ✅ GOOD
if (cell.object?.type?.startsWith('item-')) { ... }

// ❌ BAD (crashes if object is null)
if (cell.object.type.startsWith('item-')) { ... }
```

### ✅ Modify Correct Layer
```javascript
// ✅ GOOD - Remove object, floor remains
grid[y][x].object = null;

// ✅ GOOD - Change floor
grid[y][x].floor = { type: 'ground', config: {} };

// ❌ BAD (overwrites entire cell)
grid[y][x] = { type: 'ground', config: {} };
```

### ✅ Special Movement Returns Two-Layer Format
```javascript
// ✅ GOOD - Raft movement
return {
  allowed: true,
  setSourceTile: {
    floor: { type: 'water', config: {} },
    object: null
  },
  setDestTile: {
    floor: { type: 'water', config: {} },
    object: { type: 'raft', config: {} }
  }
};

// ❌ BAD (old single-layer format causes black tiles)
return {
  allowed: true,
  setSourceTile: { type: 'water', config: {} }
};
```

---

## Quick Checklist for Changes

When modifying tile behavior, check these files:

- [ ] `themes/<theme>/tiles.js` - Update TILE_TYPES (layer, walkable, etc.)
- [ ] `themes/<theme>/hazards.js` - Update hazard detection (if hazard)
- [ ] `themes/<theme>/interactions.js` - Update interactions (if interactable)
- [ ] `src/components/SolverMode.jsx` - Check if gameplay logic needs updates
- [ ] Test in builder mode (can place tiles correctly?)
- [ ] Test in solver mode (movement, interactions, hazards work?)

---

## Example: "Make snow walkable and placeable"

**Goal**: Turn snow into a floor you can put things on

**Solution**:

1. **File**: `themes/forest/tiles.js`
   ```javascript
   snow: {
     label: 'Snow',
     color: '#ddeeff',
     category: 'basic',
     layer: 'floor',
     walkable: true,  // ← CHANGE: false → true
     tooltip: 'Walkable snowy ground.'
   }
   ```

2. **Remove special movement** (if exists)
   ```javascript
   export function checkMovementInto(tileType, gameState, tileConfig) {
     // DELETE this case:
     // case 'snow':
     //   if (!hasSweater) return { allowed: false };
   }
   ```

3. **Done!** Now:
   - Snow is walkable without sweater
   - Objects can be placed on snow (it's a walkable floor)
   - No code changes needed elsewhere (engine handles it automatically)

---

## Troubleshooting

### Problem: "Cannot place objects on this tile!"
**Cause**: Floor is not walkable, or floor is 'empty'
**Fix**:
1. Make floor walkable: `walkable: true` in TILE_TYPES
2. Or add `attachToWall: true` to object (cameras/lasers only)
3. Or use `validateObjectPlacement()` to check logic

### Problem: Vision cones not showing for guards/cameras
**Cause**: Hazard detection using old single-layer format
**Fix**: Update `themes/<theme>/hazards.js`:
```javascript
const tileType = cell.object?.type || cell.floor?.type;
if (tileType === 'guard') { ... }
```

### Problem: Tiles turn black when moved/interacted
**Cause**: Returning old single-layer format in movement/interaction
**Fix**: Return two-layer format:
```javascript
{ floor: { type: '...', config: {} }, object: null }
```

### Problem: "Cannot read properties of undefined (reading 'type')"
**Cause**: Accessing `cell.type` instead of `cell.object?.type` or `cell.floor?.type`
**Fix**: Use optional chaining and check both layers:
```javascript
const tileType = cell.object?.type || cell.floor?.type;
```

---

## Summary

**The Golden Rules**:
1. **Every cell has TWO layers**: floor (always present) + object (optional)
2. **Objects render transparently on floors** (no background)
3. **Always check both layers**: `cell.object?.type || cell.floor?.type`
4. **Modify the correct layer**: floor or object
5. **Most properties live in TILE_TYPES**: walkable, layer, configurable, etc.
6. **Engine is automatic**: Just set `walkable` and `layer` properties correctly

**Most common changes** happen in `themes/<theme>/tiles.js` in the `TILE_TYPES` object.

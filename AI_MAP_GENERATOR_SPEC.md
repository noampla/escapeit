# AI Map Generator — Feature Spec

## Overview

Add an "AI Mode" to the Builder that lets creators describe a map in natural language. The description is sent to the server with a minimal tile catalog (just IDs + layer info). The server calls Claude API, which returns a sparse map JSON. The server expands and validates it, then returns a full grid that gets loaded into the builder for further editing.

---

## User Flow

```
Builder Mode
  └─ Click "AI Mode" button (in Toolbar)
       └─ AI Panel slides open
            ├─ Textarea: "Describe your map..."
            ├─ Optional: difficulty selector (easy / medium / hard)
            └─ "Generate Map" button
                 └─ Loading spinner
                      └─ Server builds prompt from tile catalog
                           └─ Claude API returns sparse grid JSON
                                └─ Server expands + validates → full 100x100 grid
                                     └─ Grid loaded into builder
                                          └─ Creator can edit / tweak / save
```

### Key UX Decisions

1. **AI generates into the builder grid** — the returned JSON replaces the current grid in BuilderMode, exactly as if the user had placed every tile by hand. The creator sees the result in the builder canvas, can pan around, select tiles, edit configs, move objects, and use every existing builder tool. **The map is NOT saved or published automatically** — it's just loaded into the editor state.
2. **Full builder editing after generation** — the AI output is a starting point. The creator can add/remove tiles, change configs, adjust missions, test-play, and then save when satisfied. The undo stack is preserved so Ctrl+Z reverts to the pre-generation state.
3. **One theme at a time** — the AI panel reads the currently-loaded theme and sends only that theme's tile catalog.

---

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌───────────┐
│  React App  │ ───> │  Your Server     │ ───> │ Claude API│
│  (Builder)  │ <─── │  (existing)      │ <─── │           │
└─────────────┘      └──────────────────┘      └───────────┘
     │                       │
     │ POST /api/generate-map│
     │ { story, tileCatalog }│
     │                       │
     │  ← { grid, missions } │
```

The Claude API key lives on the server as an environment variable — never exposed to the browser.

```
CLAUDE_API_KEY=sk-ant-...   # in server .env file
```

---

## What Claude Actually Needs to Know

### Core insight: interactions are NOT needed

Claude does NOT need to know about interactions. The game engine handles all interaction logic automatically:
- Place a `bear` + `item-knife` → engine knows knife defeats bear
- Place `water` + `item-raft` → engine knows raft crosses water
- Place `tree` + `item-axe` → engine knows axe chops tree

Claude only needs to know **which tile IDs exist and which layer they go on**, so it returns valid type strings. The engine does the rest.

### Minimal tile catalog

For each tile, Claude only needs:

| Field | Why |
|---|---|
| `id` | The string to put in the JSON (e.g. `"rock-wall"`, `"item-knife"`) |
| `layer` | `"floor"` or `"object"` — so Claude puts it in the right cell field |
| `walkable` | So Claude knows what blocks the player |
| `unique` | So Claude doesn't place two cars |
| `tooltip` | A one-liner that tells Claude what the tile does (this is the key — tooltips already describe gameplay purpose in plain English) |

That's it. No colors, no config schemas, no rendering info, no interaction graphs.

---

## Dynamic Prompt Construction

### What the client sends to the server

```js
// POST /api/generate-map
{
  story: "A dark forest with a river running through it...",
  themeId: "forest",
  tileCatalog: [
    { id: "empty",      layer: "floor",  walkable: false, tooltip: "Empty void." },
    { id: "ground",     layer: "floor",  walkable: true,  tooltip: "Walkable forest ground." },
    { id: "water",      layer: "floor",  walkable: false, tooltip: "Blocks movement. Needs raft." },
    { id: "campfire",   layer: "floor",  walkable: true,  tooltip: "Player spawn point.", unique: false },
    { id: "car",        layer: "floor",  walkable: true,  tooltip: "Level exit.", unique: true },
    { id: "tree",       layer: "object", walkable: false, tooltip: "Blocks movement. Cut with axe." },
    { id: "rock-wall",  layer: "object", walkable: false, tooltip: "Permanent wall." },
    { id: "bear",       layer: "object", walkable: false, tooltip: "Hazard. Defeat with knife." },
    { id: "item-knife", layer: "object", walkable: true,  tooltip: "Collectible knife." },
    { id: "item-raft",  layer: "object", walkable: true,  tooltip: "Collectible raft for water." },
    // ... all placeable tiles for current theme
  ],
  startTile: "campfire",
  exitTile: "car",
  missionTypes: ["escape", "collect", "rescue", "extinguish", "reach"],
  difficulty: "medium",       // optional
}
```

### How to extract tileCatalog on the client

```js
// Inside the Builder, theme is already loaded via ThemeContext
const theme = useContext(ThemeContext);

function getTileCatalogForAI() {
  const tileTypes = theme.getTileTypes();
  const themeConfig = theme.getThemeConfig?.() || {};

  // Only include placeable tiles (category !== null)
  // Exclude runtime-only tiles like "tree-stump", "defeated-bear", etc.
  const catalog = Object.entries(tileTypes)
    .filter(([_, t]) => t.category !== null)
    .map(([id, t]) => ({
      id,
      layer: t.layer,
      walkable: t.walkable,
      tooltip: t.tooltip,
      ...(t.unique ? { unique: true } : {}),
    }));

  return {
    tileCatalog: catalog,
    startTile: themeConfig.startTile || 'campfire',
    exitTile: (themeConfig.exitTiles || ['car'])[0],
    missionTypes: (themeConfig.missions?.types || ['escape']),
  };
}
```

This is **fully dynamic** — if a new tile is added to any theme, it automatically appears in the catalog with zero code changes to the AI feature. The tooltip is the only "description" Claude needs, and it's already maintained by the theme author.

---

## Server-Side Prompt Construction

The server receives the client payload and builds the prompt for Claude.

### System Prompt

```
You are a map generator for "Escape It", a puzzle escape-room game.

RESPONSE FORMAT — return ONLY valid JSON, no markdown, no explanation:
{
  "name": "short level title",
  "fills": [
    { "r1": 0, "c1": 0, "r2": 99, "c2": 99, "floor": "empty" },
    { "r1": 43, "c1": 42, "r2": 57, "c2": 68, "floor": "ground" }
  ],
  "cells": [
    { "r": 49, "c": 49, "floor": "campfire" },
    { "r": 49, "c": 50, "object": "bear" },
    { "r": 49, "c": 51, "object": "item-knife" }
  ],
  "missions": [
    { "type": "escape", "description": "Reach the car to escape!" }
  ],
  "lives": 3,
  "inventoryCapacity": 8
}

HOW THE GRID WORKS:
- The map is 100 rows × 100 columns (0-99).
- Each cell has two layers: "floor" (always present) and "object" (optional, on top).
- "fills" paint rectangular areas of floor tiles, applied in order.
- "cells" set individual tiles (floor and/or object), applied after fills.
- If a cell only has "floor" in "cells", the object stays null.
- If a cell only has "object" in "cells", the floor stays whatever the last fill set.
- A cell can have BOTH floor and object set in one entry.

AVAILABLE TILES:
${tileCatalog formatted as a compact list — see below}

RULES:
1. Floor-layer tiles go in "floor". Object-layer tiles go in "object". Never mix.
2. At least one "${startTile}" (player spawn).
3. Exactly one "${exitTile}" (level exit) — it has unique: true.
4. Player must have a solvable walkable path from spawn to exit.
5. Every mission target must exist on the grid.
6. Tiles with unique: true can only appear once.
7. Center the playable area around row 50, col 50. Surround with empty void.
8. Use fills for large areas (ground, water, snow). Use cells for individual placements.
9. Create interesting puzzle flow — items, obstacles, and a clear path to the exit.
10. Walls and obstacles should form rooms/corridors, not random scatter.

MISSION FORMAT:
{ "type": "escape|collect|rescue|extinguish|reach", "description": "string", "targetId?": "item type for collect" }
```

### Formatting the tile catalog (compact)

Instead of sending full JSON objects, format tiles as a compact readable list:

```
FLOOR TILES (use in "floor" field):
- empty: void, not walkable
- ground: walkable forest ground
- water: blocks movement, needs raft to cross
- snow: blocks movement unless wearing sweater
- campfire: player spawn point (walkable)
- car: level exit (walkable, unique)
- cave-entry: cave entrance (walkable)
- cave: dark cave interior (walkable)

OBJECT TILES (use in "object" field):
- tree: blocks movement, cut with axe for wood
- boulder: blocks movement, carve with pickaxe
- rock-wall: permanent wall
- thorny-bush: blocks movement, clear with machete
- fire: hazard, 1 life damage, extinguish with filled bucket
- bear: hazard, 1 life damage, defeat with knife
- friend: NPC to rescue
- sign: displays a message
- door-key: locked door, needs matching color key
- door-card: locked door, needs matching color card
- item-key: collectible key
- item-axe: collectible axe, cuts trees
- item-bucket: collectible bucket, fill at water
- item-rope: collectible rope, combine with wood for raft
- item-knife: collectible knife, defeats bears
- item-pickaxe: collectible pickaxe, carves boulders
- item-machete: collectible machete, clears bushes
- item-stick: collectible stick, light at fire for torch
- item-torch: collectible torch, lights dark areas
- item-sweater: collectible sweater, walk on snow
- item-wood: collectible wood, combine with rope for raft
- item-raft: collectible raft, place on water to cross
- item-shovel: collectible shovel, dig buried items
```

This is generated dynamically from `tileCatalog` — each line is just `id: tooltip`. ~400 tokens total vs. ~3,000 for raw JSON objects.

### User Prompt

```
Create a map for the "${themeId}" theme based on this story:

"${userStory}"

Difficulty: ${difficulty}
```

### Claude API Call

```js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const response = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 16000,   // sparse format is compact — 16K is plenty
  system: systemPrompt,
  messages: [{ role: "user", content: userPrompt }],
});
```

**Model choice:** Sonnet — fast enough for interactive use (~10-20s), capable enough for structured JSON. With the sparse format, the response is small enough that 16K max_tokens is sufficient.

---

## Server-Side: Expanding Sparse → Full Grid

```js
function expandSparseMap(sparseData) {
  const ROWS = 100, COLS = 100;
  const emptyCell = () => ({
    floor: { type: 'empty', config: {} },
    object: null
  });

  // 1. Initialize 100x100 empty grid
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, emptyCell)
  );

  // 2. Apply fills in order (rectangles of floor tiles)
  for (const fill of (sparseData.fills || [])) {
    for (let r = fill.r1; r <= fill.r2; r++) {
      for (let c = fill.c1; c <= fill.c2; c++) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          if (fill.floor) {
            grid[r][c].floor = { type: fill.floor, config: {} };
          }
          if (fill.object) {
            grid[r][c].object = { type: fill.object, config: {} };
          }
        }
      }
    }
  }

  // 3. Apply individual cells (overrides)
  for (const cell of (sparseData.cells || [])) {
    const { r, c } = cell;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      if (cell.floor) {
        grid[r][c].floor = { type: cell.floor, config: {} };
      }
      if (cell.object) {
        grid[r][c].object = { type: cell.object, config: {} };
      }
      if (cell.object === null) {
        grid[r][c].object = null;
      }
    }
  }

  return grid;
}
```

---

## Server-Side: Validation + Auto-Repair

```js
function validateAndRepair(grid, missions, tileCatalog, startTile, exitTile) {
  const tileMap = Object.fromEntries(tileCatalog.map(t => [t.id, t]));
  const errors = [];
  let hasStart = false, exitCount = 0;

  for (let r = 0; r < 100; r++) {
    for (let c = 0; c < 100; c++) {
      const cell = grid[r][c];

      // Auto-repair: unknown floor type → empty
      if (cell.floor && !tileMap[cell.floor.type] && cell.floor.type !== 'empty') {
        cell.floor = { type: 'empty', config: {} };
      }

      // Auto-repair: floor tile used as object → move to floor, clear object
      if (cell.object && tileMap[cell.object.type]?.layer === 'floor') {
        cell.floor = { type: cell.object.type, config: {} };
        cell.object = null;
      }

      // Auto-repair: object tile used as floor → swap to ground floor, move to object
      if (cell.floor && tileMap[cell.floor.type]?.layer === 'object') {
        cell.object = { type: cell.floor.type, config: {} };
        cell.floor = { type: 'ground', config: {} };
      }

      // Auto-repair: unknown object type → remove
      if (cell.object && !tileMap[cell.object.type]) {
        cell.object = null;
      }

      if (cell.floor.type === startTile) hasStart = true;
      if (cell.floor.type === exitTile) exitCount++;
    }
  }

  // Auto-repair: no start tile → place at center
  if (!hasStart) {
    grid[50][50].floor = { type: startTile, config: {} };
    errors.push(`Added missing ${startTile} at (50,50)`);
  }

  // Auto-repair: no exit tile → place at edge of playable area
  if (exitCount === 0) {
    grid[50][70].floor = { type: exitTile, config: exitTile === 'car' ? { needsKey: false } : {} };
    errors.push(`Added missing ${exitTile} at (50,70)`);
  }

  return { grid, missions, repairs: errors };
}
```

---

## Full Server Endpoint

Add this to your existing server:

```js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

function buildSystemPrompt(tileCatalog, startTile, exitTile, missionTypes) {
  // Group tiles by layer for compact display
  const floorTiles = tileCatalog.filter(t => t.layer === 'floor');
  const objectTiles = tileCatalog.filter(t => t.layer === 'object');

  const formatTile = (t) => {
    let line = `- ${t.id}: ${t.tooltip}`;
    if (t.unique) line += ' (unique — max 1)';
    return line;
  };

  return `You are a map generator for "Escape It", a puzzle escape-room game.

RESPONSE FORMAT — return ONLY valid JSON, no markdown fences, no explanation:
{
  "name": "short level title",
  "fills": [
    { "r1": 0, "c1": 0, "r2": 99, "c2": 99, "floor": "empty" },
    { "r1": 43, "c1": 42, "r2": 57, "c2": 68, "floor": "ground" }
  ],
  "cells": [
    { "r": 49, "c": 49, "floor": "campfire" },
    { "r": 49, "c": 50, "object": "bear" },
    { "r": 49, "c": 51, "object": "item-knife" }
  ],
  "missions": [
    { "type": "escape", "description": "Reach the car to escape!" }
  ],
  "lives": 3,
  "inventoryCapacity": 8
}

HOW THE GRID WORKS:
- The map is 100 rows x 100 columns (indices 0-99).
- Each cell has two layers: "floor" (always present) and "object" (optional, sits on top of floor).
- "fills" paint rectangular areas of floor tiles. Applied in order — later fills overwrite earlier ones.
- "cells" set individual tiles after fills. A cell entry can set "floor", "object", or both.
- Start with a fill that covers the entire grid with "empty", then add ground/water fills for the play area, then individual cells for specific tiles.

FLOOR TILES (use in "floor" fields):
${floorTiles.map(formatTile).join('\n')}

OBJECT TILES (use in "object" fields):
${objectTiles.map(formatTile).join('\n')}

RULES:
1. Floor tile IDs go ONLY in "floor" fields. Object tile IDs go ONLY in "object" fields.
2. Place at least one "${startTile}" floor tile (player spawn).
3. Place exactly one "${exitTile}" floor tile (level exit).
4. There must be a solvable walkable path from spawn to exit.
5. Every collect-mission targetId must have a matching "item-{targetId}" object on the grid.
6. Center the playable area around row 50, col 50. Keep it compact — don't spread across the full 100x100.
7. Create rooms, corridors, and obstacles — not random tile scatter.
8. Place items where they make narrative sense.

MISSION FORMAT:
{ "type": "${missionTypes.join('|')}", "description": "text", "targetId": "for collect only — the item name without item- prefix" }`;
}

function buildUserPrompt(story, themeId, difficulty) {
  return `Create a map for the "${themeId}" theme.

Story: "${story}"

${difficulty ? `Difficulty: ${difficulty}` : ''}`;
}

// POST /api/generate-map
app.post("/api/generate-map", async (req, res) => {
  try {
    const { story, themeId, tileCatalog, startTile, exitTile, missionTypes, difficulty } = req.body;

    if (!story || !tileCatalog?.length) {
      return res.status(400).json({ error: "Missing story or tileCatalog" });
    }

    const systemPrompt = buildSystemPrompt(tileCatalog, startTile, exitTile, missionTypes || ['escape']);
    const userPrompt = buildUserPrompt(story, themeId, difficulty);

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].text;

    // Parse JSON — strip markdown fences if Claude adds them
    const jsonStr = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
    let sparseData;
    try {
      sparseData = JSON.parse(jsonStr);
    } catch (e) {
      return res.status(422).json({ error: "Claude returned invalid JSON", raw: text.slice(0, 500) });
    }

    // Expand sparse → full 100x100 grid
    const grid = expandSparseMap(sparseData);

    // Validate + auto-repair
    const { grid: repairedGrid, repairs } = validateAndRepair(
      grid, sparseData.missions || [], tileCatalog, startTile, exitTile
    );

    return res.json({
      name: sparseData.name || 'AI Generated Map',
      grid: repairedGrid,
      missions: sparseData.missions || [{ type: 'escape', description: 'Escape!' }],
      lives: sparseData.lives || 3,
      inventoryCapacity: sparseData.inventoryCapacity || 8,
      repairs,  // let the client know what was auto-fixed
    });
  } catch (err) {
    console.error("generate-map error:", err);
    return res.status(500).json({ error: err.message });
  }
});
```

### Environment Variable

On your server, set the env var:
```
ANTHROPIC_API_KEY=sk-ant-...
```

The `new Anthropic()` constructor reads `ANTHROPIC_API_KEY` from the environment automatically — no need to pass it in code.

---

## Frontend Components

### 1. `AiMapPanel.jsx` — The AI input panel

```
┌──────────────────────────────────────┐
│  AI Map Generator                  ✕ │
│                                      │
│  Describe your map:                  │
│  ┌──────────────────────────────────┐│
│  │ A dark forest with a river      ││
│  │ running through the middle...   ││
│  │                                 ││
│  └──────────────────────────────────┘│
│                                      │
│  Difficulty: [Easy] [Medium] [Hard]  │
│                                      │
│  [ Generate Map ]                    │
│                                      │
│  ⚠ This replaces the current grid.  │
│    You can undo with Ctrl+Z.         │
└──────────────────────────────────────┘
```

**Props:**
- `themeId` — current theme
- `theme` — loaded ThemeContext (to extract tile catalog)
- `onMapGenerated(gridData, missions, name)` — callback to load into builder
- `onClose` — close the panel

### 2. `aiMapService.js` — Client-side helper

```js
export function getTileCatalogForAI(theme) {
  const tileTypes = theme.getTileTypes();
  const themeConfig = theme.getThemeConfig?.() || {};

  const tileCatalog = Object.entries(tileTypes)
    .filter(([_, t]) => t.category !== null)   // only placeable tiles
    .map(([id, t]) => ({
      id,
      layer: t.layer,
      walkable: t.walkable,
      tooltip: t.tooltip?.replace(/\s*\(.*?\)\s*/g, ' ').trim() || id,  // strip parenthetical hints
      ...(t.unique ? { unique: true } : {}),
    }));

  return {
    tileCatalog,
    startTile: themeConfig.startTile || 'campfire',
    exitTile: (themeConfig.exitTiles || ['car'])[0],
    missionTypes: themeConfig.missions?.types || ['escape'],
  };
}

export async function generateMap(story, themeId, theme, difficulty) {
  const { tileCatalog, startTile, exitTile, missionTypes } = getTileCatalogForAI(theme);

  const res = await fetch('/api/generate-map', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ story, themeId, tileCatalog, startTile, exitTile, missionTypes, difficulty }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Generation failed');
  }

  return res.json();  // { name, grid, missions, lives, inventoryCapacity, repairs }
}
```

### 3. Integration into `BuilderMode.jsx`

The critical point: `onMapGenerated` injects the AI result into the **existing builder state** — the same `grid` and `missions` state variables the builder already uses for manual editing. After injection, every builder feature works normally (tile placement, config editing, undo/redo, test-play, save).

```jsx
const [showAiPanel, setShowAiPanel] = useState(false);

// In toolbar area
<button onClick={() => setShowAiPanel(true)}>AI Mode</button>

// Render panel
{showAiPanel && (
  <AiMapPanel
    themeId={themeId}
    theme={theme}
    onMapGenerated={(newGrid, newMissions, newName) => {
      // Push current grid to undo stack so Ctrl+Z reverts to pre-AI state
      pushUndo(grid);
      // Replace the builder's grid state — canvas re-renders automatically
      setGrid(newGrid);
      // Replace missions — mission panel updates automatically
      setMissions(newMissions);
      // Optionally set the level name
      if (newName) setLevelName(newName);
      // Close panel — builder is now in normal edit mode with AI map loaded
      setShowAiPanel(false);
    }}
    onClose={() => setShowAiPanel(false)}
  />
)}
```

After this callback fires, the builder is in its normal state — the user sees the AI-generated map on the canvas and can:
- Click any tile to select/replace it
- Shift+click to open properties panel and edit configs
- Add/remove tiles, walls, items, hazards
- Edit missions in the mission panel
- Test-play the map with the built-in solver
- Save to Firestore when satisfied

---

## Token Budget

### Prompt size (input)

| Part | Tokens |
|---|---|
| System prompt (rules + format) | ~500 |
| Tile catalog (~30 tiles × 1 line each) | ~300 |
| User story | ~50-200 |
| **Total input** | **~800-1,000** |

### Response size (output)

| Part | Tokens |
|---|---|
| fills (5-15 rectangles) | ~200-500 |
| cells (50-300 individual tiles) | ~500-3,000 |
| missions + metadata | ~100 |
| **Total output** | **~800-3,500** |

### Cost per generation

~2K-4.5K total tokens → **~$0.01-$0.03 per map** at Sonnet pricing.

---

## Handling Edge Cases

| Scenario | Solution |
|---|---|
| Claude returns invalid JSON | Strip markdown fences, retry parse. If still fails, return error to client. |
| Floor tile used as object (wrong layer) | Auto-repair: move to floor layer, set object to null |
| Object tile used as floor (wrong layer) | Auto-repair: set floor to ground, move tile to object layer |
| Unknown tile type | Auto-repair: strip it (floor→empty, object→null) |
| No start tile | Auto-repair: add campfire at center of playable area |
| No exit tile | Auto-repair: add car at edge of playable area |
| Claude hallucinates tile IDs | Validation strips unknown IDs |
| API timeout | 60s timeout on server; client shows "Taking longer than expected..." at 15s |
| Empty/short story | Client requires min 20 chars. Claude still generates a playable map. |

---

## Implementation Plan

### Phase 1 — Server endpoint
1. Add `POST /api/generate-map` to existing server
2. Implement `buildSystemPrompt` + `buildUserPrompt` (reads tileCatalog from request)
3. Implement `expandSparseMap` (sparse → full 100x100 grid)
4. Implement `validateAndRepair` (auto-fix layer issues, missing start/exit)
5. Set `ANTHROPIC_API_KEY` env var on server

### Phase 2 — Frontend
1. Create `src/utils/aiMapService.js` (tile catalog extraction + API call)
2. Create `src/components/AiMapPanel.jsx` (textarea + generate button + loading state)
3. Wire into `BuilderMode.jsx` (state injection with undo support)
4. Add "AI Mode" button to `Toolbar.jsx`

### Phase 3 — Polish
1. "Regenerate" button (same prompt, new result)
2. Prompt history (last 5 saved in localStorage)
3. Show repairs/warnings after generation
4. Loading animation with progress text

### Phase 4 — Advanced (future)
1. "AI Edit" mode — select region, describe changes, regenerate only that region
2. Multi-turn: "add more trees to the north" refines existing map
3. Template prompts: "forest maze", "island escape", "cave dungeon"

---

## File Structure

```
src/
  components/
    AiMapPanel.jsx          ← new: AI story input panel
    BuilderMode.jsx          ← modified: add AI button + panel integration
    Toolbar.jsx              ← modified: add AI Mode button
  utils/
    aiMapService.js          ← new: tile catalog extraction + fetch call

server/  (your existing server)
  routes/
    generateMap.js           ← new: Claude API endpoint + prompt builder + expander + validator
```

---

## Summary

The minimal-prompt approach:
- **No interactions sent** — the engine handles all game logic. Claude just places tiles.
- **Only tile IDs + tooltips** — ~300 tokens for the entire tile catalog instead of ~3,000.
- **Sparse response format** — fills + cells instead of 10,000 cell objects. ~1-3K output tokens.
- **Dynamic** — reads tile catalog from loaded theme at runtime. New tiles/themes work automatically.
- **Total cost: ~$0.01-$0.03 per map generation.**

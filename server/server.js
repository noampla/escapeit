import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const PORT = process.env.PORT || 8080;

// ─── Anthropic client ────────────────────────────────────────────
const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ─── HTTP server (handles REST + upgrades to WS) ────────────────
const httpServer = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── POST /api/generate-map ──
  if (req.method === 'POST' && req.url === '/api/generate-map') {
    try {
      const body = await readBody(req);
      const { story, themeId, tileCatalog, startTile, exitTile, missionTypes, aiRules, difficulty } = body;

      if (!story || !tileCatalog?.length) {
        respond(res, 400, { error: 'Missing story or tileCatalog' });
        return;
      }

      log(`AI-GEN  theme=${themeId} difficulty=${difficulty} storyLen=${story.length}`);

      const systemPrompt = buildSystemPrompt(tileCatalog, startTile, exitTile, missionTypes || ['escape'], aiRules || []);
      const userPrompt = buildUserPrompt(story, themeId, difficulty);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content[0].text;

      // Parse JSON — strip markdown fences if Claude adds them
      const jsonStr = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
      let sparseData;
      try {
        sparseData = JSON.parse(jsonStr);
      } catch {
        log('AI-GEN  ERROR: invalid JSON from Claude');
        respond(res, 422, { error: 'AI returned invalid JSON — try again', raw: text.slice(0, 300) });
        return;
      }

      // Expand sparse format → full 100x100 grid
      const grid = expandSparseMap(sparseData);

      // Validate + auto-repair
      const { repairs } = validateAndRepair(grid, tileCatalog, startTile, exitTile);
      if (repairs.length) log(`AI-GEN  repairs: ${repairs.join(', ')}`);

      respond(res, 200, {
        name: sparseData.name || 'AI Generated Map',
        grid,
        missions: sparseData.missions || [{ type: 'escape', description: 'Escape!' }],
        lives: sparseData.lives || 3,
        inventoryCapacity: sparseData.inventoryCapacity || 8,
        repairs,
      });

      log('AI-GEN  OK');
    } catch (err) {
      log(`AI-GEN  ERROR: ${err.message}`);
      respond(res, 500, { error: err.message });
    }
    return;
  }

  // Health check
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    respond(res, 200, { status: 'ok' });
    return;
  }

  respond(res, 404, { error: 'Not found' });
});

// ─── WebSocket relay (attached to the same HTTP server) ──────────
const wss = new WebSocketServer({ server: httpServer });

// rooms: Map<roomId, Map<playerId, WebSocket>>
const rooms = new Map();

function relay(roomId, senderId, message) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  let sent = 0;
  for (const [pid, ws] of room.entries()) {
    if (pid !== senderId && ws.readyState === 1 /* OPEN */) {
      ws.send(payload);
      sent++;
    }
  }
  return sent;
}

wss.on('connection', (ws) => {
  let currentRoom = null;
  let currentPlayerId = null;
  log('WS  New connection');

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.type === 'join') {
      currentRoom = msg.roomId;
      currentPlayerId = msg.playerId;

      if (!rooms.has(currentRoom)) rooms.set(currentRoom, new Map());
      rooms.get(currentRoom).set(currentPlayerId, ws);

      const room = rooms.get(currentRoom);
      log(`WS  JOIN  room=${currentRoom} player=${currentPlayerId} roomSize=${room.size}`);

      ws.send(JSON.stringify({
        type: 'room_state',
        playerCount: room.size,
        players: [...room.keys()],
      }));

      const relayed = relay(currentRoom, currentPlayerId, {
        type: 'player_joined',
        playerId: currentPlayerId,
        playerCount: room.size,
      });
      log(`WS  → notified ${relayed} peer(s)`);
      return;
    }

    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }

    // Everything else: relay verbatim with fromPlayerId injected
    if (currentRoom && currentPlayerId) {
      relay(currentRoom, currentPlayerId, { ...msg, fromPlayerId: currentPlayerId });
      if (msg.type !== 'player_move') {
        log(`WS  RELAY room=${currentRoom} type=${msg.type} from=${currentPlayerId}`);
      }
    }
  });

  ws.on('close', () => {
    if (!currentRoom || !currentPlayerId) {
      log('WS  Connection closed (never joined a room)');
      return;
    }
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.delete(currentPlayerId);
    log(`WS  LEAVE room=${currentRoom} player=${currentPlayerId} roomSize=${room.size}`);

    relay(currentRoom, currentPlayerId, {
      type: 'player_left',
      playerId: currentPlayerId,
      playerCount: room.size,
    });

    if (room.size === 0) {
      rooms.delete(currentRoom);
      log(`WS  room ${currentRoom} deleted (empty)`);
    }
  });

  ws.on('error', (err) => {
    log(`WS  ERROR player=${currentPlayerId || '?'} err=${err.message}`);
    ws.close();
  });
});

// ─── Start ───────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  log(`Server running on port ${PORT} (HTTP + WebSocket)`);
});


// ═════════════════════════════════════════════════════════════════
// AI MAP GENERATION — prompt building, expansion, validation
// ═════════════════════════════════════════════════════════════════

function buildSystemPrompt(tileCatalog, startTile, exitTile, missionTypes, aiRules) {
  const floorTiles = tileCatalog.filter(t => t.layer === 'floor');
  const objectTiles = tileCatalog.filter(t => t.layer === 'object');

  const fmt = (t) => {
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
- "fills" paint rectangular areas. Applied in order — later fills overwrite earlier ones.
- "cells" set individual tiles after fills. A cell entry can set "floor", "object", or both.
- Always start with a fill of "empty" for the entire grid, then add ground/water fills for the play area, then individual cells.

FLOOR TILES (use in "floor" fields only):
${floorTiles.map(fmt).join('\n')}

OBJECT TILES (use in "object" fields only):
${objectTiles.map(fmt).join('\n')}

TILE CONFIG:
Some tiles accept extra config via "floorConfig" or "objectConfig" in a cell entry:
- sign: { "message": "your text here" } — displayed when the player reads the sign.
- friend: { "name": "Alex" } — NPC name shown during rescue.
- door-key / door-card: { "lockColor": "red" } — color must match the key/card color. Options: "red", "blue", "green", "yellow", "purple".
- item-key / item-card: { "lockColor": "red" } — same colors as above, must match the door.

${aiRules.length ? `THEME-SPECIFIC RULES — important mechanics for this theme:\n${aiRules.map(r => `- ${r}`).join('\n')}\n` : ''}RULES:
1. Floor tile IDs go ONLY in "floor" fields. Object tile IDs go ONLY in "object" fields. Never mix.
2. Place at least one "${startTile}" floor tile (player spawn).
3. Place exactly one "${exitTile}" floor tile (level exit).
4. There must be a solvable walkable path from spawn to exit — no dead-end traps. The player must be able to reach every required item and the exit.
5. Every collect-mission targetId must have a matching "item-{targetId}" object on the grid.
6. Center the playable area around row 50, col 50. Keep it compact.
7. Create rooms, corridors, and obstacles — not random scatter. Make it look intentional.
8. Place items where they make narrative sense.
9. Use fills for large areas (ground, water, snow). Use cells for individual placements.
10. If burying items underground, always place an item-shovel somewhere accessible so the player can dig.
11. Every obstacle on a required path must have its matching tool placed somewhere the player can reach BEFORE encountering the obstacle.

MISSION FORMAT:
{ "type": "${missionTypes.join('|')}", "description": "text", "targetId": "for collect only — item name without item- prefix" }`;
}

function buildUserPrompt(story, themeId, difficulty) {
  return `Create a map for the "${themeId}" theme.

Story: "${story}"

${difficulty ? `Difficulty: ${difficulty}` : ''}`;
}

/** Expand sparse fills+cells into a full 100x100 grid. */
function expandSparseMap(sparseData) {
  const ROWS = 100, COLS = 100;
  const empty = () => ({ floor: { type: 'empty', config: {} }, object: null });

  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, empty)
  );

  // Apply fills in order
  for (const fill of (sparseData.fills || [])) {
    const r1 = clamp(fill.r1, 0, 99), r2 = clamp(fill.r2, 0, 99);
    const c1 = clamp(fill.c1, 0, 99), c2 = clamp(fill.c2, 0, 99);
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (fill.floor) grid[r][c].floor = { type: fill.floor, config: {} };
        if (fill.object) grid[r][c].object = { type: fill.object, config: {} };
      }
    }
  }

  // Apply individual cells (with optional floorConfig / objectConfig)
  for (const cell of (sparseData.cells || [])) {
    const r = clamp(cell.r, 0, 99), c = clamp(cell.c, 0, 99);
    if (cell.floor) {
      grid[r][c].floor = { type: cell.floor, config: cell.floorConfig || {} };
    }
    if (cell.object !== undefined) {
      grid[r][c].object = cell.object
        ? { type: cell.object, config: cell.objectConfig || {} }
        : null;
    }
  }

  return grid;
}

/** Validate the grid and auto-repair common issues. */
function validateAndRepair(grid, tileCatalog, startTile, exitTile) {
  const tileMap = Object.fromEntries(tileCatalog.map(t => [t.id, t]));
  const repairs = [];
  let hasStart = false, exitCount = 0;

  for (let r = 0; r < 100; r++) {
    for (let c = 0; c < 100; c++) {
      const cell = grid[r][c];

      // Unknown floor → empty
      if (cell.floor?.type && cell.floor.type !== 'empty' && !tileMap[cell.floor.type]) {
        repairs.push(`Unknown floor "${cell.floor.type}" at (${r},${c}) → empty`);
        cell.floor = { type: 'empty', config: {} };
      }

      // Object tile used as floor → move to object layer
      if (cell.floor?.type && tileMap[cell.floor.type]?.layer === 'object') {
        repairs.push(`Moved "${cell.floor.type}" from floor to object at (${r},${c})`);
        cell.object = { type: cell.floor.type, config: {} };
        cell.floor = { type: 'ground', config: {} };
      }

      // Floor tile used as object → move to floor layer
      if (cell.object?.type && tileMap[cell.object.type]?.layer === 'floor') {
        repairs.push(`Moved "${cell.object.type}" from object to floor at (${r},${c})`);
        cell.floor = { type: cell.object.type, config: {} };
        cell.object = null;
      }

      // Unknown object → remove
      if (cell.object?.type && !tileMap[cell.object.type]) {
        repairs.push(`Unknown object "${cell.object.type}" at (${r},${c}) → removed`);
        cell.object = null;
      }

      if (cell.floor?.type === startTile) hasStart = true;
      if (cell.floor?.type === exitTile) exitCount++;
    }
  }

  if (!hasStart) {
    grid[50][50].floor = { type: startTile, config: {} };
    repairs.push(`Added missing ${startTile} at (50,50)`);
  }
  if (exitCount === 0) {
    grid[50][70].floor = { type: exitTile, config: exitTile === 'car' ? { needsKey: false } : {} };
    repairs.push(`Added missing ${exitTile} at (50,70)`);
  }

  return { repairs };
}

// ─── Helpers ─────────────────────────────────────────────────────

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function log(...args) {
  const time = new Date().toISOString().slice(11, 23);
  console.log(`[${time}]`, ...args);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function respond(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

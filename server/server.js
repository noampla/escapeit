import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// rooms: Map<roomId, Map<playerId, WebSocket>>
const rooms = new Map();

function log(...args) {
  const time = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  console.log(`[${time}]`, ...args);
}

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
  log('New connection');

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.type === 'join') {
      currentRoom = msg.roomId;
      currentPlayerId = msg.playerId;

      if (!rooms.has(currentRoom)) rooms.set(currentRoom, new Map());
      rooms.get(currentRoom).set(currentPlayerId, ws);

      const room = rooms.get(currentRoom);
      log(`JOIN  room=${currentRoom} player=${currentPlayerId} roomSize=${room.size}`);

      // Tell the joining player the current room state
      ws.send(JSON.stringify({
        type: 'room_state',
        playerCount: room.size,
        players: [...room.keys()],
      }));

      // Tell everyone else a new player joined
      const relayed = relay(currentRoom, currentPlayerId, {
        type: 'player_joined',
        playerId: currentPlayerId,
        playerCount: room.size,
      });
      log(`  → notified ${relayed} peer(s)`);
      return;
    }

    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }

    // Everything else: relay verbatim with fromPlayerId injected
    if (currentRoom && currentPlayerId) {
      relay(currentRoom, currentPlayerId, { ...msg, fromPlayerId: currentPlayerId });
      // Only log non-move messages to avoid noise
      if (msg.type !== 'player_move') {
        log(`RELAY room=${currentRoom} type=${msg.type} from=${currentPlayerId}`);
      }
    }
  });

  ws.on('close', () => {
    if (!currentRoom || !currentPlayerId) {
      log('Connection closed (never joined a room)');
      return;
    }
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.delete(currentPlayerId);
    log(`LEAVE room=${currentRoom} player=${currentPlayerId} roomSize=${room.size}`);

    relay(currentRoom, currentPlayerId, {
      type: 'player_left',
      playerId: currentPlayerId,
      playerCount: room.size,
    });

    if (room.size === 0) {
      rooms.delete(currentRoom);
      log(`  room ${currentRoom} deleted (empty)`);
    }
  });

  ws.on('error', (err) => {
    log(`ERROR player=${currentPlayerId || '?'} err=${err.message}`);
    ws.close();
  });
});

log(`Relay server running on ws://localhost:${PORT}`);

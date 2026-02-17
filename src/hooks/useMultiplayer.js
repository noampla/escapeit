import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const RECONNECT_DELAY = 2000; // ms before attempting reconnect

/**
 * Manages a WebSocket connection to the relay server with automatic reconnection.
 *
 * @param {object} options
 * @param {boolean} options.enabled - false = solo mode, no connection made
 * @param {string}  options.roomId
 * @param {string}  options.playerId
 * @param {function} options.onMessage - called for every received message
 * @returns {{ connected: boolean, peers: string[], send: function }}
 */
export function useMultiplayer({ enabled, roomId, playerId, onMessage }) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState([]);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  // Tracks whether the effect is still mounted - prevents reconnect after intentional unmount
  const activeRef = useRef(false);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !roomId || !playerId) return;

    activeRef.current = true;

    function connect() {
      if (!activeRef.current) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: 'join', roomId, playerId }));
      };

      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        // Update peer list from system messages
        if (msg.type === 'room_state') {
          setPeers(msg.players.filter(id => id !== playerId));
        } else if (msg.type === 'player_joined') {
          setPeers(prev => [...prev.filter(id => id !== msg.playerId), msg.playerId]);
        } else if (msg.type === 'player_left') {
          setPeers(prev => prev.filter(id => id !== msg.playerId));
        }

        // Forward every message (including system ones) to consumer
        onMessageRef.current?.(msg);
      };

      ws.onclose = () => {
        setConnected(false);
        setPeers([]);
        wsRef.current = null;
        // Reconnect automatically unless the effect was intentionally torn down
        if (activeRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      activeRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, roomId, playerId]);

  const send = useCallback((message) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, []);

  return { connected, peers, send };
}

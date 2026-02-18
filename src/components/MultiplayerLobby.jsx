/**
 * Shown when a map has 2+ start tiles.
 * Lets the player choose Solo or Online, and handles the waiting room UI.
 *
 * The WebSocket is owned by App.jsx (to survive the lobby→game transition).
 * This component just drives the UI.
 *
 * Props:
 *   startTileCount - number of start tiles on the map
 *   connected      - ws connected boolean (from App)
 *   peers          - array of peer playerIds currently in room (from App)
 *   onStartOnline  - called when player clicks "Find Game" (App opens the ws)
 *   onBack         - called when player goes back from waiting room (App closes ws)
 *   onBackToSelect - called when player goes back from the choose screen (returns to level select)
 */
import { useState } from 'react';

export default function MultiplayerLobby({ startTileCount, connected, peers, onStartOnline, onBack, onBackToSelect }) {
  const [phase, setPhase] = useState('choose'); // 'choose' | 'waiting'

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(4px)',
  };

  const cardStyle = {
    background: 'linear-gradient(160deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
    borderRadius: 16,
    padding: '40px 48px',
    minWidth: 360,
    maxWidth: 480,
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(100, 100, 100, 0.2)',
    textAlign: 'center',
    color: '#ffffff',
    fontFamily: 'inherit',
  };

  const titleStyle = {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
    color: '#e8e8e8',
  };

  const subtitleStyle = {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  };

  const btnBase = {
    display: 'block',
    width: '100%',
    padding: '16px 24px',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: 12,
  };

  const onlineBtn = {
    ...btnBase,
    background: 'linear-gradient(135deg, #44aa44 0%, #338833 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 20px rgba(68, 170, 68, 0.4)',
  };

  const soloBtn = {
    ...btnBase,
    background: 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)',
    color: '#e8e8e8',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  };

  const dotStyle = (filled) => ({
    display: 'inline-block',
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: filled ? '#44aa44' : '#333',
    margin: '0 4px',
    border: '1px solid #555',
    transition: 'background 0.3s',
  });

  if (phase === 'choose') {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={titleStyle}>Multiplayer Required</div>
          <div style={subtitleStyle}>
            This map requires {startTileCount} players
          </div>

          <button style={onlineBtn} onClick={() => {
            setPhase('waiting');
            onStartOnline();
          }}>
            Find Game
          </button>
          <button style={soloBtn} onClick={onBackToSelect}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // Waiting room
  const playerCount = peers.length + 1; // peers + self
  const needed = startTileCount;

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={titleStyle}>Waiting for Players</div>
        <div style={subtitleStyle}>
          {connected ? 'Connected to server' : 'Connecting...'}
        </div>

        <div style={{ margin: '24px 0', fontSize: 48, letterSpacing: 4 }}>
          {Array.from({ length: needed }).map((_, i) => (
            <span key={i} style={dotStyle(i < playerCount)} />
          ))}
        </div>

        <div style={{ fontSize: 15, color: '#aaa', marginBottom: 8 }}>
          {playerCount} / {needed} players
        </div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 32 }}>
          Share this map with a friend and have them open it too
        </div>

        <button style={soloBtn} onClick={() => {
          setPhase('choose');
          onBack();
        }}>
          Back
        </button>
      </div>
    </div>
  );
}

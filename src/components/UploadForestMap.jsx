import { useState } from 'react';
import { saveLevel, generateId } from '../utils/storage';

/**
 * Builds a 100x100 forest map:
 * - Green woods with campfire at center
 * - 8x8 rock-wall enclosure with trees inside
 * - One exit on the east wall leading to a large sea (10 cols wide)
 * - Stepping-stone islands across the sea (raft crossing)
 * - Bear near camp, knife behind bear, raft item near camp
 * - Car (exit) on the far shore
 */
function buildForestMap() {
  const ROWS = 100;
  const COLS = 100;

  // Initialize empty grid
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        floor: { type: 'empty', config: {} },
        object: null
      });
    }
    grid.push(row);
  }

  const setFloor = (r, c, type, config = {}) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      grid[r][c].floor = { type, config };
    }
  };

  const setObject = (r, c, type, config = {}) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      grid[r][c].object = { type, config };
    }
  };

  // ── 1. Ground fill for the entire play area ──
  for (let r = 43; r <= 57; r++) {
    for (let c = 42; c <= 68; c++) {
      setFloor(r, c, 'ground');
    }
  }

  // ── 2. Large sea (water) — 10 columns wide ──
  // rows 43-55, cols 56-65
  for (let r = 43; r <= 55; r++) {
    for (let c = 56; c <= 65; c++) {
      setFloor(r, c, 'water');
    }
  }

  // ── 3. Stepping-stone islands across the sea at rows 49-50 ──
  // Creates 1-tile water gaps the player can cross with a single raft
  for (const c of [57, 59, 61, 63, 65]) {
    setFloor(49, c, 'ground');
    setFloor(50, c, 'ground');
  }

  // ── 4. Rock-wall enclosure (8×8 outer, 6×6 inner) ──
  // Top wall: row 46, cols 46-53
  for (let c = 46; c <= 53; c++) setObject(46, c, 'rock-wall');
  // Bottom wall: row 53, cols 46-53
  for (let c = 46; c <= 53; c++) setObject(53, c, 'rock-wall');
  // Left wall: rows 47-52, col 46
  for (let r = 47; r <= 52; r++) setObject(r, 46, 'rock-wall');
  // Right wall: rows 47-52, col 53 — opening at rows 49-50
  for (let r = 47; r <= 52; r++) {
    if (r !== 49 && r !== 50) setObject(r, 53, 'rock-wall');
  }

  // ── 5. Campfire (player start) — center of enclosure ──
  setFloor(49, 49, 'campfire');

  // ── 6. Car (exit) — on the far shore past the sea ──
  setFloor(49, 67, 'car', { needsKey: false });

  // ── 7. Trees inside the walls ──
  setObject(47, 47, 'tree');
  setObject(47, 50, 'tree');
  setObject(47, 52, 'tree');
  setObject(48, 48, 'tree');
  setObject(51, 47, 'tree');
  setObject(52, 48, 'tree');
  setObject(52, 52, 'tree');

  // ── 8. Trees outside the walls (forest atmosphere) ──
  setObject(44, 43, 'tree');
  setObject(44, 47, 'tree');
  setObject(44, 51, 'tree');
  setObject(44, 55, 'tree');
  setObject(45, 44, 'tree');
  setObject(45, 49, 'tree');
  setObject(45, 53, 'tree');
  setObject(55, 44, 'tree');
  setObject(55, 49, 'tree');
  setObject(55, 53, 'tree');
  setObject(56, 43, 'tree');
  setObject(56, 47, 'tree');
  setObject(56, 52, 'tree');
  setObject(43, 45, 'tree');
  setObject(57, 50, 'tree');
  setObject(54, 44, 'tree');
  setObject(43, 50, 'tree');
  setObject(57, 44, 'tree');

  // ── 9. Bear near the camp ──
  setObject(49, 50, 'bear');

  // ── 10. Knife behind the bear (further from camp) ──
  setObject(49, 51, 'item-knife');

  // ── 11. Raft item near the camp ──
  setObject(50, 49, 'item-raft');

  return grid;
}

export default function UploadForestMap() {
  const [status, setStatus] = useState('ready');
  const [levelId, setLevelId] = useState(null);

  const handleUpload = async () => {
    setStatus('uploading');
    try {
      const id = generateId();
      const grid = buildForestMap();

      const level = {
        id,
        name: 'Forest Escape: Bear & Sea',
        themeId: 'forest',
        grid,
        lives: 3,
        inventoryCapacity: 8,
        missions: [
          { type: 'escape', description: 'Cross the sea and escape the forest!' }
        ],
        fixedOrder: false,
        creatorId: 'map-uploader',
      };

      await saveLevel(level);
      setLevelId(id);
      setStatus('done');
    } catch (err) {
      console.error('Upload failed:', err);
      setStatus('error: ' + err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#1a1a2e',
      color: '#e0e0e0',
      fontFamily: 'monospace',
      padding: 40,
    }}>
      <h1 style={{ color: '#4caf50', marginBottom: 8 }}>Upload Forest Map</h1>
      <h2 style={{ color: '#81c784', fontWeight: 'normal', marginTop: 0 }}>
        "Forest Escape: Bear &amp; Sea"
      </h2>

      <div style={{
        background: '#16213e',
        borderRadius: 12,
        padding: 24,
        maxWidth: 520,
        lineHeight: 1.7,
        marginBottom: 24,
        border: '1px solid #334',
      }}>
        <p style={{ margin: '0 0 8px' }}>A green forest with a campfire at the center, surrounded by trees and an 8×8 rock-wall enclosure.</p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>One exit on the east wall leads to a large sea (10 tiles wide)</li>
          <li>Stepping-stone islands let you cross with a raft</li>
          <li>A bear guards the path near camp — a knife lies behind it</li>
          <li>Pick up the raft, cross the sea, reach the car to escape!</li>
        </ul>
      </div>

      <button
        onClick={handleUpload}
        disabled={status === 'uploading' || status === 'done'}
        style={{
          padding: '14px 36px',
          fontSize: 18,
          fontFamily: 'monospace',
          background: status === 'done' ? '#2e7d32' : '#4caf50',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: status === 'uploading' || status === 'done' ? 'default' : 'pointer',
          opacity: status === 'uploading' ? 0.7 : 1,
        }}
      >
        {status === 'uploading' ? 'Uploading...' : status === 'done' ? 'Uploaded!' : 'Upload Map to Firestore'}
      </button>

      {status === 'done' && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <p style={{ color: '#4caf50', fontSize: 18 }}>Map uploaded successfully!</p>
          <p style={{ color: '#aaa' }}>Level ID: <code style={{ color: '#fff' }}>{levelId}</code></p>
          <a
            href={`/play/${levelId}`}
            style={{ color: '#64b5f6', fontSize: 16 }}
          >
            Play it now
          </a>
        </div>
      )}

      {status.startsWith('error') && (
        <p style={{ color: '#ef5350', marginTop: 20 }}>{status}</p>
      )}

      <button
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: 32,
          padding: '8px 20px',
          background: 'transparent',
          color: '#888',
          border: '1px solid #444',
          borderRadius: 6,
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        Back to Menu
      </button>
    </div>
  );
}

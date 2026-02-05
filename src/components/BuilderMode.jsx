import { useState, useCallback, useRef, useContext, useMemo, useEffect } from 'react';
import Grid from './Grid';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import SolverMode from './SolverMode';
import { createEmptyGrid, placeTile, removeTile, cloneGrid } from '../engine/tiles';
import { saveLevel, generateId, loadLevels } from '../utils/storage';
import { DEFAULT_LIVES, DEFAULT_INVENTORY_CAPACITY, GRID_COLS, GRID_ROWS } from '../utils/constants';
import { ThemeContext } from '../App';
import { useUser } from '../contexts/UserContext.jsx';

// Default fallback
const DEFAULT_LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

// Check if a tile can be placed at position (for tiles with placement restrictions like camera)
function canPlaceTile(grid, x, y, tileType, TILE_TYPES) {
  const tileDef = TILE_TYPES[tileType];

  // If tile has attachToWall requirement, validate placement
  if (tileDef?.attachToWall) {
    // Check if on map boundary
    const isOnBoundary = x === 0 || x === GRID_COLS - 1 || y === 0 || y === GRID_ROWS - 1;
    if (isOnBoundary) return { valid: true };

    // Check if adjacent to a wall
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];

    const hasAdjacentWall = neighbors.some(n => {
      if (n.x < 0 || n.x >= GRID_COLS || n.y < 0 || n.y >= GRID_ROWS) return true; // Boundary counts as wall
      const neighborCell = grid[n.y][n.x];
      return neighborCell.type === 'wall' || neighborCell.type === 'empty';
    });

    if (hasAdjacentWall) return { valid: true };

    return {
      valid: false,
      message: `${tileDef.label} must be placed on a wall or map boundary!`
    };
  }

  return { valid: true };
}

export default function BuilderMode({ onBack, editLevel, themeId }) {
  const theme = useContext(ThemeContext);
  const { userId, displayName } = useUser();
  const lockTiles = useMemo(() => theme?.getLockTiles?.() || DEFAULT_LOCK_TILES, [theme]);
  const [grid, setGrid] = useState(() => {
    if (editLevel) {
      return editLevel.grid.map(r => r.map(c => ({ type: c.type, config: { ...c.config } })));
    }
    return createEmptyGrid();
  });
  const [selectedTool, setSelectedTool] = useState('floor');
  const [selectedFloorColor, setSelectedFloorColor] = useState('gray');
  const [selectedLockColor, setSelectedLockColor] = useState('red');
  const [selectedCell, setSelectedCell] = useState(null);
  const [showHazardZones, setShowHazardZones] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const [subMode, setSubMode] = useState('build');
  const [missions, setMissions] = useState(() => editLevel?.missions || []);
  const [lives, setLives] = useState(() => editLevel?.lives || DEFAULT_LIVES);
  const [inventoryCapacity, setInventoryCapacity] = useState(() => editLevel?.inventoryCapacity || DEFAULT_INVENTORY_CAPACITY);
  const [fixedOrder, setFixedOrder] = useState(() => editLevel?.fixedOrder || false);
  const [levelName, setLevelName] = useState(() => editLevel?.name || '');
  const [levelId, setLevelId] = useState(() => editLevel?.id || generateId());
  const [saved, setSaved] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [testMode, setTestMode] = useState(false);
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const [loadMenuLevels, setLoadMenuLevels] = useState([]);
  const [placementError, setPlacementError] = useState(null);
  const lastDragPos = useRef(null);
  const placementErrorTimer = useRef(null);

  const pushUndo = useCallback((currentGrid) => {
    setUndoStack(prev => [...prev.slice(-30), cloneGrid(currentGrid)]);
    setRedoStack([]);
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, cloneGrid(grid)]);
    setUndoStack(u => u.slice(0, -1));
    setGrid(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, cloneGrid(grid)]);
    setRedoStack(r => r.slice(0, -1));
    setGrid(next);
  };

  const showPlacementError = useCallback((message) => {
    setPlacementError(message);
    if (placementErrorTimer.current) clearTimeout(placementErrorTimer.current);
    placementErrorTimer.current = setTimeout(() => setPlacementError(null), 2000);
  }, []);

  const handleGridClick = (x, y, e) => {
    if (subMode === 'edit' || (e && e.shiftKey)) {
      setSelectedCell({ x, y });
      return;
    }

    const TILE_TYPES = theme?.getTileTypes() || {};

    // Validate placement for tiles with restrictions
    const placementCheck = canPlaceTile(grid, x, y, selectedTool, TILE_TYPES);
    if (!placementCheck.valid) {
      showPlacementError(placementCheck.message);
      return;
    }

    pushUndo(grid);
    let newGrid = placeTile(grid, x, y, selectedTool, TILE_TYPES);
    // Apply floor color if placing floor tile
    if (selectedTool === 'floor') {
      newGrid = cloneGrid(newGrid);
      newGrid[y][x].config = { ...newGrid[y][x].config, floorColor: selectedFloorColor };
    }
    // Apply lock color if placing door/key/card tile
    if (lockTiles.includes(selectedTool)) {
      newGrid = cloneGrid(newGrid);
      newGrid[y][x].config = { ...newGrid[y][x].config, lockColor: selectedLockColor };
    }
    setGrid(newGrid);
    setSelectedCell({ x, y });
    setSaved(false);
    lastDragPos.current = `${x},${y}`;
  };

  const handleGridDrag = (x, y) => {
    if (subMode === 'edit') return;
    const key = `${x},${y}`;
    if (lastDragPos.current === key) return;
    lastDragPos.current = key;
    const TILE_TYPES = theme?.getTileTypes() || {};

    // Validate placement for tiles with restrictions
    const placementCheck = canPlaceTile(grid, x, y, selectedTool, TILE_TYPES);
    if (!placementCheck.valid) {
      // Don't show error on drag to avoid spam, just skip placement
      return;
    }

    setGrid(prev => {
      let newGrid = placeTile(prev, x, y, selectedTool, TILE_TYPES);
      // Apply floor color if placing floor tile
      if (selectedTool === 'floor') {
        newGrid = cloneGrid(newGrid);
        newGrid[y][x].config = { ...newGrid[y][x].config, floorColor: selectedFloorColor };
      }
      // Apply lock color if placing door/key/card tile
      if (lockTiles.includes(selectedTool)) {
        newGrid = cloneGrid(newGrid);
        newGrid[y][x].config = { ...newGrid[y][x].config, lockColor: selectedLockColor };
      }
      return newGrid;
    });
    setSaved(false);
  };

  const handleGridRightClick = (x, y) => {
    if (subMode === 'edit') return;
    pushUndo(grid);
    setGrid(removeTile(grid, x, y));
    setSelectedCell(null);
    setSaved(false);
  };

  const handleConfigChange = (x, y, newConfig) => {
    const newGrid = cloneGrid(grid);
    newGrid[y][x].config = newConfig;
    setGrid(newGrid);
    setSaved(false);
  };

  const handleSave = () => {
    if (!levelName.trim()) {
      alert('Please enter a level name.');
      return;
    }

    // Determine creator - keep existing creator if editing, otherwise use current user
    const creatorId = editLevel?.creatorId || userId;
    const creatorName = editLevel?.creatorName || displayName;

    const level = {
      id: levelId,
      name: levelName.trim(),
      grid,
      missions,
      lives,
      inventoryCapacity,
      fixedOrder,
      themeId: themeId,
      createdAt: editLevel?.createdAt || Date.now(),
      updatedAt: Date.now(),
      creatorId,
      creatorName,
    };
    saveLevel(level)
      .then(() => {
        setSaved(true);
        console.log('Level saved successfully:', level.id, level.name);
      })
      .catch(err => {
        console.error('Failed to save level:', err);
        alert('Failed to save level. Check console for details.');
      });
  };

  const handleClear = () => {
    if (confirm('Clear the entire grid?')) {
      pushUndo(grid);
      setGrid(createEmptyGrid());
      setSaved(false);
    }
  };

  const handleTest = () => {
    // No mission check needed - SolverMode automatically adds the default escape mission
    setTestMode(true);
  };

  // R key to start testing
  useEffect(() => {
    const onKeyDown = (e) => {
      // Don't trigger if typing in an input
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleTest();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLoadLevel = (level) => {
    if (!saved && (grid.some(row => row.some(cell => cell.type !== 'empty')) || missions.length > 0)) {
      if (!confirm('Load this level? Current unsaved changes will be lost.')) {
        return;
      }
    }
    // Load all level data including ID
    setLevelId(level.id);
    setGrid(level.grid.map(r => r.map(c => ({ type: c.type, config: { ...c.config } }))));
    setMissions(level.missions || []);
    setLives(level.lives || DEFAULT_LIVES);
    setInventoryCapacity(level.inventoryCapacity || DEFAULT_INVENTORY_CAPACITY);
    setFixedOrder(level.fixedOrder || false);
    setLevelName(level.name || '');
    setSaved(true); // Level was just loaded from DB, so it's "saved"
    setUndoStack([]);
    setRedoStack([]);
    setLoadMenuOpen(false);
  };

  const barBtn = {
    padding: '10px 20px',
    background: 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#e8e8e8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(100, 100, 100, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  };
  const activeBarBtn = (active) => ({
    ...barBtn,
    background: active
      ? 'linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)'
      : 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)',
    color: active ? '#ffffff' : '#e8e8e8',
    boxShadow: active
      ? '0 4px 16px rgba(100, 100, 100, 0.3), 0 0 0 2px rgba(100, 100, 100, 0.4), inset 0 2px 0 rgba(255,255,255,0.15)'
      : '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(100, 100, 100, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
    transform: active ? 'translateY(-1px)' : 'translateY(0)',
  });

  // Test mode - render SolverMode
  if (testMode) {
    const testLevel = {
      id: levelId,
      name: levelName || 'Test Level',
      grid,
      missions,
      lives,
      inventoryCapacity,
      fixedOrder,
      themeId: themeId,
    };
    return (
      <div>
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
          <button onClick={() => setTestMode(false)} style={{ ...barBtn, background: 'linear-gradient(145deg, #4a4a3a 0%, #3a3a2a 100%)', padding: '10px 20px' }}>
            ← Exit Test
          </button>
        </div>
        <SolverMode level={testLevel} onBack={() => setTestMode(false)} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 50%, #0a0a0a 100%)',
      position: 'relative',
    }}>
      {/* Background pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(100, 150, 200, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(100, 150, 200, 0.02) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
        borderBottom: `2px solid ${theme?.primaryColor ? `${theme.primaryColor}40` : 'rgba(100, 150, 200, 0.3)'}`,
        flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
      }}>
        <button onClick={onBack} style={barBtn}>← Menu</button>
        <input
          value={levelName}
          onChange={e => setLevelName(e.target.value)}
          placeholder="Level name..."
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%)',
            border: 'none',
            borderRadius: 10,
            color: '#ffffff',
            fontSize: 14,
            width: 240,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(100, 100, 100, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.4)',
            outline: 'none',
            fontWeight: '500',
          }}
        />
        <button onClick={handleSave} style={{ ...barBtn, background: saved ? '#2a4a2a' : '#2a3a4a' }}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
        <button onClick={() => { setLoadMenuOpen(true); loadLevels().then(setLoadMenuLevels); }} style={{ ...barBtn, background: '#2a3a4a' }}>
          Load
        </button>

        <div style={{ display: 'flex', border: '1px solid #666', borderRadius: 4, overflow: 'hidden', marginLeft: 4 }}>
          <button onClick={() => setSubMode('build')} style={{ ...activeBarBtn(subMode === 'build'), borderRadius: 0, border: 'none', borderRight: '1px solid #666' }}>
            Build
          </button>
          <button onClick={() => setSubMode('edit')} style={{ ...activeBarBtn(subMode === 'edit'), borderRadius: 0, border: 'none' }}>
            Edit
          </button>
        </div>

        <button onClick={handleUndo} style={barBtn} disabled={undoStack.length === 0}>Undo</button>
        <button onClick={handleRedo} style={barBtn} disabled={redoStack.length === 0}>Redo</button>
        <button onClick={() => setShowHazardZones(!showHazardZones)} style={{ ...barBtn, background: showHazardZones ? 'linear-gradient(145deg, #4a4a3a 0%, #3a3a2a 100%)' : 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)' }}>
          {showHazardZones ? 'Zones ON' : 'Zones OFF'}
        </button>
        <button onClick={() => setShowTooltips(!showTooltips)} style={{ ...barBtn, background: showTooltips ? 'linear-gradient(145deg, #3a4a4a 0%, #2a3a3a 100%)' : 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)' }}>
          {showTooltips ? 'Tips ON' : 'Tips OFF'}
        </button>
        <button onClick={handleTest} style={{ ...barBtn, background: 'linear-gradient(145deg, #3a4a3a 0%, #2a3a2a 100%)' }}>▶ Test</button>
        <button onClick={handleClear} style={{ ...barBtn, background: 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)' }}>Clear</button>
        <span style={{
          color: theme?.primaryColor || '#aaaaaa',
          fontSize: 13,
          marginLeft: 'auto',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.3) 100%)',
          borderRadius: 10,
          border: `1px solid ${theme?.primaryColor ? `${theme.primaryColor}33` : 'rgba(100, 100, 100, 0.2)'}`,
          fontWeight: '500',
          fontFamily: 'monospace',
        }}>
          {theme?.emoji || '🎯'} {theme?.name || 'Theme'} • {subMode === 'build' ? '🎨 Build' : '✏️ Edit'} • {selectedTool}
        </span>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {subMode === 'build' && <Toolbar selected={selectedTool} onSelect={setSelectedTool} floorColor={selectedFloorColor} onFloorColorChange={setSelectedFloorColor} lockColor={selectedLockColor} onLockColorChange={setSelectedLockColor} />}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: 20, position: 'relative' }}>
          <Grid
            grid={grid}
            onClick={handleGridClick}
            onDrag={subMode === 'build' ? handleGridDrag : undefined}
            onRightClick={subMode === 'build' ? handleGridRightClick : undefined}
            showHazardZones={showHazardZones}
            showTooltips={showTooltips}
            theme={theme}
          />
          {/* Placement error message */}
          {placementError && (
            <div style={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, rgba(120, 40, 40, 0.95) 0%, rgba(80, 20, 20, 0.95) 100%)',
              color: '#ffaaaa',
              padding: '12px 24px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: '600',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(255, 100, 100, 0.4)',
              zIndex: 100,
            }}>
              ⚠️ {placementError}
            </div>
          )}
        </div>
        <PropertiesPanel
          grid={grid}
          selectedCell={selectedCell}
          onConfigChange={handleConfigChange}
          showHelp={showTooltips}
          missions={missions}
          onMissionsChange={m => { setMissions(m); setSaved(false); }}
          lives={lives}
          onLivesChange={l => { setLives(l); setSaved(false); }}
          fixedOrder={fixedOrder}
          onFixedOrderChange={f => { setFixedOrder(f); setSaved(false); }}
          inventoryCapacity={inventoryCapacity}
          onInventoryCapacityChange={c => { setInventoryCapacity(c); setSaved(false); }}
        />
      </div>

      {/* Load level menu */}
      {loadMenuOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            zIndex: 50,
          }}
          onClick={() => setLoadMenuOpen(false)}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
              border: `2px solid ${theme?.primaryColor ? `${theme.primaryColor}66` : 'rgba(100, 150, 200, 0.4)'}`,
              borderRadius: 20,
              padding: 40,
              minWidth: 500,
              maxWidth: 700,
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: `
                0 25px 80px rgba(0, 0, 0, 0.9),
                0 0 0 1px ${theme?.primaryColor ? `${theme.primaryColor}33` : 'rgba(100, 150, 200, 0.2)'},
                inset 0 2px 0 rgba(255, 255, 255, 0.08)
              `,
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: theme?.primaryColor || '#aaddff',
              margin: '0 0 28px 0',
              fontSize: 28,
              fontWeight: '800',
              textShadow: `
                0 0 20px ${theme?.primaryColor ? `${theme.primaryColor}80` : 'rgba(170, 221, 255, 0.5)'},
                0 4px 12px rgba(0, 0, 0, 0.8)
              `,
              letterSpacing: 1,
            }}>
              {theme?.emoji || '📂'} Load {theme?.name || 'Level'}
            </h2>
            {(() => {
              const levels = loadMenuLevels;
              if (levels.length === 0) {
                return (
                  <div style={{ color: '#888', fontSize: 14, padding: 20, textAlign: 'center' }}>
                    No saved levels found
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {levels.map(level => (
                    <div
                      key={level.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        background: 'linear-gradient(145deg, rgba(40, 40, 40, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)',
                        borderRadius: 12,
                        border: 'none',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(100, 100, 100, 0.2)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.5), 0 0 0 2px ${theme?.primaryColor ? `${theme.primaryColor}66` : 'rgba(100, 150, 200, 0.4)'}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(100, 100, 100, 0.2)';
                      }}
                    >
                      <div>
                        <div style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{level.name || 'Unnamed Level'}</div>
                        <div style={{ color: '#aaaaaa', fontSize: 12, fontFamily: 'monospace' }}>
                          {level.missions?.length || 0} missions • {level.lives || 3} lives • {new Date(level.updatedAt || level.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadLevel(level)}
                        style={{
                          ...barBtn,
                          background: 'linear-gradient(145deg, #3a4a4a 0%, #2a3a3a 100%)',
                          padding: '8px 16px',
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'linear-gradient(145deg, #4a5a5a 0%, #3a4a4a 100%)'}
                        onMouseLeave={(e) => e.target.style.background = 'linear-gradient(145deg, #3a4a4a 0%, #2a3a3a 100%)'}
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
            <button
              onClick={() => setLoadMenuOpen(false)}
              style={{ ...barBtn, marginTop: 16, width: '100%', padding: '10px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

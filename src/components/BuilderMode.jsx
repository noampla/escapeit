import { useState, useCallback, useRef } from 'react';
import Grid from './Grid';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import MissionEditor from './MissionEditor';
import SolverMode from './SolverMode';
import { createEmptyGrid, placeTile, removeTile, cloneGrid } from '../engine/tiles';
import { saveLevel, generateId, loadLevels } from '../utils/storage';
import { DEFAULT_LIVES, DEFAULT_INVENTORY_CAPACITY } from '../utils/constants';

export default function BuilderMode({ onBack, editLevel }) {
  const [grid, setGrid] = useState(() => {
    if (editLevel) {
      return editLevel.grid.map(r => r.map(c => ({ type: c.type, config: { ...c.config } })));
    }
    return createEmptyGrid();
  });
  const [selectedTool, setSelectedTool] = useState('tree');
  const [selectedCell, setSelectedCell] = useState(null);
  const [showHazardZones, setShowHazardZones] = useState(false);
  const [showTooltips, setShowTooltips] = useState(true);
  const [subMode, setSubMode] = useState('build');
  const [missions, setMissions] = useState(() => editLevel?.missions || []);
  const [lives, setLives] = useState(() => editLevel?.lives || DEFAULT_LIVES);
  const [inventoryCapacity, setInventoryCapacity] = useState(() => editLevel?.inventoryCapacity || DEFAULT_INVENTORY_CAPACITY);
  const [fixedOrder, setFixedOrder] = useState(() => editLevel?.fixedOrder || false);
  const [levelName, setLevelName] = useState(() => editLevel?.name || '');
  const [levelId] = useState(() => editLevel?.id || generateId());
  const [saved, setSaved] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [testMode, setTestMode] = useState(false);
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const lastDragPos = useRef(null);

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

  const handleGridClick = (x, y, e) => {
    if (subMode === 'edit' || (e && e.shiftKey)) {
      setSelectedCell({ x, y });
      return;
    }
    pushUndo(grid);
    const newGrid = placeTile(grid, x, y, selectedTool);
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
    setGrid(prev => placeTile(prev, x, y, selectedTool));
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
    const level = {
      id: levelId,
      name: levelName.trim(),
      grid,
      missions,
      lives,
      inventoryCapacity,
      fixedOrder,
      createdAt: editLevel?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    saveLevel(level);
    setSaved(true);
  };

  const handleClear = () => {
    if (confirm('Clear the entire grid?')) {
      pushUndo(grid);
      setGrid(createEmptyGrid());
      setSaved(false);
    }
  };

  const handleTest = () => {
    if (!missions || missions.length === 0) {
      alert('Add at least one mission before testing.');
      return;
    }
    setTestMode(true);
  };

  const handleLoadLevel = (level) => {
    if (!saved && (grid.some(row => row.some(cell => cell.type !== 'empty')) || missions.length > 0)) {
      if (!confirm('Load this level? Current unsaved changes will be lost.')) {
        return;
      }
    }
    // Load all level data
    setGrid(level.grid.map(r => r.map(c => ({ type: c.type, config: { ...c.config } }))));
    setMissions(level.missions || []);
    setLives(level.lives || DEFAULT_LIVES);
    setInventoryCapacity(level.inventoryCapacity || DEFAULT_INVENTORY_CAPACITY);
    setFixedOrder(level.fixedOrder || false);
    setLevelName(level.name || '');
    setSaved(false);
    setUndoStack([]);
    setRedoStack([]);
    setLoadMenuOpen(false);
  };

  const barBtn = {
    padding: '10px 20px',
    background: 'linear-gradient(145deg, #2a5a2a 0%, #1a4a1a 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#c8e6c8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(68, 170, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  };
  const activeBarBtn = (active) => ({
    ...barBtn,
    background: active
      ? 'linear-gradient(145deg, #3a7a3a 0%, #2a5a2a 100%)'
      : 'linear-gradient(145deg, #2a5a2a 0%, #1a4a1a 100%)',
    color: active ? '#ffffff' : '#c8e6c8',
    boxShadow: active
      ? '0 4px 16px rgba(102, 170, 102, 0.3), 0 0 0 2px rgba(68, 170, 68, 0.4), inset 0 2px 0 rgba(255,255,255,0.15)'
      : '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(68, 170, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
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
    };
    return (
      <div>
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
          <button onClick={() => setTestMode(false)} style={{ ...barBtn, background: '#4a3a2a', padding: '10px 20px' }}>
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
      background: 'linear-gradient(135deg, #0a1f0a 0%, #071507 25%, #0a1a0a 50%, #050f05 100%)',
      position: 'relative',
    }}>
      {/* Background pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(68, 170, 68, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(68, 170, 68, 0.02) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        background: 'linear-gradient(180deg, rgba(20, 40, 20, 0.95) 0%, rgba(15, 30, 15, 0.95) 100%)',
        borderBottom: '2px solid rgba(68, 170, 68, 0.3)',
        flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
      }}>
        <button onClick={onBack} style={barBtn}>← Menu</button>
        <input
          value={levelName}
          onChange={e => setLevelName(e.target.value)}
          placeholder="Forest name..."
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(20, 35, 20, 0.9) 0%, rgba(15, 25, 15, 0.9) 100%)',
            border: 'none',
            borderRadius: 10,
            color: '#ffffff',
            fontSize: 14,
            width: 240,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(68, 170, 68, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.4)',
            outline: 'none',
            fontWeight: '500',
          }}
        />
        <button onClick={handleSave} style={{ ...barBtn, background: saved ? '#2a4a2a' : '#2a3a4a' }}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
        <button onClick={() => setLoadMenuOpen(true)} style={{ ...barBtn, background: '#2a3a4a' }}>
          Load
        </button>

        <div style={{ display: 'flex', border: '1px solid #446644', borderRadius: 4, overflow: 'hidden', marginLeft: 4 }}>
          <button onClick={() => setSubMode('build')} style={{ ...activeBarBtn(subMode === 'build'), borderRadius: 0, border: 'none', borderRight: '1px solid #446644' }}>
            Build
          </button>
          <button onClick={() => setSubMode('edit')} style={{ ...activeBarBtn(subMode === 'edit'), borderRadius: 0, border: 'none' }}>
            Edit
          </button>
        </div>

        <button onClick={handleUndo} style={barBtn} disabled={undoStack.length === 0}>Undo</button>
        <button onClick={handleRedo} style={barBtn} disabled={redoStack.length === 0}>Redo</button>
        <button onClick={() => setShowHazardZones(!showHazardZones)} style={{ ...barBtn, background: showHazardZones ? '#4a3a2a' : '#2a3a2a' }}>
          {showHazardZones ? 'Zones ON' : 'Zones OFF'}
        </button>
        <button onClick={() => setShowTooltips(!showTooltips)} style={{ ...barBtn, background: showTooltips ? '#2a4a4a' : '#2a3a2a' }}>
          {showTooltips ? 'Tips ON' : 'Tips OFF'}
        </button>
        <button onClick={handleTest} style={{ ...barBtn, background: '#2a4a3a' }}>▶ Test</button>
        <button onClick={handleClear} style={{ ...barBtn, background: '#4a2a2a' }}>Clear</button>
        <span style={{
          color: '#a8f0a8',
          fontSize: 13,
          marginLeft: 'auto',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(10, 20, 10, 0.3) 100%)',
          borderRadius: 10,
          border: '1px solid rgba(68, 170, 68, 0.2)',
          fontWeight: '500',
          fontFamily: 'monospace',
        }}>
          {subMode === 'build' ? '🎨 Build Mode' : '✏️ Edit Mode'} • Tool: {selectedTool}
        </span>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {subMode === 'build' && <Toolbar selected={selectedTool} onSelect={setSelectedTool} />}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: 20 }}>
          <Grid
            grid={grid}
            onClick={handleGridClick}
            onDrag={subMode === 'build' ? handleGridDrag : undefined}
            onRightClick={subMode === 'build' ? handleGridRightClick : undefined}
            showHazardZones={showHazardZones}
            showTooltips={showTooltips}
          />
        </div>
        <PropertiesPanel
          grid={grid}
          selectedCell={selectedCell}
          onConfigChange={handleConfigChange}
          showHelp={showTooltips}
        />
      </div>

      {/* Mission editor */}
      <MissionEditor
        missions={missions}
        onChange={m => { setMissions(m); setSaved(false); }}
        lives={lives}
        onLivesChange={l => { setLives(l); setSaved(false); }}
        fixedOrder={fixedOrder}
        onFixedOrderChange={f => { setFixedOrder(f); setSaved(false); }}
        inventoryCapacity={inventoryCapacity}
        onInventoryCapacityChange={c => { setInventoryCapacity(c); setSaved(false); }}
      />

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
              background: 'linear-gradient(160deg, rgba(20, 40, 20, 0.98) 0%, rgba(10, 25, 10, 0.98) 100%)',
              border: '2px solid rgba(68, 170, 68, 0.4)',
              borderRadius: 20,
              padding: 40,
              minWidth: 500,
              maxWidth: 700,
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: `
                0 25px 80px rgba(0, 0, 0, 0.9),
                0 0 0 1px rgba(68, 170, 68, 0.2),
                inset 0 2px 0 rgba(255, 255, 255, 0.08)
              `,
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: '#a8f0a8',
              margin: '0 0 28px 0',
              fontSize: 28,
              fontWeight: '800',
              textShadow: `
                0 0 20px rgba(136, 221, 136, 0.5),
                0 4px 12px rgba(0, 0, 0, 0.8)
              `,
              letterSpacing: 1,
            }}>
              🌲 Load Forest Level
            </h2>
            {(() => {
              const levels = loadLevels();
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
                        background: 'linear-gradient(145deg, rgba(30, 55, 30, 0.6) 0%, rgba(20, 40, 20, 0.6) 100%)',
                        borderRadius: 12,
                        border: 'none',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(68, 170, 68, 0.2)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(68, 170, 68, 0.25), 0 0 0 2px rgba(68, 170, 68, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(68, 170, 68, 0.2)';
                      }}
                    >
                      <div>
                        <div style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{level.name || 'Unnamed Level'}</div>
                        <div style={{ color: '#99bb99', fontSize: 12, fontFamily: 'monospace' }}>
                          {level.missions?.length || 0} missions • {level.lives || 3} lives • {new Date(level.updatedAt || level.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadLevel(level)}
                        style={{
                          ...barBtn,
                          background: '#2a4a3a',
                          padding: '8px 16px',
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#3a5a4a'}
                        onMouseLeave={(e) => e.target.style.background = '#2a4a3a'}
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

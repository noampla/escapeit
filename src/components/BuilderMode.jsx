import { useState, useCallback, useRef } from 'react';
import Grid from './Grid';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import MissionEditor from './MissionEditor';
import { createEmptyGrid, placeTile, removeTile, cloneGrid } from '../engine/tiles';
import { saveLevel, generateId } from '../utils/storage';
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

  const barBtn = { padding: '6px 12px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 4, color: '#ccc', cursor: 'pointer', fontSize: 12 };
  const activeBarBtn = (active) => ({ ...barBtn, background: active ? '#3a5a3a' : '#2a3a2a', border: active ? '1px solid #66aa66' : '1px solid #446644' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a1a0a' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#162a16', borderBottom: '2px solid #335533', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={barBtn}>← Menu</button>
        <input
          value={levelName}
          onChange={e => setLevelName(e.target.value)}
          placeholder="Forest name..."
          style={{ padding: '5px 10px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 4, color: '#ddd', fontSize: 13, width: 200 }}
        />
        <button onClick={handleSave} style={{ ...barBtn, background: saved ? '#2a4a2a' : '#2a3a4a' }}>
          {saved ? '✓ Saved' : 'Save'}
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
        <button onClick={handleClear} style={{ ...barBtn, background: '#4a2a2a' }}>Clear</button>
        <span style={{ color: '#446644', fontSize: 11, marginLeft: 'auto' }}>
          {subMode === 'build' ? 'Build (click+drag to paint, Shift+click to edit)' : 'Edit (click to select)'} | Tool: {selectedTool}
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
    </div>
  );
}

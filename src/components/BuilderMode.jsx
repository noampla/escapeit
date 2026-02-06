import { useState, useCallback, useRef, useContext, useMemo, useEffect } from 'react';
import Grid from './Grid';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import SolverMode from './SolverMode';
import { createEmptyGrid, placeTile, removeTile, cloneGrid } from '../engine/tiles';
import { saveLevel, generateId, loadLevels } from '../utils/storage';
import { DEFAULT_LIVES, DEFAULT_INVENTORY_CAPACITY, TILE_SIZE } from '../utils/constants';
import { ThemeContext } from '../App';
import { useUser } from '../contexts/UserContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';

// Default fallback
const DEFAULT_LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

// Check if a tile can be placed at position (for tiles with placement restrictions like camera)
function canPlaceTile(grid, x, y, tileType, TILE_TYPES) {
  const tileDef = TILE_TYPES[tileType];
  const gridRows = grid.length;
  const gridCols = grid[0].length;

  // If tile has attachToWall requirement, validate placement
  if (tileDef?.attachToWall) {
    // Check if on map boundary
    const isOnBoundary = x === 0 || x === gridCols - 1 || y === 0 || y === gridRows - 1;
    if (isOnBoundary) return { valid: true };

    // Check if adjacent to a wall
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];

    const hasAdjacentWall = neighbors.some(n => {
      if (n.x < 0 || n.x >= gridCols || n.y < 0 || n.y >= gridRows) return true; // Boundary counts as wall
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
  const { t, isRTL, language, setLanguage, getTileLabel, getLocalizedThemeName } = useLanguage();
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

  // Viewport state for infinite grid - center starts at middle of grid
  const [viewportCenter, setViewportCenter] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  const gridContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Measure container size to fill available space
  // Re-run when returning from test mode
  useEffect(() => {
    if (testMode) return; // Don't measure when in test mode
    const container = gridContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width - 40, height: rect.height - 40 }); // padding
    };

    // Small delay to ensure container is rendered
    const timer = setTimeout(updateSize, 50);
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [testMode]);

  // Calculate viewport bounds to fill container
  const viewportBounds = useMemo(() => {
    const tilesX = Math.max(10, Math.floor(containerSize.width / TILE_SIZE));
    const tilesY = Math.max(8, Math.floor(containerSize.height / TILE_SIZE));
    const halfX = Math.floor(tilesX / 2);
    const halfY = Math.floor(tilesY / 2);

    const minX = Math.max(0, viewportCenter.x - halfX);
    const minY = Math.max(0, viewportCenter.y - halfY);
    const maxX = Math.min(grid[0].length - 1, viewportCenter.x + halfX);
    const maxY = Math.min(grid.length - 1, viewportCenter.y + halfY);

    return { minX, minY, maxX, maxY };
  }, [viewportCenter, grid, containerSize]);

  // Check if we can pan in each direction
  const canPanLeft = viewportBounds.minX > 0;
  const canPanRight = viewportBounds.maxX < grid[0].length - 1;
  const canPanUp = viewportBounds.minY > 0;
  const canPanDown = viewportBounds.maxY < grid.length - 1;

  // Pan viewport with arrow keys (when not typing) or middle mouse drag
  const handlePan = useCallback((dx, dy) => {
    setViewportCenter(prev => ({
      x: Math.max(10, Math.min(grid[0].length - 10, prev.x + dx)),
      y: Math.max(8, Math.min(grid.length - 8, prev.y + dy))
    }));
  }, [grid]);

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
      alert(t('builder.enterLevelName'));
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
        alert(t('builder.saveFailed'));
      });
  };

  const handleClear = () => {
    if (confirm(t('builder.confirmClear'))) {
      pushUndo(grid);
      setGrid(createEmptyGrid());
      setSaved(false);
    }
  };

  const handleTest = () => {
    // No mission check needed - SolverMode automatically adds the default escape mission
    setTestMode(true);
  };

  // Keyboard shortcuts: R to test, Arrow keys to pan viewport
  useEffect(() => {
    const onKeyDown = (e) => {
      // Don't trigger if typing in an input
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleTest();
      }

      // Arrow keys to pan viewport
      const panAmount = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePan(-panAmount, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handlePan(panAmount, 0); }
      if (e.key === 'ArrowUp') { e.preventDefault(); handlePan(0, -panAmount); }
      if (e.key === 'ArrowDown') { e.preventDefault(); handlePan(0, panAmount); }
    };

    // Scroll wheel to pan: scroll = up/down, shift+scroll = left/right
    // Only when scrolling over the canvas (grid area)
    const onWheel = (e) => {
      // Only handle if scrolling over the canvas element
      if (e.target?.tagName?.toLowerCase() !== 'canvas') return;

      e.preventDefault();
      const delta = Math.sign(e.deltaY) * 3; // 3 tiles per scroll tick

      if (e.shiftKey) {
        handlePan(delta, 0); // Shift+scroll = left/right
      } else {
        handlePan(0, delta); // Scroll = up/down
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel);
    };
  }, [handlePan]);

  const handleLoadLevel = (level) => {
    if (!saved && (grid.some(row => row.some(cell => cell.type !== 'empty')) || missions.length > 0)) {
      if (!confirm(t('builder.loadConfirm'))) {
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
        <div style={{ position: 'absolute', top: 10, left: isRTL ? 'auto' : 10, right: isRTL ? 10 : 'auto', zIndex: 100 }}>
          <button onClick={() => setTestMode(false)} style={{ ...barBtn, background: 'linear-gradient(145deg, #4a4a3a 0%, #3a3a2a 100%)', padding: '10px 20px' }}>
            {isRTL ? `${t('builder.exitTest')} →` : `← ${t('builder.exitTest')}`}
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
        <button onClick={onBack} style={barBtn}>{isRTL ? `${t('builder.menu')} →` : `← ${t('builder.menu')}`}</button>
        <input
          value={levelName}
          onChange={e => setLevelName(e.target.value)}
          placeholder={t('builder.levelName')}
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
          {saved ? `✓ ${t('builder.saved')}` : t('builder.save')}
        </button>
        <button onClick={() => { setLoadMenuOpen(true); loadLevels().then(setLoadMenuLevels); }} style={{ ...barBtn, background: '#2a3a4a' }}>
          {t('builder.load')}
        </button>

        <div style={{ display: 'flex', border: '1px solid #666', borderRadius: 4, overflow: 'hidden', marginLeft: 4 }}>
          <button onClick={() => setSubMode('build')} style={{ ...activeBarBtn(subMode === 'build'), borderRadius: 0, border: 'none', borderRight: '1px solid #666' }}>
            {t('builder.build')}
          </button>
          <button onClick={() => setSubMode('edit')} style={{ ...activeBarBtn(subMode === 'edit'), borderRadius: 0, border: 'none' }}>
            {t('builder.edit')}
          </button>
        </div>

        <button onClick={handleUndo} style={barBtn} disabled={undoStack.length === 0}>{t('builder.undo')}</button>
        <button onClick={handleRedo} style={barBtn} disabled={redoStack.length === 0}>{t('builder.redo')}</button>
        <button onClick={() => setShowHazardZones(!showHazardZones)} style={{ ...barBtn, background: showHazardZones ? 'linear-gradient(145deg, #4a4a3a 0%, #3a3a2a 100%)' : 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)' }}>
          {showHazardZones ? t('builder.zonesOn') : t('builder.zonesOff')}
        </button>
        <button onClick={() => setShowTooltips(!showTooltips)} style={{ ...barBtn, background: showTooltips ? 'linear-gradient(145deg, #3a4a4a 0%, #2a3a3a 100%)' : 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)' }}>
          {showTooltips ? t('builder.tipsOn') : t('builder.tipsOff')}
        </button>
        <button onClick={handleTest} style={{ ...barBtn, background: 'linear-gradient(145deg, #3a4a3a 0%, #2a3a2a 100%)' }}>▶ {t('builder.test')}</button>
        <button onClick={handleClear} style={{ ...barBtn, background: 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)' }}>{t('builder.clear')}</button>
        <button
          onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
          style={{ ...barBtn, background: 'linear-gradient(145deg, #3a3a4a 0%, #2a2a3a 100%)', fontWeight: '600' }}
          title={t('settings.language')}
        >
          {language === 'en' ? '🇺🇸 EN' : '🇮🇱 עב'}
        </button>
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
          {theme?.emoji || '🎯'} {getLocalizedThemeName(themeId, theme?.name || 'Theme')} • {subMode === 'build' ? `🎨 ${t('builder.statusBuild')}` : `✏️ ${t('builder.statusEdit')}`} • {getTileLabel(themeId, selectedTool, selectedTool)} • {t('builder.panHint')}
        </span>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {subMode === 'build' && <Toolbar selected={selectedTool} onSelect={setSelectedTool} floorColor={selectedFloorColor} onFloorColorChange={setSelectedFloorColor} lockColor={selectedLockColor} onLockColorChange={setSelectedLockColor} />}
        <div ref={gridContainerRef} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: 20, position: 'relative' }}>
          {/* Pan arrows */}
          {canPanUp && (
            <div
              onClick={() => handlePan(0, -5)}
              style={{
                position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', zIndex: 10,
                padding: '4px 20px', userSelect: 'none',
              }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >▲</div>
          )}
          {canPanDown && (
            <div
              onClick={() => handlePan(0, 5)}
              style={{
                position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', zIndex: 10,
                padding: '4px 20px', userSelect: 'none',
              }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >▼</div>
          )}
          {canPanLeft && (
            <div
              onClick={() => handlePan(-5, 0)}
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', zIndex: 10,
                padding: '20px 4px', userSelect: 'none',
              }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >◀</div>
          )}
          {canPanRight && (
            <div
              onClick={() => handlePan(5, 0)}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', zIndex: 10,
                padding: '20px 4px', userSelect: 'none',
              }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >▶</div>
          )}
          <Grid
            grid={grid}
            onClick={handleGridClick}
            onDrag={subMode === 'build' ? handleGridDrag : undefined}
            onRightClick={subMode === 'build' ? handleGridRightClick : undefined}
            showHazardZones={showHazardZones}
            showTooltips={showTooltips}
            theme={theme}
            viewportBounds={viewportBounds}
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
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              {theme?.emoji || '📂'} {t('builder.loadTitle', { theme: getLocalizedThemeName(themeId, theme?.name || 'Level') })}
            </h2>
            {(() => {
              const levels = loadMenuLevels;
              if (levels.length === 0) {
                return (
                  <div style={{ color: '#888', fontSize: 14, padding: 20, textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
                    {t('builder.noLevels')}
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
                        <div style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{level.name || t('builder.unnamedLevel')}</div>
                        <div style={{ color: '#aaaaaa', fontSize: 12, fontFamily: 'monospace', direction: isRTL ? 'rtl' : 'ltr' }}>
                          {t('builder.levelInfo', { missions: level.missions?.length || 0, lives: level.lives || 3, date: new Date(level.updatedAt || level.createdAt).toLocaleDateString() })}
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
                        {t('builder.load')}
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
              {t('builder.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

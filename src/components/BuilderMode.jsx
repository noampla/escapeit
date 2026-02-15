import { useState, useCallback, useRef, useContext, useMemo, useEffect } from 'react';
import Grid from './Grid';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import SolverMode from './SolverMode';
import TilePreview from './TilePreview';
import RandomMapGeneratorPanel from './RandomMapGeneratorPanel';
import { createEmptyGrid, placeTile, removeTile, cloneGrid, validateObjectPlacement } from '../engine/tiles';
import { saveLevel, generateId, loadLevelsByCreator } from '../utils/storage';
import { saveDraft, loadDraft, clearDraft, getDraftInfo, hasDraft } from '../utils/draftStorage';
import { generateMap, getMapInfo } from '../engine/mapGenerator';
import { DEFAULT_LIVES, DEFAULT_INVENTORY_CAPACITY, TILE_SIZE } from '../utils/constants';
import { ThemeContext } from '../App';
import { useUser } from '../contexts/UserContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import StoryModal from './StoryModal';
import CanvasEditorModal from './CanvasEditorModal';

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
      // Check both floor and object layers for walls/empty
      return neighborCell.floor?.type === 'wall' || neighborCell.floor?.type === 'empty' ||
             neighborCell.object?.type === 'wall' || neighborCell.object?.type === 'empty';
    });

    if (hasAdjacentWall) return { valid: true };

    return {
      valid: false,
      message: `${tileDef.label} must be placed on a wall or map boundary!`
    };
  }

  return { valid: true };
}

// Clean up objects with attachToWall that are no longer on walls/boundaries
function cleanupInvalidObjects(grid, TILE_TYPES) {
  const gridRows = grid.length;
  const gridCols = grid[0].length;
  let modified = false;

  for (let y = 0; y < gridRows; y++) {
    for (let x = 0; x < gridCols; x++) {
      const cell = grid[y][x];
      if (!cell.object) continue;

      const objectDef = TILE_TYPES[cell.object.type];
      if (!objectDef?.attachToWall) continue;

      // Check if this object is still valid
      const validation = canPlaceTile(grid, x, y, cell.object.type, TILE_TYPES);
      if (!validation.valid) {
        // Remove invalid object
        cell.object = null;
        modified = true;
      }
    }
  }

  return modified;
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
  // Default to the first basic floor tile from the theme, or 'ground' for forest
  const getDefaultTool = useCallback(() => {
    const TILE_TYPES = theme?.getTileTypes() || {};
    // Find the first walkable floor tile in the 'basic' category
    const basicFloorTile = Object.keys(TILE_TYPES).find(key => {
      const tile = TILE_TYPES[key];
      return tile.category === 'basic' && tile.layer === 'floor' && tile.walkable === true;
    });
    return basicFloorTile || 'ground'; // Fallback to 'ground'
  }, [theme]);

  const [selectedTool, setSelectedTool] = useState(() => getDefaultTool());
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
  const [toolbarTooltip, setToolbarTooltip] = useState(null);
  const lastDragPos = useRef(null);
  const placementErrorTimer = useRef(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [previewTileType, setPreviewTileType] = useState(null);
  const [enablePreview, setEnablePreview] = useState(true);
  const [showRandomGenerator, setShowRandomGenerator] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateSeed, setGenerateSeed] = useState('');

  // Path editing state
  const [pathEditMode, setPathEditMode] = useState(null); // { x, y, fieldKey } when editing path
  const [pathTiles, setPathTiles] = useState([]); // Current path being edited

  // Canvas editing state (for drawing tiles)
  const [canvasEditMode, setCanvasEditMode] = useState(null); // { x, y, fieldKey, fieldDef, initialData }

  // Activation position picking state
  const [activationPickMode, setActivationPickMode] = useState(null); // { tileX, tileY, fieldKey, reqIndex }

  // Draft restore prompt state
  const [showDraftPrompt, setShowDraftPrompt] = useState(() => {
    // Check for existing draft on initial render (only for new levels)
    if (editLevel) return false;
    return hasDraft(themeId);
  });
  const [draftInfo, setDraftInfo] = useState(() => {
    // Load draft info on initial render (only for new levels)
    if (editLevel) return null;
    return getDraftInfo(themeId);
  });
  const draftSaveTimerRef = useRef(null);

  // Collect all tile paths from the grid for display (theme-agnostic)
  // Looks for any tile that has a 'path' type field in its CONFIG_SCHEMA
  const allTilePaths = useMemo(() => {
    const paths = [];
    const CONFIG_SCHEMA = theme?.getConfigSchema?.() || {};

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        // Check both object and floor layers
        for (const layer of [cell.object, cell.floor]) {
          if (!layer?.type || !layer.config) continue;

          // Check if this tile type has any 'path' fields in its config schema
          const schema = CONFIG_SCHEMA[layer.type];
          if (!schema) continue;

          for (const [fieldKey, fieldDef] of Object.entries(schema)) {
            if (fieldDef.type === 'path' && layer.config[fieldKey]?.length > 0) {
              paths.push({
                sourceX: x,
                sourceY: y,
                tiles: layer.config[fieldKey]
              });
            }
          }
        }
      }
    }
    return paths;
  }, [grid, theme]);

  // Check if theme has story content
  const storyContent = useMemo(() => theme?.getStoryContent?.(), [theme]);
  const hasStory = useMemo(() => theme?.hasStoryContent?.() || false, [theme]);

  // Compute activation markers for ALL tiles with activation requirements
  // Markers for the selected tile are shown at full opacity, others at reduced opacity
  const activationMarkers = useMemo(() => {
    const markers = [];
    const selectedKey = selectedCell ? `${selectedCell.x},${selectedCell.y}` : null;

    // Iterate all cells to find tiles with activation requirements
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        const config = cell.object?.config || cell.floor?.config;
        const activationReqs = config?.activationRequirements;

        if (!activationReqs?.enabled || !activationReqs.requirements?.length) continue;

        const tileKey = `${x},${y}`;
        const isSelected = tileKey === selectedKey;

        activationReqs.requirements.forEach((req, idx) => {
          markers.push({
            x: req.x,
            y: req.y,
            index: idx + 1,
            itemId: req.itemId,
            showNumbers: activationReqs.orderMatters,
            isSelected, // true for selected tile's markers (full opacity)
            sourceTile: { x, y } // which tile this marker belongs to
          });
        });
      }
    }

    return markers;
  }, [selectedCell, grid]);

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

  // Auto-save draft when builder state changes (debounced)
  useEffect(() => {
    // Don't auto-save if we're showing the draft prompt (user hasn't decided yet)
    if (showDraftPrompt) return;

    // Clear any existing timer
    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    // Debounce the save - wait 1 second after last change
    draftSaveTimerRef.current = setTimeout(() => {
      // Only save if there's actual content (not just empty grid)
      const hasContent = grid.some(row => row.some(cell =>
        cell.floor?.type !== 'empty' || cell.object
      ));

      if (hasContent || missions.length > 0 || levelName.trim()) {
        saveDraft(themeId, {
          grid,
          missions,
          lives,
          inventoryCapacity,
          fixedOrder,
          levelName,
          levelId,
        });
      }
    }, 1000);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [grid, missions, lives, inventoryCapacity, fixedOrder, levelName, themeId, showDraftPrompt]);

  // Handle restoring draft
  const handleRestoreDraft = useCallback(() => {
    const draft = loadDraft(themeId);
    if (draft) {
      if (draft.grid) setGrid(draft.grid);
      if (draft.missions) setMissions(draft.missions);
      if (draft.lives) setLives(draft.lives);
      if (draft.inventoryCapacity) setInventoryCapacity(draft.inventoryCapacity);
      if (draft.fixedOrder !== undefined) setFixedOrder(draft.fixedOrder);
      if (draft.levelName) setLevelName(draft.levelName);
      if (draft.levelId) setLevelId(draft.levelId);
      setSaved(false);
    }
    setShowDraftPrompt(false);
    setDraftInfo(null);
  }, [themeId]);

  // Handle discarding draft
  const handleDiscardDraft = useCallback(() => {
    clearDraft(themeId);
    setShowDraftPrompt(false);
    setDraftInfo(null);
  }, [themeId]);

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
    // Handle path editing mode
    if (pathEditMode) {
      handlePathTileClick(x, y);
      return;
    }

    // Handle activation position picking mode
    if (activationPickMode) {
      handleActivationPickClick(x, y);
      return;
    }

    if (subMode === 'edit' || (e && e.shiftKey)) {
      setSelectedCell({ x, y });
      return;
    }

    const TILE_TYPES = theme?.getTileTypes() || {};
    const tileDef = TILE_TYPES[selectedTool];
    const layer = tileDef?.layer || 'floor';

    // Validate object placement on floor
    if (layer === 'object') {
      const cell = grid[y][x];
      const validation = validateObjectPlacement(cell, selectedTool, TILE_TYPES);
      if (!validation.valid) {
        showPlacementError(validation.message);
        return;
      }
    }

    // Validate placement for tiles with restrictions (like camera attachToWall)
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
      newGrid[y][x].floor.config = { ...newGrid[y][x].floor.config, floorColor: selectedFloorColor };
    }
    // Apply lock color if placing door/key/card tile
    if (lockTiles.includes(selectedTool)) {
      newGrid = cloneGrid(newGrid);
      // Lock color goes on object layer for doors/items
      if (layer === 'object' && newGrid[y][x].object) {
        newGrid[y][x].object.config = { ...newGrid[y][x].object.config, lockColor: selectedLockColor };
      }
    }
    // Clean up objects with attachToWall that are no longer valid
    cleanupInvalidObjects(newGrid, TILE_TYPES);
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
    const tileDef = TILE_TYPES[selectedTool];
    const layer = tileDef?.layer || 'floor';

    // Validate object placement on floor
    if (layer === 'object') {
      const cell = grid[y][x];
      const validation = validateObjectPlacement(cell, selectedTool, TILE_TYPES);
      if (!validation.valid) {
        // Don't show error on drag to avoid spam, just skip placement
        return;
      }
    }

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
        newGrid[y][x].floor.config = { ...newGrid[y][x].floor.config, floorColor: selectedFloorColor };
      }
      // Apply lock color if placing door/key/card tile
      if (lockTiles.includes(selectedTool)) {
        newGrid = cloneGrid(newGrid);
        // Lock color goes on object layer for doors/items
        if (layer === 'object' && newGrid[y][x].object) {
          newGrid[y][x].object.config = { ...newGrid[y][x].object.config, lockColor: selectedLockColor };
        }
      }
      // Clean up objects with attachToWall that are no longer valid
      cleanupInvalidObjects(newGrid, TILE_TYPES);
      return newGrid;
    });
    setSaved(false);
  };

  const handleGridRightClick = (x, y) => {
    if (subMode === 'edit') return;
    pushUndo(grid);
    const TILE_TYPES = theme?.getTileTypes() || {};
    const newGrid = removeTile(grid, x, y);
    // Clean up objects with attachToWall that are no longer valid
    cleanupInvalidObjects(newGrid, TILE_TYPES);
    setGrid(newGrid);
    setSelectedCell(null);
    setSaved(false);
    lastDragPos.current = `${x},${y}`;
  };

  const handleGridRightDrag = (x, y) => {
    if (subMode === 'edit') return;
    const key = `${x},${y}`;
    if (lastDragPos.current === key) return;
    lastDragPos.current = key;

    const TILE_TYPES = theme?.getTileTypes() || {};
    setGrid(prev => {
      const newGrid = removeTile(prev, x, y);
      // Clean up objects with attachToWall that are no longer valid
      cleanupInvalidObjects(newGrid, TILE_TYPES);
      return newGrid;
    });
    setSaved(false);
  };

  const handleConfigChange = (x, y, newConfig) => {
    const newGrid = cloneGrid(grid);
    const cell = newGrid[y][x];

    // Update config on the appropriate layer (object takes priority over floor)
    if (cell.object) {
      cell.object.config = newConfig;
    } else if (cell.floor) {
      cell.floor.config = newConfig;
    }

    setGrid(newGrid);
    setSaved(false);
  };

  // Start path editing mode
  const handleStartPathEdit = (x, y, fieldKey) => {
    const cell = grid[y][x];
    const config = cell.object?.config || cell.floor?.config || {};
    const currentPath = config[fieldKey] || [];

    setPathEditMode({ x, y, fieldKey });
    setPathTiles([...currentPath]);
  };

  // Handle clicking on grid tiles while in path edit mode
  const handlePathTileClick = (tileX, tileY) => {
    if (!pathEditMode) return false;

    // Check if tile already in path
    const existingIndex = pathTiles.findIndex(t => t.x === tileX && t.y === tileY);

    if (existingIndex !== -1) {
      // Remove tile and all tiles after it
      setPathTiles(pathTiles.slice(0, existingIndex));
    } else {
      // Add tile to path
      // Validate that tile is connected to the last tile (if path not empty)
      if (pathTiles.length > 0) {
        const lastTile = pathTiles[pathTiles.length - 1];
        const isAdjacent =
          (Math.abs(tileX - lastTile.x) === 1 && tileY === lastTile.y) ||
          (Math.abs(tileY - lastTile.y) === 1 && tileX === lastTile.x);

        if (!isAdjacent) {
          setPlacementError('Path tiles must be connected (up/down/left/right)!');
          if (placementErrorTimer.current) clearTimeout(placementErrorTimer.current);
          placementErrorTimer.current = setTimeout(() => setPlacementError(null), 2000);
          return true; // Handled, but invalid
        }
      }

      setPathTiles([...pathTiles, { x: tileX, y: tileY }]);
    }

    return true; // Event handled
  };

  // Save path and exit path edit mode
  const handleSavePathEdit = () => {
    if (!pathEditMode) return;

    const { x, y, fieldKey } = pathEditMode;
    const newGrid = cloneGrid(grid);
    const cell = newGrid[y][x];

    // Update config with new path
    const config = cell.object?.config || cell.floor?.config || {};
    const newConfig = { ...config, [fieldKey]: pathTiles };

    if (cell.object) {
      cell.object.config = newConfig;
    } else if (cell.floor) {
      cell.floor.config = newConfig;
    }

    setGrid(newGrid);
    setSaved(false);
    setPathEditMode(null);
    setPathTiles([]);
  };

  // Cancel path editing
  const handleCancelPathEdit = () => {
    setPathEditMode(null);
    setPathTiles([]);
  };

  // Start canvas editing mode (for drawing tiles)
  const handleStartCanvasEdit = (x, y, fieldKey, fieldDef) => {
    const cell = grid[y][x];
    const config = cell.object?.config || cell.floor?.config || {};
    const currentData = config[fieldKey] || null;

    setCanvasEditMode({ x, y, fieldKey, fieldDef, initialData: currentData });
  };

  // Save canvas edit
  const handleSaveCanvasEdit = (imageData) => {
    if (!canvasEditMode) return;

    const { x, y, fieldKey } = canvasEditMode;

    // Function to update the grid
    const updateGrid = () => {
      const newGrid = cloneGrid(grid);
      const cell = newGrid[y][x];
      const config = cell.object?.config || cell.floor?.config || {};

      const newConfig = { ...config, [fieldKey]: imageData };

      if (cell.object) {
        cell.object.config = newConfig;
      } else if (cell.floor) {
        cell.floor.config = newConfig;
      }

      setGrid(newGrid);
      setSaved(false);
      setCanvasEditMode(null);
    };

    // If there's image data, preload it before updating to ensure render shows it
    if (imageData) {
      const img = new Image();
      img.onload = () => {
        updateGrid();
      };
      img.onerror = () => {
        updateGrid(); // Still update even if image fails
      };
      img.src = imageData;
    } else {
      updateGrid();
    }
  };

  // Start activation position picking mode
  const handleStartActivationPick = (tileX, tileY, fieldKey, reqIndex) => {
    setActivationPickMode({ tileX, tileY, fieldKey, reqIndex });
  };

  // Handle clicking on grid tiles while in activation pick mode
  const handleActivationPickClick = (clickX, clickY) => {
    if (!activationPickMode) return false;

    const { tileX, tileY, fieldKey, reqIndex } = activationPickMode;
    const cell = grid[tileY][tileX];
    const config = cell.object?.config || cell.floor?.config || {};
    const activationData = config[fieldKey] || { enabled: false, orderMatters: false, requirements: [] };

    // Update the requirement with the new position
    const updatedRequirements = activationData.requirements.map((req, i) =>
      i === reqIndex ? { ...req, x: clickX, y: clickY } : req
    );

    const newActivationData = { ...activationData, requirements: updatedRequirements };

    // Update the grid
    const newGrid = cloneGrid(grid);
    const newCell = newGrid[tileY][tileX];
    if (newCell.object) {
      newCell.object.config = { ...newCell.object.config, [fieldKey]: newActivationData };
    } else if (newCell.floor) {
      newCell.floor.config = { ...newCell.floor.config, [fieldKey]: newActivationData };
    }

    setGrid(newGrid);
    setSaved(false);
    setActivationPickMode(null);

    return true; // Event handled
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
        clearDraft(themeId); // Clear draft after successful save
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

  const handleGenerate = (useSeed) => {
    const hasContent = grid.some(row => row.some(cell => cell.floor?.type !== 'empty' || cell.object));
    if (hasContent && !confirm(t('builder.confirmGenerate') || 'This will replace the current map. Continue?')) {
      return;
    }
    pushUndo(grid);
    const seed = useSeed && generateSeed.trim() ? parseInt(generateSeed.trim(), 36) || Date.now() : Date.now();
    const newGrid = generateMap({ seed, theme });
    setGrid(newGrid);
    setSaved(false);
    setShowGenerateModal(false);
    setGenerateSeed('');
    // Center viewport on the generated map area (offset 10,10 + half of 25x20)
    setViewportCenter({ x: 22, y: 20 });
  };

  const handleTest = () => {
    // No mission check needed - SolverMode automatically adds the default escape mission
    setTestMode(true);
  };

  const handleGenerateRandom = (newGrid, newMissions) => {
    pushUndo(grid);

    // Debug: Check cells specifically for floorColor
    console.log('Received grid from generator, checking cells for floorColor:');
    let foundColored = 0;
    for (let y = 40; y < 60 && foundColored < 5; y++) {
      for (let x = 40; x < 60 && foundColored < 5; x++) {
        const cell = newGrid[y][x];
        if (cell.floor?.config?.floorColor) {
          console.log(`Cell [${y}][${x}] has floorColor:`, cell.floor.config.floorColor, cell);
          foundColored++;
        }
      }
    }
    if (foundColored === 0) {
      console.error('NO CELLS WITH floorColor FOUND! Checking random cells:');
      for (let i = 0; i < 5; i++) {
        const y = 45 + i;
        const x = 45 + i;
        console.log(`Cell [${y}][${x}]:`, newGrid[y][x]);
      }
    }

    setGrid(newGrid);
    setMissions(newMissions);
    setSaved(false);
    setShowRandomGenerator(false);
  };

  // Ensure selectedTool is valid for the current theme
  useEffect(() => {
    const TILE_TYPES = theme?.getTileTypes() || {};
    // Check if current selected tool exists in the theme
    if (!TILE_TYPES[selectedTool]) {
      // Reset to default tool for this theme
      const defaultTool = getDefaultTool();
      setSelectedTool(defaultTool);
    }
  }, [theme, selectedTool, getDefaultTool]);

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
    if (!saved && (grid.some(row => row.some(cell => cell.floor?.type !== 'empty' || cell.object)) || missions.length > 0)) {
      if (!confirm(t('builder.loadConfirm'))) {
        return;
      }
    }
    // Load all level data including ID
    setLevelId(level.id);
    // Use the grid as-is (already in correct format with floor/object layers from storage.js migration)
    setGrid(level.grid);
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
        <button onClick={() => {
          setLoadMenuOpen(true);
          loadLevelsByCreator(userId).then(levels => {
            // Filter levels to only show those matching current theme
            const filteredLevels = levels.filter(level => level.themeId === themeId);
            setLoadMenuLevels(filteredLevels);
          });
        }} style={{ ...barBtn, background: '#2a3a4a' }}>
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
        <button onClick={() => setEnablePreview(!enablePreview)} style={{ ...barBtn, background: enablePreview ? 'linear-gradient(145deg, #4a3a4a 0%, #3a2a3a 100%)' : 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)' }} title="Toggle tile preview on hover">
          {enablePreview ? '🔍 Preview' : '🔍 Off'}
        </button>
        <button onClick={() => setShowRandomGenerator(true)} style={{ ...barBtn, background: 'linear-gradient(145deg, #4a3a5a 0%, #3a2a4a 100%)' }}>🎲 {t('builder.randomGen') || 'Random'}</button>
        <button onClick={handleTest} style={{ ...barBtn, background: 'linear-gradient(145deg, #3a4a3a 0%, #2a3a2a 100%)' }}>▶ {t('builder.test')}</button>
        <button onClick={() => setShowGenerateModal(true)} style={{ ...barBtn, background: 'linear-gradient(145deg, #3a3a5a 0%, #2a2a4a 100%)' }}>🎲 Generate</button>
        <button onClick={handleClear} style={{ ...barBtn, background: 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)' }}>{t('builder.clear')}</button>
        {hasStory && (
          <button
            onClick={() => setShowStoryModal(true)}
            style={{ ...barBtn, background: 'linear-gradient(145deg, #2a3a4a 0%, #1a2a3a 100%)' }}
            title="Help & Tutorial"
          >
            📖 Help
          </button>
        )}
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

      {/* Path edit mode banner */}
      {pathEditMode && (
        <div style={{
          background: 'linear-gradient(135deg, #3a4a5a 0%, #2a3a4a 100%)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '2px solid #4a5a6a',
          color: '#ddd'
        }}>
          <span style={{ fontSize: 14, fontWeight: '600' }}>
            🛤️ Path Edit Mode - Click tiles to build path ({pathTiles.length} tiles)
          </span>
          <button
            onClick={handleSavePathEdit}
            style={{
              padding: '6px 16px',
              background: 'linear-gradient(135deg, #3a5a3a 0%, #2a4a2a 100%)',
              color: '#fff',
              border: '1px solid #4a6a4a',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ✓ Save Path
          </button>
          <button
            onClick={handleCancelPathEdit}
            style={{
              padding: '6px 16px',
              background: 'linear-gradient(135deg, #5a3a3a 0%, #4a2a2a 100%)',
              color: '#fff',
              border: '1px solid #6a4a4a',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {subMode === 'build' && !pathEditMode && <Toolbar selected={selectedTool} onSelect={setSelectedTool} floorColor={selectedFloorColor} onFloorColorChange={setSelectedFloorColor} lockColor={selectedLockColor} onLockColorChange={setSelectedLockColor} onTooltipChange={setToolbarTooltip} onTilePreview={enablePreview ? setPreviewTileType : undefined} />}
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
            onDrag={subMode === 'build' && !pathEditMode ? handleGridDrag : undefined}
            onRightClick={subMode === 'build' && !pathEditMode ? handleGridRightClick : undefined}
            onRightDrag={subMode === 'build' && !pathEditMode ? handleGridRightDrag : undefined}
            showHazardZones={showHazardZones}
            showTooltips={showTooltips}
            theme={theme}
            viewportBounds={viewportBounds}
            pathTiles={pathEditMode ? pathTiles : undefined}
            allTilePaths={allTilePaths}
            activationMarkers={activationMarkers}
            activationPickMode={activationPickMode}
            isBuilder
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
          onStartPathEdit={handleStartPathEdit}
          onStartCanvasEdit={handleStartCanvasEdit}
          onStartActivationPick={handleStartActivationPick}
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

      {/* Draft Restore Prompt */}
      {showDraftPrompt && draftInfo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, rgba(30, 40, 50, 0.98) 0%, rgba(20, 30, 40, 0.98) 100%)',
              border: `2px solid ${theme?.primaryColor ? `${theme.primaryColor}66` : 'rgba(100, 180, 255, 0.4)'}`,
              borderRadius: 20,
              padding: 40,
              minWidth: 450,
              maxWidth: 550,
              boxShadow: `
                0 25px 80px rgba(0, 0, 0, 0.9),
                0 0 0 1px ${theme?.primaryColor ? `${theme.primaryColor}33` : 'rgba(100, 180, 255, 0.2)'},
                inset 0 2px 0 rgba(255, 255, 255, 0.08)
              `,
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {theme?.emoji || '💾'}
            </div>
            <h2 style={{
              color: theme?.primaryColor || '#88ccff',
              margin: '0 0 16px 0',
              fontSize: 24,
              fontWeight: '800',
              textShadow: `0 0 20px ${theme?.primaryColor ? `${theme.primaryColor}80` : 'rgba(136, 204, 255, 0.5)'}`,
            }}>
              {t('builder.draftFound') || 'Unsaved Work Found'}
            </h2>
            <p style={{
              color: '#bbccdd',
              fontSize: 15,
              marginBottom: 8,
              lineHeight: 1.5,
            }}>
              {t('builder.draftDescription') || 'You have unsaved work from a previous session.'}
            </p>
            <p style={{
              color: '#8899aa',
              fontSize: 13,
              marginBottom: 24,
            }}>
              {draftInfo.levelName && draftInfo.levelName !== 'Untitled' && (
                <span style={{ color: '#aabbcc', fontWeight: '600' }}>"{draftInfo.levelName}" - </span>
              )}
              {t('builder.draftSavedAt') || 'Last saved'}: {new Date(draftInfo.savedAt).toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={handleRestoreDraft}
                style={{
                  padding: '14px 28px',
                  background: `linear-gradient(145deg, ${theme?.primaryColor || '#3a6a9a'} 0%, ${theme?.primaryColor ? theme.primaryColor + 'cc' : '#2a5a8a'} 100%)`,
                  border: 'none',
                  borderRadius: 10,
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: `0 4px 16px ${theme?.primaryColor ? `${theme.primaryColor}66` : 'rgba(58, 106, 154, 0.4)'}`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {t('builder.restoreDraft') || 'Restore Draft'}
              </button>
              <button
                onClick={handleDiscardDraft}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#cccccc',
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {t('builder.discardDraft') || 'Start Fresh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Map Modal */}
      {showGenerateModal && (
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
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%)',
              border: '2px solid rgba(100, 100, 200, 0.4)',
              borderRadius: 20,
              padding: 40,
              minWidth: 400,
              maxWidth: 500,
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), inset 0 2px 0 rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: '#aabbff',
              margin: '0 0 20px 0',
              fontSize: 24,
              fontWeight: '800',
              textShadow: '0 0 20px rgba(170, 187, 255, 0.5)',
            }}>
              🎲 Generate Random Map
            </h2>
            <p style={{ color: '#aaa', fontSize: 14, marginBottom: 20 }}>
              Generate a dungeon-style layout with rooms and corridors.
              You can optionally enter a seed to reproduce the same map later.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#ccc', fontSize: 13, display: 'block', marginBottom: 8 }}>
                Seed (optional):
              </label>
              <input
                value={generateSeed}
                onChange={e => setGenerateSeed(e.target.value.toUpperCase())}
                placeholder="Leave empty for random"
                style={{
                  padding: '10px 16px',
                  background: 'rgba(30, 30, 40, 0.9)',
                  border: '1px solid rgba(100, 100, 150, 0.3)',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontSize: 14,
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => handleGenerate(true)}
                style={{
                  ...barBtn,
                  flex: 1,
                  background: 'linear-gradient(145deg, #3a4a5a 0%, #2a3a4a 100%)',
                  padding: '12px 20px',
                }}
              >
                🎲 Generate
              </button>
              <button
                onClick={() => setShowGenerateModal(false)}
                style={{
                  ...barBtn,
                  flex: 1,
                  padding: '12px 20px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar Tooltip */}
      {toolbarTooltip && (
        <div style={{
          position: 'fixed',
          left: toolbarTooltip.x,
          top: toolbarTooltip.y,
          background: 'linear-gradient(145deg, rgba(20, 30, 20, 0.98) 0%, rgba(10, 20, 10, 0.98) 100%)',
          color: '#e8f8e8',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 12,
          maxWidth: 250,
          zIndex: 10001,
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(68, 170, 68, 0.3)',
          fontWeight: '500',
          backdropFilter: 'blur(8px)',
        }}>
          {toolbarTooltip.text}
        </div>
      )}

      {/* Story/Tutorial Modal */}
      {hasStory && (
        <StoryModal
          storyContent={storyContent}
          onClose={() => setShowStoryModal(false)}
          showOnFirstLoad={showStoryModal}
        />
      )}

      {/* Tile Preview on Hover */}
      {enablePreview && previewTileType && (
        <TilePreview
          tileType={previewTileType}
          theme={theme}
          lockColor={selectedLockColor}
        />
      )}

      {/* Random Map Generator */}
      {showRandomGenerator && (
        <RandomMapGeneratorPanel
          onGenerate={handleGenerateRandom}
          onClose={() => setShowRandomGenerator(false)}
        />
      )}

      {/* Canvas Editor Modal (for drawing tiles) */}
      {canvasEditMode && (
        <CanvasEditorModal
          width={canvasEditMode.fieldDef?.width || 16}
          height={canvasEditMode.fieldDef?.height || 16}
          initialData={canvasEditMode.initialData}
          onSave={handleSaveCanvasEdit}
          onCancel={() => setCanvasEditMode(null)}
        />
      )}
    </div>
  );
}

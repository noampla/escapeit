import { useContext, useMemo, useState, useRef, useCallback } from 'react';
import { ThemeContext } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { BASE_MISSION_TYPES, DEFAULT_INVENTORY_CAPACITY } from '../utils/constants';
import { PLAYER_REQUIREMENT_ID } from '../engine/activationSystem.js';

// Max dimension for uploaded images (keeps data URL size reasonable for Firestore)
const MAX_IMAGE_DIM = 128;

const HelpText = ({ type, field, show, CONFIG_HELP }) => {
  if (!show) return null;
  const help = CONFIG_HELP?.[type]?.[field];
  if (!help) return null;
  return <p style={{ color: '#888', fontSize: 10, margin: '2px 0 0', lineHeight: 1.3 }}>{help}</p>;
};

// Shared styles
const panelBg = '#1e1e1e';
const borderColor = '#3a3a3a';
const inputStyle = { width: '100%', padding: '6px 8px', background: '#2a2a2a', border: '1px solid #444', borderRadius: 4, color: '#ddd', fontSize: 12, boxSizing: 'border-box' };
const labelStyle = { color: '#aaa', fontSize: 11, display: 'block', marginBottom: 4, marginTop: 10 };
const sectionStyle = { padding: 12, borderBottom: `1px solid ${borderColor}` };
const headerStyle = { color: '#ccc', fontSize: 13, fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 };

export default function PropertiesPanel({
  grid, selectedCell, onConfigChange, showHelp = true,
  // Mission props
  missions = [], onMissionsChange, lives, onLivesChange, fixedOrder, onFixedOrderChange,
  inventoryCapacity, onInventoryCapacityChange,
  // Path editing
  onStartPathEdit,
  // Canvas editing (for drawing tiles)
  onStartCanvasEdit,
  // Activation position picking
  onStartActivationPick
}) {
  const theme = useContext(ThemeContext);
  const { t, isRTL, getTileLabel } = useLanguage();
  const themeId = theme?.themeId || 'forest';
  const TILE_TYPES = theme?.getTileTypes() || {};
  const CONFIG_HELP = theme?.getConfigHelp() || {};
  const CONFIG_SCHEMA = theme?.getConfigSchema?.() || {};
  const primaryColor = theme?.primaryColor || '#6688aa';
  const fileInputRef = useRef(null);
  const pendingUploadCallback = useRef(null);

  // Handle image upload: resize to fit MAX_IMAGE_DIM and convert to data URL
  const handleImageUpload = useCallback((file, onResult) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize to fit within MAX_IMAGE_DIM while keeping aspect ratio
        let w = img.width, h = img.height;
        if (w > MAX_IMAGE_DIM || h > MAX_IMAGE_DIM) {
          const scale = MAX_IMAGE_DIM / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/png');
        onResult(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const triggerUpload = useCallback((callback) => {
    pendingUploadCallback.current = callback;
    fileInputRef.current?.click();
  }, []);

  // Collect all available item IDs from the grid (for activation requirements)
  const availableItemIds = useMemo(() => {
    const ids = new Set();
    const addItemIds = (obj) => {
      if (!obj?.type?.startsWith('item-')) return;
      const imageId = obj.config?.imageId;
      if (imageId) ids.add(imageId);
      const typeSuffix = obj.type.replace('item-', '');
      if (typeSuffix && typeSuffix !== 'drawing-board') ids.add(typeSuffix);
    };
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        addItemIds(cell.object);
        // Also check hidden (buried) objects
        if (cell.floor?.config?.hiddenObject) {
          addItemIds(cell.floor.config.hiddenObject);
        }
      }
    }
    return Array.from(ids).sort();
  }, [grid]);

  // Get options for a select field from theme
  const getSelectOptions = (optionsKey) => {
    return theme?.getConfigOptions?.(optionsKey) || {};
  };

  // Mission editor helpers
  const missionTypes = useMemo(() => {
    const themeMissionIds = theme?.getMissionTypes?.();
    if (themeMissionIds && themeMissionIds.length > 0) {
      // Filter BASE_MISSION_TYPES and apply theme-specific labels
      return BASE_MISSION_TYPES
        .filter(mt => themeMissionIds.includes(mt.id))
        .map(mt => {
          const themeConfig = theme?.getMissionConfig?.(mt.id);
          return themeConfig?.label ? { ...mt, label: themeConfig.label } : mt;
        });
    }
    return BASE_MISSION_TYPES;
  }, [theme]);

  const getTargetOptions = (missionType) => theme?.getMissionTargetOptions?.(missionType) || [];
  const missionDef = (type) => missionTypes.find(mt => mt.id === type) || BASE_MISSION_TYPES.find(mt => mt.id === type);

  // Get amount config for a mission type from theme
  const getAmountConfig = (missionType) => {
    const themeConfig = theme?.getMissionConfig?.(missionType);
    return {
      min: themeConfig?.min ?? 1,
      max: themeConfig?.max ?? 1000000,
      step: themeConfig?.step ?? 1,
      default: themeConfig?.default ?? 100,
      label: themeConfig?.amountLabel ?? 'Amount',
    };
  };

  const addMission = () => {
    const defaultType = missionTypes.find(mt => mt.id === 'escape')?.id || missionTypes[0]?.id || 'escape';
    onMissionsChange?.([...missions, { type: defaultType, targetId: '', description: '' }]);
  };

  const removeMission = (idx) => onMissionsChange?.(missions.filter((_, i) => i !== idx));

  const updateMission = (idx, field, value) => {
    const updated = missions.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    onMissionsChange?.(updated);
  };

  // Drag and drop state for mission reordering
  const [draggedMission, setDraggedMission] = useState(null);
  const [dragOverMission, setDragOverMission] = useState(null);

  const handleDragStart = (e, idx) => {
    setDraggedMission(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedMission !== null && draggedMission !== idx) {
      setDragOverMission(idx);
    }
  };

  const handleDragLeave = () => {
    setDragOverMission(null);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (draggedMission !== null && draggedMission !== idx) {
      const reordered = [...missions];
      const [moved] = reordered.splice(draggedMission, 1);
      reordered.splice(idx, 0, moved);
      onMissionsChange?.(reordered);
    }
    setDraggedMission(null);
    setDragOverMission(null);
  };

  const handleDragEnd = () => {
    setDraggedMission(null);
    setDragOverMission(null);
  };

  // Build properties section content
  const renderPropertiesContent = () => {
    if (!selectedCell) {
      return (
        <p style={{ color: '#666', fontSize: 12, margin: 0, direction: isRTL ? 'rtl' : 'ltr' }}>{t('properties.clickToConfig')}</p>
      );
    }

    const { x, y } = selectedCell;
    const cell = grid[y][x];

    // Determine which layer to show (prioritize object over floor)
    const tileType = cell.object ? cell.object.type : cell.floor?.type;
    const config = cell.object ? cell.object.config : cell.floor?.config;
    const def = TILE_TYPES[tileType];

    // Check for hidden (buried) object beneath floor
    const hiddenObj = cell.floor?.config?.hiddenObject;
    const hiddenType = hiddenObj?.type;
    const hiddenDef = hiddenType ? TILE_TYPES[hiddenType] : null;
    const hiddenSchema = hiddenType ? CONFIG_SCHEMA[hiddenType] : null;
    const hiddenFields = hiddenSchema ? Object.entries(hiddenSchema) : [];
    const hiddenConfig = hiddenObj?.config || {};
    const hasEditableHidden = hiddenObj && hiddenDef && hiddenFields.length > 0;

    const updateHidden = (key, value) => {
      onConfigChange(x, y, { ...hiddenConfig, [key]: value }, 'hidden');
    };

    // Render a hidden object's config field
    const renderHiddenField = (fieldKey, fieldDef, isFirst) => {
      const currentValue = hiddenConfig[fieldKey];
      const baseLabel = { ...labelStyle, marginTop: isFirst ? 0 : 10 };

      switch (fieldDef.type) {
        case 'checkbox':
          return (
            <div key={fieldKey}>
              <label style={{ ...baseLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={currentValue !== undefined ? currentValue : fieldDef.default} onChange={e => updateHidden(fieldKey, e.target.checked)} />
                {fieldDef.label}
              </label>
            </div>
          );
        case 'text':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <input style={inputStyle} value={currentValue || fieldDef.default || ''} onChange={e => updateHidden(fieldKey, e.target.value)} placeholder={fieldDef.placeholder || ''} />
            </div>
          );
        case 'number':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <input type="number" style={{ ...inputStyle, width: 80 }} min={fieldDef.min} max={fieldDef.max} value={currentValue !== undefined ? currentValue : fieldDef.default} onChange={e => updateHidden(fieldKey, Number(e.target.value))} />
            </div>
          );
        case 'select': {
          const options = getSelectOptions(fieldDef.options);
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <select style={inputStyle} value={currentValue || fieldDef.default} onChange={e => updateHidden(fieldKey, e.target.value)}>
                {Object.entries(options).map(([optId, optDef]) => (
                  <option key={optId} value={optId}>{optDef.label}</option>
                ))}
              </select>
            </div>
          );
        }
        case 'textarea':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={currentValue || fieldDef.default || ''} onChange={e => updateHidden(fieldKey, e.target.value)} placeholder={fieldDef.placeholder || ''} />
            </div>
          );
        case 'canvas':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              {currentValue && (
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <img
                    src={currentValue}
                    alt="Drawing preview"
                    style={{
                      width: 96,
                      height: 96,
                      objectFit: 'contain',
                      imageRendering: (fieldDef.width || 16) <= 32 ? 'pixelated' : 'auto',
                      border: '1px solid #444',
                      borderRadius: 4
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ flex: 1, padding: '6px 8px', background: '#2a3a4a', border: '1px solid #444', borderRadius: 4, color: '#ccc', fontSize: 10, cursor: 'pointer' }}
                  onClick={() => onStartCanvasEdit?.(x, y, fieldKey, fieldDef, 'hidden')}
                >
                  {currentValue ? 'Edit Drawing' : 'Draw'}
                </button>
                <button
                  style={{ flex: 1, padding: '6px 8px', background: '#3a3a2a', border: '1px solid #444', borderRadius: 4, color: '#ccc', fontSize: 10, cursor: 'pointer' }}
                  onClick={() => triggerUpload((dataUrl) => updateHidden(fieldKey, dataUrl))}
                >
                  Upload Image
                </button>
              </div>
              {currentValue && (
                <button
                  style={{ marginTop: 4, width: '100%', padding: '4px 8px', background: '#3a2a2a', border: '1px solid #444', borderRadius: 4, color: '#999', fontSize: 9, cursor: 'pointer' }}
                  onClick={() => updateHidden(fieldKey, null)}
                >
                  Clear
                </button>
              )}
            </div>
          );
        default:
          return null;
      }
    };

    // Helper to render the buried object section
    const renderHiddenSection = (withTopMargin) => {
      if (!hasEditableHidden) return null;
      return (
        <div style={{ marginTop: withTopMargin ? 16 : 8, paddingTop: withTopMargin ? 12 : 8, borderTop: '1px dashed #554433' }}>
          <p style={{ color: '#bb8844', fontSize: 11, margin: '0 0 8px', fontWeight: 600 }}>
            Buried: {getTileLabel(themeId, hiddenType, hiddenDef.label)}
          </p>
          {hiddenFields.map(([fieldKey, fieldDef], idx) => renderHiddenField(fieldKey, fieldDef, idx === 0))}
        </div>
      );
    };

    if (!def || !def.configurable) {
      return (
        <>
          <p style={{ color: '#888', fontSize: 12, margin: '0 0 4px', direction: isRTL ? 'rtl' : 'ltr' }}>{t('properties.tileAt', { label: getTileLabel(themeId, tileType, def?.label || tileType), x, y })}</p>
          {hasEditableHidden ? renderHiddenSection(false) : (
            <p style={{ color: '#666', fontSize: 11, margin: 0, direction: isRTL ? 'rtl' : 'ltr' }}>{t('properties.notConfigurable')}</p>
          )}
        </>
      );
    }

    const update = (key, value) => onConfigChange(x, y, { ...config, [key]: value });

    // Get schema for this tile type
    const schema = CONFIG_SCHEMA[tileType];
    const schemaFields = schema ? Object.entries(schema) : [];

    // Render a field based on its schema definition
    const renderField = (fieldKey, fieldDef, isFirst) => {
      const currentValue = config[fieldKey];
      const baseLabel = { ...labelStyle, marginTop: isFirst ? 0 : 10 };

      switch (fieldDef.type) {
        case 'checkbox':
          return (
            <div key={fieldKey}>
              <label style={{ ...baseLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={currentValue !== undefined ? currentValue : fieldDef.default}
                  onChange={e => update(fieldKey, e.target.checked)}
                />
                {fieldDef.label}
              </label>
              <HelpText type={tileType} field={fieldKey} show={showHelp} CONFIG_HELP={CONFIG_HELP} />
            </div>
          );

        case 'text':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <input
                style={inputStyle}
                value={currentValue || fieldDef.default || ''}
                onChange={e => update(fieldKey, e.target.value)}
                placeholder={fieldDef.placeholder || ''}
              />
              <HelpText type={tileType} field={fieldKey} show={showHelp} CONFIG_HELP={CONFIG_HELP} />
            </div>
          );

        case 'number':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <input
                type="number"
                style={{ ...inputStyle, width: 80 }}
                min={fieldDef.min}
                max={fieldDef.max}
                value={currentValue !== undefined ? currentValue : fieldDef.default}
                onChange={e => update(fieldKey, Number(e.target.value))}
              />
              <HelpText type={tileType} field={fieldKey} show={showHelp} CONFIG_HELP={CONFIG_HELP} />
            </div>
          );

        case 'select': {
          const options = getSelectOptions(fieldDef.options);
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <select
                style={inputStyle}
                value={currentValue || fieldDef.default}
                onChange={e => update(fieldKey, e.target.value)}
              >
                {Object.entries(options).map(([optId, optDef]) => (
                  <option key={optId} value={optId}>{optDef.label}</option>
                ))}
              </select>
              <HelpText type={tileType} field={fieldKey} show={showHelp} CONFIG_HELP={CONFIG_HELP} />
            </div>
          );
        }

        case 'textarea':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <textarea
                style={{
                  ...inputStyle,
                  minHeight: 80,
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                value={currentValue || fieldDef.default || ''}
                onChange={e => update(fieldKey, e.target.value)}
                placeholder={fieldDef.placeholder || ''}
              />
              <HelpText type={tileType} field={fieldKey} show={showHelp} CONFIG_HELP={CONFIG_HELP} />
            </div>
          );

        case 'path':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <div
                style={{
                  ...inputStyle,
                  background: '#1a1a1a',
                  minHeight: 60,
                  padding: 8,
                  borderRadius: 4,
                  color: '#aaa',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (onStartPathEdit) {
                    onStartPathEdit(x, y, fieldKey);
                  }
                }}
              >
                <p style={{ margin: '0 0 6px', color: '#bbb' }}>
                  {(currentValue && currentValue.length > 0)
                    ? `${currentValue.length} tiles in path. Click to edit.`
                    : 'Click to create path on map'}
                </p>
                {currentValue && currentValue.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {currentValue.map((tile, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#444',
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontSize: 10,
                          color: '#ddd'
                        }}
                      >
                        {idx + 1}: ({tile.x},{tile.y})
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <HelpText type={tileType} field={fieldKey} show={showHelp} CONFIG_HELP={CONFIG_HELP} />
            </div>
          );

        case 'canvas':
          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              {currentValue && (
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <img
                    src={currentValue}
                    alt="Drawing preview"
                    style={{
                      width: 96,
                      height: 96,
                      objectFit: 'contain',
                      imageRendering: (fieldDef.width || 16) <= 32 ? 'pixelated' : 'auto',
                      border: '1px solid #444',
                      borderRadius: 4
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ flex: 1, padding: '6px 8px', background: '#2a3a4a', border: '1px solid #444', borderRadius: 4, color: '#ccc', fontSize: 10, cursor: 'pointer' }}
                  onClick={() => onStartCanvasEdit?.(x, y, fieldKey, fieldDef)}
                >
                  {currentValue ? 'Edit Drawing' : 'Draw'}
                </button>
                <button
                  style={{ flex: 1, padding: '6px 8px', background: '#3a3a2a', border: '1px solid #444', borderRadius: 4, color: '#ccc', fontSize: 10, cursor: 'pointer' }}
                  onClick={() => triggerUpload((dataUrl) => update(fieldKey, dataUrl))}
                >
                  Upload Image
                </button>
              </div>
              {currentValue && (
                <button
                  style={{ marginTop: 4, width: '100%', padding: '4px 8px', background: '#3a2a2a', border: '1px solid #444', borderRadius: 4, color: '#999', fontSize: 9, cursor: 'pointer' }}
                  onClick={() => update(fieldKey, null)}
                >
                  Clear
                </button>
              )}
              <HelpText type={tileType} field={fieldKey} show={showHelp} CONFIG_HELP={CONFIG_HELP} />
            </div>
          );

        case 'activation': {
          const activationData = currentValue || fieldDef.default || { enabled: false, orderMatters: false, requirements: [] };
          const requirements = activationData.requirements || [];

          const updateActivation = (updates) => {
            update(fieldKey, { ...activationData, ...updates });
          };

          const addRequirement = () => {
            updateActivation({
              requirements: [...requirements, { x: 0, y: 0, itemId: '' }]
            });
          };

          const removeRequirement = (idx) => {
            updateActivation({
              requirements: requirements.filter((_, i) => i !== idx)
            });
          };

          const updateRequirement = (idx, field, value) => {
            const updated = requirements.map((req, i) =>
              i === idx ? { ...req, [field]: value } : req
            );
            updateActivation({ requirements: updated });
          };

          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <div
                style={{
                  background: '#1a1a1a',
                  padding: 10,
                  borderRadius: 4,
                  border: '1px solid #333'
                }}
              >
                {/* Enable checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: 11, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={activationData.enabled || false}
                    onChange={e => updateActivation({ enabled: e.target.checked })}
                  />
                  Enable activation
                </label>

                {activationData.enabled && (
                  <>
                    {/* Order matters checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 10, marginBottom: 10 }}>
                      <input
                        type="checkbox"
                        checked={activationData.orderMatters || false}
                        onChange={e => updateActivation({ orderMatters: e.target.checked })}
                      />
                      Order matters (items must be placed in sequence)
                    </label>

                    {/* Requirements list */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ color: '#888', fontSize: 10 }}>
                          Requirements ({requirements.length})
                        </span>
                        <button
                          onClick={addRequirement}
                          style={{
                            padding: '2px 8px',
                            background: '#3a5a3a',
                            border: 'none',
                            borderRadius: 3,
                            color: '#ccc',
                            fontSize: 10,
                            cursor: 'pointer'
                          }}
                        >
                          + Add
                        </button>
                      </div>

                      {requirements.length === 0 && (
                        <p style={{ color: '#666', fontSize: 10, margin: 0, fontStyle: 'italic' }}>
                          No requirements. Add items that must be placed to activate.
                        </p>
                      )}

                      {requirements.map((req, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            marginBottom: 6,
                            padding: '6px 8px',
                            background: '#252525',
                            borderRadius: 3
                          }}
                        >
                          {/* Row 1: Index, position, and pick button */}
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span style={{ color: '#666', fontSize: 9, width: 18 }}>#{idx + 1}</span>
                            <span style={{ color: '#888', fontSize: 9 }}>X:</span>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={req.x || 0}
                              onChange={e => updateRequirement(idx, 'x', Number(e.target.value))}
                              style={{ ...inputStyle, width: 36, padding: '2px 4px', fontSize: 10 }}
                            />
                            <span style={{ color: '#888', fontSize: 9 }}>Y:</span>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={req.y || 0}
                              onChange={e => updateRequirement(idx, 'y', Number(e.target.value))}
                              style={{ ...inputStyle, width: 36, padding: '2px 4px', fontSize: 10 }}
                            />
                            <button
                              onClick={() => onStartActivationPick?.(x, y, fieldKey, idx)}
                              style={{
                                padding: '2px 6px',
                                background: '#3a4a5a',
                                border: 'none',
                                borderRadius: 2,
                                color: '#ccc',
                                fontSize: 9,
                                cursor: 'pointer'
                              }}
                              title="Click on map to pick position"
                            >
                              Pick
                            </button>
                            <button
                              onClick={() => removeRequirement(idx)}
                              style={{
                                padding: '2px 5px',
                                background: '#4a2a2a',
                                border: 'none',
                                borderRadius: 2,
                                color: '#aaa',
                                fontSize: 9,
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                          {/* Row 2: Item ID dropdown */}
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 18 }}>
                            <span style={{ color: '#888', fontSize: 9 }}>Item:</span>
                            <select
                              value={req.itemId || ''}
                              onChange={e => updateRequirement(idx, 'itemId', e.target.value)}
                              style={{ ...inputStyle, flex: 1, padding: '2px 4px', fontSize: 10 }}
                            >
                              <option value="">-- Select item --</option>
                              <option value={PLAYER_REQUIREMENT_ID} style={{ color: '#7af' }}>Player (stand on spot)</option>
                              {availableItemIds.map(id => (
                                <option key={id} value={id}>{id}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p style={{ color: '#666', fontSize: 9, margin: 0, lineHeight: 1.4 }}>
                      Place items at specified positions or require the player to stand on a spot to activate this tile.
                    </p>
                  </>
                )}
              </div>
              <HelpText type={tileType} field={fieldKey} show={showHelp} CONFIG_HELP={CONFIG_HELP} />
            </div>
          );
        }

        default:
          return null;
      }
    };

    return (
      <>
        <p style={{ color: '#888', fontSize: 11, margin: '0 0 8px' }}>{t('properties.tileAt', { label: getTileLabel(themeId, tileType, def.label), x, y })}</p>
        {schemaFields.map(([fieldKey, fieldDef], idx) => renderField(fieldKey, fieldDef, idx === 0))}
        {renderHiddenSection(true)}
      </>
    );
  };

  return (
    <div style={{
      width: 280,
      background: panelBg,
      borderLeft: `2px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingUploadCallback.current) {
            handleImageUpload(file, pendingUploadCallback.current);
            pendingUploadCallback.current = null;
          }
          e.target.value = ''; // Reset so same file can be re-selected
        }}
      />

      {/* Properties Section */}
      <div style={sectionStyle}>
        <h3 style={{ ...headerStyle, direction: isRTL ? 'rtl' : 'ltr' }}>{t('properties.tileProperties')}</h3>
        {renderPropertiesContent()}
      </div>

      {/* Level Settings Section */}
      <div style={sectionStyle}>
        <h3 style={{ ...headerStyle, direction: isRTL ? 'rtl' : 'ltr' }}>{t('properties.levelSettings')}</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, direction: isRTL ? 'rtl' : 'ltr' }}>
            {t('properties.lives')}
            <input
              type="number" min="1" max="10"
              value={lives}
              onChange={e => onLivesChange?.(Number(e.target.value))}
              style={{ ...inputStyle, width: 50, padding: '4px 6px' }}
            />
          </label>
          <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, direction: isRTL ? 'rtl' : 'ltr' }}>
            {t('properties.inventory')}
            <input
              type="number" min="1" max="20"
              value={inventoryCapacity || DEFAULT_INVENTORY_CAPACITY}
              onChange={e => onInventoryCapacityChange?.(Number(e.target.value))}
              style={{ ...inputStyle, width: 50, padding: '4px 6px' }}
            />
          </label>
        </div>
        <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, direction: isRTL ? 'rtl' : 'ltr' }}>
          <input type="checkbox" checked={fixedOrder} onChange={e => onFixedOrderChange?.(e.target.checked)} />
          {t('properties.fixedOrder')}
        </label>
      </div>

      {/* Missions Section */}
      <div style={{ ...sectionStyle, borderBottom: 'none', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, direction: isRTL ? 'rtl' : 'ltr' }}>
          <h3 style={{ ...headerStyle, margin: 0 }}>{t('properties.missions')}</h3>
          <button
            onClick={addMission}
            style={{
              padding: '4px 10px',
              background: primaryColor,
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 11,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {t('properties.addMission')}
          </button>
        </div>

        {/* Mission list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Default mission (shown when no missions) */}
          {missions.length === 0 && (
            <div style={{
              padding: '8px 10px',
              background: '#2a2a2a',
              borderRadius: 6,
              border: '1px solid #444',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, direction: isRTL ? 'rtl' : 'ltr' }}>
                <span style={{ color: '#888', fontSize: 11 }}>{t('properties.defaultMission').split(':')[0]}:</span>
                <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>
                  {theme?.getDefaultMission?.()?.description || t('properties.defaultMission')}
                </span>
              </div>
            </div>
          )}

          {/* User-defined missions */}
          {missions.map((m, i) => {
            const def = missionDef(m.type);
            const isCoord = def?.coordBased;
            const targetOptions = def?.needsTarget && !isCoord ? getTargetOptions(m.type) : [];
            const isDragging = draggedMission === i;
            const isDragOver = dragOverMission === i;

            return (
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: '8px 10px',
                  background: isDragOver ? '#3a3a4a' : '#2a2a2a',
                  borderRadius: 6,
                  border: isDragOver ? `2px solid ${primaryColor}` : '1px solid #444',
                  opacity: isDragging ? 0.5 : 1,
                  cursor: 'grab',
                  transition: 'background 0.15s, border 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {/* Drag handle */}
                  <span style={{ color: '#666', fontSize: 12, cursor: 'grab', userSelect: 'none' }} title="Drag to reorder">⋮⋮</span>
                  <span style={{ color: '#666', fontSize: 10, width: 18 }}>#{i + 1}</span>
                  <select
                    value={m.type}
                    onChange={e => updateMission(i, 'type', e.target.value)}
                    style={{ ...inputStyle, flex: 1, padding: '4px 6px' }}
                  >
                    {missionTypes.map(mt => <option key={mt.id} value={mt.id}>{t(`missionTypeLabels.${mt.id}`)}</option>)}
                  </select>
                  <button
                    onClick={() => removeMission(i)}
                    style={{
                      padding: '2px 6px',
                      background: '#4a2a2a',
                      border: 'none',
                      borderRadius: 3,
                      color: '#ccc',
                      cursor: 'pointer',
                      fontSize: 10,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {def?.needsTarget && (
                  <div style={{ marginBottom: 6 }}>
                    {isCoord ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: '#888', fontSize: 10 }}>X:</span>
                        <input
                          style={{ ...inputStyle, width: 45, padding: '3px 6px' }}
                          type="number" min="0" max="19"
                          value={m.targetId ? m.targetId.split(',')[0] : ''}
                          onChange={e => {
                            const yVal = m.targetId ? m.targetId.split(',')[1] || '0' : '0';
                            updateMission(i, 'targetId', `${e.target.value},${yVal}`);
                          }}
                        />
                        <span style={{ color: '#888', fontSize: 10 }}>Y:</span>
                        <input
                          style={{ ...inputStyle, width: 45, padding: '3px 6px' }}
                          type="number" min="0" max="14"
                          value={m.targetId ? m.targetId.split(',')[1] : ''}
                          onChange={e => {
                            const xVal = m.targetId ? m.targetId.split(',')[0] || '0' : '0';
                            updateMission(i, 'targetId', `${xVal},${e.target.value}`);
                          }}
                        />
                      </div>
                    ) : targetOptions.length > 0 ? (
                      <select
                        style={{ ...inputStyle, padding: '4px 6px' }}
                        value={m.targetId || ''}
                        onChange={e => updateMission(i, 'targetId', e.target.value)}
                      >
                        <option value="">{t('properties.selectTarget')}</option>
                        {targetOptions.map(opt => <option key={opt} value={opt}>{getTileLabel(themeId, opt, opt)}</option>)}
                      </select>
                    ) : (
                      <input
                        style={{ ...inputStyle, padding: '4px 6px' }}
                        value={m.targetId || ''}
                        onChange={e => updateMission(i, 'targetId', e.target.value)}
                        placeholder={t('properties.targetPlaceholder')}
                      />
                    )}
                  </div>
                )}

                {def?.needsAmount && (() => {
                  const amtCfg = getAmountConfig(m.type);
                  return (
                    <div style={{ marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ color: '#888', fontSize: 10 }}>{amtCfg.label}:</span>
                      <input
                        style={{ ...inputStyle, width: 90, padding: '3px 6px' }}
                        type="number"
                        min={amtCfg.min}
                        max={amtCfg.max}
                        step={amtCfg.step}
                        value={m.targetAmount || amtCfg.default}
                        onChange={e => updateMission(i, 'targetAmount', Number(e.target.value))}
                      />
                    </div>
                  );
                })()}

                <input
                  style={{ ...inputStyle, padding: '4px 6px' }}
                  value={m.description || ''}
                  onChange={e => updateMission(i, 'description', e.target.value)}
                  placeholder={t('properties.descriptionPlaceholder')}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

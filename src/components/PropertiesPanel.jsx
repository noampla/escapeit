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
          // Normalise old shape { enabled, orderMatters, requirements } → new shape
          let activationData = currentValue || fieldDef.default || { startOpen: false, conditionSequence: [] };
          if (activationData.conditionSequence === undefined) {
            // Old shape — migrate on the fly for display (save will persist new shape)
            activationData = {
              startOpen: false,
              conditionSequence: activationData.enabled ? [{
                direction: 'open',
                enabled: true,
                orderMatters: activationData.orderMatters || false,
                requirements: activationData.requirements || [],
              }] : [],
            };
          }
          const conditionSequence = activationData.conditionSequence || [];

          const updateData = (updates) => {
            update(fieldKey, { ...activationData, ...updates });
          };

          const addStep = (direction) => {
            updateData({
              conditionSequence: [...conditionSequence, {
                direction,
                enabled: true,
                orderMatters: false,
                requirements: [],
              }]
            });
          };

          const removeStep = (si) => {
            updateData({ conditionSequence: conditionSequence.filter((_, i) => i !== si) });
          };

          const moveStep = (si, delta) => {
            const ni = si + delta;
            if (ni < 0 || ni >= conditionSequence.length) return;
            const seq = [...conditionSequence];
            [seq[si], seq[ni]] = [seq[ni], seq[si]];
            updateData({ conditionSequence: seq });
          };

          const updateStep = (si, stepUpdates) => {
            const seq = conditionSequence.map((s, i) => i === si ? { ...s, ...stepUpdates } : s);
            updateData({ conditionSequence: seq });
          };

          const addReq = (si) => {
            const step = conditionSequence[si];
            updateStep(si, { requirements: [...(step.requirements || []), { x: 0, y: 0, itemId: '' }] });
          };

          const removeReq = (si, ri) => {
            const step = conditionSequence[si];
            updateStep(si, { requirements: (step.requirements || []).filter((_, i) => i !== ri) });
          };

          const updateReq = (si, ri, field, value) => {
            const step = conditionSequence[si];
            const reqs = (step.requirements || []).map((r, i) => i === ri ? { ...r, [field]: value } : r);
            updateStep(si, { requirements: reqs });
          };

          const iconBtn = (label, onClick, bg, title) => (
            <button
              onClick={onClick}
              title={title}
              style={{
                padding: '1px 5px',
                background: bg,
                border: 'none',
                borderRadius: 2,
                color: '#ccc',
                fontSize: 9,
                cursor: 'pointer',
                lineHeight: 1.4,
              }}
            >{label}</button>
          );

          return (
            <div key={fieldKey}>
              <label style={baseLabel}>{fieldDef.label}</label>
              <div style={{ background: '#1a1a1a', padding: 10, borderRadius: 4, border: '1px solid #333' }}>

                {/* Start Open checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: 11, marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={activationData.startOpen || false}
                    onChange={e => updateData({ startOpen: e.target.checked })}
                  />
                  Start Open
                </label>

                {/* Condition Sequence header + add buttons */}
                <div style={{ borderTop: '1px solid #333', paddingTop: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: '#888', fontSize: 10 }}>Condition Sequence ({conditionSequence.length})</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => addStep('open')}
                        style={{ padding: '2px 7px', background: '#2a4a2a', border: '1px solid #3a6a3a', borderRadius: 3, color: '#8c8', fontSize: 9, cursor: 'pointer' }}
                      >+ Open</button>
                      <button
                        onClick={() => addStep('close')}
                        style={{ padding: '2px 7px', background: '#4a2a2a', border: '1px solid #6a3a3a', borderRadius: 3, color: '#c88', fontSize: 9, cursor: 'pointer' }}
                      >+ Close</button>
                    </div>
                  </div>

                  {conditionSequence.length === 0 && (
                    <p style={{ color: '#555', fontSize: 10, margin: 0, fontStyle: 'italic' }}>
                      No steps. Add an open or close condition.
                    </p>
                  )}

                  {conditionSequence.map((step, si) => {
                    const isOpen = step.direction === 'open';
                    const stepBg = isOpen ? '#1a2a1a' : '#2a1a1a';
                    const badgeBg = isOpen ? '#2a5a2a' : '#5a2a2a';
                    const badgeColor = isOpen ? '#8c8' : '#c88';
                    const condType = step.conditionType || 'items';
                    const reqs = step.requirements || [];
                    const stepPathTiles = step.pathTiles || [];

                    return (
                      <div key={si} style={{ marginBottom: 6, padding: '6px 8px', background: stepBg, borderRadius: 3, border: `1px solid ${isOpen ? '#2a4a2a' : '#4a2a2a'}` }}>
                        {/* Step header: badge + step number + reorder + remove */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                          <span style={{ background: badgeBg, color: badgeColor, fontSize: 8, padding: '1px 5px', borderRadius: 2, fontWeight: 700, letterSpacing: 0.5 }}>
                            {step.direction.toUpperCase()}
                          </span>
                          <span style={{ color: '#666', fontSize: 9, flex: 1 }}>Step #{si + 1}</span>
                          {iconBtn('↑', () => moveStep(si, -1), '#2a2a3a', 'Move up')}
                          {iconBtn('↓', () => moveStep(si, 1), '#2a2a3a', 'Move down')}
                          {iconBtn('✕', () => removeStep(si), '#4a2a2a', 'Remove step')}
                        </div>

                        {/* Enabled + Condition type toggle */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888', fontSize: 9 }}>
                            <input type="checkbox" checked={step.enabled !== false} onChange={e => updateStep(si, { enabled: e.target.checked })} />
                            Enabled
                          </label>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button
                              onClick={() => updateStep(si, { conditionType: 'items' })}
                              style={{ padding: '1px 6px', fontSize: 8, border: 'none', borderRadius: '2px 0 0 2px', cursor: 'pointer', background: condType === 'items' ? '#3a5a7a' : '#2a2a2a', color: condType === 'items' ? '#adf' : '#666' }}
                            >Items</button>
                            <button
                              onClick={() => updateStep(si, { conditionType: 'path' })}
                              style={{ padding: '1px 6px', fontSize: 8, border: 'none', borderRadius: '0 2px 2px 0', cursor: 'pointer', background: condType === 'path' ? '#3a5a7a' : '#2a2a2a', color: condType === 'path' ? '#adf' : '#666' }}
                            >Path</button>
                          </div>
                        </div>

                        {/* Items condition */}
                        {condType === 'items' && (
                          <>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888', fontSize: 9, marginBottom: 5 }}>
                              <input type="checkbox" checked={step.orderMatters || false} onChange={e => updateStep(si, { orderMatters: e.target.checked })} />
                              Order matters
                            </label>

                            <div style={{ marginBottom: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ color: '#666', fontSize: 9 }}>Requirements ({reqs.length})</span>
                                <button
                                  onClick={() => addReq(si)}
                                  style={{ padding: '1px 6px', background: '#2a3a4a', border: 'none', borderRadius: 2, color: '#aaa', fontSize: 9, cursor: 'pointer' }}
                                >+ Add</button>
                              </div>

                              {reqs.length === 0 && (
                                <p style={{ color: '#444', fontSize: 9, margin: 0, fontStyle: 'italic' }}>No requirements yet.</p>
                              )}

                              {reqs.map((req, ri) => (
                                <div key={ri} style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4, padding: '4px 6px', background: '#1e1e1e', borderRadius: 2 }}>
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <span style={{ color: '#555', fontSize: 8, width: 16 }}>#{ri + 1}</span>
                                    <span style={{ color: '#777', fontSize: 9 }}>X:</span>
                                    <input
                                      type="number" min="0" max="99"
                                      value={req.x || 0}
                                      onChange={e => updateReq(si, ri, 'x', Number(e.target.value))}
                                      style={{ ...inputStyle, width: 34, padding: '1px 3px', fontSize: 9 }}
                                    />
                                    <span style={{ color: '#777', fontSize: 9 }}>Y:</span>
                                    <input
                                      type="number" min="0" max="99"
                                      value={req.y || 0}
                                      onChange={e => updateReq(si, ri, 'y', Number(e.target.value))}
                                      style={{ ...inputStyle, width: 34, padding: '1px 3px', fontSize: 9 }}
                                    />
                                    <button
                                      onClick={() => onStartActivationPick?.(x, y, fieldKey, si, ri)}
                                      style={{ padding: '1px 5px', background: '#3a4a5a', border: 'none', borderRadius: 2, color: '#ccc', fontSize: 8, cursor: 'pointer' }}
                                      title="Click on map to pick position"
                                    >Pick</button>
                                    <button
                                      onClick={() => removeReq(si, ri)}
                                      style={{ padding: '1px 4px', background: '#4a2a2a', border: 'none', borderRadius: 2, color: '#aaa', fontSize: 8, cursor: 'pointer' }}
                                    >✕</button>
                                  </div>
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 16 }}>
                                    <span style={{ color: '#777', fontSize: 9 }}>Item:</span>
                                    <select
                                      value={req.itemId || ''}
                                      onChange={e => updateReq(si, ri, 'itemId', e.target.value)}
                                      style={{ ...inputStyle, flex: 1, padding: '1px 3px', fontSize: 9 }}
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
                          </>
                        )}

                        {/* Path condition */}
                        {condType === 'path' && (
                          <div
                            style={{ background: '#1e1e1e', padding: '6px 8px', borderRadius: 3, cursor: 'pointer', color: '#aaa', fontSize: 10 }}
                            onClick={() => onStartPathEdit?.(x, y, fieldKey, si)}
                          >
                            {stepPathTiles.length > 0
                              ? `${stepPathTiles.length} tiles in path. Click to edit.`
                              : 'Click to create path on map'}
                            {stepPathTiles.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                                {stepPathTiles.map((t, ti) => (
                                  <span key={ti} style={{ background: '#333', padding: '1px 5px', borderRadius: 2, fontSize: 9, color: '#ccc' }}>
                                    {ti + 1}:({t.x},{t.y})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p style={{ color: '#555', fontSize: 9, margin: 0, lineHeight: 1.4 }}>
                  Steps are executed in order. Each step fires once when its conditions are met.
                </p>
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

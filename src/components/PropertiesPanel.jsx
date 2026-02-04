import { useContext, useMemo } from 'react';
import { ThemeContext } from '../App';
import { BASE_MISSION_TYPES, DEFAULT_INVENTORY_CAPACITY } from '../utils/constants';

const HelpText = ({ type, field, show, CONFIG_HELP }) => {
  if (!show) return null;
  const help = CONFIG_HELP?.[type]?.[field];
  if (!help) return null;
  return <p style={{ color: '#888', fontSize: 10, margin: '2px 0 0', lineHeight: 1.3 }}>{help}</p>;
};

// Default fallbacks
const DEFAULT_FLOOR_COLORS = {
  gray: { label: 'Gray' },
  blue: { label: 'Blue' },
  red: { label: 'Red' },
  green: { label: 'Green' },
  yellow: { label: 'Yellow' },
  purple: { label: 'Purple' },
  marble: { label: 'Marble' },
};

const DEFAULT_LOCK_COLORS = {
  red: { label: 'Red' },
  blue: { label: 'Blue' },
  green: { label: 'Green' },
  yellow: { label: 'Yellow' },
  purple: { label: 'Purple' },
};

const DEFAULT_LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

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
  inventoryCapacity, onInventoryCapacityChange
}) {
  const theme = useContext(ThemeContext);
  const TILE_TYPES = theme?.getTileTypes() || {};
  const CONFIG_HELP = theme?.getConfigHelp() || {};
  const primaryColor = theme?.primaryColor || '#6688aa';

  // Get colors and tile lists from theme with fallbacks
  const FLOOR_COLORS = useMemo(() => theme?.getFloorColors?.() || DEFAULT_FLOOR_COLORS, [theme]);
  const LOCK_COLORS = useMemo(() => theme?.getLockColors?.() || DEFAULT_LOCK_COLORS, [theme]);
  const LOCK_TILES = useMemo(() => theme?.getLockTiles?.() || DEFAULT_LOCK_TILES, [theme]);

  // Mission editor helpers
  const missionTypes = useMemo(() => {
    const themeMissionIds = theme?.getMissionTypes?.();
    if (themeMissionIds && themeMissionIds.length > 0) {
      return BASE_MISSION_TYPES.filter(mt => themeMissionIds.includes(mt.id));
    }
    return BASE_MISSION_TYPES;
  }, [theme]);

  const getTargetOptions = (missionType) => theme?.getMissionTargetOptions?.(missionType) || [];
  const missionDef = (type) => missionTypes.find(mt => mt.id === type) || BASE_MISSION_TYPES.find(mt => mt.id === type);

  const addMission = () => {
    const defaultType = missionTypes.find(mt => mt.id === 'escape')?.id || missionTypes[0]?.id || 'escape';
    onMissionsChange?.([...missions, { type: defaultType, targetId: '', description: '' }]);
  };

  const removeMission = (idx) => onMissionsChange?.(missions.filter((_, i) => i !== idx));

  const updateMission = (idx, field, value) => {
    const updated = missions.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    onMissionsChange?.(updated);
  };

  // Build properties section content
  const renderPropertiesContent = () => {
    if (!selectedCell) {
      return (
        <p style={{ color: '#666', fontSize: 12, margin: 0 }}>Click a tile to configure it.</p>
      );
    }

    const { x, y } = selectedCell;
    const cell = grid[y][x];
    const def = TILE_TYPES[cell.type];

    if (!def || !def.configurable) {
      return (
        <>
          <p style={{ color: '#888', fontSize: 12, margin: '0 0 4px' }}>{def?.label || cell.type} at ({x}, {y})</p>
          <p style={{ color: '#666', fontSize: 11, margin: 0 }}>Not configurable.</p>
        </>
      );
    }

    const config = cell.config || {};
    const update = (key, value) => onConfigChange(x, y, { ...config, [key]: value });

    return (
      <>
        <p style={{ color: '#888', fontSize: 11, margin: '0 0 8px' }}>{def.label} at ({x}, {y})</p>

        {cell.type === 'car' && (
          <label style={{ ...labelStyle, marginTop: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={config.needsKey !== false} onChange={e => update('needsKey', e.target.checked)} />
            Requires Key
          </label>
        )}

        {cell.type === 'friend' && (<>
          <label style={{ ...labelStyle, marginTop: 0 }}>Friend Name</label>
          <input style={inputStyle} value={config.name || ''} onChange={e => update('name', e.target.value)} placeholder="e.g. Alice" />
        </>)}

        {cell.type === 'floor' && (<>
          <label style={{ ...labelStyle, marginTop: 0 }}>Floor Color</label>
          <select style={inputStyle} value={config.floorColor || 'gray'} onChange={e => update('floorColor', e.target.value)}>
            {Object.entries(FLOOR_COLORS).map(([colorId, colorDef]) => (
              <option key={colorId} value={colorId}>{colorDef.label}</option>
            ))}
          </select>
        </>)}

        {LOCK_TILES.includes(cell.type) && (<>
          <label style={{ ...labelStyle, marginTop: 0 }}>Lock Color</label>
          <select style={inputStyle} value={config.lockColor || 'red'} onChange={e => update('lockColor', e.target.value)}>
            {Object.entries(LOCK_COLORS).map(([colorId, colorDef]) => (
              <option key={colorId} value={colorId}>{colorDef.label}</option>
            ))}
          </select>
        </>)}
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
      {/* Properties Section */}
      <div style={sectionStyle}>
        <h3 style={headerStyle}>Tile Properties</h3>
        {renderPropertiesContent()}
      </div>

      {/* Level Settings Section */}
      <div style={sectionStyle}>
        <h3 style={headerStyle}>Level Settings</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            Lives:
            <input
              type="number" min="1" max="10"
              value={lives}
              onChange={e => onLivesChange?.(Number(e.target.value))}
              style={{ ...inputStyle, width: 50, padding: '4px 6px' }}
            />
          </label>
          <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            Inventory:
            <input
              type="number" min="1" max="20"
              value={inventoryCapacity || DEFAULT_INVENTORY_CAPACITY}
              onChange={e => onInventoryCapacityChange?.(Number(e.target.value))}
              style={{ ...inputStyle, width: 50, padding: '4px 6px' }}
            />
          </label>
        </div>
        <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <input type="checkbox" checked={fixedOrder} onChange={e => onFixedOrderChange?.(e.target.checked)} />
          Fixed Mission Order
        </label>
      </div>

      {/* Missions Section */}
      <div style={{ ...sectionStyle, borderBottom: 'none', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ ...headerStyle, margin: 0 }}>Missions</h3>
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
            + Add
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#888', fontSize: 11 }}>Default:</span>
                <span style={{ color: '#aaa', fontSize: 12, flex: 1 }}>
                  {theme?.getDefaultMission?.()?.description || 'Reach the exit'}
                </span>
              </div>
            </div>
          )}

          {/* User-defined missions */}
          {missions.map((m, i) => {
            const def = missionDef(m.type);
            const isCoord = def?.coordBased;
            const targetOptions = def?.needsTarget && !isCoord ? getTargetOptions(m.type) : [];

            return (
              <div key={i} style={{
                padding: '8px 10px',
                background: '#2a2a2a',
                borderRadius: 6,
                border: '1px solid #444',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: '#666', fontSize: 10, width: 18 }}>#{i + 1}</span>
                  <select
                    value={m.type}
                    onChange={e => updateMission(i, 'type', e.target.value)}
                    style={{ ...inputStyle, flex: 1, padding: '4px 6px' }}
                  >
                    {missionTypes.map(mt => <option key={mt.id} value={mt.id}>{mt.label}</option>)}
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
                        <option value="">-- Select target --</option>
                        {targetOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        style={{ ...inputStyle, padding: '4px 6px' }}
                        value={m.targetId || ''}
                        onChange={e => updateMission(i, 'targetId', e.target.value)}
                        placeholder="Target"
                      />
                    )}
                  </div>
                )}

                <input
                  style={{ ...inputStyle, padding: '4px 6px' }}
                  value={m.description || ''}
                  onChange={e => updateMission(i, 'description', e.target.value)}
                  placeholder="Description (shown to player)"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

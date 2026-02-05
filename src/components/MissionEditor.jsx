import { useContext, useMemo } from 'react';
import { BASE_MISSION_TYPES, DEFAULT_INVENTORY_CAPACITY } from '../utils/constants';
import { ThemeContext } from '../App';

export default function MissionEditor({ missions, onChange, lives, onLivesChange, fixedOrder, onFixedOrderChange, inventoryCapacity, onInventoryCapacityChange }) {
  const theme = useContext(ThemeContext);

  // Get mission types from theme, with theme-specific labels
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

  // Get target options for a mission type from theme
  const getTargetOptions = (missionType) => {
    return theme?.getMissionTargetOptions?.(missionType) || [];
  };

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
    // Default to 'escape' if available, otherwise first available type
    const defaultType = missionTypes.find(mt => mt.id === 'escape')?.id || missionTypes[0]?.id || 'escape';
    onChange([...missions, { type: defaultType, targetId: '', description: '' }]);
  };

  const removeMission = (idx) => {
    onChange(missions.filter((_, i) => i !== idx));
  };

  const updateMission = (idx, field, value) => {
    const updated = missions.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    onChange(updated);
  };

  const moveMission = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= missions.length) return;
    const updated = [...missions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onChange(updated);
  };

  const missionDef = (type) => missionTypes.find(mt => mt.id === type) || BASE_MISSION_TYPES.find(mt => mt.id === type);

  const inputStyle = { padding: '3px 6px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 3, color: '#ddd', fontSize: 11 };
  const btnStyle = { padding: '2px 6px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 3, color: '#ccc', cursor: 'pointer', fontSize: 11 };

  return (
    <div style={{ background: '#1a2a1a', padding: 10, borderTop: '2px solid #335533' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ color: '#aaa', fontSize: 14, margin: 0 }}>Missions & Settings</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ color: '#888', fontSize: 11 }}>
            Lives: <input type="number" min="1" max="10" value={lives} onChange={e => onLivesChange(Number(e.target.value))} style={{ ...inputStyle, width: 40 }} />
          </label>
          <label style={{ color: '#888', fontSize: 11 }}>
            Inventory: <input type="number" min="1" max="20" value={inventoryCapacity || DEFAULT_INVENTORY_CAPACITY} onChange={e => onInventoryCapacityChange(Number(e.target.value))} style={{ ...inputStyle, width: 40 }} />
          </label>
          <label style={{ color: '#888', fontSize: 11 }}>
            <input type="checkbox" checked={fixedOrder} onChange={e => onFixedOrderChange(e.target.checked)} /> Fixed Order
          </label>
          <button onClick={addMission} style={{ ...btnStyle, background: '#2a4a2a' }}>+ Add Mission</button>
        </div>
      </div>

      {missions.length === 0 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, padding: '4px 6px', background: '#223333', borderRadius: 4, border: '1px dashed #446666' }}>
          <span style={{ color: '#668888', fontSize: 11, fontStyle: 'italic' }}>
            Default: {theme?.getDefaultMission?.()?.description || 'Reach the exit'} (auto-added)
          </span>
        </div>
      )}

      {missions.map((m, i) => {
        const def = missionDef(m.type);
        const isCoord = def?.coordBased;
        const targetOptions = def?.needsTarget && !isCoord ? getTargetOptions(m.type) : [];

        return (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, padding: '4px 6px', background: '#223322', borderRadius: 4 }}>
            <span style={{ color: '#556644', fontSize: 11, width: 20 }}>#{i + 1}</span>
            <select value={m.type} onChange={e => updateMission(i, 'type', e.target.value)} style={{ ...inputStyle, width: 130 }}>
              {missionTypes.map(mt => <option key={mt.id} value={mt.id}>{mt.label}</option>)}
            </select>
            {def?.needsTarget && (
              isCoord ? (
                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <span style={{ color: '#888', fontSize: 10 }}>X:</span>
                  <input
                    style={{ ...inputStyle, width: 40 }}
                    type="number" min="0" max="19"
                    value={m.targetId ? m.targetId.split(',')[0] : ''}
                    onChange={e => {
                      const yVal = m.targetId ? m.targetId.split(',')[1] || '0' : '0';
                      updateMission(i, 'targetId', `${e.target.value},${yVal}`);
                    }}
                    placeholder="x"
                  />
                  <span style={{ color: '#888', fontSize: 10 }}>Y:</span>
                  <input
                    style={{ ...inputStyle, width: 40 }}
                    type="number" min="0" max="14"
                    value={m.targetId ? m.targetId.split(',')[1] : ''}
                    onChange={e => {
                      const xVal = m.targetId ? m.targetId.split(',')[0] || '0' : '0';
                      updateMission(i, 'targetId', `${xVal},${e.target.value}`);
                    }}
                    placeholder="y"
                  />
                </div>
              ) : targetOptions.length > 0 ? (
                <select style={{ ...inputStyle, width: 100 }} value={m.targetId || ''} onChange={e => updateMission(i, 'targetId', e.target.value)}>
                  <option value="">-- Pick --</option>
                  {targetOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  style={{ ...inputStyle, width: 100 }}
                  value={m.targetId || ''}
                  onChange={e => updateMission(i, 'targetId', e.target.value)}
                  placeholder={def?.targetLabel || 'Target'}
                />
              )
            )}
            {def?.needsAmount && (() => {
              const amtCfg = getAmountConfig(m.type);
              return (
                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <span style={{ color: '#888', fontSize: 10 }}>{amtCfg.label}:</span>
                  <input
                    style={{ ...inputStyle, width: 80 }}
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
              style={{ ...inputStyle, flex: 1 }}
              value={m.description || ''}
              onChange={e => updateMission(i, 'description', e.target.value)}
              placeholder="Description (shown to solver)"
            />
            <button onClick={() => moveMission(i, -1)} style={btnStyle} disabled={i === 0}>↑</button>
            <button onClick={() => moveMission(i, 1)} style={btnStyle} disabled={i === missions.length - 1}>↓</button>
            <button onClick={() => removeMission(i)} style={{ ...btnStyle, background: '#4a2a2a' }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

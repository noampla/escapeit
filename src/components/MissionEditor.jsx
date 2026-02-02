import { MISSION_TYPES, DEFAULT_INVENTORY_CAPACITY } from '../utils/constants';

export default function MissionEditor({ missions, onChange, lives, onLivesChange, fixedOrder, onFixedOrderChange, inventoryCapacity, onInventoryCapacityChange }) {
  const addMission = () => {
    onChange([...missions, { type: 'escape', targetId: '', description: '' }]);
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

  const missionDef = (type) => MISSION_TYPES.find(mt => mt.id === type);

  const inputStyle = { padding: '3px 6px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 3, color: '#ddd', fontSize: 11 };
  const btnStyle = { padding: '2px 6px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 3, color: '#ccc', cursor: 'pointer', fontSize: 11 };

  return (
    <div style={{ background: '#1a2a1a', padding: 10, borderTop: '2px solid #335533' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ color: '#aaa', fontSize: 14, margin: 0 }}>🌲 Missions & Settings</h3>
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
        <p style={{ color: '#556644', fontSize: 12 }}>No missions. Add at least "Reach the Car" for a valid level.</p>
      )}

      {missions.map((m, i) => {
        const def = missionDef(m.type);
        const isCoord = def?.coordBased;
        return (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, padding: '4px 6px', background: '#223322', borderRadius: 4 }}>
            <span style={{ color: '#556644', fontSize: 11, width: 20 }}>#{i + 1}</span>
            <select value={m.type} onChange={e => updateMission(i, 'type', e.target.value)} style={{ ...inputStyle, width: 130 }}>
              {MISSION_TYPES.map(mt => <option key={mt.id} value={mt.id}>{mt.label}</option>)}
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
              ) : def?.targetOptions ? (
                <select style={{ ...inputStyle, width: 100 }} value={m.targetId || ''} onChange={e => updateMission(i, 'targetId', e.target.value)}>
                  <option value="">-- Pick --</option>
                  {def.targetOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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

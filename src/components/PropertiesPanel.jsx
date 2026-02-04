import { useContext } from 'react';
import { ThemeContext } from '../App';

const HelpText = ({ type, field, show, CONFIG_HELP }) => {
  if (!show) return null;
  const help = CONFIG_HELP?.[type]?.[field];
  if (!help) return null;
  return <p style={{ color: '#556644', fontSize: 10, margin: '2px 0 0', lineHeight: 1.3 }}>{help}</p>;
};

export default function PropertiesPanel({ grid, selectedCell, onConfigChange, showHelp = true }) {
  const theme = useContext(ThemeContext);
  const TILE_TYPES = theme?.getTileTypes() || {};
  const CONFIG_HELP = theme?.getConfigHelp() || {};
  if (!selectedCell) {
    return (
      <div style={{ width: 220, background: '#1a2a1a', padding: 10, borderLeft: '2px solid #335533' }}>
        <h3 style={{ color: '#aaa', fontSize: 14, margin: '0 0 10px' }}>Properties</h3>
        <p style={{ color: '#666', fontSize: 12 }}>Click a placed object to configure it.</p>
        {showHelp && <p style={{ color: '#555', fontSize: 10, marginTop: 8 }}>In Build mode: Shift+click to edit an object.<br/>In Edit mode: click any object.</p>}
      </div>
    );
  }

  const { x, y } = selectedCell;
  const cell = grid[y][x];
  const def = TILE_TYPES[cell.type];
  if (!def || !def.configurable) {
    return (
      <div style={{ width: 220, background: '#1a2a1a', padding: 10, borderLeft: '2px solid #335533' }}>
        <h3 style={{ color: '#aaa', fontSize: 14, margin: '0 0 10px' }}>Properties</h3>
        <p style={{ color: '#888', fontSize: 12 }}>{def?.label || cell.type} at ({x}, {y})</p>
        <p style={{ color: '#666', fontSize: 11 }}>Not configurable.</p>
        {showHelp && def?.tooltip && <p style={{ color: '#555', fontSize: 10, marginTop: 6 }}>{def.tooltip}</p>}
      </div>
    );
  }

  const config = cell.config || {};
  const update = (key, value) => onConfigChange(x, y, { ...config, [key]: value });

  const inputStyle = { width: '100%', padding: '4px 6px', background: '#2a3a2a', border: '1px solid #446644', borderRadius: 3, color: '#ddd', fontSize: 12, boxSizing: 'border-box' };
  const labelStyle = { color: '#aaa', fontSize: 11, display: 'block', marginBottom: 2, marginTop: 8 };

  return (
    <div style={{ width: 220, background: '#1a2a1a', padding: 10, borderLeft: '2px solid #335533', overflowY: 'auto' }}>
      <h3 style={{ color: '#aaa', fontSize: 14, margin: '0 0 6px' }}>{def.label}</h3>
      <p style={{ color: '#666', fontSize: 11, margin: '0 0 4px' }}>({x}, {y})</p>

      {showHelp && def.tooltip && <p style={{ color: '#555', fontSize: 10, margin: '4px 0 8px', lineHeight: 1.3 }}>{def.tooltip}</p>}

      {cell.type === 'car' && (<>
        <label style={labelStyle}>
          <input type="checkbox" checked={config.needsKey !== false} onChange={e => update('needsKey', e.target.checked)} />
          {' '}Requires Key
        </label>
        <HelpText type="car" field="needsKey" show={showHelp} CONFIG_HELP={CONFIG_HELP} />
      </>)}

      {cell.type === 'friend' && (<>
        <label style={labelStyle}>Friend Name</label>
        <input style={inputStyle} value={config.name || ''} onChange={e => update('name', e.target.value)} placeholder="e.g. Alice" />
        <HelpText type="friend" field="name" show={showHelp} CONFIG_HELP={CONFIG_HELP} />
      </>)}

      {cell.type === 'floor' && (<>
        <label style={labelStyle}>Floor Color</label>
        <select style={inputStyle} value={config.floorColor || 'gray'} onChange={e => update('floorColor', e.target.value)}>
          <option value="gray">Gray</option>
          <option value="blue">Blue</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
          <option value="purple">Purple</option>
          <option value="orange">Orange</option>
          <option value="marble">Marble</option>
        </select>
        <HelpText type="floor" field="floorColor" show={showHelp} CONFIG_HELP={CONFIG_HELP} />
      </>)}

      {(cell.type === 'door-key' || cell.type === 'door-card' || cell.type === 'item-key' || cell.type === 'item-card') && (<>
        <label style={labelStyle}>Lock Color</label>
        <select style={inputStyle} value={config.lockColor || 'red'} onChange={e => update('lockColor', e.target.value)}>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
          <option value="purple">Purple</option>
        </select>
        <HelpText type={cell.type} field="lockColor" show={showHelp} CONFIG_HELP={CONFIG_HELP} />
      </>)}
    </div>
  );
}

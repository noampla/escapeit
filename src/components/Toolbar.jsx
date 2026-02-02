import { TILE_TYPES, ITEM_TYPES } from '../utils/constants';

const categories = [
  { id: 'basic', label: 'Terrain' },
  { id: 'interactive', label: 'Objects' },
  { id: 'hazard', label: 'Hazards' },
];

const TOOLBAR_EMOJIS = {
  tree: '🌲', water: '🌊', snow: '❄️',
  campfire: '🏕️', car: '🚗',
  friend: '👤',
  fire: '🔥', bear: '🐻',
  // Item tiles
  'item-key': '🔑',
  'item-axe': '🪓',
  'item-bucket': '🪣',
  'item-rope': '🧵',
  'item-knife': '🔪',
  'item-sweater': '🧥',
  'item-wood': '🪵',
};

export default function Toolbar({ selected, onSelect }) {
  return (
    <div style={{ width: 170, background: '#1a2a1a', padding: 10, overflowY: 'auto', borderRight: '2px solid #335533' }}>
      <h3 style={{ margin: '0 0 10px', color: '#aaa', fontSize: 14 }}>🌲 Objects</h3>
      {categories.map(cat => {
        const items = Object.entries(TILE_TYPES).filter(([, def]) => def.category === cat.id);
        if (items.length === 0) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 4, textTransform: 'uppercase' }}>{cat.label}</div>
            {items.map(([type, def]) => {
              const emoji = TOOLBAR_EMOJIS[type] || '';
              return (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                    padding: '5px 8px', marginBottom: 2,
                    background: selected === type ? '#3a5a3a' : '#2a3a2a',
                    border: selected === type ? '1px solid #66aa66' : '1px solid transparent',
                    borderRadius: 4, color: '#ddd', cursor: 'pointer', fontSize: 12, textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{emoji || ''}</span>
                  <span style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: def.color, display: emoji ? 'none' : 'inline-block', flexShrink: 0,
                  }} />
                  {def.label}
                </button>
              );
            })}
          </div>
        );
      })}
      <div style={{ color: '#556644', fontSize: 10, marginTop: 10 }}>
        Left click: place<br />
        Right click: remove
      </div>
    </div>
  );
}

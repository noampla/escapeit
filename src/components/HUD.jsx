import { ITEM_TYPES } from '../utils/constants';

export default function HUD({ lives, maxLives, missions, gameState, fixedOrder, message, inventory = [], grid }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8, pointerEvents: 'none' }}>
      {/* Lives */}
      <div style={{ background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 6 }}>
        <span style={{ color: '#ff4444', fontSize: 16 }}>
          {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, maxLives - lives))}
        </span>
      </div>

      {/* Message */}
      {message && (
        <div style={{ background: 'rgba(50,100,50,0.85)', padding: '6px 16px', borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* Missions */}
      <div style={{ background: 'rgba(0,0,0,0.7)', padding: '8px 12px', borderRadius: 6, maxWidth: 250 }}>
        <div style={{ color: '#aaa', fontSize: 11, marginBottom: 4 }}>MISSIONS{fixedOrder ? ' (ordered)' : ''}</div>
        {missions.map((m, i) => {
          const complete = isMissionDone(m, gameState, grid);
          const isCurrent = fixedOrder && !complete && missions.slice(0, i).every(prev => isMissionDone(prev, gameState, grid));
          return (
            <div key={i} style={{
              color: complete ? '#44ff44' : isCurrent ? '#ffdd00' : '#888',
              fontSize: 12,
              textDecoration: complete ? 'line-through' : 'none',
            }}>
              {complete ? '✓' : isCurrent ? '▶' : '○'} {m.description || `${m.type}: ${m.targetId || ''}`}
            </div>
          );
        })}
      </div>

      {/* Inventory */}
      {inventory.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 6 }}>
          <div style={{ color: '#aaa', fontSize: 11, marginBottom: 2 }}>INVENTORY</div>
          {inventory.map((item, i) => {
            const def = ITEM_TYPES[item.itemType];
            const label = def ? def.label : item.itemType;
            let emoji = def?.emoji || '';
            // Manual rendering for bucket/wood
            if (item.itemType === 'bucket') emoji = '🪣';
            if (item.itemType === 'wood') emoji = '🪵';
            const suffix = item.itemType === 'bucket' ? (item.filled ? ' (full)' : ' (empty)') : '';
            return (
              <div key={i} style={{ color: def?.color || '#ddd', fontSize: 12 }}>
                {emoji} {label}{suffix}
              </div>
            );
          })}
          <div style={{ color: '#446644', fontSize: 9, marginTop: 2 }}>Q: drop menu</div>
        </div>
      )}
    </div>
  );
}

function isMissionDone(mission, gs, grid) {
  switch (mission.type) {
    case 'collect': return gs.collectedItems.includes(mission.targetId);
    case 'rescue': return gs.rescuedFriends > 0 || gs.collectedItems.includes('friend');
    case 'extinguish': {
      if (!grid) return false;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x].type === 'fire') return false;
        }
      }
      return true;
    }
    case 'reach': return gs.reachedLocations.includes(mission.targetId);
    case 'escape': return gs.reachedExit;
    default: return false;
  }
}

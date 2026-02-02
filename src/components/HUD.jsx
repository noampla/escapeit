import { ITEM_TYPES } from '../utils/constants';

export default function HUD({ lives, maxLives, missions, gameState, fixedOrder, message, inventory = [], grid }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12, pointerEvents: 'none' }}>
      {/* Lives */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 42, 26, 0.95) 0%, rgba(10, 26, 10, 0.95) 100%)',
        padding: '10px 16px',
        borderRadius: 8,
        border: '2px solid #446644',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}>
        <span style={{ color: '#ff6666', fontSize: 18 }}>
          {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, maxLives - lives))}
        </span>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(68, 170, 68, 0.95) 0%, rgba(42, 122, 42, 0.95) 100%)',
          padding: '10px 20px',
          borderRadius: 8,
          color: '#fff',
          fontSize: 15,
          fontWeight: 'bold',
          border: '2px solid #66aa66',
          boxShadow: '0 4px 16px rgba(68, 170, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          {message}
        </div>
      )}

      {/* Missions */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 42, 26, 0.95) 0%, rgba(10, 26, 10, 0.95) 100%)',
        padding: '12px 16px',
        borderRadius: 8,
        maxWidth: 280,
        border: '2px solid #446644',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{
          color: '#88dd88',
          fontSize: 12,
          marginBottom: 6,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          MISSIONS{fixedOrder ? ' (ordered)' : ''}
        </div>
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
        <div style={{
          background: 'linear-gradient(135deg, rgba(26, 42, 26, 0.95) 0%, rgba(10, 26, 10, 0.95) 100%)',
          padding: '10px 16px',
          borderRadius: 8,
          border: '2px solid #446644',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{
            color: '#88dd88',
            fontSize: 12,
            marginBottom: 4,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            INVENTORY
          </div>
          {inventory.map((item, i) => {
            const def = ITEM_TYPES[item.itemType];
            const label = def ? def.label : item.itemType;
            let emoji = def?.emoji || '';
            // Manual rendering for bucket/wood
            if (item.itemType === 'bucket') emoji = '🪣';
            if (item.itemType === 'wood') emoji = '🪵';
            const suffix = item.itemType === 'bucket' ? (item.filled ? ' (full)' : ' (empty)') : '';
            return (
              <div key={i} style={{
                color: '#eeffee',
                fontSize: 13,
                fontWeight: '500',
                marginBottom: 2,
              }}>
                {emoji} {label}{suffix}
              </div>
            );
          })}
          <div style={{
            color: '#99bb99',
            fontSize: 10,
            marginTop: 6,
            fontStyle: 'italic',
          }}>
            Q: drop menu
          </div>
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

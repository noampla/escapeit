import { useEffect, useRef, useContext, useMemo } from 'react';
import { ThemeContext } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import soundManager from '../engine/soundManager';

const getCategoryLabel = (t, catId) => {
  const labels = {
    'entry-exit': t('toolbar.entryExit'),
    basic: t('toolbar.terrain'),
    interactive: t('toolbar.objects'),
    hazard: t('toolbar.hazards'),
  };
  return labels[catId] || catId;
};

const categories = [
  { id: 'entry-exit' },
  { id: 'basic' },
  { id: 'interactive' },
  { id: 'hazard' },
];

// Minimal fallbacks for engine-level tiles only
const DEFAULT_EMOJIS = {
  start: '🚪',
  exit: '🏁',
};

// Default color fallbacks
const DEFAULT_FLOOR_COLORS = {
  gray: { label: 'Gray', color: '#4a4a4a' },
};

const DEFAULT_LOCK_COLORS = {
  red: { label: 'Red', color: '#cc4444' },
  blue: { label: 'Blue', color: '#4444cc' },
  green: { label: 'Green', color: '#44cc44' },
  yellow: { label: 'Yellow', color: '#cccc44' },
  purple: { label: 'Purple', color: '#cc44cc' },
};

const DEFAULT_LOCK_TILES = ['door-key', 'door-card', 'item-key', 'item-card'];

// Generic toolbar icon - delegates rendering to theme
function ToolbarIcon({ type, theme, TILE_TYPES, lockColor }) {
  const canvasRef = useRef(null);

  // Check if this is an item tile that has custom rendering
  const isItemTile = type.startsWith('item-');
  const itemType = isItemTile ? type.replace('item-', '') : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);

    // For item tiles, try theme's item rendering
    if (isItemTile && itemType) {
      const itemState = { lockColor };
      const rendered = theme?.renderItem?.(ctx, itemType, 0, 0, 16, itemState);
      if (rendered) return;
    }

    // Try theme's tile rendering
    const tile = { type, config: { lockColor } };
    const rendered = theme?.renderTile?.(ctx, tile, 8, 8, 16);
    if (rendered) return;

    // Fallback: draw emoji or color block
    const emoji = theme?.getTileEmoji?.(type) ?? DEFAULT_EMOJIS[type];
    if (emoji) {
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 8, 8);
    } else {
      const def = TILE_TYPES[type];
      ctx.fillStyle = def?.color || '#666';
      ctx.fillRect(1, 1, 14, 14);
    }
  }, [type, itemType, isItemTile, lockColor, theme, TILE_TYPES]);

  return <canvas ref={canvasRef} width={16} height={16} style={{ flexShrink: 0 }} />;
}

export default function Toolbar({ selected, onSelect, floorColor, onFloorColorChange, lockColor, onLockColorChange, onTooltipChange, onTilePreview }) {
  const theme = useContext(ThemeContext);
  const { t, getTileLabel } = useLanguage();
  const TILE_TYPES = theme?.getTileTypes() || {};
  const themeId = theme?.themeId || 'forest';
  const toolbarRef = useRef(null);

  // Get colors and tile lists from theme with fallbacks
  const FLOOR_COLORS = useMemo(() => theme?.getFloorColors?.() || DEFAULT_FLOOR_COLORS, [theme]);
  const LOCK_COLORS = useMemo(() => theme?.getLockColors?.() || DEFAULT_LOCK_COLORS, [theme]);
  const LOCK_TILES = useMemo(() => theme?.getLockTiles?.() || DEFAULT_LOCK_TILES, [theme]);

  return (
    <div ref={toolbarRef} style={{
      width: 210,
      background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
      padding: 18,
      overflowY: 'auto',
      borderRight: `2px solid ${theme?.primaryColor ? `${theme.primaryColor}40` : 'rgba(100, 150, 200, 0.3)'}`,
      boxShadow: `
        inset -6px 0 20px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.05)
      `,
      backdropFilter: 'blur(10px)',
      position: 'relative',
    }}>
      <h3 style={{
        margin: '0 0 20px',
        color: theme?.primaryColor || '#aaddff',
        fontSize: 18,
        fontWeight: '800',
        textShadow: `
          0 0 20px ${theme?.primaryColor ? `${theme.primaryColor}80` : 'rgba(170, 221, 255, 0.5)'},
          0 2px 8px rgba(0, 0, 0, 0.8)
        `,
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}>
        {theme?.emoji || '🎯'} {t('toolbar.objects')}
      </h3>
      {categories.map(cat => {
        const items = Object.entries(TILE_TYPES).filter(([, def]) => def.category === cat.id);
        if (items.length === 0) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 20 }}>
            <div style={{
              color: theme?.primaryColor || '#aaddff',
              fontSize: 12,
              marginBottom: 10,
              textTransform: 'uppercase',
              fontWeight: '700',
              letterSpacing: 1,
            }}>
              {getCategoryLabel(t, cat.id)}
            </div>
            {items.map(([type, def]) => {
              const isLockTile = LOCK_TILES.includes(type);
              const isFloorTile = type === 'floor';
              const showLockColorIndicator = isLockTile && selected === type;
              const showFloorColorIndicator = isFloorTile && selected === type;

              return (
                <div key={type}>
                  <button
                    onClick={() => onSelect(type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '11px 14px',
                      marginBottom: 6,
                      background: selected === type
                        ? 'linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%)'
                        : 'linear-gradient(145deg, rgba(40, 40, 40, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)',
                      border: 'none',
                      borderRadius: 10,
                      color: selected === type ? '#ffffff' : '#e8e8e8',
                      cursor: 'pointer',
                      fontSize: 14,
                      textAlign: 'left',
                      fontWeight: selected === type ? '700' : '500',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: selected === type
                        ? `0 4px 16px rgba(100, 100, 100, 0.3), 0 0 0 2px ${theme?.primaryColor ? `${theme.primaryColor}66` : 'rgba(100, 150, 200, 0.4)'}, inset 0 2px 0 rgba(255,255,255,0.15)`
                        : '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(100, 100, 100, 0.15)',
                      transform: selected === type ? 'translateX(4px)' : 'translateX(0)',
                    }}
                    onMouseEnter={(e) => {
                      if (selected !== type) {
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(50, 50, 50, 0.8) 0%, rgba(40, 40, 40, 0.8) 100%)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 100, 100, 0.2), 0 0 0 1px rgba(100, 100, 100, 0.25)';
                      }
                      // Show tooltip if tile has tooltip text
                      if (def.tooltip && onTooltipChange) {
                        const buttonRect = e.currentTarget.getBoundingClientRect();
                        onTooltipChange({
                          text: `${getTileLabel(themeId, type, def.label)}: ${def.tooltip}`,
                          x: buttonRect.right + 10,
                          y: buttonRect.top,
                        });
                      }
                      // Show tile preview with sound
                      if (onTilePreview) {
                        soundManager.play('hover', { volume: 0.4 });
                        onTilePreview(type);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selected !== type) {
                        e.currentTarget.style.background = 'linear-gradient(145deg, rgba(40, 40, 40, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(100, 100, 100, 0.15)';
                      }
                      if (onTooltipChange) onTooltipChange(null);
                      if (onTilePreview) onTilePreview(null);
                    }}
                  >
                    <ToolbarIcon type={type} theme={theme} TILE_TYPES={TILE_TYPES} lockColor={lockColor} />
                    <span style={{ flex: 1 }}>{getTileLabel(themeId, type, def.label)}</span>
                    {showLockColorIndicator && (
                      <span style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: LOCK_COLORS[lockColor]?.color || '#cc4444',
                        border: '1px solid rgba(255,255,255,0.5)',
                        flexShrink: 0,
                      }} />
                    )}
                    {showFloorColorIndicator && (
                      <span style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: FLOOR_COLORS[floorColor]?.color || '#4a4a4a',
                        border: '1px solid rgba(255,255,255,0.5)',
                        flexShrink: 0,
                      }} />
                    )}
                  </button>

                  {/* Lock color picker inline - shows right below the selected button */}
                  {selected === type && isLockTile && onLockColorChange && (
                    <div style={{
                      marginTop: 4,
                      marginBottom: 6,
                      padding: '8px 10px',
                      background: 'linear-gradient(145deg, rgba(50, 50, 50, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)',
                      borderRadius: 8,
                      border: `2px solid ${LOCK_COLORS[lockColor]?.color || '#cc4444'}`,
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                        {Object.entries(LOCK_COLORS).map(([colorId, colorDef]) => (
                          <button
                            key={colorId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onLockColorChange(colorId);
                            }}
                            title={colorDef.label}
                            style={{
                              width: 26,
                              height: 26,
                              background: colorDef.color,
                              border: lockColor === colorId ? '3px solid #fff' : '2px solid #444',
                              borderRadius: 5,
                              cursor: 'pointer',
                              boxShadow: lockColor === colorId
                                ? '0 0 8px rgba(255,255,255,0.6)'
                                : '0 2px 4px rgba(0,0,0,0.3)',
                              transition: 'all 0.15s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Floor color picker inline - shows right below the selected floor button */}
                  {selected === type && isFloorTile && onFloorColorChange && (
                    <div style={{
                      marginTop: 4,
                      marginBottom: 6,
                      padding: '8px 10px',
                      background: 'linear-gradient(145deg, rgba(50, 50, 50, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)',
                      borderRadius: 8,
                      border: `2px solid ${FLOOR_COLORS[floorColor]?.color || '#4a4a4a'}`,
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                        {Object.entries(FLOOR_COLORS).map(([colorId, colorDef]) => (
                          <button
                            key={colorId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onFloorColorChange(colorId);
                            }}
                            title={colorDef.label}
                            style={{
                              width: 26,
                              height: 26,
                              background: colorDef.color,
                              border: floorColor === colorId ? '3px solid #fff' : '2px solid #444',
                              borderRadius: 5,
                              cursor: 'pointer',
                              boxShadow: floorColor === colorId
                                ? '0 0 8px rgba(255,255,255,0.6)'
                                : '0 2px 4px rgba(0,0,0,0.3)',
                              transition: 'all 0.15s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{
        color: '#aaaaaa',
        fontSize: 12,
        marginTop: 20,
        padding: '12px 14px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(20, 20, 20, 0.3) 100%)',
        borderRadius: 10,
        border: `1px solid ${theme?.primaryColor ? `${theme.primaryColor}33` : 'rgba(100, 100, 100, 0.2)'}`,
        lineHeight: 1.8,
        fontFamily: 'monospace',
      }}>
        <div style={{ color: theme?.primaryColor || '#aaddff', fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>{t('toolbar.controls')}</div>
        {t('toolbar.leftClick')}<br />
        {t('toolbar.rightClick')}
      </div>
    </div>
  );
}

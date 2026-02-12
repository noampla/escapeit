// Random Map Generator Panel - UI for procedural map generation
import { useState, useContext } from 'react';
import { generateRandomMap } from '../engine/randomMapGenerator';
import { ThemeContext } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

export default function RandomMapGeneratorPanel({ onGenerate, onClose }) {
  const theme = useContext(ThemeContext);
  const { t, isRTL } = useLanguage();

  const [config, setConfig] = useState({
    mapSize: 20,
    roomCount: 3,
    minRoomSize: 5,
    maxRoomSize: 10,
    minElementsPerRoom: 0,
    maxElementsPerRoom: 2,
    minDoorsPerRoom: 1,
    maxDoorsPerRoom: 2,
    seed: Date.now(),
  });

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = () => {
    setGenerating(true);
    setError(null);

    // Small delay to show generating state
    setTimeout(() => {
      const result = generateRandomMap(theme, config);

      if (result.success) {
        onGenerate(result.grid, result.missions);
        setGenerating(false);
      } else {
        setError(result.error || 'Generation failed');
        setGenerating(false);
      }
    }, 100);
  };

  const handleRandomize = () => {
    setConfig(prev => ({
      ...prev,
      seed: Date.now()
    }));
  };

  const panelStyle = {
    background: 'linear-gradient(160deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
    border: `2px solid ${theme?.primaryColor ? `${theme.primaryColor}66` : 'rgba(100, 150, 200, 0.4)'}`,
    borderRadius: 20,
    padding: '32px',
    minWidth: '450px',
    maxWidth: '600px',
    boxShadow: `
      0 25px 80px rgba(0, 0, 0, 0.9),
      0 0 0 1px ${theme?.primaryColor ? `${theme.primaryColor}33` : 'rgba(100, 150, 200, 0.2)'},
      inset 0 2px 0 rgba(255, 255, 255, 0.08)
    `,
    backdropFilter: 'blur(20px)',
    color: '#e8e8e8',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: theme?.primaryColor || '#aaddff',
    textShadow: `0 0 10px ${theme?.primaryColor ? `${theme.primaryColor}40` : 'rgba(170, 221, 255, 0.25)'}`,
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.8) 0%, rgba(30, 30, 30, 0.8) 100%)',
    border: '1px solid rgba(100, 100, 100, 0.3)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  };

  const buttonStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)',
    border: 'none',
    borderRadius: '10px',
    color: '#e8e8e8',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(100, 100, 100, 0.2)',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(145deg, ${theme?.primaryColor || '#4a7a9a'} 0%, ${theme?.primaryColor ? `${theme.primaryColor}dd` : '#3a6a8a'} 100%)`,
    boxShadow: `0 4px 16px ${theme?.primaryColor ? `${theme.primaryColor}40` : 'rgba(74, 122, 154, 0.4)'}, 0 0 0 1px ${theme?.primaryColor ? `${theme.primaryColor}66` : 'rgba(100, 150, 200, 0.4)'}`,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '800',
            color: theme?.primaryColor || '#aaddff',
            textShadow: `0 0 20px ${theme?.primaryColor ? `${theme.primaryColor}80` : 'rgba(170, 221, 255, 0.5)'}`,
            letterSpacing: '0.5px',
          }}>
            🎲 {t('builder.randomGenerator') || 'Random Map Generator'}
          </h2>
          <button
            onClick={onClose}
            style={{
              ...buttonStyle,
              padding: '8px 12px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Map Size */}
          <div>
            <label style={labelStyle}>
              {t('builder.mapSize') || 'Map Size'} ({config.mapSize}x{config.mapSize})
            </label>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={config.mapSize}
              onChange={(e) => setConfig({ ...config, mapSize: parseInt(e.target.value) })}
              style={{ ...inputStyle, padding: '4px' }}
            />
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {t('builder.mapSizeHint') || 'Total playable area (10x10 to 50x50 tiles)'}
            </div>
          </div>

          {/* Room Count */}
          <div>
            <label style={labelStyle}>
              {t('builder.roomCount') || 'Number of Rooms'} ({config.roomCount})
            </label>
            <input
              type="range"
              min="1"
              max="6"
              value={config.roomCount}
              onChange={(e) => setConfig({ ...config, roomCount: parseInt(e.target.value) })}
              style={{ ...inputStyle, padding: '4px' }}
            />
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {t('builder.roomCountHint') || '1-6 rooms will be generated'}
            </div>
          </div>

          {/* Room Size */}
          <div>
            <label style={labelStyle}>
              {t('builder.roomSize') || 'Room Size'}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                  {t('builder.minSize') || 'Min'}: {config.minRoomSize}
                </div>
                <input
                  type="range"
                  min="4"
                  max="15"
                  value={config.minRoomSize}
                  onChange={(e) => setConfig({ ...config, minRoomSize: parseInt(e.target.value) })}
                  style={{ ...inputStyle, padding: '4px', width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                  {t('builder.maxSize') || 'Max'}: {config.maxRoomSize}
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={config.maxRoomSize}
                  onChange={(e) => setConfig({ ...config, maxRoomSize: Math.max(config.minRoomSize, parseInt(e.target.value)) })}
                  style={{ ...inputStyle, padding: '4px', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Doors per Room */}
          <div>
            <label style={labelStyle}>
              {t('builder.doorsPerRoom') || 'Doors per Room'}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                  {t('builder.minDoors') || 'Min'}: {config.minDoorsPerRoom}
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={config.minDoorsPerRoom}
                  onChange={(e) => setConfig({ ...config, minDoorsPerRoom: parseInt(e.target.value) })}
                  style={{ ...inputStyle, padding: '4px', width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                  {t('builder.maxDoors') || 'Max'}: {config.maxDoorsPerRoom}
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={config.maxDoorsPerRoom}
                  onChange={(e) => setConfig({ ...config, maxDoorsPerRoom: Math.max(config.minDoorsPerRoom, parseInt(e.target.value)) })}
                  style={{ ...inputStyle, padding: '4px', width: '100%' }}
                />
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {t('builder.doorsHint') || 'Number of doors in room walls'}
            </div>
          </div>

          {/* Elements per Room */}
          <div>
            <label style={labelStyle}>
              {t('builder.elementsPerRoom') || 'Elements per Room'}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                  {t('builder.minElements') || 'Min'}: {config.minElementsPerRoom}
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={config.minElementsPerRoom}
                  onChange={(e) => setConfig({ ...config, minElementsPerRoom: parseInt(e.target.value) })}
                  style={{ ...inputStyle, padding: '4px', width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                  {t('builder.maxElements') || 'Max'}: {config.maxElementsPerRoom}
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={config.maxElementsPerRoom}
                  onChange={(e) => setConfig({ ...config, maxElementsPerRoom: Math.max(config.minElementsPerRoom, parseInt(e.target.value)) })}
                  style={{ ...inputStyle, padding: '4px', width: '100%' }}
                />
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {t('builder.elementsHint') || 'Items, obstacles, and hazards per room'}
            </div>
          </div>

          {/* Seed */}
          <div>
            <label style={labelStyle}>
              {t('builder.seed') || 'Random Seed'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                value={config.seed}
                onChange={(e) => setConfig({ ...config, seed: parseInt(e.target.value) || Date.now() })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={handleRandomize}
                style={{
                  ...buttonStyle,
                  padding: '10px 16px',
                  background: 'linear-gradient(145deg, #4a4a3a 0%, #3a3a2a 100%)',
                }}
              >
                🎲 {t('builder.randomize') || 'Randomize'}
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {t('builder.seedHint') || 'Same seed generates same map'}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              background: 'linear-gradient(145deg, rgba(120, 40, 40, 0.3) 0%, rgba(80, 20, 20, 0.3) 100%)',
              border: '1px solid rgba(255, 100, 100, 0.4)',
              borderRadius: '8px',
              color: '#ffaaaa',
              fontSize: '13px',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                ...primaryButtonStyle,
                flex: 1,
                opacity: generating ? 0.6 : 1,
                cursor: generating ? 'wait' : 'pointer',
              }}
            >
              {generating ? '⏳ Generating...' : `✨ ${t('builder.generate') || 'Generate Map'}`}
            </button>
            <button
              onClick={onClose}
              style={{
                ...buttonStyle,
                background: 'linear-gradient(145deg, #5a2a2a 0%, #4a1a1a 100%)',
              }}
            >
              {t('builder.cancel') || 'Cancel'}
            </button>
          </div>
        </div>

        {/* Info Footer */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'rgba(100, 150, 200, 0.1)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#aaaaaa',
          lineHeight: '1.6',
          border: '1px solid rgba(100, 150, 200, 0.2)',
        }}>
          <strong style={{ color: theme?.primaryColor || '#aaddff' }}>
            💡 {t('builder.generatorTip') || 'Tip'}:
          </strong>{' '}
          {t('builder.generatorHint') ||
            'The generator creates connected rooms with corridors. Start and exit points are placed automatically. You can regenerate with different settings or edit the result manually.'}
        </div>
      </div>
    </div>
  );
}

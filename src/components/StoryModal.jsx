import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../App';
import './StoryModal.css';

// Component to render a tile/item preview
function TilePreview({ theme, tileType, itemType, size = 52 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear and set background
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    // Save context state
    ctx.save();

    if (itemType) {
      // Render item - items render from top-left corner
      const rendered = theme?.renderInventoryItem?.(ctx, itemType, 0, 0, size, {});
      if (!rendered) {
        // Fallback to emoji
        const emoji = theme?.getItemEmoji?.(itemType);
        if (emoji) {
          ctx.font = `${size * 0.6}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, size / 2, size / 2);
        }
      }
    } else if (tileType) {
      // Render tile - try emoji first for tiles that have them
      const emoji = theme?.getTileEmoji?.(tileType);

      if (emoji) {
        // Use emoji (already centered correctly)
        ctx.font = `${size * 0.6}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size / 2, size / 2);
      } else {
        // Custom rendering for tiles without emojis (doors, terminals, etc.)
        // Render tiles the same way as items - directly at the given size
        const tile = { type: tileType, config: {} };
        theme?.renderTile?.(ctx, tile, 0, 0, size);
      }
    }

    // Restore context state
    ctx.restore();
  }, [theme, tileType, itemType, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block', borderRadius: '4px' }} />;
}

const StoryModal = ({ storyContent, onClose, showOnFirstLoad = false }) => {
  const [isVisible, setIsVisible] = useState(showOnFirstLoad);
  const [activeTab, setActiveTab] = useState('story');
  const theme = useContext(ThemeContext);

  // Handle close
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Show modal programmatically
  useEffect(() => {
    if (showOnFirstLoad) {
      setIsVisible(true);
    }
  }, [showOnFirstLoad]);

  if (!isVisible || !storyContent) return null;

  const { title, intro, controls, tiles, tips } = storyContent;

  return (
    <div className="story-modal-overlay" onClick={handleClose}>
      <div className="story-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="story-modal-header">
          <h1>{title}</h1>
          <button className="story-modal-close" onClick={handleClose} title="Close (ESC)">
            ✕
          </button>
        </div>

        <div className="story-modal-tabs">
          <button
            className={`story-tab ${activeTab === 'story' ? 'active' : ''}`}
            onClick={() => setActiveTab('story')}
          >
            📖 Story
          </button>
          <button
            className={`story-tab ${activeTab === 'controls' ? 'active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            🎮 Controls
          </button>
          <button
            className={`story-tab ${activeTab === 'elements' ? 'active' : ''}`}
            onClick={() => setActiveTab('elements')}
          >
            🔬 Elements
          </button>
          <button
            className={`story-tab ${activeTab === 'tips' ? 'active' : ''}`}
            onClick={() => setActiveTab('tips')}
          >
            💡 Tips
          </button>
        </div>

        <div className="story-modal-body">
          {/* Story Tab */}
          {activeTab === 'story' && (
            <div className="story-tab-content">
              <div className="story-intro">
                {intro.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph.trim()}</p>
                ))}
              </div>
            </div>
          )}

          {/* Controls Tab */}
          {activeTab === 'controls' && (
            <div className="story-tab-content">
              <h2>{controls.title}</h2>
              <div className="controls-list">
                {controls.items.map((item, i) => (
                  <div key={i} className="control-item">
                    <div className="control-key">{item.key}</div>
                    <div className="control-description">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Elements Tab */}
          {activeTab === 'elements' && (
            <div className="story-tab-content">
              <h2>{tiles.title}</h2>
              {tiles.sections.map((section, i) => (
                <div key={i} className="elements-section">
                  <h3>{section.category}</h3>
                  <div className="elements-list">
                    {section.items.map((item, j) => (
                      <div key={j} className="element-item">
                        <div className="element-icon">
                          {item.tileType || item.itemType ? (
                            <TilePreview
                              theme={theme}
                              tileType={item.tileType}
                              itemType={item.itemType}
                              size={52}
                            />
                          ) : (
                            <span style={{ fontSize: '32px' }}>{item.emoji}</span>
                          )}
                        </div>
                        <div className="element-content">
                          <div className="element-name">{item.name}</div>
                          <div className="element-description">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips Tab */}
          {activeTab === 'tips' && (
            <div className="story-tab-content">
              <h2>{tips.title}</h2>
              <ul className="tips-list">
                {tips.items.map((tip, i) => (
                  <li key={i} className="tip-item">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="story-modal-footer">
          <button className="story-modal-button" onClick={handleClose}>
            Got it! Let's play
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryModal;

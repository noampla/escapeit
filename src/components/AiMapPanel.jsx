import { useState, useEffect, useRef } from 'react';
import { generateAIMap } from '../utils/aiMapService';

// Building animation messages
const BUILDING_MESSAGES = [
  'Imagining the landscape...',
  'Placing trees and rocks...',
  'Drawing rivers and lakes...',
  'Hiding items in clever spots...',
  'Building walls and corridors...',
  'Adding hazards and challenges...',
  'Setting up the escape route...',
  'Polishing the final details...',
];

export default function AiMapPanel({ themeId, theme, onMapGenerated, onClose }) {
  const [story, setStory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buildMsg, setBuildMsg] = useState(0);
  const [dots, setDots] = useState('');
  const msgInterval = useRef(null);
  const dotsInterval = useRef(null);
  const textareaRef = useRef(null);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Rotate building messages while loading
  useEffect(() => {
    if (loading) {
      setBuildMsg(0);
      setDots('');
      msgInterval.current = setInterval(() => {
        setBuildMsg(prev => (prev + 1) % BUILDING_MESSAGES.length);
      }, 2800);
      dotsInterval.current = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
    }
    return () => {
      clearInterval(msgInterval.current);
      clearInterval(dotsInterval.current);
    };
  }, [loading]);

  const handleGenerate = async () => {
    if (!story.trim() || story.trim().length < 10) {
      setError('Please describe your map in at least a few words.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateAIMap(story, themeId, theme, difficulty);
      onMapGenerated(result.grid, result.missions || [], result.name || 'AI Generated Map');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !loading) {
      handleGenerate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, rgba(25, 20, 40, 0.99) 0%, rgba(15, 12, 30, 0.99) 100%)',
          border: '2px solid rgba(140, 100, 255, 0.35)',
          borderRadius: 20,
          padding: '36px 40px',
          width: 520,
          maxWidth: '90vw',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.9), 0 0 60px rgba(140, 100, 255, 0.08), inset 0 2px 0 rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{
            color: '#c8b0ff',
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            textShadow: '0 0 24px rgba(180, 140, 255, 0.4)',
            letterSpacing: '-0.3px',
          }}>
            AI Map Generator
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: 22,
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        {/* Loading state — full takeover */}
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0 20px',
            gap: 28,
          }}>
            {/* Animated building blocks */}
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid rgba(140, 100, 255, 0.2)',
                borderTopColor: '#a78bfa',
                borderRadius: '50%',
                animation: 'aiSpin 1s linear infinite',
              }} />
              <div style={{
                position: 'absolute',
                inset: 8,
                border: '3px solid rgba(140, 100, 255, 0.1)',
                borderBottomColor: '#c4b5fd',
                borderRadius: '50%',
                animation: 'aiSpin 1.5s linear infinite reverse',
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                animation: 'aiPulse 2s ease-in-out infinite',
              }}>
                🏗️
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#c8b0ff',
                fontSize: 17,
                fontWeight: 600,
                marginBottom: 8,
                minHeight: 26,
                transition: 'opacity 0.3s ease',
              }}>
                {BUILDING_MESSAGES[buildMsg]}{dots}
              </div>
              <div style={{ color: '#666', fontSize: 13 }}>
                This usually takes 10–20 seconds
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: 4,
              background: 'rgba(140, 100, 255, 0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #a78bfa, #c4b5fd, #a78bfa)',
                borderRadius: 2,
                animation: 'aiProgress 2.5s ease-in-out infinite',
              }} />
            </div>
          </div>
        ) : (
          <>
            {/* Story textarea */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#a898c8', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Describe your map story:
              </label>
              <textarea
                ref={textareaRef}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="A mysterious cave system with an underground lake. The player starts in a clearing surrounded by trees. They need to find a knife to fight the bear guarding the cave entrance..."
                rows={5}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  background: 'rgba(20, 15, 35, 0.9)',
                  border: '1px solid rgba(140, 100, 255, 0.2)',
                  borderRadius: 12,
                  color: '#e0d8f0',
                  fontSize: 14,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(140, 100, 255, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(140, 100, 255, 0.2)'}
              />
            </div>

            {/* Difficulty */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: '#a898c8', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                Difficulty:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      background: difficulty === d
                        ? 'linear-gradient(145deg, rgba(140, 100, 255, 0.3) 0%, rgba(100, 70, 200, 0.2) 100%)'
                        : 'rgba(20, 15, 35, 0.6)',
                      border: difficulty === d
                        ? '1.5px solid rgba(140, 100, 255, 0.5)'
                        : '1.5px solid rgba(100, 80, 150, 0.15)',
                      borderRadius: 10,
                      color: difficulty === d ? '#d4c0ff' : '#777',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'capitalize',
                    }}
                  >
                    {d === 'easy' ? '🌱' : d === 'medium' ? '🌿' : '🌲'} {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(200, 50, 50, 0.15)',
                border: '1px solid rgba(200, 50, 50, 0.3)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                color: '#f0a0a0',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleGenerate}
                disabled={!story.trim()}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: story.trim()
                    ? 'linear-gradient(145deg, #6d4aaa 0%, #5a3a96 100%)'
                    : 'rgba(60, 50, 80, 0.4)',
                  border: 'none',
                  borderRadius: 12,
                  color: story.trim() ? '#fff' : '#555',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: story.trim() ? 'pointer' : 'default',
                  transition: 'all 0.25s',
                  boxShadow: story.trim()
                    ? '0 6px 20px rgba(100, 60, 180, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                    : 'none',
                }}
              >
                Generate Map
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '14px 24px',
                  background: 'rgba(40, 35, 55, 0.8)',
                  border: '1px solid rgba(100, 80, 150, 0.2)',
                  borderRadius: 12,
                  color: '#888',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
            </div>

            {/* Hint */}
            <div style={{
              marginTop: 16,
              color: '#555',
              fontSize: 12,
              textAlign: 'center',
            }}>
              Ctrl+Enter to generate &middot; Replaces current grid (Ctrl+Z to undo)
            </div>
          </>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes aiSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes aiPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes aiProgress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

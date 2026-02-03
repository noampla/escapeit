import { useState } from 'react';
import BuilderMode from './components/BuilderMode';
import SolverMode from './components/SolverMode';
import LevelSelect from './components/LevelSelect';

export default function App() {
  const [mode, setMode] = useState('menu');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [editLevel, setEditLevel] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  if (mode === 'build') {
    return <BuilderMode onBack={() => { setMode('menu'); setEditLevel(null); }} editLevel={editLevel} />;
  }

  if (mode === 'selectLevel') {
    return (
      <LevelSelect
        onBack={() => setMode('menu')}
        onSelect={(level) => { setSelectedLevel(level); setMode('solve'); }}
        onEdit={(level) => { setEditLevel(level); setMode('build'); }}
      />
    );
  }

  if (mode === 'solve' && selectedLevel) {
    return <SolverMode level={selectedLevel} onBack={() => { setMode('menu'); setSelectedLevel(null); }} />;
  }

  const btnStyle = (btnId) => ({
    padding: '20px 60px',
    fontSize: 18,
    fontWeight: '700',
    background: hoveredBtn === btnId
      ? 'linear-gradient(145deg, #3a7a3a 0%, #2a5a2a 50%, #1a4a1a 100%)'
      : 'linear-gradient(145deg, #2a5a2a 0%, #1a4a1a 50%, #0a3a0a 100%)',
    border: 'none',
    borderRadius: 16,
    color: hoveredBtn === btnId ? '#ffffff' : '#c8e6c8',
    cursor: 'pointer',
    width: 340,
    textAlign: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: hoveredBtn === btnId
      ? '0 12px 32px rgba(68, 170, 68, 0.4), 0 0 0 3px rgba(68, 170, 68, 0.2), inset 0 2px 0 rgba(255,255,255,0.15)'
      : '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(68, 170, 68, 0.15), inset 0 2px 0 rgba(255,255,255,0.08)',
    transform: hoveredBtn === btnId ? 'translateY(-3px) scale(1.03)' : 'translateY(0)',
    position: 'relative',
    overflow: 'hidden',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a1f0a 0%, #071507 25%, #0a1a0a 50%, #050f05 100%)',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(68, 170, 68, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(68, 170, 68, 0.03) 0%, transparent 50%),
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            rgba(68, 102, 68, 0.02) 100px,
            rgba(68, 102, 68, 0.02) 200px
          )
        `,
        pointerEvents: 'none',
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '15%',
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(68, 170, 68, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: 250,
        height: 250,
        background: 'radial-gradient(circle, rgba(68, 170, 68, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'linear-gradient(160deg, rgba(20, 40, 20, 0.85) 0%, rgba(10, 25, 10, 0.75) 100%)',
        padding: '60px 90px',
        borderRadius: 28,
        boxShadow: `
          0 25px 80px rgba(0, 0, 0, 0.8),
          0 0 0 1px rgba(68, 170, 68, 0.15),
          inset 0 2px 0 rgba(255, 255, 255, 0.08)
        `,
        zIndex: 1,
        backdropFilter: 'blur(20px) saturate(1.2)',
        position: 'relative',
      }}>
        {/* Decorative corner accents */}
        <div style={{
          position: 'absolute',
          top: -2,
          left: -2,
          width: 60,
          height: 60,
          borderTop: '3px solid rgba(68, 170, 68, 0.3)',
          borderLeft: '3px solid rgba(68, 170, 68, 0.3)',
          borderRadius: '28px 0 0 0',
        }} />
        <div style={{
          position: 'absolute',
          top: -2,
          right: -2,
          width: 60,
          height: 60,
          borderTop: '3px solid rgba(68, 170, 68, 0.3)',
          borderRight: '3px solid rgba(68, 170, 68, 0.3)',
          borderRadius: '0 28px 0 0',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -2,
          left: -2,
          width: 60,
          height: 60,
          borderBottom: '3px solid rgba(68, 170, 68, 0.3)',
          borderLeft: '3px solid rgba(68, 170, 68, 0.3)',
          borderRadius: '0 0 0 28px',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 60,
          height: 60,
          borderBottom: '3px solid rgba(68, 170, 68, 0.3)',
          borderRight: '3px solid rgba(68, 170, 68, 0.3)',
          borderRadius: '0 0 28px 0',
        }} />

        <h1 style={{
          color: '#a8f0a8',
          fontSize: 54,
          marginBottom: 12,
          letterSpacing: 6,
          textShadow: `
            0 0 30px rgba(136, 221, 136, 0.6),
            0 0 60px rgba(136, 221, 136, 0.3),
            0 4px 16px rgba(0, 0, 0, 0.8)
          `,
          fontWeight: 900,
          textAlign: 'center',
          textTransform: 'uppercase',
          background: 'linear-gradient(180deg, #ffffff 0%, #a8f0a8 50%, #88dd88 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          🌲 Lost in the Forest
        </h1>

        <p style={{
          color: '#99cc99',
          fontSize: 17,
          marginBottom: 50,
          textAlign: 'center',
          letterSpacing: 2,
          textShadow: '0 2px 12px rgba(0, 0, 0, 0.8)',
          fontWeight: '500',
          textTransform: 'uppercase',
        }}>
          Build • Save • Survive
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
          <button
            style={btnStyle('build')}
            onClick={() => setMode('build')}
            onMouseEnter={() => setHoveredBtn('build')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <span style={{ fontSize: 22, marginRight: 12 }}>🏕️</span>
            Build Forest
          </button>

          <button
            style={btnStyle('solve')}
            onClick={() => setMode('selectLevel')}
            onMouseEnter={() => setHoveredBtn('solve')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <span style={{ fontSize: 22, marginRight: 12 }}>🧑</span>
            Survive Forest
          </button>
        </div>

        <div style={{
          color: '#779977',
          fontSize: 13,
          marginTop: 50,
          textAlign: 'center',
          lineHeight: 1.9,
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(10, 20, 10, 0.3) 100%)',
          padding: '20px 28px',
          borderRadius: 16,
          border: '1px solid rgba(68, 170, 68, 0.15)',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            color: '#a8f0a8',
            fontWeight: 'bold',
            marginBottom: 12,
            fontSize: 14,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}>
            How to Play
          </div>
          <div style={{ color: '#99bb99', fontSize: 13, marginBottom: 4 }}>
            Builder creates forest puzzles with trees, water, fire, bears, and missions
          </div>
          <div style={{ color: '#99bb99', fontSize: 13, marginBottom: 12 }}>
            Solver explores the forest, collects tools, and tries to escape to the car
          </div>
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(68, 170, 68, 0.15)',
            color: '#88aa88',
            fontSize: 12,
            fontFamily: 'monospace',
          }}>
            WASD/Arrows: move • E: interact • Q: drop • R: restart
          </div>
        </div>
      </div>
    </div>
  );
}

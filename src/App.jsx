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
    padding: '18px 50px', fontSize: 20, fontWeight: 'bold',
    background: hoveredBtn === btnId
      ? 'linear-gradient(135deg, #3a5a3a 0%, #2a4a2a 100%)'
      : 'linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 100%)',
    border: hoveredBtn === btnId ? '3px solid #66aa66' : '3px solid #446644',
    borderRadius: 12,
    color: hoveredBtn === btnId ? '#eeffee' : '#ddd',
    cursor: 'pointer', width: 300, textAlign: 'center',
    transition: 'all 0.2s ease',
    boxShadow: hoveredBtn === btnId
      ? '0 8px 24px rgba(68, 170, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
      : '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    transform: hoveredBtn === btnId ? 'translateY(-2px) scale(1.02)' : 'translateY(0)',
  });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh',
      background: 'radial-gradient(ellipse at center, #0f2a0f 0%, #0a1a0a 60%, #050f05 100%)',
      gap: 16,
      position: 'relative',
    }}>
      {/* Decorative forest pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 40px, rgba(68, 102, 68, 0.03) 40px, rgba(68, 102, 68, 0.03) 80px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'linear-gradient(180deg, rgba(26, 42, 26, 0.6) 0%, rgba(10, 26, 10, 0.3) 100%)',
        padding: '50px 80px',
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        border: '2px solid #335533',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
      }}>
        <h1 style={{
          color: '#88dd88',
          fontSize: 44,
          marginBottom: 8,
          letterSpacing: 3,
          textShadow: '0 4px 12px rgba(136, 204, 136, 0.4), 0 0 40px rgba(136, 221, 136, 0.2)',
          fontWeight: 900,
          textAlign: 'center',
        }}>
          🌲 LOST IN THE FOREST 🌲
        </h1>

        <p style={{
          color: '#88aa88',
          fontSize: 16,
          marginBottom: 40,
          textAlign: 'center',
          letterSpacing: 1,
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
        }}>
          Build a forest. Save it. Then survive it.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <button
            style={btnStyle('build')}
            onClick={() => setMode('build')}
            onMouseEnter={() => setHoveredBtn('build')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            🏕️ Build Forest
          </button>

          <button
            style={btnStyle('solve')}
            onClick={() => setMode('selectLevel')}
            onMouseEnter={() => setHoveredBtn('solve')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            🧑 Survive Forest
          </button>
        </div>

        <div style={{
          color: '#557755',
          fontSize: 12,
          marginTop: 40,
          textAlign: 'center',
          lineHeight: 1.9,
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '16px 20px',
          borderRadius: 8,
          border: '1px solid #2a3a2a',
        }}>
          <div style={{ color: '#77aa77', fontWeight: 'bold', marginBottom: 8 }}>HOW TO PLAY</div>
          Builder creates forest puzzles with trees, water, fire, bears, and missions.<br />
          Solver explores the forest, collects tools, and tries to escape to the car.<br />
          <div style={{ marginTop: 8, color: '#667766', fontSize: 11 }}>
            WASD/Arrows: move | E: interact | Q: drop | R: restart
          </div>
        </div>
      </div>
    </div>
  );
}

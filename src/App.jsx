import { useState } from 'react';
import BuilderMode from './components/BuilderMode';
import SolverMode from './components/SolverMode';
import LevelSelect from './components/LevelSelect';

export default function App() {
  const [mode, setMode] = useState('menu');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [editLevel, setEditLevel] = useState(null);

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

  const btnStyle = {
    padding: '16px 40px', fontSize: 18, fontWeight: 'bold',
    background: '#2a3a2a', border: '2px solid #446644', borderRadius: 8,
    color: '#ddd', cursor: 'pointer', width: 260, textAlign: 'center',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a1a0a', gap: 20,
    }}>
      <h1 style={{ color: '#88cc88', fontSize: 36, marginBottom: 0, letterSpacing: 2 }}>🌲 LOST IN THE FOREST 🌲</h1>
      <p style={{ color: '#668866', fontSize: 14, marginBottom: 30 }}>Build a forest. Save it. Then survive it.</p>

      <button style={btnStyle} onClick={() => setMode('build')}>
        🏕️ Build Forest
      </button>

      <button style={btnStyle} onClick={() => setMode('selectLevel')}>
        🧑 Survive Forest
      </button>

      <div style={{ color: '#446644', fontSize: 11, marginTop: 40, textAlign: 'center', lineHeight: 1.8 }}>
        Builder creates forest puzzles with trees, water, fire, bears, and missions.<br />
        Solver explores the forest, collects tools, and tries to escape to the car.<br />
        Keyboard: WASD/Arrows to move | E to interact | Q to drop | R to restart
      </div>
    </div>
  );
}

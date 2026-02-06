import { useState, useEffect, createContext } from 'react';
import BuilderMode from './components/BuilderMode';
import SolverMode from './components/SolverMode';
import LevelSelect from './components/LevelSelect';
import MainMenu from './components/MainMenu';
import ThemeSelect from './components/ThemeSelect';
import ThemeLoader from './engine/themeLoader';
import { migrateLevels } from './utils/storage';
import { UserProvider } from './contexts/UserContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import UserStatusBar from './components/UserStatusBar.jsx';
import DevTasksPanel from './components/DevTasksPanel.jsx';
import useDevMode from './hooks/useDevMode.js';

// Theme context for sharing theme across components
export const ThemeContext = createContext(null);

function AppContent() {
  const [mode, setMode] = useState('menu');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [editLevel, setEditLevel] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [theme, setTheme] = useState(null);

  // Dev panel easter egg (Ctrl+Shift+D or type "devmode")
  const { isDevPanelOpen, closeDevPanel } = useDevMode();

  // Run migration on mount
  useEffect(() => {
    migrateLevels();
  }, []);

  // Load theme when selected
  useEffect(() => {
    if (selectedTheme) {
      const loader = new ThemeLoader(selectedTheme);
      loader.load().then(loadedTheme => {
        setTheme(loadedTheme);
        // Apply theme data attribute to body
        document.body.dataset.theme = selectedTheme;
      }).catch(error => {
        console.error('Failed to load theme:', error);
        alert(`Failed to load theme "${selectedTheme}". Please try again.`);
        setSelectedTheme(null);
        setMode('menu');
      });
    } else {
      // Remove theme data attribute when no theme
      delete document.body.dataset.theme;
    }
  }, [selectedTheme]);

  // Main menu
  if (mode === 'menu') {
    return (
      <>
        <MainMenu
          onCreateNew={() => setMode('theme-select-build')}
          onPlayLevels={() => setMode('selectLevel')}
        />
        <DevTasksPanel isOpen={isDevPanelOpen} onClose={closeDevPanel} />
      </>
    );
  }

  // Theme selection for building
  if (mode === 'theme-select-build') {
    return (
      <>
        <ThemeSelect
          onSelectTheme={(themeId) => {
            setSelectedTheme(themeId);
            setMode('build');
          }}
          onBack={() => setMode('menu')}
        />
        <DevTasksPanel isOpen={isDevPanelOpen} onClose={closeDevPanel} />
      </>
    );
  }

  // Builder mode (needs theme loaded)
  if (mode === 'build') {
    if (!theme) {
      return <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#fff'
      }}>Loading theme...</div>;
    }

    return (
      <ThemeContext.Provider value={theme}>
        <BuilderMode
          themeId={selectedTheme}
          onBack={() => {
            setMode('menu');
            setEditLevel(null);
            setSelectedTheme(null);
            setTheme(null);
          }}
          editLevel={editLevel}
        />
        <DevTasksPanel isOpen={isDevPanelOpen} onClose={closeDevPanel} />
      </ThemeContext.Provider>
    );
  }

  // Level selection
  if (mode === 'selectLevel') {
    return (
      <>
        <LevelSelect
          onBack={() => setMode('menu')}
          onSelect={(level) => {
            setSelectedLevel(level);
            setSelectedTheme(level.themeId || 'forest'); // Fallback to forest
            setMode('solve');
          }}
          onEdit={(level) => {
            setEditLevel(level);
            setSelectedTheme(level.themeId || 'forest');
            setMode('build');
          }}
        />
        <DevTasksPanel isOpen={isDevPanelOpen} onClose={closeDevPanel} />
      </>
    );
  }

  // Solver mode (needs theme and level)
  if (mode === 'solve' && selectedLevel) {
    if (!theme) {
      return <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#fff'
      }}>Loading theme...</div>;
    }

    return (
      <ThemeContext.Provider value={theme}>
        <NotificationProvider themeColors={theme?.getNotificationColors?.()}>
          <SolverMode
            level={selectedLevel}
            onBack={() => {
              setMode('menu');
              setSelectedLevel(null);
              setSelectedTheme(null);
              setTheme(null);
            }}
          />
        </NotificationProvider>
        <DevTasksPanel isOpen={isDevPanelOpen} onClose={closeDevPanel} />
      </ThemeContext.Provider>
    );
  }

  // Fallback
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: '#fff'
    }}>
      Error: Invalid state
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <UserProvider>
        <UserStatusBar />
        <AppContent />
      </UserProvider>
    </LanguageProvider>
  );
}

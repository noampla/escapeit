import { useState, useEffect, useRef, useCallback, createContext } from 'react';
import BuilderMode from './components/BuilderMode';
import SolverMode from './components/SolverMode';
import LevelSelect from './components/LevelSelect';
import MainMenu from './components/MainMenu';
import ThemeSelect from './components/ThemeSelect';
import MultiplayerLobby from './components/MultiplayerLobby';
import ThemeLoader, { preloadAllThemeTranslations } from './engine/themeLoader';
import { migrateLevels } from './utils/storage';
import { findAllTiles } from './engine/tiles';
import { useMultiplayer } from './hooks/useMultiplayer';
import { makeRoomId } from './utils/multiplayerService';
import { UserProvider, useUser } from './contexts/UserContext.jsx';
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
  const [multiplayerConfig, setMultiplayerConfig] = useState(null);
  // ws* state: used to drive the single shared WebSocket across lobby → solve transition
  const [wsEnabled, setWsEnabled] = useState(false);
  const [wsRoomId, setWsRoomId] = useState(null);
  const [wsPlayerId, setWsPlayerId] = useState(null);
  // Lobby-specific state tracked at App level so it survives the mode transition
  const [lobbyPeers, setLobbyPeers] = useState([]);
  const [lobbyAssignedIndex, setLobbyAssignedIndex] = useState(null);
  const lobbyLaunchedRef = useState(false);
  // SolverMode registers its message handler here; forwarded from the shared WS
  const solverMsgHandlerRef = useRef(null);
  // Stable callback so SolverMode's registration effect doesn't re-fire on every App render
  const wsRegisterHandler = useCallback((fn) => { solverMsgHandlerRef.current = fn; }, []);

  const { userId } = useUser();

  // Dev panel easter egg (Ctrl+Shift+D or type "devmode")
  const { isDevPanelOpen, closeDevPanel } = useDevMode();

  // Single shared WebSocket - lives across lobby→solve transition
  const { connected: wsConnected, peers: wsPeers, send: wsSend } = useMultiplayer({
    enabled: wsEnabled,
    roomId: wsRoomId,
    playerId: wsPlayerId,
    onMessage: (msg) => {
      // Lobby: track peer list and assigned index
      if (msg.type === 'room_state') {
        setLobbyPeers(msg.players.filter(id => id !== wsPlayerId));
        const myIndex = msg.players.indexOf(wsPlayerId);
        setLobbyAssignedIndex(myIndex >= 0 ? myIndex : 0);
      } else if (msg.type === 'player_joined') {
        setLobbyPeers(prev => [...prev.filter(id => id !== msg.playerId), msg.playerId]);
      } else if (msg.type === 'player_left') {
        setLobbyPeers(prev => prev.filter(id => id !== msg.playerId));
      }
      // Forward all messages to SolverMode when it's active
      solverMsgHandlerRef.current?.(msg);
    },
  });

  // Run migration and preload theme translations on mount
  useEffect(() => {
    migrateLevels();
    preloadAllThemeTranslations();
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
        <NotificationProvider themeColors={theme?.getNotificationColors?.()}>
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
        </NotificationProvider>
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
            setMultiplayerConfig(null);
            setMode('lobby');
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

  // Lobby mode: choose solo or online (needs theme loaded to read start tiles)
  if (mode === 'lobby' && selectedLevel) {
    if (!theme) {
      return <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#fff'
      }}>Loading theme...</div>;
    }

    const startTileType = theme.getStartTile?.() || 'start';
    const startTiles = findAllTiles(selectedLevel.grid, startTileType);
    const startTileCount = startTiles.length;

    // Only 1 start tile - skip lobby, go straight to solo
    if (startTileCount < 2) {
      setMultiplayerConfig(null);
      setMode('solve');
      return null;
    }

    // Auto-launch when enough peers have joined (ws runs at App level)
    if (wsEnabled && wsPeers.length >= 1 && lobbyAssignedIndex !== null && !lobbyLaunchedRef[0]) {
      lobbyLaunchedRef[0] = true;
      setMultiplayerConfig({
        roomId: wsRoomId,
        playerId: wsPlayerId,
        assignedStartIndex: lobbyAssignedIndex,
        peers: wsPeers,
      });
      setMode('solve');
    }

    return (
      <ThemeContext.Provider value={theme}>
        <NotificationProvider themeColors={theme?.getNotificationColors?.()}>
          <MultiplayerLobby
            startTileCount={startTileCount}
            connected={wsConnected}
            peers={wsPeers}
            onSolo={() => {
              setWsEnabled(false);
              setMultiplayerConfig(null);
              setMode('solve');
            }}
            onStartOnline={() => {
              // Build a stable playerId from userId
              const pid = userId || ('player_' + Math.random().toString(36).slice(2, 9));
              setWsPlayerId(pid);
              setWsRoomId(makeRoomId(selectedLevel.id));
              setLobbyPeers([]);
              setLobbyAssignedIndex(null);
              lobbyLaunchedRef[0] = false;
              setWsEnabled(true);
            }}
            onBack={() => {
              setWsEnabled(false);
              setLobbyPeers([]);
              setLobbyAssignedIndex(null);
            }}
          />
        </NotificationProvider>
        <DevTasksPanel isOpen={isDevPanelOpen} onClose={closeDevPanel} />
      </ThemeContext.Provider>
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
            multiplayerConfig={multiplayerConfig}
            wsSend={wsSend}
            wsConnected={wsConnected}
            wsPeers={wsPeers}
            wsRegisterHandler={wsRegisterHandler}
            onBack={() => {
              solverMsgHandlerRef.current = null;
              setWsEnabled(false);
              setMode('menu');
              setSelectedLevel(null);
              setSelectedTheme(null);
              setTheme(null);
              setMultiplayerConfig(null);
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

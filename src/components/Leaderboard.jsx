// Leaderboard component - shows top scores for a puzzle
import React, { useState, useEffect } from 'react';
import {
  getTopScoresByTime,
  getTopScoresBySteps,
  formatTime
} from '../utils/leaderboardService.js';

const styles = {
  container: {
    background: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 16,
    minWidth: 280,
    maxWidth: 320,
    color: '#fff',
    fontFamily: 'monospace'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottom: '1px solid #444',
    paddingBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 0
  },
  tabs: {
    display: 'flex',
    gap: 4
  },
  tab: {
    padding: '4px 8px',
    fontSize: 11,
    background: '#333',
    border: 'none',
    borderRadius: 4,
    color: '#888',
    cursor: 'pointer'
  },
  tabActive: {
    background: '#555',
    color: '#fff'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #333',
    fontSize: 13
  },
  rowTop3: {
    background: 'rgba(255, 215, 0, 0.1)'
  },
  rank: {
    width: 24,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  medal: {
    fontSize: 14
  },
  name: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingLeft: 8
  },
  score: {
    textAlign: 'right',
    color: '#8f8',
    minWidth: 60
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontSize: 12
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: 20
  },
  expandBtn: {
    width: '100%',
    padding: '8px 0',
    marginTop: 8,
    background: '#333',
    border: 'none',
    borderRadius: 4,
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 11
  }
};

const MEDALS = ['', '1', '2', '3'];

export default function Leaderboard({ mapId, compact = false }) {
  const [tab, setTab] = useState('time'); // 'time' or 'steps'
  const [timeScores, setTimeScores] = useState([]);
  const [stepsScores, setStepsScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!mapId) return;

    async function loadScores() {
      setLoading(true);
      try {
        const [time, steps] = await Promise.all([
          getTopScoresByTime(mapId, 10),
          getTopScoresBySteps(mapId, 10)
        ]);
        setTimeScores(time);
        setStepsScores(steps);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadScores();
  }, [mapId]);

  const scores = tab === 'time' ? timeScores : stepsScores;
  const displayScores = compact && !expanded ? scores.slice(0, 3) : scores;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Leaderboard</h3>
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'time' ? styles.tabActive : {}) }}
            onClick={() => setTab('time')}
          >
            Fastest
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'steps' ? styles.tabActive : {}) }}
            onClick={() => setTab('steps')}
          >
            Least Steps
          </button>
        </div>
      </div>

      {scores.length === 0 ? (
        <div style={styles.empty}>
          No scores yet. Be the first!
        </div>
      ) : (
        <>
          <ul style={styles.list}>
            {displayScores.map((entry, idx) => (
              <li
                key={entry.id}
                style={{
                  ...styles.row,
                  ...(idx < 3 ? styles.rowTop3 : {})
                }}
              >
                <span style={styles.rank}>
                  {idx < 3 ? (
                    <span style={styles.medal}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    entry.rank
                  )}
                </span>
                <span style={styles.name}>{entry.userName}</span>
                <span style={styles.score}>
                  {tab === 'time' ? formatTime(entry.time) : `${entry.steps} steps`}
                </span>
              </li>
            ))}
          </ul>

          {compact && scores.length > 3 && (
            <button
              style={styles.expandBtn}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : `Show all (${scores.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

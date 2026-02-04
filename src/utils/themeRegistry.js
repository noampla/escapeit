// Theme Registry - List of available themes
export const AVAILABLE_THEMES = [
  {
    id: 'forest',
    name: 'Lost in the Forest',
    description: 'Escape the mystical forest',
    emoji: '🌲',
    difficulty: 'Medium',
    author: 'Original'
  },
  {
    id: 'bank-robbery',
    name: 'Bank Heist',
    description: 'Break into the vault and escape with the loot',
    emoji: '🏦',
    difficulty: 'Hard',
    author: 'Claude'
  }
];

export function getThemeById(id) {
  return AVAILABLE_THEMES.find(theme => theme.id === id);
}

export function getAllThemes() {
  return AVAILABLE_THEMES;
}

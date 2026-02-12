// Theme Registry - List of available themes
export const AVAILABLE_THEMES = [
  {
    id: 'forest',
    name: 'Lost in the Forest',
    description: 'Escape the mystical forest',
    emoji: '🌲',
    difficulty: 'Medium',
    author: 'Original',
    primaryColor: '#4a9f4a'
  },
  {
    id: 'bank-robbery',
    name: 'Bank Heist',
    description: 'Break into the vault and escape with the loot',
    emoji: '🏦',
    difficulty: 'Hard',
    author: 'Claude',
    primaryColor: '#c9a227'
  },
  {
    id: 'mad-science-lab',
    name: 'Mad Science Lab',
    description: 'Escape the lab before the experiment goes wrong',
    emoji: '🧪',
    difficulty: 'Medium',
    author: 'Claude',
    primaryColor: '#8a4fff'
  }
];

export function getThemeById(id) {
  return AVAILABLE_THEMES.find(theme => theme.id === id);
}

export function getAllThemes() {
  return AVAILABLE_THEMES;
}

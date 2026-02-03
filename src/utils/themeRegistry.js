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
  // Add more themes here as they're created
];

export function getThemeById(id) {
  return AVAILABLE_THEMES.find(theme => theme.id === id);
}

export function getAllThemes() {
  return AVAILABLE_THEMES;
}

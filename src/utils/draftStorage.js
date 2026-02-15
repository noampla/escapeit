/**
 * Draft Storage Utility
 *
 * Saves builder state to localStorage so that unsaved work survives page refreshes.
 * Draft is theme-specific - only one draft per theme is stored.
 */

const DRAFT_KEY_PREFIX = 'escapeit_draft_';

/**
 * Get the localStorage key for a theme's draft
 */
function getDraftKey(themeId) {
  return `${DRAFT_KEY_PREFIX}${themeId}`;
}

/**
 * Save draft to localStorage
 * @param {string} themeId - The theme ID
 * @param {object} draftData - The builder state to save
 */
export function saveDraft(themeId, draftData) {
  if (!themeId) return;

  try {
    const key = getDraftKey(themeId);
    const dataToSave = {
      ...draftData,
      savedAt: Date.now(),
      themeId,
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
  }
}

/**
 * Load draft from localStorage
 * @param {string} themeId - The theme ID
 * @returns {object|null} The saved draft data or null if not found
 */
export function loadDraft(themeId) {
  if (!themeId) return null;

  try {
    const key = getDraftKey(themeId);
    const data = localStorage.getItem(key);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // Verify the draft is for the correct theme
    if (parsed.themeId !== themeId) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to load draft from localStorage:', error);
    return null;
  }
}

/**
 * Check if a draft exists for a theme
 * @param {string} themeId - The theme ID
 * @returns {boolean} True if draft exists
 */
export function hasDraft(themeId) {
  if (!themeId) return false;

  try {
    const key = getDraftKey(themeId);
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Clear draft from localStorage
 * @param {string} themeId - The theme ID
 */
export function clearDraft(themeId) {
  if (!themeId) return;

  try {
    const key = getDraftKey(themeId);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear draft from localStorage:', error);
  }
}

/**
 * Get draft info without loading the full grid data
 * @param {string} themeId - The theme ID
 * @returns {object|null} Draft metadata (savedAt, levelName) or null
 */
export function getDraftInfo(themeId) {
  const draft = loadDraft(themeId);
  if (!draft) return null;

  return {
    savedAt: draft.savedAt,
    levelName: draft.levelName || 'Untitled',
    themeId: draft.themeId,
  };
}

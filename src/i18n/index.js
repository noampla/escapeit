import en from './en.json';
import he from './he.json';

const translations = { en, he };

// Dynamic theme translations - loaded when themes are loaded
const themeTranslations = {};

/**
 * Register theme-specific translations
 * Called by ThemeLoader when a theme is loaded
 * @param {string} themeId - Theme ID (e.g., 'forest', 'bank-robbery')
 * @param {string} lang - Language code ('en' or 'he')
 * @param {object} data - Translation data for the theme
 */
export function registerThemeTranslations(themeId, lang, data) {
  if (!themeTranslations[themeId]) {
    themeTranslations[themeId] = {};
  }
  themeTranslations[themeId][lang] = data;
}

/**
 * Get theme translation data
 * @param {string} themeId - Theme ID
 * @param {string} lang - Language code
 * @returns {object|null} Theme translations or null
 */
function getThemeTranslationData(themeId, lang) {
  // First check dynamically registered theme translations
  if (themeTranslations[themeId]?.[lang]) {
    return themeTranslations[themeId][lang];
  }
  // Fallback to central translations (for backwards compatibility during migration)
  return getNestedValue(translations[lang], `themes.${themeId}`);
}

/**
 * Get a nested translation value by dot-notation key
 * @param {object} obj - The translations object
 * @param {string} key - Dot-notation key like "hud.lives"
 * @returns {string} The translation or the key if not found
 */
function getNestedValue(obj, key) {
  const keys = key.split('.');
  let result = obj;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return null;
    }
  }

  return typeof result === 'string' ? result : null;
}

/**
 * Interpolate parameters into a translation string
 * @param {string} text - The translation string with {param} placeholders
 * @param {object} params - Object with param values
 * @returns {string} The interpolated string
 */
function interpolate(text, params) {
  if (!params || typeof text !== 'string') return text;

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, text);
}

/**
 * Create a translation function for a given language
 * @param {string} lang - Language code ('en' or 'he')
 * @returns {function} Translation function t(key, params)
 */
export function createTranslator(lang) {
  const langTranslations = translations[lang] || translations.en;

  return function t(key, params = {}) {
    const translation = getNestedValue(langTranslations, key);

    if (translation === null) {
      // Fallback to English if key not found in current language
      const fallback = getNestedValue(translations.en, key);
      if (fallback !== null) {
        return interpolate(fallback, params);
      }
      // Return key if not found in any language
      console.warn(`Translation missing: ${key}`);
      return key;
    }

    return interpolate(translation, params);
  };
}

/**
 * Check if language is RTL (right-to-left)
 * @param {string} lang - Language code
 * @returns {boolean} True if RTL
 */
export function isRTL(lang) {
  return lang === 'he';
}

/**
 * Get available languages
 * @returns {Array} Array of language objects
 */
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית' }
  ];
}

/**
 * Get a localized theme tile label
 * @param {string} lang - Language code
 * @param {string} themeId - Theme ID (e.g., 'forest', 'bank-robbery')
 * @param {string} tileType - Tile type key
 * @param {string} fallback - Fallback label if not found
 * @returns {string} Localized label
 */
export function getThemeTileLabel(lang, themeId, tileType, fallback) {
  // Check dynamic theme translations first
  const themeData = getThemeTranslationData(themeId, lang);
  if (themeData?.tiles?.[tileType]) {
    return themeData.tiles[tileType];
  }

  // Fallback to English
  const enThemeData = getThemeTranslationData(themeId, 'en');
  if (enThemeData?.tiles?.[tileType]) {
    return enThemeData.tiles[tileType];
  }

  return fallback || tileType;
}

/**
 * Get a localized theme item label
 * @param {string} lang - Language code
 * @param {string} themeId - Theme ID
 * @param {string} itemType - Item type key
 * @param {string} fallback - Fallback label if not found
 * @returns {string} Localized label
 */
export function getThemeItemLabel(lang, themeId, itemType, fallback) {
  // Check dynamic theme translations first
  const themeData = getThemeTranslationData(themeId, lang);
  if (themeData?.items?.[itemType]) {
    return themeData.items[itemType];
  }

  // Fallback to English
  const enThemeData = getThemeTranslationData(themeId, 'en');
  if (enThemeData?.items?.[itemType]) {
    return enThemeData.items[itemType];
  }

  return fallback || itemType;
}

/**
 * Get a localized theme name
 * @param {string} lang - Language code
 * @param {string} themeId - Theme ID
 * @param {string} fallback - Fallback name if not found
 * @returns {string} Localized theme name
 */
export function getThemeName(lang, themeId, fallback) {
  // Check dynamic theme translations first
  const themeData = getThemeTranslationData(themeId, lang);
  if (themeData?.name) {
    return themeData.name;
  }

  // Fallback to English
  const enThemeData = getThemeTranslationData(themeId, 'en');
  if (enThemeData?.name) {
    return enThemeData.name;
  }

  return fallback || themeId;
}

/**
 * Get a localized theme description
 * @param {string} lang - Language code
 * @param {string} themeId - Theme ID
 * @param {string} fallback - Fallback description if not found
 * @returns {string} Localized theme description
 */
export function getThemeDescription(lang, themeId, fallback) {
  // Check dynamic theme translations first
  const themeData = getThemeTranslationData(themeId, lang);
  if (themeData?.description) {
    return themeData.description;
  }

  // Fallback to English
  const enThemeData = getThemeTranslationData(themeId, 'en');
  if (enThemeData?.description) {
    return enThemeData.description;
  }

  return fallback || '';
}

/**
 * Get a localized theme message
 * @param {string} lang - Language code
 * @param {string} themeId - Theme ID
 * @param {string} messageKey - Message key (e.g., 'fireStep', 'bearAttack')
 * @param {object} params - Parameters for interpolation
 * @param {string} fallback - Fallback message if not found
 * @returns {string} Localized message
 */
export function getThemeMessage(lang, themeId, messageKey, params = {}, fallback = '') {
  // Check dynamic theme translations first
  let message = null;
  const themeData = getThemeTranslationData(themeId, lang);
  if (themeData?.messages?.[messageKey]) {
    message = themeData.messages[messageKey];
  }

  if (!message) {
    // Fallback to English
    const enThemeData = getThemeTranslationData(themeId, 'en');
    if (enThemeData?.messages?.[messageKey]) {
      message = enThemeData.messages[messageKey];
    }
  }

  if (!message) {
    return fallback || messageKey;
  }

  // Interpolate parameters
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, message);
}

export { translations };

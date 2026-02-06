import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createTranslator, isRTL as checkRTL, getAvailableLanguages, getThemeTileLabel, getThemeItemLabel, getThemeName, getThemeDescription, getThemeMessage } from '../i18n';

const STORAGE_KEY = 'escapeit_language';
const DEFAULT_LANG = 'en';

const LanguageContext = createContext(null);

/**
 * Language Provider component
 * Provides translation function and language switching throughout the app
 */
export function LanguageProvider({ children }) {
  // Initialize from localStorage or default
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && ['en', 'he'].includes(saved) ? saved : DEFAULT_LANG;
  });

  // Create translator for current language
  const t = useCallback(createTranslator(language), [language]);

  // Check if current language is RTL
  const isRTL = checkRTL(language);

  // Set language and persist to localStorage
  const setLanguage = useCallback((lang) => {
    if (['en', 'he'].includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  // Toggle between languages
  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'he' : 'en');
  }, [language, setLanguage]);

  // Apply RTL direction to document body
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRTL, language]);

  // Theme-specific label getters (bound to current language)
  const getTileLabel = useCallback((themeId, tileType, fallback) => {
    return getThemeTileLabel(language, themeId, tileType, fallback);
  }, [language]);

  const getItemLabel = useCallback((themeId, itemType, fallback) => {
    return getThemeItemLabel(language, themeId, itemType, fallback);
  }, [language]);

  const getLocalizedThemeName = useCallback((themeId, fallback) => {
    return getThemeName(language, themeId, fallback);
  }, [language]);

  const getLocalizedThemeDescription = useCallback((themeId, fallback) => {
    return getThemeDescription(language, themeId, fallback);
  }, [language]);

  const getMessage = useCallback((themeId, messageKey, params = {}, fallback = '') => {
    return getThemeMessage(language, themeId, messageKey, params, fallback);
  }, [language]);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isRTL,
    languages: getAvailableLanguages(),
    // Theme localization helpers
    getTileLabel,
    getItemLabel,
    getLocalizedThemeName,
    getLocalizedThemeDescription,
    getMessage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to use the language context
 * @returns {object} { language, setLanguage, toggleLanguage, t, isRTL, languages }
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook to just get the translation function (for performance)
 * @returns {function} Translation function t(key, params)
 */
export function useTranslation() {
  const { t } = useLanguage();
  return t;
}

export default LanguageContext;

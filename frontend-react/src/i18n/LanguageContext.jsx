/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from "./translations";

const LanguageContext = createContext(null);

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "vi";

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && LANGUAGES[stored]) return stored;

  const browserLanguage = window.navigator.language || "";
  return browserLanguage.toLowerCase().startsWith("en") ? "en" : "vi";
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    if (!LANGUAGES[nextLanguage]) return;
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === "vi" ? "en" : "vi"));
  }, []);

  const t = useCallback((entry) => {
    if (!entry) return "";
    if (typeof entry === "string") return entry;
    return entry[language] || entry.vi || "";
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = LANGUAGES[language].htmlLang;
    document.documentElement.dataset.language = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      currentLanguage: LANGUAGES[language],
      nextLanguage: LANGUAGES[language === "vi" ? "en" : "vi"],
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, setLanguage, t, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "@/app/components/ui";

export const LANGUAGE_STORAGE_KEY = "echocoach.language";
export const LANGUAGE_CHANGE_EVENT = "echocoach-language-change";

function readLanguageFromStorage(): Language {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "zh" ? "zh" : "en";
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Wraps the app so every page shares one live language value that updates
// immediately when the coach changes the Home page dropdown.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    readLanguageFromStorage(),
  );

  useEffect(() => {
    function syncFromStorage() {
      setLanguageState(readLanguageFromStorage());
    }

    window.addEventListener(LANGUAGE_CHANGE_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  function setLanguage(next: Language) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    setLanguageState(next);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguagePreference(): Language {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguagePreference must be used within LanguageProvider");
  }
  return ctx.language;
}

export function useSetLanguagePreference(): (next: Language) => void {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error(
      "useSetLanguagePreference must be used within LanguageProvider",
    );
  }
  return ctx.setLanguage;
}

// Handy for async callbacks — always reads the latest saved preference.
export function getLanguagePreference(): Language {
  return readLanguageFromStorage();
}

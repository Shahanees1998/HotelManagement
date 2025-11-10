"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { translationService } from "@/lib/translationService";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import zh from "./locales/zh.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import ru from "./locales/ru.json";
import pl from "./locales/pl.json";
import nl from "./locales/nl.json";
import uk from "./locales/uk.json";
import el from "./locales/el.json";
import ro from "./locales/ro.json";

const STORAGE_KEY = "hotel-management-locale";

const TRANSLATIONS = {
  en,
  ar,
  zh,
  fr,
  de,
  es,
  it,
  pt,
  ru,
  pl,
  nl,
  uk,
  el,
  ro,
} as const;

type Locale = keyof typeof TRANSLATIONS;
const LOCALES = Object.keys(TRANSLATIONS) as Locale[];

type TranslationTree = Record<string, unknown>;

export interface I18nContextValue {
  locale: Locale;
  direction: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  availableLocales: Locale[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getFromTree(tree: TranslationTree, keyPath: string[]): unknown {
  return keyPath.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as TranslationTree)[key];
    }
    return undefined;
  }, tree);
}

function resolveTranslation(locale: Locale, key: string): string | undefined {
  const segments = key.split(".");
  const localeTree = TRANSLATIONS[locale] as TranslationTree;
  const value = getFromTree(localeTree, segments);
  if (typeof value === "string") {
    return value;
  }

  const fallbackValue = getFromTree(TRANSLATIONS.en as TranslationTree, segments);
  return typeof fallbackValue === "string" ? fallbackValue : undefined;
}

interface TranslationProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

function resolveInitialLocale(defaultLocale: Locale): Locale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && stored in TRANSLATIONS) {
    return stored as Locale;
  }

  const browserLanguage = window.navigator.language?.split("-")[0]?.toLowerCase();
  if (browserLanguage && browserLanguage in TRANSLATIONS) {
    return browserLanguage as Locale;
  }

  return defaultLocale;
}

export function TranslationProvider({ children, defaultLocale = "en" }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale(defaultLocale));
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<Locale, Map<string, string>>>(() => {
    const maps = {} as Record<Locale, Map<string, string>>;
    LOCALES.forEach(code => {
      maps[code] = new Map();
    });
    return maps;
  });
  const pendingTranslations = useRef<Record<Locale, Map<string, Promise<void>>>>(
    LOCALES.reduce((acc, code) => {
      acc[code] = new Map();
      return acc;
    }, {} as Record<Locale, Map<string, Promise<void>>>)
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLocale = window.localStorage.getItem(STORAGE_KEY);
    if (storedLocale && storedLocale in TRANSLATIONS) {
      setLocaleState(storedLocale as Locale);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, locale);
    const htmlElement = window.document.documentElement;
    htmlElement.lang = locale;
    htmlElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(prevLocale => (prevLocale === newLocale ? prevLocale : newLocale));
  }, []);

  const translateDynamically = useCallback((text: string): string => {
    if (!text) {
      return "";
    }
    if (locale === "en") {
      return text;
    }

    const cached = dynamicTranslations[locale]?.get(text);
    if (cached) {
      return cached;
    }

    const localePending = pendingTranslations.current[locale];
    if (!localePending.has(text)) {
      localePending.set(
        text,
        translationService.translateText(text, locale).then(translated => {
          setDynamicTranslations(prev => {
            const cloned = new Map(prev[locale] ?? new Map());
            cloned.set(text, translated);
            return {
              ...prev,
              [locale]: cloned,
            };
          });
        }).finally(() => {
          localePending.delete(text);
        })
      );
    }

    return text;
  }, [locale, dynamicTranslations]);

  const t = useCallback((key: string) => {
    const staticTranslation = resolveTranslation(locale, key);
    if (staticTranslation) {
      return staticTranslation;
    }
    return translateDynamically(key);
  }, [locale, translateDynamically]);

  const availableLocales = useMemo(() => LOCALES, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    direction: locale === "ar" ? "rtl" : "ltr",
    setLocale,
    t,
    availableLocales,
  }), [locale, setLocale, t, availableLocales]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within a TranslationProvider");
  }

  return context;
}

export { TRANSLATIONS };
export type { Locale };


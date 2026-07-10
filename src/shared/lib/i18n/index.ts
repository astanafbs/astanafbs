import { useSyncExternalStore } from 'react';

import { en } from './en';
import { kk } from './kk';
import { ru } from './ru';

export type Locale = 'ru' | 'kk' | 'en';
export type TranslationKey = keyof typeof ru;
type Dictionary = Record<TranslationKey, string>;

const dictionaries: Record<Locale, Dictionary> = {
  ru: ru as Dictionary,
  kk: kk as Dictionary,
  en: en as Dictionary,
};
const listeners = new Set<() => void>();

let currentLocale: Locale = 'ru';

export function setLocale(locale: Locale) {
  currentLocale = locale;
  listeners.forEach((listener) => listener());
}

export function getLocale() {
  return currentLocale;
}

export function t(key: TranslationKey, params?: Record<string, string | number>) {
  const template = dictionaries[currentLocale][key] ?? ru[key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce<string>(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function useI18n() {
  const locale = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getLocale,
    getLocale,
  );

  return {
    locale,
    setLocale,
    t: (key: TranslationKey, params?: Record<string, string | number>) => {
      const template = dictionaries[locale][key] ?? ru[key] ?? key;
      if (!params) return template;
      return Object.entries(params).reduce<string>(
        (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
        template,
      );
    },
  };
}

export function locales() {
  return Object.keys(dictionaries) as Locale[];
}

export function localeLabel(locale: Locale) {
  return dictionaries[currentLocale][`language.${locale}` as TranslationKey];
}

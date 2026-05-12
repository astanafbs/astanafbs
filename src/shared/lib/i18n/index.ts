import { kk } from './kk';
import { ru } from './ru';

type Locale = 'ru' | 'kk';
type Key = keyof typeof ru;

const dictionaries = { ru, kk };

let currentLocale: Locale = 'ru';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale() {
  return currentLocale;
}

export function t(key: Key) {
  return dictionaries[currentLocale][key] ?? ru[key] ?? key;
}

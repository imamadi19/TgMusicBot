import { DEFAULT_LANGUAGE, isSupportedLanguage, languageName, languages } from './languages.js';
import { translations } from './messages.js';

function getPath(object, path) {
  return path.split('.').reduce((value, part) => value?.[part], object);
}

function format(template, params = {}) {
  return String(template).replaceAll(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
}

export { DEFAULT_LANGUAGE, isSupportedLanguage, languageName, languages };

export function t(language, key, params = {}) {
  const code = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
  const template = getPath(translations[code], key) ?? getPath(translations[DEFAULT_LANGUAGE], key) ?? key;
  return format(template, params);
}

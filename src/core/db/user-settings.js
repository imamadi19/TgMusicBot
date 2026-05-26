import { DEFAULT_LANGUAGE, isSupportedLanguage } from '../../i18n/index.js';
import { config } from '../../config/index.js';
import { db, isDatabaseConnected } from './mongo.js';

const memoryLanguages = new Map();
const memoryDefaultServices = new Map();

export const SUPPORTED_DEFAULT_SERVICES = Object.freeze({
  youtube: 'YouTube',
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  soundcloud: 'SoundCloud',
});

export function normalizeServiceName(service) {
  const input = String(service ?? '').trim();
  if (!input) return '';
  const normalized = input.toLowerCase().replace(/\s+/g, '_');
  return SUPPORTED_DEFAULT_SERVICES[normalized] || (Object.values(SUPPORTED_DEFAULT_SERVICES).find((name) => name.toLowerCase() == input.toLowerCase()) ?? '');
}

export function isSupportedService(service) {
  return Boolean(normalizeServiceName(service));
}

function fallbackDefaultService() {
  return normalizeServiceName(config.defaultService) || SUPPORTED_DEFAULT_SERVICES.youtube;
}

export async function getUserLanguage(userId) {
  const key = String(userId ?? '');
  if (!key) return DEFAULT_LANGUAGE;
  if (memoryLanguages.has(key)) return memoryLanguages.get(key);
  if (!isDatabaseConnected()) return DEFAULT_LANGUAGE;

  const settings = await db().collection('user_settings').findOne({ userId: Number(userId) });
  const language = settings?.language;
  if (isSupportedLanguage(language)) {
    memoryLanguages.set(key, language);
    return language;
  }
  return DEFAULT_LANGUAGE;
}

export async function setUserLanguage(userId, language) {
  if (!isSupportedLanguage(language)) return DEFAULT_LANGUAGE;
  const key = String(userId ?? '');
  if (key) memoryLanguages.set(key, language);
  if (key && isDatabaseConnected()) {
    await db().collection('user_settings').updateOne(
      { userId: Number(userId) },
      { $set: { language, updatedAt: new Date() }, $setOnInsert: { userId: Number(userId), createdAt: new Date() } },
      { upsert: true },
    );
  }
  return language;
}


export async function getUserDefaultService(userId) {
  const key = String(userId ?? '');
  if (!key) return fallbackDefaultService();
  if (memoryDefaultServices.has(key)) return memoryDefaultServices.get(key);
  if (!isDatabaseConnected()) return fallbackDefaultService();

  const settings = await db().collection('user_settings').findOne({ userId: Number(userId) });
  const service = normalizeServiceName(settings?.defaultService);
  if (service) {
    memoryDefaultServices.set(key, service);
    return service;
  }
  return fallbackDefaultService();
}

export async function setUserDefaultService(userId, service) {
  const normalizedService = normalizeServiceName(service);
  if (!normalizedService) return fallbackDefaultService();

  const key = String(userId ?? '');
  if (key) memoryDefaultServices.set(key, normalizedService);

  if (key && isDatabaseConnected()) {
    await db().collection('user_settings').updateOne(
      { userId: Number(userId) },
      {
        $set: { defaultService: normalizedService, updatedAt: new Date() },
        $setOnInsert: { userId: Number(userId), createdAt: new Date() },
      },
      { upsert: true },
    );
  }

  return normalizedService;
}

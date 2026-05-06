import { DEFAULT_LANGUAGE, isSupportedLanguage } from '../../i18n/index.js';
import { db, isDatabaseConnected } from './mongo.js';

const memoryLanguages = new Map();

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

import { db, isDatabaseConnected } from './mongo.js';

export const ADMIN_MODE = {
  everyone: 'everyone',
  admins: 'admins',
  nobody: 'nobody',
};

export async function getAdminMode(chatId) {
  if (!isDatabaseConnected()) return ADMIN_MODE.admins;
  const chat = await db().collection('chats').findOne({ chatId: Number(chatId) }, { projection: { adminMode: 1 } });
  return Object.values(ADMIN_MODE).includes(chat?.adminMode) ? chat.adminMode : ADMIN_MODE.admins;
}

export async function setAdminMode(chatId, mode) {
  if (!Object.values(ADMIN_MODE).includes(mode)) throw new Error(`invalid admin mode: ${mode}`);
  if (!isDatabaseConnected()) return mode;
  await db().collection('chats').updateOne(
    { chatId: Number(chatId) },
    { $set: { chatId: Number(chatId), adminMode: mode, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  return mode;
}

export async function getPlayMode(chatId) {
  if (!isDatabaseConnected()) return false;
  const chat = await db().collection('chats').findOne({ chatId: Number(chatId) }, { projection: { playMode: 1 } });
  return Boolean(chat?.playMode);
}

export async function setPlayMode(chatId, enabled) {
  if (!isDatabaseConnected()) return Boolean(enabled);
  await db().collection('chats').updateOne(
    { chatId: Number(chatId) },
    { $set: { chatId: Number(chatId), playMode: Boolean(enabled), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  return Boolean(enabled);
}

const inMemoryLyricsEnabled = new Map();
const inMemoryLyricsMode = new Map();
const inMemoryLyricsProvider = new Map();

export async function getLyricsEnabled(chatId) {
  if (!isDatabaseConnected()) {
    return Boolean(inMemoryLyricsEnabled.get(String(chatId)));
  }
  const chat = await db().collection('chats').findOne({ chatId: Number(chatId) }, { projection: { lyricsEnabled: 1 } });
  return Boolean(chat?.lyricsEnabled);
}

export async function setLyricsEnabled(chatId, enabled) {
  const isEnabled = Boolean(enabled);
  if (!isDatabaseConnected()) {
    inMemoryLyricsEnabled.set(String(chatId), isEnabled);
    return isEnabled;
  }
  await db().collection('chats').updateOne(
    { chatId: Number(chatId) },
    { $set: { chatId: Number(chatId), lyricsEnabled: isEnabled, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  return isEnabled;
}

export async function getLyricsMode(chatId) {
  if (!isDatabaseConnected()) {
    return inMemoryLyricsMode.get(String(chatId)) || 'line';
  }
  const chat = await db().collection('chats').findOne({ chatId: Number(chatId) }, { projection: { lyricsMode: 1 } });
  return chat?.lyricsMode || 'line';
}

export async function getLyricsProvider(chatId) {
  if (!isDatabaseConnected()) {
    return inMemoryLyricsProvider.get(String(chatId)) || 'lrclib';
  }
  const chat = await db().collection('chats').findOne({ chatId: Number(chatId) }, { projection: { lyricsProvider: 1 } });
  return chat?.lyricsProvider || 'lrclib';
}


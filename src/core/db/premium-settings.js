import { db } from './mongo.js';

const collection = () => db().collection('premium_chat_settings');
const DEFAULTS = { audioPreset: 'normal', crossfadeSec: 0, normalizeVolume: false, djMode: false };

export async function getPremiumSettings(chatId) {
  const row = await collection().findOne({ chatId: Number(chatId) }, { projection: { _id: 0 } });
  return { ...DEFAULTS, ...(row ?? {}), chatId: Number(chatId) };
}

export async function setPremiumAudioPreset(chatId, audioPreset) {
  await collection().updateOne({ chatId: Number(chatId) }, { $set: { chatId: Number(chatId), audioPreset, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
}

export async function setPremiumDjMode(chatId, enabled) {
  await collection().updateOne({ chatId: Number(chatId) }, { $set: { chatId: Number(chatId), djMode: Boolean(enabled), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
}

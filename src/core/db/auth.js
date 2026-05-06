import { db } from './mongo.js';

const collection = () => db().collection('auth');

function normalizeId(value) {
  return Number(value);
}

export async function getAuthUsers(chatId) {
  const rows = await collection()
    .find({ chatId: normalizeId(chatId) })
    .project({ _id: 0, userId: 1 })
    .sort({ userId: 1 })
    .toArray();
  return rows.map((row) => row.userId);
}

export async function isAuthUser(chatId, userId) {
  const count = await collection().countDocuments(
    { chatId: normalizeId(chatId), userId: normalizeId(userId) },
    { limit: 1 },
  );
  return count > 0;
}

export async function addAuthUser(chatId, userId) {
  await collection().updateOne(
    { chatId: normalizeId(chatId), userId: normalizeId(userId) },
    { $setOnInsert: { chatId: normalizeId(chatId), userId: normalizeId(userId), createdAt: new Date() } },
    { upsert: true },
  );
}

export async function removeAuthUser(chatId, userId) {
  await collection().deleteOne({ chatId: normalizeId(chatId), userId: normalizeId(userId) });
}

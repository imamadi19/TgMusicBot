import { db } from './mongo.js';

const COLLECTION = 'premium_subscriptions';

function now() {
  return new Date();
}

export async function upsertPremium({ scope, scopeId, grantedBy, days = 30 }) {
  const durationDays = Math.max(1, Number.parseInt(days, 10) || 30);
  const startedAt = now();
  const expiresAt = new Date(startedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
  await db().collection(COLLECTION).updateOne(
    { scope, scopeId: Number(scopeId) },
    {
      $set: { scope, scopeId: Number(scopeId), grantedBy: Number(grantedBy), startedAt, expiresAt, updatedAt: now() },
      $setOnInsert: { createdAt: now() },
    },
    { upsert: true },
  );
  return { scope, scopeId: Number(scopeId), expiresAt };
}

export async function revokePremium(scope, scopeId) {
  const result = await db().collection(COLLECTION).deleteOne({ scope, scopeId: Number(scopeId) });
  return result.deletedCount > 0;
}

export async function getPremium(scope, scopeId) {
  return db().collection(COLLECTION).findOne({ scope, scopeId: Number(scopeId) });
}

export async function isPremiumActive(scope, scopeId) {
  const item = await getPremium(scope, scopeId);
  return Boolean(item && new Date(item.expiresAt).getTime() > Date.now());
}

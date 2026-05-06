import { db, isDatabaseConnected } from './mongo.js';

const SETTINGS_ID = 'runtime';

export async function getLoggerStatus() {
  if (!isDatabaseConnected()) return true;
  const settings = await db().collection('system_settings').findOne({ _id: SETTINGS_ID });
  return settings?.loggerEnabled ?? true;
}

export async function setLoggerStatus(enabled) {
  if (!isDatabaseConnected()) return Boolean(enabled);
  await db().collection('system_settings').updateOne(
    { _id: SETTINGS_ID },
    { $set: { loggerEnabled: Boolean(enabled), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  return Boolean(enabled);
}

export async function clearAssistantAssignments() {
  if (!isDatabaseConnected()) return 0;
  const collections = ['assistants', 'assistant_assignments'];
  let deleted = 0;
  for (const name of collections) {
    const result = await db().collection(name).deleteMany({});
    deleted += result.deletedCount ?? 0;
  }
  return deleted;
}

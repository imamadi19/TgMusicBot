import { MongoClient } from 'mongodb';
import { config } from '../../config/index.js';

let client;
let database;

export async function connectDatabase() {
  if (!config.mongoUri) return null;
  client = new MongoClient(config.mongoUri);
  await client.connect();
  database = client.db(config.dbName);
  await Promise.all([
    database.collection('playlists').createIndex({ playlistId: 1 }, { unique: true }),
    database.collection('auth').createIndex({ chatId: 1, userId: 1 }, { unique: true }),
    database.collection('chats').createIndex({ chatId: 1 }, { unique: true }),
    database.collection('users').createIndex({ userId: 1 }, { unique: true }),
    database.collection('system_settings').createIndex({ updatedAt: -1 }),
    database.collection('user_settings').createIndex({ userId: 1 }, { unique: true }),
  ]);
  return database;
}

export function isDatabaseConnected() {
  return Boolean(database);
}

export function db() {
  if (!database) throw new Error('Database is not connected');
  return database;
}

export async function closeDatabase() {
  await client?.close();
}

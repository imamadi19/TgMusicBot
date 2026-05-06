import { db, isDatabaseConnected } from './mongo.js';

function numericId(value) {
  return Number(value);
}

function isGroupChat(chat) {
  return ['group', 'supergroup', 'channel'].includes(chat?.type);
}

export async function rememberChat(ctx) {
  if (!isDatabaseConnected()) return;

  const now = new Date();
  const operations = [];

  if (ctx.from?.id) {
    operations.push(db().collection('users').updateOne(
      { userId: numericId(ctx.from.id) },
      {
        $set: {
          userId: numericId(ctx.from.id),
          username: ctx.from.username ?? '',
          firstName: ctx.from.first_name ?? '',
          lastName: ctx.from.last_name ?? '',
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    ));
  }

  if (isGroupChat(ctx.chat)) {
    operations.push(db().collection('chats').updateOne(
      { chatId: numericId(ctx.chat.id) },
      {
        $set: {
          chatId: numericId(ctx.chat.id),
          type: ctx.chat.type,
          title: ctx.chat.title ?? '',
          username: ctx.chat.username ?? '',
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    ));
  }

  if (operations.length) await Promise.all(operations);
}

export async function getAllChats() {
  const rows = await db().collection('chats')
    .find({})
    .project({ _id: 0, chatId: 1 })
    .sort({ chatId: 1 })
    .toArray();
  return rows.map((row) => row.chatId);
}

export async function getAllUsers() {
  const rows = await db().collection('users')
    .find({})
    .project({ _id: 0, userId: 1 })
    .sort({ userId: 1 })
    .toArray();
  return rows.map((row) => row.userId);
}

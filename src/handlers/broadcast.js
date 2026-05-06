import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { InputFile } from 'grammy';
import { getAllChats, getAllUsers } from '../core/db/chat-registry.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { t } from '../i18n/index.js';
import { commandArgs, isOwner } from '../utils/telegram.js';
import { config } from '../config/index.js';

const BROADCAST_DELAY_MS = 200;
let broadcastCancelRequested = false;
let broadcastInProgress = false;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getFloodWait(error) {
  const retryAfter = error?.parameters?.retry_after
    ?? error?.error?.parameters?.retry_after
    ?? error?.payload?.parameters?.retry_after;
  if (Number.isFinite(retryAfter)) return Number(retryAfter);

  const description = String(error?.description ?? error?.message ?? '');
  const match = description.match(/retry after (\d+)/i);
  return match ? Number(match[1]) : 0;
}

export function parseBroadcastOptions(text) {
  const flags = new Set(text.split(/\s+/).map((item) => item.trim()).filter(Boolean));
  const copyMode = flags.has('-copy');
  let mode = 'both';
  if (flags.has('-chat')) mode = 'chat';
  if (flags.has('-user')) mode = 'user';
  if (flags.has('-both')) mode = 'both';
  return { copyMode, mode };
}

export function buildTargets(chats, users, mode) {
  if (mode === 'chat') return chats;
  if (mode === 'user') return users;
  return [...chats, ...users];
}

async function sendBroadcastMessage(ctx, targetId, replyMessage, copyMode) {
  if (copyMode) {
    return ctx.api.copyMessage(targetId, ctx.chat.id, replyMessage.message_id, {
      reply_markup: replyMessage.reply_markup,
    });
  }
  return ctx.api.forwardMessage(targetId, ctx.chat.id, replyMessage.message_id);
}

async function finishWithErrors(ctx, statusMessage, summary, failures) {
  if (!failures) {
    await ctx.api.editMessageText(ctx.chat.id, statusMessage.message_id, summary).catch(() => {});
    return;
  }

  const filePath = path.join(os.tmpdir(), `broadcast_errors_${Date.now()}_${process.pid}.txt`);
  try {
    await fs.writeFile(filePath, failures, 'utf8');
    await ctx.api.sendDocument(ctx.chat.id, new InputFile(filePath), { caption: summary });
    await ctx.api.deleteMessage(ctx.chat.id, statusMessage.message_id).catch(() => {});
  } catch (error) {
    console.warn('Failed to send broadcast error file', error);
    await ctx.api.editMessageText(ctx.chat.id, statusMessage.message_id, summary).catch(() => {});
  } finally {
    await fs.rm(filePath, { force: true }).catch(() => {});
  }
}

async function runBroadcast(ctx, statusMessage, replyMessage, targets, groupIds, copyMode, language) {
  let groupCount = 0;
  let userCount = 0;
  let failures = '';

  try {
    for (const targetId of targets) {
      if (broadcastCancelRequested) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          statusMessage.message_id,
          t(language, 'broadcast.stopped', { groups: groupCount, users: userCount }),
        ).catch(() => {});
        return;
      }

      try {
        await sendBroadcastMessage(ctx, targetId, replyMessage, copyMode);
        if (groupIds.has(Number(targetId))) groupCount += 1;
        else userCount += 1;
        await sleep(BROADCAST_DELAY_MS);
      } catch (error) {
        const wait = getFloodWait(error);
        if (wait > 0) {
          await sleep((wait + 30) * 1000);
          continue;
        }
        failures += `${targetId} - ${error?.description ?? error?.message ?? error}\n`;
      }
    }

    const summary = t(language, 'broadcast.ended', { groups: groupCount, users: userCount });
    await finishWithErrors(ctx, statusMessage, summary, failures);
  } finally {
    broadcastInProgress = false;
    broadcastCancelRequested = false;
  }
}

export async function cancelBroadcastHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!isOwner(ctx.from?.id, config)) return;

  if (!broadcastInProgress) {
    await ctx.reply(t(language, 'broadcast.noneInProgress'));
    return;
  }

  broadcastCancelRequested = true;
  await ctx.reply(t(language, 'broadcast.stopRequested'));
}

export async function broadcastHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!isOwner(ctx.from?.id, config)) {
    await ctx.reply(t(language, 'misc.ownerBroadcast'));
    return;
  }

  if (broadcastInProgress) {
    await ctx.reply(t(language, 'broadcast.alreadyInProgress'));
    return;
  }

  const replyMessage = ctx.message?.reply_to_message;
  if (!replyMessage) {
    await ctx.reply(t(language, 'broadcast.usage'));
    return;
  }

  const { copyMode, mode } = parseBroadcastOptions(commandArgs(ctx));
  const [chats, users] = await Promise.all([getAllChats(), getAllUsers()]);
  const targets = buildTargets(chats, users, mode);

  if (targets.length === 0) {
    await ctx.reply(t(language, 'broadcast.noTargets'));
    return;
  }

  broadcastCancelRequested = false;
  broadcastInProgress = true;
  const statusMessage = await ctx.reply(t(language, 'broadcast.started'));
  const groupIds = new Set(chats.map(Number));

  void runBroadcast(ctx, statusMessage, replyMessage, targets, groupIds, copyMode, language).catch(async (error) => {
    console.error('Broadcast failed', error);
    broadcastInProgress = false;
    broadcastCancelRequested = false;
    await ctx.api.editMessageText(
      ctx.chat.id,
      statusMessage.message_id,
      t(language, 'broadcast.failed', { error: error?.message ?? error }),
    ).catch(() => {});
  });
}

import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { getUserLanguage } from '../core/db/user-settings.js';
import { languageName, t } from '../i18n/index.js';
import { commandArgs, isOwner } from '../utils/telegram.js';
import { config } from '../config/index.js';

const startedAt = performance.now();

export async function pingHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const start = performance.now();
  const message = await ctx.reply(t(language, 'misc.pinging'));
  await ctx.api.editMessageText(ctx.chat.id, message.message_id, t(language, 'misc.pong', { ms: Math.round(performance.now() - start) }));
}

export async function statsHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const uptime = Math.floor((performance.now() - startedAt) / 1000);
  const memory = process.memoryUsage();
  await ctx.reply(t(language, 'misc.stats', { uptime, memory: Math.round(memory.rss / 1024 / 1024), cpu: os.cpus().length, node: process.version }));
}

export async function privacyHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await ctx.reply(t(language, 'misc.privacy'));
}

export async function settingsHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const text = t(language, 'misc.settings', {
    service: config.defaultService,
    limit: config.songDurationLimit,
    size: Math.round(config.maxFileSize / 1024 / 1024),
    language: languageName(language),
  });
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery(t(language, 'buttons.settings'));
    await ctx.editMessageText(text);
    return;
  }
  await ctx.reply(text);
}

export async function loggerHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await ctx.reply(t(language, 'misc.logger', { logger: config.loggerId || t(language, 'misc.notConfigured') }));
}

export async function broadcastHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!isOwner(ctx.from.id, config)) {
    await ctx.reply(t(language, 'misc.ownerBroadcast'));
    return;
  }
  const text = commandArgs(ctx);
  await ctx.reply(text ? t(language, 'misc.broadcastPending') : t(language, 'misc.broadcastUsage'));
}

export async function shellHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!isOwner(ctx.from.id, config)) {
    await ctx.reply(t(language, 'misc.ownerShell'));
    return;
  }
  await ctx.reply(t(language, 'misc.shellDisabled'));
}

export async function noopHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await ctx.reply(t(language, 'misc.noop'));
}

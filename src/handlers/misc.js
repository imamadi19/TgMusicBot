import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { commandArgs, isOwner } from '../utils/telegram.js';
import { config } from '../config/index.js';

const startedAt = performance.now();

export async function pingHandler(ctx) {
  const start = performance.now();
  const message = await ctx.reply('Pinging...');
  await ctx.api.editMessageText(ctx.chat.id, message.message_id, `Pong! ${Math.round(performance.now() - start)} ms`);
}

export async function statsHandler(ctx) {
  const uptime = Math.floor((performance.now() - startedAt) / 1000);
  const memory = process.memoryUsage();
  await ctx.reply(`Uptime: ${uptime}s\nMemory: ${Math.round(memory.rss / 1024 / 1024)} MB\nCPU: ${os.cpus().length} core(s)\nNode: ${process.version}`);
}

export async function privacyHandler(ctx) {
  await ctx.reply('Privacy: this bot stores chat settings, authorization data, and playlists required for playback. It does not sell user data.');
}

export async function settingsHandler(ctx) {
  await ctx.reply(`Settings\nDefault service: ${config.defaultService}\nSong duration limit: ${config.songDurationLimit}s\nMax file size: ${Math.round(config.maxFileSize / 1024 / 1024)} MB`);
}

export async function loggerHandler(ctx) {
  await ctx.reply(`Logger chat: ${config.loggerId || 'not configured'}`);
}

export async function broadcastHandler(ctx) {
  if (!isOwner(ctx.from.id, config)) {
    await ctx.reply('Only the owner can broadcast.');
    return;
  }
  const text = commandArgs(ctx);
  await ctx.reply(text ? 'Broadcast scheduling is preserved in the JavaScript flow; connect a chat registry before sending.' : 'Usage: /broadcast [text]');
}

export async function shellHandler(ctx) {
  if (!isOwner(ctx.from.id, config)) {
    await ctx.reply('Only the owner can use shell commands.');
    return;
  }
  await ctx.reply('Shell execution is disabled in the JavaScript rewrite for safer default deployments.');
}

export async function noopHandler(ctx) {
  await ctx.reply('Command accepted. This administrative flow is available as a JavaScript extension point.');
}

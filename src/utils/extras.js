import { config } from '../config/index.js';
import { commandArgs } from './telegram.js';

export const replyOpts = {
  parse_mode: 'HTML',
  disable_web_page_preview: true,
};

export function args(ctx) {
  return commandArgs(ctx);
}

export function senderId(ctxOrSender) {
  const sender = ctxOrSender?.message?.from ?? ctxOrSender?.from ?? ctxOrSender?.sender_chat ?? ctxOrSender;
  return Number(sender?.id ?? sender?.user_id ?? sender?.chat_id ?? 0);
}

export function firstName(ctx) {
  if (ctx.from?.first_name) return ctx.from.first_name;
  if (ctx.from?.username) return ctx.from.username;
  if (ctx.senderChat?.title) return ctx.senderChat.title;
  if (ctx.chat?.title) return ctx.chat.title;
  return 'Unknown';
}

export function isDev(ctxOrUserId) {
  const userId = typeof ctxOrUserId === 'object' ? senderId(ctxOrUserId) : Number(ctxOrUserId);
  return config.devs.includes(Number(userId)) || Number(userId) === Number(config.ownerId);
}

function parseTargetUserId(value = '') {
  const input = value.trim();
  if (!input) return null;

  const mentionLink = input.match(/<a\s+href=["']tg:\/\/user\?id=(\d+)["'][^>]*>/i);
  if (mentionLink) return Number(mentionLink[1]);

  const tgUserLink = input.match(/tg:\/\/user\?id=(\d+)/i);
  if (tgUserLink) return Number(tgUserLink[1]);

  if (/^\d+$/.test(input)) return Number(input);
  return null;
}

export async function resolveUsername(api, username) {
  const cleanUsername = String(username ?? '').trim().replace(/^@/, '');
  if (!cleanUsername) throw new Error('username cannot be empty');
  const chat = await api.getChat(`@${cleanUsername}`);
  if (!chat?.id) throw new Error(`no user found for username ${cleanUsername}`);
  return Number(chat.id);
}

export async function resolveTargetUserId(ctx) {
  const replyUserId = ctx.message?.reply_to_message?.from?.id;
  if (replyUserId) return Number(replyUserId);

  const [target = ''] = args(ctx).split(/\s+/).filter(Boolean);
  if (!target) throw new Error('no target specified: reply to a message or provide a user ID/username');

  const parsedId = parseTargetUserId(target);
  const userId = parsedId ?? await resolveUsername(ctx.api, target);
  if (Number(userId) <= 0) throw new Error(`invalid user ID: ${userId}`);
  if (Number(ctx.from?.id) === Number(userId)) throw new Error('cannot perform action on yourself');
  return Number(userId);
}

export function plural(n, unit) {
  const count = Number(n);
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

export function getFormattedDuration(value) {
  const totalSeconds = Math.max(0, Math.floor(value instanceof Date ? value.getTime() / 1000 : Number(value) || 0));
  let remaining = totalSeconds;
  const months = Math.floor(remaining / (30 * 24 * 3600));
  remaining %= 30 * 24 * 3600;
  const weeks = Math.floor(remaining / (7 * 24 * 3600));
  remaining %= 7 * 24 * 3600;
  const days = Math.floor(remaining / (24 * 3600));
  remaining %= 24 * 3600;
  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const parts = [];
  if (months > 0) parts.push(plural(months, 'month'));
  if (weeks > 0) parts.push(plural(weeks, 'week'));
  if (days > 0) parts.push(plural(days, 'day'));
  if (hours > 0) parts.push(plural(hours, 'hour'));
  if (minutes > 0) parts.push(plural(minutes, 'minute'));
  if (seconds > 0 || parts.length === 0) parts.push(plural(seconds, 'second'));
  return parts.join(' ');
}

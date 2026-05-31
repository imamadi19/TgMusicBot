import { config } from '../config/index.js';
import { chatCache } from '../core/cache/chat-cache.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { getPremium, isPremiumActive, revokePremium, upsertPremium } from '../core/db/premium.js';
import { getPremiumSettings, setPremiumAudioPreset, setPremiumDjMode } from '../core/db/premium-settings.js';
import { t } from '../i18n/index.js';
import { commandArgs, isOwner, htmlEscape } from '../utils/telegram.js';
import { isUserAdminOrAuth } from './filters.js';
import { isAuthUser } from '../core/db/auth.js';

function formatDate(value) {
  return new Date(value).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function parseArgs(ctx) {
  const [scope, idText, daysText] = commandArgs(ctx).split(/\s+/).filter(Boolean);
  const id = Number.parseInt(idText, 10);
  const days = Number.parseInt(daysText, 10);
  return { scope, id, days };
}

async function isDjOrAdmin(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const isOwnerUser = Number(userId) === Number(config.ownerId) || config.devs.includes(Number(userId));
  if (isOwnerUser) return true;
  return isUserAdminOrAuth(ctx, userId);
}

async function queueLimitForCtx(ctx) {
  const chatId = Number(ctx.chat?.id);
  const userId = Number(ctx.from?.id);
  const [chatPremium, userPremium] = await Promise.all([
    isPremiumActive('chat', chatId),
    isPremiumActive('user', userId),
  ]);
  return chatPremium || userPremium ? config.premiumQueueLimit : 10;
}

export async function premiumFeaturesHandler(ctx) {
  const text = `🌟 <b>Fitur Premium TgMusicBot</b> 🌟\n\n` +
    `1. <b>Premium Queue Limit</b>\n` +
    `   Meningkatkan batas antrean lagu dari 10 menjadi ${config.premiumQueueLimit} lagu.\n\n` +
    `2. <b>Premium Queue Move</b> (<code>/qmove &lt;dari&gt; &lt;ke&gt;</code>)\n` +
    `   Memindahkan urutan lagu dalam antrean secara instan (posisi &gt;= 2).\n\n` +
    `3. <b>Premium Audio Preset</b> (<code>/setpreset &lt;nama&gt;</code>)\n` +
    `   Mengubah efek preset audio: <code>normal</code>, <code>bass</code>, <code>nightcore</code>, atau <code>vaporwave</code>.\n\n` +
    `4. <b>Premium DJ Mode</b> (<code>/djmode on/off</code>)\n` +
    `   Membatasi kontrol playback sensitif (skip, stop, seek, volume, shuffle, dll.) hanya untuk admin, user terotorisasi, atau user premium.\n\n` +
    `5. <b>Premium Profile & Info</b> (<code>/premiuminfo</code> &amp; <code>/premiumprofile</code>)\n` +
    `   Menampilkan informasi premium user/grup dan setelan aktif secara lengkap.`;

  await ctx.reply(text, { parse_mode: 'HTML' });
}

export async function premiumGrantHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!isOwner(ctx.from?.id, config)) return ctx.reply(t(language, 'premium.ownerOnly'));
  const { scope, id, days } = parseArgs(ctx);
  if (!['user', 'chat'].includes(scope) || !Number.isFinite(id)) return ctx.reply(t(language, 'premium.grantUsage'));
  const result = await upsertPremium({ scope, scopeId: id, grantedBy: ctx.from.id, days: Number.isFinite(days) ? days : 30 });
  await ctx.reply(t(language, 'premium.granted', { scope, id: String(id), expires: formatDate(result.expiresAt) }));
}

export async function premiumRevokeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!isOwner(ctx.from?.id, config)) return ctx.reply(t(language, 'premium.ownerOnly'));
  const { scope, id } = parseArgs(ctx);
  if (!['user', 'chat'].includes(scope) || !Number.isFinite(id)) return ctx.reply(t(language, 'premium.revokeUsage'));
  const removed = await revokePremium(scope, id);
  await ctx.reply(removed ? t(language, 'premium.revoked', { scope, id: String(id) }) : t(language, 'premium.notFound', { scope, id: String(id) }));
}

export async function premiumInfoHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const argsText = commandArgs(ctx).trim();
  
  if (argsText) {
    const { scope, id } = parseArgs(ctx);
    if (!['user', 'chat'].includes(scope) || !Number.isFinite(id)) return ctx.reply(t(language, 'premium.infoUsage'));
    const item = await getPremium(scope, id);
    if (!item) return ctx.reply(t(language, 'premium.notFound', { scope, id: String(id) }));
    const active = await isPremiumActive(scope, id);
    await ctx.reply(t(language, 'premium.info', { scope, id: String(id), status: active ? 'active' : 'expired', expires: formatDate(item.expiresAt) }));
    return;
  }

  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  const chatPremium = chatId ? await isPremiumActive('chat', chatId) : false;
  const userPremium = userId ? await isPremiumActive('user', userId) : false;

  const settings = chatId ? await getPremiumSettings(chatId) : { audioPreset: 'normal', djMode: false };
  const queueLimit = await queueLimitForCtx(ctx);

  const text = `<b>Premium Status Info</b>\n\n` +
    `• <b>Chat Premium:</b> ${chatPremium ? '✅ Active' : '❌ Inactive'}\n` +
    `• <b>User Premium:</b> ${userPremium ? '✅ Active' : '❌ Inactive'}\n` +
    `• <b>Queue Limit:</b> ${queueLimit} songs\n` +
    `• <b>Preset Aktif:</b> <code>${settings.audioPreset}</code>\n` +
    `• <b>DJ Mode:</b> <code>${settings.djMode ? 'ON' : 'OFF'}</code>`;

  await ctx.reply(text, { parse_mode: 'HTML' });
}

export async function premiumQueueMoveHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const [fromText, toText] = commandArgs(ctx).split(/\s+/).filter(Boolean);
  const from = Number.parseInt(fromText, 10) - 1;
  const to = Number.parseInt(toText, 10) - 1;
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1) {
    await ctx.reply('Usage: /qmove [from>=2] [to>=2]');
    return;
  }

  const chatPremium = await isPremiumActive('chat', ctx.chat?.id);
  const userPremium = await isPremiumActive('user', ctx.from?.id);
  
  if (!chatPremium && !userPremium) {
    const isOwnerUser = Number(ctx.from?.id) === Number(config.ownerId) || config.devs.includes(Number(ctx.from?.id));
    if (!isOwnerUser) {
      await ctx.reply(t(language, 'premium.notActiveFeature'));
      return;
    }
  }

  const settings = await getPremiumSettings(ctx.chat?.id);
  if (settings.djMode) {
    const isOwnerUser = Number(ctx.from?.id) === Number(config.ownerId) || config.devs.includes(Number(ctx.from?.id));
    const auth = await isAuthUser(ctx.chat.id, ctx.from?.id) || await isUserAdminOrAuth(ctx, ctx.from?.id);
    if (!isOwnerUser && !auth && !userPremium) {
      await ctx.reply('DJ mode is enabled: only admin/auth/premium DJ can move tracks.');
      return;
    }
  }

  const queue = chatCache.getQueue(ctx.chat.id);
  if (from >= queue.length || to >= queue.length) {
    await ctx.reply(t(language, 'playback.invalidQueue'));
    return;
  }
  const moved = chatCache.remove(ctx.chat.id, from);
  chatCache.addSongAt(ctx.chat.id, moved, to);

  const updatedQueue = chatCache.getQueue(ctx.chat.id);
  const queueLines = updatedQueue.slice(0, 5).map((track, idx) => {
    return `${idx + 1}. <b>${htmlEscape(track.name)}</b>`;
  });
  if (updatedQueue.length > 5) {
    queueLines.push(`... dan ${updatedQueue.length - 5} lagu lainnya`);
  }
  const queueText = `\n\n<b>Queue Saat Ini:</b>\n${queueLines.join('\n')}`;

  await ctx.reply(`✅ Berhasil memindahkan <b>${htmlEscape(moved.name)}</b> ke posisi ${to + 1}.${queueText}`, { parse_mode: 'HTML' });
}

const ALLOWED_PRESETS = new Set(['normal', 'bass', 'nightcore', 'vaporwave']);

export async function premiumSetPresetHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatPremium = await isPremiumActive('chat', ctx.chat?.id);
  const userPremium = await isPremiumActive('user', ctx.from?.id);
  
  if (!chatPremium && !userPremium) {
    await ctx.reply(t(language, 'premium.notActiveFeature'));
    return;
  }

  const isOwnerUser = Number(ctx.from?.id) === Number(config.ownerId) || config.devs.includes(Number(ctx.from?.id));
  const auth = await isAuthUser(ctx.chat.id, ctx.from?.id) || await isUserAdminOrAuth(ctx, ctx.from?.id);
  if (!isOwnerUser && !auth && !userPremium) {
    await ctx.reply('Only admin/auth/premium DJ can change presets.');
    return;
  }

  const preset = String(commandArgs(ctx) || '').toLowerCase();
  if (!ALLOWED_PRESETS.has(preset)) {
    await ctx.reply('Usage: /setpreset [normal|bass|nightcore|vaporwave]');
    return;
  }
  await setPremiumAudioPreset(ctx.chat.id, preset);
  await ctx.reply(`✅ Premium audio preset set to <b>${preset}</b>.`, { parse_mode: 'HTML' });
}

export async function premiumDjModeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatPremium = await isPremiumActive('chat', ctx.chat?.id);
  const userPremium = await isPremiumActive('user', ctx.from?.id);
  
  if (!chatPremium && !userPremium) {
    await ctx.reply(t(language, 'premium.notActiveFeature'));
    return;
  }

  const isOwnerUser = Number(ctx.from?.id) === Number(config.ownerId) || config.devs.includes(Number(ctx.from?.id));
  const auth = await isAuthUser(ctx.chat.id, ctx.from?.id) || await isUserAdminOrAuth(ctx, ctx.from?.id);
  if (!isOwnerUser && !auth && !userPremium) {
    await ctx.reply('Only admin/auth/premium DJ can toggle DJ mode.');
    return;
  }

  const value = String(commandArgs(ctx) || '').toLowerCase();
  const enabled = ['on', 'enable', '1', 'true'].includes(value);
  const disabled = ['off', 'disable', '0', 'false'].includes(value);
  if (!enabled && !disabled) return ctx.reply('Usage: /djmode [on|off]');
  await setPremiumDjMode(ctx.chat.id, enabled);
  await ctx.reply(`✅ DJ mode ${enabled ? 'enabled' : 'disabled'}.`);
}

export async function premiumProfileHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const settings = await getPremiumSettings(ctx.chat.id);
  await ctx.reply(`<b>Premium Profile</b>\nAudio preset: <code>${settings.audioPreset}</code>\nDJ mode: <code>${settings.djMode ? 'on' : 'off'}</code>`, { parse_mode: 'HTML' });
}

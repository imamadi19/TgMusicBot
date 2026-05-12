import { config } from '../config/index.js';
import { chatCache } from '../core/cache/chat-cache.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { getPremium, isPremiumActive, revokePremium, upsertPremium } from '../core/db/premium.js';
import { getPremiumSettings, setPremiumAudioPreset, setPremiumDjMode } from '../core/db/premium-settings.js';
import { t } from '../i18n/index.js';
import { commandArgs, isOwner } from '../utils/telegram.js';

function formatDate(value) {
  return new Date(value).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function parseArgs(ctx) {
  const [scope, idText, daysText] = commandArgs(ctx).split(/\s+/).filter(Boolean);
  const id = Number.parseInt(idText, 10);
  const days = Number.parseInt(daysText, 10);
  return { scope, id, days };
}

export async function premiumFeaturesHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await ctx.reply(t(language, 'premium.features'));
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
  const { scope, id } = parseArgs(ctx);
  if (!['user', 'chat'].includes(scope) || !Number.isFinite(id)) return ctx.reply(t(language, 'premium.infoUsage'));
  const item = await getPremium(scope, id);
  if (!item) return ctx.reply(t(language, 'premium.notFound', { scope, id: String(id) }));
  const active = await isPremiumActive(scope, id);
  await ctx.reply(t(language, 'premium.info', { scope, id: String(id), status: active ? 'active' : 'expired', expires: formatDate(item.expiresAt) }));
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
    await ctx.reply(t(language, 'premium.notActiveFeature'));
    return;
  }
  const queue = chatCache.getQueue(ctx.chat.id);
  if (from >= queue.length || to >= queue.length) {
    await ctx.reply(t(language, 'playback.invalidQueue'));
    return;
  }
  const moved = chatCache.remove(ctx.chat.id, from);
  chatCache.addSongAt(ctx.chat.id, moved, to);
  await ctx.reply(`✅ Moved <b>${moved.name}</b> to position ${to + 1}.`, { parse_mode: 'HTML' });
}

const ALLOWED_PRESETS = new Set(['normal', 'bass_boost', 'vocal_boost', 'night_mode', 'clear_voice']);

export async function premiumSetPresetHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatPremium = await isPremiumActive('chat', ctx.chat?.id);
  if (!chatPremium) return ctx.reply(t(language, 'premium.notActiveFeature'));
  if (!isOwner(ctx.from?.id, config)) return ctx.reply(t(language, 'premium.ownerOnly'));
  const preset = String(commandArgs(ctx) || '').toLowerCase();
  if (!ALLOWED_PRESETS.has(preset)) {
    await ctx.reply('Usage: /setpreset [normal|bass_boost|vocal_boost|night_mode|clear_voice]');
    return;
  }
  await setPremiumAudioPreset(ctx.chat.id, preset);
  await ctx.reply(`✅ Premium audio preset set to <b>${preset}</b>.`, { parse_mode: 'HTML' });
}

export async function premiumDjModeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatPremium = await isPremiumActive('chat', ctx.chat?.id);
  if (!chatPremium) return ctx.reply(t(language, 'premium.notActiveFeature'));
  if (!isOwner(ctx.from?.id, config)) return ctx.reply(t(language, 'premium.ownerOnly'));
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
  await ctx.reply(`<b>Premium Profile</b>\nAudio preset: <code>${settings.audioPreset}</code>\nCrossfade: <code>${settings.crossfadeSec}s</code>\nNormalize volume: <code>${settings.normalizeVolume ? 'on' : 'off'}</code>\nDJ mode: <code>${settings.djMode ? 'on' : 'off'}</code>`, { parse_mode: 'HTML' });
}

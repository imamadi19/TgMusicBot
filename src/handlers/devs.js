import { chatCache } from '../core/cache/chat-cache.js';
import { clearAssistantAssignments, getLoggerStatus, setLoggerStatus } from '../core/db/system.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { voicePlayer } from '../core/player/player.js';
import { config } from '../config/index.js';
import { t } from '../i18n/index.js';
import { secondsToClock } from '../utils/duration.js';
import { commandArgs, htmlEscape } from '../utils/telegram.js';
import { isDev as isDeveloper } from '../utils/extras.js';

export function isDev(userId) {
  return isDeveloper(userId);
}

async function ensureDev(ctx, language) {
  if (isDev(ctx.from?.id)) return true;
  await ctx.reply(t(language, 'devs.devOnly'));
  return false;
}

function formatActiveTrack(track) {
  if (!track) return 'No song playing.';
  const duration = Number.isFinite(Number(track.duration)) ? secondsToClock(track.duration) : '00:00';
  return `<b>Now Playing:</b> <a href="${htmlEscape(track.url ?? '')}">${htmlEscape(track.name ?? 'Unknown')}</a> (${duration})`;
}

export function formatActiveVoiceChats(activeCalls, cache = chatCache) {
  if (activeCalls.length === 0) return null;

  const lines = [`<b>Active Voice Chats</b> (${activeCalls.length}):`, ''];
  for (const { chatId, track } of activeCalls) {
    const queueLength = cache.getQueueLength(chatId);
    const currentSong = cache.current(chatId) ?? track;
    lines.push(
      `➤ <b>Chat ID:</b> <code>${htmlEscape(chatId)}</code>`,
      `<b>Queue Size:</b> ${queueLength}`,
      formatActiveTrack(currentSong),
      '',
    );
  }

  const text = lines.join('\n');
  return text.length > 4096 ? `<b>Active Voice Chats</b> (${activeCalls.length})` : text;
}

export async function devActiveVcHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await ensureDev(ctx, language))) return;

  const text = formatActiveVoiceChats(voicePlayer.activeCalls());
  await ctx.reply(text ?? t(language, 'devs.noActiveChats'), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

export async function clearAssistantsHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await ensureDev(ctx, language))) return;

  try {
    const count = await clearAssistantAssignments();
    await ctx.reply(t(language, 'devs.clearAssistantsDone', { count }));
  } catch (error) {
    await ctx.reply(t(language, 'devs.clearAssistantsFailed', { error: error?.message ?? error }));
  }
}

export async function leaveAllHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await ensureDev(ctx, language))) return;

  const reply = await ctx.reply(t(language, 'devs.leaveAllStarted'));
  try {
    const count = voicePlayer.stopAll();
    await ctx.api.editMessageText(ctx.chat.id, reply.message_id, t(language, 'devs.leaveAllDone', { count }));
  } catch (error) {
    await ctx.api.editMessageText(ctx.chat.id, reply.message_id, t(language, 'devs.leaveAllFailed', { error: error?.message ?? error }));
  }
}

export async function loggerToggleHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await ensureDev(ctx, language))) return;

  if (!config.loggerId) {
    await ctx.reply(t(language, 'devs.loggerMissing'));
    return;
  }

  const currentStatus = await getLoggerStatus();
  const args = commandArgs(ctx).toLowerCase();
  if (!args) {
    await ctx.reply(t(language, 'devs.loggerUsage', { status: currentStatus }));
    return;
  }

  if (['enable', 'on'].includes(args)) {
    await setLoggerStatus(true);
    await ctx.reply(t(language, 'devs.loggerEnabled'));
    return;
  }

  if (['disable', 'off'].includes(args)) {
    await setLoggerStatus(false);
    await ctx.reply(t(language, 'devs.loggerDisabled'));
    return;
  }

  await ctx.reply(t(language, 'devs.loggerInvalid'));
}

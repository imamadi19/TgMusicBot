import { chatCache } from '../core/cache/chat-cache.js';
import { Downloader } from '../core/dl/downloader.js';
import { voicePlayer } from '../core/player/player.js';
import { getPlaylist } from '../core/db/playlists.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { config } from '../config/index.js';
import { t } from '../i18n/index.js';
import { commandArgs, htmlEscape, isUrl } from '../utils/telegram.js';
import { firstName } from '../utils/extras.js';
import { secondsToClock } from '../utils/duration.js';
import { controlKeyboard, supportKeyboard, youtubeSelectionKeyboard } from './keyboards.js';
import { playMode } from './filters.js';

const MAX_QUEUE = 10;
const ASSISTANT_INVITE_EXPIRE_SECONDS = 60 * 60;

function appendUniqueInviteLink(links, link) {
  const value = String(link ?? '').trim();
  if (value && !links.includes(value)) links.push(value);
}

async function ensureDownloaded(track, isVideo) {
  if (track.filePath) return track.filePath;
  const downloader = new Downloader(track.url);
  track.filePath = await downloader.download(track, isVideo);
  return track.filePath;
}

export async function createAssistantInviteLinks(ctx) {
  const links = [];

  try {
    const expireDate = Math.floor(Date.now() / 1000) + ASSISTANT_INVITE_EXPIRE_SECONDS;
    const invite = await ctx.api.createChatInviteLink(ctx.chat.id, {
      name: 'TgMusicBot assistant auto-join',
      expire_date: expireDate,
    });
    appendUniqueInviteLink(links, invite.invite_link);
  } catch (error) {
    console.warn(`Failed to create assistant invite link for chat ${ctx.chat?.id}`, error);
  }

  try {
    const chat = await ctx.api.getChat(ctx.chat.id);
    appendUniqueInviteLink(links, chat?.invite_link);
    if (chat?.username) appendUniqueInviteLink(links, `https://t.me/${chat.username}`);
  } catch (error) {
    console.warn(`Failed to fetch fallback group invite link for chat ${ctx.chat?.id}`, error);
  }

  return links;
}

async function startQueuedTrack(ctx, track, isVideo) {
  await ensureDownloaded(track, isVideo);
  return voicePlayer.play(ctx.chat.id, track, { inviteLinks: await createAssistantInviteLinks(ctx) });
}

async function startCachedTrack(chatId, track) {
  await ensureDownloaded(track, Boolean(track.isVideo));
  return voicePlayer.play(chatId, track);
}

voicePlayer.onTrackEnd(async ({ chatId, next }) => {
  if (!next) return;
  try {
    await startCachedTrack(chatId, next);
  } catch (error) {
    chatCache.shift(chatId);
    console.warn(`Failed to auto-start next track for chat ${chatId}`, error);
  }
});

function formatError(error) {
  return htmlEscape(error?.message ?? error);
}

function formatTrack(language, track, queueLength = 1) {
  const heading = queueLength > 1 ? t(language, 'playback.addedToQueue', { count: queueLength }) : t(language, 'playback.nowPlaying');
  return `<u><b>${heading}</b></u>\n\n<b>${t(language, 'playback.title')}:</b> <a href="${htmlEscape(track.url)}">${htmlEscape(track.name)}</a>\n\n<b>${t(language, 'playback.duration')}:</b> ${secondsToClock(track.duration)}\n<b>${t(language, 'playback.requestedBy')}:</b> ${htmlEscape(track.user)}`;
}

async function editStatus(ctx, message, text, options = {}) {
  return ctx.api.editMessageText(ctx.chat.id, message.message_id, text, options);
}


function formatSearchResult(language, track, index) {
  const channel = track.channel || track.channelUrl || '-';
  const lines = [
    `${index + 1}.`,
    `<b>${t(language, 'playback.title')}:</b> ${htmlEscape(track.title ?? track.name)}`,
    `<b>ChannelId:</b> ${htmlEscape(channel)}`,
    `<b>${t(language, 'playback.duration')}:</b> ${secondsToClock(track.duration)}`,
  ];
  if (track.views) lines.push(`<b>Views:</b> ${htmlEscape(track.views)}`);
  if (track.uploadAt) lines.push(`<b>Upload:</b> ${htmlEscape(track.uploadAt)}`);
  lines.push(`<b>URL:</b> <a href="${htmlEscape(track.url)}">${htmlEscape(track.url)}</a>`);
  return lines.join('\n');
}

function formatYouTubeSelection(language, tracks, page = 0, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(tracks.length / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const start = safePage * pageSize;
  const visible = tracks.slice(start, start + pageSize);
  const header = `🎵 <b>${t(language, 'playback.chooseTrack')}</b> (${safePage + 1}/${totalPages})`;
  return [header, ...visible.map((track, index) => formatSearchResult(language, track, start + index))].join('\n\n');
}

async function showYouTubeSelection(ctx, statusMessage, tracks, isVideo, language, page = 0) {
  chatCache.setYouTubeSelection(ctx.chat.id, statusMessage.message_id, {
    tracks,
    userId: ctx.from?.id,
    isVideo,
    language,
  });
  await editStatus(ctx, statusMessage, formatYouTubeSelection(language, tracks, page), {
    parse_mode: 'HTML',
    reply_markup: youtubeSelectionKeyboard(statusMessage.message_id, tracks, page),
    disable_web_page_preview: true,
  });
}

async function queueAndMaybePlay(ctx, statusMessage, track, isVideo, language) {
  const chatId = ctx.chat.id;
  const saveTrack = { ...track, user: firstName(ctx), isVideo, filePath: '', platform: track.platform ?? config.defaultService };
  if (chatCache.getTrackIfExists(chatId, saveTrack.trackId)) {
    await editStatus(ctx, statusMessage, t(language, 'playback.duplicate'));
    return;
  }
  const length = chatCache.addSong(chatId, saveTrack);
  if (length > 1) {
    await editStatus(ctx, statusMessage, formatTrack(language, saveTrack, length), { parse_mode: 'HTML', reply_markup: controlKeyboard(language), disable_web_page_preview: true });
    return;
  }

  try {
    await ensureDownloaded(saveTrack, isVideo);
  } catch (error) {
    chatCache.shift(chatId);
    await editStatus(ctx, statusMessage, t(language, 'playback.downloadFailed', { error: formatError(error) }));
    return;
  }
  try {
    await startQueuedTrack(ctx, saveTrack, isVideo);
  } catch (error) {
    chatCache.shift(chatId);
    await editStatus(ctx, statusMessage, t(language, 'playback.voiceFailed', { error: formatError(error) }));
    return;
  }
  await editStatus(ctx, statusMessage, formatTrack(language, saveTrack), { parse_mode: 'HTML', reply_markup: controlKeyboard(language), disable_web_page_preview: true });
}

export async function playHandler(ctx, isVideo = false) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await playMode(ctx))) return;
  const chatId = ctx.chat.id;
  if (chatCache.getQueueLength(chatId) >= MAX_QUEUE) {
    await ctx.reply(t(language, 'playback.queueFull'));
    return;
  }

  const input = commandArgs(ctx);
  if (!input) {
    await ctx.reply(t(language, 'playback.playUsage'), {
      parse_mode: 'HTML',
      reply_markup: supportKeyboard(language),
    });
    return;
  }

  const status = await ctx.reply(input.startsWith('tgpl_') ? t(language, 'playback.searchingPlaylist') : t(language, 'playback.searchingDownload'));

  if (input.startsWith('tgpl_')) {
    const playlist = await getPlaylist(input);
    if (!playlist) {
      await editStatus(ctx, status, t(language, 'playback.playlistNotFound'));
      return;
    }
    if (!playlist.songs?.length) {
      await editStatus(ctx, status, t(language, 'playback.playlistEmpty'));
      return;
    }
    const remaining = MAX_QUEUE - chatCache.getQueueLength(chatId);
    const tracks = playlist.songs.slice(0, remaining).map((track) => ({ ...track, user: firstName(ctx), isVideo, filePath: track.filePath ?? '', platform: track.platform ?? config.defaultService }));
    if (tracks.length === 0) {
      await editStatus(ctx, status, t(language, 'playback.queueFull'));
      return;
    }
    const queueWasEmpty = chatCache.getQueueLength(chatId) === 0;
    const length = chatCache.addSongs(chatId, tracks);
    await editStatus(ctx, status, t(language, 'playback.addedPlaylistTracks', { count: tracks.length, length }), { reply_markup: controlKeyboard(language) });
    if (queueWasEmpty) {
      try {
        await startQueuedTrack(ctx, tracks[0], isVideo);
      } catch (error) {
        chatCache.shift(chatId);
        await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error) }));
      }
    }
    return;
  }

  const downloader = new Downloader(input);
  if (isUrl(input) && !downloader.isValid()) {
    await editStatus(ctx, status, t(language, 'playback.invalidUrl'));
    return;
  }

  let info;
  try {
    info = await downloader.getInfo();
  } catch (error) {
    await editStatus(ctx, status, t(language, 'playback.fetchError', { error: formatError(error) }));
    return;
  }

  const results = info.results ?? [];
  const [track] = results;
  if (!track) {
    await editStatus(ctx, status, t(language, 'playback.noTracks'));
    return;
  }
  if (info.selectionRequired && results.length > 1) {
    await showYouTubeSelection(ctx, status, results, isVideo, language);
    return;
  }
  await queueAndMaybePlay(ctx, status, track, isVideo, language);
}

export async function queueHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const queue = chatCache.getQueue(ctx.chat.id);
  if (queue.length === 0) {
    await ctx.reply(t(language, 'playback.queueEmpty'));
    return;
  }
  const lines = queue.map((track, index) => `${index + 1}. ${track.name} (${secondsToClock(track.duration)}) — ${track.user}`);
  await ctx.reply(`<b>${t(language, 'playback.queueTitle')}</b>\n${htmlEscape(lines.join('\n'))}`, { parse_mode: 'HTML' });
}

export async function skipHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const { skipped, next } = voicePlayer.skip(ctx.chat.id);
  if (!skipped) {
    await ctx.reply(t(language, 'playback.nothingPlaying'));
    return;
  }
  if (!next) {
    await ctx.reply(t(language, 'playback.skippedEnded', { skipped: skipped.name }));
    return;
  }
  try {
    await startQueuedTrack(ctx, next, next.isVideo);
    await ctx.reply(t(language, 'playback.skippedNow', { skipped: skipped.name, next: next.name }));
  } catch (error) {
    chatCache.shift(ctx.chat.id);
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error) }));
  }
}

export async function stopHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  voicePlayer.stop(ctx.chat.id);
  await ctx.reply(t(language, 'playback.stopped'));
}

export async function pauseHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  voicePlayer.pause(ctx.chat.id);
  await ctx.reply(t(language, 'playback.paused'));
}

export async function resumeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  voicePlayer.resume(ctx.chat.id);
  await ctx.reply(t(language, 'playback.resumed'));
}

export async function removeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const index = Number.parseInt(commandArgs(ctx), 10) - 1;
  if (!Number.isInteger(index)) {
    await ctx.reply(t(language, 'playback.removeUsage'));
    return;
  }
  const removed = chatCache.remove(ctx.chat.id, index);
  await ctx.reply(removed ? t(language, 'playback.removed', { name: removed.name }) : t(language, 'playback.invalidQueue'));
}

export async function loopHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const count = chatCache.setLoop(ctx.chat.id, commandArgs(ctx));
  await ctx.reply(t(language, 'playback.loopSet', { count }));
}

export async function muteHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  chatCache.setMuted(ctx.chat.id, true);
  await ctx.reply(t(language, 'playback.muted'));
}

export async function unmuteHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  chatCache.setMuted(ctx.chat.id, false);
  await ctx.reply(t(language, 'playback.unmuted'));
}

export async function speedHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const speed = chatCache.setSpeed(ctx.chat.id, commandArgs(ctx));
  await ctx.reply(t(language, 'playback.speedSet', { speed }));
}

export async function activeVcHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const active = voicePlayer.activeCalls();
  await ctx.reply(active.length ? active.map(({ chatId, track }) => `${chatId}: ${track.name}`).join('\n') : t(language, 'playback.noActive'));
}


export async function youtubeSelectionPageHandler(ctx) {
  const data = ctx.callbackQuery?.data ?? '';
  const [, messageId, pageText] = data.split(':');
  const selection = chatCache.getYouTubeSelection(ctx.chat.id, messageId);
  if (!selection) {
    await ctx.answerCallbackQuery({ text: t(await getUserLanguage(ctx.from?.id), 'playback.selectionExpired') }).catch(() => {});
    return;
  }
  if (selection.userId && selection.userId !== ctx.from?.id) {
    await ctx.answerCallbackQuery({ text: t(selection.language, 'playback.selectionOwnerOnly') }).catch(() => {});
    return;
  }
  const page = Number.parseInt(pageText, 10) || 0;
  await ctx.answerCallbackQuery().catch(() => {});
  await ctx.editMessageText(formatYouTubeSelection(selection.language, selection.tracks, page), {
    parse_mode: 'HTML',
    reply_markup: youtubeSelectionKeyboard(messageId, selection.tracks, page),
    disable_web_page_preview: true,
  });
}

export async function youtubeSelectionPickHandler(ctx) {
  const data = ctx.callbackQuery?.data ?? '';
  const [, messageId, indexText] = data.split(':');
  const selection = chatCache.getYouTubeSelection(ctx.chat.id, messageId);
  if (!selection) {
    await ctx.answerCallbackQuery({ text: t(await getUserLanguage(ctx.from?.id), 'playback.selectionExpired') }).catch(() => {});
    return;
  }
  if (selection.userId && selection.userId !== ctx.from?.id) {
    await ctx.answerCallbackQuery({ text: t(selection.language, 'playback.selectionOwnerOnly') }).catch(() => {});
    return;
  }
  if (chatCache.getQueueLength(ctx.chat.id) >= MAX_QUEUE) {
    await ctx.answerCallbackQuery({ text: t(selection.language, 'playback.queueFull') }).catch(() => {});
    return;
  }

  const index = Number.parseInt(indexText, 10);
  const track = selection.tracks[index];
  if (!track) {
    await ctx.answerCallbackQuery({ text: t(selection.language, 'playback.invalidSelection') }).catch(() => {});
    return;
  }

  chatCache.deleteYouTubeSelection(ctx.chat.id, messageId);
  await ctx.answerCallbackQuery({ text: t(selection.language, 'playback.trackSelected', { number: index + 1 }) }).catch(() => {});
  const statusMessage = ctx.callbackQuery.message;
  await editStatus(ctx, statusMessage, t(selection.language, 'playback.downloadingSelected', { title: htmlEscape(track.name) }), { parse_mode: 'HTML' });
  await queueAndMaybePlay(ctx, statusMessage, track, Boolean(selection.isVideo), selection.language);
}

import { chatCache } from '../core/cache/chat-cache.js';
import { Downloader } from '../core/dl/downloader.js';
import { cleanupTrackDownload, cleanupTrackDownloads, ensureTrackDownloaded, preloadTrack, preloadTracks } from '../core/dl/queue-downloads.js';
import { requesterKey, voicePlayer } from '../core/player/player.js';
import { getPlaylist } from '../core/db/playlists.js';
import { isPremiumActive } from '../core/db/premium.js';
import { getPremiumSettings } from '../core/db/premium-settings.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { config } from '../config/index.js';
import { t } from '../i18n/index.js';
import { commandArgs, htmlEscape, isUrl } from '../utils/telegram.js';
import { firstName } from '../utils/extras.js';
import { secondsToClock } from '../utils/duration.js';
import { completedProgressKeyboard, controlKeyboard, supportKeyboard, youtubeSelectionKeyboard } from './keyboards.js';
import { playMode } from './filters.js';
import { isAuthUser } from '../core/db/auth.js';

const MAX_QUEUE = 10;
const PREMIUM_MAX_QUEUE = 50;
const ASSISTANT_INVITE_EXPIRE_SECONDS = 60 * 60;
const PROGRESS_UPDATE_INTERVAL_MS = 10000;
const PANEL_EDIT_MIN_INTERVAL_MS = 1200;

const progressUpdaters = new Map();
const playbackPanels = new Map();
const chatTasks = new Map();
const panelEditTasks = new Map();
const panelEditLastAt = new Map();
const recentPlayRequests = new Map();
const FREE_PLAY_COOLDOWN_MS = 5000;

function appendUniqueInviteLink(links, link) {
  const value = String(link ?? '').trim();
  if (value && !links.includes(value)) links.push(value);
}


function enqueueChatTask(chatId, label, task) {
  const key = String(chatId);
  const previous = chatTasks.get(key) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(task)
    .catch((error) => console.warn(`${label} gagal untuk chat ${key}`, error))
    .finally(() => {
      if (chatTasks.get(key) === next) chatTasks.delete(key);
    });
  chatTasks.set(key, next);
  return next;
}

async function ensureDownloaded(track, isVideo) {
  return ensureTrackDownloaded(track, isVideo);
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
  return voicePlayer.play(chatId, track, { reuseActive: true });
}

function stopProgressUpdater(chatId) {
  const key = String(chatId);
  const timer = progressUpdaters.get(key);
  if (timer) clearInterval(timer);
  progressUpdaters.delete(key);
}

function panelKey(chatId, track) {
  return `${String(chatId)}:${String(track?.trackId ?? track?.url ?? track?.name ?? '')}`;
}

function panelMessageKey(panel) {
  return `${String(panel?.chatId ?? '')}:${String(panel?.messageId ?? '')}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(error) {
  const retryAfter = Number(error?.parameters?.retry_after);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter;
  const description = String(error?.description ?? error?.message ?? '');
  const matched = description.match(/retry after\s+(\d+)/i);
  return matched ? Number(matched[1]) : 0;
}

function enqueuePanelEdit(panel, task) {
  const key = panelMessageKey(panel);
  if (!key || !panel?.messageId) return task();
  const previous = panelEditTasks.get(key) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(async () => {
      const lastAt = panelEditLastAt.get(key) ?? 0;
      const waitMs = Math.max(0, PANEL_EDIT_MIN_INTERVAL_MS - (Date.now() - lastAt));
      if (waitMs > 0) await delay(waitMs);
      const result = await task();
      panelEditLastAt.set(key, Date.now());
      return result;
    })
    .finally(() => {
      if (panelEditTasks.get(key) === next) panelEditTasks.delete(key);
    });
  panelEditTasks.set(key, next);
  return next;
}

export function rememberPlaybackPanel(ctx, message, language, track) {
  const chatId = ctx.chat?.id;
  if (!chatId || !message?.message_id || !track) return;
  playbackPanels.set(panelKey(chatId, track), {
    api: ctx.api,
    chatId,
    messageId: message.message_id,
    language,
    track,
    prefersCaption: Boolean(message.photo?.length || message.video || message.audio || message.document || message.animation),
  });
}

function forgetPlaybackPanel(chatId, track) {
  playbackPanels.delete(panelKey(chatId, track));
}

async function editPanelMarkup(panel, replyMarkup) {
  if (!panel?.api || !panel?.messageId) return false;
  return enqueuePanelEdit(panel, async () => {
    try {
      await panel.api.editMessageReplyMarkup(panel.chatId, panel.messageId, { reply_markup: replyMarkup });
      return true;
    } catch (error) {
      const description = String(error?.description ?? error?.message ?? error).toLowerCase();
      if (description.includes('message is not modified')) return true;
      const retryAfter = parseRetryAfterSeconds(error);
      if (retryAfter > 0) {
        await delay((retryAfter * 1000) + 250);
        await panel.api.editMessageReplyMarkup(panel.chatId, panel.messageId, { reply_markup: replyMarkup });
        return true;
      }
      console.warn(`Failed to edit playback controls for chat ${panel.chatId}`, error);
      return false;
    }
  });
}

async function setPlaybackPanelState(chatId, track, state = 'playing', { activeTrack = null, completed = false } = {}) {
  const panel = playbackPanels.get(panelKey(chatId, track));
  if (!panel) return false;
  panel.track = track;
  const replyMarkup = (completed || state === 'stopped')
    ? completedProgressKeyboard(track)
    : controlKeyboard(panel.language, state, activeTrack ?? track);
  const edited = await editPanelTextAndMarkup(panel, formatTrack(panel.language, track, 1, state), replyMarkup);
  if (completed) forgetPlaybackPanel(chatId, track);
  return edited;
}

async function markPlaybackPanelCompleted(chatId, track, withText = false) {
  if (withText) return setPlaybackPanelState(chatId, track, 'completed', { completed: true });
  const panel = playbackPanels.get(panelKey(chatId, track));
  if (!panel) return false;
  const edited = await editPanelMarkup(panel, completedProgressKeyboard(track));
  forgetPlaybackPanel(chatId, track);
  return edited;
}

export async function markPlaybackPanelStatus(chatId, track, state = 'playing', activeTrack = null) {
  return setPlaybackPanelState(chatId, track, state, { activeTrack });
}

async function activatePlaybackPanel(chatId, track, activeTrack) {
  const panel = playbackPanels.get(panelKey(chatId, track));
  if (!panel) return false;
  const sentMessage = await panel.api.sendMessage(panel.chatId, formatTrack(panel.language, track, 1, 'playing'), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: controlKeyboard(panel.language, '', activeTrack),
  }).catch((error) => {
    console.warn(`Failed to send new playback panel for chat ${panel.chatId}`, error);
    return null;
  });
  if (!sentMessage?.message_id) return false;

  const oldKey = panelKey(chatId, track);
  playbackPanels.set(oldKey, {
    ...panel,
    messageId: sentMessage.message_id,
    track,
    prefersCaption: false,
  });
  startProgressUpdater({ chat: { id: panel.chatId }, api: panel.api }, { message_id: sentMessage.message_id }, panel.language);
  return true;
}

async function editPanelTextAndMarkup(panel, text, replyMarkup) {
  if (!panel?.api || !panel?.messageId) return false;
  const safeText = String(text ?? '').slice(0, 4096);
  const safeCaption = safeText.slice(0, 1024);

  const editText = () => panel.api.editMessageText(panel.chatId, panel.messageId, safeText, {
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
  const editCaption = () => panel.api.editMessageCaption(panel.chatId, panel.messageId, {
    caption: safeCaption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });

  return enqueuePanelEdit(panel, async () => {
    try {
      if (panel.prefersCaption) {
        await editCaption();
      } else {
        await editText();
      }
      return true;
    } catch (error) {
      const description = String(error?.description ?? error?.message ?? error).toLowerCase();
      if (description.includes('message is not modified')) return true;

      try {
        if (panel.prefersCaption || description.includes('there is no text in the message')) {
          await editCaption();
          panel.prefersCaption = true;
        } else {
          await editText();
          panel.prefersCaption = false;
        }
        return true;
      } catch (fallbackError) {
        const fallbackDescription = String(fallbackError?.description ?? fallbackError?.message ?? fallbackError).toLowerCase();
        if (fallbackDescription.includes('message is not modified')) return true;
        const retryAfter = parseRetryAfterSeconds(fallbackError);
        if (retryAfter > 0) {
          await delay((retryAfter * 1000) + 250);
          if (panel.prefersCaption) await editCaption();
          else await editText();
          return true;
        }
        console.warn(`Failed to edit playback panel for chat ${panel.chatId}`, {
          primaryError: error,
          fallbackError,
        });
        return false;
      }
    }
  });
}

export async function updatePlaybackPanelsForAdvance(chatId, finished, next, activeTrack) {
  const completed = await markPlaybackPanelCompleted(chatId, finished, !next);
  if (!next) {
    stopProgressUpdater(chatId);
    return { completed, activated: false };
  }
  const activated = await activatePlaybackPanel(chatId, next, activeTrack);
  return { completed, activated };
}

function startProgressUpdaterFromPanel(panel) {
  if (!panel?.api || !panel?.messageId) return;
  startProgressUpdater({ chat: { id: panel.chatId }, api: panel.api }, { message_id: panel.messageId }, panel.language);
}

function startProgressUpdater(ctx, message, language) {
  const chatId = ctx.chat?.id;
  if (!chatId || !message?.message_id) return;
  const key = String(chatId);
  stopProgressUpdater(key);
  const timer = setInterval(async () => {
    const activeTrack = voicePlayer.activeTrack(key);
    if (!activeTrack) {
      if (chatCache.getQueueLength(key) === 0) stopProgressUpdater(key);
      return;
    }
    if (chatCache.isPaused(key)) return;
    try {
      await ctx.api.editMessageReplyMarkup(chatId, message.message_id, {
        reply_markup: controlKeyboard(language, '', activeTrack),
      });
    } catch (error) {
      const description = String(error?.description ?? error?.message ?? error).toLowerCase();
      if (!description.includes('message is not modified')) {
        console.warn(`Failed to refresh playback progress for chat ${key}`, error);
      }
    }
  }, PROGRESS_UPDATE_INTERVAL_MS);
  timer.unref?.();
  progressUpdaters.set(key, timer);
}

function prepareAssistantJoin(ctx) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (voicePlayer.activeTrack(chatId) || chatCache.getQueueLength(chatId) > 0) return;
  createAssistantInviteLinks(ctx)
    .then((inviteLinks) => voicePlayer.joinChat(chatId, { inviteLinks }))
    .catch((error) => console.warn(`Assistant gagal join awal untuk chat ${chatId}`, error));
}

function cleanupInactiveChatDownloads() {
  for (const { chatId, queue } of chatCache.chats()) {
    if (!queue?.length) continue;
    if (voicePlayer.activeTrack(chatId)) continue;
    cleanupTrackDownloads(queue, { chatId });
  }
}

function markPlayRequest(chatId, userId) {
  recentPlayRequests.set(`${chatId}:${userId}`, Date.now());
}

function getPlayCooldownLeft(chatId, userId) {
  const last = recentPlayRequests.get(`${chatId}:${userId}`) ?? 0;
  return Math.max(0, FREE_PLAY_COOLDOWN_MS - (Date.now() - last));
}

async function queueLimitFor(ctx) {
  const chatId = Number(ctx.chat?.id);
  const userId = Number(ctx.from?.id);
  const [chatPremium, userPremium] = await Promise.all([
    isPremiumActive('chat', chatId),
    isPremiumActive('user', userId),
  ]);
  return chatPremium || userPremium ? PREMIUM_MAX_QUEUE : MAX_QUEUE;
}

async function isPremiumRequester(ctx) {
  const [chatPremium, userPremium] = await Promise.all([
    isPremiumActive('chat', Number(ctx.chat?.id)),
    isPremiumActive('user', Number(ctx.from?.id)),
  ]);
  return chatPremium || userPremium;
}

voicePlayer.onTrackEnd(async ({ chatId, finished, next }) => {
  if (!next) {
    await updatePlaybackPanelsForAdvance(chatId, finished, null, null);
    cleanupTrackDownload(finished, { chatId });
    return;
  }

  try {
    const activeTrack = await startCachedTrack(chatId, next);
    next.startedAt = activeTrack?.startedAt;
    await updatePlaybackPanelsForAdvance(chatId, finished, next, activeTrack);
    cleanupTrackDownload(finished, { chatId });
  } catch (error) {
    const failedNext = chatCache.shift(chatId);
    cleanupTrackDownload(failedNext, { chatId });
    if (chatCache.getQueueLength(chatId) === 0) {
      stopProgressUpdater(chatId);
      voicePlayer.stop(chatId);
    }
    console.warn(`Failed to auto-start next track for chat ${chatId}`, error);
  }
});

function formatError(error) {
  const raw = String(error?.message ?? error ?? 'Unknown error').replace(/\s+/g, ' ').trim();
  const shortened = raw.length > 280 ? `${raw.slice(0, 277)}...` : raw;
  return htmlEscape(shortened);
}


function isVoiceChatInactiveError(error) {
  const message = String(error?.message ?? error).toLowerCase();
  return [
    'no active group call',
    'groupcallnotmodified',
    'voice_adapter_error: the userbot is not in a call',
    'userbot is not in a call',
    'not in a call',
    'voice/video chat grup belum aktif',
    'voice call belum aktif',
  ].some((marker) => message.includes(marker));
}

function playbackHeading(language, state = 'playing', queueLength = 1) {
  if (queueLength > 1) return t(language, 'playback.addedToQueue', { count: queueLength });
  const fromKey = (key, fallback) => {
    const value = t(language, key);
    return value === key ? fallback : value;
  };
  if (state === 'paused') return fromKey('callbacks.paused', 'Paused');
  if (state === 'completed') return fromKey('playback.queueEnded', 'Music finished');
  if (state === 'stopped') return fromKey('callbacks.playbackStopped', 'Music stopped');
  if (state === 'skipped') return fromKey('callbacks.trackSkipped', 'Music skipped');
  return t(language, 'playback.nowPlaying');
}

function formatTrack(language, track, queueLength = 1, state = 'playing') {
  const heading = playbackHeading(language, state, queueLength);
  const preset = track.audioPreset ? `\n<b>Preset:</b> ${htmlEscape(track.audioPreset)}` : '';
  return `<u><b>${heading}</b></u>\n\n<b>${t(language, 'playback.title')}:</b> <a href="${htmlEscape(track.url)}">${htmlEscape(track.name)}</a>\n\n<b>${t(language, 'playback.duration')}:</b> ${secondsToClock(track.duration)}\n<b>${t(language, 'playback.requestedBy')}:</b> ${htmlEscape(track.user)}${preset}`;
}

function captionEditOptions(text, options = {}) {
  const { disable_web_page_preview: _disableWebPagePreview, link_preview_options: _linkPreviewOptions, ...captionOptions } = options;
  return { caption: text, ...captionOptions };
}

async function editStatus(ctx, message, text, options = {}) {
  const safeText = String(text ?? '').trim() || '⚠️ Unable to update status.';
  try {
    return await ctx.api.editMessageText(ctx.chat.id, message.message_id, safeText.slice(0, 4096), options);
  } catch (error) {
    try {
      return await ctx.api.editMessageCaption(ctx.chat.id, message.message_id, captionEditOptions(safeText.slice(0, 1024), options));
    } catch (captionError) {
      throw captionError;
    }
  }
}

function selectedTrackIndex(tracks, index = 0) {
  const total = Math.max(1, tracks.length);
  return Math.max(0, Math.min(Number.parseInt(index, 10) || 0, total - 1));
}

function youtubeThumbnail(track) {
  const value = String(track?.thumbnail ?? '').trim();
  return /^https?:\/\//i.test(value) ? value : '';
}

function formatSearchResult(language, track, index, total) {
  const channel = track.channel || track.channelUrl || '-';
  const lines = [
    `🎵 <b>${t(language, 'playback.chooseTrack')}</b> (${index + 1}/${total})`,
    '',
    `<b>${t(language, 'playback.title')}:</b> ${htmlEscape(track.title ?? track.name)}`,
    `<b>${t(language, 'playback.channel')}:</b> ${htmlEscape(channel)}`,
    `<b>${t(language, 'playback.duration')}:</b> ${secondsToClock(track.duration)}`,
  ];
  if (track.views) lines.push(`<b>${t(language, 'playback.views')}:</b> ${htmlEscape(track.views)}`);
  if (track.uploadAt) lines.push(`<b>${t(language, 'playback.upload')}:</b> ${htmlEscape(track.uploadAt)}`);
  lines.push(`<b>${t(language, 'playback.url')}:</b> <a href="${htmlEscape(track.url)}">${htmlEscape(track.url)}</a>`);
  return lines.join('\n');
}

function formatYouTubeSelection(language, tracks, index = 0) {
  const safeIndex = selectedTrackIndex(tracks, index);
  return formatSearchResult(language, tracks[safeIndex], safeIndex, tracks.length);
}

async function sendSelectionPhoto(ctx, statusMessage, thumbnail, caption) {
  try {
    const message = await ctx.replyWithPhoto(thumbnail, { caption, parse_mode: 'HTML' });
    await ctx.api.deleteMessage(ctx.chat.id, statusMessage.message_id).catch(() => {});
    return message;
  } catch (error) {
    console.warn('Failed to send YouTube thumbnail photo, falling back to text selection:', error.message);
    return statusMessage;
  }
}

async function sendPlaybackPhoto(ctx, statusMessage, track, caption, options = {}) {
  const thumbnail = youtubeThumbnail(track);
  if (!thumbnail) return null;
  try {
    const message = await ctx.replyWithPhoto(thumbnail, { caption, parse_mode: 'HTML', ...captionEditOptions(caption, options) });
    await ctx.api.deleteMessage(ctx.chat.id, statusMessage.message_id).catch(() => {});
    return message;
  } catch (error) {
    console.warn('Failed to send playback thumbnail photo, falling back to status edit:', error.message);
    return null;
  }
}

async function showYouTubeSelection(ctx, statusMessage, tracks, isVideo, language, index = 0) {
  const safeIndex = selectedTrackIndex(tracks, index);
  const caption = formatYouTubeSelection(language, tracks, safeIndex);
  const thumbnail = youtubeThumbnail(tracks[safeIndex]);
  const selectionMessage = thumbnail
    ? await sendSelectionPhoto(ctx, statusMessage, thumbnail, caption)
    : statusMessage;
  const hasPhoto = selectionMessage.message_id !== statusMessage.message_id && Boolean(thumbnail);

  chatCache.setYouTubeSelection(ctx.chat.id, selectionMessage.message_id, {
    tracks,
    userId: ctx.from?.id,
    isVideo,
    language,
    hasPhoto,
  });

  if (hasPhoto) {
    await ctx.api.editMessageCaption(ctx.chat.id, selectionMessage.message_id, {
      caption,
      parse_mode: 'HTML',
      reply_markup: youtubeSelectionKeyboard(selectionMessage.message_id, tracks, safeIndex),
    });
    return;
  }

  await editStatus(ctx, selectionMessage, caption, {
    parse_mode: 'HTML',
    reply_markup: youtubeSelectionKeyboard(selectionMessage.message_id, tracks, safeIndex),
    disable_web_page_preview: true,
  });
}

async function queueAndMaybePlay(ctx, statusMessage, track, isVideo, language) {
  const chatId = ctx.chat.id;
  const saveTrack = { ...track, user: firstName(ctx), userId: ctx.from?.id, isVideo, filePath: '', platform: track.platform ?? config.defaultService };
  const premiumSettings = await getPremiumSettings(chatId);
  saveTrack.audioPreset = premiumSettings.audioPreset;
  if (chatCache.getTrackIfExists(chatId, saveTrack.trackId)) {
    await editStatus(ctx, statusMessage, t(language, 'playback.duplicate'));
    return;
  }
  const premiumRequester = await isPremiumRequester(ctx);
  const length = premiumRequester && chatCache.getQueueLength(chatId) > 0
    ? chatCache.addSongAt(chatId, saveTrack, 1)
    : chatCache.addSong(chatId, saveTrack);
  if (length > 1) {
    preloadTrack(saveTrack, isVideo, { chatId });
    const queueCaption = formatTrack(language, saveTrack, length);
    const queueMessage = await sendPlaybackPhoto(ctx, statusMessage, saveTrack, queueCaption, { disable_web_page_preview: true })
      ?? await editStatus(ctx, statusMessage, queueCaption, { parse_mode: 'HTML', disable_web_page_preview: true });
    rememberPlaybackPanel(ctx, queueMessage ?? statusMessage, language, saveTrack);
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
    const activeTrack = await startQueuedTrack(ctx, saveTrack, isVideo);
    saveTrack.startedAt = activeTrack?.startedAt;
  } catch (error) {
    chatCache.shift(chatId);
    if (isVoiceChatInactiveError(error)) {
      await editStatus(ctx, statusMessage, t(language, 'playback.voiceChatInactiveWarning'));
      return;
    }
    await editStatus(ctx, statusMessage, t(language, 'playback.voiceFailed', { error: formatError(error) }));
    return;
  }
  const playbackMessage = await editStatus(ctx, statusMessage, formatTrack(language, saveTrack), { parse_mode: 'HTML', reply_markup: controlKeyboard(language, '', saveTrack), disable_web_page_preview: true });
  rememberPlaybackPanel(ctx, playbackMessage ?? statusMessage, language, saveTrack);
  startProgressUpdater(ctx, playbackMessage ?? statusMessage, language);
}

async function processPlayRequest(ctx, status, input, isVideo, language) {
  const chatId = ctx.chat.id;
  const queueLimit = await queueLimitFor(ctx);
  if (chatCache.getQueueLength(chatId) >= queueLimit) {
    await editStatus(ctx, status, t(language, 'playback.queueFull', { max: queueLimit }));
    return;
  }

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
    const remaining = queueLimit - chatCache.getQueueLength(chatId);
    const tracks = playlist.songs.slice(0, remaining).map((track) => ({ ...track, user: firstName(ctx), userId: ctx.from?.id, isVideo, filePath: track.filePath ?? '', platform: track.platform ?? config.defaultService }));
    if (tracks.length === 0) {
      await editStatus(ctx, status, t(language, 'playback.queueFull', { max: queueLimit }));
      return;
    }
    const queueWasEmpty = chatCache.getQueueLength(chatId) === 0;
    const length = chatCache.addSongs(chatId, tracks);
    preloadTracks(queueWasEmpty ? tracks.slice(1) : tracks, { chatId });
    await editStatus(ctx, status, t(language, 'playback.addedPlaylistTracks', { count: tracks.length, length }));
    if (queueWasEmpty) {
      try {
        const activeTrack = await startQueuedTrack(ctx, tracks[0], isVideo);
        tracks[0].startedAt = activeTrack?.startedAt;
        const playbackMessage = await editStatus(ctx, status, formatTrack(language, tracks[0]), { parse_mode: 'HTML', reply_markup: controlKeyboard(language, '', tracks[0]), disable_web_page_preview: true });
        rememberPlaybackPanel(ctx, playbackMessage ?? status, language, tracks[0]);
        startProgressUpdater(ctx, playbackMessage ?? status, language);
      } catch (error) {
        chatCache.shift(chatId);
        if (isVoiceChatInactiveError(error)) {
          await ctx.reply(t(language, 'playback.voiceChatInactiveWarning'));
          return;
        }
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

export async function playHandler(ctx, isVideo = false) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await playMode(ctx))) return;
  const chatId = ctx.chat.id;
  const premiumSettings = await getPremiumSettings(chatId);
  if (premiumSettings.djMode) {
    const isOwner = Number(ctx.from?.id) === Number(config.ownerId) || config.devs.includes(Number(ctx.from?.id));
    const auth = await isAuthUser(chatId, ctx.from?.id);
    if (!isOwner && !auth) {
      await ctx.reply('DJ mode is enabled: only owner/dev/auth users can add tracks.');
      return;
    }
  }
  const premiumRequester = await isPremiumRequester(ctx);
  if (!premiumRequester) {
    const cooldownLeft = getPlayCooldownLeft(chatId, ctx.from?.id);
    if (cooldownLeft > 0) {
      await ctx.reply(`Please wait ${Math.ceil(cooldownLeft / 1000)}s before sending another /play request.`);
      return;
    }
  }
  const queueLimit = await queueLimitFor(ctx);
  if (chatCache.getQueueLength(chatId) >= queueLimit) {
    await ctx.reply(t(language, 'playback.queueFull', { max: queueLimit }));
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
  cleanupInactiveChatDownloads();
  markPlayRequest(chatId, ctx.from?.id);
  const status = await ctx.reply(input.startsWith('tgpl_') ? t(language, 'playback.searchingPlaylist') : t(language, 'playback.searchingDownload'));
  prepareAssistantJoin(ctx);
  enqueueChatTask(chatId, 'Proses /play', () => processPlayRequest(ctx, status, input, isVideo, language));
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
  const queuedNext = chatCache.getQueue(ctx.chat.id)[1] ?? null;
  try {
    if (queuedNext) await ensureDownloaded(queuedNext, queuedNext.isVideo);
  } catch (error) {
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error) }));
    return;
  }

  const { skipped, next, activeTrack: reusedTrack } = await voicePlayer.skip(ctx.chat.id, { reuseActive: true });
  if (!skipped) {
    await ctx.reply(t(language, 'playback.nothingPlaying'));
    return;
  }
  if (!next) {
    await updatePlaybackPanelsForAdvance(ctx.chat.id, skipped, null, null);
    await markPlaybackPanelStatus(ctx.chat.id, skipped, 'skipped').catch(() => {});
    cleanupTrackDownload(skipped, { chatId: ctx.chat.id });
    await ctx.reply(t(language, 'playback.skippedEnded', { skipped: skipped.name }));
    return;
  }
  try {
    const activeTrack = reusedTrack ?? await startQueuedTrack(ctx, next, next.isVideo);
    await updatePlaybackPanelsForAdvance(ctx.chat.id, skipped, next, activeTrack);
    cleanupTrackDownload(skipped, { chatId: ctx.chat.id });
    await ctx.reply(t(language, 'playback.skippedNow', { skipped: skipped.name, next: next.name }));
  } catch (error) {
    const failedNext = chatCache.shift(ctx.chat.id);
    cleanupTrackDownload(failedNext, { chatId: ctx.chat.id });
    if (isVoiceChatInactiveError(error)) {
      await ctx.reply(t(language, 'playback.voiceChatInactiveWarning'));
      return;
    }
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error) }));
  }
}

export async function stopHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const queue = chatCache.getQueue(ctx.chat.id);
  const queuedCurrent = queue[0] ?? null;
  const queuedNext = queue[1] ?? null;
  const currentRequester = requesterKey(queuedCurrent);
  const nextRequester = requesterKey(queuedNext);
  try {
    if (queuedNext && currentRequester && nextRequester && currentRequester !== nextRequester) await ensureDownloaded(queuedNext, queuedNext.isVideo);
  } catch (error) {
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error) }));
    return;
  }

  const { stopped, next, activeTrack: reusedTrack, cleared } = await voicePlayer.stopOrAdvance(ctx.chat.id, { reuseActive: true });
  if (cleared || !next) {
    stopProgressUpdater(ctx.chat.id);
    cleanupTrackDownloads(queue, { chatId: ctx.chat.id });
    if (queuedCurrent ?? stopped) await markPlaybackPanelStatus(ctx.chat.id, queuedCurrent ?? stopped, 'stopped').catch(() => {});
    await ctx.reply(t(language, 'playback.stopped'));
    return;
  }

  try {
    const activeTrack = reusedTrack ?? await startQueuedTrack(ctx, next, next.isVideo);
    await updatePlaybackPanelsForAdvance(ctx.chat.id, stopped, next, activeTrack);
    cleanupTrackDownload(stopped, { chatId: ctx.chat.id });
    await ctx.reply(t(language, 'playback.skippedNow', { skipped: stopped.name, next: next.name }));
  } catch (error) {
    const failedNext = chatCache.shift(ctx.chat.id);
    cleanupTrackDownload(failedNext, { chatId: ctx.chat.id });
    if (isVoiceChatInactiveError(error)) {
      await ctx.reply(t(language, 'playback.voiceChatInactiveWarning'));
      return;
    }
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error) }));
  }
}

export async function pauseHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const current = chatCache.current(ctx.chat.id);
  await voicePlayer.pause(ctx.chat.id);
  if (current) await markPlaybackPanelStatus(ctx.chat.id, current, 'paused', current);
  await ctx.reply(t(language, 'playback.paused'));
}

export async function resumeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const current = chatCache.current(ctx.chat.id);
  await voicePlayer.resume(ctx.chat.id);
  if (current) await markPlaybackPanelStatus(ctx.chat.id, current, 'playing', current);
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
  if (removed) cleanupTrackDownload(removed, { chatId: ctx.chat.id });
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
  const index = selectedTrackIndex(selection.tracks, pageText);
  const track = selection.tracks[index];
  const caption = formatYouTubeSelection(selection.language, selection.tracks, index);
  const replyMarkup = youtubeSelectionKeyboard(messageId, selection.tracks, index);
  await ctx.answerCallbackQuery().catch(() => {});

  if (selection.hasPhoto) {
    const thumbnail = youtubeThumbnail(track);
    if (thumbnail) {
      try {
        await ctx.editMessageMedia({ type: 'photo', media: thumbnail, caption, parse_mode: 'HTML' }, { reply_markup: replyMarkup });
        return;
      } catch (error) {
        console.warn('Failed to update YouTube selection thumbnail, falling back to caption edit:', error.message);
      }
    }
    await ctx.editMessageCaption({ caption, parse_mode: 'HTML', reply_markup: replyMarkup });
    return;
  }

  await ctx.editMessageText(caption, {
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
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
  const queueLimit = await queueLimitFor(ctx);
  if (chatCache.getQueueLength(ctx.chat.id) >= queueLimit) {
    await ctx.answerCallbackQuery({ text: t(selection.language, 'playback.queueFull', { max: queueLimit }) }).catch(() => {});
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
  enqueueChatTask(ctx.chat.id, 'Proses pilihan YouTube', () => queueAndMaybePlay(ctx, statusMessage, track, Boolean(selection.isVideo), selection.language));
}
